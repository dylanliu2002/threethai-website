import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { planCorrectionInternal } from "./internal/correction-engine.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";

export function planCorrection(taskKey, capability, {
  repoRoot, now = new Date(), ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey, { now });
  const engine = productionEngineInternal(repoRoot, taskKey);
  return planCorrectionInternal({
    engine, contract: trusted.contract, grant: trusted.grant, capability, now,
  });
}
