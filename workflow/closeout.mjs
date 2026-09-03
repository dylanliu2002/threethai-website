import { assertChangedPathsAllowed } from "./paths.mjs";
import { approvalStillValid } from "./state.mjs";
import { validateIndependentReview } from "./review.mjs";

export function closeoutPlan(contract, approval, {
  changedFiles = [],
  implementationChanged = false,
  priorCloseoutKeys = new Set(),
  current,
} = {}) {
  const validatedApproval = validateIndependentReview(approval);
  if (validatedApproval.task_key !== contract.task_key
    || validatedApproval.contract_revision !== contract.contract_revision) {
    throw new Error("Approval does not bind this task contract revision.");
  }
  if (validatedApproval.outcome !== "APPROVED") throw new Error("Closeout requires APPROVED review.");
  if (!current) throw new Error("Closeout requires current approval-binding evidence.");
  if (!approvalStillValid(validatedApproval, current)) {
    throw new Error("Approval binding no longer matches current implementation evidence.");
  }
  if (implementationChanged) throw new Error("Closeout cannot modify approved implementation.");
  const allowed = new Set(contract.administrative_files.map((path) => path.toLocaleLowerCase("en-US")));
  for (const file of changedFiles) {
    if (!allowed.has(file.toLocaleLowerCase("en-US"))) {
      throw new Error(`Closeout path is not administrative: ${file}`);
    }
  }
  assertChangedPathsAllowed(changedFiles, contract);
  const idempotencyKey = [
    contract.task_key,
    contract.contract_revision,
    validatedApproval.reviewed_head_sha,
    "closeout",
  ].join(":");
  return {
    should_run: !priorCloseoutKeys.has(idempotencyKey),
    idempotency_key: idempotencyKey,
    reviewed_head_sha: validatedApproval.reviewed_head_sha,
    closeout_head_sha: null,
    changed_files: changedFiles,
  };
}
