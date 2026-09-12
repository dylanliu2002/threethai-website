import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { EventEmitter } from "node:events";
import { MVP_CONFIG } from "../config.mjs";
import { AppServerClient, createThreadBrokerClient } from "../app-server-client.mjs";
import { FifoQueue } from "../queue.mjs";
import { RuntimeStore } from "../runtime-store.mjs";
import { NightWorkerService } from "../service.mjs";
import { createBatch, defaultRuntimeStorePath, submitBatch } from "../submission.mjs";
import { ThreadBroker } from "../thread-broker.mjs";
import { runCli, runServe } from "../cli.mjs";

const EPOCH = Date.parse("2026-09-11T00:00:00.000Z");

function fixture({ processAliveFn } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-"));
  execFileSync("git", ["init", "--quiet", root], { stdio: "ignore" });
  const store = new RuntimeStore(path.join(root, ".night-worker", "runtime.json"), processAliveFn ? { processAliveFn } : undefined);
  let now = EPOCH;
  const clock = { now: () => now };
  let id = 0;
  const idFactory = (prefix) => `${prefix}-${++id}`;
  function submit(tasks = ["first task"]) {
    const batch = createBatch({ repositoryRoot: root, tasks }, {
      clock,
      idFactory,
    });
    return store.enqueueBatch(batch);
  }
  return {
    root,
    store,
    clock,
    submit,
    setNow(value) { now = value; },
    now() { return now; },
    cleanup() { fs.rmSync(root, { recursive: true, force: true }); },
  };
}

function modelCatalog({ luna = ["max"], sol = ["medium", "high"] } = {}) {
  return {
    data: [
      { id: "gpt-5.6-luna", model: "gpt-5.6-luna", supportedReasoningEfforts: luna },
      { id: "gpt-5.6-sol", model: "gpt-5.6-sol", supportedReasoningEfforts: sol },
    ],
    nextCursor: null,
  };
}

class FakeBrokerClient {
  constructor({ catalog = modelCatalog(), modelList, threadStart, threadResume, threadRead, turnStart } = {}) {
    this.catalog = catalog;
    this.modelListImplementation = modelList;
    this.threadStartImplementation = threadStart;
    this.threadResumeImplementation = threadResume;
    this.threadReadImplementation = threadRead;
    this.turnStartImplementation = turnStart;
    this.calls = [];
    this.threadNumber = 0;
    this.turnNumber = 0;
  }

  async modelList(params) {
    this.calls.push({ method: "model/list", params });
    if (this.modelListImplementation) return this.modelListImplementation(params, this);
    return this.catalog;
  }

  async threadStart(params) {
    this.calls.push({ method: "thread/start", params });
    if (this.threadStartImplementation) return this.threadStartImplementation(params, this);
    this.threadNumber += 1;
    return { thread: { id: `thread-${this.threadNumber}` } };
  }

  async threadResume(threadId, params) {
    this.calls.push({ method: "thread/resume", threadId, params });
    if (this.threadResumeImplementation) return this.threadResumeImplementation(threadId, params, this);
    return { thread: { id: threadId } };
  }

  async turnStart(params) {
    this.calls.push({ method: "turn/start", params });
    if (this.turnStartImplementation) return this.turnStartImplementation(params, this);
    this.turnNumber += 1;
    return { turn: { id: `turn-${this.turnNumber}`, status: "inProgress" } };
  }

  async threadRead(threadId, params) {
    this.calls.push({ method: "thread/read", threadId, params });
    if (this.threadReadImplementation) return this.threadReadImplementation(threadId, params, this);
    return { thread: { id: threadId, turns: [] } };
  }
}

test("valid submission is atomically durable, bounded, and submission-backed", () => {
  const f = fixture();
  try {
    const batch = f.submit(["one", "two"]);
    assert.equal(batch.state, "QUEUED");
    assert.equal(batch.tasks.length, 2);
    assert.equal(batch.queue_sequence, 1);
    assert.equal(batch.submitted_at, "2026-09-11T00:00:00.000Z");
    assert.equal(batch.expires_at, "2026-09-11T08:00:00.000Z");
    const reloaded = new RuntimeStore(f.store.filePath).load();
    assert.deepEqual(reloaded.batches[0], batch);
    assert.equal(reloaded.workers.length, 0);
    assert.deepEqual(reloaded.reservations, []);
    assert.equal(fs.existsSync(`${f.store.filePath}.lock`), false);
  } finally {
    f.cleanup();
  }
});

test("production submitBatch uses only the canonical internal RuntimeStore", () => {
  const f = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-submit-outside-"));
  try {
    const batch = submitBatch({
      repositoryRoot: f.root,
      tasks: ["canonical production submission"],
    }, {
      clock: f.clock,
      idFactory: (prefix) => prefix + "-production",
    });
    const canonicalPath = defaultRuntimeStorePath(f.root);
    assert.equal(canonicalPath, path.join(f.root, ".night-worker", "runtime.json"));
    assert.equal(new RuntimeStore(canonicalPath).getBatch(batch.batch_id).submission_id, batch.submission_id);
    assert.throws(
      () => submitBatch({ repositoryRoot: f.root, tasks: ["fake store"] }, {
        store: { enqueueBatch: () => { throw new Error("fake store was used"); } },
      }),
      /canonical internal RuntimeStore/,
    );
    assert.throws(
      () => submitBatch({ repositoryRoot: f.root, tasks: ["out of root store"] }, {
        storePath: path.join(outside, "runtime.json"),
      }),
      /canonical internal RuntimeStore/,
    );
    assert.throws(
      () => submitBatch({ repositoryRoot: f.root, tasks: ["noncanonical store"] }, {
        storePath: path.join(f.root, "runtime", "state.json"),
      }),
      /canonical internal RuntimeStore/,
    );
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("submission rejects empty, authority-bearing, secret-bearing, and oversized input without a batch", () => {
  const f = fixture();
  try {
    const fakeSecret = `sk-proj-${"x".repeat(32)}`;
    const cases = [
      [{ repositoryRoot: f.root, tasks: [] }, /between one and four/],
      [{ repositoryRoot: f.root, tasks: ["  "] }, /cannot be empty/],
      [{ repositoryRoot: f.root, tasks: ["work"], model: "gpt-5.6-luna" }, /authority field/],
      [{ repositoryRoot: f.root, tasks: [`use ${fakeSecret}`] }, /Possible secret/],
      [{ repositoryRoot: f.root, tasks: ["work"], replyMetadata: { password: "not-accepted" } }, /authority field|Possible secret/],
      [{ repositoryRoot: f.root, tasks: ["x".repeat(MVP_CONFIG.max_task_description_chars + 1)] }, /oversized/],
    ];
    for (const [input, pattern] of cases) assert.throws(() => submitBatch(input), pattern);
    assert.equal(f.store.load().batches.length, 0);
  } finally {
    f.cleanup();
  }
});

test("submission and broker reject non-Git roots, symlink escapes, and external CLI stores", async () => {
  const f = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-outside-"));
  const escaped = path.join(f.root, "escaped-worktree");
  try {
    assert.throws(
      () => submitBatch({ repositoryRoot: outside, tasks: ["not a repository"] }),
      /genuine Git worktree/,
    );
    execFileSync("git", ["init", "--quiet", outside], { stdio: "ignore" });
    fs.symlinkSync(outside, escaped, "junction");
    const batch = f.submit(["confined work"]);
    const broker = new ThreadBroker({ client: new FakeBrokerClient(), store: f.store, clock: f.clock });
    await assert.rejects(
      broker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: escaped, prompt: "escape" }),
      /within the submitted repository root/,
    );
    await assert.rejects(
      runCli(["status", "--repo", f.root, "--store", path.join(outside, "runtime.json")]),
      /internal \.night-worker\/runtime\.json path/,
    );
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("FIFO queue serializes active batches and recovers only stale claims", () => {
  const f = fixture();
  try {
    const first = f.submit(["first"]);
    const second = f.submit(["second"]);
    const queue = new FifoQueue({
      store: f.store,
      clock: f.clock,
      ownerTokenFactory: () => "owner-one",
    });
    const claim = queue.claimNext();
    assert.equal(claim.batch.batch_id, first.batch_id);
    assert.equal(queue.claimNext(), null);
    assert.equal(queue.heartbeat(first.batch_id, claim.owner_token).claim.owner_token, "owner-one");
    assert.throws(() => queue.complete(first.batch_id, "wrong-owner"), /does not match/);
    const later = f.now() + MVP_CONFIG.claim_lease_ms + 1;
    f.setNow(later);
    const recovered = queue.claimNext({ ownerToken: "owner-two", now: later });
    assert.equal(recovered.batch.batch_id, first.batch_id);
    queue.complete(first.batch_id, "owner-two", { now: later });
    const next = queue.claimNext({ ownerToken: "owner-three", now: later });
    assert.equal(next.batch.batch_id, second.batch_id);
    assert.equal(new RuntimeStore(f.store.filePath).load().active_batch_id, second.batch_id);
  } finally {
    f.cleanup();
  }
});

test("expired queued and claimed batches are never processed", () => {
  const f = fixture();
  try {
    const batch = f.submit(["expire me"]);
    const queue = new FifoQueue({ store: f.store, clock: f.clock, ownerTokenFactory: () => "owner" });
    f.setNow(f.now() + MVP_CONFIG.batch_expiry_ms + 1);
    assert.equal(queue.claimNext({ now: f.now() }), null);
    assert.equal(f.store.getBatch(batch.batch_id).state, "EXPIRED");
  } finally {
    f.cleanup();
  }
});

test("runtime store rejects corrupt and unsupported state and round-trips restart state", () => {
  const f = fixture();
  try {
    f.submit(["survive restart"]);
    const reloaded = new RuntimeStore(f.store.filePath);
    assert.equal(reloaded.load().batches[0].state, "QUEUED");
    fs.writeFileSync(f.store.filePath, "{not-json", "utf8");
    assert.throws(() => reloaded.load(), /corrupt/);
    fs.writeFileSync(f.store.filePath, JSON.stringify({ schema_version: 999 }), "utf8");
    assert.throws(() => reloaded.load(), /Unsupported runtime schema version/);
  } finally {
    f.cleanup();
  }
});

test("runtime store and FIFO queue reject invalid timestamps and enforce eight-hour expiry", () => {
  const f = fixture();
  try {
    const batch = f.submit(["timestamp validation"]);
    const validState = f.store.load();
    const invalidBatchCases = [
      ["submitted_at", "not-a-timestamp", /Batch submitted_at.*valid canonical ISO timestamp/],
      ["expires_at", "not-a-timestamp", /Batch expires_at.*valid canonical ISO timestamp/],
    ];
    for (const [field, value, pattern] of invalidBatchCases) {
      const state = structuredClone(validState);
      state.batches[0][field] = value;
      fs.writeFileSync(f.store.filePath, JSON.stringify(state), "utf8");
      assert.throws(() => f.store.load(), pattern);
    }
    const wrongExpiry = structuredClone(validState);
    wrongExpiry.batches[0].expires_at = new Date(EPOCH + MVP_CONFIG.batch_expiry_ms - 1).toISOString();
    fs.writeFileSync(f.store.filePath, JSON.stringify(wrongExpiry), "utf8");
    assert.throws(() => f.store.load(), /exactly eight hours/);

    f.store.replace(validState);
    const queue = new FifoQueue({ store: f.store, clock: f.clock, ownerTokenFactory: () => "timestamp-owner" });
    queue.claimNext();
    const claimState = f.store.load();
    claimState.batches[0].claim.lease_expires_at = "not-a-timestamp";
    fs.writeFileSync(f.store.filePath, JSON.stringify(claimState), "utf8");
    assert.throws(() => f.store.load(), /Batch claim lease_expires_at.*valid canonical ISO timestamp/);
    assert.throws(() => queue.requeueStale(), /Batch claim lease_expires_at.*valid canonical ISO timestamp/);

    f.store.replace(validState);
    f.store.reserveWorker({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      role: "IMPLEMENTATION",
      model: "gpt-5.6-luna",
      effort: "max",
      cwd: f.root,
      clientUserMessageId: "timestamp-client-message",
      ownerToken: "timestamp-reservation",
      clock: f.clock,
    });
    const reservationState = f.store.load();
    reservationState.reservations[0].created_at = "not-a-timestamp";
    fs.writeFileSync(f.store.filePath, JSON.stringify(reservationState), "utf8");
    assert.throws(() => f.store.load(), /Worker reservation created_at.*valid canonical ISO timestamp/);
  } finally {
    f.cleanup();
  }
});

test("runtime lock publishes a complete owner record and releases only its owner", () => {
  const f = fixture();
  const store = new RuntimeStore(path.join(f.root, "runtime", "lock-state.json"), {
    lockTimeoutMs: 25,
    clock: f.clock,
    lockOwnerTokenFactory: () => "owner-one",
  });
  try {
    let observed;
    store.mutate((state) => {
      observed = JSON.parse(fs.readFileSync(path.join(store.lockPath, "owner.json"), "utf8"));
      return state;
    });
    assert.equal(observed.owner_token, "owner-one");
    assert.equal(observed.pid, process.pid);
    assert.equal(typeof observed.created_at, "string");
    assert.equal(fs.existsSync(store.lockPath), false);

    fs.mkdirSync(store.lockPath);
    fs.writeFileSync(path.join(store.lockPath, "owner.json"), JSON.stringify({
      schema_version: 1,
      owner_token: "stale-owner",
      pid: process.pid,
      host: "test-host",
      created_at: "2000-01-01T00:00:00.000Z",
    }), "utf8");
    assert.throws(() => store.mutate((state) => state), /Runtime store is busy/);
    assert.equal(fs.existsSync(store.lockPath), true);

    fs.rmSync(store.lockPath, { recursive: true, force: true });
    assert.throws(() => store.mutate((state) => {
      fs.writeFileSync(path.join(store.lockPath, "owner.json"), JSON.stringify({
        schema_version: 1,
        owner_token: "different-owner",
        pid: process.pid,
        host: "test-host",
        created_at: "2026-09-11T00:00:00.000Z",
      }), "utf8");
      return state;
    }), /Runtime lock owner token does not match/);
    assert.equal(fs.existsSync(store.lockPath), true);
  } finally {
    if (fs.existsSync(store.lockPath)) fs.rmSync(store.lockPath, { recursive: true, force: true });
    f.cleanup();
  }
});

test("service is passive while idle and processes one claimed batch through its injected handler", async () => {
  const f = fixture();
  try {
    let calls = 0;
    const queue = new FifoQueue({ store: f.store, clock: f.clock, ownerTokenFactory: () => "service-owner" });
    const service = new NightWorkerService({
      queue,
      pollMs: 0,
      handler: async (batch, context) => {
        calls += 1;
        assert.equal(context.batch_id, batch.batch_id);
        assert.equal(f.store.getBatch(batch.batch_id).state, "RUNNING");
        return { accepted: true };
      },
    });
    assert.deepEqual(await service.runOnce(), { status: "IDLE" });
    assert.equal(calls, 0);
    const submitted = f.submit(["explicit workload"]);
    const result = await service.runOnce();
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.batch.batch_id, submitted.batch_id);
    assert.equal(calls, 1);
    assert.equal(f.store.getBatch(submitted.batch_id).state, "COMPLETED");
  } finally {
    f.cleanup();
  }
});

test("broker requires consistent exact model identifiers and consumes model/list pagination", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["catalog validation"]);
    const mismatchClient = new FakeBrokerClient({
      catalog: {
        data: [
          { id: "gpt-5.6-luna", model: "gpt-5.6-luna-alias", supportedReasoningEfforts: ["max"] },
          { id: "gpt-5.6-sol", model: "gpt-5.6-sol", supportedReasoningEfforts: ["medium"] },
        ],
      },
    });
    const mismatchBroker = new ThreadBroker({ client: mismatchClient, store: f.store, clock: f.clock });
    await assert.rejects(
      mismatchBroker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "catalog" }),
      /Required exact model is unavailable/,
    );
    assert.equal(mismatchClient.calls.some((call) => call.method === "thread/start"), false);

    const pages = [
      {
        data: [{ id: "gpt-5.6-luna", model: "gpt-5.6-luna-wrong", supportedReasoningEfforts: ["max"] }],
        nextCursor: "page-2",
      },
      {
        data: [{ id: "gpt-5.6-luna", model: "gpt-5.6-luna", supportedReasoningEfforts: ["max"] }],
        nextCursor: null,
      },
    ];
    const paginatedClient = new FakeBrokerClient({
      modelList: (params) => pages[params.cursor === "page-2" ? 1 : 0],
    });
    const paginatedBroker = new ThreadBroker({ client: paginatedClient, store: f.store, clock: f.clock });
    const result = await paginatedBroker.startImplementation({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      prompt: "catalog",
    });
    assert.equal(result.mapping.model, "gpt-5.6-luna");
    const modelCalls = paginatedClient.calls.filter((call) => call.method === "model/list");
    assert.equal(modelCalls.length, 2);
    assert.equal(modelCalls[1].params.cursor, "page-2");

    const missingClient = new FakeBrokerClient({ catalog: modelCatalog({ luna: [] }) });
    const missingBroker = new ThreadBroker({ client: missingClient, store: f.store, clock: f.clock });
    const secondBatch = f.submit(["missing model"]);
    await assert.rejects(
      missingBroker.startImplementation({ batchId: secondBatch.batch_id, taskId: secondBatch.tasks[0].task_id, cwd: f.root, prompt: "missing" }),
      /reasoning effort is unavailable/,
    );
  } finally {
    f.cleanup();
  }
});

test("broker validates exact models and creates no worker for a missing explicit submission", async () => {
  const f = fixture();
  try {
    const client = new FakeBrokerClient();
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    await assert.rejects(
      broker.startImplementation({ batchId: "missing", taskId: "missing", cwd: f.root, prompt: "not allowed" }),
      /explicit submitted batch/,
    );
    assert.equal(client.calls.length, 0);
    const batch = f.submit(["exact policy"]);
    await assert.rejects(
      broker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "work", model: "gpt-5.6-terra" }),
      /policy field/,
    );
    await assert.rejects(
      broker.startReview({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "review", difficulty: "ultra" }),
      /difficulty\/effort/,
    );
    assert.equal(client.calls.length, 0);
  } finally {
    f.cleanup();
  }
});

test("broker requires the complete real canonical RuntimeStore before remote calls", async () => {
  const f = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-broker-store-"));
  try {
    const batch = f.submit(["canonical store"]);
    const client = new FakeBrokerClient();
    assert.throws(
      () => new ThreadBroker({
        client,
        store: {
          getBatch: () => batch,
          getWorkerMapping: () => null,
          putWorkerMapping() {},
          reserveWorker() {},
          releaseWorkerReservation() {},
          assertWorkerReservation() {},
          renewWorkerReservation() {},
          markWorkerThreadStartAmbiguous() {},
        },
      }),
      /real RuntimeStore.*complete durable worker API/,
    );
    assert.equal(client.calls.length, 0);

    const nonCanonicalPath = path.join(outside, "runtime.json");
    const nonCanonicalStore = new RuntimeStore(nonCanonicalPath);
    const copiedState = f.store.load();
    nonCanonicalStore.replace(copiedState);
    const nonCanonicalBroker = new ThreadBroker({ client, store: nonCanonicalStore, clock: f.clock });
    await assert.rejects(
      nonCanonicalBroker.startImplementation({
        batchId: batch.batch_id,
        taskId: batch.tasks[0].task_id,
        cwd: f.root,
        prompt: "canonical store",
      }),
      /canonical repository.*\.night-worker\/runtime\.json/,
    );
    assert.equal(client.calls.length, 0);
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("broker enforces the fixed parallel implementation limit", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["one", "two", "three"]);
    const client = new FakeBrokerClient();
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    for (const task of batch.tasks.slice(0, MVP_CONFIG.max_parallel_implementation_workers)) {
      await broker.startImplementation({ batchId: batch.batch_id, taskId: task.task_id, cwd: f.root, prompt: task.description });
    }
    await assert.rejects(
      broker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[2].task_id, cwd: f.root, prompt: batch.tasks[2].description }),
      /Maximum parallel implementation worker limit/,
    );
    assert.equal(client.calls.filter((call) => call.method === "thread/start").length, MVP_CONFIG.max_parallel_implementation_workers);
  } finally {
    f.cleanup();
  }
});

test("broker deduplicates concurrent starts for one worker through an in-flight and durable reservation", async () => {
  const f = fixture();
  let releaseThreadStart;
  const threadStartGate = new Promise((resolve) => { releaseThreadStart = resolve; });
  try {
    const batch = f.submit(["same worker"]);
    const client = new FakeBrokerClient({
      threadStart: async (_params, brokerClient) => {
        await threadStartGate;
        brokerClient.threadNumber += 1;
        return { thread: { id: `thread-${brokerClient.threadNumber}` } };
      },
    });
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    const options = { batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "same worker" };
    const first = broker.startImplementation(options);
    while (client.calls.filter((call) => call.method === "thread/start").length < 1) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    const second = broker.startImplementation(options);
    releaseThreadStart();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.equal(firstResult.mapping.thread_id, secondResult.mapping.thread_id);
    assert.equal(client.calls.filter((call) => call.method === "thread/start").length, 1);
    assert.equal(client.calls.filter((call) => call.method === "turn/start").length, 1);
    assert.equal(f.store.listWorkerReservations(batch.batch_id).length, 0);
  } finally {
    releaseThreadStart?.();
    f.cleanup();
  }
});

test("broker rejects concurrent review starts whose effective difficulty differs", async () => {
  const f = fixture();
  let releaseThreadStart;
  const threadStartGate = new Promise((resolve) => { releaseThreadStart = resolve; });
  try {
    const batch = f.submit(["same review worker"]);
    const client = new FakeBrokerClient({
      catalog: modelCatalog({ sol: ["low", "high"] }),
      threadStart: async (_params, brokerClient) => {
        await threadStartGate;
        brokerClient.threadNumber += 1;
        return { thread: { id: `thread-${brokerClient.threadNumber}` } };
      },
    });
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    const common = {
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      prompt: "same review worker",
    };
    const first = broker.startReview({ ...common, difficulty: "low" });
    while (client.calls.filter((call) => call.method === "thread/start").length < 1) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    await assert.rejects(
      broker.startReview({ ...common, difficulty: "high" }),
      /effective model\/effort\/policy/,
    );
    releaseThreadStart();
    const result = await first;
    assert.equal(result.mapping.model, "gpt-5.6-sol");
    assert.equal(result.mapping.effort, "low");
    assert.equal(client.calls.filter((call) => call.method === "thread/start").length, 1);
    assert.equal(client.calls.filter((call) => call.method === "turn/start").length, 1);
  } finally {
    releaseThreadStart?.();
    f.cleanup();
  }
});

test("durable reservations enforce implementation capacity across broker instances", async () => {
  const f = fixture();
  let releaseThreadStarts;
  const threadStartGate = new Promise((resolve) => { releaseThreadStarts = resolve; });
  try {
    const batch = f.submit(["one", "two", "three"]);
    const client = new FakeBrokerClient({
      threadStart: async (_params, brokerClient) => {
        await threadStartGate;
        brokerClient.threadNumber += 1;
        return { thread: { id: `thread-${brokerClient.threadNumber}` } };
      },
    });
    const brokers = [
      new ThreadBroker({ client, store: f.store, clock: f.clock }),
      new ThreadBroker({ client, store: f.store, clock: f.clock }),
      new ThreadBroker({ client, store: f.store, clock: f.clock }),
    ];
    const makeOptions = (index) => ({
      batchId: batch.batch_id,
      taskId: batch.tasks[index].task_id,
      cwd: f.root,
      prompt: batch.tasks[index].description,
    });
    const first = brokers[0].startImplementation(makeOptions(0));
    const second = brokers[1].startImplementation(makeOptions(1));
    while (f.store.listWorkerReservations(batch.batch_id).length < 2) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    await assert.rejects(brokers[2].startImplementation(makeOptions(2)), /Maximum parallel implementation worker limit/);
    assert.equal(client.calls.filter((call) => call.method === "thread/start").length, 2);
    releaseThreadStarts();
    await Promise.all([first, second]);
    assert.equal(f.store.listWorkerMappings(batch.batch_id).length, 2);
  } finally {
    releaseThreadStarts?.();
    f.cleanup();
  }
});

test("broker leaves an ambiguous thread-start reservation after the pre-mapping crash window", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["ambiguous thread start"]);
    const originalPut = f.store.putWorkerMapping.bind(f.store);
    f.store.putWorkerMapping = () => { throw new Error("simulated crash after thread/start response"); };
    const firstClient = new FakeBrokerClient();
    const firstBroker = new ThreadBroker({ client: firstClient, store: f.store, clock: f.clock });
    await assert.rejects(
      firstBroker.startImplementation({
        batchId: batch.batch_id,
        taskId: batch.tasks[0].task_id,
        cwd: f.root,
        prompt: "ambiguous thread start",
      }),
      /simulated crash after thread\/start response/,
    );
    f.store.putWorkerMapping = originalPut;
    assert.equal(f.store.getWorkerMapping(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION"), null);
    assert.equal(f.store.getWorkerReservation(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION").thread_start_state, "THREAD_START_AMBIGUOUS");

    const retryClient = new FakeBrokerClient({
      threadStart: async () => { throw new Error("duplicate thread/start must never be sent"); },
    });
    const retryBroker = new ThreadBroker({ client: retryClient, store: f.store, clock: f.clock });
    await assert.rejects(
      retryBroker.startImplementation({
        batchId: batch.batch_id,
        taskId: batch.tasks[0].task_id,
        cwd: f.root,
        prompt: "ambiguous thread start",
      }),
      /in-flight or ambiguous/,
    );
    assert.equal(retryClient.calls.some((call) => call.method === "thread\/start"), false);
    assert.equal(f.store.getWorkerReservation(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION").thread_start_state, "THREAD_START_AMBIGUOUS");
  } finally {
    f.cleanup();
  }
});

test("broker heartbeats live reservations past their lease without duplicate threads or capacity overflow", async () => {
  const f = fixture();
  const heartbeatCallbacks = [];
  let releaseThreadStarts;
  const threadStartGate = new Promise((resolve) => { releaseThreadStarts = resolve; });
  const scheduleHeartbeat = (callback) => {
    heartbeatCallbacks.push(callback);
    return heartbeatCallbacks.length - 1;
  };
  try {
    const batch = f.submit(["one", "two", "three"]);
    const client = new FakeBrokerClient({
      threadStart: async (_params, brokerClient) => {
        await threadStartGate;
        brokerClient.threadNumber += 1;
        return { thread: { id: "thread-" + brokerClient.threadNumber } };
      },
    });
    const brokerOptions = {
      client,
      store: f.store,
      clock: f.clock,
      reservationLeaseMs: 10,
      heartbeatIntervalMs: 5,
      setIntervalFn: scheduleHeartbeat,
      clearIntervalFn: () => {},
    };
    const ownerBroker = new ThreadBroker(brokerOptions);
    const contenderBroker = new ThreadBroker(brokerOptions);
    const optionsFor = (index) => ({
      batchId: batch.batch_id,
      taskId: batch.tasks[index].task_id,
      cwd: f.root,
      prompt: batch.tasks[index].description,
    });
    const first = ownerBroker.startImplementation(optionsFor(0));
    while (f.store.listWorkerReservations(batch.batch_id).length < 1) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    f.setNow(EPOCH + 11);
    heartbeatCallbacks[0]();
    const renewed = f.store.getWorkerReservation(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION");
    assert.ok(Date.parse(renewed.lease_expires_at) > f.now());

    await assert.rejects(contenderBroker.startImplementation(optionsFor(0)), /already reserved/);
    const second = contenderBroker.startImplementation(optionsFor(1));
    while (f.store.listWorkerReservations(batch.batch_id).length < 2) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    await assert.rejects(contenderBroker.startImplementation(optionsFor(2)), /Maximum parallel implementation worker limit/);
    assert.equal(client.calls.filter((call) => call.method === "thread\/start").length, 2);

    releaseThreadStarts();
    await Promise.all([first, second]);
    assert.equal(f.store.listWorkerMappings(batch.batch_id).length, 2);
  } finally {
    releaseThreadStarts?.();
    f.cleanup();
  }
});

test("runtime worker mappings cannot replace a durable thread identity", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["identity"]);
    const broker = new ThreadBroker({ client: new FakeBrokerClient(), store: f.store, clock: f.clock });
    const result = await broker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "identity" });
    assert.throws(
      () => f.store.putWorkerMapping({ ...result.mapping, thread_id: "sibling-thread" }),
      /thread identity cannot change/,
    );
    assert.equal(f.store.getWorkerMapping(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION").thread_id, result.mapping.thread_id);
  } finally {
    f.cleanup();
  }
});

test("broker ordering durably persists thread before first turn and turn immediately after response", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["implement this"]);
    const client = new FakeBrokerClient();
    const order = [];
    const originalPut = f.store.putWorkerMapping.bind(f.store);
    const originalPatch = f.store.patchWorkerMapping.bind(f.store);
    f.store.putWorkerMapping = (...args) => { order.push("durable-thread"); return originalPut(...args); };
    f.store.patchWorkerMapping = (...args) => { order.push("durable-turn"); return originalPatch(...args); };
    const originalModelList = client.modelList.bind(client);
    const originalThreadStart = client.threadStart.bind(client);
    const originalTurnStart = client.turnStart.bind(client);
    client.modelList = async (...args) => { order.push("model/list"); return originalModelList(...args); };
    client.threadStart = async (...args) => { order.push("thread/start"); return originalThreadStart(...args); };
    client.turnStart = async (...args) => { order.push("turn/start"); return originalTurnStart(...args); };
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    const result = await broker.startImplementation({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      prompt: "implement this",
    });
    assert.deepEqual(order, ["model/list", "thread/start", "durable-thread", "turn/start", "durable-turn"]);
    assert.equal(result.mapping.thread_id, "thread-1");
    assert.equal(result.mapping.turn_id, "turn-1");
    assert.equal(result.mapping.model, "gpt-5.6-luna");
    assert.equal(result.mapping.effort, "max");
    assert.equal(client.calls.find((call) => call.method === "thread/start").params.ephemeral, false);
    assert.equal(client.calls.find((call) => call.method === "thread/start").params.allowProviderModelFallback, false);
    assert.equal(client.calls.find((call) => call.method === "thread/start").params.sandbox, "workspace-write");
    assert.deepEqual(client.calls.find((call) => call.method === "thread/start").params.config, {
      model_reasoning_effort: "max",
    });
  } finally {
    f.cleanup();
  }
});

test("broker retries after durable thread persistence by resuming the same thread, never a sibling", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["retry this"]);
    const originalAssertReservation = f.store.assertWorkerReservation.bind(f.store);
    let ownershipChecks = 0;
    f.store.assertWorkerReservation = (...args) => {
      ownershipChecks += 1;
      if (ownershipChecks === 3) throw new Error("simulated crash before turn/start");
      return originalAssertReservation(...args);
    };
    const firstClient = new FakeBrokerClient();
    const firstBroker = new ThreadBroker({ client: firstClient, store: f.store, clock: f.clock });
    await assert.rejects(firstBroker.startImplementation({
      batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "retry this",
    }), /simulated crash before turn\/start/);
    f.store.assertWorkerReservation = originalAssertReservation;
    assert.deepEqual(f.store.getWorkerMapping(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION"), {
      schema_version: 1,
      batch_id: batch.batch_id,
      task_id: batch.tasks[0].task_id,
      role: "IMPLEMENTATION",
      model: "gpt-5.6-luna",
      effort: "max",
      cwd: f.root,
      thread_id: "thread-1",
      turn_id: null,
      lifecycle_state: "THREAD_STARTED",
      created_at: "2026-09-11T00:00:00.000Z",
      updated_at: "2026-09-11T00:00:00.000Z",
      submission_id: batch.submission_id,
      client_user_message_id: `${batch.submission_id}:${batch.tasks[0].task_id}:IMPLEMENTATION`,
    });
    const retryClient = new FakeBrokerClient();
    const retryBroker = new ThreadBroker({ client: retryClient, store: f.store, clock: f.clock });
    const result = await retryBroker.startImplementation({
      batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "retry this",
    });
    assert.equal(result.mapping.thread_id, "thread-1");
    assert.equal(retryClient.calls.some((call) => call.method === "thread/start"), false);
    assert.equal(retryClient.calls.find((call) => call.method === "thread/resume").threadId, "thread-1");
    assert.equal(retryClient.calls.find((call) => call.method === "thread/resume").params.sandbox, "workspace-write");
    assert.equal(result.mapping.turn_id, "turn-1");
  } finally {
    f.cleanup();
  }
});

test("broker fail-closes a lost turn/start response with an empty read and sends only one turn", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["lost response"]);
    let remoteTurnAccepted = false;
    const firstClient = new FakeBrokerClient({
      turnStart: async () => {
        remoteTurnAccepted = true;
        throw new Error("simulated lost turn/start response");
      },
    });
    const firstBroker = new ThreadBroker({ client: firstClient, store: f.store, clock: f.clock });
    await assert.rejects(
      firstBroker.startImplementation({
        batchId: batch.batch_id,
        taskId: batch.tasks[0].task_id,
        cwd: f.root,
        prompt: "lost response",
      }),
      /simulated lost turn\/start response/,
    );
    assert.equal(remoteTurnAccepted, true);
    const reservation = f.store.getWorkerReservation(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION");
    assert.equal(reservation.turn_start_state, "TURN_START_AMBIGUOUS");
    assert.equal(firstClient.calls.filter((call) => call.method === "turn/start").length, 1);

    const retryClient = new FakeBrokerClient({
      threadRead: async (threadId) => ({ thread: { id: threadId, turns: [] } }),
      turnStart: async () => { throw new Error("ambiguous recovery must not send turn/start"); },
    });
    const retryBroker = new ThreadBroker({ client: retryClient, store: f.store, clock: f.clock });
    await assert.rejects(
      retryBroker.startImplementation({
        batchId: batch.batch_id,
        taskId: batch.tasks[0].task_id,
        cwd: f.root,
        prompt: "lost response",
      }),
      /fail-closed.*no correlated turn/,
    );
    assert.equal(retryClient.calls.filter((call) => call.method === "thread/read").length, 1);
    assert.equal(retryClient.calls.filter((call) => call.method === "turn/start").length, 0);
    assert.equal(firstClient.calls.filter((call) => call.method === "turn/start").length, 1);
    assert.equal(f.store.getWorkerReservation(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION").turn_start_state, "TURN_START_AMBIGUOUS");
  } finally {
    f.cleanup();
  }
});

test("broker reconciles a turn persisted by App Server after a crash before turn_id persistence", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["reconcile turn"]);
    const originalPatch = f.store.patchWorkerMapping.bind(f.store);
    let crashBeforePersistence = true;
    f.store.patchWorkerMapping = (...args) => {
      if (crashBeforePersistence) {
        crashBeforePersistence = false;
        throw new Error("simulated crash after turn response");
      }
      return originalPatch(...args);
    };
    const firstClient = new FakeBrokerClient();
    const firstBroker = new ThreadBroker({ client: firstClient, store: f.store, clock: f.clock });
    await assert.rejects(
      firstBroker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "reconcile turn" }),
      /simulated crash after turn response/,
    );
    assert.equal(f.store.getWorkerMapping(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION").turn_id, null);

    const expectedClientMessageId = `${batch.submission_id}:${batch.tasks[0].task_id}:IMPLEMENTATION`;
    const retryClient = new FakeBrokerClient({
      threadRead: async (threadId) => ({
        thread: {
          id: threadId,
          turns: [{ id: "turn-1", clientUserMessageId: expectedClientMessageId, status: "inProgress" }],
        },
      }),
      turnStart: async () => { throw new Error("duplicate turn/start must not be sent"); },
    });
    const retryBroker = new ThreadBroker({ client: retryClient, store: f.store, clock: f.clock });
    const recovered = await retryBroker.startImplementation({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      prompt: "reconcile turn",
    });
    assert.equal(recovered.recovered, true);
    assert.equal(recovered.mapping.turn_id, "turn-1");
    assert.equal(retryClient.calls.filter((call) => call.method === "thread/read").length, 1);
    assert.equal(retryClient.calls.some((call) => call.method === "thread/start"), false);
    assert.equal(retryClient.calls.some((call) => call.method === "thread/resume"), false);
    assert.equal(retryClient.calls.some((call) => call.method === "turn/start"), false);
  } finally {
    f.cleanup();
  }
});

test("broker does not infer an unrelated single turn during recovery", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["do not infer"]);
    const firstClient = new FakeBrokerClient({
      turnStart: async () => { throw new Error("simulated unavailable turn"); },
    });
    const firstBroker = new ThreadBroker({ client: firstClient, store: f.store, clock: f.clock });
    await assert.rejects(firstBroker.startImplementation({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      prompt: "do not infer",
    }), /simulated unavailable turn/);

    const retryClient = new FakeBrokerClient({
      threadRead: async (threadId) => ({
        thread: {
          id: threadId,
          turns: [{ id: "unrelated-turn", clientUserMessageId: "different-submission" }],
        },
      }),
      threadResume: async () => { throw new Error("unrelated turn must fail closed before resume"); },
      turnStart: async () => { throw new Error("unrelated turn must not create a duplicate"); },
    });
    const retryBroker = new ThreadBroker({ client: retryClient, store: f.store, clock: f.clock });
    await assert.rejects(retryBroker.startImplementation({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      prompt: "do not infer",
    }), /without the persisted client_user_message_id/);
    assert.equal(retryClient.calls.some((call) => call.method === "thread\/start"), false);
    assert.equal(retryClient.calls.some((call) => call.method === "thread\/resume"), false);
    assert.equal(retryClient.calls.some((call) => call.method === "turn\/start"), false);
    assert.equal(f.store.getWorkerMapping(batch.batch_id, batch.tasks[0].task_id, "IMPLEMENTATION").turn_id, null);
  } finally {
    f.cleanup();
  }
});

test("review broker uses SOL and supplied difficulty effort with read-only policy", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["review this"]);
    const client = new FakeBrokerClient({ catalog: modelCatalog({ sol: ["high"] }) });
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    const result = await broker.startReview({
      batchId: batch.batch_id,
      taskId: batch.tasks[0].task_id,
      cwd: f.root,
      difficulty: "hard",
      prompt: "review this",
    });
    assert.equal(result.mapping.model, "gpt-5.6-sol");
    assert.equal(result.mapping.effort, "high");
    const start = client.calls.find((call) => call.method === "thread/start").params;
    assert.equal(start.sandbox, "read-only");
    const turn = client.calls.find((call) => call.method === "turn/start").params;
    assert.deepEqual(turn.sandboxPolicy, { type: "readOnly" });
  } finally {
    f.cleanup();
  }
});

test("broker read and resume recovery use only durable thread IDs", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["recover this"]);
    const client = new FakeBrokerClient();
    const broker = new ThreadBroker({ client, store: f.store, clock: f.clock });
    await broker.startImplementation({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "recover this" });
    await broker.readWorker({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, role: "IMPLEMENTATION" });
    await broker.resumeWorker({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, role: "IMPLEMENTATION" });
    assert.equal(client.calls.find((call) => call.method === "thread/read").threadId, "thread-1");
    assert.equal(client.calls.filter((call) => call.method === "thread/resume").at(-1).threadId, "thread-1");
    await assert.rejects(
      broker.resumeWorker({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, role: "IMPLEMENTATION", model: "gpt-5.6-terra" }),
      /override policy field/,
    );
    await assert.rejects(
      broker.resumeWorker({ batchId: batch.batch_id, taskId: batch.tasks[0].task_id, role: "IMPLEMENTATION", fork: true }),
      /override policy field/,
    );
  } finally {
    f.cleanup();
  }
});

class FakeTransport extends EventEmitter {
  constructor({ initializeError = null } = {}) {
    super();
    this.messages = [];
    this.listener = null;
    this.initialize_error = initializeError;
  }

  onMessage(listener) {
    this.listener = listener;
    return () => { this.listener = null; };
  }

  send(line) {
    const message = JSON.parse(line);
    this.messages.push(message);
    if (message.method === "initialize") {
      queueMicrotask(() => this.deliver(this.initialize_error
        ? { id: message.id, error: this.initialize_error }
        : { id: message.id, result: { userAgent: "fake", serverInfo: { name: "fake" } } }));
    }
  }

  deliver(message) {
    if (this.listener) this.listener(message);
  }
}

test("App Server JSONL client performs one handshake, correlates responses, streams notifications, and rejects on exit", async () => {
  const transport = new FakeTransport();
  const notifications = [];
  const client = new AppServerClient({ transport, onNotification: (notification) => notifications.push(notification) });
  const brokerClient = createThreadBrokerClient(client);
  await client.connect();
  await client.connect();
  assert.equal(transport.messages.filter((message) => message.method === "initialize").length, 1);
  assert.equal(transport.messages.filter((message) => message.method === "initialized").length, 1);
  const first = client.modelList({ includeHidden: true });
  const second = brokerClient.threadRead("thread-1");
  const requests = transport.messages.filter((message) => message.method === "model/list" || message.method === "thread/read");
  transport.deliver({ id: requests[1].id, result: { thread: { id: "thread-1" } } });
  transport.deliver({ id: requests[0].id, result: { data: [] } });
  assert.deepEqual(await second, { thread: { id: "thread-1" } });
  assert.deepEqual(await first, { data: [] });
  transport.deliver({ method: "turn/completed", params: { threadId: "thread-1" } });
  assert.equal(notifications[0].method, "turn/completed");
  const pending = client.modelList();
  transport.emit("exit", { code: 1, signal: null });
  await assert.rejects(pending, /connection closed/);
  await client.close();
});

test("App Server client fails closed after rejected initialize and requires a fresh connection", async () => {
  const rejectedTransport = new FakeTransport({
    initializeError: { code: -32600, message: "rejected initialize" },
  });
  const rejectedClient = new AppServerClient({ transport: rejectedTransport });
  await assert.rejects(rejectedClient.connect(), /App Server request failed: rejected initialize/);
  assert.equal(rejectedClient.isInitialized, false);
  assert.equal(rejectedClient.connectionState, "FAILED");
  await assert.rejects(rejectedClient.connect(), /initialization failed/);
  assert.equal(rejectedTransport.messages.filter((message) => message.method === "initialize").length, 1);

  const replacementTransport = new FakeTransport();
  const replacementClient = new AppServerClient({ transport: replacementTransport });
  await replacementClient.connect();
  assert.equal(replacementTransport.messages.filter((message) => message.method === "initialize").length, 1);
  await replacementClient.close();
  await rejectedClient.close();
});

test("App Server client rejects exec, ephemeral/fork paths, secrets, and fallback", () => {
  let spawnCalls = 0;
  assert.throws(() => new AppServerClient({ command: "codex exec" }), /option is not permitted/);
  assert.throws(() => new AppServerClient({ args: ["app-server"] }), /option is not permitted/);
  assert.throws(() => new AppServerClient({ spawnProcess: () => { spawnCalls += 1; } }), /option is not permitted/);
  assert.throws(() => new AppServerClient({ child: { kill() {} } }), /option is not permitted/);
  assert.throws(() => new AppServerClient({ transport: { pid: 42, spawnfile: "codex", kill() {} } }), /Process handles/);
  const transport = new FakeTransport();
  const client = new AppServerClient({ transport });
  assert.throws(() => client.threadStart({}), /reserved for Thread Broker/);
  assert.throws(() => client.turnStart({}), /reserved for Thread Broker/);
  assert.throws(() => client.threadRead("thread-1"), /reserved for Thread Broker/);
  assert.throws(() => client.threadResume("thread-1"), /reserved for Thread Broker/);
  const brokerClient = createThreadBrokerClient(client);
  assert.throws(() => brokerClient.threadStart({ ephemeral: true }), /ephemeral/);
  assert.throws(() => brokerClient.threadStart({ fork: true }), /forbids fork/);
  assert.throws(() => brokerClient.threadStart({ allowProviderModelFallback: true }), /fallback/);
  assert.throws(() => client.request("exec", {}), /Raw App Server method is not permitted/);
  assert.throws(() => client.request("process", {}), /Raw App Server method is not permitted/);
  assert.throws(() => client.request("spawn", {}), /Raw App Server method is not permitted/);
  assert.throws(() => client.request("thread/fork", {}), /Raw App Server method is not permitted/);
  assert.throws(() => client.request("thread/start", {}), /Raw App Server method is not permitted/);
  assert.throws(() => client.request("turn/start", {}), /Raw App Server method is not permitted/);
  for (const method of ["turn/steer", "thread/archive", "review/start", "review/anything", "thread/unknown"]) {
    assert.throws(() => client.request(method, {}), /Raw App Server method is not permitted/);
  }
  assert.equal(spawnCalls, 0);
  assert.deepEqual(transport.messages, []);
  assert.throws(() => brokerClient.threadStart({ model: "gpt-5.6-terra" }), /Forbidden model/);
  assert.throws(() => brokerClient.threadStart({ sandbox: "workspaceWrite" }), /workspace-write or read-only/);
  assert.throws(() => brokerClient.threadResume("thread-1", { sandbox: "readOnly" }), /workspace-write or read-only/);
  const fakeSecret = `sk-proj-${"x".repeat(32)}`;
  assert.throws(() => brokerClient.turnStart({
    threadId: "thread-1",
    sandboxPolicy: { type: "workspaceWrite" },
    input: [{ type: "text", text: fakeSecret }],
  }), /Possible secret/);
});

test("CLI exposes only submit/status/serve and remains idle without explicit submissions", async () => {
  const f = fixture();
  try {
    const originalWrite = process.stdout.write;
    const lines = [];
    process.stdout.write = (value) => { lines.push(String(value)); return true; };
    try {
      await runCli(["status", "--repo", f.root], { store: f.store });
      const status = JSON.parse(lines.at(-1));
      assert.deepEqual(status, {
        schema_version: 1,
        revision: 0,
        next_queue_sequence: 1,
        active_batch_id: null,
        batches: [],
        reservations: [],
        workers: [],
      });
      const idle = await runServe({ store: f.store });
      assert.deepEqual(idle, { status: "IDLE", active_batch_id: null, queued_batches: 0 });
      assert.match((await import("../cli.mjs")).usage(), /submit/);
      assert.match((await import("../cli.mjs")).usage(), /status/);
      assert.match((await import("../cli.mjs")).usage(), /serve/);
      assert.doesNotMatch((await import("../cli.mjs")).usage(), /activation/i);
    } finally {
      process.stdout.write = originalWrite;
    }
  } finally {
    f.cleanup();
  }
});
