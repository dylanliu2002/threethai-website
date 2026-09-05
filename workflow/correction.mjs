import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { planCorrectionInternal } from "./internal/correction-engine.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";

export function planCorrection(taskKey, capability, {
  repoRoot, ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  const now = new Date();
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  return planCorrectionInternal({
    engine, contract: trusted.contract, grant: trusted.grant, capability, now,
  });
}
