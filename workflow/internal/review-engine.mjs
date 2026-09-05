import { equalCanonical, sha256 } from "../canonical.mjs";
import { ApprovalRecordSchema, ReviewRecordSchema } from "../schemas.mjs";
import { SCHEMA_VERSION } from "../constants.mjs";
import { assertIndependentRoles } from "../roles.mjs";
import { privilegedMutationInternal } from "./capability-engine.mjs";

export function reviewEvidenceDigestInternal(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) throw new Error("Review evidence must be non-empty.");
  return sha256(evidence);
}

export function validateIndependentReviewAgainstStateInternal(input, {
  state, contract, grant, capability, allowRecorded = false,
} = {}) {
  const review = ReviewRecordSchema.parse(input);
  assertIndependentRoles(review.owner_role, review.reviewer_role);
  if (review.review_evidence_digest !== reviewEvidenceDigestInternal(review.review_evidence)) {
    throw new Error("Review evidence digest mismatch.");
  }
  const implementation = state.runs[review.implementation_run_id];
  const reviewer = state.runs[review.reviewer_run_id];
  const task = state.tasks[review.task_key];
  const target = task?.review_target;
  if (!implementation || !reviewer || !target) throw new Error("Review lacks authoritative implementation/reviewer evidence.");
  if (review.implementation_run_id === review.reviewer_run_id) throw new Error("Reviewer must use a fresh run.");
  if (implementation.thread_id === reviewer.thread_id) throw new Error("Reviewer must use a fresh thread.");
  if (implementation.worker_id === reviewer.worker_id) throw new Error("Implementation contributor cannot review.");
  if (implementation.status !== "SUCCESS" || reviewer.status !== "SUCCESS") {
    throw new Error("Review requires successful authoritative runs.");
  }
  if (!reviewer.review_result) throw new Error("Reviewer run lacks an authoritative stored review result.");
  if (!equalCanonical(review, reviewer.review_result)) {
    throw new Error("Submitted review does not exactly match the authoritative reviewer run result.");
  }
  const exact = review.task_key === contract.task_key
    && review.task_key === capability.task_key
    && review.contract_revision === contract.contract_revision
    && review.contract_digest === grant.contract_digest
    && review.authorization_revision === grant.authorization_revision
    && review.owner_role === grant.owner_role
    && review.reviewer_role === grant.reviewer_role
    && review.reviewer_role === capability.role
    && implementation.role_id === grant.owner_role
    && reviewer.role_id === grant.reviewer_role
    && review.implementation_run_id === task.implementation_run_id
    && review.implementation_run_id === target.implementation_run_id
    && review.reviewer_run_id === capability.run_id
    && review.reviewer_run_id === reviewer.run_id
    && review.reviewer_thread_id === reviewer.thread_id
    && review.reviewer_worker_id === reviewer.worker_id
    && review.reviewer_attempt === reviewer.attempt
    && review.reviewer_attempt === capability.attempt
    && review.reviewed_base_sha === target.reviewed_base_sha
    && review.reviewed_head_sha === target.reviewed_head_sha
    && review.validation_digest === target.validation_digest
    && review.review_completed_at === reviewer.completed_at
    && review.review_evidence_digest === reviewer.review_result.review_evidence_digest
    && review.outcome === reviewer.reported_outcome
    && (capability.action === "approve" || (
      capability.action === "review"
      && capability.reviewed_base_sha === target.reviewed_base_sha
      && capability.reviewed_head_sha === target.reviewed_head_sha
    ));
  if (!exact) throw new Error("Review record/capability does not match authoritative reviewed-head evidence.");
  const previousReviewers = state.tasks[contract.task_key]?.reviewer_run_ids ?? [];
  if (!allowRecorded && previousReviewers.includes(review.reviewer_run_id)) {
    throw new Error("Corrective review must use a new reviewer run.");
  }
  return review;
}

export function recordIndependentReviewInternal(input, {
  engine, contract, grant, capability, now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: "review",
    type: `review.${String(input.outcome).toLocaleLowerCase("en-US")}`,
    taskKey: input.task_key, runId: input.reviewer_run_id, payload: { review: input },
    now, verifyCard,
  }, (state, validated) => {
    const review = validateIndependentReviewAgainstStateInternal(input, {
      state, contract, grant: validated.grant, capability: validated.capability,
    });
    const task = state.tasks[review.task_key];
    task.review_record = review;
    task.reviewer_run_ids = [...new Set([...(task.reviewer_run_ids ?? []), review.reviewer_run_id])];
    if (review.outcome === "APPROVED") {
      task.status = "APPROVED"; task.phase = "CLOSEOUT";
    } else if (review.outcome === "CHANGES_REQUESTED") {
      task.status = "CHANGES_REQUESTED"; task.phase = "CORRECT";
    } else {
      task.status = "BLOCKED"; task.phase = "INDEPENDENT_REVIEW";
    }
    return structuredClone(review);
  });
}

export function issueApprovalRecordInternal({
  engine, contract, grant, capability, now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: "approve",
    type: "approval.issued", taskKey: contract.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    const review = state.tasks[contract.task_key]?.review_record;
    if (!review || review.outcome !== "APPROVED") throw new Error("Controller approval requires a stored APPROVED review.");
    validateIndependentReviewAgainstStateInternal(review, {
      state, contract, grant: validated.grant,
      capability: validated.capability,
      allowRecorded: true,
    });
    const revision = (state.tasks[contract.task_key]?.approval_revision ?? 0) + 1;
    const approval = ApprovalRecordSchema.parse({
      schema_version: SCHEMA_VERSION,
      task_key: review.task_key,
      reviewed_base_sha: review.reviewed_base_sha,
      reviewed_head_sha: review.reviewed_head_sha,
      contract_digest: review.contract_digest,
      contract_revision: review.contract_revision,
      authorization_revision: review.authorization_revision,
      reviewer_run_id: review.reviewer_run_id,
      reviewer_worker_id: review.reviewer_worker_id,
      reviewer_thread_id: review.reviewer_thread_id,
      reviewer_attempt: review.reviewer_attempt,
      validation_digest: review.validation_digest,
      review_evidence_digest: review.review_evidence_digest,
      approval_revision: revision,
      issued_at: now.toISOString(),
    });
    state.approvals[approval.task_key] = approval;
    state.tasks[approval.task_key].approval_revision = revision;
    return structuredClone(approval);
  });
}

export function reviewDispatchPlanInternal(contract, grant, implementation) {
  assertIndependentRoles(contract.owner_role, contract.reviewer_role);
  if (!implementation.head_sha || !implementation.base_sha || implementation.status !== "SUCCESS") {
    throw new Error("Review requires authoritative successful implementation evidence.");
  }
  return {
    task_key: contract.task_key,
    role_id: grant.reviewer_role,
    fresh_thread: true,
    fresh_run: true,
    repository_access: "read-only",
    reviewed_base_sha: implementation.base_sha,
    reviewed_head_sha: implementation.head_sha,
    contract_revision: contract.contract_revision,
    contract_digest: grant.contract_digest,
    authorization_revision: grant.authorization_revision,
  };
}
