import { sha256 } from "./canonical.mjs";
import { validateControllerCapability } from "./capability.mjs";
import { mutateControllerState, readControllerState } from "./controller-state.mjs";
import { assertIndependentRoles } from "./roles.mjs";
import { ApprovalRecordSchema, ReviewRecordSchema } from "./schemas.mjs";
import { SCHEMA_VERSION } from "./constants.mjs";

export function reviewEvidenceDigest(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) throw new Error("Review evidence must be non-empty.");
  return sha256(evidence);
}

export function validateIndependentReview(input, {
  stateDirectory,
  contract,
  grant,
  allowRecorded = false,
} = {}) {
  if (!stateDirectory || !contract || !grant) {
    throw new Error("Authoritative controller state, contract and grant are required for review.");
  }
  const review = ReviewRecordSchema.parse(input);
  assertIndependentRoles(review.owner_role, review.reviewer_role);
  if (review.review_evidence_digest !== reviewEvidenceDigest(review.review_evidence)) {
    throw new Error("Review evidence digest mismatch.");
  }
  const state = readControllerState(stateDirectory);
  const implementation = state.runs[review.implementation_run_id];
  const reviewer = state.runs[review.reviewer_run_id];
  if (!implementation || !reviewer) throw new Error("Review lacks authoritative implementation/reviewer run records.");
  if (review.implementation_run_id === review.reviewer_run_id) throw new Error("Reviewer must use a fresh run.");
  if (implementation.thread_id === reviewer.thread_id) throw new Error("Reviewer must use a fresh thread.");
  if (implementation.worker_id === reviewer.worker_id) throw new Error("Implementation contributor cannot review.");
  if (implementation.status !== "COMPLETED" || reviewer.status !== "COMPLETED") {
    throw new Error("Review requires completed authoritative runs.");
  }
  const exact = review.task_key === contract.task_key
    && review.contract_revision === contract.contract_revision
    && review.contract_digest === grant.contract_digest
    && review.authorization_revision === grant.authorization_revision
    && review.owner_role === grant.owner_role
    && review.reviewer_role === grant.reviewer_role
    && implementation.role_id === grant.owner_role
    && reviewer.role_id === grant.reviewer_role
    && review.reviewer_thread_id === reviewer.thread_id
    && review.reviewer_worker_id === reviewer.worker_id
    && review.reviewed_base_sha === implementation.base_sha
    && review.reviewed_head_sha === implementation.head_sha
    && review.validation_digest === implementation.validation_digest;
  if (!exact) throw new Error("Review record does not match authoritative grant/run evidence.");
  const previousReviewers = state.tasks[contract.task_key]?.reviewer_run_ids ?? [];
  if (!allowRecorded && previousReviewers.includes(review.reviewer_run_id)) {
    throw new Error("Corrective review must use a new reviewer run.");
  }
  return review;
}

export function recordIndependentReview(input, {
  stateDirectory,
  contract,
  grant,
  capability,
  repoRoot,
  verifyCard = true,
} = {}) {
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: "review", repoRoot, verifyCard,
  });
  const review = validateIndependentReview(input, { stateDirectory, contract, grant });
  return mutateControllerState(stateDirectory, {
    type: `review.${review.outcome.toLocaleLowerCase("en-US")}`,
    taskKey: review.task_key,
    runId: review.reviewer_run_id,
    payload: { review },
  }, (state) => {
    const task = state.tasks[review.task_key];
    task.review_record = review;
    task.reviewer_run_ids = [...new Set([...(task.reviewer_run_ids ?? []), review.reviewer_run_id])];
    if (review.outcome === "APPROVED") {
      task.status = "APPROVED";
      task.phase = "CLOSEOUT";
    } else if (review.outcome === "CHANGES_REQUESTED") {
      task.status = "CHANGES_REQUESTED";
      task.phase = "CORRECT";
    } else {
      task.status = "BLOCKED";
      task.phase = "INDEPENDENT_REVIEW";
    }
    return structuredClone(review);
  }).result;
}

export function issueApprovalRecord({
  stateDirectory,
  contract,
  grant,
  capability,
  repoRoot,
  verifyCard = true,
  now = new Date(),
}) {
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: "approve", repoRoot, verifyCard, now,
  });
  const state = readControllerState(stateDirectory);
  const review = state.tasks[contract.task_key]?.review_record;
  if (!review || review.outcome !== "APPROVED") throw new Error("Controller approval requires a stored APPROVED review.");
  validateIndependentReview(review, { stateDirectory, contract, grant, allowRecorded: true });
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
    validation_digest: review.validation_digest,
    review_evidence_digest: review.review_evidence_digest,
    approval_revision: revision,
    issued_at: now.toISOString(),
  });
  return mutateControllerState(stateDirectory, {
    type: "approval.issued",
    taskKey: approval.task_key,
    runId: approval.reviewer_run_id,
    payload: { approval },
  }, (next) => {
    next.approvals[approval.task_key] = approval;
    next.tasks[approval.task_key].approval_revision = revision;
    return structuredClone(approval);
  }).result;
}

export function reviewDispatchPlan(contract, grant, implementation) {
  assertIndependentRoles(contract.owner_role, contract.reviewer_role);
  if (!implementation.head_sha || !implementation.base_sha || implementation.status !== "COMPLETED") {
    throw new Error("Review requires an authoritative completed implementation base/head.");
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
