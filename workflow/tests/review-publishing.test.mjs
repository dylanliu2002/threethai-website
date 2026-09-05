import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalStillValid } from "../state.mjs";
import { deriveActualChanges } from "../git-evidence.mjs";
import { issueCapabilityInternal } from "../internal/capability-engine.mjs";
import { finalizeCloseoutInternal } from "../internal/closeout-engine.mjs";
import { planCorrectionInternal } from "../internal/correction-engine.mjs";
import { completeRunInternal, releaseTaskLeaseInternal, reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import { assertPublishingAllowedInternal, planPublishingInternal } from "../internal/publishing-engine.mjs";
import {
  issueApprovalRecordInternal,
  recordIndependentReviewInternal,
  validateIndependentReviewAgainstStateInternal,
} from "../internal/review-engine.mjs";
import { readControllerStateInternal } from "../internal/controller-state-engine.mjs";
import { cleanupFixture, git, makeGitFixture } from "./helpers.mjs";

const VALIDATION_DIGEST = "c".repeat(64);

function reserve(fixture, roleId, wakeupId) {
  return reserveTaskDispatchInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    wakeupId, baseSha: fixture.baseSha, roleId,
  });
}

function capability(fixture, admitted, action, headSha = fixture.baseSha) {
  return issueCapabilityInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    action, runId: admitted.run.run_id, headSha,
  });
}

function complete(fixture, admitted, cap, outcome, threadId, validationDigest = VALIDATION_DIGEST) {
  const scope = deriveActualChanges(fixture.repoRoot, fixture.baseSha);
  return completeRunInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    capability: cap, processExitCode: 0, outputValid: true,
    output: {
      outcome,
      head_sha: fixture.baseSha,
      summary: `authoritative ${outcome} review result`,
      validation: [{ name: "review checks", outcome: "PASS", evidence: "controller test evidence" }],
      findings: outcome === "APPROVED" ? [] : [{ severity: "MAJOR", message: "test finding" }],
      requested_actions: [],
    },
    actualHeadSha: fixture.baseSha,
    scopeEvidence: { ...scope, passed: true },
    validationEvidence: { passed: true, evidence_digest: validationDigest },
    threadId, reportedModel: fixture.grant.routing.requested_model,
  });
}

function setupReview(t, outcome = "APPROVED") {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const implementation = reserve(fixture, fixture.contract.owner_role, "implementation");
  const implementationCapability = capability(fixture, implementation, "dispatch");
  complete(fixture, implementation, implementationCapability, "COMPLETED", "thread-implementation");
  releaseTaskLeaseInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    capability: implementationCapability,
  });
  const reviewer = reserve(fixture, fixture.contract.reviewer_role, "reviewer");
  const reviewerCapability = capability(fixture, reviewer, "review");
  const completedReviewer = complete(
    fixture, reviewer, reviewerCapability, outcome, "thread-reviewer",
  );
  const review = structuredClone(completedReviewer.review_result);
  return { fixture, implementation, implementationCapability, reviewer, reviewerCapability, review };
}

test("REVIEW-LEGACY-01 approved prose without authoritative reviewer run is rejected", () => {
  assert.throws(() => validateIndependentReviewAgainstStateInternal({ outcome: "APPROVED" }, {}));
});

test("REVIEW-02 empty review evidence is rejected", (t) => {
  const env = setupReview(t);
  const forged = { ...env.review, review_evidence: [] };
  assert.throws(() => validateIndependentReviewAgainstStateInternal(forged, {
    state: readControllerStateInternal(env.fixture.stateDirectory),
    contract: env.fixture.contract, grant: env.fixture.grant, capability: env.reviewerCapability,
  }));
});

test("REVIEW-03 same implementation and reviewer run is rejected", (t) => {
  const env = setupReview(t);
  const forged = { ...env.review, reviewer_run_id: env.review.implementation_run_id };
  assert.throws(() => validateIndependentReviewAgainstStateInternal(forged, {
    state: readControllerStateInternal(env.fixture.stateDirectory),
    contract: env.fixture.contract, grant: env.fixture.grant, capability: env.reviewerCapability,
  }), /fresh run|authoritative|exactly match/i);
});

test("REVIEW-04 reviewer Role must match authorization grant", (t) => {
  const env = setupReview(t);
  const forged = { ...env.review, reviewer_role: "TECHNICAL_SEO" };
  assert.throws(() => validateIndependentReviewAgainstStateInternal(forged, {
    state: readControllerStateInternal(env.fixture.stateDirectory),
    contract: env.fixture.contract, grant: env.fixture.grant, capability: env.reviewerCapability,
  }), /independent|authoritative|match/i);
});

test("approval cannot be issued from model prose without stored review", (t) => {
  const env = setupReview(t);
  const approveCapability = capability(env.fixture, env.reviewer, "approve");
  assert.throws(() => issueApprovalRecordInternal({
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: approveCapability,
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
  recordIndependentReviewInternal(env.review, {
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability,
  });
  releaseTaskLeaseInternal({
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability,
  });
  const corrective = reserve(env.fixture, env.fixture.contract.owner_role, "corrective");
  const correctCapability = capability(env.fixture, corrective, "correct");
  const plan = planCorrectionInternal({
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: correctCapability,
    claimedCorrectionCount: 99,
  });
  assert.equal(plan.next_cycle, 1);
});

test("CORRECT-02 corrective review cannot reuse previous reviewer run", (t) => {
  const env = setupReview(t, "CHANGES_REQUESTED");
  recordIndependentReviewInternal(env.review, {
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability,
  });
  assert.throws(() => validateIndependentReviewAgainstStateInternal(env.review, {
    state: readControllerStateInternal(env.fixture.stateDirectory),
    contract: env.fixture.contract, grant: env.fixture.grant, capability: env.reviewerCapability,
  }), /new reviewer run/i);
});

test("CLOSEOUT legacy: closeout changing implementation file is rejected", (t) => {
  const env = setupReview(t, "APPROVED");
  recordIndependentReviewInternal(env.review, {
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability,
  });
  const approveCapability = capability(env.fixture, env.reviewer, "approve");
  issueApprovalRecordInternal({
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: approveCapability,
  });
  releaseTaskLeaseInternal({
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: env.reviewerCapability,
  });
  const closeoutRun = reserve(env.fixture, env.fixture.contract.owner_role, "closeout");
  const closeoutCapability = capability(env.fixture, closeoutRun, "closeout");
  fs.mkdirSync(path.join(env.fixture.repoRoot, "src"));
  fs.writeFileSync(path.join(env.fixture.repoRoot, "src", "implementation.ts"), "changed\n");
  git(env.fixture.repoRoot, ["add", "."]);
  git(env.fixture.repoRoot, ["commit", "-m", "test: forbidden closeout change"]);
  assert.throws(() => finalizeCloseoutInternal({
    engine: env.fixture.engine, contract: env.fixture.contract,
    grant: env.fixture.grant, capability: closeoutCapability,
  }), /implementation path/i);
});

test("PUBLISH-01 wrong Git identity is rejected", (t) => {
  const fixture = makeGitFixture({ status: "APPROVED", phase: "CLOSEOUT" });
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.owner_role, "publish-identity");
  const pushCapability = capability(fixture, admitted, "push");
  git(fixture.repoRoot, ["config", "user.email", "wrong@example.com"]);
  assert.throws(() => planPublishingInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    capability: pushCapability, action: "push",
  }), /identity mismatch/i);
});

test("PUBLISH-02 current SHA differing from capability or approval is rejected", (t) => {
  const fixture = makeGitFixture({ status: "APPROVED", phase: "CLOSEOUT" });
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.owner_role, "publish-sha");
  const pushCapability = capability(fixture, admitted, "push");
  fs.writeFileSync(path.join(fixture.repoRoot, "allowed.txt"), "new\n");
  git(fixture.repoRoot, ["add", "allowed.txt"]);
  git(fixture.repoRoot, ["commit", "-m", "test: advance head"]);
  assert.throws(() => planPublishingInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    capability: pushCapability, action: "push",
  }), /current Git SHA/i);
});

test("PUBLISH-03 task pr=false overrides generic policy=true", () => {
  const fixture = makeGitFixture();
  try {
    assert.throws(() => assertPublishingAllowedInternal(fixture.grant, "pr"), /not authorized/i);
  } finally {
    cleanupFixture(fixture.repoRoot, fixture.stateDirectory);
  }
});
