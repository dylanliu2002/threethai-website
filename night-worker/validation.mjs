import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { assertNoSecretsDeep, redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { deriveActualChanges } from "../workflow/git-evidence.mjs";
import {
  assertScopeAllowed,
  TRUSTED_BASE_REF,
  validateTaskPlan as validateTaskPlanSchema,
} from "./schemas.mjs";
import {
  assertCanonicalIsolatedWorktree,
  resolveTrustedBaseCommit,
  strictCommitSha,
} from "./worktrees.mjs";

const MAX_OUTPUT_CHARS = 4_000;
const INTERNAL_RUNTIME_FILE = ".night-worker/runtime.json";
const SHELL_CONTROL_PATTERN = /[;&|<>`$(){}\[\]\r\n^%]/;
const FORBIDDEN_GIT_COMMANDS = new Set([
  "reset",
  "checkout",
  "clean",
  "push",
  "fetch",
  "merge",
  "rebase",
  "commit",
  "restore",
  "switch",
  "branch",
  "worktree",
  "update-ref",
  "config",
  "tag",
]);
const PLAN_VALIDATION_GATE_GROUPS = Object.freeze({ test: "test", static: "static" });

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

function flushToken(tokens, current, started) {
  if (started) tokens.push(current);
  return { current: "", started: false };
}

function commandTokens(command) {
  const value = text(command, "validation command");
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
    if (SHELL_CONTROL_PATTERN.test(character)) {
      throw new Error("Validation commands cannot use shell control or injection characters.");
    }
    current += character;
    started = true;
  }
  if (quote) throw new Error("Validation command contains an unterminated quote.");
  if (started) tokens.push(current);
  if (tokens.length === 0) throw new Error("Validation command cannot be empty.");
  validateNonDestructiveCommand(tokens);
  return tokens;
}

function executableName(value) {
  return String(value).split(/[\\/]/).at(-1).replace(/\.(?:cmd|exe|bat)$/i, "").toLocaleLowerCase("en-US");
}

function validateNonDestructiveCommand(tokens) {
  const executable = executableName(tokens[0]);
  if (["cmd", "powershell", "pwsh", "bash", "sh", "zsh"].includes(executable)) {
    throw new Error("Validation commands cannot invoke a shell wrapper.");
  }
  if (executable === "codex" && tokens.slice(1).some((token) => token.toLocaleLowerCase("en-US") === "exec")) {
    throw new Error("Validation commands cannot use the codex exec worker mechanism.");
  }
  if (["node", "deno", "bun"].includes(executable)
    && tokens.some((token) => ["-e", "--eval", "--require", "-r"].includes(token))) {
    throw new Error("Validation commands cannot execute caller-supplied scripts.");
  }
  const gitIndex = tokens.findIndex((token) => executableName(token) === "git");
  if (gitIndex >= 0) {
    for (let index = gitIndex + 1; index < tokens.length; index += 1) {
      const token = tokens[index].toLocaleLowerCase("en-US");
      if (token === "-c" || token === "-C" || token === "--git-dir" || token === "--work-tree") {
        index += 1;
        continue;
      }
      if (token.startsWith("-")) continue;
      if (FORBIDDEN_GIT_COMMANDS.has(token)) {
        throw new Error(`Validation commands cannot run mutating Git subcommand: ${token}`);
      }
      break;
    }
  }
  const lower = tokens.map((token) => token.toLocaleLowerCase("en-US"));
  if (["npm", "pnpm", "yarn", "bun"].includes(executable)
    && lower.some((token) => token === "publish" || token === "install" || token === "ci")) {
    throw new Error("Validation commands cannot publish or install dependencies.");
  }
  if (lower.some((token) => ["vercel", "netlify", "deploy", "deployment"].includes(token))) {
    throw new Error("Validation commands cannot deploy or mutate production.");
  }
  return true;
}

function assertMinimumValidationGates(commands) {
  if (!Array.isArray(commands) || commands.length < 2) {
    throw new Error("Task plans require at least two fixed validation gates.");
  }
  const tokenSets = commands.map((command) => commandTokens(command));
  const hasSubcommand = (tokens, names) => names.some((name) => tokens.includes(name));
  const hasGate = (tokens, gate) => {
    const executable = executableName(tokens[0]);
    if (gate === "test") {
      if (executable === "node") return tokens.includes("--test");
      if (["npm", "pnpm", "yarn", "bun"].includes(executable)) return hasSubcommand(tokens, ["test"]);
      return false;
    }
    if (executable === "node") return tokens.includes("--check");
    if (["eslint", "tsc"].includes(executable)) return true;
    if (["npm", "pnpm", "yarn", "bun"].includes(executable)) return hasSubcommand(tokens, ["lint"]);
    return false;
  };
  const missing = Object.keys(PLAN_VALIDATION_GATE_GROUPS)
    .filter((gate) => !tokenSets.some((tokens) => hasGate(tokens, gate)));
  if (missing.length > 0) {
    throw new Error(`Task plans require fixed validation gates: ${missing.join(" and ")}.`);
  }
  return true;
}

export function assertSafeValidationCommands(commands) {
  return assertMinimumValidationGates(commands);
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
  assertSafeValidationCommands(commands);
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

export function validateTaskPlanExecution(options = {}) {
  assertAllowedValidationOptions(options, new Set(["plan", "repositoryRoot", "reportedChangedFiles"]), "Task validation");
  const { plan, repositoryRoot, reportedChangedFiles = [] } = options;
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
    });
    scope = deriveAuthoritativeGitScope({ repositoryRoot: normalizedPlan.worktree });
    if (normalizedPlan.base_sha !== scope.merge_base) {
      throw new Error("Task plan base_sha does not match the fresh trusted origin/main commit.");
    }
    if (scope.paths.length === 0) {
      throw new Error("A task cannot become publishable without authoritative Git changes.");
    }
    assertScopeAllowed(scope.paths, normalizedPlan.allowlist);
    const validation = runValidationCommands(normalizedPlan.validation_commands, {
      cwd: normalizedPlan.worktree,
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
  if (!evidence || evidence.publishable !== true || evidence.passed !== true
    || evidence.scope_passed !== true || evidence.validation_passed !== true
    || !Array.isArray(evidence.actual_paths) || evidence.actual_paths.length === 0) {
    throw new Error(`Task is not publishable: ${sanitizeForLog(evidence?.error ?? "validation failed")}`);
  }
  return evidence;
}

export {
  PLAN_VALIDATION_GATE_GROUPS,
  commandTokens,
  defaultCommandRunner,
};
