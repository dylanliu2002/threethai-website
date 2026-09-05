import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";
import {
  issueApprovalRecordInternal,
  recordIndependentReviewInternal,
  reviewEvidenceDigestInternal,
} from "./internal/review-engine.mjs";

export const reviewEvidenceDigest = reviewEvidenceDigestInternal;

export function recordIndependentReview(taskKey, review, capability, {
  repoRoot, ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  const now = new Date();
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  return recordIndependentReviewInternal(review, {
    engine, contract: trusted.contract, grant: trusted.grant, capability, now,
  });
}

export function issueApprovalRecord(taskKey, capability, {
  repoRoot, ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  const now = new Date();
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  return issueApprovalRecordInternal({
    engine, contract: trusted.contract, grant: trusted.grant, capability, now,
  });
}
