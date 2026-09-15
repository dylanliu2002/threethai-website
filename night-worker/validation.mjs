import crypto from "node:crypto";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { assertNoSecretsDeep, redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { deriveActualChanges } from "../workflow/git-evidence.mjs";
import { IMPLEMENTATION_MODEL_NAME, IMPLEMENTATION_REASONING_EFFORT } from "./config.mjs";
import {
  assertScopeAllowed,
  isPathAllowed,
  normalizeAllowlist,
  TRUSTED_BASE_REF,
  validateTaskPlan as validateTaskPlanSchema,
} from "./schemas.mjs";
import {
  assertCanonicalIsolatedWorktree,
  resolveTrustedBaseCommit,
  strictCommitSha,
} from "./worktrees.mjs";
import { RuntimeStore } from "./runtime-store.mjs";
import { defaultRuntimeStorePath } from "./submission.mjs";
import { ThreadBroker } from "./thread-broker.mjs";
import { AppServerClient, isGenuineAppServerClient } from "./app-server-client.mjs";

const MAX_OUTPUT_CHARS = 4_000;
const INTERNAL_RUNTIME_FILE = ".night-worker/runtime.json";
const SHELL_CONTROL_PATTERN = /[;&|<>`$(){}\[\]\r\n^%]/;
const PLAN_VALIDATION_GATE_GROUPS = Object.freeze({ test: "test", static: "static" });
const FIXED_PACKAGE_EXECUTABLES = new Set(["npm", "pnpm", "yarn", "bun"]);
const FIXED_SOURCE_EXTENSIONS = new Set([".cjs", ".js", ".mjs"]);
const FORBIDDEN_FILESYSTEM_EXECUTABLES = new Set([
  "rm", "rmdir", "del", "erase", "remove-item", "move-item", "mv", "copy-item", "cp", "copy",
  "mkdir", "new-item", "chmod", "chown", "install", "uninstall",
]);
const FORBIDDEN_INTERPRETER_EXECUTABLES = new Set([
  "python", "python2", "python3", "perl", "ruby", "php", "java", "dotnet", "wsl", "ssh", "curl", "wget",
]);
const TERMINAL_SUCCESS_STATES = new Set(["complete", "completed", "succeeded", "success", "done"]);
const TERMINAL_FAILURE_STATES = new Set(["failed", "failure", "error", "errored", "cancelled", "canceled", "aborted", "rejected", "interrupted"]);
const VALIDATION_EVIDENCE = new WeakSet();
const BASE_THREAD_BROKER_READ_WORKER = ThreadBroker.prototype.readWorker;
const BASE_RUNTIME_GET_BATCH = RuntimeStore.prototype.getBatch;
const BASE_RUNTIME_GET_WORKER_MAPPING = RuntimeStore.prototype.getWorkerMapping;
const BASE_RUNTIME_LOAD = RuntimeStore.prototype.load;
const BASE_RUNTIME_FILE_PATH_GETTER = Object.getOwnPropertyDescriptor(RuntimeStore.prototype, "filePath")?.get;
const BASE_RUNTIME_AUTHORITY_METHODS = new Map([
  ["load", BASE_RUNTIME_LOAD],
  ["getBatch", BASE_RUNTIME_GET_BATCH],
  ["getWorkerMapping", BASE_RUNTIME_GET_WORKER_MAPPING],
]);
const BASE_RUNTIME_PROTOTYPE_DESCRIPTORS = new Map(
  Object.getOwnPropertyNames(RuntimeStore.prototype)
    .filter((name) => name !== "constructor")
    .map((name) => [name, Object.getOwnPropertyDescriptor(RuntimeStore.prototype, name)]),
);

function text(value, label) {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function trimOutput(value) {
  return redactSecrets(String(value ?? "")).slice(0, MAX_OUTPUT_CHARS);
}

function cloneValue(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function flushToken(tokens, current, started) {
  if (started) tokens.push(current);
  return { current: "", started: false };
}

function commandTokens(command) {
  const value = text(command, "validation command");
  if (SHELL_CONTROL_PATTERN.test(value)) {
    throw new Error("Validation commands cannot use shell control or injection characters.");
  }
  const tokens = [];
  let current = "";
  let started = false;
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === quote) {
        quote = null;
        started = true;
      } else if (character === "\\" && quote === '"' && index + 1 < value.length) {
        current += value[index + 1];
        started = true;
        index += 1;
      } else {
        current += character;
        started = true;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      started = true;
      continue;
    }
    if (/\s/.test(character)) {
      const flushed = flushToken(tokens, current, started);
      current = flushed.current;
      started = flushed.started;
      continue;
    }
    current += character;
    started = true;
  }
  if (quote) throw new Error("Validation command contains an unterminated quote.");
  if (started) tokens.push(current);
  if (tokens.length === 0) throw new Error("Validation command cannot be empty.");
  validateNonDestructiveCommand(tokens);
  if (tokens[0].toLocaleLowerCase("en-US") === "node"
    && ["--test", "--check"].includes(tokens[1]?.toLocaleLowerCase("en-US"))
    && tokens.length < 3) {
    throw new Error("Node validation must target an explicit module path.");
  }
  return tokens;
}

function executableName(value) {
  return String(value).split(/[\\/]/).at(-1).replace(/\.(?:cmd|exe|bat)$/i, "").toLocaleLowerCase("en-US");
}

function validateNonDestructiveCommand(tokens) {
  if (/[\\/:]/.test(tokens[0])) {
    throw new Error("Validation commands must invoke an approved bare executable name.");
  }
  const executable = tokens[0].toLocaleLowerCase("en-US");
  if (["cmd", "powershell", "pwsh", "bash", "sh", "zsh"].includes(executable)) {
    throw new Error("Validation commands cannot invoke a shell wrapper.");
  }
  if (FORBIDDEN_FILESYSTEM_EXECUTABLES.has(executable)) {
    throw new Error("Validation commands cannot mutate the filesystem.");
  }
  if (FORBIDDEN_INTERPRETER_EXECUTABLES.has(executable)) {
    throw new Error("Validation commands cannot invoke an arbitrary interpreter script.");
  }
  if (executable === "codex" || tokens.some((token) => executableName(token) === "codex")) {
    throw new Error("Validation commands cannot use the codex exec worker mechanism.");
  }
  if (tokens.some((token) => ["--help", "-h"].includes(token.toLocaleLowerCase("en-US")))) {
    throw new Error("Validation commands cannot use help or informational command spoofing.");
  }
  if (["node", "deno", "bun"].includes(executable)
    && tokens.some((token) => ["-e", "--eval", "--require", "-r", "-p", "--print", "--input-type"].includes(token))) {
    throw new Error("Validation commands cannot execute caller-supplied scripts.");
  }
  if (executable === "git" || tokens.some((token) => executableName(token) === "git")) {
    throw new Error("Validation commands cannot run mutating Git commands or aliases.");
  }
  if (FIXED_PACKAGE_EXECUTABLES.has(executable)
    && tokens[1]?.toLocaleLowerCase("en-US") === "run"
    && !["lint", "test"].includes(tokens[2]?.toLocaleLowerCase("en-US"))) {
    throw new Error("Validation commands cannot invoke arbitrary npm scripts.");
  }
  if (tokens.some((token) => ["vercel", "netlify", "deploy", "deployment", "publish"].includes(token.toLocaleLowerCase("en-US")))) {
    throw new Error("Validation commands cannot deploy or mutate production.");
  }
  return true;
}

function validationPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new Error(`${label} must be a repository-relative path.`);
  }
  const normalized = value.replaceAll("\\", "/");
  if (path.isAbsolute(normalized) || normalized.startsWith("/")
    || normalized.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new Error(`${label} must be a repository-relative path.`);
  }
  if (normalized.startsWith("-")) throw new Error(`${label} cannot be a command option.`);
  return normalized;
}

function assertCommandPathAllowed(value, allowlist, label) {
  const candidate = validationPath(value, label);
  if (!Array.isArray(allowlist) || allowlist.length === 0) {
    throw new Error("Validation command paths require the canonical task allowlist.");
  }
  const normalizedAllowlist = normalizeAllowlist(allowlist);
  if (!isPathAllowed(candidate, normalizedAllowlist)) {
    throw new Error(`${label} must be inside the task allowlist.`);
  }
  return candidate;
}

function assertAuthoritativeValidationPath(candidate, actualPaths, label) {
  if (!Array.isArray(actualPaths) || actualPaths.length === 0) {
    throw new Error(`${label} requires authoritative changed Git paths.`);
  }
  const normalized = actualPaths.map((value) => validationPath(value, "authoritative changed path").toLocaleLowerCase("en-US"));
  if (!normalized.includes(candidate.toLocaleLowerCase("en-US"))) {
    throw new Error(`${label} must target an authoritative changed path.`);
  }
  return candidate;
}

function semanticValidationGate(tokens, { allowlist, actualPaths } = {}) {
  const executable = tokens[0].toLocaleLowerCase("en-US");
  if (executable === "node" && tokens[1] === "--test") {
    if (tokens.slice(2).some((token) => token.startsWith("-"))) {
      throw new Error("Node test validation cannot accept arbitrary command options.");
    }
    const paths = tokens.slice(2);
    if (paths.length === 0) throw new Error("Node test validation must target a test module.");
    for (const value of paths) {
      const candidate = assertCommandPathAllowed(value, allowlist, "Node test path");
      if (!/\.test\.(?:cjs|js|mjs)$/i.test(candidate)) {
        throw new Error("Node test validation must target a test module.");
      }
      if (actualPaths !== undefined) assertAuthoritativeValidationPath(candidate, actualPaths, "Node test validation");
    }
    return "test";
  }
  if (executable === "node" && tokens[1] === "--check") {
    if (tokens.length < 3 || tokens.slice(2).some((token) => token.startsWith("-"))) {
      throw new Error("Node static validation must target an allowlisted source module.");
    }
    for (const value of tokens.slice(2)) {
      const candidate = assertCommandPathAllowed(value, allowlist, "Node static-check path");
      if (!FIXED_SOURCE_EXTENSIONS.has(path.extname(candidate).toLocaleLowerCase("en-US"))) {
        throw new Error("Node static validation must target a JavaScript module.");
      }
      if (actualPaths !== undefined) assertAuthoritativeValidationPath(candidate, actualPaths, "Node static validation");
    }
    return "static";
  }
  if (FIXED_PACKAGE_EXECUTABLES.has(executable)
    && tokens.length === 2 && tokens[1].toLocaleLowerCase("en-US") === "test") return "test";
  if (FIXED_PACKAGE_EXECUTABLES.has(executable)
    && tokens.length === 3
    && tokens[1].toLocaleLowerCase("en-US") === "run"
    && tokens[2].toLocaleLowerCase("en-US") === "lint") return "static";
  throw new Error("Validation commands must use approved fixed validation gates.");
}

function assertMinimumValidationGates(commands, options = {}) {
  if (!Array.isArray(commands) || commands.length < 2) {
    throw new Error("Task plans require at least two fixed validation gates.");
  }
  const tokenSets = commands.map((command) => commandTokens(command));
  const gates = tokenSets.map((tokens) => semanticValidationGate(tokens, options));
  const missing = Object.keys(PLAN_VALIDATION_GATE_GROUPS)
    .filter((gate) => !gates.includes(gate));
  if (missing.length > 0) {
    throw new Error(`Task plans require fixed validation gates: ${missing.join(" and ")}.`);
  }
  return { tokenSets, gates };
}

export function assertSafeValidationCommands(commands, options = {}) {
  const allowed = new Set(["allowlist", "actualPaths"]);
  for (const key of Object.keys(options ?? {})) {
    if (!allowed.has(key)) throw new Error(`Validation command policy cannot accept caller override: ${key}`);
  }
  return assertMinimumValidationGates(commands, options);
}

function defaultCommandRunner(command, { cwd, timeoutMs = 120_000 } = {}) {
  const [executable, ...args] = commandTokens(command);
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    timeout: timeoutMs,
    maxBuffer: 2 * 1024 * 1024,
  });
  return {
    command,
    code: result.status,
    signal: result.signal,
    timed_out: result.error?.code === "ETIMEDOUT",
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr ?? result.error?.message),
    passed: result.status === 0 && !result.error,
  };
}

function normalizeCommandResult(result, command) {
  if (typeof result === "number") {
    return { command, code: result, passed: result === 0, stdout: "", stderr: "" };
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Validation command runner returned an invalid result.");
  }
  const passed = result.passed !== undefined
    ? result.passed === true
    : result.ok !== undefined ? result.ok === true
      : result.code === 0 || result.exitCode === 0 || result.status === 0 || result.status === "PASS";
  return {
    command,
    code: result.code ?? (passed ? 0 : 1),
    signal: result.signal ?? null,
    timed_out: result.timed_out === true,
    passed,
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr),
  };
}

export function runValidationCommands(commands, options = {}) {
  const allowed = new Set(["cwd", "allowlist", "actualPaths"]);
  for (const key of Object.keys(options ?? {})) {
    if (!allowed.has(key)) throw new Error(`Validation cannot accept caller override: ${key}`);
  }
  const { cwd, allowlist, actualPaths } = options;
  assertSafeValidationCommands(commands, { allowlist, actualPaths });
  text(cwd, "validation cwd");
  const results = [];
  for (const command of commands) {
    commandTokens(command);
    try {
      const result = defaultCommandRunner(command, { cwd });
      const normalized = normalizeCommandResult(result, command);
      results.push(normalized);
      if (!normalized.passed) break;
    } catch (error) {
      results.push({
        command,
        code: null,
        passed: false,
        stdout: "",
        stderr: trimOutput(error instanceof Error ? error.message : error),
        error: true,
      });
      break;
    }
  }
  return {
    passed: results.length === commands.length && results.every((result) => result.passed),
    results,
  };
}

function git(repositoryRoot, args) {
  return String(execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 32 * 1024,
  }) ?? "").trim();
}

function assertAllowedValidationOptions(options, allowed, label) {
  for (const key of Object.keys(options ?? {})) {
    if (!allowed.has(key)) throw new Error(`${label} cannot accept caller override: ${key}`);
  }
}

export function resolveMergeBase(repositoryRoot, ...overrides) {
  if (overrides.length > 0) throw new Error(`Merge-base is fixed to trusted ${TRUSTED_BASE_REF}.`);
  const root = text(repositoryRoot, "repositoryRoot");
  const baseSha = resolveTrustedBaseCommit(root);
  const headSha = strictCommitSha(git(root, ["rev-parse", "--verify", "--end-of-options", "HEAD^{commit}"]), "worktree HEAD");
  const mergeBase = strictCommitSha(git(root, ["merge-base", baseSha, headSha]), "worktree merge-base");
  if (mergeBase !== baseSha) throw new Error("Worktree is not based on the trusted origin/main commit.");
  return baseSha;
}

function pathValue(change) {
  return [change.source, change.destination].filter(Boolean);
}

function isInternalRuntimePath(value) {
  return value.replaceAll("\\", "/").toLocaleLowerCase("en-US") === INTERNAL_RUNTIME_FILE;
}

export function deriveAuthoritativeGitScope(options = {}) {
  assertAllowedValidationOptions(options, new Set(["repositoryRoot"]), "Git scope derivation");
  const root = text(options.repositoryRoot, "repositoryRoot");
  const mergeBase = resolveMergeBase(root);
  const raw = deriveActualChanges(root, mergeBase);
  const internal = raw.changes.filter((change) => pathValue(change).every(isInternalRuntimePath));
  const changes = raw.changes.filter((change) => !pathValue(change).every(isInternalRuntimePath));
  const paths = [...new Set(changes.flatMap(pathValue))].sort();
  const internalPaths = [...new Set(internal.flatMap(pathValue))].sort();
  const evidence = {
    base_ref: TRUSTED_BASE_REF,
    merge_base: mergeBase,
    changes,
    paths,
    internal_runtime_paths: internalPaths,
    reported_paths_are_advisory: true,
  };
  return {
    ...evidence,
    evidence_digest: digest(evidence),
  };
}

export const deriveGitScope = deriveAuthoritativeGitScope;

function samePath(left, right) {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return path.relative(a, b) === "" && path.relative(b, a) === "";
}

function assertCanonicalRuntimeStoreMethods(store) {
  if (!(store instanceof RuntimeStore) || Object.getPrototypeOf(store) !== RuntimeStore.prototype) {
    throw new Error("Task validation requires the canonical real RuntimeStore.");
  }
  const currentNames = Object.getOwnPropertyNames(RuntimeStore.prototype).filter((name) => name !== "constructor");
  if (currentNames.length !== BASE_RUNTIME_PROTOTYPE_DESCRIPTORS.size
    || currentNames.some((name) => !BASE_RUNTIME_PROTOTYPE_DESCRIPTORS.has(name))) {
    throw new Error("Task validation requires an unmodified canonical RuntimeStore authority.");
  }
  for (const [method, expectedDescriptor] of BASE_RUNTIME_PROTOTYPE_DESCRIPTORS) {
    const descriptor = Object.getOwnPropertyDescriptor(RuntimeStore.prototype, method);
    const sameDescriptor = descriptor && descriptor.value === expectedDescriptor.value
      && descriptor.get === expectedDescriptor.get
      && descriptor.set === expectedDescriptor.set
      && descriptor.enumerable === expectedDescriptor.enumerable
      && descriptor.configurable === expectedDescriptor.configurable
      && descriptor.writable === expectedDescriptor.writable;
    if (!sameDescriptor
      || (BASE_RUNTIME_AUTHORITY_METHODS.has(method)
        && descriptor.value !== BASE_RUNTIME_AUTHORITY_METHODS.get(method))
      || Object.prototype.hasOwnProperty.call(store, method)) {
      throw new Error("Task validation requires an unmodified canonical RuntimeStore authority.");
    }
  }
  const filePathDescriptor = Object.getOwnPropertyDescriptor(RuntimeStore.prototype, "filePath");
  if (!filePathDescriptor || filePathDescriptor.get !== BASE_RUNTIME_FILE_PATH_GETTER
    || Object.prototype.hasOwnProperty.call(store, "filePath")) {
    throw new Error("Task validation requires an unmodified canonical RuntimeStore authority.");
  }
  const fileDescriptor = Object.getOwnPropertyDescriptor(store, "file_path");
  if (!fileDescriptor || !Object.prototype.hasOwnProperty.call(fileDescriptor, "value")
    || typeof fileDescriptor.value !== "string") {
    throw new Error("Task validation requires an unmodified canonical RuntimeStore authority.");
  }
  return store;
}

export function assertCanonicalRuntimeStoreAuthority(store, repositoryRoot) {
  assertCanonicalRuntimeStoreMethods(store);
  const expected = defaultRuntimeStorePath(text(repositoryRoot, "repositoryRoot"));
  if (!samePath(expected, filePathValue(store)) || !samePath(expected, store.file_path)) {
    throw new Error("Task validation requires the canonical submitted repository RuntimeStore.");
  }
  return store;
}

function filePathValue(store) {
  if (typeof BASE_RUNTIME_FILE_PATH_GETTER !== "function") {
    throw new Error("Task validation requires the canonical RuntimeStore filePath authority.");
  }
  return Reflect.apply(BASE_RUNTIME_FILE_PATH_GETTER, store, []);
}

function runtimeState(store) {
  return Reflect.apply(BASE_RUNTIME_LOAD, store, []);
}

function runtimeBatch(store, batchId) {
  const state = runtimeState(store);
  const batch = state.batches.find((item) => item.batch_id === batchId);
  return batch ? cloneValue(batch) : null;
}

function runtimeWorkerMapping(store, batchId, taskId, role) {
  const state = runtimeState(store);
  const worker = state.workers.find((item) => item.batch_id === batchId
    && item.task_id === taskId && item.role === role);
  return worker ? cloneValue(worker) : null;
}

export function readCanonicalBatch(store, batchId) {
  assertCanonicalRuntimeStoreMethods(store);
  return runtimeBatch(store, batchId);
}

export function readCanonicalWorkerMapping(store, batchId, taskId, role) {
  assertCanonicalRuntimeStoreMethods(store);
  return runtimeWorkerMapping(store, batchId, taskId, role);
}

function assertCanonicalValidationStore(store, batch) {
  assertCanonicalRuntimeStoreAuthority(store, batch.repository_root);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

class ValidationWorkerRuntimeStoreView extends RuntimeStore {
  constructor(sharedStore, batchId, worktree) {
    super(sharedStore.filePath, { clock: sharedStore.clock });
    this.validation_batch_id = batchId;
    this.validation_runtime_path = defaultRuntimeStorePath(worktree);
  }

  get filePath() { return this.validation_runtime_path; }

  load() { return runtimeState(this); }

  getWorkerMapping(batchId, taskId, role) {
    return runtimeWorkerMapping(this, batchId, taskId, role);
  }

  getBatch(batchId) {
    const batch = runtimeBatch(this, batchId);
    if (!batch || batch.batch_id !== this.validation_batch_id) return batch;
    return {
      ...batch,
      repository_root: path.dirname(path.dirname(this.validation_runtime_path)),
    };
  }
}

function turnFromRead(response, turnId) {
  const turns = response?.thread?.turns ?? response?.turns ?? [];
  if (!Array.isArray(turns)) throw new Error("App Server thread/read returned invalid turns.");
  const matching = turns.filter((turn) => turn && typeof turn === "object" && turn.id === turnId);
  if (matching.length !== 1) throw new Error(`App Server thread/read did not return exactly one durable turn ${turnId}.`);
  return matching[0];
}

function terminalTurnStatus(turn) {
  const value = turn?.status ?? turn?.state ?? turn?.lifecycle_state ?? turn?.lifecycleState;
  if (typeof value !== "string") return "PENDING";
  const normalized = value.replace(/[_-]/g, "").toLocaleLowerCase("en-US");
  if (TERMINAL_SUCCESS_STATES.has(normalized)) return "SUCCEEDED";
  if (TERMINAL_FAILURE_STATES.has(normalized)) return "FAILED";
  return "PENDING";
}

async function deriveTerminalWorkerEvidence({ store, batch, plan, client }) {
  if (!(client instanceof AppServerClient) || !isGenuineAppServerClient(client)) {
    throw new Error("Task validation requires a genuine constructed Task 61 App Server client.");
  }
  const mapping = readCanonicalWorkerMapping(store, batch.batch_id, plan.task_id, "IMPLEMENTATION");
  if (!mapping || mapping.lifecycle_state !== "COMPLETED") {
    throw new Error("Task validation requires a durable terminal-success implementation mapping.");
  }
  if (mapping.batch_id !== batch.batch_id || mapping.submission_id !== batch.submission_id
    || mapping.task_id !== plan.task_id || mapping.role !== "IMPLEMENTATION"
    || mapping.model !== IMPLEMENTATION_MODEL_NAME || mapping.effort !== IMPLEMENTATION_REASONING_EFFORT
    || mapping.cwd !== plan.worktree || typeof mapping.thread_id !== "string" || mapping.thread_id.length === 0
    || typeof mapping.turn_id !== "string" || mapping.turn_id.length === 0) {
    throw new Error("Durable implementation mapping identity or policy is invalid.");
  }
  const lifecycleStore = new ValidationWorkerRuntimeStoreView(store, batch.batch_id, plan.worktree);
  const broker = new ThreadBroker({ client, store: lifecycleStore });
  const response = await Reflect.apply(BASE_THREAD_BROKER_READ_WORKER, broker, [{
    batchId: batch.batch_id,
    taskId: plan.task_id,
    role: "IMPLEMENTATION",
  }]);
  const returnedThreadId = response?.thread?.id;
  if (returnedThreadId !== undefined && returnedThreadId !== mapping.thread_id) {
    throw new Error("App Server thread/read returned the wrong durable worker thread.");
  }
  const turn = turnFromRead(response, mapping.turn_id);
  const status = terminalTurnStatus(turn);
  if (status !== "SUCCEEDED") {
    throw new Error(`Durable implementation turn ${mapping.turn_id} is not terminal-success: ${status}.`);
  }
  const returnedClientMessageId = turn.clientUserMessageId
    ?? turn.client_user_message_id
    ?? turn.clientRequestId
    ?? turn.client_request_id;
  if (returnedClientMessageId !== undefined && returnedClientMessageId !== mapping.client_user_message_id) {
    throw new Error("App Server terminal turn does not match the durable worker client message identity.");
  }
  for (const [field, expected] of [["model", mapping.model], ["effort", mapping.effort]]) {
    if (turn[field] !== undefined && turn[field] !== expected) {
      throw new Error(`App Server terminal turn returned an unexpected ${field}.`);
    }
  }
  return {
    source: "canonical-runtime-store+typed-thread-read",
    batch_id: batch.batch_id,
    submission_id: batch.submission_id,
    task_id: plan.task_id,
    role: "IMPLEMENTATION",
    lifecycle_state: mapping.lifecycle_state,
    thread_id: mapping.thread_id,
    turn_id: mapping.turn_id,
    turn_status: status,
  };
}

export async function validateTaskPlanExecution(options = {}) {
  assertAllowedValidationOptions(options, new Set(["plan", "repositoryRoot", "store", "client", "reportedChangedFiles"]), "Task validation");
  const { plan, repositoryRoot, store, client, reportedChangedFiles = [] } = options;
  const evidenceBase = {
    plan_task_id: plan?.task_id ?? null,
    reported_paths: Array.isArray(reportedChangedFiles) ? reportedChangedFiles.map(String) : [],
  };
  let normalizedPlan;
  let scope = null;
  try {
    normalizedPlan = validateTaskPlanSchema(plan, { requireReady: false });
    assertNoSecretsDeep(evidenceBase, "validation evidence");
    const durableBatch = readCanonicalBatch(store, normalizedPlan.batch_id);
    if (!durableBatch || durableBatch.batch_id !== normalizedPlan.batch_id
      || durableBatch.submission_id !== normalizedPlan.submission_id) {
      throw new Error("Task validation requires the exact durable submitted batch.");
    }
    assertCanonicalValidationStore(store, durableBatch);
    if (!samePath(repositoryRoot, durableBatch.repository_root)
      || path.resolve(repositoryRoot) !== path.resolve(durableBatch.repository_root)) {
      throw new Error("Task validation repository root does not match the submitted batch.");
    }
    assertCanonicalIsolatedWorktree({
      repositoryRoot: text(repositoryRoot, "repositoryRoot"),
      worktree: normalizedPlan.worktree,
      branch: normalizedPlan.branch,
    });
    scope = deriveAuthoritativeGitScope({ repositoryRoot: normalizedPlan.worktree });
    if (normalizedPlan.base_sha !== scope.merge_base) {
      throw new Error("Task plan base_sha does not match the fresh trusted origin/main commit.");
    }
    if (scope.paths.length === 0) {
      throw new Error("A task cannot become publishable without authoritative Git changes.");
    }
    assertScopeAllowed(scope.paths, normalizedPlan.allowlist);
    const durableWorker = await deriveTerminalWorkerEvidence({ store, batch: durableBatch, plan: normalizedPlan, client });
    assertCanonicalRuntimeStoreAuthority(store, durableBatch.repository_root);
    const validation = runValidationCommands(normalizedPlan.validation_commands, {
      cwd: normalizedPlan.worktree,
      allowlist: normalizedPlan.allowlist,
      actualPaths: scope.paths,
    });
    assertCanonicalRuntimeStoreAuthority(store, durableBatch.repository_root);
    const evidence = {
      ...evidenceBase,
      plan: normalizedPlan,
      scope,
      actual_paths: scope.paths,
      merge_base: scope.merge_base,
      durable_worker: durableWorker,
      validation,
      scope_passed: true,
      validation_passed: validation.passed,
      passed: validation.passed,
      publishable: validation.passed,
      status: validation.passed ? "PUBLISHABLE" : "REJECTED",
    };
    const result = deepFreeze({
      ...evidence,
      evidence_digest: digest(evidence),
    });
    if (result.publishable === true && result.passed === true && result.scope_passed === true
      && result.validation_passed === true) {
      VALIDATION_EVIDENCE.add(result);
    }
    return result;
  } catch (error) {
    const evidence = {
      ...evidenceBase,
      scope,
      actual_paths: scope?.paths ?? [],
      merge_base: scope?.merge_base ?? null,
      validation: { passed: false, results: [] },
      durable_worker: null,
      scope_passed: scope !== null && (scope.paths?.length ?? 0) > 0,
      validation_passed: false,
      passed: false,
      publishable: false,
      status: "REJECTED",
      error: redactSecrets(error instanceof Error ? error.message : String(error)),
    };
    return {
      ...evidence,
      evidence_digest: digest(evidence),
    };
  }
}

export const validateExecution = validateTaskPlanExecution;
export const validateTask = validateTaskPlanExecution;
export const validatePlanExecution = validateTaskPlanExecution;

export function assertPublishable(evidence) {
  let digestMatches = false;
  try {
    const { evidence_digest: ignored, ...body } = evidence ?? {};
    digestMatches = typeof evidence?.evidence_digest === "string"
      && evidence.evidence_digest === digest(body);
  } catch {}
  if (!VALIDATION_EVIDENCE.has(evidence) || !Object.isFrozen(evidence) || !digestMatches
    || evidence.publishable !== true || evidence.passed !== true || evidence.scope_passed !== true
    || evidence.validation_passed !== true || !Array.isArray(evidence.actual_paths)
    || evidence.actual_paths.length === 0
    || evidence.durable_worker?.source !== "canonical-runtime-store+typed-thread-read"
    || evidence.durable_worker?.turn_status !== "SUCCEEDED") {
    throw new Error(`Task is not publishable: ${sanitizeForLog(evidence?.error ?? "validation failed")}`);
  }
  return evidence;
}

export {
  PLAN_VALIDATION_GATE_GROUPS,
  commandTokens,
  defaultCommandRunner,
};
