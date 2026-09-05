import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { canonicalJson } from "../canonical.mjs";
import { SCHEMA_VERSION } from "../constants.mjs";
import { RuntimeEventSchema } from "../schemas.mjs";
import { assertNoSecretsDeep, sanitizeForLog } from "../secrets.mjs";

const STATE_VERSION = "2.0.0";
const PROCESS_START_IDENTITY = new Date(Date.now() - process.uptime() * 1000).toISOString();

export function emptyControllerStateInternal() {
  return {
    state_version: STATE_VERSION,
    revision: 0,
    next_sequence: 1,
    fencing_generation: 0,
    activation: { authorized: false, revision: 1, updated_at: null, source: "SYS-AUTO-001 bootstrap default" },
    wakeups: {}, tasks: {}, runs: {}, leases: {}, reservations: {}, approvals: {},
    closeouts: {}, publishing: {}, validation_evidence: {},
  };
}

function statePath(stateDirectory) { return path.join(stateDirectory, "controller-state.json"); }
function journalPath(stateDirectory) { return path.join(stateDirectory, "controller-journal.jsonl"); }

function sleep(milliseconds) {
  const memory = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(memory, 0, 0, milliseconds);
}

function mutexPath(stateDirectory) { return path.join(stateDirectory, ".controller-mutex"); }
function mutexOwnerPath(stateDirectory) { return path.join(mutexPath(stateDirectory), "owner.json"); }

export function releaseStateMutexInternal(stateDirectory, ownerToken) {
  const mutex = mutexPath(stateDirectory);
  const ownerFile = mutexOwnerPath(stateDirectory);
  if (!fs.existsSync(ownerFile)) throw new Error("Controller mutex owner record is unavailable; refusing release.");
  const owner = JSON.parse(fs.readFileSync(ownerFile, "utf8"));
  if (!ownerToken || owner.owner_token !== ownerToken
    || owner.owner_pid !== process.pid
    || owner.owner_process_start_identity !== PROCESS_START_IDENTITY) {
    throw new Error("Controller mutex release requires the exact owner process identity and token.");
  }
  fs.unlinkSync(ownerFile);
  fs.rmdirSync(mutex);
  return { released: true, lock_id: owner.lock_id, owner_pid: owner.owner_pid };
}

export function withStateMutexInternal(stateDirectory, operation, { timeoutMs = 45_000 } = {}) {
  fs.mkdirSync(stateDirectory, { recursive: true, mode: 0o700 });
  const mutex = mutexPath(stateDirectory);
  const deadline = Date.now() + timeoutMs;
  const ownerToken = crypto.randomUUID();
  let acquired = false;
  for (;;) {
    try {
      fs.mkdirSync(mutex);
      acquired = true;
      fs.writeFileSync(mutexOwnerPath(stateDirectory), `${JSON.stringify({
        lock_id: crypto.randomUUID(),
        owner_pid: process.pid,
        owner_process_start_identity: PROCESS_START_IDENTITY,
        owner_token: ownerToken,
        created_at: new Date().toISOString(),
      }, null, 2)}\n`, { mode: 0o600, flag: "wx" });
      break;
    } catch (error) {
      if (acquired) {
        try { fs.rmdirSync(mutex); } catch { /* fail closed if initialization was partial */ }
        throw error;
      }
      if (error.code !== "EEXIST") throw error;
      if (Date.now() >= deadline) throw new Error("Timed out acquiring controller state mutex.");
      sleep(10);
    }
  }
  try {
    return operation({ ownerToken });
  } finally {
    releaseStateMutexInternal(stateDirectory, ownerToken);
  }
}

function readRawState(stateDirectory) {
  const file = statePath(stateDirectory);
  if (!fs.existsSync(file)) return emptyControllerStateInternal();
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  if (value.state_version !== STATE_VERSION) throw new Error("Unsupported controller state version.");
  return value;
}

function writeJsonAtomic(file, value) {
  const temporary = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  fs.renameSync(temporary, file);
}

function readJournalUnsafe(stateDirectory) {
  const file = journalPath(stateDirectory);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)
    .map((line) => RuntimeEventSchema.parse(JSON.parse(line)));
}

export function replayControllerJournalInternal(events) {
  const unique = new Map();
  for (const event of events) unique.set(event.event_id, event);
  const ordered = [...unique.values()].sort((left, right) => left.sequence - right.sequence);
  let expected = 1;
  let recovered = emptyControllerStateInternal();
  for (const event of ordered) {
    if (event.sequence !== expected) throw new Error(`Runtime event sequence gap: expected ${expected}, got ${event.sequence}`);
    expected += 1;
    if (!event.payload.snapshot || typeof event.payload.snapshot !== "object") {
      throw new Error("Controller journal event lacks a reconstructable snapshot.");
    }
    recovered = structuredClone(event.payload.snapshot);
  }
  return { state: recovered, event_count: ordered.length, next_sequence: expected };
}

export function recoverControllerStateInternal(stateDirectory, { repair = false } = {}) {
  if (!fs.existsSync(stateDirectory)) {
    return { state: emptyControllerStateInternal(), event_count: 0, reconstructed: false, repair_needed: false, available: false };
  }
  const events = readJournalUnsafe(stateDirectory);
  const replayed = replayControllerJournalInternal(events);
  const disk = readRawState(stateDirectory);
  const differs = canonicalJson(disk) !== canonicalJson(replayed.state);
  if (repair && differs) writeJsonAtomic(statePath(stateDirectory), replayed.state);
  return {
    state: events.length ? replayed.state : disk,
    event_count: replayed.event_count,
    reconstructed: events.length > 0,
    repair_needed: events.length > 0 && differs,
    available: true,
  };
}

export function readControllerStateInternal(stateDirectory) {
  return recoverControllerStateInternal(stateDirectory).state;
}

export function mutateControllerStateInternal(stateDirectory, {
  type, taskKey = null, runId = null, payload = {}, guard,
}, mutate) {
  return withStateMutexInternal(stateDirectory, () => {
    const recovered = recoverControllerStateInternal(stateDirectory);
    const state = structuredClone(recovered.state);
    if (guard) guard(state);
    const result = mutate(state);
    assertNoSecretsDeep(state, "controller durable state");
    state.revision += 1;
    const event = RuntimeEventSchema.parse({
      schema_version: SCHEMA_VERSION,
      sequence: state.next_sequence,
      event_id: crypto.randomUUID(),
      task_key: taskKey,
      run_id: runId,
      type,
      occurred_at: new Date().toISOString(),
      payload: sanitizeForLog({ ...payload, snapshot: state }),
    });
    state.next_sequence += 1;
    event.payload.snapshot.next_sequence = state.next_sequence;
    fs.mkdirSync(stateDirectory, { recursive: true, mode: 0o700 });
    fs.appendFileSync(journalPath(stateDirectory), `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
    writeJsonAtomic(statePath(stateDirectory), state);
    return { result, state, event };
  });
}

export function setActivationForAdministrationInternal(stateDirectory, authorized, {
  source = "controller-admin", now = new Date(),
} = {}) {
  return mutateControllerStateInternal(stateDirectory, {
    type: "controller.activation.updated", payload: { authorized, source },
  }, (state) => {
    state.activation = {
      authorized: Boolean(authorized),
      revision: (state.activation?.revision ?? 0) + 1,
      updated_at: now.toISOString(), source,
    };
    return structuredClone(state.activation);
  }).result;
}
