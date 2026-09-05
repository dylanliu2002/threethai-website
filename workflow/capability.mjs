import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { assertCapabilityAgainstStateInternal } from "./internal/capability-engine.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";
import { readControllerStateInternal } from "./internal/controller-state-engine.mjs";

// Public verification resolves all AUTHORITY internally. The task key,
// capability claim and expected action are DATA; callers cannot choose the
// state store, Grant, signing key, lease or trust anchor.
export function validateControllerCapability(taskKey, capability, {
  repoRoot,
  action,
  now = new Date(),
  ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  if (!repoRoot || !action) throw new Error("Capability verification requires repoRoot and action.");
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey, { now });
  const engine = productionEngineInternal(repoRoot, taskKey);
  const state = readControllerStateInternal(engine.stateDirectory);
  return assertCapabilityAgainstStateInternal(capability, {
    engine,
    state,
    contract: trusted.contract,
    grant: trusted.grant,
    action,
    now,
  });
}
