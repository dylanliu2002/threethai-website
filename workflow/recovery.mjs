import fs from "node:fs";
import path from "node:path";
import { RuntimeEventSchema } from "./schemas.mjs";

export function replayEvents(events) {
  const ordered = events.map((event) => RuntimeEventSchema.parse(event))
    .sort((left, right) => left.sequence - right.sequence);
  const seen = new Set();
  const state = new Map();
  let expected = 0;
  for (const event of ordered) {
    if (seen.has(event.event_id)) continue;
    if (event.sequence !== expected) {
      throw new Error(`Runtime event sequence gap: expected ${expected}, got ${event.sequence}`);
    }
    expected += 1;
    seen.add(event.event_id);
    const previous = state.get(event.task_key) ?? { events: [], last_run_id: null };
    previous.events.push(event.type);
    previous.last_run_id = event.run_id ?? previous.last_run_id;
    previous.last_event = event;
    state.set(event.task_key, previous);
  }
  return { state, event_ids: seen, next_sequence: expected };
}

export function readEventDirectory(runtimeDirectory) {
  if (!runtimeDirectory) return [];
  if (!fs.existsSync(runtimeDirectory)) return [];
  return fs.readdirSync(runtimeDirectory)
    .filter((name) => name.endsWith(".jsonl"))
    .sort()
    .flatMap((name) => fs.readFileSync(path.join(runtimeDirectory, name), "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line)));
}

export function reconcileRuntime(events) {
  const reconstructed = replayEvents(events);
  return {
    idempotent: true,
    task_count: reconstructed.state.size,
    event_count: reconstructed.event_ids.size,
    next_sequence: reconstructed.next_sequence,
    mutations: [],
  };
}
