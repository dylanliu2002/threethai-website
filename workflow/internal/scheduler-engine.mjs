import crypto from "node:crypto";
import { dependenciesSatisfied, validateTaskGraph } from "../dependencies.mjs";
import { readControllerStateInternal } from "./controller-state-engine.mjs";
import { reserveTaskDispatchInternal } from "./lease-engine.mjs";
import { pilotTaskKeyAuthorized } from "../pilot-security.mjs";

export function isDispatchEligibleInternal(contract, grant, contracts) {
  if (contract.status === "ON_HOLD" || contract.status === "BLOCKED") return false;
  const activationEligible = grant.activation.autonomous
    || grant.activation.synthetic_pilot_once?.task_key === contract.task_key;
  if (!activationEligible || !grant.activation.worker_dispatch || !grant.permissions.worker_dispatch) return false;
  if (!dependenciesSatisfied(contract, validateTaskGraph(contracts))) return false;
  return [
    "READY/QUEUED", "IN_PROGRESS/IMPLEMENT", "IN_PROGRESS/CORRECT",
    "IN_PROGRESS/VALIDATE", "CHANGES_REQUESTED/CORRECT",
    "REVIEW/INDEPENDENT_REVIEW", "APPROVED/CLOSEOUT",
  ].includes(`${contract.status}/${contract.phase}`);
}

export function planScheduleInternal(engine, contracts, grants, {
  dryRun = true, wakeupId = crypto.randomUUID(), baseSha = "0".repeat(40),
  pilotPolicy = null,
} = {}) {
  const graph = validateTaskGraph(contracts);
  const state = readControllerStateInternal(engine.stateDirectory);
  const dispatches = [];
  const blocked = [];
  for (const contract of contracts) {
    const grant = grants.get(contract.task_key);
    if (pilotPolicy && !pilotTaskKeyAuthorized(contract.task_key, pilotPolicy)) {
      blocked.push({
        task_key: contract.task_key,
        acquired: false,
        reason: pilotPolicy.activation_enabled ? "pilot-task-not-authorized" : "pilot-mode-inactive",
      });
      continue;
    }
    const pilotActivation = state.pilot_activation;
    const oneTimePilotReady = pilotActivation?.status === "READY"
      && pilotActivation.task_key === contract.task_key
      && pilotActivation.authorization_id === grant?.authorization_id
      && pilotActivation.contract_digest === grant?.contract_digest
      && pilotActivation.card_blob_sha === grant?.card_blob_sha
      && pilotActivation.dispatch_attempts === 0;
    const generalActivationReady = state.activation.authorized && grant?.activation.autonomous;
    if (!grant || !isDispatchEligibleInternal(contract, grant, contracts)
      || (!generalActivationReady && !oneTimePilotReady)) continue;
    if (dryRun) {
      dispatches.push({ task_key: contract.task_key, planned: true });
      continue;
    }
    const roleId = contract.phase === "INDEPENDENT_REVIEW" ? grant.reviewer_role : grant.owner_role;
    const result = reserveTaskDispatchInternal({
      engine: { ...engine, loadGrant: () => grants.get(contract.task_key) },
      contract, grant, wakeupId: `${wakeupId}:${contract.task_key}`,
      baseSha, roleId, maxWorkersCeiling: pilotPolicy?.max_workers,
      pilotActivationId: oneTimePilotReady ? pilotActivation.activation_id : null,
    });
    if (result.acquired) dispatches.push(result);
    else blocked.push({ task_key: contract.task_key, ...result });
  }
  return { wakeup_id: wakeupId, dry_run: dryRun, dispatches, blocked, graph_size: graph.size };
}
