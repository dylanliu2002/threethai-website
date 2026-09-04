import crypto from "node:crypto";
import { dependenciesSatisfied, validateTaskGraph } from "./dependencies.mjs";
import { readControllerState } from "./controller-state.mjs";
import { reserveTaskDispatch } from "./durable-leases.mjs";

export function isDispatchEligible(contract, grant, contracts) {
  if (contract.status === "ON_HOLD" || contract.status === "BLOCKED") return false;
  if (!grant.activation.autonomous || !grant.activation.worker_dispatch || !grant.permissions.worker_dispatch) return false;
  if (!dependenciesSatisfied(contract, validateTaskGraph(contracts))) return false;
  return [
    "READY/QUEUED",
    "IN_PROGRESS/IMPLEMENT",
    "IN_PROGRESS/CORRECT",
    "IN_PROGRESS/VALIDATE",
    "CHANGES_REQUESTED/CORRECT",
    "REVIEW/INDEPENDENT_REVIEW",
    "APPROVED/CLOSEOUT",
  ].includes(`${contract.status}/${contract.phase}`);
}

export class Scheduler {
  constructor({ stateDirectory, repoRoot }) {
    if (!stateDirectory) throw new Error("Scheduler requires controller-owned durable state.");
    this.stateDirectory = stateDirectory;
    this.repoRoot = repoRoot;
  }

  plan(contracts, grants, {
    dryRun = true,
    wakeupId = crypto.randomUUID(),
    baseSha = "0".repeat(40),
  } = {}) {
    const graph = validateTaskGraph(contracts);
    const state = readControllerState(this.stateDirectory);
    const dispatches = [];
    const blocked = [];
    for (const contract of contracts) {
      const grant = grants.get(contract.task_key);
      if (!grant || !isDispatchEligible(contract, grant, contracts) || !state.activation.authorized) continue;
      if (dryRun) {
        dispatches.push({ task_key: contract.task_key, planned: true });
        continue;
      }
      const result = reserveTaskDispatch({
        stateDirectory: this.stateDirectory,
        contract,
        grant,
        wakeupId: `${wakeupId}:${contract.task_key}`,
        baseSha,
        roleId: contract.phase === "INDEPENDENT_REVIEW" ? contract.reviewer_role : contract.owner_role,
        repoRoot: this.repoRoot,
      });
      if (result.acquired) dispatches.push(result);
      else blocked.push({ task_key: contract.task_key, ...result });
    }
    return { wakeup_id: wakeupId, dry_run: dryRun, dispatches, blocked, graph_size: graph.size };
  }
}
