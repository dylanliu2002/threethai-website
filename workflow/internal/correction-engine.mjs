import { nextOwnerAfterChangesRequested } from "../state.mjs";
import { privilegedMutationInternal } from "./capability-engine.mjs";

export function planCorrectionInternal({
  engine, contract, grant, capability, now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: "correct",
    type: "correction.started", taskKey: contract.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    const task = state.tasks[contract.task_key];
    const review = task?.review_record;
    if (!review || review.outcome !== "CHANGES_REQUESTED") {
      throw new Error("Correction requires authoritative CHANGES_REQUESTED review evidence.");
    }
    if (!Array.isArray(review.review_evidence) || review.review_evidence.length === 0) {
      throw new Error("Correction requires durable findings.");
    }
    const completedCycles = task.correction_count ?? 0;
    if (completedCycles >= validated.grant.limits.max_correction_cycles) {
      return { status: "BLOCKED", phase: "CORRECT", reason: "correction-cycle-limit", completed_cycles: completedCycles };
    }
    const nextCycle = completedCycles + 1;
    task.correction_count = nextCycle;
    task.status = "IN_PROGRESS";
    task.phase = "CORRECT";
    task.review_target = null;
    return {
      status: "IN_PROGRESS", phase: "CORRECT",
      owner_role: nextOwnerAfterChangesRequested(contract),
      branch: validated.grant.branch, worktree: validated.grant.worktree,
      next_cycle: nextCycle, findings: review.review_evidence,
      previous_reviewer_run_id: review.reviewer_run_id,
      requires_fresh_reviewer_after_validation: true,
    };
  });
}
