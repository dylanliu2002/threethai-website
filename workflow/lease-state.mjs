import { readControllerState } from "./controller-state.mjs";

export function assertCurrentLease(stateDirectory, {
  taskKey,
  runId,
  leaseId,
  fencingToken,
  now = new Date(),
}) {
  const state = readControllerState(stateDirectory);
  const lease = state.leases[leaseId];
  const task = state.tasks[taskKey];
  const run = state.runs[runId];
  if (!lease || !task || !run
    || lease.task_key !== taskKey
    || lease.run_id !== runId
    || lease.fencing_token !== fencingToken
    || task.lease_id !== leaseId
    || task.current_run_id !== runId
    || task.fencing_token !== fencingToken
    || run.lease_id !== leaseId
    || run.fencing_token !== fencingToken
    || lease.expires_at_ms <= now.getTime()) {
    throw new Error("Lease/fencing authority is missing, expired, or stale.");
  }
  return { state, lease, task, run };
}
