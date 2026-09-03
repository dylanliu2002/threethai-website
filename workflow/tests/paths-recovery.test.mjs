import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertChangedPathsAllowed,
  normalizeRepoPath,
  resolveWithinRepo,
  windowsPathKey,
} from "../paths.mjs";
import { replayEvents, reconcileRuntime } from "../recovery.mjs";
import { assessExistingTaskAdoption } from "../adoption.mjs";
import { assertNoSecretValues } from "../secrets.mjs";

test("path traversal is rejected", () => {
  assert.throws(() => normalizeRepoPath("workflow/../src/secret.ts"));
  assert.throws(() => normalizeRepoPath("C:\\outside\\file"));
});

test("Windows case-equivalent path keys collide", () => {
  assert.equal(windowsPathKey("Workflow/Task.mjs"), windowsPathKey("workflow/task.mjs"));
});

test("rename requires both source and destination authorization", () => {
  const scope = { write_files: ["workflow/old.mjs"], write_prefixes: [] };
  assert.throws(() => assertChangedPathsAllowed([
    { source: "workflow/old.mjs", destination: "src/new.mjs" },
  ], scope));
});

test("junction or symlink escape is rejected", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-path-root-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-path-outside-"));
  const link = path.join(root, "escape");
  try {
    fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
    t.skip(`Symlink/junction unavailable: ${error.code}`);
    return;
  }
  try {
    assert.throws(() => resolveWithinRepo(root, "escape/payload.txt"), /escapes repository/);
  } finally {
    fs.unlinkSync(link);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("dirty or ambiguous worktree blocks adoption", () => {
  const contract = { permissions: { task_adoption: true } };
  assert.equal(assessExistingTaskAdoption(contract, {
    worktreeStatusLines: [" M src/app/layout.tsx"],
    explicitlyAuthorized: true,
  }).reason, "dirty-worktree");
  assert.equal(assessExistingTaskAdoption(contract, {
    ambiguousWorktree: true,
    explicitlyAuthorized: true,
  }).reason, "ambiguous-worktree");
});

function event(sequence, eventId) {
  return {
    schema_version: "1.0.0",
    sequence,
    event_id: eventId,
    task_key: "task-alpha",
    run_id: null,
    type: "task.observed",
    occurred_at: "2026-09-04T00:00:00.000Z",
    payload: {},
  };
}

test("restart and reconciliation are idempotent", () => {
  const id = crypto.randomUUID();
  const events = [event(0, id), event(0, id)];
  const first = replayEvents(events);
  const second = reconcileRuntime(events);
  assert.equal(first.event_ids.size, 1);
  assert.equal(second.event_count, 1);
  assert.deepEqual(second.mutations, []);
});

test("runtime event sequence gaps fail closed", () => {
  assert.throws(() => replayEvents([event(1, crypto.randomUUID())]), /sequence gap/);
});

test("secret values cannot be written to tracked artifacts", () => {
  assert.equal(assertNoSecretValues("CODEX_API_KEY is supplied only to the invocation"), true);
  const unsafe = ["CODEX_API_KEY", "sk-example-secret-value"].join("=");
  assert.throws(() => assertNoSecretValues(unsafe));
});
