import { execFileSync } from "node:child_process";
import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";
import {
  releaseTaskLeaseInternal,
  reserveTaskDispatchInternal,
} from "./internal/lease-engine.mjs";

function head(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).trim();
}

export function reserveTaskDispatch(taskKey, {
  repoRoot,
  wakeupId,
  ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  if (!repoRoot || !wakeupId) throw new Error("Dispatch admission requires repoRoot and wakeupId.");
  const now = new Date();
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  const roleId = trusted.contract.phase === "INDEPENDENT_REVIEW"
    ? trusted.grant.reviewer_role
    : trusted.grant.owner_role;
  return reserveTaskDispatchInternal({
    engine, contract: trusted.contract, grant: trusted.grant, wakeupId,
    baseSha: head(repoRoot), roleId, now,
  });
}

export function releaseTaskLease(taskKey, capability, {
  repoRoot,
  ...forbidden
} = {}) {
  assertNoAuthorityOverrides(forbidden);
  if (!repoRoot) throw new Error("Lease release requires repoRoot.");
  const now = new Date();
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  return releaseTaskLeaseInternal({
    engine, contract: trusted.contract, grant: trusted.grant, capability, now,
  });
}
