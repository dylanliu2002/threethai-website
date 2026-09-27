import crypto from "node:crypto";
import { assertNoSecretsDeep, sanitizeForLog } from "../workflow/secrets.mjs";
import {
  MVP_CONFIG,
  REVIEW_DEFAULT_REASONING_EFFORT,
  REVIEW_MODEL_NAME,
} from "./config.mjs";
import {
  PLANNING_MODEL_POLICY,
  assertPlanningPolicy,
  planningPolicyForDifficulty,
} from "./model-policy.mjs";
import {
  TASK_PLAN_SCHEMA_VERSION,
  TRUSTED_BASE_REF,
  normalizeAllowlist,
  validateTaskPlans,
} from "./schemas.mjs";
import { allocateTaskWorktrees, resolveTrustedBaseCommit } from "./worktrees.mjs";
import { RuntimeStore } from "./runtime-store.mjs";
import {
  assertCanonicalRuntimeStoreAuthority,
  assertSafeValidationCommands,
  readCanonicalBatch,
} from "./validation.mjs";
import { AppServerClient, isGenuineAppServerClient } from "./app-server-client.mjs";
import { ThreadBroker } from "./thread-broker.mjs";

const PLAN_BINDING_FIELD = "__night_worker_plan_binding";
const PLAN_BINDING_SCHEMA_VERSION = 1;
const PERSISTENT_SOL_PLANNERS = new WeakSet();
const PERSISTENT_SOL_PLANNER_CONTEXTS = new WeakMap();
const PERSISTENT_SOL_THREAD_ID = "persistent-orchestrator";
const PERSISTENT_SOL_ROLE = "ORCHESTRATOR";
const SUCCESSFUL_TURN_STATES = new Set(["COMPLETED", "SUCCEEDED", "SUCCESS", "DONE"]);
const PLANNING_OPTION_FIELDS = new Set(["store", "batchId", "difficulty", "solPlanner"]);

const ALLOWED_PROVIDER_PLAN_FIELDS = new Set([
  "task_id",
  "title",
  "description",
  "allowlist",
  "acceptance_criteria",
  "validation_commands",
  "difficulty",
  "dependencies",
  "state",
]);

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function createPersistentSOLPlanner(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("Persistent SOL planner requires a genuine App Server lifecycle identity object.");
  }
  const allowed = new Set(["client", "store"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) throw new Error(`Persistent SOL planner cannot accept caller override: ${key}`);
  }
  const { client, store } = options;
  if (!(client instanceof AppServerClient) || !isGenuineAppServerClient(client)
    || client.connectionState !== "READY") {
    throw new Error("Persistent SOL planner requires a genuine ready App Server lifecycle identity.");
  }
  if (client.client_info?.role !== PERSISTENT_SOL_ROLE
    || client.client_info?.planningThread !== PERSISTENT_SOL_THREAD_ID) {
    throw new Error("Persistent SOL planning requires the persistent Orchestrator client identity.");
  }
  if (!(store instanceof RuntimeStore)) {
    throw new Error("Persistent SOL planning requires the canonical RuntimeStore.");
  }
  const broker = new ThreadBroker({ client, store });
  let planner;
  planner = Object.freeze({
    plan: async (request) => {
      const context = persistentSOLPlannerContext(planner);
      return executePersistentSOLPlanning(context, request);
    },
  });
  PERSISTENT_SOL_PLANNER_CONTEXTS.set(planner, { client, store, broker });
  PERSISTENT_SOL_PLANNERS.add(planner);
  return planner;
}

function persistentSOLPlannerContext(planner) {
  const context = PERSISTENT_SOL_PLANNER_CONTEXTS.get(planner);
  if (!PERSISTENT_SOL_PLANNERS.has(planner) || !context
    || !(context.client instanceof AppServerClient)
    || !isGenuineAppServerClient(context.client)
    || context.client.connectionState !== "READY"
    || context.client.client_info?.role !== PERSISTENT_SOL_ROLE
    || context.client.client_info?.planningThread !== PERSISTENT_SOL_THREAD_ID
    || !(context.store instanceof RuntimeStore)
    || !(context.broker instanceof ThreadBroker)) {
    throw new Error("Planning requires the internal persistent Orchestrator SOL planner authority.");
  }
  return context;
}

function assertPersistentSOLPlanner(planner) {
  persistentSOLPlannerContext(planner);
  return planner;
}

function successfulTurn(turn) {
  return SUCCESSFUL_TURN_STATES.has(String(turn?.status ?? "").toUpperCase());
}

function parsePlanningPayload(value, seen = new Set()) {
  if (typeof value === "string") {
    try {
      return parsePlanningPayload(JSON.parse(value), seen);
    } catch {
      return null;
    }
  }
  if (value === null || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((entry) => entry && typeof entry === "object") ? value : null;
  }
  if (Array.isArray(value.plans)) return value;
  if (Array.isArray(value.task_plans)) return { plans: value.task_plans };
  for (const key of ["output", "result", "response", "output_text", "text", "content", "items"]) {
    const parsed = parsePlanningPayload(value[key], seen);
    if (parsed !== null) return parsed;
  }
  return null;
}

function planningTurnFromRead(response, expectedTurnId, expectedEffort, expectedThreadId, expectedMessageId) {
  const thread = response?.thread ?? response?.data?.thread ?? response;
  if (thread?.id !== undefined && thread.id !== expectedThreadId) {
    throw new Error("Persistent SOL App Server lifecycle returned the wrong durable thread.");
  }
  const turns = Array.isArray(thread?.turns)
    ? thread.turns
    : Array.isArray(response?.turns)
      ? response.turns
      : thread?.turn
        ? [thread.turn]
        : response?.turn
          ? [response.turn]
          : [];
  const turn = turns.find((candidate) => candidate?.id === expectedTurnId);
  if (!turn) throw new Error("Persistent SOL App Server lifecycle did not return the durable planning turn.");
  if (!successfulTurn(turn)) throw new Error("Persistent SOL planning turn did not complete successfully.");
  const returnedEffort = turn.reasoning_effort ?? turn.reasoningEffort ?? turn.effort;
  if (turn.model !== REVIEW_MODEL_NAME || returnedEffort !== expectedEffort) {
    throw new Error("Persistent SOL planning turn used an unexpected model policy.");
  }
  const returnedMessageId = turn.clientUserMessageId
    ?? turn.client_user_message_id
    ?? turn.clientRequestId
    ?? turn.client_request_id;
  if (returnedMessageId !== undefined && returnedMessageId !== expectedMessageId) {
    throw new Error("Persistent SOL planning turn does not match the durable client message identity.");
  }
  const payload = parsePlanningPayload(
    turn.output ?? turn.result ?? turn.response ?? turn.output_text ?? turn.content ?? turn.items,
  );
  if (payload === null) throw new Error("Persistent SOL App Server lifecycle returned no task-plan payload.");
  return payload;
}

async function executePersistentSOLPlanning(context, request) {
  assertObject(request, "Planning request");
  if (request.planning_thread !== PERSISTENT_SOL_THREAD_ID) {
    throw new Error("Planning request is not bound to the persistent Orchestrator thread.");
  }
  if (request.policy?.role !== PERSISTENT_SOL_ROLE
    || request.policy?.model !== REVIEW_MODEL_NAME
    || request.policy?.sandbox !== "read-only"
    || request.policy?.persistent !== true) {
    throw new Error("Planning request is not bound to the persistent SOL model policy.");
  }
  assertPlanningPolicy(request.policy);
  const requestedBatch = request.batch;
  assertObject(requestedBatch, "Planning request batch");
  const durableBatch = readCanonicalBatch(context.store, requestedBatch.batch_id);
  if (!durableBatch || durableBatch.submission_id !== requestedBatch.submission_id) {
    throw new Error("Planning request is not bound to the canonical submitted batch.");
  }
  assertCanonicalRuntimeStoreAuthority(context.store, durableBatch.repository_root);
  const task = durableBatch.tasks?.[0];
  if (!task) throw new Error("Persistent SOL planning requires a non-empty submitted batch.");

  const started = await context.broker.startReview({
    batchId: durableBatch.batch_id,
    taskId: task.task_id,
    cwd: durableBatch.repository_root,
    difficulty: request.policy.difficulty,
    prompt: JSON.stringify(request),
  });
  const mapping = started?.mapping ?? started;
  if (!mapping
    || mapping.batch_id !== durableBatch.batch_id
    || mapping.task_id !== task.task_id
    || mapping.role !== "REVIEW"
    || mapping.model !== REVIEW_MODEL_NAME
    || mapping.effort !== request.policy.effort
    || mapping.cwd !== durableBatch.repository_root
    || typeof mapping.thread_id !== "string"
    || typeof mapping.turn_id !== "string") {
    throw new Error("Persistent SOL planning lifecycle produced an invalid durable mapping.");
  }
  const read = await context.broker.readWorker({
    batchId: durableBatch.batch_id,
    taskId: task.task_id,
    role: "REVIEW",
  });
  const payload = planningTurnFromRead(
    read,
    mapping.turn_id,
    request.policy.effort,
    mapping.thread_id,
    mapping.client_user_message_id,
  );
  assertCanonicalRuntimeStoreAuthority(context.store, durableBatch.repository_root);
  return payload;
}

function submittedBatchFrom({ store, batchId } = {}) {
  if (!(store instanceof RuntimeStore)) {
    throw new Error("Planner requires the real Task 61 RuntimeStore.");
  }
  if (typeof batchId !== "string" || batchId.trim().length === 0 || batchId.includes("\0")) {
    throw new Error("Planning requires an explicit submitted batch ID.");
  }
  const requestedId = batchId.trim();
  const durable = readCanonicalBatch(store, requestedId);
  if (!durable || durable.batch_id !== requestedId) {
    throw new Error(`Cannot plan without an explicit submitted batch: ${requestedId}`);
  }
  assertObject(durable, "submitted batch");
  assertCanonicalRuntimeStoreAuthority(store, durable.repository_root);
  if (typeof durable.submission_id !== "string" || durable.submission_id.length === 0) {
    throw new Error("Submitted batch must have a durable submission identifier.");
  }
  if (!Array.isArray(durable.tasks) || durable.tasks.length < 1
    || durable.tasks.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Submitted batch task count is outside the bounded limit.");
  }
  if (!["QUEUED", "CLAIMED", "RUNNING"].includes(durable.state)) {
    throw new Error(`Batch is not eligible for planning: ${durable.state}`);
  }
  assertNoSecretsDeep(durable, "submitted batch");
  return clone(durable);
}

function planningOptions(options, { allowSolPlanner = false } = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("Planning options must be an object.");
  }
  const allowed = new Set(PLANNING_OPTION_FIELDS);
  if (!allowSolPlanner) allowed.delete("solPlanner");
  for (const key of Object.keys(options)) {
    if (allowed.has(key)) continue;
    if (key === "planProvider") {
      throw new Error("Planning cannot accept an arbitrary planProvider; use the internal persistent SOL planner authority.");
    }
    if (key === "worktreeRoot") {
      throw new Error("Planning cannot accept caller-controlled worktreeRoot authority.");
    }
    throw new Error(`Planning cannot accept caller override: ${key}`);
  }
  for (const key of ["model", "provider", "solPlanner", "orchestrator", "policy", "permissions", "capabilities", "fallback",
    "allowProviderModelFallback", "ephemeral", "fork", "subagent", "subagents", "sandbox", "baseSha",
    "exec", "commandRunner", "prepareWorktrees"]) {
    if (Object.prototype.hasOwnProperty.call(options, key) && !(key === "solPlanner" && allowSolPlanner)) {
      throw new Error(`Planning cannot accept caller policy or authority override: ${key}`);
    }
  }
  if (Object.prototype.hasOwnProperty.call(options, "baseRef")) {
    throw new Error(`Planning base is fixed to the trusted ${TRUSTED_BASE_REF} ref.`);
  }
  if (Object.prototype.hasOwnProperty.call(options, "plans")) {
    throw new Error("Planning output must come from the persistent Orchestrator provider.");
  }
}

export function planningRequest(options = {}) {
  planningOptions(options);
  const { store, batchId, difficulty = REVIEW_DEFAULT_REASONING_EFFORT } = options;
  const selected = submittedBatchFrom({ store, batchId });
  const policy = planningPolicyForDifficulty(difficulty);
  assertPlanningPolicy(policy);
  const baseSha = resolveTrustedBaseCommit(selected.repository_root);
  const request = {
    purpose: "bounded-task-decomposition",
    planning_thread: "persistent-orchestrator",
    policy,
    batch: {
      batch_id: selected.batch_id,
      submission_id: selected.submission_id,
      repository_root: selected.repository_root,
      base_ref: TRUSTED_BASE_REF,
      base_sha: baseSha,
      tasks: selected.tasks.map((task) => ({
        task_id: task.task_id,
        position: task.position,
        description: task.description,
      })),
    },
    output_contract: {
      one_plan_per_submitted_task: true,
      max_plans: MVP_CONFIG.max_tasks_per_batch,
      derived_fields: ["batch_id", "submission_id", "position", "branch", "worktree", "base_ref", "base_sha"],
      required_fields: [
        "task_id",
        "allowlist",
        "acceptance_criteria",
        "validation_commands",
      ],
    },
  };
  assertNoSecretsDeep(request, "planning request");
  return sanitizeForLog(request);
}

function providerPlans(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    if (Array.isArray(value.plans)) return value.plans;
    if (Array.isArray(value.task_plans)) return value.task_plans;
  }
  throw new Error("Persistent Orchestrator planning output must contain a plans array.");
}

function assertProviderFields(candidate) {
  assertObject(candidate, "planner output plan");
  for (const key of Object.keys(candidate)) {
    if (!ALLOWED_PROVIDER_PLAN_FIELDS.has(key)) {
      throw new Error(`Planner output cannot override derived or authority field: ${key}`);
    }
  }
}

function taskForCandidate(candidate, tasks, index) {
  if (candidate.task_id !== undefined) {
    const task = tasks.find((entry) => entry.task_id === candidate.task_id);
    if (!task) throw new Error(`Planner output references a task outside the submitted batch: ${candidate.task_id}`);
    return task;
  }
  const task = tasks[index];
  if (!task) throw new Error("Planner output contains more plans than submitted tasks.");
  return task;
}

function normalizePlanOutputForBatch(batch, output, { baseSha } = {}) {
  const candidates = providerPlans(output);
  if (candidates.length !== batch.tasks.length || candidates.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Planner output must contain exactly one bounded plan per submitted task.");
  }
  const rawPlans = candidates.map((candidate, index) => {
    assertProviderFields(candidate);
    const allowlist = normalizeAllowlist(candidate.allowlist);
    assertSafeValidationCommands(candidate.validation_commands, { allowlist });
    const task = taskForCandidate(candidate, batch.tasks, index);
    return {
      schema_version: TASK_PLAN_SCHEMA_VERSION,
      batch_id: batch.batch_id,
      submission_id: batch.submission_id,
      task_id: task.task_id,
      position: task.position,
      title: candidate.title,
      description: candidate.description ?? task.description,
      allowlist,
      acceptance_criteria: candidate.acceptance_criteria,
      validation_commands: candidate.validation_commands,
      difficulty: candidate.difficulty ?? "medium",
      dependencies: candidate.dependencies,
      base_ref: TRUSTED_BASE_REF,
      base_sha: baseSha,
      state: candidate.state ?? "READY",
    };
  });
  const allocated = allocateTaskWorktrees({
    repositoryRoot: batch.repository_root,
    plans: rawPlans,
  });
  return validateTaskPlans(allocated, { batch, requireReady: true });
}

function bundleDigest(plans) {
  return crypto.createHash("sha256").update(JSON.stringify(plans)).digest("hex");
}

function bindingFromBatch(batch) {
  const metadata = batch.reply_metadata;
  if (metadata === null || metadata === undefined) return null;
  assertObject(metadata, "submitted batch reply metadata");
  if (!Object.prototype.hasOwnProperty.call(metadata, PLAN_BINDING_FIELD)) return null;
  const binding = metadata[PLAN_BINDING_FIELD];
  assertObject(binding, "persisted task-plan binding");
  const allowed = new Set(["schema_version", "batch_id", "submission_id", "digest", "plans"]);
  for (const key of Object.keys(binding)) {
    if (!allowed.has(key)) throw new Error(`Persisted task-plan binding contains an unsupported field: ${key}`);
  }
  if (binding.schema_version !== PLAN_BINDING_SCHEMA_VERSION
    || binding.batch_id !== batch.batch_id
    || binding.submission_id !== batch.submission_id
    || typeof binding.digest !== "string") {
    throw new Error("Persisted task-plan binding identity or schema is invalid.");
  }
  const plans = validateTaskPlans(binding.plans, { batch, requireReady: true });
  for (const plan of plans) {
    assertSafeValidationCommands(plan.validation_commands, { allowlist: plan.allowlist });
  }
  const allocated = allocateTaskWorktrees({ repositoryRoot: batch.repository_root, plans });
  if (allocated.some((entry, index) => entry.worktree !== plans[index].worktree)) {
    throw new Error("Persisted task-plan binding contains a non-canonical worker worktree.");
  }
  const digest = bundleDigest(plans);
  if (binding.digest !== digest) throw new Error("Persisted task-plan binding digest does not match its plans.");
  return { digest, plans };
}

function persistPlanBinding(store, batch, plans) {
  const digest = bundleDigest(plans);
  const updated = store.updateBatch(batch.batch_id, (current) => {
    if (current.submission_id !== batch.submission_id) {
      throw new Error("Submitted batch changed while planning.");
    }
    const existing = bindingFromBatch(current);
    if (existing) {
      if (existing.digest !== digest) throw new Error("Accepted task-plan bundle cannot be silently replanned.");
      return current;
    }
    const metadata = current.reply_metadata === null || current.reply_metadata === undefined
      ? {}
      : { ...current.reply_metadata };
    if (Object.prototype.hasOwnProperty.call(metadata, PLAN_BINDING_FIELD)) {
      throw new Error("The reserved task-plan binding field cannot be caller supplied.");
    }
    metadata[PLAN_BINDING_FIELD] = {
      schema_version: PLAN_BINDING_SCHEMA_VERSION,
      batch_id: current.batch_id,
      submission_id: current.submission_id,
      digest,
      plans: clone(plans),
    };
    if (Buffer.byteLength(JSON.stringify(metadata), "utf8") > MVP_CONFIG.max_batch_bytes) {
      throw new Error("Persisted task-plan binding is oversized.");
    }
    assertNoSecretsDeep(metadata, "persisted task-plan binding");
    return { ...current, reply_metadata: metadata };
  });
  const bound = bindingFromBatch(updated);
  if (!bound) throw new Error("Task-plan binding was not durably persisted.");
  return bound;
}

export async function planBatch(options = {}) {
  planningOptions(options, { allowSolPlanner: true });
  const {
    store,
    batchId,
    solPlanner,
    difficulty = REVIEW_DEFAULT_REASONING_EFFORT,
  } = options;
  const selected = submittedBatchFrom({ store, batchId });
  const trustedBaseSha = resolveTrustedBaseCommit(selected.repository_root);
  const providedPlanner = solPlanner === undefined ? null : assertPersistentSOLPlanner(solPlanner);
  const persisted = bindingFromBatch(selected);
  if (persisted) {
    if (persisted.plans.some((plan) => plan.base_sha !== trustedBaseSha)) {
      throw new Error("Persisted task-plan bundle is not based on the fresh trusted origin/main commit.");
    }
    return {
      status: "PLANNED",
      planning_thread: "persistent-orchestrator",
      policy: planningPolicyForDifficulty(difficulty),
      batch_id: selected.batch_id,
      submission_id: selected.submission_id,
      plan_digest: persisted.digest,
      plans: persisted.plans,
      persisted: true,
    };
  }
  const request = planningRequest({ store, batchId: selected.batch_id, difficulty });
  const planner = providedPlanner ?? assertPersistentSOLPlanner(solPlanner);
  const output = await planner.plan(request);
  assertCanonicalRuntimeStoreAuthority(store, selected.repository_root);
  const normalizedPlans = normalizePlanOutputForBatch(selected, output, { baseSha: trustedBaseSha });
  const bound = persistPlanBinding(store, selected, normalizedPlans);
  return {
    status: "PLANNED",
    planning_thread: "persistent-orchestrator",
    policy: planningPolicyForDifficulty(difficulty),
    batch_id: selected.batch_id,
    submission_id: selected.submission_id,
    plan_digest: bound.digest,
    plans: bound.plans,
    persisted: false,
  };
}

export const planSubmittedBatch = planBatch;
export const createTaskPlans = planBatch;

export function createPlanner(options = {}) {
  const allowed = new Set(["store", "solPlanner", "difficulty"]);
  for (const key of Object.keys(options ?? {})) {
    if (!allowed.has(key)) throw new Error(`Planner factory cannot accept caller override: ${key}`);
  }
  const { store, solPlanner, difficulty = REVIEW_DEFAULT_REASONING_EFFORT } = options;
  if (!(store instanceof RuntimeStore)) throw new Error("Planner requires the real Task 61 RuntimeStore.");
  assertPersistentSOLPlanner(solPlanner);
  return Object.freeze({
    planBatch: (options = {}) => planBatch({
      ...options,
      store,
      batchId: options.batchId,
      solPlanner,
      difficulty: options.difficulty ?? difficulty,
    }),
  });
}

export {
  ALLOWED_PROVIDER_PLAN_FIELDS,
  PLAN_BINDING_FIELD,
  assertPersistentSOLPlanner,
  bundleDigest as taskPlanBundleDigest,
};
