import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { assertNoSecretsDeep, redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { deriveActualChanges } from "../workflow/git-evidence.mjs";
import {
  assertScopeAllowed,
  validateTaskPlan as validateTaskPlanSchema,
} from "./schemas.mjs";
import { assertCanonicalIsolatedWorktree } from "./worktrees.mjs";

const MAX_OUTPUT_CHARS = 4_000;
const INTERNAL_RUNTIME_FILE = ".night-worker/runtime.json";
const UNSAFE_COMMAND_PATTERN = /(?:^|[\s\/\\])(?:git\s+(?:push|merge)|gh\s+pr|npm\s+publish|yarn\s+publish|pnpm\s+publish|vercel\s+|netlify\s+|deploy(?:ment)?\b|production\b|dns\b)/i;
const FORBIDDEN_WORKER_COMMAND_PATTERN = /\bcodex\s+exec\b|\b(?:terra|fallback|subagent)\b/i;
const SHELL_CONTROL_PATTERN = /[;&|<>`]|\$\(/;

function text(value, label) {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function trimOutput(value) {
  return redactSecrets(String(value ?? "")).slice(0, MAX_OUTPUT_CHARS);
}

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function commandTokens(command) {
  const value = text(command, "validation command");
  if (SHELL_CONTROL_PATTERN.test(value)) throw new Error("Validation commands cannot use shell control operators.");
  if (UNSAFE_COMMAND_PATTERN.test(value)) throw new Error("Validation commands cannot publish, deploy, or mutate production.");
  if (FORBIDDEN_WORKER_COMMAND_PATTERN.test(value)) throw new Error("Validation commands cannot use a forbidden worker mechanism or model policy.");
  const tokens = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|([^\s]+)/g;
  let match;
  while ((match = pattern.exec(value)) !== null) tokens.push(match[1] ?? match[2] ?? match[3]);
  if (tokens.length === 0) throw new Error("Validation command cannot be empty.");
  return tokens;
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

export function runValidationCommands(commands, {
  cwd,
  commandRunner = defaultCommandRunner,
} = {}) {
  if (!Array.isArray(commands) || commands.length === 0) throw new Error("Task plan requires validation commands.");
  if (typeof commandRunner !== "function") throw new Error("Validation command runner must be a function.");
  const results = [];
  for (const command of commands) {
    commandTokens(command);
    try {
      const result = commandRunner(command, { cwd });
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

function git(repositoryRoot, args, exec = execFileSync) {
  return String(exec("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 32 * 1024,
  }) ?? "").trim();
}

export function resolveMergeBase(repositoryRoot, baseRef = "origin/main", { exec = execFileSync } = {}) {
  const root = text(repositoryRoot, "repositoryRoot");
  const ref = text(baseRef, "baseRef");
  return git(root, ["merge-base", ref, "HEAD"], exec);
}

function pathValue(change) {
  return [change.source, change.destination].filter(Boolean);
}

function isInternalRuntimePath(value) {
  return value.replaceAll("\\", "/").toLocaleLowerCase("en-US") === INTERNAL_RUNTIME_FILE;
}

export function deriveAuthoritativeGitScope({
  repositoryRoot,
  baseRef = "origin/main",
  baseSha,
  exec = execFileSync,
} = {}) {
  const root = text(repositoryRoot, "repositoryRoot");
  const mergeBase = baseSha ?? resolveMergeBase(root, baseRef, { exec });
  const raw = deriveActualChanges(root, mergeBase, { exec });
  const internal = raw.changes.filter((change) => pathValue(change).every(isInternalRuntimePath));
  const changes = raw.changes.filter((change) => !pathValue(change).every(isInternalRuntimePath));
  const paths = [...new Set(changes.flatMap(pathValue))].sort();
  const internalPaths = [...new Set(internal.flatMap(pathValue))].sort();
  const evidence = {
    base_ref: baseRef,
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

export function validateTaskPlanExecution({
  plan,
  repositoryRoot,
  baseRef,
  baseSha,
  reportedChangedFiles = [],
  commandRunner,
  exec = execFileSync,
} = {}) {
  const evidenceBase = {
    plan_task_id: plan?.task_id ?? null,
    reported_paths: Array.isArray(reportedChangedFiles) ? reportedChangedFiles.map(String) : [],
  };
  let normalizedPlan;
  let scope = null;
  try {
    normalizedPlan = validateTaskPlanSchema(plan, { requireReady: false });
    assertNoSecretsDeep(evidenceBase, "validation evidence");
    assertCanonicalIsolatedWorktree({
      repositoryRoot: text(repositoryRoot, "repositoryRoot"),
      worktree: normalizedPlan.worktree,
      branch: normalizedPlan.branch,
      exec,
    });
    scope = deriveAuthoritativeGitScope({
      repositoryRoot: normalizedPlan.worktree,
      baseRef: baseRef ?? normalizedPlan.base_ref ?? "origin/main",
      baseSha,
      exec,
    });
    assertScopeAllowed(scope.paths, normalizedPlan.allowlist);
    const validation = runValidationCommands(normalizedPlan.validation_commands, {
      cwd: normalizedPlan.worktree,
      commandRunner,
    });
    const evidence = {
      ...evidenceBase,
      plan: normalizedPlan,
      scope,
      actual_paths: scope.paths,
      merge_base: scope.merge_base,
      validation,
      scope_passed: true,
      validation_passed: validation.passed,
      passed: validation.passed,
      publishable: validation.passed,
      status: validation.passed ? "PUBLISHABLE" : "REJECTED",
    };
    return {
      ...evidence,
      evidence_digest: digest(evidence),
    };
  } catch (error) {
    const evidence = {
      ...evidenceBase,
      scope,
      actual_paths: scope?.paths ?? [],
      merge_base: scope?.merge_base ?? null,
      validation: { passed: false, results: [] },
      scope_passed: false,
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
  if (!evidence || evidence.publishable !== true || evidence.passed !== true) {
    throw new Error(`Task is not publishable: ${sanitizeForLog(evidence?.error ?? "validation failed")}`);
  }
  return evidence;
}

export { commandTokens, defaultCommandRunner };
