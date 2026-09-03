import { ReviewRecordSchema } from "./schemas.mjs";
import { assertIndependentRoles } from "./roles.mjs";

export function validateIndependentReview(input) {
  const review = ReviewRecordSchema.parse(input);
  assertIndependentRoles(review.owner_role, review.reviewer_role);
  if (review.implementation_run_id === review.reviewer_run_id) {
    throw new Error("Reviewer must use a fresh run.");
  }
  if (review.implementation_thread_id === review.reviewer_thread_id) {
    throw new Error("Reviewer must use a fresh thread.");
  }
  if (review.implementation_contributors.includes(review.reviewer_worker_id)) {
    throw new Error("Implementation contributor cannot be the independent reviewer.");
  }
  return review;
}

export function reviewDispatchPlan(contract, implementation) {
  if (contract.owner_role === contract.reviewer_role) {
    throw new Error("Reviewer role equals owner role.");
  }
  if (!implementation.head_sha || !implementation.base_sha) {
    throw new Error("Review requires exact implementation base and head SHAs.");
  }
  return {
    task_key: contract.task_key,
    role_id: contract.reviewer_role,
    fresh_thread: true,
    fresh_run: true,
    repository_access: "read-only",
    reviewed_base_sha: implementation.base_sha,
    reviewed_head_sha: implementation.head_sha,
    contract_revision: contract.contract_revision,
  };
}
