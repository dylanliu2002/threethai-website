import { validateControllerCapability } from "./capability.mjs";
import { mutateControllerState, readControllerState } from "./controller-state.mjs";
import { nextOwnerAfterChangesRequested } from "./state.mjs";

export function planCorrection({
  stateDirectory,
  contract,
  grant,
  capability,
  repoRoot,
  verifyCard = true,
  claimedCorrectionCount: _ignored,
}) {
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: "correct", repoRoot, verifyCard,
  });
  const state = readControllerState(stateDirectory);
  const task = state.tasks[contract.task_key];
  const review = task?.review_record;
  if (!review || review.outcome !== "CHANGES_REQUESTED") {
    throw new Error("Correction requires authoritative CHANGES_REQUESTED review evidence.");
  }
  if (!Array.isArray(review.review_evidence) || review.review_evidence.length === 0) {
    throw new Error("Correction requires durable findings.");
  }
  const completedCycles = task.correction_count ?? 0;
  if (completedCycles >= grant.limits.max_correction_cycles) {
    return { status: "BLOCKED", phase: "CORRECT", reason: "correction-cycle-limit", completed_cycles: completedCycles };
  }
  const nextCycle = completedCycles + 1;
  mutateControllerState(stateDirectory, {
    type: "correction.started",
    taskKey: contract.task_key,
    runId: capability.run_id,
    payload: { cycle: nextCycle, prior_reviewer_run_id: review.reviewer_run_id },
  }, (next) => {
    next.tasks[contract.task_key].correction_count = nextCycle;
    next.tasks[contract.task_key].status = "IN_PROGRESS";
    next.tasks[contract.task_key].phase = "CORRECT";
    return nextCycle;
  });
  return {
    status: "IN_PROGRESS",
    phase: "CORRECT",
    owner_role: nextOwnerAfterChangesRequested(contract),
    branch: grant.branch,
    worktree: grant.worktree,
    next_cycle: nextCycle,
    findings: review.review_evidence,
    previous_reviewer_run_id: review.reviewer_run_id,
    requires_fresh_reviewer_after_validation: true,
  };
}
