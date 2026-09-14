import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertGitWorktree, canonicalDirectory } from "./submission.mjs";

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
  if (reference.startsWith("-")) throw new Error("baseRef cannot begin with a Git option.");
  return reference;
}

function git(repositoryRoot, args, exec = execFileSync) {
  let output;
  try {
    output = exec("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: MAX_GIT_OUTPUT,
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

export function deriveTaskWorktreePath({ repositoryRoot, branch, worktreeRoot } = {}) {
  const root = path.resolve(text(repositoryRoot, "repositoryRoot"));
  const normalizedBranch = normalizeTaskBranch(branch);
  const parent = worktreeRoot === undefined
    ? path.join(path.dirname(root), "worktrees")
    : path.resolve(text(worktreeRoot, "worktreeRoot"));
  const directoryName = normalizedBranch.slice("codex/".length).replaceAll("/", "-");
  return path.join(parent, directoryName);
}

function canonicalExistingWorktree(directory, label = "task worktree") {
  return assertGitWorktree(canonicalDirectory(directory, label), label);
}

function samePath(left, right) {
  return path.relative(left, right) === "" && path.relative(right, left) === "";
}

function commonGitDirectory(directory, exec) {
  const value = git(directory, ["rev-parse", "--git-common-dir"], exec);
  return path.resolve(directory, value);
}

export function assertCanonicalIsolatedWorktree({ repositoryRoot, worktree, branch, exec = execFileSync } = {}) {
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const requested = path.resolve(text(worktree, "task worktree"));
  const candidate = canonicalExistingWorktree(requested, "task worktree");
  if (!samePath(requested, candidate)) throw new Error("Task worktree must resolve to its canonical path.");
  if (samePath(root, candidate)) throw new Error("Task worktree must be isolated from the submitted repository root.");
  if (!samePath(commonGitDirectory(root, exec), commonGitDirectory(candidate, exec))) {
    throw new Error("Task worktree must belong to the submitted Git repository.");
  }
  const actualBranch = git(candidate, ["branch", "--show-current"], exec);
  if (actualBranch !== normalizeTaskBranch(branch)) {
    throw new Error(`Task worktree is on the wrong branch: ${actualBranch || "detached"}`);
  }
  return { repository_root: root, worktree: candidate, branch: actualBranch };
}

export const assertTaskWorktree = assertCanonicalIsolatedWorktree;
export const assertExactWorktree = assertCanonicalIsolatedWorktree;

export function allocateTaskWorktree({ repositoryRoot, plan, worktreeRoot, baseRef = "HEAD" } = {}) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("Task plan is required.");
  const branch = plan.branch ?? deriveTaskBranch(plan);
  const parent = worktreeRoot === undefined
    ? path.join(path.dirname(path.resolve(text(repositoryRoot, "repositoryRoot"))), "worktrees")
    : path.resolve(text(worktreeRoot, "worktreeRoot"));
  const worktree = plan.worktree ?? deriveTaskWorktreePath({ repositoryRoot, branch, worktreeRoot });
  if (plan.worktree !== undefined && !path.isAbsolute(String(plan.worktree))) {
    throw new Error("Task plan worktree must be an absolute path.");
  }
  const target = path.resolve(text(worktree, "task worktree"));
  const relative = path.relative(parent, target);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Task plan worktree must be inside the configured isolated worktree root.");
  }
  return {
    ...plan,
    branch: normalizeTaskBranch(branch),
    worktree: path.normalize(target),
    base_ref: baseReference(plan.base_ref ?? baseRef),
  };
}

export function allocateTaskWorktrees({ repositoryRoot, plans, worktreeRoot, baseRef = "HEAD" } = {}) {
  if (!Array.isArray(plans) || plans.length === 0) throw new Error("Task plans are required.");
  const allocated = plans.map((plan) => allocateTaskWorktree({ repositoryRoot, plan, worktreeRoot, baseRef }));
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

export function createTaskWorktree({ repositoryRoot, branch, worktree, baseRef = "HEAD", exec = execFileSync } = {}) {
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const normalizedBranch = normalizeTaskBranch(branch);
  const target = path.resolve(text(worktree, "task worktree"));
  if (samePath(root, target)) throw new Error("Task worktree must be isolated from the submitted repository root.");
  if (fs.existsSync(target)) {
    const verified = assertCanonicalIsolatedWorktree({
      repositoryRoot: root,
      worktree: target,
      branch: normalizedBranch,
      exec,
    });
    return { ...verified, created: false, base_ref: baseReference(baseRef) };
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  git(root, ["worktree", "add", "--quiet", "-b", normalizedBranch, target, baseReference(baseRef)], exec);
  const verified = assertCanonicalIsolatedWorktree({
    repositoryRoot: root,
    worktree: target,
    branch: normalizedBranch,
    exec,
  });
  return { ...verified, created: true, base_ref: baseReference(baseRef) };
}

export function prepareTaskWorktrees({ repositoryRoot, plans, worktreeRoot, baseRef = "HEAD", exec = execFileSync } = {}) {
  const allocated = allocateTaskWorktrees({ repositoryRoot, plans, worktreeRoot, baseRef });
  return allocated.map((plan) => ({
    plan: { ...plan },
    worktree: createTaskWorktree({
      repositoryRoot,
      branch: plan.branch,
      worktree: plan.worktree,
      baseRef: plan.base_ref,
      exec,
    }),
  }));
}

export const createIsolatedWorktree = createTaskWorktree;
export const prepareWorktrees = prepareTaskWorktrees;

export function removeTaskWorktree({ repositoryRoot, worktree, force = false, exec = execFileSync } = {}) {
  const root = assertGitWorktree(canonicalDirectory(text(repositoryRoot, "repositoryRoot"), "repository root"), "repository root");
  const candidate = canonicalDirectory(text(worktree, "task worktree"), "task worktree");
  if (samePath(root, candidate)) throw new Error("The submitted repository root cannot be removed as a task worktree.");
  const args = ["worktree", "remove"];
  if (force) args.push("--force");
  args.push(candidate);
  git(root, args, exec);
  return true;
}

export { BRANCH_PATTERN, slug as taskSlug };
