import crypto from "node:crypto";
import { dependenciesSatisfied, validateTaskGraph } from "./dependencies.mjs";
import { contractLockRequests } from "./locks.mjs";

function eligible(contract, graph) {
  if (contract.status === "ON_HOLD" || contract.status === "BLOCKED") return false;
  if (!contract.authorization.activation_authorized || !contract.permissions.worker_dispatch) return false;
  if (!dependenciesSatisfied(contract, graph)) return false;
  return [
    "READY/QUEUED",
    "IN_PROGRESS/IMPLEMENT",
    "IN_PROGRESS/VALIDATE",
    "CHANGES_REQUESTED/CORRECT",
    "REVIEW/INDEPENDENT_REVIEW",
    "APPROVED/CLOSEOUT",
  ].includes(`${contract.status}/${contract.phase}`);
}

export class Scheduler {
  #locks;
  #maxWorkers;
  #active = new Map();
  #seenWakeups = new Set();

  constructor({ lockManager, maxWorkers = 2 }) {
    if (!lockManager) throw new Error("Scheduler requires a lock manager.");
    this.#locks = lockManager;
    this.#maxWorkers = maxWorkers;
  }

  plan(contracts, { wakeupId = crypto.randomUUID(), now = Date.now() } = {}) {
    if (this.#seenWakeups.has(wakeupId)) {
      return { wakeup_id: wakeupId, duplicate: true, dispatches: [], blocked: [] };
    }
    this.#seenWakeups.add(wakeupId);
    const graph = validateTaskGraph(contracts);
    const dispatches = [];
    const blocked = [];
    let slots = Math.max(0, this.#maxWorkers - this.#active.size);
    for (const contract of contracts) {
      if (slots === 0) break;
      if (this.#active.has(contract.task_key) || !eligible(contract, graph)) continue;
      const result = this.#locks.acquire(
        contract.task_key,
        contractLockRequests(contract),
        { now, ttlMs: contract.limits.lease_seconds * 1000 },
      );
      if (!result.acquired) {
        blocked.push({ task_key: contract.task_key, ...result });
        continue;
      }
      const dispatch = {
        task_key: contract.task_key,
        lease_id: result.lease.leaseId,
        status: contract.status,
        phase: contract.phase,
      };
      this.#active.set(contract.task_key, dispatch);
      dispatches.push(dispatch);
      slots -= 1;
    }
    return { wakeup_id: wakeupId, duplicate: false, dispatches, blocked };
  }

  complete(taskKey) {
    const active = this.#active.get(taskKey);
    if (!active) return false;
    this.#locks.release(active.lease_id);
    this.#active.delete(taskKey);
    return true;
  }

  active() {
    return [...this.#active.values()].map((value) => ({ ...value }));
  }
}

export function isDispatchEligible(contract, contracts) {
  return eligible(contract, validateTaskGraph(contracts));
}
