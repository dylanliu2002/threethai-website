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
const STATE_FIELDS = new Set(["schema_version", "revision", "updated_at", "next_queue_sequence", "active_batch_id", "batches", "workers"]);
const BATCH_FIELDS = new Set([
  "schema_version", "batch_id", "submission_id", "repository_root", "submitted_at", "expires_at",
  "state", "claim", "queue_sequence", "tasks", "reply_metadata", "correction_cycles", "last_error",
]);
const TASK_FIELDS = new Set(["task_id", "position", "description"]);
const CLAIM_FIELDS = new Set(["owner_token", "claimed_at", "heartbeat_at", "lease_expires_at"]);
const WORKER_FIELDS = new Set([
  "schema_version", "batch_id", "task_id", "role", "model", "effort", "cwd", "thread_id", "turn_id",
  "lifecycle_state", "created_at", "updated_at", "submission_id",
]);

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
    throw new Error(`${label} must be an object.`);
  }
}

function emptyState() {
  return {
    schema_version: RUNTIME_SCHEMA_VERSION,
    revision: 0,
    next_queue_sequence: 1,
    active_batch_id: null,
    batches: [],
    workers: [],
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
  if (!BATCH_STATES.has(batch.state)) throw new Error(`Unsupported batch state: ${String(batch.state)}`);
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
        throw new Error(`Batch claim ${field} is required.`);
      }
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
  for (const batch of state.batches) validateBatch(batch);
  for (const worker of state.workers) validateWorker(worker);
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

function lockIsOwnedByLiveProcess(lockPath) {
  try {
    const raw = fs.readFileSync(lockPath, "utf8");
    const lock = JSON.parse(raw);
    if (!Number.isInteger(lock.pid) || lock.pid <= 0) return false;
    process.kill(lock.pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    return false;
  }
}

function sleepSynchronous(milliseconds) {
  const buffer = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buffer), 0, 0, milliseconds);
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class RuntimeStore {
  constructor(filePath, { lockTimeoutMs = 5_000, clock = Date } = {}) {
    if (typeof filePath !== "string" || filePath.length === 0 || filePath.includes("\0")) {
      throw new Error("Runtime store path must be a non-empty string without NUL bytes.");
    }
    this.file_path = path.resolve(filePath);
    this.lock_path = `${this.file_path}.lock`;
    this.lock_timeout_ms = lockTimeoutMs;
    this.clock = clock;
  }

  get filePath() { return this.file_path; }

  exists() { return fs.existsSync(this.file_path); }

  load() {
    if (!fs.existsSync(this.file_path)) return emptyState();
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(this.file_path, "utf8"));
    } catch (error) {
      throw new Error(`Runtime state is corrupt: ${error instanceof Error ? error.message : String(error)}`);
    }
    validateState(parsed);
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

  putWorkerMapping(mapping) {
    return this.mutate((state) => {
      validateWorker(mapping);
      if (!state.batches.some((batch) => batch.batch_id === mapping.batch_id)) {
        throw new Error(`Unknown batch for worker mapping: ${mapping.batch_id}`);
      }
      const index = state.workers.findIndex((worker) => worker.batch_id === mapping.batch_id
        && worker.task_id === mapping.task_id && worker.role === mapping.role);
      if (index >= 0) {
        const existing = state.workers[index];
        for (const field of ["batch_id", "task_id", "role", "model", "effort", "cwd"]) {
          if (existing[field] !== mapping[field]) throw new Error(`Worker identity cannot change: ${field}`);
        }
        state.workers[index] = clone(mapping);
      } else {
        state.workers.push(clone(mapping));
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
      for (const field of ["batch_id", "task_id", "role", "model", "effort", "cwd"]) {
        if (next[field] !== current[field]) throw new Error(`Worker identity cannot change: ${field}`);
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
    let descriptor;
    while (descriptor === undefined) {
      try {
        descriptor = fs.openSync(this.lock_path, "wx");
        fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, host: os.hostname() }));
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        if (!lockIsOwnedByLiveProcess(this.lock_path)) {
          try { fs.unlinkSync(this.lock_path); } catch (unlinkError) {
            if (unlinkError?.code !== "ENOENT") throw unlinkError;
          }
        } else if (Date.now() - started >= this.lock_timeout_ms) {
          throw new Error("Runtime store is busy.");
        } else {
          sleepSynchronous(10);
        }
      }
    }
    try {
      return callback();
    } finally {
      try { fs.closeSync(descriptor); } catch {}
      try { fs.unlinkSync(this.lock_path); } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
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
