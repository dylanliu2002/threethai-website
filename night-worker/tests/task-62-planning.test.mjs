import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  IMPLEMENTATION_MODEL_NAME,
  IMPLEMENTATION_REASONING_EFFORT,
  REVIEW_MODEL_NAME,
} from "../config.mjs";
import {
  assertImplementationPolicy,
  assertNoWorkerAuthority,
  assertPlanningPolicy,
  IMPLEMENTATION_WORKER_POLICY,
  PLANNING_MODEL_POLICY,
  planningPolicyForDifficulty,
} from "../model-policy.mjs";
import { createTaskPlan, markTaskPlanReady, transitionTaskPlan } from "../task-plan.mjs";
import { createPersistentSOLPlanner, planBatch, planningRequest } from "../planner.mjs";
import {
  assertCanonicalIsolatedWorktree,
  deriveTaskWorktreePath,
  prepareTaskWorktrees,
  resolveTrustedBaseCommit,
} from "../worktrees.mjs";
import {
  createFixture,
  git,
  persistentSOLPlanner,
  persistentSOLClient,
  rawPlans,
} from "./task-62-fixtures.mjs";

const solPlanner = (provider) => persistentSOLPlanner(provider);

test("Task 62 model policy is exact, difficulty-based, persistent, and no-authority", () => {
  assert.deepEqual(PLANNING_MODEL_POLICY.model, REVIEW_MODEL_NAME);
  assert.equal(PLANNING_MODEL_POLICY.role, "ORCHESTRATOR");
  assert.equal(PLANNING_MODEL_POLICY.persistent, true);
  assert.equal(PLANNING_MODEL_POLICY.sandbox, "read-only");
  assert.equal(planningPolicyForDifficulty().effort, "medium");
  assert.equal(planningPolicyForDifficulty("hard").effort, "high");
  assert.equal(assertPlanningPolicy({ difficulty: "critical", model: REVIEW_MODEL_NAME }).effort, "max");
  assert.equal(IMPLEMENTATION_WORKER_POLICY.model, IMPLEMENTATION_MODEL_NAME);
  assert.equal(IMPLEMENTATION_WORKER_POLICY.effort, IMPLEMENTATION_REASONING_EFFORT);
  assert.equal(IMPLEMENTATION_WORKER_POLICY.capabilities.push, false);
  assert.equal(IMPLEMENTATION_WORKER_POLICY.capabilities.pr, false);
  assert.equal(assertImplementationPolicy({ cwd: "C:\\task-worktree" }).model, IMPLEMENTATION_MODEL_NAME);
  assert.equal(assertNoWorkerAuthority(IMPLEMENTATION_WORKER_POLICY.capabilities), true);
  assert.throws(() => assertPlanningPolicy({ model: "gpt-5.6-terra" }), /SOL|Unsupported exact model|Forbidden model/);
  assert.throws(() => assertPlanningPolicy({ allowProviderModelFallback: true }), /fallback/);
  assert.throws(() => assertPlanningPolicy({ ephemeral: true }), /Ephemeral/);
  assert.throws(() => assertPlanningPolicy({ fork: true }), /Forked/);
  assert.throws(() => assertPlanningPolicy({ sandbox: "workspace-write" }), /read-only/);
  assert.throws(() => assertImplementationPolicy({ cwd: "C:\\task", model: "gpt-5.6-terra" }), /LUNA|Forbidden/);
  assert.throws(() => assertImplementationPolicy({ cwd: "C:\\task", effort: "medium" }), /max/);
  assert.throws(() => assertNoWorkerAuthority({ push: true }), /push/);
});

test("planning stays in the persistent Orchestrator thread and bounds an explicit submitted batch", async () => {
  const f = createFixture(2, "task62-plan");
  try {
    let request;
    const result = await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
      solPlanner: solPlanner((value) => {
        request = value;
        return rawPlans(f.batch);
      }),
    });
    assert.equal(result.status, "PLANNED");
    assert.equal(result.persisted, false);
    assert.equal(result.planning_thread, "persistent-orchestrator");
    assert.equal(result.policy.model, REVIEW_MODEL_NAME);
    assert.equal(result.policy.effort, "medium");
    assert.equal(request.planning_thread, "persistent-orchestrator");
    assert.equal(request.policy.model, REVIEW_MODEL_NAME);
    assert.equal(request.policy.effort, "medium");
    assert.equal(request.batch.base_ref, "origin/main");
    assert.equal(request.batch.base_sha, f.baseSha);
    assert.deepEqual(request.batch.tasks.map((task) => task.task_id), f.batch.tasks.map((task) => task.task_id));
    assert.equal(result.plans.length, 2);
    assert.equal(new Set(result.plans.map((plan) => plan.task_id)).size, 2);
    assert.equal(new Set(result.plans.map((plan) => plan.branch)).size, 2);
    for (const plan of result.plans) {
      assert.match(plan.branch, /^codex\/\d{2,}-/);
      assert.equal(plan.batch_id, f.batch.batch_id);
      assert.equal(plan.submission_id, f.batch.submission_id);
      assert.equal(plan.base_ref, "origin/main");
      assert.equal(plan.base_sha, f.baseSha);
      assert.equal(plan.state, "READY");
      assert.ok(path.isAbsolute(plan.worktree));
      assert.ok(plan.allowlist.length > 0);
      assert.ok(plan.acceptance_criteria.length > 0);
      assert.equal(plan.validation_commands.length, 2);
    }
    const stored = f.store.getBatch(f.batch.batch_id);
    assert.equal(typeof stored.reply_metadata.__night_worker_plan_binding.digest, "string");
    assert.equal(stored.reply_metadata.__night_worker_plan_binding.batch_id, f.batch.batch_id);
    assert.equal(stored.reply_metadata.__night_worker_plan_binding.submission_id, f.batch.submission_id);
  } finally {
    f.cleanup();
  }
});

test("accepted plans are digest-bound to the submitted batch and cannot be silently replanned", async () => {
  const f = createFixture(1, "task62-binding");
  try {
    let calls = 0;
    const first = await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
      solPlanner: solPlanner(() => { calls += 1; return rawPlans(f.batch); }),
    });
    const second = await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
    });
    assert.equal(calls, 1);
    assert.equal(second.persisted, true);
    assert.equal(second.plan_digest, first.plan_digest);
    assert.deepEqual(second.plans, first.plans);
    let replanningCalls = 0;
    const unchanged = await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
      solPlanner: solPlanner(() => { replanningCalls += 1; return [{
        ...rawPlans(f.batch)[0],
        allowlist: ["src/changed-after-acceptance.txt"],
      }]; }),
    });
    assert.equal(replanningCalls, 0);
    assert.equal(unchanged.plan_digest, first.plan_digest);
    assert.deepEqual(unchanged.plans, first.plans);
  } finally {
    f.cleanup();
  }
});

test("planner requires the canonical submitted batch and rejects direct plans and policy or execution overrides", async () => {
  const f = createFixture(2, "task62-plan-authority");
  try {
    assert.throws(
      () => createPersistentSOLPlanner(() => rawPlans(f.batch)),
      /genuine App Server lifecycle identity/i,
    );
    assert.throws(
      () => createPersistentSOLPlanner({ plan: () => rawPlans(f.batch) }),
      /genuine.*App Server lifecycle identity/i,
    );
    assert.throws(
      () => createPersistentSOLPlanner({
        client: { connectionState: "READY" },
        threadId: "persistent-orchestrator",
        plan: () => rawPlans(f.batch),
      }),
      /genuine ready App Server/i,
    );
    assert.throws(
      () => createPersistentSOLPlanner({
        client: persistentSOLClient,
        threadId: "worker-thread",
        plan: () => rawPlans(f.batch),
      }),
      /persistent Orchestrator thread identity/i,
    );
    await assert.rejects(
      planBatch({ store: f.store, batchId: "not-submitted" }),
      /explicit submitted batch/,
    );
    await assert.rejects(
      planBatch({ store: f.store, batchId: f.batch.batch_id, planProvider: () => rawPlans(f.batch) }),
      /arbitrary planProvider|persistent SOL planner/i,
    );
    await assert.rejects(
      planBatch({ store: f.store, batchId: f.batch.batch_id, solPlanner: () => rawPlans(f.batch) }),
      /internal persistent Orchestrator SOL planner authority/i,
    );
    const wrappedPlanner = { ...solPlanner(() => rawPlans(f.batch)) };
    await assert.rejects(
      planBatch({ store: f.store, batchId: f.batch.batch_id, solPlanner: wrappedPlanner }),
      /internal persistent Orchestrator SOL planner authority/i,
    );
    const forbiddenKeys = [
      "model", "provider", "orchestrator", "policy", "permissions", "capabilities",
      "fallback", "allowProviderModelFallback", "ephemeral", "fork", "subagent", "sandbox", "baseRef",
      "baseSha", "exec", "commandRunner", "prepareWorktrees", "plans", "worktreeRoot",
    ];
    for (const key of forbiddenKeys) {
      await assert.rejects(
        planBatch({
          store: f.store,
          batchId: f.batch.batch_id,
          solPlanner: solPlanner(() => rawPlans(f.batch)),
          [key]: key === "plans" ? rawPlans(f.batch) : true,
        }),
        /override|persistent Orchestrator|fixed|caller(?:[- ]controlled| supplied)/i,
        `expected planning override ${key} to be rejected`,
      );
    }
    assert.throws(
      () => planningRequest({ store: f.store, batchId: f.batch.batch_id, baseRef: "HEAD" }),
      /override|trusted|fixed/,
    );
    assert.throws(
      () => planningRequest({ store: f.store, batchId: f.batch.batch_id, planProvider: () => rawPlans(f.batch) }),
      /override|caller|persistent SOL/i,
    );
    await assert.rejects(
      planBatch({ store: f.store, batchId: f.batch.batch_id, solPlanner: solPlanner(() => rawPlans(f.batch)), difficulty: "Terra" }),
      /Unsupported review difficulty/,
    );
    await assert.rejects(
      planBatch({
        store: f.store,
        batchId: f.batch.batch_id,
        solPlanner: solPlanner(() => rawPlans(f.batch).map((plan, index) => index === 0
          ? { ...plan, validation_commands: ["true", "echo done"] }
          : plan)),
      }),
      /fixed validation gates/,
    );
  } finally {
    f.cleanup();
  }
});

test("provider output cannot override derived identity, branch, worktree, base, or authority fields", async () => {
  const f = createFixture(1, "task62-plan-output");
  try {
    for (const field of ["batch_id", "submission_id", "position", "branch", "worktree", "base_ref", "base_sha", "model", "permissions"]) {
      await assert.rejects(
        planBatch({
          store: f.store,
          batchId: f.batch.batch_id,
          solPlanner: solPlanner(() => [{ ...rawPlans(f.batch)[0], [field]: field === "position" ? 99 : "forged" }]),
        }),
        /override|derived|authority|unsupported/i,
        `expected provider field ${field} to be rejected`,
      );
    }
  } finally {
    f.cleanup();
  }
});

test("task-plan schema carries traceability and only permits bounded state transitions", () => {
  const f = createFixture(1, "task62-plan-state");
  try {
    const plan = createTaskPlan({
      batch: f.batch,
      task: f.batch.tasks[0],
      allowlist: ["src/task-1.txt", "src/task-1.test.mjs", "src/task-1-check.mjs"],
      acceptanceCriteria: ["criterion"],
      validationCommands: ["node --test src/task-1.test.mjs", "node --check src/task-1-check.mjs"],
    });
    assert.equal(plan.state, "PLANNED");
    assert.equal(plan.batch_id, f.batch.batch_id);
    assert.equal(plan.submission_id, f.batch.submission_id);
    assert.equal(plan.base_ref, "origin/main");
    assert.equal(plan.base_sha, f.baseSha);
    const ready = markTaskPlanReady(plan);
    assert.equal(ready.state, "READY");
    assert.throws(() => transitionTaskPlan(ready, "COMPLETED"), /Invalid task plan transition/);
    assert.throws(() => createTaskPlan({
      batch: f.batch,
      task: f.batch.tasks[0],
      baseRef: "HEAD",
      allowlist: ["src/task-1.txt", "src/task-1.test.mjs", "src/task-1-check.mjs"],
      acceptanceCriteria: ["criterion"],
      validationCommands: ["node --test src/task-1.test.mjs", "node --check src/task-1-check.mjs"],
    }), /origin\/main|trusted/);
  } finally {
    f.cleanup();
  }
});

test("worktree preparation creates canonical isolated branches, reuses only clean exact worktrees, and rejects hooks or root reuse", async () => {
  const f = createFixture(2, "task62-plan-worktrees");
  let prepared = [];
  try {
    const plans = (await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
      solPlanner: solPlanner(() => rawPlans(f.batch)),
    })).plans;
    prepared = prepareTaskWorktrees({ repositoryRoot: f.root, plans });
    assert.equal(prepared.length, 2);
    for (const entry of prepared) {
      assert.equal(entry.worktree.created, true);
      assert.equal(entry.worktree.branch, entry.plan.branch);
      assert.equal(entry.worktree.base_ref, "origin/main");
      assert.equal(entry.worktree.base_sha, f.baseSha);
      assert.equal(git(entry.worktree.worktree, ["branch", "--show-current"]), entry.plan.branch);
      assert.doesNotThrow(() => assertCanonicalIsolatedWorktree({
        repositoryRoot: f.root,
        worktree: entry.worktree.worktree,
        branch: entry.plan.branch,
      }));
    }
    const reused = prepareTaskWorktrees({ repositoryRoot: f.root, plans });
    assert.equal(reused.every((entry) => entry.worktree.created === false), true);
    assert.throws(() => assertCanonicalIsolatedWorktree({
      repositoryRoot: f.root,
      worktree: f.root,
      branch: plans[0].branch,
    }), /isolated/);
    assert.throws(() => prepareTaskWorktrees({
      repositoryRoot: f.root,
      plans,
      exec: () => {},
    }), /override|primitive/);
    assert.throws(() => prepareTaskWorktrees({
      repositoryRoot: f.root,
      plans,
      worktreeRoot: f.worktreeRoot,
    }), /override|primitive/);
    assert.throws(() => deriveTaskWorktreePath({
      repositoryRoot: f.root,
      branch: plans[0].branch,
      worktreeRoot: f.worktreeRoot,
    }), /override|primitive/);
    assert.throws(() => prepareTaskWorktrees({
      repositoryRoot: f.root,
      plans: plans.map((plan) => ({
        ...plan,
        worktree: path.join(f.worktreeRoot, "caller-selected", path.basename(plan.worktree)),
      })),
    }), /canonical/);
    fs.writeFileSync(path.join(prepared[0].worktree.worktree, "dirty.txt"), "dirty\n", "utf8");
    assert.throws(() => prepareTaskWorktrees({ repositoryRoot: f.root, plans }), /clean/);
    fs.rmSync(path.join(prepared[0].worktree.worktree, "dirty.txt"));
  } finally {
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("protected, shared, deployment, and secret-bearing allowlists fail closed", async () => {
  const f = createFixture(1, "task62-plan-scope");
  try {
      for (const allowlist of [
        ["workflow/**"],
        [".github/**"],
        ["**/*.mjs"],
        ["**/workflow/**"],
        ["**/app/**"],
        ["src/secret/config.mjs"],
        ["package.json"],
      [".env.local"],
      ["deployment/**"],
      ["src/client-secret.mjs"],
      ["tasks/**"],
      ["foo/w?rkflow/bar.mjs"],
      ["foo/.git?ub/ci.yml"],
      ["foo/deplo?/app.mjs"],
      ["src/s?cret/config.mjs"],
    ]) {
      await assert.rejects(
        planBatch({
          store: f.store,
          batchId: f.batch.batch_id,
          solPlanner: solPlanner(() => [{ ...rawPlans(f.batch)[0], allowlist }]),
        }),
        /protected|shared|deployment|secret/i,
      );
    }
    const originalOrigin = git(f.root, ["remote", "get-url", "origin"]);
    git(f.root, ["remote", "set-url", "origin", path.join(f.root, "missing-origin")]);
    assert.throws(() => resolveTrustedBaseCommit(f.root), /fresh origin\/main provenance|unavailable/i);
    git(f.root, ["remote", "set-url", "origin", originalOrigin]);
    git(f.root, ["commit", "--allow-empty", "--quiet", "-m", "remote drift"]);
    assert.throws(() => resolveTrustedBaseCommit(f.root), /does not match|provenance/i);
  } finally {
    f.cleanup();
  }
});
