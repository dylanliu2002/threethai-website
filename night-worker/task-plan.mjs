import { timestampFrom } from "./config.mjs";
import {
  TASK_PLAN_SCHEMA_VERSION,
  TASK_PLAN_STATES,
  normalizeAllowlist,
  taskPlanDigest,
  validateTaskPlan,
  validateTaskPlans,
  workerSafePlan,
} from "./schemas.mjs";
import { allocateTaskWorktree, resolveTrustedBaseCommit } from "./worktrees.mjs";
import { assertSafeValidationCommands } from "./validation.mjs";

const TRANSITIONS = Object.freeze({
  PLANNED: new Set(["READY", "REJECTED"]),
  READY: new Set(["RUNNING", "REJECTED"]),
  RUNNING: new Set(["VALIDATING", "FAILED", "REJECTED"]),
  VALIDATING: new Set(["PUBLISHABLE", "FAILED", "REJECTED"]),
  PUBLISHABLE: new Set(["COMPLETED"]),
  COMPLETED: new Set(),
  FAILED: new Set(),
  REJECTED: new Set(),
});

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
}

export function createTaskPlan({
  batch,
  task,
  title,
  description,
  branch,
  worktree,
  allowlist,
  acceptanceCriteria,
  validationCommands,
  difficulty = "medium",
  dependencies,
  baseRef = "origin/main",
  clock = Date,
} = {}) {
  assertObject(batch, "submitted batch");
  assertObject(task, "submitted task");
  if (task.task_id === undefined || task.position === undefined) throw new Error("Submitted task identity is required.");
  if (arguments[0] && Object.prototype.hasOwnProperty.call(arguments[0], "worktreeRoot")) {
    throw new Error("Task plan creation cannot accept caller-controlled worktreeRoot authority.");
  }
  const normalizedAllowlist = normalizeAllowlist(allowlist);
  assertSafeValidationCommands(validationCommands, { allowlist: normalizedAllowlist });
  const trustedBaseSha = resolveTrustedBaseCommit(batch.repository_root);
  const allocated = allocateTaskWorktree({
    repositoryRoot: batch.repository_root,
    plan: {
      task_id: task.task_id,
      position: task.position,
      description: description ?? task.description,
      title,
      branch,
      worktree,
      base_sha: trustedBaseSha,
    },
    baseRef,
  });
  const now = timestampFrom(clock);
  return validateTaskPlan({
    schema_version: TASK_PLAN_SCHEMA_VERSION,
    batch_id: batch.batch_id,
    submission_id: batch.submission_id,
    task_id: task.task_id,
    position: task.position,
    title,
    description: allocated.description,
    branch: allocated.branch,
    worktree: allocated.worktree,
    allowlist: normalizedAllowlist,
    acceptance_criteria: acceptanceCriteria,
    validation_commands: validationCommands,
    difficulty,
    dependencies,
    base_ref: allocated.base_ref,
    base_sha: allocated.base_sha,
    state: "PLANNED",
    created_at: now,
    updated_at: now,
  }, { batch });
}

export function transitionTaskPlan(plan, state, { clock = Date } = {}) {
  const current = validateTaskPlan(plan);
  if (!TASK_PLAN_STATES.includes(state)) throw new Error(`Unsupported task plan state: ${String(state)}`);
  if (current.state !== state && !TRANSITIONS[current.state]?.has(state)) {
    throw new Error(`Invalid task plan transition: ${current.state} -> ${state}`);
  }
  return validateTaskPlan({
    ...current,
    state,
    updated_at: timestampFrom(clock),
  });
}

export const markTaskPlanReady = (plan, options) => transitionTaskPlan(plan, "READY", options);
export const markTaskPlanRunning = (plan, options) => transitionTaskPlan(plan, "RUNNING", options);
export const markTaskPlanValidating = (plan, options) => transitionTaskPlan(plan, "VALIDATING", options);
export const markTaskPlanPublishable = (plan, options) => transitionTaskPlan(plan, "PUBLISHABLE", options);
export const markTaskPlanCompleted = (plan, options) => transitionTaskPlan(plan, "COMPLETED", options);
export const markTaskPlanFailed = (plan, options) => transitionTaskPlan(plan, "FAILED", options);
export const rejectTaskPlan = (plan, options) => transitionTaskPlan(plan, "REJECTED", options);
export const buildTaskPlan = createTaskPlan;
export const transitionPlan = transitionTaskPlan;

export function taskPlanForWorker(plan) {
  return workerSafePlan(validateTaskPlan(plan, { requireReady: true }));
}

export function cloneTaskPlan(plan) {
  return clone(validateTaskPlan(plan));
}

export {
  TASK_PLAN_SCHEMA_VERSION,
  TASK_PLAN_STATES,
  taskPlanDigest,
  validateTaskPlan,
  validateTaskPlans,
};
