import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateTestGrant } from "../testing/controller-harness.mjs";
import { assessExistingTaskAdoption } from "../adoption.mjs";
import { buildCodexExecArgs, parseJsonl, threadIdFromEvents } from "../codex-exec.mjs";
import { validateTaskGraph } from "../dependencies.mjs";
import { reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import { routeTask } from "../routing.mjs";
import { isDispatchEligible } from "../scheduler.mjs";
import { transition } from "../state.mjs";
import {
  cleanupFixture,
  engineFor,
  makeContract,
  makeGitFixture,
  makeGrant,
  makeStateDirectory,
} from "./helpers.mjs";

function reserve({ stateDirectory, contract, grant, repoRoot, ...rest }) {
  return reserveTaskDispatchInternal({
    engine: engineFor({ stateDirectory, contract, grant, repoRoot }),
    contract, grant, stateDirectory, repoRoot, ...rest,
  });
}

test("disjoint durable reservations may coexist", (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  t.after(() => cleanupFixture(stateDirectory));
  const left = makeContract({ taskKey: "task-alpha", file: "src/alpha.ts" });
  const right = makeContract({ taskKey: "task-beta", file: "src/beta.ts" });
  const first = reserve({
    stateDirectory, contract: left, grant: makeGrant(left), wakeupId: "disjoint-a",
    baseSha: "a".repeat(40), roleId: left.owner_role, verifyCard: false,
  });
  const second = reserve({
    stateDirectory, contract: right, grant: makeGrant(right), wakeupId: "disjoint-b",
    baseSha: "a".repeat(40), roleId: right.owner_role, verifyCard: false,
  });
  assert.equal(first.acquired, true);
  assert.equal(second.acquired, true);
});

test("durable wakeup deduplication produces no second authoritative run", (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  t.after(() => cleanupFixture(stateDirectory));
  const contract = makeContract();
  const grant = makeGrant(contract);
  const first = reserve({
    stateDirectory, contract, grant, wakeupId: "same-wakeup", baseSha: "a".repeat(40),
    roleId: contract.owner_role, verifyCard: false,
  });
  const second = reserve({
    stateDirectory, contract, grant, wakeupId: "same-wakeup", baseSha: "a".repeat(40),
    roleId: contract.owner_role, verifyCard: false,
  });
  assert.equal(first.acquired, true);
  assert.equal(second.duplicate, true);
});

test("Task 16 style ON_HOLD contract is never eligible", () => {
  const contract = makeContract({ taskKey: "task-16-backlink-audit", status: "ON_HOLD", phase: "QUEUED" });
  const grant = makeGrant(contract);
  assert.equal(isDispatchEligible(contract, grant, [contract]), false);
});

test("task-specific worker dispatch prohibition wins", () => {
  const contract = makeContract({ dispatch: false, automation: false });
  const grant = makeGrant(contract, { activation: { autonomous: false, worker_dispatch: false } });
  assert.equal(isDispatchEligible(contract, grant, [contract]), false);
});

test("dependency graph rejects missing dependency", () => {
  const contract = makeContract();
  contract.dependencies = ["missing-task"];
  assert.throws(() => validateTaskGraph([contract]), /Unknown dependency/);
});

test("illegal lifecycle transition fails closed", () => {
  assert.throws(() => transition(
    { status: "READY", phase: "QUEUED" },
    { status: "APPROVED", phase: "CLOSEOUT" },
    { reason: "skip" },
  ));
});

test("approved model unavailability blocks without fallback", () => {
  assert.throws(() => routeTask(makeContract(), { availableModels: ["gpt-5.6-terra"] }), /BLOCKED/);
});

test("dirty or ambiguous existing task cannot be adopted", () => {
  const contract = makeContract();
  const grant = makeGrant(contract, { activation: { autonomous: false, worker_dispatch: false } });
  assert.equal(assessExistingTaskAdoption(grant, {
    worktreeStatusLines: [" M src/app/layout.tsx"], separatelyAuthorized: true,
  }).adoptable, false);
  assert.equal(assessExistingTaskAdoption(grant, {
    ambiguousWorktree: true, separatelyAuthorized: true,
  }).adoptable, false);
});

test("Codex adapter arguments are explicit and structured", () => {
  const root = path.resolve("C:/repo");
  const args = buildCodexExecArgs({
    worktree: root, model: "gpt-5.6-sol", sandbox: "workspace-write",
    schemaPath: path.join(root, "schema.json"), outputPath: path.join(root, "output.json"),
  });
  for (const flag of ["--cd", "--model", "--sandbox", "--json", "--output-schema", "--output-last-message"]) {
    assert.ok(args.includes(flag));
  }
  assert.throws(() => buildCodexExecArgs({
    worktree: root, model: "gpt-5.6-sol", sandbox: "danger-full-access",
    schemaPath: path.join(root, "schema.json"), outputPath: path.join(root, "output.json"),
  }));
});

test("Codex JSONL requires a concrete reported thread", () => {
  const events = parseJsonl('{"type":"thread.started","thread_id":"thread-one"}\n');
  assert.equal(threadIdFromEvents(events), "thread-one");
  assert.throws(() => threadIdFromEvents([{ type: "turn.completed" }]));
});

test("current Task Card mutation invalidates external Grant", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  fs.appendFileSync(path.join(fixture.repoRoot, fixture.contract.card_path), "changed\n");
  assert.throws(() => validateTestGrant(fixture.contract, fixture.grant, {
    repoRoot: fixture.repoRoot,
  }), /card blob mismatch/i);
});
