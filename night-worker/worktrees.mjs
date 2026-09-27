import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertGitWorktree, canonicalDirectory } from "./submission.mjs";
import { TRUSTED_BASE_REF } from "./schemas.mjs";

const BRANCH_PATTERN = /^codex\/\d{2,}-[a-z0-9][a-z0-9-]*$/;
const MAX_GIT_OUTPUT = 32 * 1024;

function text(value, label) {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function baseReference(value) {
  const reference = text(value, "baseRef");
  if (reference !== TRUSTED_BASE_REF) {
    throw new Error(`Only the trusted ${TRUSTED_BASE_REF} base ref is permitted.`);
  }
  return reference;
}

function strictCommitSha(value, label = "base commit") {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/i.test(value.trim())) {
    throw new Error(`${label} must be a strict 40-character commit SHA.`);
  }
  return value.trim().toLocaleLowerCase("en-US");
}

function git(repositoryRoot, args) {
  let output;
  try {
    output = execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: MAX_GIT_OUTPUT,
      timeout: 15_000,
    });
  } catch (error) {
    const detail = String(error?.stderr ?? error?.message ?? error).trim().slice(0, 1_000);
    throw new Error(`Git command failed (${args.join(" ")}): ${detail}`);
  }
  return String(output ?? "").trim();
}

function slug(value) {
  const normalized = String(value ?? "task")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase("en-US")
    .slice(0, 72);
  return normalized || "task";
}

function shortId(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 8);
}

function canonicalTaskWorktreeRootFor(repositoryRoot) {
  const root = path.resolve(repositoryRoot);
  const name = slug(path.basename(root));
  return path.join(path.dirname(root), "worktrees", `${name}-${shortId(root)}`);
}

export function normalizeTaskBranch(branch) {
  const value = text(branch, "task plan branch");
  if (!BRANCH_PATTERN.test(value)) throw new Error("Task plan branch must match codex/NN-*.");
  return value;
}

export function deriveTaskBranch({ position, taskId, task_id: taskIdAlias, description, title } = {}) {
  if (!Number.isInteger(position) || position < 1) throw new Error("Task plan position must be a positive integer.");
  const identity = text(taskId ?? taskIdAlias, "taskId");
  const label = title ?? description;
  const branch = `codex/${String(position).padStart(2, "0")}-${slug(label)}-${shortId(identity)}`;
  return normalizeTaskBranch(branch);
}

export function deriveCanonicalTaskWorktreeRoot(repositoryRoot) {
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  return canonicalTaskWorktreeRootFor(root);
}

export function deriveTaskWorktreePath(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree path derivation", new Set(["repositoryRoot", "branch"]));
  const { repositoryRoot, branch } = options;
  const root = path.resolve(text(repositoryRoot, "repositoryRoot"));
  const normalizedBranch = normalizeTaskBranch(branch);
  const parent = canonicalTaskWorktreeRootFor(root);
  const directoryName = normalizedBranch.slice("codex/".length).replaceAll("/", "-");
  return path.join(parent, directoryName);
}

function canonicalExistingWorktree(directory, label = "task worktree") {
  return assertGitWorktree(canonicalDirectory(directory, label), label);
}

function samePath(left, right) {
  return path.relative(left, right) === "" && path.relative(right, left) === "";
}

function commonGitDirectory(directory) {
  const value = git(directory, ["rev-parse", "--git-common-dir"]);
  return path.resolve(directory, value);
}

function assertNoWorktreeHooks(options, label, allowedKeys) {
  for (const key of Object.keys(options ?? {})) {
    if (allowedKeys.has(key)) continue;
    throw new Error(`${label} cannot override its Git or execution primitive: ${key}`);
  }
}

export function resolveTrustedBaseCommit(repositoryRoot) {
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  let remoteOutput;
  try {
    remoteOutput = git(root, ["ls-remote", "--exit-code", "--refs", "origin", "refs/heads/main"]);
  } catch (error) {
    throw new Error(`Fresh origin/main provenance is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  const lines = remoteOutput.split(/\r?\n/).filter(Boolean);
  if (lines.length !== 1) throw new Error("Fresh origin/main provenance returned an unexpected ref set.");
  const [remoteValue, remoteRef, ...extra] = lines[0].split(/\s+/);
  if (extra.length > 0 || remoteRef !== "refs/heads/main") {
    throw new Error("Fresh origin/main provenance returned an unexpected ref.");
  }
  const remoteSha = strictCommitSha(remoteValue, "remote origin/main commit");
  const local = git(root, ["rev-parse", "--verify", "--end-of-options", `${TRUSTED_BASE_REF}^{commit}`]);
  const localSha = strictCommitSha(local, "trusted origin/main commit");
  if (remoteSha !== localSha) {
    throw new Error("Local origin/main does not match the fresh remote origin/main provenance.");
  }
  return remoteSha;
}

function assertTrustedBaseLineage(worktree, baseSha) {
  const trusted = strictCommitSha(baseSha, "trusted base commit");
  const head = strictCommitSha(git(worktree, ["rev-parse", "--verify", "--end-of-options", "HEAD^{commit}"]), "worktree HEAD");
  try {
    git(worktree, ["merge-base", "--is-ancestor", trusted, head]);
  } catch {
    throw new Error("Existing task worktree is not based on the trusted origin/main commit.");
  }
  return { base_sha: trusted, head_sha: head };
}

function isInternalRuntimePath(value) {
  return String(value ?? "").replaceAll("\\", "/").toLocaleLowerCase("en-US") === ".night-worker/runtime.json";
}

function assertCleanExceptRuntime(worktree) {
  const output = git(worktree, ["status", "--porcelain=v1", "--untracked-files=all", "-z", "--"]);
  const fields = output.split("\0").filter(Boolean);
  for (let index = 0; index < fields.length; index += 1) {
    const entry = fields[index];
    const candidate = entry.length >= 3 && entry[2] === " " ? entry.slice(3) : entry;
    if (!isInternalRuntimePath(candidate)) {
      throw new Error(`Existing task worktree must be clean before execution: ${candidate}`);
    }
    if (/^[RC]/.test(entry[0]) || /^[RC]/.test(entry[1])) {
      const pairedPath = fields[index + 1];
      if (pairedPath !== undefined) {
        index += 1;
        if (!isInternalRuntimePath(pairedPath)) {
          throw new Error(`Existing task worktree contains an out-of-scope rename: ${pairedPath}`);
        }
      }
    }
  }
  return true;
}

export function assertCanonicalIsolatedWorktree(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree validation", new Set(["repositoryRoot", "worktree", "branch"]));
  const { repositoryRoot, worktree, branch } = options;
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const requested = path.resolve(text(worktree, "task worktree"));
  const candidate = canonicalExistingWorktree(requested, "task worktree");
  if (!samePath(requested, candidate)) throw new Error("Task worktree must resolve to its canonical path.");
  if (samePath(root, candidate)) throw new Error("Task worktree must be isolated from the submitted repository root.");
  const expectedParent = canonicalTaskWorktreeRootFor(root);
  if (!samePath(path.dirname(candidate), expectedParent)) {
    throw new Error("Task worktree must use the canonical derived worker root.");
  }
  if (!samePath(commonGitDirectory(root), commonGitDirectory(candidate))) {
    throw new Error("Task worktree must belong to the submitted Git repository.");
  }
  const actualBranch = git(candidate, ["branch", "--show-current"]);
  if (actualBranch !== normalizeTaskBranch(branch)) {
    throw new Error(`Task worktree is on the wrong branch: ${actualBranch || "detached"}`);
  }
  return { repository_root: root, worktree: candidate, branch: actualBranch };
}

export const assertTaskWorktree = assertCanonicalIsolatedWorktree;
export const assertExactWorktree = assertCanonicalIsolatedWorktree;

export function allocateTaskWorktree(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree allocation", new Set(["repositoryRoot", "plan", "baseRef"]));
  const { repositoryRoot, plan, baseRef = TRUSTED_BASE_REF } = options;
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("Task plan is required.");
  const branch = plan.branch ?? deriveTaskBranch(plan);
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const parent = canonicalTaskWorktreeRootFor(root);
  const derivedWorktree = deriveTaskWorktreePath({ repositoryRoot: root, branch });
  const worktree = plan.worktree ?? derivedWorktree;
  if (plan.worktree !== undefined && !path.isAbsolute(String(plan.worktree))) {
    throw new Error("Task plan worktree must be an absolute path.");
  }
  const target = path.resolve(text(worktree, "task worktree"));
  if (!samePath(target, derivedWorktree) || !samePath(path.dirname(target), parent)) {
    throw new Error("Task plan worktree must use the canonical derived worker root.");
  }
  return {
    ...plan,
    branch: normalizeTaskBranch(branch),
    worktree: path.normalize(target),
    base_ref: baseReference(plan.base_ref ?? baseRef),
    base_sha: plan.base_sha === undefined ? undefined : strictCommitSha(plan.base_sha, "task plan base_sha"),
  };
}

export function allocateTaskWorktrees(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree allocation", new Set(["repositoryRoot", "plans", "baseRef"]));
  const { repositoryRoot, plans, baseRef = TRUSTED_BASE_REF } = options;
  if (!Array.isArray(plans) || plans.length === 0) throw new Error("Task plans are required.");
  const allocated = plans.map((plan) => allocateTaskWorktree({ repositoryRoot, plan, baseRef }));
  const branchKeys = new Set();
  const pathKeys = new Set();
  for (const plan of allocated) {
    const branchKey = plan.branch.toLocaleLowerCase("en-US");
    const pathKey = path.normalize(plan.worktree).toLocaleLowerCase("en-US");
    if (branchKeys.has(branchKey)) throw new Error(`Task plan branches must be distinct: ${plan.branch}`);
    if (pathKeys.has(pathKey)) throw new Error(`Task plan worktrees must be distinct: ${plan.worktree}`);
    branchKeys.add(branchKey);
    pathKeys.add(pathKey);
  }
  return allocated;
}

export function createTaskWorktree(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree creation", new Set(["repositoryRoot", "branch", "worktree", "baseRef", "baseSha", "expectedBaseSha"]));
  const { repositoryRoot, branch, worktree, baseRef = TRUSTED_BASE_REF, baseSha, expectedBaseSha } = options;
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const normalizedBranch = normalizeTaskBranch(branch);
  const target = path.resolve(text(worktree, "task worktree"));
  if (samePath(root, target)) throw new Error("Task worktree must be isolated from the submitted repository root.");
  const derivedWorktree = deriveTaskWorktreePath({ repositoryRoot: root, branch: normalizedBranch });
  if (!samePath(target, derivedWorktree)) {
    throw new Error("Task worktree must use the canonical derived worker root.");
  }
  const trustedBaseSha = resolveTrustedBaseCommit(root);
  if (baseSha !== undefined && strictCommitSha(baseSha, "task plan base_sha") !== trustedBaseSha) {
    throw new Error("Task plan base_sha is stale or does not match trusted origin/main.");
  }
  if (expectedBaseSha !== undefined && strictCommitSha(expectedBaseSha, "expected base_sha") !== trustedBaseSha) {
    throw new Error("Expected task worktree base does not match trusted origin/main.");
  }
  if (fs.existsSync(target)) {
    const verified = assertCanonicalIsolatedWorktree({
      repositoryRoot: root,
      worktree: target,
      branch: normalizedBranch,
    });
    assertTrustedBaseLineage(target, trustedBaseSha);
    assertCleanExceptRuntime(target);
    return { ...verified, created: false, base_ref: baseReference(baseRef), base_sha: trustedBaseSha };
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  git(root, ["worktree", "add", "--quiet", "-b", normalizedBranch, target, trustedBaseSha]);
  const verified = assertCanonicalIsolatedWorktree({
    repositoryRoot: root,
    worktree: target,
    branch: normalizedBranch,
  });
  assertTrustedBaseLineage(target, trustedBaseSha);
  assertCleanExceptRuntime(target);
  return { ...verified, created: true, base_ref: baseReference(baseRef), base_sha: trustedBaseSha };
}

export function prepareTaskWorktrees(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree preparation", new Set(["repositoryRoot", "plans", "baseRef"]));
  const { repositoryRoot, plans, baseRef = TRUSTED_BASE_REF } = options;
  const allocated = allocateTaskWorktrees({ repositoryRoot, plans, baseRef });
  const trustedBaseSha = resolveTrustedBaseCommit(repositoryRoot);
  return allocated.map((plan) => ({
    plan: { ...plan, base_ref: TRUSTED_BASE_REF, base_sha: strictCommitSha(plan.base_sha ?? trustedBaseSha, "task plan base_sha") },
    worktree: createTaskWorktree({
      repositoryRoot,
      branch: plan.branch,
      worktree: plan.worktree,
      baseRef: plan.base_ref,
      expectedBaseSha: plan.base_sha ?? trustedBaseSha,
    }),
  }));
}

export const createIsolatedWorktree = createTaskWorktree;
export const prepareWorktrees = prepareTaskWorktrees;

export function removeTaskWorktree(options = {}) {
  assertNoWorktreeHooks(options, "Task worktree removal", new Set(["repositoryRoot", "worktree", "force"]));
  const { repositoryRoot, worktree, force = false } = options;
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const candidate = canonicalDirectory(text(worktree, "task worktree"), "task worktree");
  if (samePath(root, candidate)) throw new Error("The submitted repository root cannot be removed as a task worktree.");
  const args = ["worktree", "remove"];
  if (force) args.push("--force");
  args.push(candidate);
  git(root, args);
  return true;
}

export { BRANCH_PATTERN, slug as taskSlug, baseReference as assertTrustedBaseReference, strictCommitSha };
