import { recoverControllerStateInternal, replayControllerJournalInternal } from "./controller-state-engine.mjs";

export const replayEventsInternal = replayControllerJournalInternal;

export function reconcileRuntimeInternal(stateDirectory, { repair = false } = {}) {
  const recovered = recoverControllerStateInternal(stateDirectory, { repair });
  const state = recovered.state;
  return {
    available: recovered.available,
    idempotent: true,
    state_revision: state.revision,
    event_count: recovered.event_count,
    task_count: Object.keys(state.tasks).length,
    run_count: Object.keys(state.runs).length,
    live_lease_count: Object.keys(state.leases).length,
    reservation_count: Object.keys(state.reservations).length,
    approval_count: Object.keys(state.approvals).length,
    correction_count: Object.values(state.tasks).reduce((sum, task) => sum + (task.correction_count ?? 0), 0),
    reconstructed: recovered.reconstructed,
    repair_needed: recovered.repair_needed,
    mutations: [],
  };
}
