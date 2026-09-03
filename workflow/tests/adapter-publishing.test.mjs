import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  buildCodexExecArgs,
  parseJsonl,
  threadIdFromEvents,
} from "../codex-exec.mjs";
import { prPlan, verifyGitIdentity } from "../publishing.mjs";
import { createRunIdentity } from "../identity.mjs";

test("Codex exec adapter uses explicit cwd, model, sandbox and structured output", () => {
  const root = path.resolve("C:/repo");
  const args = buildCodexExecArgs({
    worktree: root,
    model: "gpt-5.6-sol",
    sandbox: "workspace-write",
    schemaPath: path.join(root, "schema.json"),
    outputPath: path.join(root, "output.json"),
  });
  for (const flag of ["--cd", "--model", "--sandbox", "--json", "--output-schema", "--output-last-message"]) {
    assert.ok(args.includes(flag));
  }
  assert.equal(args[1], "-");
});

test("Codex JSONL must bind a reported thread", () => {
  const events = parseJsonl('{"type":"thread.started","thread_id":"thread-one"}\n{"type":"turn.completed"}\n');
  assert.equal(threadIdFromEvents(events), "thread-one");
  assert.throws(() => threadIdFromEvents([{ type: "turn.completed" }]));
});

test("controller creates authoritative run identity", () => {
  const contract = {
    task_key: "task-alpha",
    routing: {
      executor_platform: "Codex",
      provider: "OpenAI",
      requested_model: "gpt-5.6-sol",
      reasoning_effort: "high",
      policy_revision: "model-routing-v1",
    },
    schema_version: "1.0.0",
    contract_revision: 1,
    limits: {},
    validation_profile: {},
  };
  const identity = createRunIdentity(contract, {
    roleId: "ORCHESTRATOR",
    threadId: "thread-one",
    attempt: 1,
  });
  assert.equal(identity.task_key, "task-alpha");
  assert.match(identity.run_id, /^[0-9a-f-]{36}$/);
});

test("Git identity mismatch blocks publishing", () => {
  const fakeExec = (_command, args) => args.at(-1) === "user.name" ? "wrong\n" : "wrong@example.com\n";
  assert.throws(() => verifyGitIdentity("C:/repo", fakeExec), /identity mismatch/i);
});

test("permission-gated PR adapter fails closed", () => {
  const contract = {
    branch: "codex/task-alpha",
    permissions: { pr_create: false, github_write: false },
  };
  assert.throws(() => prPlan(contract, { reviewedHead: "a".repeat(40) }));
});
