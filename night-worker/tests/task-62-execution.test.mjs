import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { AgentRunner, dispatchImplementation, plansOverlap, runReadyPlans } from "../agent-runner.mjs";
import { NightWorkerExecutor } from "../executor.mjs";
import { NightWorkerService } from "../service.mjs";
import { planBatch } from "../planner.mjs";
import { ThreadBroker } from "../thread-broker.mjs";
import { prepareTaskWorktrees } from "../worktrees.mjs";
import {
  assertPublishable,
  commandTokens,
  deriveAuthoritativeGitScope,
  resolveMergeBase,
  runValidationCommands,
  validateTaskPlanExecution,
} from "../validation.mjs";
import {
  createAppServerClient,
  createFixture,
  makeValidPlan,
  createPersistentSOLPlannerFixture,
  rawPlans,
  requestsFor,
} from "./task-62-fixtures.mjs";

async function plannedAndPrepared(f, taskCount = f.batch.tasks.length) {
  assert.equal(taskCount, f.batch.tasks.length);
  const lifecycle = await createPersistentSOLPlannerFixture({
    store: f.store,
    planningOutput: rawPlans(f.batch),
  });
  let planning;
  try {
    planning = await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
      solPlanner: lifecycle.planner,
    });
  } finally {
    await lifecycle.client.close();
  }
  const prepared = prepareTaskWorktrees({
    repositoryRoot: f.root,
    plans: planning.plans,
  });
  return { planning, prepared, plans: prepared.map((entry) => entry.plan) };
}

function completedMapping(batch, plan, number = 1) {
  return {
    schema_version: 1,
    batch_id: batch.batch_id,
    task_id: plan.task_id,
    role: "IMPLEMENTATION",
    model: "gpt-5.6-luna",
    effort: "max",
    cwd: plan.worktree,
    thread_id: `seed-thread-${number}`,
    turn_id: `seed-turn-${number}`,
    lifecycle_state: "COMPLETED",
    created_at: "2026-09-14T00:00:00.000Z",
    updated_at: "2026-09-14T00:00:01.000Z",
    submission_id: batch.submission_id,
    client_user_message_id: `${batch.submission_id}:${plan.task_id}:IMPLEMENTATION`,
  };
}

test("ready disjoint plans overlap, overlapping scopes serialize or reject, and conservative globs are safe", async () => {
  const plans = [
    makeValidPlan({ taskId: "task-a", position: 1, allowlist: ["src/a.js"] }),
    makeValidPlan({ taskId: "task-b", position: 2, allowlist: ["src/b.js"] }),
    makeValidPlan({ taskId: "task-c", position: 3, allowlist: ["src/c.js"] }),
  ];
  const intervals = [];
  let active = 0;
  let maxActive = 0;
  const result = await runReadyPlans(disjoint(plans), async (plan) => {
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

  const overlapping = disjoint([
    makeValidPlan({ taskId: "task-a", position: 1, allowlist: ["src/shared.js"] }),
    makeValidPlan({ taskId: "task-b", position: 2, allowlist: ["src/shared.js"] }),
  ]);
  assert.equal(plansOverlap(overlapping[0], overlapping[1]), true);
  assert.equal(plansOverlap(
    { allowlist: ["src/f*"] },
    { allowlist: ["src/foo"] },
  ), true);
  assert.equal(plansOverlap(
    { allowlist: ["src/Foo.js"] },
    { allowlist: ["src/foo.js"] },
  ), true);
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

function disjoint(plans) {
  return plans.map((plan) => ({
    ...plan,
    batch_id: "batch-execution",
    submission_id: "submission-execution",
  }));
}

test("only READY tasks execute and dependencies complete before dependents are scheduled", async () => {
  const planned = makeValidPlan({ state: "PLANNED" });
  await assert.rejects(runReadyPlans([planned], async () => ({})), /not ready|READY/);

  const plans = [
    makeValidPlan({ taskId: "task-a", position: 1 }),
    makeValidPlan({ taskId: "task-b", position: 2, dependencies: ["task-a"] }),
  ];
  const events = [];
  const result = await runReadyPlans(disjoint(plans), async (plan) => {
    events.push(`start-${plan.task_id}`);
    await new Promise((resolve) => setTimeout(resolve, 15));
    events.push(`end-${plan.task_id}`);
    return { task_id: plan.task_id };
  }, { maxParallel: 2 });
  assert.deepEqual(events, ["start-task-a", "end-task-a", "start-task-b", "end-task-b"]);
  assert.equal(result.every((entry) => entry.status === "COMPLETED"), true);

  const failedEvents = [];
  const failed = await runReadyPlans(disjoint(plans), async (plan) => {
    failedEvents.push(plan.task_id);
    if (plan.task_id === "task-a") return { status: "FAILED", error: "failed fixture" };
    return { status: "COMPLETED" };
  });
  assert.deepEqual(failedEvents, ["task-a"]);
  assert.equal(failed.find((entry) => entry.plan.task_id === "task-b").status, "FAILED");
});

test("implementation dispatch uses the real Task 61 lifecycle, exact cwd, exact LUNA/max policy, and waits for terminal completion", async () => {
  const f = createFixture(1, "task62-dispatch");
  let prepared = [];
  let client;
  let transport;
  try {
    ({ prepared } = await plannedAndPrepared(f, 1));
    const plan = prepared[0].plan;
    ({ client, transport } = await createAppServerClient());
    await assert.rejects(
      dispatchImplementation({
        store: f.store,
        batchId: f.batch.batch_id,
        plan: { ...plan, state: "PLANNED" },
        client,
      }),
      /not ready|READY/,
    );
    await assert.rejects(
      dispatchImplementation({
        store: f.store,
        batchId: f.batch.batch_id,
        plan: { ...plan, worktree: f.root },
        client,
      }),
      /isolated|canonical/,
    );
    const result = await dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan,
      client,
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.mapping.lifecycle_state, "COMPLETED");
    assert.equal(result.mapping.model, "gpt-5.6-luna");
    assert.equal(result.mapping.effort, "max");
    assert.equal(result.mapping.cwd, plan.worktree);
    assert.equal(f.store.getWorkerMapping(f.batch.batch_id, plan.task_id, "IMPLEMENTATION").lifecycle_state, "COMPLETED");

    const threadStart = requestsFor(transport, "thread/start")[0].params;
    assert.equal(threadStart.model, "gpt-5.6-luna");
    assert.equal(threadStart.config.model_reasoning_effort, "max");
    assert.equal(threadStart.cwd, plan.worktree);
    assert.equal(threadStart.sandbox, "workspace-write");
    assert.equal(threadStart.allowProviderModelFallback, false);
    const turnStart = requestsFor(transport, "turn/start")[0].params;
    assert.equal(turnStart.model, "gpt-5.6-luna");
    assert.equal(turnStart.effort, "max");
    assert.equal(turnStart.cwd, plan.worktree);
    assert.deepEqual(turnStart.sandboxPolicy, { type: "workspaceWrite" });
    assert.doesNotMatch(JSON.stringify(requestsFor(transport, "thread/start")), /gpt-5\.6-terra/i);
    assert.doesNotMatch(JSON.stringify(requestsFor(transport, "turn/start")), /gpt-5\.6-terra/i);
    assert.equal(requestsFor(transport, "thread/read").length, 1);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("turn-started mappings are not complete until durable thread/read reports terminal success", async () => {
  const f = createFixture(1, "task62-completion");
  let prepared = [];
  let client;
  let transport;
  try {
    ({ prepared } = await plannedAndPrepared(f, 1));
    ({ client, transport } = await createAppServerClient({ readStatuses: ["inProgress", "completed"] }));
    const result = await dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan: prepared[0].plan,
      client,
    });
    assert.equal(result.mapping.lifecycle_state, "COMPLETED");
    assert.equal(requestsFor(transport, "thread/read").length, 2);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("capacity is counted by the one canonical shared batch RuntimeStore across live implementation turns", async () => {
  const f = createFixture(3, "task62-capacity");
  let prepared = [];
  let client;
  let transport;
  try {
    ({ prepared } = await plannedAndPrepared(f, 3));
    ({ client, transport } = await createAppServerClient({ turnDelayMs: 100 }));
    const outcomes = await Promise.allSettled(prepared.map((entry) => dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan: entry.plan,
      client,
    })));
    assert.equal(outcomes.filter((entry) => entry.status === "fulfilled").length, 2);
    assert.equal(outcomes.filter((entry) => entry.status === "rejected").length, 1);
    assert.match(outcomes.find((entry) => entry.status === "rejected").reason.message, /parallel|limit|reserved/i);
    assert.equal(transport.max_active_turns, 2);
    assert.equal(f.store.listWorkerMappings(f.batch.batch_id)
      .filter((mapping) => mapping.role === "IMPLEMENTATION").length, 2);
    assert.equal(f.store.listWorkerReservations(f.batch.batch_id).length, 0);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("a durable bare mapping is normalized on retry without duplicate thread or turn starts", async () => {
  const f = createFixture(1, "task62-retry");
  let prepared = [];
  let client;
  let transport;
  try {
    ({ prepared } = await plannedAndPrepared(f, 1));
    const plan = prepared[0].plan;
    f.store.putWorkerMapping(completedMapping(f.batch, plan));
    ({ client, transport } = await createAppServerClient());
    const result = await dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan,
      client,
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.mapping.lifecycle_state, "COMPLETED");
    assert.equal(requestsFor(transport, "model/list").length, 0);
    assert.equal(requestsFor(transport, "thread/start").length, 0);
    assert.equal(requestsFor(transport, "turn/start").length, 0);
    assert.equal(requestsFor(transport, "thread/read").length, 0);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("public production dispatch rejects fake brokers, broker factories, fake clients, and prototype overrides", async () => {
  const f = createFixture(1, "task62-boundary");
  let prepared = [];
  let client;
  let planningLifecycle;
  try {
    ({ prepared } = await plannedAndPrepared(f, 1));
    const plan = prepared[0].plan;
    ({ client } = await createAppServerClient());
    planningLifecycle = await createPersistentSOLPlannerFixture({
      store: f.store,
      planningOutput: rawPlans(f.batch),
    });
    await assert.rejects(
      dispatchImplementation({ store: f.store, batchId: f.batch.batch_id, plan, client, broker: {} }),
      /caller override/,
    );
    await assert.rejects(
      dispatchImplementation({ store: f.store, batchId: f.batch.batch_id, plan, client, brokerFactory: () => ({}) }),
      /caller override/,
    );
    const fakeClient = {
      modelList() {}, threadStart() {}, turnStart() {}, threadRead() {}, threadResume() {},
    };
    assert.throws(() => new AgentRunner({ store: f.store, batchId: f.batch.batch_id, client: fakeClient }), /genuine constructed/);
    assert.throws(() => new NightWorkerExecutor({
      store: f.store,
      solPlanner: planningLifecycle.planner,
      client: fakeClient,
    }), /genuine constructed/);

    const startDescriptor = Object.getOwnPropertyDescriptor(ThreadBroker.prototype, "startImplementation");
    const readDescriptor = Object.getOwnPropertyDescriptor(ThreadBroker.prototype, "readWorker");
    ThreadBroker.prototype.startImplementation = () => { throw new Error("overridden broker path"); };
    ThreadBroker.prototype.readWorker = () => { throw new Error("overridden broker read path"); };
    try {
      const result = await dispatchImplementation({ store: f.store, batchId: f.batch.batch_id, plan, client });
      assert.equal(result.mapping.lifecycle_state, "COMPLETED");
    } finally {
      Object.defineProperty(ThreadBroker.prototype, "startImplementation", startDescriptor);
      Object.defineProperty(ThreadBroker.prototype, "readWorker", readDescriptor);
    }
  } finally {
    await planningLifecycle?.client.close();
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("authoritative Git scope ignores worker reports, rejects zero-path publication, and gates on fixed validation commands", async () => {
  const f = createFixture(1, "task62-validation");
  let prepared = [];
  let client;
  try {
    ({ prepared } = await plannedAndPrepared(f, 1));
    const plan = prepared[0].plan;
    const noChanges = await validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      reportedChangedFiles: ["src/not-really-reported.txt"],
    });
      assert.equal(noChanges.publishable, false);
    assert.deepEqual(noChanges.actual_paths, []);
    assert.throws(() => assertPublishable(noChanges), /not publishable/);

    ({ client } = await createAppServerClient({ writeChanges: true }));
    await dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan,
      client,
    });

    for (let index = 1; index <= 12; index += 1) {
      fs.writeFileSync(path.join(plan.worktree, "src", `task-${index}.txt`), `${index}\n`, "utf8");
    }
    const manyPlan = {
      ...plan,
      allowlist: [
        ...Array.from({ length: 12 }, (_, index) => `src/task-${index + 1}.txt`),
        "src/task-1.test.mjs",
        "src/task-1-check.mjs",
      ],
    };
    const passed = await validateTaskPlanExecution({
      plan: manyPlan,
      repositoryRoot: f.root,
      store: f.store,
      client,
      reportedChangedFiles: ["src/not-really-reported.txt"],
    });
    assert.equal(passed.publishable, true);
    assert.equal(passed.actual_paths.length, 14);
    assert.deepEqual(passed.reported_paths, ["src/not-really-reported.txt"]);
    assert.equal(passed.scope.reported_paths_are_advisory, true);
    assert.doesNotThrow(() => assertPublishable(passed));
    fs.writeFileSync(path.join(plan.worktree, "after-validation.txt"), "late change\n", "utf8");
    assert.throws(() => assertPublishable(passed), /scope|allowlist|publishable/i);
    fs.rmSync(path.join(plan.worktree, "after-validation.txt"));
    assert.equal(Object.isFrozen(passed), true);
    assert.throws(() => { passed.publishable = false; }, /read only|Cannot assign/i);
    assert.doesNotThrow(() => assertPublishable(passed));

    fs.writeFileSync(path.join(plan.worktree, "outside.txt"), "outside\n", "utf8");
    const outOfScope = await validateTaskPlanExecution({ plan: manyPlan, repositoryRoot: f.root, store: f.store, client });
    assert.equal(outOfScope.publishable, false);
    assert.match(outOfScope.error, /outside the task allowlist/);
    fs.rmSync(path.join(plan.worktree, "outside.txt"));

    const failedValidation = await validateTaskPlanExecution({
      plan: {
        ...manyPlan,
        allowlist: [...manyPlan.allowlist, "src/missing.test.mjs"],
        validation_commands: ["node --test src/missing.test.mjs", "node --check src/task-1-check.mjs"],
      },
      repositoryRoot: f.root,
      store: f.store,
      client,
    });
    assert.equal(failedValidation.scope_passed, true);
    assert.equal(failedValidation.validation_passed, false);
    assert.equal(failedValidation.publishable, false);
    assert.equal(failedValidation.validation.results.length, 0);
    assert.match(failedValidation.error, /authoritative changed path/);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("validation re-derives scope after every command and rechecks the canonical RuntimeStore before publication", async () => {
  const f = createFixture(1, "task62-validation-mutation");
  let prepared = [];
  let client;
  try {
    ({ prepared } = await plannedAndPrepared(f, 1));
    const plan = prepared[0].plan;
    ({ client } = await createAppServerClient({ writeChanges: true }));
    await dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan,
      client,
    });
    const mutationPath = path.join(plan.worktree, "src", "validation-mutation.test.mjs");
    const outsidePath = path.join(plan.worktree, "outside-validation.txt");
    fs.writeFileSync(mutationPath, [
      'import fs from "node:fs";',
      'import path from "node:path";',
      'import test from "node:test";',
      'test("create an out-of-scope file during validation", () => {',
      '  fs.writeFileSync(path.join(process.cwd(), "outside-validation.txt"), "outside\\n", "utf8");',
      '});',
    ].join("\n"), "utf8");
    const mutationPlan = {
      ...plan,
      allowlist: [...plan.allowlist, "src/validation-mutation.test.mjs"],
      validation_commands: [
        "node --test src/validation-mutation.test.mjs",
        "node --check src/task-1-check.mjs",
      ],
    };
    const outOfScope = await validateTaskPlanExecution({
      plan: mutationPlan,
      repositoryRoot: f.root,
      store: f.store,
      client,
    });
    assert.equal(outOfScope.publishable, false);
    assert.equal(outOfScope.validation.scope_history.length, 1);
    assert.ok(outOfScope.actual_paths.includes("outside-validation.txt"));
    assert.ok(outOfScope.validation.scope_history[0].paths.includes("outside-validation.txt"));
    assert.match(outOfScope.error, /outside the task allowlist/);
    assert.equal(fs.existsSync(outsidePath), true);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }

  const tamperFixture = createFixture(1, "task62-validation-store-tamper");
  let tamperPrepared = [];
  let tamperClient;
  try {
    ({ prepared: tamperPrepared } = await plannedAndPrepared(tamperFixture, 1));
    const plan = tamperPrepared[0].plan;
    ({ client: tamperClient } = await createAppServerClient({ writeChanges: true }));
    await dispatchImplementation({
      store: tamperFixture.store,
      batchId: tamperFixture.batch.batch_id,
      plan,
      client: tamperClient,
    });
    const tamperPath = path.join(plan.worktree, "src", "validation-store-tamper.test.mjs");
    fs.writeFileSync(tamperPath, [
      'import fs from "node:fs";',
      'import test from "node:test";',
      `test("tamper the canonical RuntimeStore", () => { fs.writeFileSync(${JSON.stringify(tamperFixture.store.filePath)}, "{\\"batches\\":[],\\"workers\\":[]}", "utf8"); });`,
    ].join("\n"), "utf8");
    const tamperPlan = {
      ...plan,
      allowlist: [...plan.allowlist, "src/validation-store-tamper.test.mjs"],
      validation_commands: [
        "node --test src/validation-store-tamper.test.mjs",
        "node --check src/task-1-check.mjs",
      ],
    };
    const tampered = await validateTaskPlanExecution({
      plan: tamperPlan,
      repositoryRoot: tamperFixture.root,
      store: tamperFixture.store,
      client: tamperClient,
    });
    assert.equal(tampered.publishable, false);
    assert.equal(tampered.passed, false);
    assert.match(tampered.error, /RuntimeStore|canonical|ENOENT|submitted batch|schema/i);
  } finally {
    await tamperClient?.close();
    tamperFixture.cleanup(tamperPrepared.map((entry) => entry.worktree.worktree));
  }
});

test("validation authority fixes the trusted base and rejects caller overrides or Git/ref injection", async () => {
  const f = createFixture(2, "task62-validation-authority");
  let prepared = [];
  let client;
  try {
    ({ prepared } = await plannedAndPrepared(f, 2));
    const plan = prepared[0].plan;
    for (const key of ["baseRef", "baseSha", "exec", "commandRunner", "mergeBase", "prepareWorktrees", "mapping", "publishable"]) {
      await assert.rejects(validateTaskPlanExecution({ plan, repositoryRoot: f.root, [key]: true }), /override/);
    }
    assert.throws(() => deriveAuthoritativeGitScope({ repositoryRoot: plan.worktree, baseRef: "HEAD" }), /override/);
    assert.throws(() => resolveMergeBase(plan.worktree, "HEAD"), /trusted|fixed/);
    assert.throws(() => resolveMergeBase(plan.worktree, "origin/main^{commit}"), /trusted|fixed/);
    assert.throws(() => commandTokens("git -C . reset --hard"), /mutating Git/);
    assert.throws(() => commandTokens("git checkout -- src/check.mjs"), /mutating Git/);
    assert.throws(() => commandTokens("git clean -fd"), /mutating Git/);
    assert.throws(() => commandTokens("git push origin main"), /mutating Git/);
    assert.throws(() => commandTokens("git fetch origin"), /mutating Git/);
    assert.throws(() => commandTokens("git merge origin/main"), /mutating Git/);
    assert.throws(() => commandTokens("git rebase origin/main"), /mutating Git/);
    assert.throws(() => commandTokens("git commit -m x"), /mutating Git/);
    assert.throws(() => commandTokens("git -c alias.check=!rm status"), /mutating Git/);
    assert.throws(() => commandTokens("./node --test src/task-1.test.mjs"), /bare executable/);
    assert.throws(() => commandTokens("tools/npm test"), /bare executable/);
    assert.throws(() => commandTokens('node --test "src/task-1.test.mjs; echo bypass"'), /shell control/);
    assert.throws(() => commandTokens("node --test src/task-1.test.mjs --help"), /help|options/i);
    assert.throws(() => commandTokens("rm -rf src"), /filesystem/);
    assert.throws(() => commandTokens("python -c print(1)"), /shell control|interpreter/);
    assert.throws(() => commandTokens("npm run arbitrary-script"), /arbitrary npm/);
    assert.throws(() => commandTokens("cmd /c git status"), /shell wrapper/);
    assert.throws(() => commandTokens("powershell -Command Get-ChildItem"), /shell wrapper/);
    assert.throws(() => commandTokens('node -e "process.exit"'), /caller-supplied scripts/);
    assert.throws(() => commandTokens("codex exec --help"), /codex exec|help/i);
    assert.throws(() => commandTokens("node --test src/smoke.test.mjs && node --check src/check.mjs"), /shell control/);
    assert.throws(() => runValidationCommands(["true", "echo done"], { cwd: plan.worktree }), /fixed validation gates/);
    assert.throws(() => runValidationCommands(['echo "node --test"', 'echo "node --check"'], { cwd: plan.worktree }), /fixed validation gates/);
    assert.throws(() => runValidationCommands(["node --test", "node --check src/task-1-check.mjs"], {
      cwd: plan.worktree,
      allowlist: plan.allowlist,
    }), /explicit module path|test module|gates/);
    assert.throws(() => runValidationCommands(["node --help", "node --check src/task-1-check.mjs"], {
      cwd: plan.worktree,
      allowlist: plan.allowlist,
    }), /help|approved fixed|gates/i);
    assert.throws(() => runValidationCommands(["node --test src/smoke.test.mjs", "node --check package.json"], {
      cwd: plan.worktree,
      allowlist: plan.allowlist,
    }), /allowlist|JavaScript module/);
    assert.throws(() => runValidationCommands(["node --test src/task-1.test.mjs", "node --check src/unrelated.mjs"], {
      cwd: plan.worktree,
      allowlist: [...plan.allowlist, "src/unrelated.mjs"],
      actualPaths: ["src/task-1.test.mjs", "src/task-1-check.mjs"],
    }), /authoritative changed path/);
    assert.throws(() => runValidationCommands(["npm --prefix . test", "node --check src/task-1-check.mjs"], {
      cwd: plan.worktree,
      allowlist: plan.allowlist,
    }), /approved fixed|gates/);
    assert.throws(() => runValidationCommands(["node src/task-1-check.mjs", "node --check src/task-1-check.mjs"], {
      cwd: plan.worktree,
      allowlist: plan.allowlist,
    }), /approved fixed|gates/);
    ({ client } = await createAppServerClient({ writeChanges: true }));
    const originalLoad = f.store.load;
    f.store.load = () => ({ batches: [], workers: [] });
    const forgedLoadEvidence = await validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      store: f.store,
      client,
    });
    assert.equal(forgedLoadEvidence.publishable, false);
    assert.match(forgedLoadEvidence.error, /unmodified canonical|canonical real RuntimeStore/i);
    assert.throws(() => assertPublishable(forgedLoadEvidence), /not publishable/);
    delete f.store.load;
    assert.equal(f.store.load, originalLoad);
    const originalPrototype = Object.getPrototypeOf(f.store);
    const forgedPrototype = Object.create(originalPrototype);
    forgedPrototype.load = () => ({ batches: [], workers: [] });
    Object.setPrototypeOf(f.store, forgedPrototype);
    try {
      const forgedPrototypeEvidence = await validateTaskPlanExecution({
        plan,
        repositoryRoot: f.root,
        store: f.store,
        client,
      });
      assert.equal(forgedPrototypeEvidence.publishable, false);
      assert.match(forgedPrototypeEvidence.error, /unmodified canonical|canonical real RuntimeStore/i);
    } finally {
      Object.setPrototypeOf(f.store, originalPrototype);
    }
    const originalGetBatch = f.store.getBatch;
    f.store.getBatch = () => ({ batch_id: f.batch.batch_id, submission_id: f.batch.submission_id });
    const forgedBatchEvidence = await validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      store: f.store,
      client,
    });
    assert.equal(forgedBatchEvidence.publishable, false);
    assert.match(forgedBatchEvidence.error, /unmodified canonical|canonical real RuntimeStore/i);
    delete f.store.getBatch;
    assert.equal(f.store.getBatch, originalGetBatch);
    await dispatchImplementation({
      store: f.store,
      batchId: f.batch.batch_id,
      plan: prepared[1].plan,
      client,
    });
    fs.writeFileSync(path.join(plan.worktree, "src", "task-1.txt"), "forged mapping\n", "utf8");
    const sourceMapping = f.store.getWorkerMapping(f.batch.batch_id, prepared[1].plan.task_id, "IMPLEMENTATION");
    f.store.putWorkerMapping({
      ...sourceMapping,
      task_id: plan.task_id,
      cwd: plan.worktree,
      client_user_message_id: `${f.batch.submission_id}:${plan.task_id}:IMPLEMENTATION`,
    });
    const forgedMappingEvidence = await validateTaskPlanExecution({
      plan,
      repositoryRoot: f.root,
      store: f.store,
      client,
    });
    assert.equal(forgedMappingEvidence.publishable, false);
    assert.match(forgedMappingEvidence.error, /client message identity|durable/i);
    assert.throws(() => assertPublishable({
      publishable: true,
      passed: true,
      scope_passed: true,
      validation_passed: true,
      actual_paths: ["src/task-1.txt"],
      durable_worker: { source: "canonical-runtime-store+typed-thread-read", turn_status: "SUCCEEDED" },
    }), /not publishable|durable/);
  } finally {
    await client?.close();
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("idle service performs no planning or execution without an explicit submitted batch", async () => {
  const f = createFixture(0, "task62-idle");
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
    assert.throws(() => new NightWorkerExecutor({
      store: f.store,
      planProvider: () => { throw new Error("planner must not run"); },
    }), /caller override/);
  } finally {
    f.cleanup();
  }
});

test("executor runs disjoint plans through the real broker, validates them, and never publishes", async () => {
  const f = createFixture(2, "task62-executor");
  let client;
  let transport;
  let planningLifecycle;
  try {
    ({ client, transport } = await createAppServerClient({ turnDelayMs: 60, writeChanges: true }));
    planningLifecycle = await createPersistentSOLPlannerFixture({
      store: f.store,
      planningOutput: rawPlans(f.batch),
    });
    const executor = new NightWorkerExecutor({
      store: f.store,
      solPlanner: planningLifecycle.planner,
      client,
      maxParallel: 2,
    });
    const result = await executor.executeBatch(f.batch.batch_id);
    assert.equal(result.status, "PUBLISHABLE");
    assert.equal(result.publishable, true);
    assert.equal(result.publishing_performed, false);
    assert.equal(result.workers.length, 2);
    assert.equal(result.workers.every((entry) => entry.status === "COMPLETED"), true);
    assert.equal(result.validations.every((entry) => entry.publishable), true);
    assert.equal(transport.max_active_turns, 2);
    assert.equal(transport.turn_intervals.some((left) => transport.turn_intervals.some((right) => left !== right
      && left.start < right.end && right.start < left.end)), true);
    assert.equal(f.store.listWorkerMappings(f.batch.batch_id)
      .filter((mapping) => mapping.role === "IMPLEMENTATION").length, 2);
    assert.equal(result.publishing_performed, false);
  } finally {
    await planningLifecycle?.client.close();
    await client?.close();
    const workers = fs.existsSync(f.worktreeRoot) ? fs.readdirSync(f.worktreeRoot).map((entry) => path.join(f.worktreeRoot, entry)) : [];
    f.cleanup(workers);
  }
});

test("executor option surface cannot replace planning, worktree, validation, or broker authority", () => {
  const f = createFixture(1, "task62-executor-authority");
  try {
    const { client } = {
      client: null,
    };
    for (const key of ["broker", "brokerFactory", "baseRef", "baseSha", "exec", "commandRunner", "prepareWorktrees", "plans", "planner"]) {
      assert.throws(() => new NightWorkerExecutor({ store: f.store, client, [key]: true }), /cannot accept|genuine constructed/);
    }
  } finally {
    f.cleanup();
  }
});
