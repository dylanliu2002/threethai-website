import crypto from "node:crypto";
import path from "node:path";
import { assertNoSecretsDeep, sanitizeForLog } from "../workflow/secrets.mjs";
import { MVP_CONFIG } from "./config.mjs";

export const TASK_PLAN_SCHEMA_VERSION = 1;

export const TASK_PLAN_STATES = Object.freeze([
  "PLANNED",
  "READY",
  "RUNNING",
  "VALIDATING",
  "PUBLISHABLE",
  "COMPLETED",
  "FAILED",
  "REJECTED",
]);

const PLAN_FIELDS = new Set([
  "schema_version",
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
  "created_at",
  "updated_at",
]);

const MAX_PLAN_TITLE_CHARS = 240;
const MAX_PLAN_CRITERIA = 32;
const MAX_PLAN_COMMANDS = 32;
const MAX_PLAN_ALLOWLIST = 128;
const MAX_PLAN_TOTAL_BYTES = 64 * 1024;

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertKnownFields(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Unsupported ${label} field: ${key}`);
  }
}

function nonEmptyText(value, label, max = 10_000) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be non-empty text.`);
  }
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${label} is oversized.`);
  return normalized;
}

function normalizedRepoPath(value, label) {
  const raw = nonEmptyText(value, label, 1_000).replaceAll("\\", "/");
  if (raw.includes("\0") || raw.startsWith("/") || /^[A-Za-z]:\//.test(raw)) {
    throw new Error(`${label} must be a repository-relative path.`);
  }
  const segments = raw.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new Error(`${label} must not contain empty, dot, or parent path segments.`);
  }
  return segments.join("/");
}

function normalizeScopePath(value, label = "allowlist path") {
  const normalized = normalizedRepoPath(value, label);
  const segments = normalized.split("/");
  for (const segment of segments) {
    if (segment === "*" || segment === "**") continue;
    if (segment.includes("*")) {
      if (!/^[-A-Za-z0-9._?*]+$/.test(segment)) {
        throw new Error(`${label} contains an invalid glob segment.`);
      }
    }
  }
  return normalized;
}

function normalizeStringArray(value, label, { maxItems, maxChars = 10_000 } = {}) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) {
    throw new Error(`${label} must contain between one and ${maxItems} entries.`);
  }
  const values = value.map((entry, index) => nonEmptyText(entry, `${label}[${index}]`, maxChars));
  if (new Set(values).size !== values.length) throw new Error(`${label} cannot contain duplicates.`);
  return values;
}

export function normalizeAllowlist(value) {
  const values = normalizeStringArray(value, "allowlist", {
    maxItems: MAX_PLAN_ALLOWLIST,
    maxChars: 1_000,
  }).map((entry) => normalizeScopePath(entry));
  return [...new Set(values)];
}

function normalizeBranch(value) {
  const branch = nonEmptyText(value, "branch", 240);
  if (!/^codex\/\d{2,}-[a-z0-9][a-z0-9-]*$/.test(branch)) {
    throw new Error("Task plan branch must match codex/NN-*.");
  }
  return branch;
}

function normalizeWorktree(value) {
  const worktree = nonEmptyText(value, "worktree", 4_000);
  if (!path.isAbsolute(worktree) || worktree.includes("\0")) {
    throw new Error("Task plan worktree must be an absolute path.");
  }
  return path.normalize(worktree);
}

function normalizeDependencies(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Task plan dependencies are invalid.");
  }
  const dependencies = value.map((entry, index) => nonEmptyText(entry, `dependencies[${index}]`, 200));
  if (new Set(dependencies).size !== dependencies.length) throw new Error("Task plan dependencies cannot contain duplicates.");
  return dependencies;
}

function normalizeState(value) {
  const state = value ?? "PLANNED";
  if (!TASK_PLAN_STATES.includes(state)) throw new Error(`Unsupported task plan state: ${String(state)}`);
  return state;
}

export function validateTaskPlan(plan, {
  batch,
  requireCanonicalWorktree = false,
  requireReady = false,
} = {}) {
  assertObject(plan, "task plan");
  assertKnownFields(plan, PLAN_FIELDS, "task plan");
  if (plan.schema_version !== TASK_PLAN_SCHEMA_VERSION) {
    throw new Error(`Unsupported task plan schema version: ${String(plan.schema_version)}`);
  }
  const normalized = {
    schema_version: TASK_PLAN_SCHEMA_VERSION,
    batch_id: nonEmptyText(plan.batch_id, "plan batch_id", 300),
    submission_id: nonEmptyText(plan.submission_id, "plan submission_id", 300),
    task_id: nonEmptyText(plan.task_id, "plan task_id", 300),
    position: plan.position,
    title: plan.title === undefined ? undefined : nonEmptyText(plan.title, "plan title", MAX_PLAN_TITLE_CHARS),
    description: nonEmptyText(plan.description, "plan description", MVP_CONFIG.max_task_description_chars),
    branch: normalizeBranch(plan.branch),
    worktree: normalizeWorktree(plan.worktree),
    allowlist: normalizeAllowlist(plan.allowlist),
    acceptance_criteria: normalizeStringArray(plan.acceptance_criteria, "acceptance_criteria", {
      maxItems: MAX_PLAN_CRITERIA,
      maxChars: 2_000,
    }),
    validation_commands: normalizeStringArray(plan.validation_commands, "validation_commands", {
      maxItems: MAX_PLAN_COMMANDS,
      maxChars: 2_000,
    }),
    difficulty: plan.difficulty === undefined ? "medium" : nonEmptyText(plan.difficulty, "plan difficulty", 80),
    dependencies: normalizeDependencies(plan.dependencies),
    base_ref: plan.base_ref === undefined ? undefined : nonEmptyText(plan.base_ref, "plan base_ref", 300),
    state: normalizeState(plan.state),
    created_at: plan.created_at === undefined ? undefined : nonEmptyText(plan.created_at, "plan created_at", 100),
    updated_at: plan.updated_at === undefined ? undefined : nonEmptyText(plan.updated_at, "plan updated_at", 100),
  };
  if (!Number.isInteger(normalized.position) || normalized.position < 1) {
    throw new Error("Task plan position must be a positive integer.");
  }
  if (batch) {
    assertObject(batch, "submitted batch");
    if (normalized.batch_id !== batch.batch_id || normalized.submission_id !== batch.submission_id) {
      throw new Error("Task plan must remain traceable to its submitted batch.");
    }
    const task = batch.tasks?.find((entry) => entry.task_id === normalized.task_id);
    if (!task) throw new Error(`Task plan references a task outside the submitted batch: ${normalized.task_id}`);
    if (normalized.position !== task.position) throw new Error("Task plan position does not match the submitted task.");
  }
  if (requireReady && !["READY", "PLANNED"].includes(normalized.state)) {
    throw new Error(`Task plan is not ready: ${normalized.state}`);
  }
  if (requireCanonicalWorktree) {
    // Filesystem and Git identity are checked by worktrees.mjs. This option is
    // intentionally only a marker for callers that require that second gate.
    if (!path.isAbsolute(normalized.worktree)) throw new Error("Task plan worktree is not absolute.");
  }
  if (Buffer.byteLength(JSON.stringify(normalized), "utf8") > MAX_PLAN_TOTAL_BYTES) {
    throw new Error("Task plan is oversized.");
  }
  assertNoSecretsDeep(normalized, "task plan");
  return normalized;
}

export function validateTaskPlans(plans, { batch, requireReady = false } = {}) {
  if (!Array.isArray(plans) || plans.length < 1 || plans.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Task plans must contain between one and four plans.");
  }
  const normalized = plans.map((plan) => validateTaskPlan(plan, { batch, requireReady }));
  const taskIds = new Set();
  const positions = new Set();
  const branches = new Set();
  const worktrees = new Set();
  for (const plan of normalized) {
    if (taskIds.has(plan.task_id)) throw new Error(`Duplicate task plan: ${plan.task_id}`);
    if (positions.has(plan.position)) throw new Error(`Duplicate task plan position: ${plan.position}`);
    const branchKey = plan.branch.toLocaleLowerCase("en-US");
    if (branches.has(branchKey)) throw new Error(`Duplicate task plan branch: ${plan.branch}`);
    const worktreeKey = path.normalize(plan.worktree).toLocaleLowerCase("en-US");
    if (worktrees.has(worktreeKey)) throw new Error(`Duplicate task plan worktree: ${plan.worktree}`);
    taskIds.add(plan.task_id);
    positions.add(plan.position);
    branches.add(branchKey);
    worktrees.add(worktreeKey);
  }
  if (batch) {
    if (normalized.length !== batch.tasks.length) {
      throw new Error("Every submitted task must have exactly one bounded task plan.");
    }
    for (const task of batch.tasks) {
      if (!taskIds.has(task.task_id)) throw new Error(`Submitted task has no task plan: ${task.task_id}`);
    }
  }
  return normalized.sort((left, right) => left.position - right.position);
}

export function scopePatternMatches(pattern, filePath) {
  const normalizedPattern = normalizeScopePath(pattern);
  const normalizedFile = normalizedRepoPath(filePath, "changed path");
  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }
  if (!normalizedPattern.includes("*")) return normalizedPattern === normalizedFile;
  let escaped = "";
  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const character = normalizedPattern[index];
    const next = normalizedPattern[index + 1];
    if (character === "*" && next === "*") {
      if (normalizedPattern[index + 2] === "/") {
        escaped += "(?:.*/)?";
        index += 2;
      } else {
        escaped += ".*";
        index += 1;
      }
    } else if (character === "*") {
      escaped += "[^/]*";
    } else if (character === "?") {
      escaped += "[^/]";
    } else {
      escaped += /[|\\{}()[\]^$+?.]/.test(character) ? `\\${character}` : character;
    }
  }
  return new RegExp(`^${escaped}$`, "u").test(normalizedFile);
}

export function isPathAllowed(filePath, allowlist) {
  return allowlist.some((pattern) => scopePatternMatches(pattern, filePath));
}

export function assertScopeAllowed(paths, allowlist) {
  const outOfScope = paths.filter((filePath) => !isPathAllowed(filePath, allowlist));
  if (outOfScope.length > 0) {
    throw new Error(`Changed files are outside the task allowlist: ${outOfScope.join(", ")}`);
  }
  return true;
}

export function workerSafePlan(plan) {
  const normalized = validateTaskPlan(plan);
  const safe = {
    batch_id: normalized.batch_id,
    submission_id: normalized.submission_id,
    task_id: normalized.task_id,
    position: normalized.position,
    title: normalized.title,
    description: normalized.description,
    branch: normalized.branch,
    worktree: normalized.worktree,
    allowlist: [...normalized.allowlist],
    acceptance_criteria: [...normalized.acceptance_criteria],
    validation_commands: [...normalized.validation_commands],
    difficulty: normalized.difficulty,
    dependencies: [...normalized.dependencies],
  };
  assertNoSecretsDeep(safe, "worker task plan");
  return sanitizeForLog(safe);
}

export function taskPlanDigest(plan) {
  const normalized = validateTaskPlan(plan);
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export const validatePlan = validateTaskPlan;
export const validatePlans = validateTaskPlans;
export const pathAllowed = isPathAllowed;

export {
  MAX_PLAN_ALLOWLIST,
  MAX_PLAN_COMMANDS,
  MAX_PLAN_CRITERIA,
  MAX_PLAN_TITLE_CHARS,
};
