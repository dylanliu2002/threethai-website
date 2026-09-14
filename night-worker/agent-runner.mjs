import { assertNoSecretsDeep, redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import {
  IMPLEMENTATION_MODEL_NAME,
  IMPLEMENTATION_REASONING_EFFORT,
  MVP_CONFIG,
} from "./config.mjs";
import {
  assertNoWorkerAuthority,
  implementationPolicyForWorktree,
} from "./model-policy.mjs";
import {
  validateTaskPlan,
  validateTaskPlans,
  workerSafePlan,
} from "./schemas.mjs";
import {
  assertCanonicalIsolatedWorktree,
} from "./worktrees.mjs";
import { RuntimeStore } from "./runtime-store.mjs";
import { defaultRuntimeStorePath } from "./submission.mjs";
import { ThreadBroker } from "./thread-broker.mjs";

const INTERNAL_WORKER_AUTHORITY = Object.freeze({
  branch: true,
  commit: true,
  push: false,
  pr: false,
  review: false,
  merge: false,
  publishing_credentials: false,
  production: false,
  deployment: false,
  dns: false,
  secrets: false,
});

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function planTask(batch, plan) {
  const task = batch.tasks?.find((entry) => entry.task_id === plan.task_id);
  if (!task) throw new Error(`Task plan is not part of submitted batch: ${plan.task_id}`);
  return task;
}

function childBatch(batch, plan) {
  const task = planTask(batch, plan);
  return {
    ...clone(batch),
    repository_root: plan.worktree,
    state: "QUEUED",
    claim: null,
    queue_sequence: null,
    tasks: [{ ...task }],
    reply_metadata: null,
  };
}

function assertChildStoreIdentity(workerStore, batch, plan) {
  const stored = workerStore.getBatch(batch.batch_id);
  if (!stored) return null;
  if (stored.submission_id !== batch.submission_id || stored.repository_root !== plan.worktree
    || stored.tasks.length !== 1 || stored.tasks[0].task_id !== plan.task_id) {
    throw new Error("Task worker runtime store is bound to a different submitted task.");
  }
  return stored;
}

export function createWorkerRuntimeStore({ store, batch, plan } = {}) {
  if (!(store instanceof RuntimeStore)) throw new Error("Worker execution requires the real Task 61 RuntimeStore.");
  const runtimePath = defaultRuntimeStorePath(plan.worktree);
  const workerStore = new RuntimeStore(runtimePath, { clock: store.clock });
  const existing = assertChildStoreIdentity(workerStore, batch, plan);
  if (!existing) {
    if (workerStore.listBatches().length > 0) {
      throw new Error("Task worker runtime store contains an unrelated submitted batch.");
    }
    workerStore.enqueueBatch(childBatch(batch, plan));
  }
  const durableMapping = store.getWorkerMapping(batch.batch_id, plan.task_id, "IMPLEMENTATION");
  const childMapping = workerStore.getWorkerMapping(batch.batch_id, plan.task_id, "IMPLEMENTATION");
  if (durableMapping && !childMapping) {
    workerStore.putWorkerMapping({
      ...clone(durableMapping),
      cwd: plan.worktree,
    });
  }
  return workerStore;
}

function buildWorkerPrompt(batch, plan) {
  const safe = workerSafePlan(plan);
  const prompt = [
    "You are an implementation worker for one bounded Night Worker task.",
    "Work only in the supplied isolated Git worktree and only within the declared allowlist.",
    "The originating submission and batch are durable identifiers; do not change them.",
    "Publishing credentials and push, PR, review, merge, deployment, DNS, production, and secret authority are unavailable.",
    "Do not use subagents, codex exec, Terra, or model/provider fallback.",
    "Implement the task, satisfy every acceptance criterion, and run every declared validation command.",
    "",
    JSON.stringify(safe, null, 2),
  ].join("\n");
  assertNoSecretsDeep(prompt, "implementation worker prompt");
  return prompt;
}

function assertReturnedMapping(mapping, batch, plan) {
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
    throw new Error("Task Broker did not return a durable worker mapping.");
  }
  if (mapping.batch_id !== batch.batch_id || mapping.submission_id !== batch.submission_id
    || mapping.task_id !== plan.task_id || mapping.role !== "IMPLEMENTATION") {
    throw new Error("Task Broker returned a worker mapping with the wrong durable identity.");
  }
  if (mapping.model !== IMPLEMENTATION_MODEL_NAME || mapping.effort !== IMPLEMENTATION_REASONING_EFFORT) {
    throw new Error("Task Broker returned a non-exact implementation model policy.");
  }
  if (mapping.cwd !== plan.worktree || typeof mapping.thread_id !== "string" || mapping.thread_id.length === 0) {
    throw new Error("Task Broker returned a worker mapping with the wrong cwd or missing thread.");
  }
  if (!["TURN_STARTED", "COMPLETED"].includes(mapping.lifecycle_state) || !mapping.turn_id) {
    throw new Error("Task Broker returned an incomplete durable thread/turn mapping.");
  }
  return mapping;
}

async function resolveBroker({ broker, brokerFactory, client, workerStore, batch, plan }) {
  if (broker !== undefined && broker !== null) return broker;
  if (typeof brokerFactory === "function") {
    return brokerFactory({ store: workerStore, batch, plan, client });
  }
  if (client) return new ThreadBroker({ client, store: workerStore });
  throw new Error("Implementation execution requires the real typed Task 61 ThreadBroker.");
}

export async function dispatchImplementation({
  store,
  batch,
  plan,
  broker,
  brokerFactory,
  client,
  signal,
} = {}) {
  if (!(store instanceof RuntimeStore)) throw new Error("Implementation execution requires the real Task 61 RuntimeStore.");
  if (!batch || typeof batch !== "object" || Array.isArray(batch)) throw new Error("An explicit submitted batch is required.");
  const normalizedPlan = validateTaskPlan(plan, { batch, requireReady: true });
  const policy = implementationPolicyForWorktree(normalizedPlan.worktree);
  assertNoWorkerAuthority(INTERNAL_WORKER_AUTHORITY);
  if (signal?.aborted) throw new Error("Implementation worker was cancelled before dispatch.");
  const task = planTask(batch, normalizedPlan);
  assertCanonicalIsolatedWorktree({
    repositoryRoot: batch.repository_root,
    worktree: normalizedPlan.worktree,
    branch: normalizedPlan.branch,
  });
  const workerStore = createWorkerRuntimeStore({ store, batch, plan: normalizedPlan });
  const selectedBroker = await resolveBroker({ broker, brokerFactory, client, workerStore, batch, plan: normalizedPlan });
  if (!selectedBroker || typeof selectedBroker.startImplementation !== "function") {
    throw new Error("Implementation execution requires the typed ThreadBroker startImplementation lifecycle.");
  }
  // The typed broker derives model, effort, sandbox, and no-fallback policy.
  // Deliberately pass only its supported task identity, cwd, and prompt fields.
  const started = await selectedBroker.startImplementation({
    batchId: batch.batch_id,
    taskId: task.task_id,
    cwd: normalizedPlan.worktree,
    prompt: buildWorkerPrompt(batch, normalizedPlan),
  });
  const mapping = assertReturnedMapping(started?.mapping, batch, normalizedPlan);
  const durable = store.putWorkerMapping(mapping);
  return {
    status: "DISPATCHED",
    batch_id: batch.batch_id,
    submission_id: batch.submission_id,
    task_id: task.task_id,
    plan: normalizedPlan,
    policy,
    mapping: durable,
    // This field is telemetry only. Validation never consumes it for scope.
    reported_changed_files: Array.isArray(started?.changed_files)
      ? started.changed_files.map((value) => String(value))
      : [],
    worker_result: sanitizeForLog(started?.worker_result ?? null),
  };
}

function literalPrefix(pattern) {
  return pattern.split("*")[0].replace(/\/$/, "");
}

function scopePatternsOverlap(left, right) {
  const leftBase = literalPrefix(left);
  const rightBase = literalPrefix(right);
  if (left === right) return true;
  if (left.startsWith("**") || right.startsWith("**")) return true;
  if (left.endsWith("/**")) {
    const prefix = left.slice(0, -3);
    if (right === prefix || right.startsWith(`${prefix}/`)) return true;
  }
  if (right.endsWith("/**")) {
    const prefix = right.slice(0, -3);
    if (left === prefix || left.startsWith(`${prefix}/`)) return true;
  }
  if (leftBase && rightBase && (leftBase.startsWith(`${rightBase}/`) || rightBase.startsWith(`${leftBase}/`))) return true;
  return false;
}

export function plansOverlap(left, right) {
  return left.allowlist.some((leftPath) => right.allowlist.some((rightPath) => scopePatternsOverlap(leftPath, rightPath)));
}

function assertNoOverlaps(plans) {
  for (let left = 0; left < plans.length; left += 1) {
    for (let right = left + 1; right < plans.length; right += 1) {
      if (plansOverlap(plans[left], plans[right])) {
        throw new Error(`Task plan file scopes overlap: ${plans[left].task_id} and ${plans[right].task_id}`);
      }
    }
  }
}

export async function runReadyPlans(plans, runner, {
  maxParallel = MVP_CONFIG.max_parallel_implementation_workers,
  overlapPolicy = "serialize",
} = {}) {
  if (typeof runner !== "function") throw new Error("A task plan runner is required.");
  const normalized = validateTaskPlans(plans, { requireReady: true });
  const batchIds = new Set(normalized.map((plan) => plan.batch_id));
  const submissionIds = new Set(normalized.map((plan) => plan.submission_id));
  if (batchIds.size !== 1 || submissionIds.size !== 1) {
    throw new Error("A ready execution set must belong to one submitted batch and submission.");
  }
  if (!Number.isInteger(maxParallel) || maxParallel < 1
    || maxParallel > MVP_CONFIG.max_parallel_implementation_workers) {
    throw new Error("Task plan parallelism exceeds the fixed Night Worker limit.");
  }
  if (!["serialize", "reject"].includes(overlapPolicy)) throw new Error("Unsupported task plan overlap policy.");
  if (overlapPolicy === "reject") assertNoOverlaps(normalized);

  const pending = [...normalized];
  const active = [];
  const completed = new Map();
  while (pending.length > 0 || active.length > 0) {
    let startedOne = true;
    while (startedOne && active.length < maxParallel && pending.length > 0) {
      startedOne = false;
      const candidateIndex = pending.findIndex((plan) => !active.some((entry) => plansOverlap(entry.plan, plan)));
      if (candidateIndex >= 0) {
        const [plan] = pending.splice(candidateIndex, 1);
        const entry = {
          plan,
          promise: Promise.resolve()
            .then(() => runner(plan))
            .then(
              (result) => ({ status: "FULFILLED", result }),
              (error) => ({ status: "REJECTED", error }),
            ),
        };
        active.push(entry);
        startedOne = true;
      }
    }
    if (active.length === 0) {
      if (pending.length > 0) throw new Error("Task plan scheduler could not make progress.");
      continue;
    }
    if (pending.length > 0 && active.length < maxParallel) {
      const hasRunnable = pending.some((plan) => !active.some((entry) => plansOverlap(entry.plan, plan)));
      if (hasRunnable) continue;
    }
    const settled = await Promise.race(active.map((entry) => entry.promise.then((value) => ({ entry, value }))));
    const index = active.indexOf(settled.entry);
    if (index >= 0) active.splice(index, 1);
    if (settled.value.status === "FULFILLED") {
      completed.set(settled.entry.plan.task_id, {
        plan: settled.entry.plan,
        status: "COMPLETED",
        result: settled.value.result,
      });
    } else {
      completed.set(settled.entry.plan.task_id, {
        plan: settled.entry.plan,
        status: "FAILED",
        error: redactSecrets(settled.value.error instanceof Error ? settled.value.error.message : String(settled.value.error)),
      });
    }
  }
  return normalized.map((plan) => completed.get(plan.task_id));
}

export class AgentRunner {
  constructor(options = {}) {
    if (!(options.store instanceof RuntimeStore)) throw new Error("AgentRunner requires the real Task 61 RuntimeStore.");
    this.options = { ...options };
  }

  run(plan, batch = this.options.batch, options = {}) {
    return dispatchImplementation({ ...this.options, ...options, plan, batch });
  }

  runReady(plans, batch = this.options.batch, options = {}) {
    return runReadyPlans(plans, (plan) => this.run(plan, batch, options), options);
  }
}

export const createAgentRunner = (options) => new AgentRunner(options);
export const runImplementation = dispatchImplementation;
export const dispatchImplementationUnit = dispatchImplementation;
export const executeReadyPlans = runReadyPlans;

export { INTERNAL_WORKER_AUTHORITY };
