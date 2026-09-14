import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
import { createBatch } from "../submission.mjs";
import { RuntimeStore } from "../runtime-store.mjs";
import { createTaskPlan, markTaskPlanReady, transitionTaskPlan } from "../task-plan.mjs";
import { planBatch, planningRequest } from "../planner.mjs";
import {
  assertCanonicalIsolatedWorktree,
  prepareTaskWorktrees,
} from "../worktrees.mjs";

const EPOCH = Date.parse("2026-09-14T00:00:00.000Z");

function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-night-worker-task62-plan-"));
  const worktreeRoot = `${root}-workers`;
  execFileSync("git", ["init", "--quiet", root], { stdio: "ignore", windowsHide: true });
  git(root, ["config", "user.name", "dylanliu2002"]);
  git(root, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "base.txt"), "base\n", "utf8");
  git(root, ["add", "--all"]);
  git(root, ["commit", "--quiet", "-m", "fixture"]);
  const store = new RuntimeStore(path.join(root, ".night-worker", "runtime.json"));
  let now = EPOCH;
  let id = 0;
  const clock = { now: () => now };
  const batch = store.enqueueBatch(createBatch({
    repositoryRoot: root,
    tasks: ["Implement the first bounded change", "Implement the second bounded change"],
  }, {
    clock,
    idFactory: (prefix) => `${prefix}-${++id}`,
  }));
  return {
    root,
    worktreeRoot,
    store,
    batch,
    clock,
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
    title: `Task ${index + 1}`,
    allowlist: [shared ? "src/shared/**" : `src/task-${index + 1}.txt`],
    acceptance_criteria: [`criterion ${index + 1}`],
    validation_commands: ["node -e \"process.exit(0)\""],
  }));
}

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

test("planning stays in the persistent Orchestrator thread and bounds explicit batch output", async () => {
  const f = fixture();
  try {
    let request;
    const result = await planBatch({
      store: f.store,
      batchId: f.batch.batch_id,
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
      planProvider: (value) => {
        request = value;
        return rawPlans(f.batch);
      },
    });
    assert.equal(result.status, "PLANNED");
    assert.equal(result.planning_thread, "persistent-orchestrator");
    assert.equal(result.policy.model, REVIEW_MODEL_NAME);
    assert.equal(result.policy.effort, "medium");
    assert.equal(request.planning_thread, "persistent-orchestrator");
    assert.equal(request.policy.model, REVIEW_MODEL_NAME);
    assert.equal(request.policy.effort, "medium");
    assert.deepEqual(request.batch.tasks.map((task) => task.task_id), f.batch.tasks.map((task) => task.task_id));
    assert.equal(result.plans.length, 2);
    assert.equal(new Set(result.plans.map((plan) => plan.task_id)).size, 2);
    assert.equal(new Set(result.plans.map((plan) => plan.branch)).size, 2);
    for (const plan of result.plans) {
      assert.match(plan.branch, /^codex\/\d{2,}-/);
      assert.equal(plan.batch_id, f.batch.batch_id);
      assert.equal(plan.submission_id, f.batch.submission_id);
      assert.equal(plan.state, "READY");
      assert.ok(path.isAbsolute(plan.worktree));
      assert.ok(plan.allowlist.length > 0);
      assert.ok(plan.acceptance_criteria.length > 0);
      assert.ok(plan.validation_commands.length > 0);
    }
  } finally {
    f.cleanup();
  }
});

test("planner rejects missing submissions, missing bounded fields, duplicate plans, and identity overrides", async () => {
  const f = fixture();
  try {
    let called = 0;
    await assert.rejects(
      planBatch({ store: f.store, batchId: "not-submitted", planProvider: () => { called += 1; return []; } }),
      /explicit submitted batch/,
    );
    assert.equal(called, 0);
    await assert.rejects(
      planBatch({ store: f.store, batch: f.batch, plans: rawPlans(f.batch).slice(0, 1), baseRef: "HEAD" }),
      /exactly one bounded plan|one bounded plan per submitted task/,
    );
    const missingFields = rawPlans(f.batch);
    delete missingFields[0].allowlist;
    await assert.rejects(
      planBatch({ store: f.store, batch: f.batch, plans: missingFields, baseRef: "HEAD" }),
      /allowlist/,
    );
    const duplicated = rawPlans(f.batch);
    duplicated[1].task_id = duplicated[0].task_id;
    await assert.rejects(
      planBatch({ store: f.store, batch: f.batch, plans: duplicated, baseRef: "HEAD" }),
      /exactly one|Duplicate/,
    );
    const forged = rawPlans(f.batch);
    forged[0].submission_id = "forged-submission";
    await assert.rejects(
      planBatch({ store: f.store, batch: f.batch, plans: forged, baseRef: "HEAD" }),
      /override durable submission_id/,
    );
    await assert.rejects(
      planBatch({ store: f.store, batch: f.batch, plans: rawPlans(f.batch), difficulty: "Terra", baseRef: "HEAD" }),
      /Unsupported review difficulty/,
    );
  } finally {
    f.cleanup();
  }
});

test("task-plan schema carries traceability and only permits bounded state transitions", () => {
  const f = fixture();
  try {
    const plan = createTaskPlan({
      batch: f.batch,
      task: f.batch.tasks[0],
      worktreeRoot: f.worktreeRoot,
      baseRef: "HEAD",
      allowlist: ["src/task-1.txt"],
      acceptanceCriteria: ["criterion"],
      validationCommands: ["node -e \"process.exit(0)\""],
    });
    assert.equal(plan.state, "PLANNED");
    assert.equal(plan.batch_id, f.batch.batch_id);
    assert.equal(plan.submission_id, f.batch.submission_id);
    const ready = markTaskPlanReady(plan);
    assert.equal(ready.state, "READY");
    assert.throws(() => transitionTaskPlan(ready, "COMPLETED"), /Invalid task plan transition/);
  } finally {
    f.cleanup();
  }
});

test("worktree preparation creates canonical isolated branches and rejects the submitted root", async () => {
  const f = fixture();
  let prepared = [];
  try {
    const plans = (await planBatch({
      store: f.store,
      batch: f.batch,
      plans: rawPlans(f.batch),
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
    })).plans;
    prepared = prepareTaskWorktrees({
      repositoryRoot: f.root,
      plans,
      baseRef: "HEAD",
      worktreeRoot: f.worktreeRoot,
    });
    assert.equal(prepared.length, 2);
    for (const entry of prepared) {
      assert.equal(entry.worktree.created, true);
      assert.equal(entry.worktree.branch, entry.plan.branch);
      assert.equal(git(entry.worktree.worktree, ["branch", "--show-current"]), entry.plan.branch);
      assert.doesNotThrow(() => assertCanonicalIsolatedWorktree({
        repositoryRoot: f.root,
        worktree: entry.worktree.worktree,
        branch: entry.plan.branch,
      }));
    }
    assert.throws(() => assertCanonicalIsolatedWorktree({
      repositoryRoot: f.root,
      worktree: f.root,
      branch: plans[0].branch,
    }), /isolated/);
  } finally {
    f.cleanup(prepared.map((entry) => entry.worktree.worktree));
  }
});

test("planning request never adds worker authority or a child planning thread", () => {
  const f = fixture();
  try {
    const request = planningRequest(f.batch);
    assert.equal(request.policy.persistent, true);
    assert.equal(request.policy.ephemeral, false);
    assert.equal(request.policy.fork, false);
    assert.equal(request.policy.subagent, false);
    assert.equal(request.policy.allow_provider_model_fallback, false);
    assert.equal(Object.prototype.hasOwnProperty.call(request, "thread_start"), false);
  } finally {
    f.cleanup();
  }
});
