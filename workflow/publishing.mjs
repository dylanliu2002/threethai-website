import { execFileSync } from "node:child_process";
import { validateControllerCapability } from "./capability.mjs";
import { readControllerState } from "./controller-state.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE } from "./constants.mjs";
import { assertActualChangesAllowed } from "./git-evidence.mjs";

const EXPECTED_NAME = "dylanliu2002";
const EXPECTED_EMAIL = "dylanliu2002@gmail.com";

function git(repoRoot, args, exec = execFileSync) {
  return exec("git", args, { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
}

export function assertPublishingAllowed(grant, action) {
  if (action === "merge") throw new Error("Merge is not implemented or authorized in the MVP.");
  const permission = { commit: "git_commit", push: "branch_push", pr: "pr_create" }[action];
  if (!permission || !grant.publishing[action] || !grant.permissions[permission]) {
    throw new Error(`Publishing action is not authorized: ${action}`);
  }
  if (action === "pr" && !grant.permissions.github_write) {
    throw new Error("PR creation additionally requires task-specific github_write permission.");
  }
  if (grant.publishing.force) throw new Error("Force publishing is forbidden.");
  return true;
}

export function verifyGitIdentity(repoRoot, exec = execFileSync, { verifyHeadAuthor = false } = {}) {
  const name = git(repoRoot, ["config", "user.name"], exec);
  const email = git(repoRoot, ["config", "user.email"], exec);
  if (name !== EXPECTED_NAME || email !== EXPECTED_EMAIL) {
    throw new Error("Git identity mismatch blocks publishing.");
  }
  if (verifyHeadAuthor) {
    const author = git(repoRoot, ["log", "-1", "--format=%an <%ae>"], exec);
    if (author !== `${EXPECTED_NAME} <${EXPECTED_EMAIL}>`) {
      throw new Error("HEAD commit author identity mismatch blocks publishing.");
    }
  }
  return `${name} <${email}>`;
}

export function assertPublishingContext({
  stateDirectory,
  repoRoot,
  contract,
  grant,
  capability,
  action,
  verifyCard = true,
  exec = execFileSync,
}) {
  const validated = validateControllerCapability(capability, {
    stateDirectory, contract, grant, action, repoRoot, verifyCard,
  });
  const state = readControllerState(stateDirectory);
  if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE || !state.activation.authorized) {
    throw new Error("Publishing is disabled by controller activation state.");
  }
  assertPublishingAllowed(validated.grant, action);
  const branch = git(repoRoot, ["branch", "--show-current"], exec);
  if (branch === "main" || branch !== validated.grant.branch || branch !== validated.grant.publishing.allowed_branch) {
    throw new Error("Publishing branch does not match the exact authorized task branch.");
  }
  const head = git(repoRoot, ["rev-parse", "HEAD"], exec);
  if (head !== validated.capability.head_sha) throw new Error("Current Git SHA differs from controller capability.");
  if (validated.grant.publishing.approval_required_actions.includes(action)) {
    const approval = state.approvals[contract.task_key];
    if (!approval) throw new Error("Publishing action requires authoritative approval.");
    const closeout = state.closeouts[contract.task_key];
    const approvedCurrentHead = closeout?.closeout_head_sha ?? approval.reviewed_head_sha;
    if (head !== approvedCurrentHead
      || approval.contract_digest !== validated.grant.contract_digest
      || approval.authorization_revision !== validated.grant.authorization_revision) {
      throw new Error("Current SHA or authorization differs from authoritative approval.");
    }
  }
  const identity = verifyGitIdentity(repoRoot, exec, { verifyHeadAuthor: action !== "commit" });
  const scope = assertActualChangesAllowed({
    repoRoot,
    baseSha: contract.request_provenance.base_sha,
    grant: validated.grant,
    exec,
  });
  return { action, branch, head_sha: head, identity, scope, capability: validated.capability };
}

export function prPlan(context) {
  const verified = assertPublishingContext({ ...context, action: "pr" });
  return {
    mutation: "github.pull_request.create",
    head: verified.branch,
    base: "main",
    current_head_sha: verified.head_sha,
  };
}

export function runPrMutation() {
  throw new Error("Live GitHub mutation remains disabled; SYS-AUTO-001 creates no PR.");
}
