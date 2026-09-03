import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeScopeDigest } from "../contract.mjs";
import { LockManager } from "../locks.mjs";
import { Scheduler } from "../scheduler.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const raw = JSON.parse(fs.readFileSync(path.join(repoRoot, "tasks/machine/sys-auto-001-codex-autonomous-workflow-bootstrap.json"), "utf8"));

function fixture(key, file) {
  const item = structuredClone(raw);
  item.task_key = key;
  item.task_id = key;
  item.status = "READY";
  item.phase = "QUEUED";
  item.dependencies = [];
  item.worktree = `worktrees/${key}`;
  item.branch = `codex/${key}`;
  item.write_files = [file];
  item.write_prefixes = [];
  item.administrative_files = [file];
  item.shared_file_grants = [];
  item.permissions.worker_dispatch = true;
  item.authorization.activation_authorized = true;
  item.authorization.scope_digest = computeScopeDigest(item);
  return item;
}

test("two disjoint tasks execute concurrently", () => {
  const scheduler = new Scheduler({ lockManager: new LockManager(), maxWorkers: 2 });
  const result = scheduler.plan([
    fixture("task-alpha", "src/alpha.ts"),
    fixture("task-beta", "src/beta.ts"),
  ], { wakeupId: "wakeup-one" });
  assert.equal(result.dispatches.length, 2);
});

test("overlapping write paths serialize", () => {
  const scheduler = new Scheduler({ lockManager: new LockManager(), maxWorkers: 2 });
  const result = scheduler.plan([
    fixture("task-alpha", "src/shared.ts"),
    fixture("task-beta", "SRC/shared.ts"),
  ], { wakeupId: "wakeup-two" });
  assert.equal(result.dispatches.length, 1);
  assert.equal(result.blocked.length, 1);
});

test("duplicate wakeup does not duplicate runs", () => {
  const scheduler = new Scheduler({ lockManager: new LockManager(), maxWorkers: 2 });
  const task = fixture("task-alpha", "src/alpha.ts");
  scheduler.plan([task], { wakeupId: "same-wakeup" });
  const duplicate = scheduler.plan([task], { wakeupId: "same-wakeup" });
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.dispatches, []);
});

test("stale worker cannot publish after lease loss", () => {
  const locks = new LockManager();
  const result = locks.acquire("task-alpha", [{ class: "git-operation", key: "repo" }], {
    leaseId: "lease-one",
    now: 0,
    ttlMs: 10,
  });
  assert.equal(result.acquired, true);
  assert.throws(() => locks.assertPublishLease("lease-one", "task-alpha", 11));
});

test("BLOCKED stops progression", () => {
  const task = fixture("task-blocked", "src/blocked.ts");
  task.status = "BLOCKED";
  task.phase = "IMPLEMENT";
  const result = new Scheduler({ lockManager: new LockManager() }).plan([task], { wakeupId: "blocked" });
  assert.equal(result.dispatches.length, 0);
});

test("ON_HOLD never dispatches and preserves Task 16", () => {
  const task = fixture("task-16-backlink-audit", "docs/audits/16-backlink.md");
  task.status = "ON_HOLD";
  task.phase = "QUEUED";
  const result = new Scheduler({ lockManager: new LockManager() }).plan([task], { wakeupId: "held" });
  assert.equal(result.dispatches.length, 0);
});

test("task-specific dispatch prohibition overrides generic activation", () => {
  const task = fixture("task-prohibited", "src/prohibited.ts");
  task.permissions.worker_dispatch = false;
  const result = new Scheduler({ lockManager: new LockManager() }).plan([task], { wakeupId: "prohibited" });
  assert.equal(result.dispatches.length, 0);
});
