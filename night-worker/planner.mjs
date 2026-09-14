import { assertNoSecretsDeep, sanitizeForLog } from "../workflow/secrets.mjs";
import { MVP_CONFIG, REVIEW_DEFAULT_REASONING_EFFORT } from "./config.mjs";
import {
  PLANNING_MODEL_POLICY,
  planningPolicyForDifficulty,
} from "./model-policy.mjs";
import {
  TASK_PLAN_SCHEMA_VERSION,
  validateTaskPlans,
} from "./schemas.mjs";
import { allocateTaskWorktrees } from "./worktrees.mjs";
import { RuntimeStore } from "./runtime-store.mjs";

const ALLOWED_PROVIDER_PLAN_FIELDS = new Set([
  "batch_id",
  "submission_id",
  "task_id",
  "position",
  "title",
  "description",
  "branch",
  "worktree",
  "allowlist",
  "acceptance_criteria",
  "validation_commands",
  "difficulty",
  "dependencies",
  "base_ref",
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

function submittedBatchFrom({ store, batch, batchId }) {
  if (store !== undefined && !(store instanceof RuntimeStore)) {
    throw new Error("Planner requires the real Task 61 RuntimeStore.");
  }
  if (!batch && !batchId) throw new Error("Planning requires an explicit submitted batch.");
  const requestedId = batchId ?? batch?.batch_id;
  const durable = store ? store.getBatch(requestedId) : null;
  if (store && !durable) throw new Error(`Cannot plan without an explicit submitted batch: ${requestedId}`);
  if (batch && durable && (batch.batch_id !== durable.batch_id || batch.submission_id !== durable.submission_id)) {
    throw new Error("Planner batch does not match the durable submitted batch.");
  }
  const selected = durable ?? batch;
  assertObject(selected, "submitted batch");
  if (typeof selected.batch_id !== "string" || selected.batch_id.length === 0
    || typeof selected.submission_id !== "string" || selected.submission_id.length === 0) {
    throw new Error("Submitted batch must have durable batch and submission identifiers.");
  }
  if (!Array.isArray(selected.tasks) || selected.tasks.length < 1
    || selected.tasks.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Submitted batch task count is outside the bounded limit.");
  }
  if (!["QUEUED", "CLAIMED", "RUNNING"].includes(selected.state)) {
    throw new Error(`Batch is not eligible for planning: ${selected.state}`);
  }
  assertNoSecretsDeep(selected, "submitted batch");
  return clone(selected);
}

export function planningRequest(batch, {
  difficulty = REVIEW_DEFAULT_REASONING_EFFORT,
  policy = planningPolicyForDifficulty(difficulty),
} = {}) {
  const selected = submittedBatchFrom({ batch });
  const request = {
    purpose: "bounded-task-decomposition",
    planning_thread: "persistent-orchestrator",
    policy: {
      ...PLANNING_MODEL_POLICY,
      ...policy,
    },
    batch: {
      batch_id: selected.batch_id,
      submission_id: selected.submission_id,
      repository_root: selected.repository_root,
      tasks: selected.tasks.map((task) => ({
        task_id: task.task_id,
        position: task.position,
        description: task.description,
      })),
    },
    output_contract: {
      one_plan_per_submitted_task: true,
      max_plans: MVP_CONFIG.max_tasks_per_batch,
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
      throw new Error(`Planner output contains an unsupported field: ${key}`);
    }
  }
}

function taskForCandidate(candidate, tasks, index) {
  if (candidate.task_id !== undefined) {
    const task = tasks.find((entry) => entry.task_id === candidate.task_id);
    if (!task) throw new Error(`Planner output references a task outside the submitted batch: ${candidate.task_id}`);
    return task;
  }
  if (candidate.position !== undefined) {
    const task = tasks.find((entry) => entry.position === candidate.position);
    if (!task) throw new Error(`Planner output references an unknown task position: ${candidate.position}`);
    return task;
  }
  const task = tasks[index];
  if (!task) throw new Error("Planner output contains more plans than submitted tasks.");
  return task;
}

function assertDerivedIdentity(candidate, task, batch) {
  for (const [field, expected] of [
    ["batch_id", batch.batch_id],
    ["submission_id", batch.submission_id],
    ["task_id", task.task_id],
    ["position", task.position],
  ]) {
    if (candidate[field] !== undefined && candidate[field] !== expected) {
      throw new Error(`Planner output cannot override durable ${field}.`);
    }
  }
}

export function normalizePlanOutput(batch, output, {
  worktreeRoot,
  baseRef = "origin/main",
} = {}) {
  const selected = submittedBatchFrom({ batch });
  const candidates = providerPlans(output);
  if (candidates.length !== selected.tasks.length || candidates.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Planner output must contain exactly one bounded plan per submitted task.");
  }
  const rawPlans = candidates.map((candidate, index) => {
    assertProviderFields(candidate);
    const task = taskForCandidate(candidate, selected.tasks, index);
    assertDerivedIdentity(candidate, task, selected);
    if (candidate.base_ref !== undefined && candidate.base_ref !== baseRef) {
      throw new Error("Planner output cannot override the authoritative base_ref.");
    }
    return {
      schema_version: TASK_PLAN_SCHEMA_VERSION,
      batch_id: selected.batch_id,
      submission_id: selected.submission_id,
      task_id: task.task_id,
      position: task.position,
      title: candidate.title,
      description: candidate.description ?? task.description,
      branch: candidate.branch,
      worktree: candidate.worktree,
      allowlist: candidate.allowlist,
      acceptance_criteria: candidate.acceptance_criteria,
      validation_commands: candidate.validation_commands,
      difficulty: candidate.difficulty ?? "medium",
      dependencies: candidate.dependencies,
      base_ref: baseRef,
      state: candidate.state ?? "READY",
    };
  });
  const allocated = allocateTaskWorktrees({
    repositoryRoot: selected.repository_root,
    plans: rawPlans,
    worktreeRoot,
    baseRef,
  });
  return validateTaskPlans(allocated, { batch: selected, requireReady: true });
}

export const normalizePlans = normalizePlanOutput;

export async function planBatch({
  store,
  batch,
  batchId,
  plans,
  planProvider,
  provider,
  solPlanner,
  difficulty = REVIEW_DEFAULT_REASONING_EFFORT,
  worktreeRoot,
  baseRef = "origin/main",
  orchestrator,
} = {}) {
  if (!(store instanceof RuntimeStore)) {
    throw new Error("Planning requires the real Task 61 RuntimeStore and an explicit submitted batch.");
  }
  const selected = submittedBatchFrom({ store, batch, batchId });
  const policy = planningPolicyForDifficulty(difficulty);
  const planner = planProvider ?? provider ?? solPlanner ?? orchestrator;
  let output = plans;
  if (output === undefined) {
    if (typeof planner !== "function") {
      throw new Error("An explicit submitted batch requires persistent Orchestrator planning output.");
    }
    output = await planner(planningRequest(selected, { difficulty, policy }));
  }
  const normalizedPlans = normalizePlanOutput(selected, output, { worktreeRoot, baseRef });
  return {
    status: "PLANNED",
    planning_thread: "persistent-orchestrator",
    policy,
    batch_id: selected.batch_id,
    submission_id: selected.submission_id,
    plans: normalizedPlans,
  };
}

export const planSubmittedBatch = planBatch;
export const createTaskPlans = planBatch;

export function createPlanner({ store, planProvider, difficulty = REVIEW_DEFAULT_REASONING_EFFORT, worktreeRoot, baseRef = "origin/main" } = {}) {
  if (!(store instanceof RuntimeStore)) throw new Error("Planner requires the real Task 61 RuntimeStore.");
  if (typeof planProvider !== "function") throw new Error("Planner requires a persistent Orchestrator plan provider.");
  return Object.freeze({
    planBatch: (options = {}) => planBatch({
      ...options,
      store,
      planProvider,
      difficulty: options.difficulty ?? difficulty,
      worktreeRoot: options.worktreeRoot ?? worktreeRoot,
      baseRef: options.baseRef ?? baseRef,
    }),
  });
}

export {
  ALLOWED_PROVIDER_PLAN_FIELDS,
};
