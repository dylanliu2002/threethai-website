import crypto from "node:crypto";
import path from "node:path";
import { assertNoSecretsDeep, sanitizeForLog } from "../workflow/secrets.mjs";
import {
  ALLOWED_REVIEW_EFFORTS,
  IMPLEMENTATION_MODEL_NAME,
  IMPLEMENTATION_REASONING_EFFORT,
  MVP_CONFIG,
  REVIEW_DEFAULT_REASONING_EFFORT,
  REVIEW_MODEL_NAME,
  assertExactModel,
  assertNoFallback,
  reviewEffortForDifficulty,
  timestampFrom,
} from "./config.mjs";
import { AppServerClient } from "./app-server-client.mjs";
import { assertGitWorktree, canonicalDirectory } from "./submission.mjs";

const ROLE_IMPLEMENTATION = "IMPLEMENTATION";
const ROLE_REVIEW = "REVIEW";
const SUPPORTED_ROLES = new Set([ROLE_IMPLEMENTATION, ROLE_REVIEW]);
const MAX_MODEL_PAGES = 100;

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function assertText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required.`);
  return value.trim();
}

function assertAbsoluteDirectory(cwd) {
  const value = assertText(cwd, "cwd");
  if (!path.isAbsolute(value)) throw new Error("Worker cwd must be an absolute isolated worktree path.");
  return assertGitWorktree(canonicalDirectory(value, "Worker cwd"), "Worker cwd");
}

function taskFromBatch(store, batchId, taskId) {
  if (!store || typeof store.getBatch !== "function") {
    throw new Error("Thread Broker requires a RuntimeStore for durable submission traceability.");
  }
  const batch = store.getBatch(batchId);
  if (!batch) throw new Error(`Cannot start a worker without an explicit submitted batch: ${batchId}`);
  if (!["QUEUED", "CLAIMED", "RUNNING"].includes(batch.state)) {
    throw new Error(`Batch is not eligible for a worker start: ${batch.state}`);
  }
  const task = batch.tasks.find((item) => item.task_id === taskId);
  if (!task) throw new Error(`Task is not part of submitted batch ${batchId}: ${taskId}`);
  return { batch, task };
}

function modelEntries(payload) {
  const data = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(data)) throw new Error("App Server model/list response is missing data.");
  return data;
}

function effortName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.reasoningEffort ?? value.reasoning_effort ?? value.effort;
  return null;
}

function effortsFor(entry) {
  if (!entry || typeof entry !== "object") return [];
  const values = entry.supportedReasoningEfforts
    ?? entry.supported_reasoning_efforts
    ?? entry.reasoningEfforts
    ?? entry.reasoning_efforts
    ?? [];
  if (!Array.isArray(values)) return [];
  return values.map(effortName).filter((value) => typeof value === "string");
}

function findAvailableModel(payload, expectedModel, expectedEffort) {
  assertExactModel(expectedModel);
  const entries = modelEntries(payload);
  const entry = entries.find((candidate) => candidate && typeof candidate === "object"
    && candidate.id === expectedModel
    && candidate.model === expectedModel);
  if (!entry) throw new Error(`Required exact model is unavailable: ${expectedModel}`);
  const efforts = effortsFor(entry);
  if (!efforts.includes(expectedEffort)) {
    throw new Error(`Required reasoning effort is unavailable for ${expectedModel}: ${expectedEffort}`);
  }
  return { model: expectedModel, effort: expectedEffort, entry: clone(entry) };
}

function nextModelCursor(payload) {
  const cursor = payload?.nextCursor ?? payload?.next_cursor ?? null;
  if (cursor === null || cursor === undefined || cursor === "") return null;
  if (typeof cursor !== "string") throw new Error("App Server model/list returned an invalid pagination cursor.");
  return cursor;
}

function normalizeInput(prompt, input) {
  if (input !== undefined && prompt !== undefined) throw new Error("Provide prompt or input, not both.");
  const chosen = input ?? prompt;
  const values = chosen === undefined ? [] : Array.isArray(chosen) ? clone(chosen) : [{ type: "text", text: assertText(chosen, "worker prompt") }];
  if (values.length === 0) throw new Error("Worker turn input is required.");
  assertNoSecretsDeep(values, "worker turn input");
  for (const item of values) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Worker input entries must be objects.");
    if (item.type !== "text") throw new Error("Night Worker accepts text turn input only.");
    if (typeof item.text !== "string" || item.text.trim().length === 0) throw new Error("Worker text input cannot be empty.");
  }
  return values;
}

function assertNoAuthorityOverrides(options, allowed = new Set()) {
  for (const key of Object.keys(options ?? {})) {
    if (allowed.has(key)) continue;
    if (["batchId", "batch_id", "taskId", "task_id", "cwd", "prompt", "input", "difficulty", "metadata"].includes(key)) continue;
    throw new Error(`Worker start cannot override policy field: ${key}`);
  }
}

function workerKey({ batchId, taskId, role }) { return `${batchId}\0${taskId}\0${role}`; }

function clientMessageId(batch, task, role) {
  return `${batch.submission_id}:${task.task_id}:${role}`;
}

function turnsFromRead(response) {
  const turns = response?.thread?.turns ?? response?.turns ?? [];
  if (!Array.isArray(turns)) throw new Error("App Server thread/read returned invalid turns.");
  return turns;
}

function turnClientMessageId(turn) {
  if (!turn || typeof turn !== "object") return null;
  return turn.clientUserMessageId
    ?? turn.client_user_message_id
    ?? turn.clientRequestId
    ?? turn.client_request_id
    ?? null;
}

function reconcileTurnId(response, expectedClientMessageId) {
  if (typeof expectedClientMessageId !== "string" || expectedClientMessageId.length === 0) {
    throw new Error("App Server thread/read reconciliation requires the persisted client_user_message_id.");
  }
  const turns = turnsFromRead(response);
  const correlated = turns.filter((turn) => turnClientMessageId(turn) === expectedClientMessageId);
  if (correlated.length > 1) {
    throw new Error("App Server thread/read returned multiple turns for the persisted client_user_message_id.");
  }
  if (correlated.length === 1) {
    const turn = correlated[0];
    if (typeof turn.id !== "string" || turn.id.length === 0) {
      throw new Error("App Server thread/read returned a correlated turn without a durable id.");
    }
    return turn.id;
  }
  if (turns.length === 0) return null;
  throw new Error("App Server thread/read returned turns without the persisted client_user_message_id.");
}

function isWithinRoot(root, candidate) {
  const canonicalRoot = assertGitWorktree(canonicalDirectory(root, "submitted repository root"), "submitted repository root");
  const canonicalCandidate = canonicalDirectory(candidate, "Worker cwd");
  const relative = path.relative(path.resolve(canonicalRoot), path.resolve(canonicalCandidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertReturnedPolicy(response, expectedModel, expectedEffort) {
  for (const candidate of [response, response?.thread, response?.turn]) {
    if (!candidate || typeof candidate !== "object") continue;
    if (candidate.model !== undefined && candidate.model !== null && candidate.model !== expectedModel) {
      throw new Error(`App Server returned an unexpected model: ${String(candidate.model)}`);
    }
    const returnedEffort = candidate.reasoningEffort ?? candidate.reasoning_effort ?? candidate.effort;
    if (returnedEffort !== undefined && returnedEffort !== null && returnedEffort !== expectedEffort) {
      throw new Error(`App Server returned an unexpected reasoning effort: ${String(returnedEffort)}`);
    }
    const provider = candidate.modelProvider ?? candidate.model_provider;
    if (provider !== undefined && provider !== null && provider !== MVP_CONFIG.model_provider && provider !== MVP_CONFIG.provider) {
      throw new Error(`App Server returned an unexpected model provider: ${String(provider)}`);
    }
  }
}

function assertReturnedThreadIdentity(response, expectedThreadId) {
  const returnedThreadId = response?.thread?.id;
  if (typeof returnedThreadId !== "string" || returnedThreadId.length === 0) {
    throw new Error("App Server thread recovery did not return a durable thread id.");
  }
  if (returnedThreadId !== expectedThreadId) {
    throw new Error(`App Server returned an unexpected thread id: ${String(returnedThreadId)}`);
  }
}

export class ThreadBroker {
  constructor({
    client,
    store,
    clock = Date,
    reservationLeaseMs = MVP_CONFIG.claim_lease_ms,
    heartbeatIntervalMs = Math.max(1, Math.floor(MVP_CONFIG.claim_lease_ms / 3)),
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
  } = {}) {
    if (!(client instanceof AppServerClient) && (!client || typeof client.modelList !== "function")) {
      throw new Error("Thread Broker requires an App Server client.");
    }
    if (!store || typeof store.getWorkerMapping !== "function" || typeof store.putWorkerMapping !== "function"
      || typeof store.reserveWorker !== "function" || typeof store.releaseWorkerReservation !== "function"
      || typeof store.assertWorkerReservation !== "function" || typeof store.renewWorkerReservation !== "function"
      || typeof store.markWorkerThreadStartAmbiguous !== "function") {
      throw new Error("Thread Broker requires a RuntimeStore.");
    }
    if (!Number.isInteger(reservationLeaseMs) || reservationLeaseMs <= 0) {
      throw new Error("Thread Broker reservation lease must be positive.");
    }
    if (!Number.isInteger(heartbeatIntervalMs) || heartbeatIntervalMs <= 0
      || heartbeatIntervalMs >= reservationLeaseMs) {
      throw new Error("Thread Broker heartbeat interval must be positive and shorter than its lease.");
    }
    if (typeof setIntervalFn !== "function" || typeof clearIntervalFn !== "function") {
      throw new Error("Thread Broker heartbeat scheduler is invalid.");
    }
    this.client = client;
    this.store = store;
    this.clock = clock;
    this.reservation_lease_ms = reservationLeaseMs;
    this.heartbeat_interval_ms = heartbeatIntervalMs;
    this.set_interval = setIntervalFn;
    this.clear_interval = clearIntervalFn;
    this.inflight = new Map();
    this.reservation_tokens = new Map();
  }

  async #validatePolicy(model, effort) {
    assertExactModel(model);
    assertNoFallback({ model, effort, allowProviderModelFallback: false }, "Thread Broker policy");
    if (!ALLOWED_REVIEW_EFFORTS.includes(effort) && model === REVIEW_MODEL_NAME) {
      throw new Error(`Unsupported review effort: ${effort}`);
    }
    const pages = [];
    const seenCursors = new Set();
    let cursor = null;
    do {
      const params = { includeHidden: true };
      if (cursor) params.cursor = cursor;
      const page = await this.client.modelList(params);
      pages.push(...modelEntries(page));
      cursor = nextModelCursor(page);
      if (cursor) {
        if (seenCursors.has(cursor)) throw new Error("App Server model/list pagination cursor repeated.");
        seenCursors.add(cursor);
        if (seenCursors.size >= MAX_MODEL_PAGES) throw new Error("App Server model/list pagination exceeded its limit.");
      }
    } while (cursor);
    return findAvailableModel({ data: pages }, model, effort);
  }

  #validateStartOptions(options = {}, role) {
    assertNoAuthorityOverrides(options);
    if (!SUPPORTED_ROLES.has(role)) throw new Error(`Unsupported worker role: ${role}`);
    const batchId = options.batchId ?? options.batch_id;
    const taskId = options.taskId ?? options.task_id;
    if (typeof batchId !== "string" || batchId.length === 0) throw new Error("batchId is required.");
    if (typeof taskId !== "string" || taskId.length === 0) throw new Error("taskId is required.");
    const cwd = assertAbsoluteDirectory(options.cwd);
    const input = normalizeInput(options.prompt, options.input);
    if (options.metadata !== undefined) assertNoSecretsDeep(options.metadata, "worker metadata");
    return { batchId, taskId, cwd, input, metadata: options.metadata === undefined ? null : sanitizeForLog(options.metadata) };
  }

  #beginReservationHeartbeat(batchId, taskId, role, ownerToken) {
    let stopped = false;
    let failure = null;
    const beat = () => {
      if (stopped || failure) return;
      try {
        this.store.renewWorkerReservation(batchId, taskId, role, ownerToken, {
          leaseMs: this.reservation_lease_ms,
          clock: this.clock,
        });
      } catch (error) {
        failure = error;
      }
    };
    const timer = this.set_interval(beat, this.heartbeat_interval_ms);
    timer?.unref?.();
    return {
      assertOwned: () => {
        if (failure) throw failure;
        return this.store.assertWorkerReservation(batchId, taskId, role, ownerToken);
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        this.clear_interval(timer);
      },
    };
  }

  async #start(options = {}, role) {
    const normalized = this.#validateStartOptions(options, role);
    const key = workerKey({ batchId: normalized.batchId, taskId: normalized.taskId, role });
    const signature = JSON.stringify({ cwd: normalized.cwd, input: normalized.input });
    const existing = this.inflight.get(key);
    if (existing) {
      if (existing.signature !== signature) throw new Error("Concurrent worker starts for one durable worker must agree on cwd and input.");
      return existing.promise;
    }
    const promise = this.#startOnce(options, role, normalized).finally(() => {
      if (this.inflight.get(key)?.promise === promise) this.inflight.delete(key);
    });
    this.inflight.set(key, { signature, promise });
    return promise;
  }

  async #startOnce(options, role, normalized) {
    if (role === ROLE_IMPLEMENTATION && options.difficulty !== undefined) {
      throw new Error("Implementation starts do not accept review difficulty.");
    }
    const { batch, task } = taskFromBatch(this.store, normalized.batchId, normalized.taskId);
    if (!isWithinRoot(batch.repository_root, normalized.cwd)) {
      throw new Error("Worker cwd must remain within the submitted repository root.");
    }
    const difficulty = role === ROLE_REVIEW
      ? (options.difficulty ?? REVIEW_DEFAULT_REASONING_EFFORT)
      : null;
    const model = role === ROLE_IMPLEMENTATION ? IMPLEMENTATION_MODEL_NAME : REVIEW_MODEL_NAME;
    const effort = role === ROLE_IMPLEMENTATION
      ? IMPLEMENTATION_REASONING_EFFORT
      : reviewEffortForDifficulty(difficulty);
    const key = workerKey({ batchId: normalized.batchId, taskId: normalized.taskId, role });
    const clientUserMessageId = clientMessageId(batch, task, role);
    let mapping = this.store.getWorkerMapping(normalized.batchId, normalized.taskId, role);
    if (mapping) {
      if (mapping.model !== model || mapping.effort !== effort || mapping.cwd !== normalized.cwd) {
        throw new Error("Existing worker mapping policy or cwd does not match the requested durable worker.");
      }
      if (!mapping.thread_id) throw new Error("Existing worker mapping is missing its durable thread id.");
      if (["COMPLETED", "FAILED"].includes(mapping.lifecycle_state)) return mapping;
      if (mapping.turn_id) return mapping;
    }
    const ownerToken = this.reservation_tokens.get(key) ?? `reservation_${crypto.randomUUID()}`;
    const reservationResult = this.store.reserveWorker({
      batchId: batch.batch_id,
      taskId: task.task_id,
      role,
      model,
      effort,
      cwd: normalized.cwd,
      clientUserMessageId,
      ownerToken,
      clock: this.clock,
    });
    if (reservationResult.status === "BUSY") {
      throw new Error("Durable worker start is already reserved by another owner.");
    }
    if (reservationResult.status === "AMBIGUOUS") {
      throw new Error("Worker thread/start is in-flight or ambiguous; recover the durable reservation before retrying.");
    }
    if (reservationResult.status === "MAPPED") {
      mapping = reservationResult.mapping;
      if (mapping.lifecycle_state === "COMPLETED" || mapping.lifecycle_state === "FAILED" || mapping.turn_id) return mapping;
    } else {
      this.reservation_tokens.set(key, ownerToken);
      if (reservationResult.mapping) mapping = reservationResult.mapping;
    }
    const reservationHeld = reservationResult.status === "RESERVED";
    let available;
    let leaseKeeper = null;
    let threadStartInFlight = false;
    try {
      leaseKeeper = this.#beginReservationHeartbeat(batch.batch_id, task.task_id, role, ownerToken);
      available = await this.#validatePolicy(model, effort);
      if (!mapping) {
      leaseKeeper.assertOwned();
      threadStartInFlight = true;
      const started = await this.client.threadStart({
        model,
        modelProvider: MVP_CONFIG.model_provider,
        config: { model_reasoning_effort: effort },
        cwd: normalized.cwd,
        approvalPolicy: "never",
        sandbox: role === ROLE_IMPLEMENTATION ? "workspace-write" : "read-only",
        ephemeral: false,
        allowProviderModelFallback: false,
      });
      assertReturnedPolicy(started, model, effort);
      const threadId = started?.thread?.id;
      if (typeof threadId !== "string" || threadId.length === 0) {
        throw new Error("App Server thread/start did not return a durable thread id.");
      }
      mapping = {
        schema_version: MVP_CONFIG.schema_version,
        batch_id: batch.batch_id,
        task_id: task.task_id,
        role,
        model,
        effort,
        cwd: normalized.cwd,
        thread_id: threadId,
        turn_id: null,
        lifecycle_state: "THREAD_STARTED",
        created_at: timestampFrom(this.clock),
        updated_at: timestampFrom(this.clock),
        submission_id: batch.submission_id,
        client_user_message_id: clientUserMessageId,
      };
      // This write is deliberately separate and precedes the first turn/start.
      leaseKeeper.assertOwned();
      mapping = this.store.putWorkerMapping(mapping, { reservationToken: ownerToken });
      threadStartInFlight = false;
      } else if (!mapping.turn_id) {
      if (typeof mapping.client_user_message_id !== "string" || mapping.client_user_message_id.length === 0) {
        throw new Error("Existing worker mapping is missing its persisted client_user_message_id.");
      }
      leaseKeeper.assertOwned();
      const read = await this.client.threadRead(mapping.thread_id, { includeTurns: true });
      const recoveredTurnId = reconcileTurnId(read, mapping.client_user_message_id);
      if (recoveredTurnId) {
        leaseKeeper.assertOwned();
        const updated = this.store.patchWorkerMapping(mapping.batch_id, mapping.task_id, mapping.role, {
          client_user_message_id: mapping.client_user_message_id,
          turn_id: recoveredTurnId,
          lifecycle_state: "TURN_STARTED",
          updated_at: timestampFrom(this.clock),
        }, { reservationToken: ownerToken });
        leaseKeeper.stop();
        this.reservation_tokens.delete(key);
        return {
          mapping: updated,
          turn: { id: recoveredTurnId },
          model: available.model,
          effort: available.effort,
          recovered: true,
        };
      }
      leaseKeeper.assertOwned();
      const resumed = await this.client.threadResume(mapping.thread_id, {
        model,
        modelProvider: MVP_CONFIG.model_provider,
        config: { model_reasoning_effort: effort },
        cwd: normalized.cwd,
        approvalPolicy: "never",
        sandbox: role === ROLE_IMPLEMENTATION ? "workspace-write" : "read-only",
        allowProviderModelFallback: false,
      });
      assertReturnedPolicy(resumed, model, effort);
      assertReturnedThreadIdentity(resumed, mapping.thread_id);
    }
      leaseKeeper.assertOwned();
      const turnResponse = await this.client.turnStart({
        threadId: mapping.thread_id,
        input: normalized.input,
        model,
        effort,
        cwd: normalized.cwd,
        sandboxPolicy: role === ROLE_IMPLEMENTATION
          ? { type: "workspaceWrite" }
          : { type: "readOnly" },
        clientUserMessageId: mapping.client_user_message_id,
      });
      assertReturnedPolicy(turnResponse, model, effort);
      const turnId = turnResponse?.turn?.id;
      if (typeof turnId !== "string" || turnId.length === 0) {
        throw new Error("App Server turn/start did not return a durable turn id.");
      }
      leaseKeeper.assertOwned();
      const updated = this.store.patchWorkerMapping(mapping.batch_id, mapping.task_id, mapping.role, {
        turn_id: turnId,
        client_user_message_id: mapping.client_user_message_id,
        lifecycle_state: "TURN_STARTED",
        updated_at: timestampFrom(this.clock),
      }, { reservationToken: ownerToken });
      leaseKeeper.stop();
      this.reservation_tokens.delete(key);
      return { mapping: updated, turn: sanitizeForLog(turnResponse.turn), model: available.model, effort: available.effort };
    } catch (error) {
      leaseKeeper?.stop();
      if (reservationHeld) {
        if (!threadStartInFlight) {
          try {
            this.store.releaseWorkerReservation(batch.batch_id, task.task_id, role, ownerToken);
          } catch (releaseError) {
            error.reservationError = releaseError;
          }
        } else {
          try {
            this.store.markWorkerThreadStartAmbiguous(batch.batch_id, task.task_id, role, ownerToken);
          } catch (ambiguityError) {
            error.reservationError = ambiguityError;
          }
        }
        this.reservation_tokens.delete(key);
      }
      throw error;
    }
  }

  startImplementation(options) { return this.#start(options, ROLE_IMPLEMENTATION); }

  startReview(options) { return this.#start(options, ROLE_REVIEW); }

  async readWorker({ batchId, batch_id: batchIdAlias, taskId, task_id: taskIdAlias, role }) {
    const mapping = this.store.getWorkerMapping(batchId ?? batchIdAlias, taskId ?? taskIdAlias, role);
    if (!mapping?.thread_id) throw new Error("Durable worker thread mapping is not available.");
    return this.client.threadRead(mapping.thread_id, { includeTurns: true });
  }

  async resumeWorker({ batchId, batch_id: batchIdAlias, taskId, task_id: taskIdAlias, role, ...params }) {
    const mapping = this.store.getWorkerMapping(batchId ?? batchIdAlias, taskId ?? taskIdAlias, role);
    if (!mapping?.thread_id) throw new Error("Durable worker thread mapping is not available.");
    const override = Object.keys(params)[0];
    if (override) {
      throw new Error(`Worker recovery cannot override policy field: ${override}`);
    }
    const resumed = await this.client.threadResume(mapping.thread_id, {
      model: mapping.model,
      modelProvider: MVP_CONFIG.model_provider,
      cwd: mapping.cwd,
      approvalPolicy: "never",
      config: { model_reasoning_effort: mapping.effort },
      sandbox: mapping.role === ROLE_IMPLEMENTATION ? "workspace-write" : "read-only",
      allowProviderModelFallback: false,
    });
    assertReturnedPolicy(resumed, mapping.model, mapping.effort);
    assertReturnedThreadIdentity(resumed, mapping.thread_id);
    return resumed;
  }

  async recoverWorker(options) {
    return this.resumeWorker(options);
  }

  getWorkerMapping(batchId, taskId, role) {
    return this.store.getWorkerMapping(batchId, taskId, role);
  }

  listWorkerMappings(batchId = null) {
    return this.store.listWorkerMappings(batchId);
  }
}

export const ThreadBrokerService = ThreadBroker;
export const createThreadBroker = (options) => new ThreadBroker(options);
export const WORKER_ROLES = Object.freeze({ implementation: ROLE_IMPLEMENTATION, review: ROLE_REVIEW });
export { findAvailableModel, modelEntries, effortsFor, assertReturnedPolicy, assertReturnedThreadIdentity };
