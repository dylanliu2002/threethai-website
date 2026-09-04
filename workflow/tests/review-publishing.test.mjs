import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { issueControllerCapability } from "../capability.mjs";
import { closeoutPlan, finalizeCloseout } from "../closeout.mjs";
import { planCorrection } from "../correction.mjs";
import {
  completeAuthoritativeRun,
  releaseTaskLease,
  reserveTaskDispatch,
} from "../durable-leases.mjs";
import {
  assertPublishingAllowed,
  assertPublishingContext,
} from "../publishing.mjs";
import {
  issueApprovalRecord,
  recordIndependentReview,
  reviewEvidenceDigest,
  validateIndependentReview,
} from "../review.mjs";
import { approvalStillValid } from "../state.mjs";
import { cleanupFixture, git, makeGitFixture } from "./helpers.mjs";

const VALIDATION_DIGEST = "c".repeat(64);

function reserve(fixture, roleId, wakeupId) {
  return reserveTaskDispatch({
    stateDirectory: fixture.stateDirectory,
    contract: fixture.contract,
    grant: fixture.grant,
    wakeupId,
    baseSha: fixture.baseSha,
    roleId,
    repoRoot: fixture.repoRoot,
  });
}

function capability(fixture, admitted, action, headSha = fixture.baseSha) {
  return issueControllerCapability({
    stateDirectory: fixture.stateDirectory,
    contract: fixture.contract,
    grant: fixture.grant,
    action,
    runId: admitted.run.run_id,
    leaseId: admitted.lease.lease_id,
    fencingToken: admitted.lease.fencing_token,
    headSha,
    repoRoot: fixture.repoRoot,
  });
}

function setupReview(t, outcome = "APPROVED") {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const implementation = reserve(fixture, fixture.contract.owner_role, "implementation");
  const implementationCapability = capability(fixture, implementation, "dispatch");
  completeAuthoritativeRun({
    stateDirectory: fixture.stateDirectory, contract: fixture.contract, grant: fixture.grant,
    capability: implementationCapability, repoRoot: fixture.repoRoot,
    threadId: "thread-implementation",
    reportedModel: fixture.grant.routing.requested_model,
    headSha: fixture.baseSha,
    validationDigest: VALIDATION_DIGEST,
  });
  releaseTaskLease({
    stateDirectory: fixture.stateDirectory, contract: fixture.contract, grant: fixture.grant,
    capability: implementationCapability, repoRoot: fixture.repoRoot,
  });
  const reviewer = reserve(fixture, fixture.contract.reviewer_role, "reviewer");
  const reviewerCapability = capability(fixture, reviewer, "review");
  completeAuthoritativeRun({
    stateDirectory: fixture.stateDirectory, contract: fixture.contract, grant: fixture.grant,
    capability: reviewerCapability, repoRoot: fixture.repoRoot,
    threadId: "thread-reviewer",
    reportedModel: fixture.grant.routing.requested_model,
    headSha: fixture.baseSha,
  });
  const evidence = ["diff inspected", "required validation passed"];
  const review = {
    schema_version: "2.0.0",
    task_key: fixture.contract.task_key,
    contract_revision: fixture.contract.contract_revision,
    contract_digest: fixture.grant.contract_digest,
    authorization_revision: fixture.grant.authorization_revision,
    owner_role: fixture.grant.owner_role,
    reviewer_role: fixture.grant.reviewer_role,
    implementation_run_id: implementation.run.run_id,
    reviewer_run_id: reviewer.run.run_id,
    reviewer_thread_id: "thread-reviewer",
    reviewer_worker_id: reviewer.run.worker_id,
    reviewed_base_sha: fixture.baseSha,
    reviewed_head_sha: fixture.baseSha,
    validation_digest: VALIDATION_DIGEST,
    review_evidence: evidence,
    review_evidence_digest: reviewEvidenceDigest(evidence),
    review_completed_at: new Date().toISOString(),
    outcome,
  };
  return { fixture, implementation, implementationCapability, reviewer, reviewerCapability, review };
}

test("REVIEW-01 approved prose without authoritative reviewer run is rejected", () => {
  assert.throws(() => validateIndependentReview({ outcome: "APPROVED" }), /authoritative controller state/i);
});

test("REVIEW-02 empty review evidence is rejected", (t) => {
  const env = setupReview(t);
  const forged = { ...env.review, review_evidence: [] };
  assert.throws(() => validateIndependentReview(forged, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract, grant: env.fixture.grant,
  }));
});

test("REVIEW-03 same implementation and reviewer run is rejected", (t) => {
  const env = setupReview(t);
  const forged = { ...env.review, reviewer_run_id: env.review.implementation_run_id };
  assert.throws(() => validateIndependentReview(forged, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract, grant: env.fixture.grant,
  }), /fresh run|authoritative/i);
});

test("REVIEW-04 reviewer Role must match authorization grant", (t) => {
  const env = setupReview(t);
  const forged = { ...env.review, reviewer_role: "TECHNICAL_SEO" };
  assert.throws(() => validateIndependentReview(forged, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract, grant: env.fixture.grant,
  }), /independent|authoritative|match/i);
});

test("approval cannot be issued from model prose without stored review", (t) => {
  const env = setupReview(t);
  const approveCapability = capability(env.fixture, env.reviewer, "approve");
  assert.throws(() => issueApprovalRecord({
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: approveCapability, repoRoot: env.fixture.repoRoot,
  }), /stored APPROVED review/i);
});

test("APPROVAL-01 reviewed head change invalidates approval", () => {
  const approval = {
    reviewed_head_sha: "a".repeat(40), reviewed_base_sha: "b".repeat(40),
    contract_revision: 2, contract_digest: "c".repeat(64), authorization_revision: 1,
    validation_digest: "d".repeat(64), review_evidence_digest: "e".repeat(64),
  };
  assert.equal(approvalStillValid(approval, {
    head_sha: "f".repeat(40), base_sha: approval.reviewed_base_sha,
    contract_revision: 2, contract_digest: approval.contract_digest,
    authorization_revision: 1, validation_digest: approval.validation_digest,
    review_evidence_digest: approval.review_evidence_digest,
  }), false);
});

test("CORRECT-01 caller correction_count is ignored in favor of durable state", (t) => {
  const env = setupReview(t, "CHANGES_REQUESTED");
  const reviewCapability = env.reviewerCapability;
  recordIndependentReview(env.review, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: reviewCapability, repoRoot: env.fixture.repoRoot,
  });
  releaseTaskLease({
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability, repoRoot: env.fixture.repoRoot,
  });
  const corrective = reserve(env.fixture, env.fixture.contract.owner_role, "corrective");
  const correctCapability = capability(env.fixture, corrective, "correct");
  const plan = planCorrection({
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: correctCapability, repoRoot: env.fixture.repoRoot,
    claimedCorrectionCount: 99,
  });
  assert.equal(plan.next_cycle, 1);
});

test("CORRECT-02 corrective review cannot reuse previous reviewer run", (t) => {
  const env = setupReview(t, "CHANGES_REQUESTED");
  const reviewCapability = env.reviewerCapability;
  recordIndependentReview(env.review, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: reviewCapability, repoRoot: env.fixture.repoRoot,
  });
  assert.throws(() => validateIndependentReview(env.review, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract, grant: env.fixture.grant,
  }), /new reviewer run/i);
});

test("CLOSEOUT-01 closeout changing implementation file is rejected", (t) => {
  const env = setupReview(t, "APPROVED");
  const reviewCapability = env.reviewerCapability;
  recordIndependentReview(env.review, {
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: reviewCapability, repoRoot: env.fixture.repoRoot,
  });
  const approveCapability = capability(env.fixture, env.reviewer, "approve");
  issueApprovalRecord({
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: approveCapability, repoRoot: env.fixture.repoRoot,
  });
  releaseTaskLease({
    stateDirectory: env.fixture.stateDirectory, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability, repoRoot: env.fixture.repoRoot,
  });
  const closeoutRun = reserve(env.fixture, env.fixture.contract.owner_role, "closeout");
  const closeoutCapability = capability(env.fixture, closeoutRun, "closeout");
  const plan = closeoutPlan({
    stateDirectory: env.fixture.stateDirectory, repoRoot: env.fixture.repoRoot,
    contract: env.fixture.contract, grant: env.fixture.grant, capability: closeoutCapability,
  });
  fs.mkdirSync(path.join(env.fixture.repoRoot, "src"));
  fs.writeFileSync(path.join(env.fixture.repoRoot, "src", "implementation.ts"), "changed\n");
  git(env.fixture.repoRoot, ["add", "."]);
  git(env.fixture.repoRoot, ["commit", "-m", "test: forbidden closeout change"]);
  assert.throws(() => finalizeCloseout(plan, {
    stateDirectory: env.fixture.stateDirectory, repoRoot: env.fixture.repoRoot,
    contract: env.fixture.contract, grant: env.fixture.grant, capability: closeoutCapability,
  }), /implementation path/i);
});

test("PUBLISH-01 wrong Git identity is rejected", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.owner_role, "publish-identity");
  const pushCapability = capability(fixture, admitted, "push");
  git(fixture.repoRoot, ["config", "user.email", "wrong@example.com"]);
  assert.throws(() => assertPublishingContext({
    stateDirectory: fixture.stateDirectory, repoRoot: fixture.repoRoot,
    contract: fixture.contract, grant: fixture.grant, capability: pushCapability, action: "push",
  }), /identity mismatch/i);
});

test("PUBLISH-02 current SHA differing from capability or approval is rejected", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.owner_role, "publish-sha");
  const pushCapability = capability(fixture, admitted, "push");
  fs.writeFileSync(path.join(fixture.repoRoot, "allowed.txt"), "new\n");
  git(fixture.repoRoot, ["add", "allowed.txt"]);
  git(fixture.repoRoot, ["commit", "-m", "test: advance head"]);
  assert.throws(() => assertPublishingContext({
    stateDirectory: fixture.stateDirectory, repoRoot: fixture.repoRoot,
    contract: fixture.contract, grant: fixture.grant, capability: pushCapability, action: "push",
  }), /current Git SHA/i);
});

test("PUBLISH-03 task pr=false overrides generic policy=true", () => {
  const fixture = makeGitFixture();
  try {
    assert.throws(() => assertPublishingAllowed(fixture.grant, "pr", { genericPolicy: true }), /not authorized/i);
  } finally {
    cleanupFixture(fixture.repoRoot, fixture.stateDirectory);
  }
});
