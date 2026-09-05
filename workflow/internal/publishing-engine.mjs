import { execFileSync } from "node:child_process";
import { assertActualChangesAllowed } from "../git-evidence.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE } from "../constants.mjs";
import { privilegedMutationInternal } from "./capability-engine.mjs";

const EXPECTED_NAME = "dylanliu2002";
const EXPECTED_EMAIL = "dylanliu2002@gmail.com";

function git(repoRoot, args, exec = execFileSync) {
  return exec("git", args, { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
}

export function assertPublishingAllowedInternal(grant, action) {
  if (action === "merge") throw new Error("Merge is not implemented or authorized in the MVP.");
  const permission = { commit: "git_commit", push: "branch_push", pr: "pr_create" }[action];
  if (!permission || !grant.publishing[action] || !grant.permissions[permission]) {
    throw new Error(`Publishing action is not authorized: ${action}`);
  }
  if (action === "pr" && !grant.permissions.github_write) throw new Error("PR creation additionally requires task-specific github_write permission.");
  if (grant.publishing.force) throw new Error("Force publishing is forbidden.");
}

export function verifyGitIdentityInternal(repoRoot, exec = execFileSync, { verifyHeadAuthor = false } = {}) {
  const name = git(repoRoot, ["config", "user.name"], exec);
  const email = git(repoRoot, ["config", "user.email"], exec);
  if (name !== EXPECTED_NAME || email !== EXPECTED_EMAIL) throw new Error("Git identity mismatch blocks publishing.");
  if (verifyHeadAuthor) {
    const author = git(repoRoot, ["log", "-1", "--format=%an <%ae>"], exec);
    if (author !== `${EXPECTED_NAME} <${EXPECTED_EMAIL}>`) throw new Error("HEAD commit author identity mismatch blocks publishing.");
  }
  return `${name} <${email}>`;
}

export function planPublishingInternal({
  engine, contract, grant, capability, action, exec = execFileSync,
  now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action,
    type: "publishing.planned", taskKey: contract.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE || !state.activation.authorized) {
      throw new Error("Publishing is disabled by controller activation state.");
    }
    assertPublishingAllowedInternal(validated.grant, action);
    const branch = git(engine.repoRoot, ["branch", "--show-current"], exec);
    if (branch === "main" || branch !== validated.grant.branch || branch !== validated.grant.publishing.allowed_branch) {
      throw new Error("Publishing branch does not match the exact authorized task branch.");
    }
    const head = git(engine.repoRoot, ["rev-parse", "HEAD"], exec);
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
    const identity = verifyGitIdentityInternal(engine.repoRoot, exec, { verifyHeadAuthor: action !== "commit" });
    const scope = assertActualChangesAllowed({
      repoRoot: engine.repoRoot,
      baseSha: contract.request_provenance.base_sha,
      grant: validated.grant,
      exec,
    });
    const plan = {
      action, branch, head_sha: head, identity,
      scope_evidence_digest: scope.evidence_digest,
      capability_id: validated.capability.capability_id,
      fencing_token: validated.capability.fencing_token,
      planned_at: now.toISOString(), status: "PLANNED",
    };
    state.publishing[`${contract.task_key}:${action}`] = plan;
    return structuredClone({ ...plan, scope });
  });
}

export function completePublishingInternal({
  engine, contract, grant, capability, action, mutationEvidenceDigest,
  now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action,
    type: "publishing.completed", taskKey: contract.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    const key = `${contract.task_key}:${action}`;
    const plan = state.publishing[key];
    if (!plan || plan.status !== "PLANNED"
      || plan.capability_id !== validated.capability.capability_id
      || plan.fencing_token !== validated.capability.fencing_token) {
      throw new Error("Publishing completion lacks the current authoritative plan.");
    }
    plan.status = "COMPLETED";
    plan.mutation_evidence_digest = mutationEvidenceDigest;
    plan.completed_at = now.toISOString();
    return structuredClone(plan);
  });
}
