import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { assertNoSecretsDeep } from "../workflow/secrets.mjs";
import {
  ALLOWED_REVIEW_EFFORTS,
  IMPLEMENTATION_MODEL_NAME,
  IMPLEMENTATION_REASONING_EFFORT,
  MVP_CONFIG,
  REVIEW_MODEL_NAME,
  clockEpoch,
  timestampFrom,
} from "./config.mjs";

export const RUNTIME_SCHEMA_VERSION = 1;

const BATCH_STATES = new Set(["QUEUED", "CLAIMED", "RUNNING", "COMPLETED", "FAILED", "EXPIRED"]);
const WORKER_STATES = new Set(["PENDING", "THREAD_STARTED", "TURN_STARTED", "COMPLETED", "FAILED"]);
const STATE_FIELDS = new Set(["schema_version", "revision", "updated_at", "next_queue_sequence", "active_batch_id", "batches", "workers", "reservations"]);
const BATCH_FIELDS = new Set([
  "schema_version", "batch_id", "submission_id", "repository_root", "submitted_at", "expires_at",
  "state", "claim", "queue_sequence", "tasks", "reply_metadata", "correction_cycles", "last_error",
]);
const TASK_FIELDS = new Set(["task_id", "position", "description"]);
const CLAIM_FIELDS = new Set(["owner_token", "claimed_at", "heartbeat_at", "lease_expires_at"]);
const WORKER_FIELDS = new Set([
  "schema_version", "batch_id", "task_id", "role", "model", "effort", "cwd", "thread_id", "turn_id",
  "lifecycle_state", "created_at", "updated_at", "submission_id", "client_user_message_id",
]);
const RESERVATION_FIELDS = new Set([
  "schema_version", "batch_id", "task_id", "role", "model", "effort", "cwd", "client_user_message_id", "submission_id",
  "owner_token", "owner_pid", "created_at", "lease_expires_at", "thread_start_state", "turn_start_state",
]);
const RESERVATION_THREAD_START_STATES = new Set([
  "THREAD_START_IN_FLIGHT",
  "THREAD_START_AMBIGUOUS",
  "LIFECYCLE_ACTIVE",
]);
const RESERVATION_TURN_START_STATES = new Set([
  "TURN_START_NOT_STARTED",
  "TURN_START_IN_FLIGHT",
  "TURN_START_AMBIGUOUS",
]);
const RESERVATION_LEASE_MS = MVP_CONFIG.claim_lease_ms;

function assertKnownFields(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Unsupported ${label} field: ${key}`);
  }
}

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(label + " must be an object.");
  }
}

export function parsePersistedTimestamp(value, label = "timestamp") {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(label + " must be a non-empty timestamp string.");
  }
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new Error(label + " must be a valid canonical ISO timestamp.");
  }
  return epoch;
}

function emptyState() {
  return {
    schema_version: RUNTIME_SCHEMA_VERSION,
    revision: 0,
    next_queue_sequence: 1,
    active_batch_id: null,
    batches: [],
    workers: [],
    reservations: [],
  };
}

function validateBatch(batch) {
  assertPlainObject(batch, "batch");
  assertKnownFields(batch, BATCH_FIELDS, "batch");
  if (batch.schema_version !== RUNTIME_SCHEMA_VERSION) {
    throw new Error(`Unsupported batch schema version: ${String(batch.schema_version)}`);
  }
  for (const field of ["batch_id", "submission_id", "repository_root", "submitted_at", "expires_at"]) {
    if (typeof batch[field] !== "string" || batch[field].length === 0) {
      throw new Error(`Batch ${field} is required.`);
    }
  }
  const submittedAt = parsePersistedTimestamp(batch.submitted_at, "Batch submitted_at");
  const expiresAt = parsePersistedTimestamp(batch.expires_at, "Batch expires_at");
  if (expiresAt - submittedAt !== MVP_CONFIG.batch_expiry_ms) {
    throw new Error("Batch expiry must be exactly eight hours after submission.");
  }
  if (!BATCH_STATES.has(batch.state)) throw new Error("Unsupported batch state: " + String(batch.state));
  if (!Array.isArray(batch.tasks) || batch.tasks.length < 1 || batch.tasks.length > MVP_CONFIG.max_tasks_per_batch) {
    throw new Error("Batch tasks must contain between one and four tasks.");
  }
  const positions = new Set();
  const taskIds = new Set();
  for (const task of batch.tasks) {
    assertPlainObject(task, "batch task");
    assertKnownFields(task, TASK_FIELDS, "batch task");
    if (typeof task.task_id !== "string" || task.task_id.length === 0) throw new Error("Batch task_id is required.");
    if (taskIds.has(task.task_id)) throw new Error(`Duplicate batch task_id: ${task.task_id}`);
    if (!Number.isInteger(task.position) || task.position < 1) throw new Error("Batch task position is invalid.");
    if (positions.has(task.position)) throw new Error(`Duplicate batch task position: ${task.position}`);
    if (typeof task.description !== "string" || task.description.trim().length === 0) {
      throw new Error("Batch task description is required.");
    }
    taskIds.add(task.task_id);
    positions.add(task.position);
  }
  if (batch.claim !== null && batch.claim !== undefined) {
    assertPlainObject(batch.claim, "batch claim");
    assertKnownFields(batch.claim, CLAIM_FIELDS, "batch claim");
    for (const field of ["owner_token", "claimed_at", "heartbeat_at", "lease_expires_at"]) {
      if (typeof batch.claim[field] !== "string" || batch.claim[field].length === 0) {
        throw new Error("Batch claim " + field + " is required.");
      }
    }
    const claimedAt = parsePersistedTimestamp(batch.claim.claimed_at, "Batch claim claimed_at");
    const heartbeatAt = parsePersistedTimestamp(batch.claim.heartbeat_at, "Batch claim heartbeat_at");
    const leaseExpiresAt = parsePersistedTimestamp(batch.claim.lease_expires_at, "Batch claim lease_expires_at");
    if (heartbeatAt < claimedAt || leaseExpiresAt <= heartbeatAt) {
      throw new Error("Batch claim timestamps are not ordered.");
    }
  }
  if (batch.queue_sequence !== null && batch.queue_sequence !== undefined
    && (!Number.isInteger(batch.queue_sequence) || batch.queue_sequence < 1)) {
    throw new Error("Batch queue_sequence must be a positive integer.");
  }
  if (!Number.isInteger(batch.correction_cycles) || batch.correction_cycles < 0
    || batch.correction_cycles > MVP_CONFIG.max_correction_cycles) {
    throw new Error("Batch correction cycle limit is invalid.");
  }
}

function validateWorker(worker) {
  assertPlainObject(worker, "worker mapping");
  assertKnownFields(worker, WORKER_FIELDS, "worker mapping");
  if (worker.schema_version !== RUNTIME_SCHEMA_VERSION) {
    throw new Error(`Unsupported worker schema version: ${String(worker.schema_version)}`);
  }
  for (const field of ["batch_id", "task_id", "role", "model", "effort", "cwd"]) {
    if (typeof worker[field] !== "string" || worker[field].length === 0) {
      throw new Error(`Worker ${field} is required.`);
    }
  }
  if (!WORKER_STATES.has(worker.lifecycle_state)) {
    throw new Error(`Unsupported worker lifecycle state: ${String(worker.lifecycle_state)}`);
  }
  if (worker.role === "IMPLEMENTATION") {
    if (worker.model !== IMPLEMENTATION_MODEL_NAME || worker.effort !== IMPLEMENTATION_REASONING_EFFORT) {
      throw new Error("Implementation worker policy is not exact.");
    }
  } else if (worker.role === "REVIEW") {
    if (worker.model !== REVIEW_MODEL_NAME || !ALLOWED_REVIEW_EFFORTS.includes(worker.effort)) {
      throw new Error("Review worker policy is not supported.");
    }
  } else {
    throw new Error(`Unsupported worker role: ${String(worker.role)}`);
  }
  if (typeof worker.cwd !== "string" || !path.isAbsolute(worker.cwd)) {
    throw new Error("Worker cwd must be an absolute path.");
  }
  parsePersistedTimestamp(worker.created_at, "Worker created_at");
  parsePersistedTimestamp(worker.updated_at, "Worker updated_at");
  for (const field of ["thread_id", "turn_id"]) {
    if (worker[field] !== null && worker[field] !== undefined && typeof worker[field] !== "string") {
      throw new Error(`Worker ${field} must be a string or null.`);
    }
  }
  if (worker.lifecycle_state === "THREAD_STARTED" && !worker.thread_id) {
    throw new Error("THREAD_STARTED worker must have a thread_id.");
  }
  if (["TURN_STARTED", "COMPLETED"].includes(worker.lifecycle_state)
    && (!worker.thread_id || !worker.turn_id)) {
    throw new Error("Turn-active worker must have thread_id and turn_id.");
  }
  if (worker.client_user_message_id !== undefined
    && (typeof worker.client_user_message_id !== "string" || worker.client_user_message_id.length === 0)) {
    throw new Error("Worker client_user_message_id must be a non-empty string.");
  }
}

function validateReservation(reservation) {
  assertPlainObject(reservation, "worker reservation");
  assertKnownFields(reservation, RESERVATION_FIELDS, "worker reservation");
  if (reservation.schema_version !== RUNTIME_SCHEMA_VERSION) {
    throw new Error(`Unsupported reservation schema version: ${String(reservation.schema_version)}`);
  }
  for (const field of ["batch_id", "task_id", "role", "model", "effort", "cwd", "client_user_message_id", "submission_id", "owner_token", "created_at", "lease_expires_at"]) {
    if (typeof reservation[field] !== "string" || reservation[field].length === 0) {
      throw new Error("Worker reservation " + field + " is required.");
    }
  }
  const createdAt = parsePersistedTimestamp(reservation.created_at, "Worker reservation created_at");
  const leaseExpiresAt = parsePersistedTimestamp(reservation.lease_expires_at, "Worker reservation lease_expires_at");
  if (leaseExpiresAt <= createdAt) throw new Error("Worker reservation lease must be after creation.");
  if (!Number.isInteger(reservation.owner_pid) || reservation.owner_pid <= 0) {
    throw new Error("Worker reservation owner_pid is invalid.");
  }
  if (reservation.thread_start_state !== undefined
    && !RESERVATION_THREAD_START_STATES.has(reservation.thread_start_state)) {
    throw new Error(`Unsupported worker reservation thread start state: ${String(reservation.thread_start_state)}`);
  }
  if (reservation.turn_start_state !== undefined
    && !RESERVATION_TURN_START_STATES.has(reservation.turn_start_state)) {
    throw new Error(`Unsupported worker reservation turn start state: ${String(reservation.turn_start_state)}`);
  }
  if (!["IMPLEMENTATION", "REVIEW"].includes(reservation.role)) {
    throw new Error(`Unsupported worker reservation role: ${String(reservation.role)}`);
  }
  if (reservation.role === "IMPLEMENTATION"
    && (reservation.model !== IMPLEMENTATION_MODEL_NAME || reservation.effort !== IMPLEMENTATION_REASONING_EFFORT)) {
    throw new Error("Implementation reservation policy is not exact.");
  }
  if (reservation.role === "REVIEW"
    && (reservation.model !== REVIEW_MODEL_NAME || !ALLOWED_REVIEW_EFFORTS.includes(reservation.effort))) {
    throw new Error("Review reservation policy is not supported.");
  }
  if (!path.isAbsolute(reservation.cwd)) throw new Error("Worker reservation cwd must be absolute.");
}

function validateState(state) {
  assertPlainObject(state, "runtime state");
  assertKnownFields(state, STATE_FIELDS, "runtime state");
  if (state.schema_version !== RUNTIME_SCHEMA_VERSION) {
    throw new Error(`Unsupported runtime schema version: ${String(state.schema_version)}`);
  }
  if (!Number.isInteger(state.revision) || state.revision < 0) throw new Error("Runtime revision is invalid.");
  if (!Number.isInteger(state.next_queue_sequence) || state.next_queue_sequence < 1) {
    throw new Error("Runtime queue sequence is invalid.");
  }
  if (state.active_batch_id !== null && typeof state.active_batch_id !== "string") {
    throw new Error("Runtime active_batch_id must be a string or null.");
  }
  if (!Array.isArray(state.batches) || !Array.isArray(state.workers)) {
    throw new Error("Runtime batches and workers must be arrays.");
  }
  if (state.reservations !== undefined && !Array.isArray(state.reservations)) {
    throw new Error("Runtime reservations must be an array.");
  }
  if (state.updated_at !== undefined) parsePersistedTimestamp(state.updated_at, "Runtime updated_at");
  for (const batch of state.batches) validateBatch(batch);
  for (const worker of state.workers) validateWorker(worker);
  for (const reservation of state.reservations ?? []) validateReservation(reservation);
  const activeBatches = state.batches.filter((batch) => ["CLAIMED", "RUNNING"].includes(batch.state));
  if (activeBatches.length > 1) throw new Error("Runtime state cannot contain multiple active batches.");
  for (const batch of state.batches) {
    if (!Number.isInteger(batch.queue_sequence) || batch.queue_sequence < 1) {
      throw new Error("Persisted batch queue_sequence must be a positive integer.");
    }
  }
  const batchIds = new Set();
  const submissionIds = new Set();
  const queueSequences = new Set();
  for (const batch of state.batches) {
    if (batchIds.has(batch.batch_id)) throw new Error(`Duplicate batch_id: ${batch.batch_id}`);
    if (submissionIds.has(batch.submission_id)) throw new Error(`Duplicate submission_id: ${batch.submission_id}`);
    batchIds.add(batch.batch_id);
    submissionIds.add(batch.submission_id);
    if (queueSequences.has(batch.queue_sequence)) throw new Error(`Duplicate queue_sequence: ${batch.queue_sequence}`);
    queueSequences.add(batch.queue_sequence);
  }
  const workerKeys = new Set();
  for (const worker of state.workers) {
    if (!batchIds.has(worker.batch_id)) throw new Error(`Worker references unknown batch: ${worker.batch_id}`);
    const batch = state.batches.find((item) => item.batch_id === worker.batch_id);
    if (!batch.tasks.some((task) => task.task_id === worker.task_id)) {
      throw new Error(`Worker references unknown task: ${worker.batch_id}/${worker.task_id}`);
    }
    if (worker.submission_id !== undefined && worker.submission_id !== batch.submission_id) {
      throw new Error("Worker submission trace does not match its batch.");
    }
    const key = `${worker.batch_id}\0${worker.task_id}\0${worker.role}`;
    if (workerKeys.has(key)) throw new Error(`Duplicate worker mapping: ${key}`);
    workerKeys.add(key);
  }
  const reservationKeys = new Set();
  for (const reservation of state.reservations ?? []) {
    if (!batchIds.has(reservation.batch_id)) {
      throw new Error(`Reservation references unknown batch: ${reservation.batch_id}`);
    }
    const batch = state.batches.find((item) => item.batch_id === reservation.batch_id);
    if (!batch.tasks.some((task) => task.task_id === reservation.task_id)) {
      throw new Error(`Reservation references unknown task: ${reservation.batch_id}/${reservation.task_id}`);
    }
    if (reservation.submission_id !== undefined && reservation.submission_id !== batch.submission_id) {
      throw new Error("Worker reservation submission trace does not match its batch.");
    }
    const turnStartState = reservation.turn_start_state ?? "TURN_START_NOT_STARTED";
    const mappedWorker = state.workers.find((worker) => workerKey(worker) === `${reservation.batch_id}\0${reservation.task_id}\0${reservation.role}`);
    if (turnStartState !== "TURN_START_NOT_STARTED" && !mappedWorker?.thread_id) {
      throw new Error("Worker turn-start reservation requires a durably mapped thread.");
    }
    if (turnStartState !== "TURN_START_NOT_STARTED" && mappedWorker?.turn_id) {
      throw new Error("Worker turn-start reservation cannot remain after a durable turn mapping.");
    }
    const key = `${reservation.batch_id}\0${reservation.task_id}\0${reservation.role}`;
    if (reservationKeys.has(key)) throw new Error(`Duplicate worker reservation: ${key}`);
    reservationKeys.add(key);
  }
  if (state.active_batch_id && !batchIds.has(state.active_batch_id)) {
    throw new Error(`Active batch does not exist: ${state.active_batch_id}`);
  }
  if (state.active_batch_id !== null) {
    const active = state.batches.find((batch) => batch.batch_id === state.active_batch_id);
    if (!active || !["CLAIMED", "RUNNING"].includes(active.state) || !active.claim) {
      throw new Error("Runtime active_batch_id must identify an active batch.");
    }
  } else if (activeBatches.length > 0) {
    throw new Error("Runtime active batch is missing.");
  }
  for (const batch of state.batches) {
    if (["CLAIMED", "RUNNING"].includes(batch.state) && !batch.claim) {
      throw new Error("Active batch claim is missing.");
    }
    if (![
      "CLAIMED", "RUNNING",
    ].includes(batch.state) && batch.claim) {
      throw new Error("Inactive batch cannot retain a claim.");
    }
  }
  assertNoSecretsDeep(state, "runtime state");
  return true;
}

function sleepSynchronous(milliseconds) {
  const buffer = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buffer), 0, 0, milliseconds);
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function workerKey(value) {
  return `${value.batch_id}\0${value.task_id}\0${value.role}`;
}

function isTerminalWorker(worker) {
  return ["COMPLETED", "FAILED"].includes(worker.lifecycle_state);
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

function assertWorkerIdentityUnchanged(existing, next) {
  for (const field of ["batch_id", "task_id", "role", "model", "effort", "cwd"]) {
    if (existing[field] !== next[field]) throw new Error(`Worker identity cannot change: ${field}`);
  }
  if (existing.thread_id && existing.thread_id !== next.thread_id) {
    throw new Error("Worker thread identity cannot change.");
  }
  if (existing.turn_id && existing.turn_id !== next.turn_id) {
    throw new Error("Worker turn identity cannot change.");
  }
  if (existing.client_user_message_id
    && existing.client_user_message_id !== next.client_user_message_id) {
    throw new Error("Worker client message identity cannot change.");
  }
}

export class RuntimeStore {
  constructor(filePath, {
    lockTimeoutMs = 5_000,
    clock = Date,
    lockOwnerTokenFactory = () => makeId("lock"),
    processAliveFn = processIsAlive,
  } = {}) {
    if (typeof filePath !== "string" || filePath.length === 0 || filePath.includes("\0")) {
      throw new Error("Runtime store path must be a non-empty string without NUL bytes.");
    }
    this.file_path = path.resolve(filePath);
    this.lock_path = `${this.file_path}.lock`;
    this.lock_timeout_ms = lockTimeoutMs;
    this.clock = clock;
    this.lock_owner_token_factory = lockOwnerTokenFactory;
    if (typeof processAliveFn !== "function") throw new Error("Runtime process liveness checker is invalid.");
    this.process_alive = processAliveFn;
  }

  get filePath() { return this.file_path; }
  get lockPath() { return this.lock_path; }

  exists() { return fs.existsSync(this.file_path); }

  load() {
    if (!fs.existsSync(this.file_path)) return emptyState();
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(this.file_path, "utf8"));
    } catch (error) {
      throw new Error(`Runtime state is corrupt: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (Array.isArray(parsed.reservations)) {
      for (const reservation of parsed.reservations) {
        if (reservation && typeof reservation === "object" && reservation.thread_start_state === undefined) {
          reservation.thread_start_state = "THREAD_START_IN_FLIGHT";
        }
        if (reservation && typeof reservation === "object" && reservation.turn_start_state === undefined) {
          reservation.turn_start_state = "TURN_START_NOT_STARTED";
        }
      }
    }
    validateState(parsed);
    if (parsed.reservations === undefined) parsed.reservations = [];
    return clone(parsed);
  }

  read() { return this.load(); }

  snapshot() { return this.load(); }

  save(state) {
    validateState(state);
    this.#writeAtomically(state);
    return clone(state);
  }

  replace(state) {
    const replacement = clone(state);
    return this.#withLock(() => this.save(replacement));
  }

  mutate(mutator, { clock = this.clock } = {}) {
    if (typeof mutator !== "function") throw new Error("Runtime mutator must be a function.");
    return this.#withLock(() => {
      const current = this.load();
      const draft = clone(current);
      const result = mutator(draft);
      validateState(draft);
      draft.revision = current.revision + 1;
      draft.updated_at = timestampFrom(clock);
      this.#writeAtomically(draft);
      return clone(result === undefined ? draft : result);
    });
  }

  enqueueBatch(batch) {
    return this.mutate((state) => {
      validateBatch(batch);
      if (state.batches.some((item) => item.batch_id === batch.batch_id)) {
        throw new Error(`Batch already exists: ${batch.batch_id}`);
      }
      if (state.batches.some((item) => item.submission_id === batch.submission_id)) {
        throw new Error(`Submission already exists: ${batch.submission_id}`);
      }
      const stored = clone(batch);
      stored.queue_sequence = state.next_queue_sequence;
      state.next_queue_sequence += 1;
      state.batches.push(stored);
      return stored;
    });
  }

  createBatch(batch) { return this.enqueueBatch(batch); }

  getBatch(batchId) {
    const state = this.load();
    const batch = state.batches.find((item) => item.batch_id === batchId);
    return batch ? clone(batch) : null;
  }

  listBatches() { return this.load().batches.map(clone); }

  updateBatch(batchId, updater, options) {
    return this.mutate((state) => {
      const index = state.batches.findIndex((item) => item.batch_id === batchId);
      if (index < 0) throw new Error(`Unknown batch: ${batchId}`);
      const current = clone(state.batches[index]);
      const updated = updater(current, state);
      const next = updated === undefined ? current : updated;
      validateBatch(next);
      if (next.batch_id !== batchId) throw new Error("Batch identity cannot change.");
      state.batches[index] = clone(next);
      return next;
    }, options);
  }

  getWorkerMapping(batchId, taskId, role) {
    const worker = this.load().workers.find((item) => item.batch_id === batchId
      && item.task_id === taskId && item.role === role);
    return worker ? clone(worker) : null;
  }

  listWorkerMappings(batchId = null) {
    return this.load().workers
      .filter((worker) => batchId === null || worker.batch_id === batchId)
      .map(clone);
  }

  getWorkerReservation(batchId, taskId, role) {
    const reservation = (this.load().reservations ?? []).find((item) => item.batch_id === batchId
      && item.task_id === taskId && item.role === role);
    return reservation ? clone(reservation) : null;
  }

  listWorkerReservations(batchId = null) {
    return (this.load().reservations ?? [])
      .filter((reservation) => batchId === null || reservation.batch_id === batchId)
      .map(clone);
  }

  reserveWorker({
    batchId,
    taskId,
    role,
    model,
    effort,
    cwd,
    clientUserMessageId,
    ownerToken = makeId("reservation"),
    leaseMs = RESERVATION_LEASE_MS,
    clock = this.clock,
  } = {}) {
    for (const [field, value] of Object.entries({
      batchId, taskId, role, model, effort, cwd, clientUserMessageId, ownerToken,
    })) {
      if (typeof value !== "string" || value.length === 0) throw new Error(`Worker reservation ${field} is required.`);
    }
    if (!Number.isInteger(leaseMs) || leaseMs <= 0) throw new Error("Worker reservation lease must be positive.");
    const now = clockEpoch(clock);
    return this.mutate((state) => {
      state.reservations ??= [];
      const batch = state.batches.find((item) => item.batch_id === batchId);
      if (!batch) throw new Error(`Unknown batch for worker reservation: ${batchId}`);
      const task = batch.tasks.find((item) => item.task_id === taskId);
      if (!task) throw new Error(`Unknown task for worker reservation: ${batchId}/${taskId}`);
      if (!["QUEUED", "CLAIMED", "RUNNING"].includes(batch.state)) {
        throw new Error(`Batch is not eligible for a worker reservation: ${batch.state}`);
      }
      const existingMapping = state.workers.find((worker) => workerKey(worker) === `${batchId}\0${taskId}\0${role}`);
      if (existingMapping) {
        for (const field of ["model", "effort", "cwd"]) {
          if (existingMapping[field] !== { model, effort, cwd }[field]) {
            throw new Error(`Existing worker mapping policy or cwd does not match: ${field}`);
          }
        }
        if (existingMapping.client_user_message_id
          && existingMapping.client_user_message_id !== clientUserMessageId) {
          throw new Error("Existing worker client message identity does not match.");
        }
        if (existingMapping.turn_id) return { status: "MAPPED", mapping: clone(existingMapping) };
      }
      const key = `${batchId}\0${taskId}\0${role}`;
      const reservationIndex = state.reservations.findIndex((item) => workerKey(item) === key);
      if (reservationIndex >= 0) {
        const existingReservation = state.reservations[reservationIndex];
        const startState = existingReservation.thread_start_state ?? "THREAD_START_IN_FLIGHT";
        const turnStartState = existingReservation.turn_start_state ?? "TURN_START_NOT_STARTED";
        if (turnStartState === "TURN_START_AMBIGUOUS") {
          return { status: "AMBIGUOUS", reservation: clone(existingReservation) };
        }
        if (turnStartState === "TURN_START_IN_FLIGHT") {
          if (!this.process_alive(existingReservation.owner_pid)) {
            return { status: "AMBIGUOUS", reservation: clone(existingReservation) };
          }
          return { status: "BUSY", reservation: clone(existingReservation) };
        }
        const ownerDead = !this.process_alive(existingReservation.owner_pid);
        if (startState === "THREAD_START_AMBIGUOUS") {
          return { status: "AMBIGUOUS", reservation: clone(existingReservation) };
        }
        if (startState === "THREAD_START_IN_FLIGHT" && !existingMapping?.thread_id) {
          if (ownerDead) return { status: "AMBIGUOUS", reservation: clone(existingReservation) };
        }
        if (startState === "LIFECYCLE_ACTIVE" && !existingMapping?.thread_id) {
          return { status: "AMBIGUOUS", reservation: clone(existingReservation) };
        }
        if (startState === "THREAD_START_IN_FLIGHT" && existingMapping?.thread_id) {
          existingReservation.thread_start_state = "LIFECYCLE_ACTIVE";
        }
        if (existingReservation.owner_token === ownerToken) return {
          status: "RESERVED",
          reservation: clone(existingReservation),
        };
        if (!ownerDead) return {
          status: "BUSY",
          reservation: clone(existingReservation),
        };
        if ((existingReservation.thread_start_state ?? startState) === "THREAD_START_IN_FLIGHT") {
          return { status: "AMBIGUOUS", reservation: clone(existingReservation) };
        }
        state.reservations.splice(reservationIndex, 1);
      }
      if (role === "IMPLEMENTATION") {
        const activeKeys = new Set(state.workers.filter((worker) => !isTerminalWorker(worker)).map(workerKey));
        const reservedImplementationCount = state.reservations.filter((reservation) => reservation.role === "IMPLEMENTATION"
          && !activeKeys.has(workerKey(reservation))).length;
        const activeImplementationCount = [...activeKeys].filter((keyValue) => keyValue.endsWith("\0IMPLEMENTATION")).length;
        if (activeImplementationCount + reservedImplementationCount >= MVP_CONFIG.max_parallel_implementation_workers) {
          throw new Error("Maximum parallel implementation worker limit reached.");
        }
      }
      const reservation = {
        schema_version: RUNTIME_SCHEMA_VERSION,
        batch_id: batchId,
        task_id: taskId,
        role,
        model,
        effort,
        cwd,
        client_user_message_id: clientUserMessageId,
        submission_id: batch.submission_id,
        owner_token: ownerToken,
        owner_pid: process.pid,
        created_at: new Date(now).toISOString(),
        lease_expires_at: new Date(now + leaseMs).toISOString(),
        thread_start_state: existingMapping?.thread_id ? "LIFECYCLE_ACTIVE" : "THREAD_START_IN_FLIGHT",
        turn_start_state: "TURN_START_NOT_STARTED",
      };
      validateReservation(reservation);
      state.reservations.push(reservation);
      return { status: "RESERVED", reservation: clone(reservation), mapping: existingMapping ? clone(existingMapping) : null };
    });
  }

  assertWorkerReservation(batchId, taskId, role, ownerToken) {
    if (typeof ownerToken !== "string" || ownerToken.length === 0) {
      throw new Error("Reservation owner token is required.");
    }
    const reservation = this.getWorkerReservation(batchId, taskId, role);
    if (!reservation || reservation.owner_token !== ownerToken) {
      throw new Error("Worker reservation owner token does not match.");
    }
    return reservation;
  }

  markWorkerThreadStartAmbiguous(batchId, taskId, role, ownerToken) {
    if (typeof ownerToken !== "string" || ownerToken.length === 0) {
      throw new Error("Reservation owner token is required.");
    }
    return this.mutate((state) => {
      state.reservations ??= [];
      const index = state.reservations.findIndex((item) => item.batch_id === batchId
        && item.task_id === taskId && item.role === role);
      if (index < 0) throw new Error("Worker reservation is not available.");
      const current = state.reservations[index];
      if (current.owner_token !== ownerToken) {
        throw new Error("Worker reservation owner token does not match.");
      }
      const ambiguous = {
        ...current,
        thread_start_state: "THREAD_START_AMBIGUOUS",
      };
      validateReservation(ambiguous);
      state.reservations[index] = ambiguous;
      return ambiguous;
    });
  }

  markWorkerTurnStartInFlight(batchId, taskId, role, ownerToken) {
    if (typeof ownerToken !== "string" || ownerToken.length === 0) {
      throw new Error("Reservation owner token is required.");
    }
    return this.mutate((state) => {
      state.reservations ??= [];
      const index = state.reservations.findIndex((item) => item.batch_id === batchId
        && item.task_id === taskId && item.role === role);
      if (index < 0) throw new Error("Worker reservation is not available.");
      const current = state.reservations[index];
      if (current.owner_token !== ownerToken) {
        throw new Error("Worker reservation owner token does not match.");
      }
      if (current.thread_start_state !== "LIFECYCLE_ACTIVE") {
        throw new Error("Worker turn/start requires a durably mapped thread.");
      }
      if ((current.turn_start_state ?? "TURN_START_NOT_STARTED") !== "TURN_START_NOT_STARTED") {
        throw new Error("Worker turn/start is already in-flight or ambiguous.");
      }
      const inFlight = {
        ...current,
        turn_start_state: "TURN_START_IN_FLIGHT",
      };
      validateReservation(inFlight);
      state.reservations[index] = inFlight;
      return inFlight;
    });
  }

  markWorkerTurnStartAmbiguous(batchId, taskId, role, ownerToken) {
    if (typeof ownerToken !== "string" || ownerToken.length === 0) {
      throw new Error("Reservation owner token is required.");
    }
    return this.mutate((state) => {
      state.reservations ??= [];
      const index = state.reservations.findIndex((item) => item.batch_id === batchId
        && item.task_id === taskId && item.role === role);
      if (index < 0) throw new Error("Worker reservation is not available.");
      const current = state.reservations[index];
      if (current.owner_token !== ownerToken) {
        throw new Error("Worker reservation owner token does not match.");
      }
      const turnStartState = current.turn_start_state ?? "TURN_START_NOT_STARTED";
      if (turnStartState === "TURN_START_AMBIGUOUS") return current;
      if (turnStartState !== "TURN_START_IN_FLIGHT") {
        throw new Error("Worker turn/start was not durably marked in-flight.");
      }
      const ambiguous = {
        ...current,
        turn_start_state: "TURN_START_AMBIGUOUS",
      };
      validateReservation(ambiguous);
      state.reservations[index] = ambiguous;
      return ambiguous;
    });
  }

  renewWorkerReservation(batchId, taskId, role, ownerToken, {
    leaseMs = RESERVATION_LEASE_MS,
    clock = this.clock,
  } = {}) {
    if (typeof ownerToken !== "string" || ownerToken.length === 0) {
      throw new Error("Reservation owner token is required.");
    }
    if (!Number.isInteger(leaseMs) || leaseMs <= 0) throw new Error("Worker reservation lease must be positive.");
    const now = clockEpoch(clock);
    return this.mutate((state) => {
      state.reservations ??= [];
      const index = state.reservations.findIndex((item) => item.batch_id === batchId
        && item.task_id === taskId && item.role === role);
      if (index < 0) throw new Error("Worker reservation is not available.");
      const current = state.reservations[index];
      if (current.owner_token !== ownerToken) {
        throw new Error("Worker reservation owner token does not match.");
      }
      const renewed = {
        ...current,
        lease_expires_at: new Date(now + leaseMs).toISOString(),
      };
      validateReservation(renewed);
      state.reservations[index] = renewed;
      return renewed;
    });
  }

  releaseWorkerReservation(batchId, taskId, role, ownerToken) {
    if (typeof ownerToken !== "string" || ownerToken.length === 0) throw new Error("Reservation owner token is required.");
    return this.mutate((state) => {
      state.reservations ??= [];
      const index = state.reservations.findIndex((item) => item.batch_id === batchId
        && item.task_id === taskId && item.role === role);
      if (index < 0) return { status: "ABSENT" };
      if (state.reservations[index].owner_token !== ownerToken) {
        throw new Error("Worker reservation owner token does not match.");
      }
      const [released] = state.reservations.splice(index, 1);
      return { status: "RELEASED", reservation: released };
    });
  }

  putWorkerMapping(mapping, { reservationToken } = {}) {
    return this.mutate((state) => {
      validateWorker(mapping);
      const batch = state.batches.find((item) => item.batch_id === mapping.batch_id);
      if (!batch) {
        throw new Error(`Unknown batch for worker mapping: ${mapping.batch_id}`);
      }
      if (!batch.tasks.some((task) => task.task_id === mapping.task_id)) {
        throw new Error(`Unknown task for worker mapping: ${mapping.batch_id}/${mapping.task_id}`);
      }
      const reservations = state.reservations ?? [];
      let reservationIndex = -1;
      if (reservationToken !== undefined) {
        reservationIndex = reservations.findIndex((item) => workerKey(item) === workerKey(mapping));
        const reservation = reservationIndex < 0 ? null : reservations[reservationIndex];
        if (!reservation || reservation.owner_token !== reservationToken) {
          throw new Error("Worker mapping reservation owner token does not match.");
        }
      }
      const index = state.workers.findIndex((worker) => worker.batch_id === mapping.batch_id
        && worker.task_id === mapping.task_id && worker.role === mapping.role);
      if (index >= 0) {
        const existing = state.workers[index];
        assertWorkerIdentityUnchanged(existing, mapping);
        state.workers[index] = clone(mapping);
      } else {
        state.workers.push(clone(mapping));
      }
      if (reservationIndex >= 0) {
        state.reservations[reservationIndex] = {
          ...state.reservations[reservationIndex],
          thread_start_state: "LIFECYCLE_ACTIVE",
        };
      }
      return mapping;
    });
  }

  updateWorkerMapping(batchId, taskId, role, updater, options) {
    return this.mutate((state) => {
      const index = state.workers.findIndex((worker) => worker.batch_id === batchId
        && worker.task_id === taskId && worker.role === role);
      if (index < 0) throw new Error(`Unknown worker mapping: ${batchId}/${taskId}/${role}`);
      const current = clone(state.workers[index]);
      const updated = updater(current, state);
      const next = updated === undefined ? current : updated;
      validateWorker(next);
      assertWorkerIdentityUnchanged(current, next);
      const reservationToken = options?.reservationToken;
      if (reservationToken !== undefined) {
        const reservations = state.reservations ?? [];
        const reservation = reservations.find((item) => workerKey(item) === workerKey(next));
        if (!reservation || reservation.owner_token !== reservationToken) {
          throw new Error("Worker mapping reservation owner token does not match.");
        }
        if (next.turn_id) {
          state.reservations = reservations.filter((item) => !(workerKey(item) === workerKey(next)
            && item.owner_token === reservationToken));
        }
      }
      state.workers[index] = clone(next);
      return next;
    }, options);
  }

  patchWorkerMapping(batchId, taskId, role, patch, options) {
    return this.updateWorkerMapping(batchId, taskId, role, (worker) => ({ ...worker, ...clone(patch) }), options);
  }

  #withLock(callback) {
    const directory = path.dirname(this.file_path);
    fs.mkdirSync(directory, { recursive: true });
    const started = Date.now();
    let owner;
    while (!owner) {
      const ownerToken = this.lock_owner_token_factory();
      if (typeof ownerToken !== "string" || ownerToken.length === 0) throw new Error("Runtime lock owner token is invalid.");
      const temporaryDirectory = `${this.lock_path}.${process.pid}.${crypto.randomUUID()}.tmp`;
      const ownerPath = path.join(temporaryDirectory, "owner.json");
      try {
        fs.mkdirSync(temporaryDirectory, { recursive: false });
        const record = {
          schema_version: RUNTIME_SCHEMA_VERSION,
          owner_token: ownerToken,
          pid: process.pid,
          host: os.hostname(),
          created_at: timestampFrom(this.clock),
        };
        const descriptor = fs.openSync(ownerPath, "wx");
        try {
          fs.writeFileSync(descriptor, JSON.stringify(record), "utf8");
          fs.fsyncSync(descriptor);
        } finally {
          fs.closeSync(descriptor);
        }
        fs.renameSync(temporaryDirectory, this.lock_path);
        owner = { owner_token: ownerToken };
      } catch (error) {
        try {
          if (fs.existsSync(temporaryDirectory)) fs.rmSync(temporaryDirectory, { recursive: true, force: true });
        } catch {}
        if (!['EEXIST', 'ENOTEMPTY', 'EISDIR', 'EPERM'].includes(error?.code)) throw error;
        if (Date.now() - started >= this.lock_timeout_ms) {
          throw new Error("Runtime store is busy.");
        } else {
          sleepSynchronous(10);
        }
      }
    }
    try {
      return callback();
    } finally {
      const ownerPath = path.join(this.lock_path, "owner.json");
      let record;
      try {
        record = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
      } catch (error) {
        throw new Error(`Runtime lock ownership could not be verified: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (!record || record.owner_token !== owner.owner_token) {
        throw new Error("Runtime lock owner token does not match.");
      }
      fs.unlinkSync(ownerPath);
      fs.rmdirSync(this.lock_path);
    }
  }

  #writeAtomically(state) {
    const directory = path.dirname(this.file_path);
    fs.mkdirSync(directory, { recursive: true });
    const temporary = path.join(directory, `.${path.basename(this.file_path)}.${process.pid}.${crypto.randomUUID()}.tmp`);
    const content = `${JSON.stringify(state, null, 2)}\n`;
    const descriptor = fs.openSync(temporary, "wx");
    try {
      fs.writeFileSync(descriptor, content, "utf8");
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    try {
      fs.renameSync(temporary, this.file_path);
    } catch (error) {
      try { fs.unlinkSync(temporary); } catch {}
      throw new Error(`Atomic runtime state replace failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function createRuntimeStore(filePath, options) {
  return new RuntimeStore(filePath, options);
}

export function emptyRuntimeState() { return emptyState(); }

export function validateRuntimeState(state) { return validateState(state); }

export function batchStateNames() { return [...BATCH_STATES]; }

export function workerStateNames() { return [...WORKER_STATES]; }

export function generatedOwnerToken() { return makeId("owner"); }

export function generatedRuntimeId(prefix = "id") { return makeId(prefix); }

export { validateBatch, validateWorker };
