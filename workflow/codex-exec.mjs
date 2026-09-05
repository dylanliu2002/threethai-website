import { spawn } from "node:child_process";
import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { loadTrustedTaskAuthority } from "./authority.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";
import {
  buildCodexExecArgsInternal,
  parseJsonlInternal,
  runCodexExecInternal,
  threadIdFromEventsInternal,
} from "./internal/run-engine.mjs";

// Pure DATA helpers used by static validation and focused tests.
export const buildCodexExecArgs = buildCodexExecArgsInternal;
export const parseJsonl = parseJsonlInternal;
export const threadIdFromEvents = threadIdFromEventsInternal;

// Production privileged facade. Trust/store/key/Grant/lease/fence/routing and
// process creation are controller-owned and cannot be injected by a caller.
export async function runCodexExec(options = {}) {
  assertNoAuthorityOverrides(options);
  const { repoRoot, taskKey, capability, prompt, signal } = options;
  if (!repoRoot || !taskKey || !capability || typeof prompt !== "string") {
    throw new Error("runCodexExec requires repoRoot, taskKey, capability and prompt DATA.");
  }
  const trusted = loadTrustedTaskAuthority(repoRoot, taskKey);
  const engine = productionEngineInternal(repoRoot, taskKey);
  return runCodexExecInternal({
    engine,
    contract: trusted.contract,
    grant: trusted.grant,
    capability,
    prompt,
    signal,
    spawnImpl: spawn,
  });
}
