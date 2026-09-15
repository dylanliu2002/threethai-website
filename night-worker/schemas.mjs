import crypto from "node:crypto";
import path from "node:path";
import { assertNoSecretsDeep, sanitizeForLog } from "../workflow/secrets.mjs";
import { MVP_CONFIG, reviewEffortForDifficulty } from "./config.mjs";

export const TASK_PLAN_SCHEMA_VERSION = 1;
export const TRUSTED_BASE_REF = "origin/main";

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
  "base_sha",
  "state",
  "created_at",
  "updated_at",
]);

const MAX_PLAN_TITLE_CHARS = 240;
const MAX_PLAN_CRITERIA = 32;
const MAX_PLAN_COMMANDS = 32;
const MAX_PLAN_ALLOWLIST = 128;
const MAX_PLAN_TOTAL_BYTES = 64 * 1024;

const PROTECTED_EXACT_PATHS = Object.freeze([
  "AGENTS.md",
  ".gitignore",
  "package.json",
  "package-lock.json",
  "bun.lock",
  "next.config.ts",
  "vercel.json",
  "Caddyfile",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/content/company.ts",
  "src/components/layout/site-header.tsx",
  "src/components/layout/site-footer.tsx",
  "src/lib/inquiry.ts",
  "middleware.ts",
  "prisma/schema.prisma",
  "prisma/schema.postgres.prisma",
]);

const PROTECTED_DIRECTORY_PATTERNS = Object.freeze([
  /^\.git(?:\/|$)/i,
  /^\.github(?:\/|$)/i,
  /^workflow(?:\/|$)/i,
  /^tasks(?:\/|$)/i,
  /^worklog(?:\/|$)/i,
  /^prisma(?:\/|$)/i,
  /(^|\/)\.env[^\/]*(?:\/|$)/i,
  /(^|\/)(?:deploy(?:ment)?|infra|terraform|k8s|kubernetes)(?:\/|$)/i,
  /(^|\/)(?:dockerfile|docker-compose(?:\.|$)|caddyfile|vercel\.json|netlify\.toml)$/i,
]);

const SECRET_PATH_PATTERN = /(^|\/)[^/]*(?:secret|credential|password|token|private[-_]?key)[^/]*(?:\/|$)/i;
const PROTECTED_NAMESPACE_NAMES = new Set([
  ".git", ".github", "workflow", "tasks", "worklog", "prisma",
  "deploy", "deployment", "infra", "terraform", "k8s", "kubernetes",
]);
const PROTECTED_GLOB_SEGMENT_NAMES = new Set([
  ...PROTECTED_NAMESPACE_NAMES,
  "secret", "client-secret", "credential", "credentials", "password", "token", "private-key",
  ".env", ".env.local", "dockerfile", "caddyfile", "vercel.json", "netlify.toml",
]);
const PROTECTED_SCOPE_WITNESSES = Object.freeze([
  ...PROTECTED_EXACT_PATHS,
  ".git/worker.mjs",
  ".github/worker.yml",
  "workflow/worker.mjs",
  "tasks/worker.md",
  "worklog/worker.md",
  "prisma/worker.sql",
  "deploy/worker.yml",
  "deployment/worker.yml",
  "infra/worker.tf",
  "terraform/worker.tf",
  "k8s/worker.yml",
  "kubernetes/worker.yml",
  "dockerfile",
  "docker-compose.yml",
  "caddyfile",
  "vercel.json",
  "netlify.toml",
  ".env",
  ".env.local",
  "src/secret.txt",
  "src/client-secret.mjs",
  "src/credentials.txt",
  "src/password.txt",
  "src/token.txt",
  "src/private-key.pem",
  "src/task-secret.txt",
  "src/f-secret.txt",
  "x/workflow/worker.mjs",
  "x/.github/worker.yml",
  "x/deploy/worker.yml",
]);

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
    if (segment.includes("*") || segment.includes("?")) {
      if (!/^[-A-Za-z0-9._?*]+$/.test(segment)) {
        throw new Error(`${label} contains an invalid glob segment.`);
      }
    }
  }
  return normalized;
}

function protectedCandidate(value) {
  const normalized = value.replaceAll("\\", "/").toLocaleLowerCase("en-US");
  const segments = normalized.split("/");
  if (segments.some((segment) => PROTECTED_NAMESPACE_NAMES.has(segment))) return true;
  if (PROTECTED_DIRECTORY_PATTERNS.some((candidate) => candidate.test(normalized))) return true;
  return SECRET_PATH_PATTERN.test(normalized)
    || PROTECTED_EXACT_PATHS.some((protectedPath) => protectedPath.toLocaleLowerCase("en-US") === normalized);
}

function wildcardCandidates(pattern) {
  const variants = [
    "__protected__",
    "secret",
    "client-secret",
    "credential",
    "credentials",
    "password",
    "token",
    "private-key",
    "workflow",
    "app/layout.tsx",
    "x/workflow",
    "x/.github",
    "x/deploy",
    "x",
  ];
  const segmentOptions = pattern.split("/").map((segment) => {
    if (segment === "**") return ["", ...variants];
    if (!segment.includes("*") && !segment.includes("?")) return [segment];
    const values = new Set();
    for (const variant of variants) {
      values.add(segment.replaceAll("*", variant).replaceAll("?", "x"));
    }
    return [...values];
  });
  const candidates = new Set();
  function visit(index, parts) {
    if (candidates.size >= 512) return;
    if (index === segmentOptions.length) {
      const candidate = parts.filter(Boolean).join("/");
      if (candidate.length > 0) candidates.add(candidate);
      return;
    }
    for (const option of segmentOptions[index]) visit(index + 1, [...parts, option]);
  }
  visit(0, []);
  return candidates;
}

function segmentGlobMatches(pattern, value) {
  let expression = "";
  for (const character of pattern) {
    if (character === "*") expression += ".*";
    else if (character === "?") expression += ".";
    else expression += /[|\\{}()[\]^$+?.]/.test(character) ? `\\${character}` : character;
  }
  return new RegExp(`^${expression}$`, "u").test(value);
}

function protectedAllowlistPath(pattern) {
  if (PROTECTED_DIRECTORY_PATTERNS.some((candidate) => candidate.test(pattern))) return true;
  if (SECRET_PATH_PATTERN.test(pattern)) return true;
  const segments = pattern.toLocaleLowerCase("en-US").split("/");
  if (segments.some((segment) => PROTECTED_NAMESPACE_NAMES.has(segment))) return true;
  if (segments.some((segment) => segment === "**"
    || ([...PROTECTED_GLOB_SEGMENT_NAMES].some((name) => /[*?]/.test(segment) && segmentGlobMatches(segment, name))))) {
    return true;
  }
  if (PROTECTED_EXACT_PATHS.some((protectedPath) => scopePatternMatches(pattern, protectedPath))) return true;
  if (!/[?*]/.test(pattern)) return false;
  const candidates = new Set([...PROTECTED_SCOPE_WITNESSES, ...wildcardCandidates(pattern)]);
  return [...candidates].some((candidate) => protectedCandidate(candidate) && scopePatternMatches(pattern, candidate));
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
  const normalized = [...new Set(values)];
  const protectedPath = normalized.find((pattern) => protectedAllowlistPath(pattern));
  if (protectedPath) {
    throw new Error(`Task allowlist contains a protected, shared, deployment, or secret-bearing path: ${protectedPath}`);
  }
  return normalized;
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

function normalizeBaseRef(value) {
  const baseRef = nonEmptyText(value, "plan base_ref", 300);
  if (baseRef !== TRUSTED_BASE_REF) {
    throw new Error(`Task plans must use the trusted ${TRUSTED_BASE_REF} base ref.`);
  }
  return baseRef;
}

function normalizeBaseSha(value) {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/i.test(value.trim())) {
    throw new Error("Task plans require a strict 40-character trusted base commit SHA.");
  }
  return value.trim().toLocaleLowerCase("en-US");
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
    difficulty: reviewEffortForDifficulty(
      plan.difficulty === undefined ? "medium" : nonEmptyText(plan.difficulty, "plan difficulty", 80),
    ),
    dependencies: normalizeDependencies(plan.dependencies),
    base_ref: normalizeBaseRef(plan.base_ref),
    base_sha: normalizeBaseSha(plan.base_sha),
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
  if (requireReady && normalized.state !== "READY") {
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
  const knownTaskIds = new Set(normalized.map((plan) => plan.task_id));
  for (const plan of normalized) {
    for (const dependency of plan.dependencies) {
      if (!knownTaskIds.has(dependency)) {
        throw new Error(`Task plan dependency is outside the submitted plan bundle: ${dependency}`);
      }
      if (dependency === plan.task_id) throw new Error(`Task plan cannot depend on itself: ${plan.task_id}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(taskId) {
    if (visiting.has(taskId)) throw new Error("Task plan dependencies contain a cycle.");
    if (visited.has(taskId)) return;
    visiting.add(taskId);
    const current = normalized.find((plan) => plan.task_id === taskId);
    for (const dependency of current.dependencies) visit(dependency);
    visiting.delete(taskId);
    visited.add(taskId);
  }
  for (const plan of normalized) visit(plan.task_id);
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
  const normalizedPattern = normalizeScopePath(pattern).toLocaleLowerCase("en-US");
  const normalizedFile = normalizedRepoPath(filePath, "changed path").toLocaleLowerCase("en-US");
  const globRegex = (value) => {
    let escaped = "";
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      const next = value[index + 1];
      if (character === "*" && next === "*") {
        if (value[index + 2] === "/") {
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
    return escaped;
  };
  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    if (!/[?*]/.test(prefix)) {
      return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
    }
    return new RegExp(`^${globRegex(prefix)}(?:/.*)?$`, "u").test(normalizedFile);
  }
  if (!/[?*]/.test(normalizedPattern)) return normalizedPattern === normalizedFile;
  const escaped = globRegex(normalizedPattern);
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
    base_ref: normalized.base_ref,
    base_sha: normalized.base_sha,
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
