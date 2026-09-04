import fs from "node:fs";
import path from "node:path";
import { recoverControllerState, replayControllerJournal } from "./controller-state.mjs";
import { RuntimeEventSchema } from "./schemas.mjs";

export function readEventDirectory(runtimeDirectory) {
  if (!runtimeDirectory || !fs.existsSync(runtimeDirectory)) return [];
  const candidates = fs.statSync(runtimeDirectory).isDirectory()
    ? [path.join(runtimeDirectory, "controller-journal.jsonl")]
    : [runtimeDirectory];
  return candidates.filter(fs.existsSync).flatMap((file) =>
    fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)
      .map((line) => RuntimeEventSchema.parse(JSON.parse(line))));
}

export function replayEvents(events) {
  return replayControllerJournal(events);
}

export function reconcileRuntime(stateDirectory, { repair = false } = {}) {
  const recovered = recoverControllerState(stateDirectory, { repair });
  const state = recovered.state;
  return {
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
