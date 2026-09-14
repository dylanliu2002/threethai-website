import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { MVP_CONFIG } from "../config.mjs";
import { AgentRunner, dispatchImplementation, plansOverlap, runReadyPlans } from "../agent-runner.mjs";
import { NightWorkerExecutor } from "../executor.mjs";
import { NightWorkerService } from "../service.mjs";
import { createBatch } from "../submission.mjs";
import { RuntimeStore } from "../runtime-store.mjs";
import { planBatch } from "../planner.mjs";
import { prepareTaskWorktrees } from "../worktrees.mjs";
import { validateTaskPlanExecution, runValidationCommands } from "../validation.mjs";

const EPOCH = Date.parse("2026-09-14T04:00:00.000Z");

function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function fixture(taskCount = 2) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-task62-exec-"));
  const worktreeRoot = `${root}-workers`;
  execFileSync("git", ["init", "--quiet", root], { stdio: "ignore", windowsHide: true });
  git(root, ["config", "user.name", "dylanliu2002"]);
  git(root, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "base.txt"), "base\n", "utf8");
  git(root, ["add", "--all"]);
  git(root, ["commit", "--quiet", "-m", "fixture"]);
  const store = new RuntimeStore(path.join(root, ".night-worker", "runtime.json"));
  let id = 0;
  const clock = { now: () => EPOCH };
  const batch = taskCount === 0 ? null : store.enqueueBatch(createBatch({
    repositoryRoot: root,
    tasks: Array.from({ length: taskCount }, (_, index) => `bounded implementation ${index + 1}`),
  }, {
    clock,
    idFactory: (prefix) => `${prefix}-${++id}`,
  }));
  return {
    root,
    worktreeRoot,
    store,
    batch,
    cleanup(worktrees = []) {
      for (const worktree of worktrees) {
        try { git(root, ["worktree", "remove", "--force", worktree]); } catch {}
      }
      fs.rmSync(worktreeRoot, { recursive: true, force: true });
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function rawPlans(batch, { shared = false } = {}) {
  return batch.tasks.map((task, index) => ({
    task_id: task.task_id,
    title: `Execution ${index + 1}`,
    allowlist: [shared ? "src/shared/**" : `src/task-${index + 1}.txt`],
    acceptance_criteria: [`criterion ${index + 1}`],
    validation_commands: ["node -e \"process.exit(0)\""],
  }));
}

function dummyPlan(taskId, position, allowlist) {
  return {
    schema_version: 1,
    batch_id: "batch-execution",
    submission_id: "submission-execution",
    task_id: taskId,
    position,
    description: `task ${position}`,
    branch: `codex/${String(position).padStart(2, "0")}-task-${position}`,
    worktree: path.join(os.tmpdir(), `task62-dummy-${position}`),
    allowlist,
    acceptance_criteria: ["done"],
    validation_commands: ["node -e \"process.exit(0)\""],
    difficulty: "medium",
    dependencies: [],
    base_ref: "HEAD",
    state: "READY",
  };
}

function mappingFor(batch, plan, number) {
  return {
    schema_version: 1,
    batch_id: batch.batch_id,
    task_id: plan.task_id,
    role: "IMPLEMENTATION",
    model: "gpt-5.6-luna",
    effort: "max",
    cwd: plan.worktree,
    thread_id: `thread-task62-${number}`,
    turn_id: `turn-task62-${number}`,
    lifecycle_state: "TURN_STARTED",
    created_at: "2026-09-14T04:00:00.000Z",
    updated_at: "2026-09-14T04:00:01.000Z",
    submission_id: batch.submission_id,
    client_user_message_id: `${batch.submission_id}:${plan.task_id}:IMPLEMENTATION`,
  };
}

class FakeTypedImplementationBroker {
  constructor({ delayMs = 0, reportedChangedFiles = [], submissionId = "submission-execution" } = {}) {
    this.delay_ms = delayMs;
    this.reported_changed_files = reportedChangedFiles;
    this.submission_id = submissionId;
    this.calls = [];
    this.active = 0;
    this.max_active = 0;
    this.sequence = 0;
  }

  async startImplementation(options) {
    this.calls.push(options);
    this.active += 1;
    this.max_active = Math.max(this.max_active, this.active);
    await new Promise((resolve) => setTimeout(resolve, this.delay_ms));
    this.active -= 1;
    const number = ++this.sequence;
    const batch = { batch_id: options.batchId, submission_id: this.submission_id };
    const plan = { task_id: options.taskId, worktree: options.cwd };
    return {
      mapping: mappingFor(batch, plan, number),
      changed_files: this.reported_changed_files,
    };
  }
}

class FakeTask61Client {
  constructor(submissionId) {
    this.submission_id = submissionId;
    this.calls = [];
    this.thread_number = 0;
    this.turn_number = 0;
  }

  async modelList(params) {
    this.calls.push({ method: "model/list", params });
    return {
      data: [
        { id: "gpt-5.6-luna", model: "gpt-5.6-luna", supportedReasoningEfforts: ["max"] },
        { id: "gpt-5.6-sol", model: "gpt-5.6-sol", supportedReasoningEfforts: ["medium"] },
      ],
      nextCursor: null,
    };
  }

  async threadStart(params) {
    this.calls.push({ method: "thread/start", params });
    this.thread_number += 1;
    return { thread: { id: `real-thread-${this.thread_number}` } };
  }

  async threadResume(threadId, params) {
    this.calls.push({ method: "thread/resume", threadId, params });
    return { thread: { id: threadId } };
  }

  async threadRead(threadId, params) {
    this.calls.push({ method: "thread/read", threadId, params });
    return { thread: { id: threadId, turns: [] } };
  }

  async turnStart(params) {
    this.calls.push({ method: "turn/start", params });
    this.turn_number += 1;
    return { turn: { id: `real-turn-${this.turn_number}` } };
  }
}

test("ready disjoint plans overlap, while overlapping plans serialize or reject", async () => {
  const disjoint = [dummyPlan("task-a", 1, ["src/a.js"]), dummyPlan("task-b", 2, ["src/b.js"]), dummyPlan("task-c", 3, ["src/c.js"])]
    .map((plan) => ({ ...plan, batch_id: "batch-execution", submission_id: "submission-execution" }));
  const intervals = [];
  let active = 0;
  let maxActive = 0;
  const result = await runReadyPlans(disjoint, async (plan) => {
    const start = Date.now();
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 40));
    active -= 1;
    intervals.push({ taskId: plan.task_id, start, end: Date.now() });
    return { task_id: plan.task_id };
  }, { maxParallel: 2 });
  assert.equal(result.every((entry) => entry.status === "COMPLETED"), true);
  assert.equal(maxActive, 2);
  assert.equal(intervals.some((left) => intervals.some((right) => left.taskId !== right.taskId
    && left.start < right.end && right.start < left.end)), true);

  const overlapping = [dummyPlan("task-a", 1, ["src/shared.js"]), dummyPlan("task-b", 2, ["src/shared.js"])]
    .map((plan) => ({ ...plan, batch_id: "batch-execution", submission_id: "submission-execution" }));
  assert.equal(plansOverlap(overlapping[0], overlapping[1]), true);
  let concurrent = 0;
  let serializedMax = 0;
  const order = [];
  await runReadyPlans(overlapping, async (plan) => {
    concurrent += 1;
    serializedMax = Math.max(serializedMax, concurrent);
    order.push(`start-${plan.task_id}`);
    await new Promise((resolve) => setTimeout(resolve, 15));
    order.push(`end-${plan.task_id}`);
    concurrent -= 1;
    return { task_id: plan.task_id };
  });
  assert.equal(serializedMax, 1);
  assert.equal(order[1].startsWith("end-"), true);
  await assert.rejects(runReadyPlans(overlapping, async () => ({}), { overlapPolicy: "reject" }), /overlap/);
});

test("implementation runner dispatches only the typed lifecycle with exact cwd and durable mapping", async () => {
  const f = fixture(1);
  let prepared = [];
  try {
    const plans = (await planBatch({
      store: f.store,
      batch: f.batch,
      plans: rawPlans(f.batch),
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
    })).plans;
    prepared = prepareTaskWorktrees({ repositoryRoot: f.root, plans, baseRef: "HEAD", worktreeRoot: f.worktreeRoot });
    const plan = { ...prepared[0].plan, worktree: prepared[0].worktree.worktree, branch: prepared[0].worktree.branch };
    const broker = new FakeTypedImplementationBroker({ submissionId: f.batch.submission_id });
    const forbiddenClient = {
      threadStart() { throw new Error("thread/start must not be called directly"); },
      turnStart() { throw new Error("turn/start must not be called directly"); },
    };
    const result = await dispatchImplementation({
      store: f.store,
      batch: f.batch,
      plan,
      broker,
      client: forbiddenClient,
    });
    assert.equal(result.status, "DISPATCHED");
    assert.equal(broker.calls.length, 1);
    assert.deepEqual(Object.keys(broker.calls[0]).sort(), ["batchId", "cwd", "prompt", "taskId"]);
    assert.equal(broker.calls[0].cwd, plan.worktree);
    assert.match(broker.calls[0].prompt, /publishing credentials.*unavailable/i);
    assert.doesNotMatch(broker.calls[0].prompt, /gpt-5\.6-terra/i);
    assert.equal(f.store.getWorkerMapping(f.batch.batch_id, f.batch.tasks[0].task_id, "IMPLEMENTATION").thread_id, "thread-task62-1");
    assert.equal(result.mapping.cwd, plan.worktree);
    await assert.rejects(
      dispatchImplementation({ store: f.store, batch: f.batch, plan, broker: { startReview() {} } }),
      /typed ThreadBroker startImplementation/,
    );
  } finally {
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("default runner constructs the real Task 61 ThreadBroker for each exact task worktree", async () => {
  const f = fixture(1);
  let prepared = [];
  try {
    const plans = (await planBatch({
      store: f.store,
      batch: f.batch,
      plans: rawPlans(f.batch),
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
    })).plans;
    prepared = prepareTaskWorktrees({ repositoryRoot: f.root, plans, baseRef: "HEAD", worktreeRoot: f.worktreeRoot });
    const plan = { ...prepared[0].plan, worktree: prepared[0].worktree.worktree, branch: prepared[0].worktree.branch };
    const client = new FakeTask61Client(f.batch.submission_id);
    const result = await dispatchImplementation({ store: f.store, batch: f.batch, plan, client });
    assert.equal(result.mapping.model, "gpt-5.6-luna");
    assert.equal(result.mapping.effort, "max");
    assert.equal(result.mapping.cwd, plan.worktree);
    assert.deepEqual(client.calls.map((call) => call.method), ["model/list", "thread/start", "turn/start"]);
    const threadStart = client.calls[1].params;
    assert.equal(threadStart.model, "gpt-5.6-luna");
    assert.equal(threadStart.config.model_reasoning_effort, "max");
    assert.equal(threadStart.cwd, plan.worktree);
    assert.equal(threadStart.sandbox, "workspace-write");
    assert.equal(threadStart.allowProviderModelFallback, false);
    const turnStart = client.calls[2].params;
    assert.equal(turnStart.model, "gpt-5.6-luna");
    assert.equal(turnStart.effort, "max");
    assert.equal(turnStart.cwd, plan.worktree);
    assert.deepEqual(turnStart.sandboxPolicy, { type: "workspaceWrite" });
  } finally {
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("authoritative Git scope ignores worker reports and gates publishability on required validation", async () => {
  const f = fixture(1);
  let prepared = [];
  try {
    const plans = (await planBatch({
      store: f.store,
      batch: f.batch,
      plans: rawPlans(f.batch),
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
    })).plans;
    prepared = prepareTaskWorktrees({ repositoryRoot: f.root, plans, baseRef: "HEAD", worktreeRoot: f.worktreeRoot });
    const plan = { ...prepared[0].plan, worktree: prepared[0].worktree.worktree, branch: prepared[0].worktree.branch };
    fs.writeFileSync(path.join(plan.worktree, "src", "task-1.txt"), "allowed\n", "utf8");
    const passed = validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      baseRef: "HEAD",
      reportedChangedFiles: ["src/not-really-reported.txt"],
      commandRunner: () => ({ code: 0, stdout: "pass" }),
    });
    assert.equal(passed.publishable, true);
    assert.deepEqual(passed.scope.paths, ["src/task-1.txt"]);
    assert.deepEqual(passed.reported_paths, ["src/not-really-reported.txt"]);

    fs.writeFileSync(path.join(plan.worktree, "src", "outside.txt"), "outside\n", "utf8");
    const outOfScope = validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      baseRef: "HEAD",
      reportedChangedFiles: [],
      commandRunner: () => ({ code: 0 }),
    });
    assert.equal(outOfScope.publishable, false);
    assert.deepEqual(outOfScope.scope.paths, ["src/outside.txt", "src/task-1.txt"]);
    assert.match(outOfScope.error, /outside the task allowlist/);
    fs.rmSync(path.join(plan.worktree, "src", "outside.txt"));

    const failedValidation = validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      baseRef: "HEAD",
      commandRunner: () => ({ code: 1, stderr: "required test failed" }),
    });
    assert.equal(failedValidation.scope_passed, true);
    assert.equal(failedValidation.validation_passed, false);
    assert.equal(failedValidation.publishable, false);
    assert.equal(failedValidation.validation.results.length, 1);
  } finally {
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("validation commands cannot publish or use shell control and stop on the first failure", () => {
  assert.throws(() => runValidationCommands(["git push origin main"], { cwd: process.cwd() }), /publish/);
  assert.throws(() => runValidationCommands(["codex exec --help"], { cwd: process.cwd() }), /forbidden worker mechanism/);
  assert.throws(() => runValidationCommands(["node -e \"x\" && node -e \"y\""], { cwd: process.cwd() }), /shell control/);
  const calls = [];
  const result = runValidationCommands(["first", "second"], {
    cwd: process.cwd(),
    commandRunner: (command) => {
      calls.push(command);
      return { code: calls.length === 1 ? 1 : 0, stderr: "fail" };
    },
  });
  assert.equal(result.passed, false);
  assert.deepEqual(calls, ["first"]);
});

test("executor runs disjoint plans through the broker, validates them, and never publishes", async () => {
  const f = fixture(2);
  let prepared = [];
  try {
    const broker = new FakeTypedImplementationBroker({
      delayMs: 35,
      reportedChangedFiles: ["worker-report-is-advisory"],
      submissionId: f.batch.submission_id,
    });
    const executor = new NightWorkerExecutor({
      store: f.store,
      planProvider: () => rawPlans(f.batch),
      broker,
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
      commandRunner: () => ({ code: 0, stdout: "required validation passed" }),
    });
    const result = await executor.executeBatch(f.batch);
    prepared = result.plans.map((plan) => plan.worktree);
    assert.equal(result.status, "PUBLISHABLE");
    assert.equal(result.publishable, true);
    assert.equal(result.publishing_performed, false);
    assert.equal(result.workers.length, 2);
    assert.equal(result.validations.every((entry) => entry.publishable), true);
    assert.equal(broker.max_active, 2);
    assert.equal(broker.calls.every((call) => !Object.prototype.hasOwnProperty.call(call, "model")), true);
    assert.equal(f.store.listWorkerMappings(f.batch.batch_id).length, 2);
  } finally {
    f.cleanup(prepared);
  }
});

test("idle service performs no planning or execution without an explicit submitted batch", async () => {
  const f = fixture(0);
  try {
    let calls = 0;
    const service = new NightWorkerService({
      store: f.store,
      handler: async () => { calls += 1; },
    });
    const result = await service.serve({ once: true });
    assert.equal(result.status, "IDLE");
    assert.equal(calls, 0);
    assert.equal(f.store.load().batches.length, 0);
    const executor = new NightWorkerExecutor({
      store: f.store,
      planProvider: () => { throw new Error("planner must not run"); },
    });
    await assert.rejects(executor.executeBatch({ batch_id: "missing", submission_id: "missing" }), /durable batch|explicit submitted/);
  } finally {
    f.cleanup();
  }
});

test("agent runner refuses non-exact implementation policy and preserves the configured parallel ceiling", () => {
  assert.equal(MVP_CONFIG.max_parallel_implementation_workers, 2);
  assert.throws(() => new AgentRunner({ store: {}, batch: {} }), /RuntimeStore/);
});
