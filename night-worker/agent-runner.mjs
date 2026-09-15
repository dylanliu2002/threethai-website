import path from "node:path";
import { assertNoSecretsDeep, redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { IMPLEMENTATION_MODEL_NAME, IMPLEMENTATION_REASONING_EFFORT, MVP_CONFIG, timestampFrom } from "./config.mjs";
import { assertNoWorkerAuthority } from "./model-policy.mjs";
import {
  scopePatternMatches,
  validateTaskPlan,
  validateTaskPlans,
  workerSafePlan,
} from "./schemas.mjs";
import { assertCanonicalIsolatedWorktree } from "./worktrees.mjs";
import { RuntimeStore } from "./runtime-store.mjs";
import { defaultRuntimeStorePath } from "./submission.mjs";
import { ThreadBroker } from "./thread-broker.mjs";
import { AppServerClient, isGenuineAppServerClient } from "./app-server-client.mjs";
import { assertSafeValidationCommands } from "./validation.mjs";

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

const WORKER_COMPLETION_POLL_MS = 250;
const WORKER_COMPLETION_TIMEOUT_MS = MVP_CONFIG.batch_expiry_ms;
const TERMINAL_SUCCESS_STATES = new Set(["complete", "completed", "succeeded", "success", "done"]);
const TERMINAL_FAILURE_STATES = new Set(["failed", "failure", "error", "errored", "cancelled", "canceled", "aborted", "rejected", "interrupted"]);
const BASE_THREAD_BROKER_START_IMPLEMENTATION = ThreadBroker.prototype.startImplementation;
const BASE_THREAD_BROKER_READ_WORKER = ThreadBroker.prototype.readWorker;

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function samePath(left, right) {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return path.relative(a, b) === "" && path.relative(b, a) === "";
}

function assertRunnerOptions(options, allowed, label) {
  for (const key of Object.keys(options ?? {})) {
    if (!allowed.has(key)) throw new Error(`${label} cannot accept caller override: ${key}`);
  }
}

function assertCanonicalSharedStore(store, batch) {
  const expected = defaultRuntimeStorePath(batch.repository_root);
  if (!samePath(expected, store.filePath)) {
    throw new Error("Worker execution requires the canonical shared batch RuntimeStore.");
  }
}

function durableBatch(store, batchId) {
  if (!(store instanceof RuntimeStore)) throw new Error("Implementation execution requires the real Task 61 RuntimeStore.");
  if (typeof batchId !== "string" || batchId.trim().length === 0 || batchId.includes("\0")) {
    throw new Error("Implementation execution requires an explicit submitted batch ID.");
  }
  const batch = store.getBatch(batchId.trim());
  if (!batch || batch.batch_id !== batchId.trim()) {
    throw new Error(`Cannot execute without an explicit submitted batch: ${batchId}`);
  }
  assertCanonicalSharedStore(store, batch);
  if (!["QUEUED", "CLAIMED", "RUNNING"].includes(batch.state)) {
    throw new Error(`Batch is not eligible for execution: ${batch.state}`);
  }
  assertNoSecretsDeep(batch, "submitted batch");
  return batch;
}

function assertProductionAppServerClient(client) {
  if (!(client instanceof AppServerClient) || !isGenuineAppServerClient(client)) {
    throw new Error("Implementation execution requires a genuine constructed Task 61 App Server client.");
  }
}

function planTask(batch, plan) {
  const task = batch.tasks?.find((entry) => entry.task_id === plan.task_id);
  if (!task) throw new Error(`Task plan is not part of submitted batch: ${plan.task_id}`);
  return task;
}

class TaskWorktreeRuntimeStoreView extends RuntimeStore {
  constructor(sharedStore, batchId, worktree) {
    super(sharedStore.filePath, { clock: sharedStore.clock });
    this.task_batch_id = batchId;
    this.task_worktree = defaultRuntimeStorePath(worktree);
  }

  get filePath() {
    return this.task_worktree;
  }

  getBatch(batchId) {
    const batch = super.getBatch(batchId);
    if (!batch || batch.batch_id !== this.task_batch_id) return batch;
    return { ...batch, repository_root: path.dirname(path.dirname(this.task_worktree)) };
  }
}

export function createWorkerRuntimeStore({ store, batch, plan } = {}) {
  if (!(store instanceof RuntimeStore)) throw new Error("Worker execution requires the real Task 61 RuntimeStore.");
  if (!batch || typeof batch !== "object" || Array.isArray(batch)) throw new Error("An explicit submitted batch is required.");
  const normalizedPlan = validateTaskPlan(plan, { batch, requireReady: true });
  assertCanonicalSharedStore(store, batch);
  const verified = assertCanonicalIsolatedWorktree({
    repositoryRoot: batch.repository_root,
    worktree: normalizedPlan.worktree,
    branch: normalizedPlan.branch,
  });
  if (normalizedPlan.worktree !== verified.worktree) {
    throw new Error("Worker task plan must use the exact canonical worktree path.");
  }
  return new TaskWorktreeRuntimeStoreView(store, batch.batch_id, normalizedPlan.worktree);
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
    JSON.stringify({ ...safe, batch_id: batch.batch_id, submission_id: batch.submission_id }, null, 2),
  ].join("\n");
  assertNoSecretsDeep(prompt, "implementation worker prompt");
  return prompt;
}

function mappingFromStartResult(started) {
  if (started?.mapping && typeof started.mapping === "object" && !Array.isArray(started.mapping)) {
    return { mapping: started.mapping, worker_result: started.worker_result, reported_changed_files: started.changed_files };
  }
  if (started && typeof started === "object" && !Array.isArray(started) && typeof started.thread_id === "string") {
    return { mapping: started, worker_result: null, reported_changed_files: started.changed_files };
  }
  throw new Error("Task Broker did not return a durable worker mapping.");
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
  if (mapping.lifecycle_state === "FAILED") {
    throw new Error("Implementation worker returned a failed durable lifecycle state.");
  }
  if (!["TURN_STARTED", "COMPLETED"].includes(mapping.lifecycle_state) || !mapping.turn_id) {
    throw new Error("Task Broker returned an incomplete durable thread/turn mapping.");
  }
  return mapping;
}

function readTurns(response) {
  const turns = response?.thread?.turns ?? response?.turns ?? [];
  if (!Array.isArray(turns)) throw new Error("App Server thread/read returned invalid turns.");
  return turns;
}

function turnFromRead(response, turnId) {
  const candidates = [...readTurns(response), ...(response?.turn ? [response.turn] : [])];
  const matching = candidates.filter((turn) => turn && typeof turn === "object" && turn.id === turnId);
  if (matching.length > 1) throw new Error("App Server thread/read returned duplicate durable turn IDs.");
  if (matching.length === 0) throw new Error(`App Server thread/read did not return durable turn ${turnId}.`);
  return matching[0];
}

function turnStatus(turn) {
  const value = turn?.status ?? turn?.state ?? turn?.lifecycle_state ?? turn?.lifecycleState;
  if (typeof value !== "string") return "PENDING";
  const normalized = value.replace(/[_-]/g, "").toLocaleLowerCase("en-US");
  if (TERMINAL_SUCCESS_STATES.has(normalized)) return "SUCCEEDED";
  if (TERMINAL_FAILURE_STATES.has(normalized)) return "FAILED";
  return "PENDING";
}

function waitForPoll(signal) {
  if (signal?.aborted) return Promise.reject(new Error("Implementation worker was cancelled."));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, WORKER_COMPLETION_POLL_MS);
    function abort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new Error("Implementation worker was cancelled."));
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

async function awaitImplementationCompletion({ store, broker, batch, plan, mapping, signal }) {
  if (mapping.lifecycle_state === "COMPLETED") return { mapping, turn: { id: mapping.turn_id, status: "completed" } };
  const deadline = Date.now() + WORKER_COMPLETION_TIMEOUT_MS;
  while (Date.now() <= deadline) {
    if (signal?.aborted) throw new Error("Implementation worker was cancelled while running.");
    const response = await Reflect.apply(BASE_THREAD_BROKER_READ_WORKER, broker, [{
      batchId: batch.batch_id,
      taskId: plan.task_id,
      role: "IMPLEMENTATION",
    }]);
    const turn = turnFromRead(response, mapping.turn_id);
    const status = turnStatus(turn);
    if (status === "SUCCEEDED") {
      const updated = store.patchWorkerMapping(batch.batch_id, plan.task_id, "IMPLEMENTATION", {
        lifecycle_state: "COMPLETED",
        turn_id: mapping.turn_id,
        updated_at: timestampFrom(Date),
      });
      return { mapping: updated, turn: sanitizeForLog(turn), read: sanitizeForLog(response) };
    }
    if (status === "FAILED") {
      store.patchWorkerMapping(batch.batch_id, plan.task_id, "IMPLEMENTATION", {
        lifecycle_state: "FAILED",
        turn_id: mapping.turn_id,
        updated_at: timestampFrom(Date),
      });
      throw new Error(`Implementation worker turn ${mapping.turn_id} ended unsuccessfully.`);
    }
    await waitForPoll(signal);
  }
  throw new Error(`Implementation worker turn ${mapping.turn_id} did not reach a terminal state before the fixed timeout.`);
}

export async function dispatchImplementation(options = {}) {
  assertRunnerOptions(options, new Set(["store", "batchId", "plan", "client", "signal"]), "Implementation dispatch");
  const { store, batchId, plan, client, signal } = options;
  const batch = durableBatch(store, batchId);
  const normalizedPlan = validateTaskPlan(plan, { batch, requireReady: true });
  assertSafeValidationCommands(normalizedPlan.validation_commands, { allowlist: normalizedPlan.allowlist });
  assertProductionAppServerClient(client);
  const existingMapping = store.getWorkerMapping(batch.batch_id, normalizedPlan.task_id, "IMPLEMENTATION");
  if (existingMapping && existingMapping.cwd !== normalizedPlan.worktree) {
    throw new Error("Existing worker mapping cwd cannot be replaced by a task plan.");
  }
  assertNoWorkerAuthority(INTERNAL_WORKER_AUTHORITY);
  if (signal?.aborted) throw new Error("Implementation worker was cancelled before dispatch.");
  planTask(batch, normalizedPlan);
  const verifiedWorktree = assertCanonicalIsolatedWorktree({
    repositoryRoot: batch.repository_root,
    worktree: normalizedPlan.worktree,
    branch: normalizedPlan.branch,
  });
  if (normalizedPlan.worktree !== verifiedWorktree.worktree) {
    throw new Error("Implementation dispatch requires the exact canonical task worktree path.");
  }
  const workerStore = createWorkerRuntimeStore({ store, batch, plan: normalizedPlan });
  const broker = new ThreadBroker({ client, store: workerStore });
  const startedRaw = await Reflect.apply(BASE_THREAD_BROKER_START_IMPLEMENTATION, broker, [{
    batchId: batch.batch_id,
    taskId: normalizedPlan.task_id,
    cwd: normalizedPlan.worktree,
    prompt: buildWorkerPrompt(batch, normalizedPlan),
  }]);
  const started = mappingFromStartResult(startedRaw);
  const mapping = assertReturnedMapping(started.mapping, batch, normalizedPlan);
  const durable = store.getWorkerMapping(batch.batch_id, normalizedPlan.task_id, "IMPLEMENTATION");
  if (!durable || durable.thread_id !== mapping.thread_id || durable.cwd !== normalizedPlan.worktree) {
    throw new Error("Task Broker did not durably persist the exact worker mapping in the shared batch RuntimeStore.");
  }
  const completed = await awaitImplementationCompletion({
    store,
    broker,
    batch,
    plan: normalizedPlan,
    mapping: durable,
    signal,
  });
  return {
    status: "COMPLETED",
    batch_id: batch.batch_id,
    submission_id: batch.submission_id,
    task_id: normalizedPlan.task_id,
    plan: normalizedPlan,
    mapping: completed.mapping,
    reported_changed_files: Array.isArray(started.reported_changed_files)
      ? started.reported_changed_files.map((value) => String(value))
      : [],
    worker_result: sanitizeForLog(started.worker_result ?? completed.read ?? null),
  };
}

function exactScopePattern(pattern) {
  return !/[?*]/.test(pattern);
}

function scopePatternsOverlap(left, right) {
  const leftPattern = String(left).toLocaleLowerCase("en-US");
  const rightPattern = String(right).toLocaleLowerCase("en-US");
  if (exactScopePattern(leftPattern) && exactScopePattern(rightPattern)) return leftPattern === rightPattern;
  if (exactScopePattern(leftPattern)) return scopePatternMatches(rightPattern, leftPattern);
  if (exactScopePattern(rightPattern)) return scopePatternMatches(leftPattern, rightPattern);
  // The intersection of two arbitrary globs is deliberately not inferred.
  return true;
}

export function plansOverlap(left, right) {
  return left.allowlist.some((leftPath) => right.allowlist.some((rightPath) => scopePatternsOverlap(leftPath, rightPath)));
}

function dependencyStatus(plan, results) {
  const dependencies = plan.dependencies ?? [];
  if (dependencies.some((dependency) => results.get(dependency)?.status === "FAILED")) return "FAILED";
  if (dependencies.every((dependency) => results.get(dependency)?.status === "COMPLETED")) return "READY";
  return "WAITING";
}

export async function runReadyPlans(plans, runner, {
  maxParallel = MVP_CONFIG.max_parallel_implementation_workers,
  overlapPolicy = "serialize",
} = {}) {
  if (typeof runner !== "function") throw new Error("A task plan runner is required.");
  const normalized = validateTaskPlans(plans, { requireReady: true });
  if (normalized.some((plan) => plan.state !== "READY")) throw new Error("Only READY task plans may execute.");
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
  if (overlapPolicy === "reject") {
    for (let left = 0; left < normalized.length; left += 1) {
      for (let right = left + 1; right < normalized.length; right += 1) {
        if (plansOverlap(normalized[left], normalized[right])) {
          throw new Error(`Task plan file scopes overlap: ${normalized[left].task_id} and ${normalized[right].task_id}`);
        }
      }
    }
  }
  const pending = [...normalized];
  const active = [];
  const results = new Map();
  while (pending.length > 0 || active.length > 0) {
    let madeProgress = false;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const plan = pending[index];
      if (dependencyStatus(plan, results) !== "FAILED") continue;
      pending.splice(index, 1);
      results.set(plan.task_id, {
        plan,
        status: "FAILED",
        error: "A declared dependency did not complete successfully.",
      });
      madeProgress = true;
    }
    while (active.length < maxParallel && pending.length > 0) {
      const candidateIndex = pending.findIndex((plan) => dependencyStatus(plan, results) === "READY"
        && !active.some((entry) => plansOverlap(entry.plan, plan)));
      if (candidateIndex < 0) break;
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
      madeProgress = true;
    }
    if (active.length === 0) {
      if (pending.length === 0) break;
      if (!madeProgress) throw new Error("Task plan scheduler could not satisfy declared dependencies or scope constraints.");
      continue;
    }
    if (pending.length > 0 && active.length < maxParallel) {
      const runnable = pending.some((plan) => dependencyStatus(plan, results) === "READY"
        && !active.some((entry) => plansOverlap(entry.plan, plan)));
      if (runnable) continue;
    }
    const settled = await Promise.race(active.map((entry) => entry.promise.then((value) => ({ entry, value }))));
    const index = active.indexOf(settled.entry);
    if (index >= 0) active.splice(index, 1);
    if (settled.value.status === "FULFILLED"
      && settled.value.result?.status !== "FAILED"
      && settled.value.result?.status !== "REJECTED") {
      results.set(settled.entry.plan.task_id, {
        plan: settled.entry.plan,
        status: "COMPLETED",
        result: settled.value.result,
      });
    } else {
      results.set(settled.entry.plan.task_id, {
        plan: settled.entry.plan,
        status: "FAILED",
        error: redactSecrets(settled.value.error instanceof Error
          ? settled.value.error.message
          : settled.value.result?.error ?? String(settled.value.error ?? "Task worker failed")),
      });
    }
  }
  return normalized.map((plan) => results.get(plan.task_id));
}

export class AgentRunner {
  constructor(options = {}) {
    assertRunnerOptions(options, new Set(["store", "batchId", "client"]), "AgentRunner");
    if (!(options.store instanceof RuntimeStore)) throw new Error("AgentRunner requires the real Task 61 RuntimeStore.");
    assertProductionAppServerClient(options.client);
    this.options = { ...options };
  }

  run(plan, batchId = this.options.batchId, options = {}) {
    assertRunnerOptions(options, new Set(["signal"]), "AgentRunner run");
    return dispatchImplementation({ ...this.options, ...options, batchId, plan });
  }

  runReady(plans, batchId = this.options.batchId, options = {}) {
    return runReadyPlans(plans, (plan) => this.run(plan, batchId, options), options);
  }
}

export const createAgentRunner = (options) => new AgentRunner(options);
export const runImplementation = dispatchImplementation;
export const dispatchImplementationUnit = dispatchImplementation;
export const executeReadyPlans = runReadyPlans;

export { INTERNAL_WORKER_AUTHORITY, WORKER_COMPLETION_POLL_MS, TERMINAL_SUCCESS_STATES, TERMINAL_FAILURE_STATES };
