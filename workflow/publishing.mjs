import { execFileSync } from "node:child_process";

export function assertPublishingAllowed(contract, action) {
  const permission = {
    commit: "git_commit",
    push: "branch_push",
    pr: "pr_create",
    merge: "merge",
  }[action];
  if (!permission || !contract.permissions[permission]) {
    throw new Error(`Publishing action is not authorized: ${action}`);
  }
  if (action === "pr" && !contract.permissions.github_write) {
    throw new Error("PR creation additionally requires github_write permission.");
  }
  return true;
}

export function verifyGitIdentity(repoRoot, exec = execFileSync) {
  const name = exec("git", ["config", "user.name"], { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
  const email = exec("git", ["config", "user.email"], { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
  if (name !== "dylanliu2002" || email !== "dylanliu2002@gmail.com") {
    throw new Error("Git identity mismatch blocks publishing.");
  }
  return `${name} <${email}>`;
}

export function prPlan(contract, { base = "main", reviewedHead, closeoutHead = null } = {}) {
  assertPublishingAllowed(contract, "pr");
  if (!reviewedHead) throw new Error("PR plan requires a reviewed head SHA.");
  return {
    mutation: "github.pull_request.create",
    head: contract.branch,
    base,
    reviewed_head_sha: reviewedHead,
    closeout_head_sha: closeoutHead,
  };
}

export function runPrMutation() {
  throw new Error("Live GitHub mutation is disabled in bootstrap; activation authorization is required.");
}
