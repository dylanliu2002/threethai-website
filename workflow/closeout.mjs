import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { finalizeCloseoutInternal } from "./internal/closeout-engine.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";

// There is intentionally no caller-supplied closeout plan. The current Grant,
// approval, reviewed head, lease/fence and administrative scope are reloaded and
// validated inside the single authoritative state transaction.
export function finalizeCloseout(taskKey, capability, {
  repoRoot, ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  if (typeof taskKey !== "string") throw new Error("Closeout requires a canonical task key.");
  const now = new Date();
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  return finalizeCloseoutInternal({
    engine, contract: trusted.contract, grant: trusted.grant, capability, now,
  });
}
