import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { EventEmitter } from "node:events";
import { MVP_CONFIG } from "../config.mjs";
import { AppServerClient } from "../app-server-client.mjs";
import { FifoQueue } from "../queue.mjs";
import { RuntimeStore } from "../runtime-store.mjs";
import { NightWorkerService } from "../service.mjs";
import { createBatch, submitBatch } from "../submission.mjs";
import { ThreadBroker } from "../thread-broker.mjs";
import { runCli, runServe } from "../cli.mjs";

const EPOCH = Date.parse("2026-09-11T00:00:00.000Z");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-"));
  const store = new RuntimeStore(path.join(root, "runtime", "state.json"));
  let now = EPOCH;
  const clock = { now: () => now };
  let id = 0;
  const idFactory = (prefix) => `${prefix}-${++id}`;
  function submit(tasks = ["first task"]) {
    return submitBatch({ repositoryRoot: root, tasks }, {
      store,
      clock,
      idFactory,
    });
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
  constructor({ catalog = modelCatalog(), turnStart } = {}) {
    this.catalog = catalog;
    this.turnStartImplementation = turnStart;
    this.calls = [];
    this.threadNumber = 0;
    this.turnNumber = 0;
  }

  async modelList(params) {
    this.calls.push({ method: "model/list", params });
    return this.catalog;
  }

  async threadStart(params) {
    this.calls.push({ method: "thread/start", params });
    this.threadNumber += 1;
    return { thread: { id: `thread-${this.threadNumber}` } };
  }

  async threadResume(threadId, params) {
    this.calls.push({ method: "thread/resume", threadId, params });
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
    assert.equal(fs.existsSync(`${f.store.filePath}.lock`), false);
  } finally {
    f.cleanup();
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
    for (const [input, pattern] of cases) assert.throws(() => submitBatch(input, { store: f.store }), pattern);
    assert.equal(f.store.load().batches.length, 0);
  } finally {
    f.cleanup();
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

test("broker ordering durably persists thread before first turn and turn immediately after response", async () => {
  const f = fixture();
  try {
    const batch = f.submit(["implement this"]);
    const client = new FakeBrokerClient();
    const order = [];
    const originalPut = f.store.putWorkerMapping.bind(f.store);
    const originalPatch = f.store.patchWorkerMapping.bind(f.store);
    f.store.putWorkerMapping = (mapping) => { order.push("durable-thread"); return originalPut(mapping); };
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
    const firstClient = new FakeBrokerClient({ turnStart: async () => { throw new Error("simulated crash before response"); } });
    const firstBroker = new ThreadBroker({ client: firstClient, store: f.store, clock: f.clock });
    await assert.rejects(firstBroker.startImplementation({
      batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "retry this",
    }), /simulated crash/);
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
    });
    const retryClient = new FakeBrokerClient();
    const retryBroker = new ThreadBroker({ client: retryClient, store: f.store, clock: f.clock });
    const result = await retryBroker.startImplementation({
      batchId: batch.batch_id, taskId: batch.tasks[0].task_id, cwd: f.root, prompt: "retry this",
    });
    assert.equal(result.mapping.thread_id, "thread-1");
    assert.equal(retryClient.calls.some((call) => call.method === "thread/start"), false);
    assert.equal(retryClient.calls.find((call) => call.method === "thread/resume").threadId, "thread-1");
    assert.equal(result.mapping.turn_id, "turn-1");
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
  constructor() {
    super();
    this.messages = [];
    this.listener = null;
  }

  onMessage(listener) {
    this.listener = listener;
    return () => { this.listener = null; };
  }

  send(line) {
    const message = JSON.parse(line);
    this.messages.push(message);
    if (message.method === "initialize") {
      queueMicrotask(() => this.deliver({ id: message.id, result: { userAgent: "fake", serverInfo: { name: "fake" } } }));
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
  await client.connect();
  await client.connect();
  assert.equal(transport.messages.filter((message) => message.method === "initialize").length, 1);
  assert.equal(transport.messages.filter((message) => message.method === "initialized").length, 1);
  const first = client.modelList({ includeHidden: true });
  const second = client.threadRead("thread-1");
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

test("App Server client rejects exec, ephemeral/fork paths, secrets, and fallback", () => {
  assert.throws(() => new AppServerClient({ command: "codex exec" }), /app-server command/);
  const transport = new FakeTransport();
  const client = new AppServerClient({ transport });
  assert.throws(() => client.threadStart({ ephemeral: true }), /ephemeral/);
  assert.throws(() => client.threadStart({ fork: true }), /forbids fork/);
  assert.throws(() => client.threadStart({ allowProviderModelFallback: true }), /fallback/);
  assert.throws(() => client.request("exec", {}), /exec.*worker mechanism/);
  assert.throws(() => client.threadStart({ model: "gpt-5.6-terra" }), /Forbidden model/);
  const fakeSecret = `sk-proj-${"x".repeat(32)}`;
  assert.throws(() => client.request("turn/start", { input: [{ type: "text", text: fakeSecret }] }), /Possible secret/);
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
