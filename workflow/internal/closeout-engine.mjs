import { execFileSync } from "node:child_process";
import { deriveActualChanges } from "../git-evidence.mjs";
import { pathAllowed } from "../paths.mjs";
import { approvalStillValid } from "../state.mjs";
import { privilegedMutationInternal } from "./capability-engine.mjs";

function gitHead(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).trim();
}

export function finalizeCloseoutInternal({
  engine, contract, grant, capability, now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: "closeout",
    type: "closeout.completed", taskKey: contract.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    const approval = state.approvals[contract.task_key];
    if (!approval) throw new Error("Closeout requires the authoritative stored approval.");
    const currentHead = gitHead(engine.repoRoot);
    const binding = {
      head_sha: approval.reviewed_head_sha,
      base_sha: approval.reviewed_base_sha,
      contract_revision: contract.contract_revision,
      contract_digest: validated.grant.contract_digest,
      authorization_revision: validated.grant.authorization_revision,
      reviewer_run_id: approval.reviewer_run_id,
      reviewer_worker_id: approval.reviewer_worker_id,
      reviewer_thread_id: approval.reviewer_thread_id,
      reviewer_attempt: approval.reviewer_attempt,
      validation_digest: approval.validation_digest,
      review_evidence_digest: approval.review_evidence_digest,
    };
    if (!approvalStillValid(approval, binding)) throw new Error("Stored approval is stale or invalid.");
    if (currentHead === approval.reviewed_head_sha) {
      throw new Error("Administrative closeout must produce a distinct Closeout Head.");
    }
    const evidence = deriveActualChanges(engine.repoRoot, approval.reviewed_head_sha);
    for (const changed of evidence.paths) {
      if (!pathAllowed(changed, validated.grant.administrative_files, [])) {
        throw new Error(`Closeout changed an implementation path: ${changed}`);
      }
    }
    const closeout = {
      reviewed_head_sha: approval.reviewed_head_sha,
      closeout_head_sha: currentHead,
      approval_revision: approval.approval_revision,
      contract_revision: approval.contract_revision,
      authorization_revision: approval.authorization_revision,
      evidence_digest: evidence.evidence_digest,
    };
    state.closeouts[contract.task_key] = closeout;
    return structuredClone(closeout);
  });
}
