import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";
import {
  assertPublishingAllowedInternal,
  planPublishingInternal,
  verifyGitIdentityInternal,
} from "./internal/publishing-engine.mjs";

// Pure policy/data checks.
export const assertPublishingAllowed = assertPublishingAllowedInternal;
export const verifyGitIdentity = verifyGitIdentityInternal;

export function assertPublishingContext(taskKey, capability, action, {
  repoRoot, now = new Date(), ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey, { now });
  const engine = productionEngineInternal(repoRoot, taskKey);
  return planPublishingInternal({
    engine, contract: trusted.contract, grant: trusted.grant,
    capability, action, now,
  });
}

export function prPlan(taskKey, capability, options = {}) {
  const verified = assertPublishingContext(taskKey, capability, "pr", options);
  return {
    mutation: "github.pull_request.create",
    head: verified.branch,
    base: "main",
    current_head_sha: verified.head_sha,
  };
}

export function runPrMutation() {
  throw new Error("Live GitHub mutation remains disabled; SYS-AUTO-001 creates no PR.");
}
