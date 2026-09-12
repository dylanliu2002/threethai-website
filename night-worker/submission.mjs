import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { assertNoSecretsDeep, sanitizeForLog } from "../workflow/secrets.mjs";
import {
  MVP_CONFIG,
  clockEpoch,
  timestampFrom,
} from "./config.mjs";
import { RuntimeStore } from "./runtime-store.mjs";

const ALLOWED_FIELDS = new Set([
  "repositoryroot", "reporoot", "repository_root",
  "tasks", "taskdescriptions", "task_descriptions",
  "replymetadata", "reply_metadata", "reply",
]);

const AUTHORITY_FIELDS = new Set([
  "model", "modelprovider", "provider", "effort", "reasoningeffort", "sandbox",
  "sandboxpolicy", "permissions", "capabilities", "policy", "fallback",
  "allowprovidermodelfallback", "ephemeral", "fork", "subagent", "subagents",
  "activation", "session", "branch", "worktree", "cwd", "expiresat", "submittedat",
]);

function makeId(prefix) { return `${prefix}_${crypto.randomUUID()}`; }

function generatedId(idFactory, prefix) {
  const value = typeof idFactory === "function"
    ? idFactory(prefix)
    : idFactory && typeof idFactory.next === "function" ? idFactory.next(prefix) : makeId(prefix);
  if (typeof value !== "string" || value.length === 0) throw new Error(`ID factory returned an invalid ${prefix} id.`);
  return value;
}

function findInputValue(input, keys, label) {
  const present = keys.filter((key) => Object.prototype.hasOwnProperty.call(input, key));
  if (present.length > 1) {
    const first = JSON.stringify(input[present[0]]);
    for (const key of present.slice(1)) {
      if (JSON.stringify(input[key]) !== first) throw new Error(`${label} was supplied more than once.`);
    }
  }
  return present.length ? input[present[0]] : undefined;
}

function assertSubmissionFields(input) {
  for (const key of Object.keys(input)) {
    const normalized = key.toLocaleLowerCase("en-US").replace(/[^a-z0-9_]/g, "");
    if (AUTHORITY_FIELDS.has(normalized)) throw new Error(`Submission cannot set authority field: ${key}`);
    if (!ALLOWED_FIELDS.has(normalized)) throw new Error(`Unsupported submission field: ${key}`);
  }
}

function samePath(left, right) {
  const relative = path.relative(path.resolve(left), path.resolve(right));
  return relative === "";
}

function internalRuntimeStorePath(repositoryRoot) {
  const runtimeDirectory = path.join(repositoryRoot, ".night-worker");
  const runtimeFile = path.join(runtimeDirectory, "runtime.json");
  for (const [candidate, label] of [[runtimeDirectory, "internal runtime directory"], [runtimeFile, "internal runtime state"]]) {
    if (!fs.existsSync(candidate)) continue;
    let stat;
    try { stat = fs.lstatSync(candidate); } catch { throw new Error(label + " cannot be inspected."); }
    if (stat.isSymbolicLink()) throw new Error(label + " cannot be a symbolic link.");
    if (label === "internal runtime directory" && !stat.isDirectory()) {
      throw new Error("Internal runtime path must be a directory.");
    }
    if (label === "internal runtime state" && !stat.isFile()) {
      throw new Error("Internal runtime state must be a file.");
    }
  }
  return runtimeFile;
}

export function canonicalDirectory(value, label = "directory") {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
    throw new Error(`${label} must be a non-empty path without NUL bytes.`);
  }
  const candidate = value.trim();
  if (!path.isAbsolute(candidate)) throw new Error(`${label} must be absolute.`);
  const normalized = path.normalize(candidate);
  let stat;
  try { stat = fs.statSync(normalized); } catch { throw new Error(`${label} must exist.`); }
  if (!stat.isDirectory()) throw new Error(`${label} must be a directory.`);
  try { return fs.realpathSync(normalized); } catch { throw new Error(`${label} must resolve canonically.`); }
}

export function assertGitWorktree(directory, label = "repository root") {
  const canonical = canonicalDirectory(directory, label);
  let insideWorktree;
  let topLevel;
  try {
    insideWorktree = execFileSync("git", ["-C", canonical, "rev-parse", "--is-inside-work-tree"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 8_000,
    }).trim();
    topLevel = execFileSync("git", ["-C", canonical, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 8_000,
    }).trim();
  } catch {
    throw new Error(`${label} must be a genuine Git worktree.`);
  }
  if (insideWorktree !== "true" || !topLevel || !samePath(fs.realpathSync(topLevel), canonical)) {
    throw new Error(`${label} must be a genuine Git worktree.`);
  }
  return canonical;
}

function normalizeRepositoryRoot(value, { requireExisting = true, requireGitRepository = true } = {}) {
  if (!requireExisting) {
    if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
      throw new Error("repository root must be a non-empty path without NUL bytes.");
    }
    if (!path.isAbsolute(value.trim())) throw new Error("repository root must be absolute.");
    return path.normalize(value.trim());
  }
  const canonical = canonicalDirectory(value, "repository root");
  return requireGitRepository ? assertGitWorktree(canonical, "repository root") : canonical;
}

function normalizeDescriptions(value) {
  if (!Array.isArray(value)) throw new Error("tasks must be an array of task descriptions.");
  if (value.length < 1 || value.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error(`A batch must contain between one and four tasks.`);
  }
  const descriptions = value.map((description, index) => {
    if (typeof description !== "string") throw new Error(`Task ${index + 1} description must be text.`);
    const normalized = description.trim();
    if (normalized.length === 0) throw new Error(`Task ${index + 1} description cannot be empty.`);
    if (normalized.length > MVP_CONFIG.max_task_description_chars) {
      throw new Error(`Task ${index + 1} description is oversized.`);
    }
    return normalized;
  });
  const total = descriptions.reduce((sum, description) => sum + description.length, 0);
  if (total > MVP_CONFIG.max_total_task_description_chars) throw new Error("Task descriptions are oversized.");
  return descriptions;
}

function normalizeReplyMetadata(value) {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("reply metadata must be a JSON object.");
  }
  let serialized;
  try { serialized = JSON.stringify(value); } catch { throw new Error("reply metadata must be JSON-serializable."); }
  if (Buffer.byteLength(serialized, "utf8") > MVP_CONFIG.max_reply_metadata_bytes) {
    throw new Error("reply metadata is oversized.");
  }
  const jsonValue = JSON.parse(serialized);
  assertNoAuthorityMetadata(jsonValue);
  assertNoSecretsDeep(jsonValue, "reply metadata");
  return sanitizeForLog(jsonValue);
}

function assertNoAuthorityMetadata(value, currentPath = "reply metadata") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoAuthorityMetadata(entry, `${currentPath}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
    if (AUTHORITY_FIELDS.has(normalized)) throw new Error(`Reply metadata cannot contain authority field: ${currentPath}.${key}`);
    assertNoAuthorityMetadata(child, `${currentPath}.${key}`);
  }
}

export function normalizeSubmission(input, { requireExistingRepositoryRoot = true, requireGitRepository = true } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Submission must be an object.");
  }
  assertSubmissionFields(input);
  const repositoryRoot = findInputValue(input, ["repositoryRoot", "repoRoot", "repository_root"], "repository root");
  const tasks = findInputValue(input, ["tasks", "taskDescriptions", "task_descriptions"], "tasks");
  const replyMetadata = findInputValue(input, ["replyMetadata", "reply_metadata", "reply"], "reply metadata");
  const descriptions = normalizeDescriptions(tasks);
  const metadata = normalizeReplyMetadata(replyMetadata);
  const secretInput = { task_descriptions: descriptions, reply_metadata: metadata };
  assertNoSecretsDeep(secretInput, "submission");
  return {
    repository_root: normalizeRepositoryRoot(repositoryRoot, {
      requireExisting: requireExistingRepositoryRoot,
      requireGitRepository,
    }),
    task_descriptions: descriptions,
    reply_metadata: metadata,
  };
}

export function createBatch(input, {
  clock = Date,
  idFactory,
  requireExistingRepositoryRoot = true,
  requireGitRepository = true,
} = {}) {
  const normalized = normalizeSubmission(input, { requireExistingRepositoryRoot, requireGitRepository });
  const submittedEpoch = clockEpoch(clock);
  const submittedAt = new Date(submittedEpoch).toISOString();
  const expiresAt = new Date(submittedEpoch + MVP_CONFIG.batch_expiry_ms).toISOString();
  const submissionId = generatedId(idFactory, "sub");
  const batchId = generatedId(idFactory, "batch");
  const tasks = normalized.task_descriptions.map((description, index) => ({
    task_id: generatedId(idFactory, "task"),
    position: index + 1,
    description,
  }));
  const batch = {
    schema_version: MVP_CONFIG.schema_version,
    batch_id: batchId,
    submission_id: submissionId,
    repository_root: normalized.repository_root,
    submitted_at: submittedAt,
    expires_at: expiresAt,
    state: "QUEUED",
    claim: null,
    queue_sequence: null,
    tasks,
    reply_metadata: normalized.reply_metadata,
    correction_cycles: 0,
  };
  assertNoSecretsDeep(batch, "accepted batch");
  if (Buffer.byteLength(JSON.stringify(batch), "utf8") > MVP_CONFIG.max_batch_bytes) {
    throw new Error("Submission batch is oversized.");
  }
  return batch;
}

export function submitBatch(input, options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("submitBatch options must be an object.");
  }
  const allowedOptions = new Set(["clock", "idFactory"]);
  for (const key of Object.keys(options)) {
    if (!allowedOptions.has(key)) {
      throw new Error("submitBatch does not permit custom " + key + "; use the canonical internal RuntimeStore.");
    }
  }
  const { clock = Date, idFactory } = options;
  const batch = createBatch(input, {
    clock,
    idFactory,
    requireExistingRepositoryRoot: true,
    requireGitRepository: true,
  });
  const runtimeStore = new RuntimeStore(internalRuntimeStorePath(batch.repository_root), { clock });
  const stored = runtimeStore.enqueueBatch(batch);
  return sanitizeForLog(stored);
}

export const submit = submitBatch;
export const acceptSubmission = submitBatch;

export function defaultRuntimeStorePath(repositoryRoot) {
  return internalRuntimeStorePath(assertGitWorktree(repositoryRoot, "repository root"));
}
