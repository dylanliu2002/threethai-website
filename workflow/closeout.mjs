import { execFileSync } from "node:child_process";
import { validateControllerCapability } from "./capability.mjs";
import { readControllerState, mutateControllerState } from "./controller-state.mjs";
import { deriveActualChanges } from "./git-evidence.mjs";
import { pathAllowed } from "./paths.mjs";
import { approvalStillValid } from "./state.mjs";

function gitHead(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
}

export function closeoutPlan({
  stateDirectory,
  repoRoot,
  contract,
  grant,
  capability,
  verifyCard = true,
}) {
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: "closeout", repoRoot, verifyCard,
  });
  const state = readControllerState(stateDirectory);
  const approval = state.approvals[contract.task_key];
  if (!approval) throw new Error("Closeout requires a controller-issued approval record.");
  const currentHead = gitHead(repoRoot);
  const binding = {
    head_sha: currentHead,
    base_sha: approval.reviewed_base_sha,
    contract_revision: contract.contract_revision,
    contract_digest: grant.contract_digest,
    authorization_revision: grant.authorization_revision,
    validation_digest: approval.validation_digest,
    review_evidence_digest: approval.review_evidence_digest,
  };
  if (!approvalStillValid(approval, binding)) throw new Error("Approval is stale or does not bind current HEAD.");
  return {
    task_key: contract.task_key,
    reviewed_head_sha: approval.reviewed_head_sha,
    approval_revision: approval.approval_revision,
    lease_id: capability.lease_id,
    fencing_token: capability.fencing_token,
  };
}

export function finalizeCloseout(plan, {
  stateDirectory,
  repoRoot,
  contract,
  grant,
  capability,
  verifyCard = true,
}) {
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: "closeout", repoRoot, verifyCard,
  });
  const currentHead = gitHead(repoRoot);
  if (currentHead === plan.reviewed_head_sha) throw new Error("Administrative closeout must produce a distinct Closeout Head.");
  const evidence = deriveActualChanges(repoRoot, plan.reviewed_head_sha);
  for (const changed of evidence.paths) {
    if (!pathAllowed(changed, grant.administrative_files, [])) {
      throw new Error(`Closeout changed an implementation path: ${changed}`);
    }
  }
  return mutateControllerState(stateDirectory, {
    type: "closeout.completed",
    taskKey: contract.task_key,
    runId: capability.run_id,
    payload: { reviewed_head_sha: plan.reviewed_head_sha, closeout_head_sha: currentHead, evidence_digest: evidence.evidence_digest },
  }, (state) => {
    state.closeouts[contract.task_key] = {
      reviewed_head_sha: plan.reviewed_head_sha,
      closeout_head_sha: currentHead,
      approval_revision: plan.approval_revision,
      evidence_digest: evidence.evidence_digest,
    };
    return structuredClone(state.closeouts[contract.task_key]);
  }).result;
}
