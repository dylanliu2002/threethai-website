import { nextOwnerAfterChangesRequested } from "./state.mjs";

export function planCorrection(contract, review, completedCycles) {
  if (review.outcome !== "CHANGES_REQUESTED") {
    throw new Error("Correction requires CHANGES_REQUESTED review evidence.");
  }
  if (!Array.isArray(review.findings) || review.findings.length === 0) {
    throw new Error("Correction requires durable findings.");
  }
  if (completedCycles >= contract.limits.max_correction_cycles) {
    return {
      status: "BLOCKED",
      phase: "CORRECT",
      reason: "correction-cycle-limit",
      completed_cycles: completedCycles,
    };
  }
  return {
    status: "CHANGES_REQUESTED",
    phase: "CORRECT",
    owner_role: nextOwnerAfterChangesRequested(contract),
    branch: contract.branch,
    worktree: contract.worktree,
    next_cycle: completedCycles + 1,
    findings: review.findings,
    requires_fresh_reviewer_after_validation: true,
  };
}
