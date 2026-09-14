import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { AppServerClient } from "../app-server-client.mjs";
import { RuntimeStore } from "../runtime-store.mjs";
import { createBatch } from "../submission.mjs";

export const EPOCH = Date.parse("2026-09-14T00:00:00.000Z");

export function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

export function createFixture(taskCount = 2, prefix = "task62") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `threethai-night-worker-${prefix}-`));
  const worktreeRoot = `${root}-workers`;
  execFileSync("git", ["init", "--quiet", root], { stdio: "ignore", windowsHide: true });
  git(root, ["config", "user.name", "dylanliu2002"]);
  git(root, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "base.txt"), "base\n", "utf8");
  fs.writeFileSync(path.join(root, "src", "check.mjs"), "export const fixture = true;\n", "utf8");
  fs.writeFileSync(
    path.join(root, "src", "smoke.test.mjs"),
    "import test from \"node:test\";\ntest(\"fixture smoke\", () => {});\n",
    "utf8",
  );
  git(root, ["add", "--all"]);
  git(root, ["commit", "--quiet", "-m", "fixture"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  git(root, ["update-ref", "refs/remotes/origin/main", head]);
  const store = new RuntimeStore(path.join(root, ".night-worker", "runtime.json"));
  let now = EPOCH;
  let id = 0;
  const clock = { now: () => now };
  const batch = taskCount === 0 ? null : store.enqueueBatch(createBatch({
    repositoryRoot: root,
    tasks: Array.from({ length: taskCount }, (_, index) => `bounded implementation ${index + 1}`),
  }, {
    clock,
    idFactory: (prefixValue) => `${prefixValue}-${++id}`,
  }));
  return {
    root,
    worktreeRoot,
    store,
    batch,
    clock,
    baseSha: head.toLocaleLowerCase("en-US"),
    setNow(value) { now = value; },
    cleanup(worktrees = []) {
      for (const worktree of worktrees) {
        try { git(root, ["worktree", "remove", "--force", worktree]); } catch {}
      }
      fs.rmSync(worktreeRoot, { recursive: true, force: true });
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

export function rawPlans(batch, { shared = false, dependencies = [] } = {}) {
  return batch.tasks.map((task, index) => ({
    task_id: task.task_id,
    title: `Task ${index + 1}`,
    description: task.description,
    allowlist: [shared ? "src/shared/**" : `src/task-${index + 1}.txt`],
    acceptance_criteria: [`criterion ${index + 1}`],
    validation_commands: ["node --test src/smoke.test.mjs", "node --check src/check.mjs"],
    dependencies: dependencies[index] ?? [],
  }));
}

export function makeValidPlan({
  batchId = "batch-task62",
  submissionId = "submission-task62",
  taskId = "task-1",
  position = 1,
  worktree = path.join(os.tmpdir(), `task62-plan-${position}`),
  allowlist = [`src/task-${position}.txt`],
  state = "READY",
  baseSha = "0123456789012345678901234567890123456789",
  dependencies = [],
  validationCommands = ["node --test src/smoke.test.mjs", "node --check src/check.mjs"],
} = {}) {
  return {
    schema_version: 1,
    batch_id: batchId,
    submission_id: submissionId,
    task_id: taskId,
    position,
    title: `Task ${position}`,
    description: `task ${position}`,
    branch: `codex/${String(position).padStart(2, "0")}-task-${position}`,
    worktree,
    allowlist,
    acceptance_criteria: ["done"],
    validation_commands: validationCommands,
    difficulty: "medium",
    dependencies,
    base_ref: "origin/main",
    base_sha: baseSha,
    state,
  };
}

function taskPositionFromCwd(cwd) {
  const match = String(cwd).match(/[\\/]([0-9]{2})-/);
  return match ? Number.parseInt(match[1], 10) : 1;
}

class FakeTask62Transport {
  constructor({ turnDelayMs = 0, writeChanges = false, readStatuses = [] } = {}) {
    this.turn_delay_ms = turnDelayMs;
    this.write_changes = writeChanges;
    this.read_statuses = [...readStatuses];
    this.callback = null;
    this.requests = [];
    this.threads = new Map();
    this.thread_number = 0;
    this.turn_number = 0;
    this.active_turns = 0;
    this.max_active_turns = 0;
    this.turn_intervals = [];
    this.read_count = new Map();
  }

  onMessage(callback) {
    this.callback = callback;
    return () => { if (this.callback === callback) this.callback = null; };
  }

  send(line) {
    const request = JSON.parse(String(line));
    this.requests.push(request);
    queueMicrotask(() => this.respond(request));
  }

  respond(request) {
    let result;
    if (request.method === "initialize") {
      result = { serverInfo: { name: "task62-fixture" } };
    } else if (request.method === "model/list") {
      result = {
        data: [
          { id: "gpt-5.6-luna", model: "gpt-5.6-luna", supportedReasoningEfforts: ["max"] },
          { id: "gpt-5.6-sol", model: "gpt-5.6-sol", supportedReasoningEfforts: ["medium", "high", "max"] },
        ],
        nextCursor: null,
      };
    } else if (request.method === "thread/start") {
      this.thread_number += 1;
      const id = `fixture-thread-${this.thread_number}`;
      this.threads.set(id, { id, params: request.params, turn: null });
      result = {
        thread: {
          id,
          model: request.params.model,
          effort: request.params.config?.model_reasoning_effort,
        },
      };
    } else if (request.method === "thread/resume") {
      const thread = this.threads.get(request.params.threadId);
      result = {
        thread: {
          id: request.params.threadId,
          model: request.params.model,
          effort: request.params.config?.model_reasoning_effort,
          ...(thread ? {} : { unknown: true }),
        },
      };
    } else if (request.method === "turn/start") {
      const thread = this.threads.get(request.params.threadId);
      if (!thread) throw new Error(`Unknown fixture thread: ${request.params.threadId}`);
      this.turn_number += 1;
      const turn = {
        id: `fixture-turn-${this.turn_number}`,
        clientUserMessageId: request.params.clientUserMessageId,
        model: request.params.model,
        effort: request.params.effort,
        status: this.read_statuses.length > 0 ? this.read_statuses[0] : "completed",
      };
      thread.turn = turn;
      if (this.write_changes) {
        const position = taskPositionFromCwd(request.params.cwd);
        fs.writeFileSync(path.join(request.params.cwd, "src", `task-${position}.txt`), "worker change\n", "utf8");
      }
      this.active_turns += 1;
      this.max_active_turns = Math.max(this.max_active_turns, this.active_turns);
      const startedAt = Date.now();
      const respond = () => {
        this.active_turns -= 1;
        this.turn_intervals.push({ start: startedAt, end: Date.now(), cwd: request.params.cwd });
        result = { turn };
        this.sendResponse(request, result);
      };
      if (this.turn_delay_ms > 0) setTimeout(respond, this.turn_delay_ms);
      else queueMicrotask(respond);
      return;
    } else if (request.method === "thread/read") {
      const threadId = request.params.threadId;
      const thread = this.threads.get(threadId);
      if (!thread) throw new Error(`Unknown fixture thread: ${threadId}`);
      const count = (this.read_count.get(threadId) ?? 0) + 1;
      this.read_count.set(threadId, count);
      const status = this.read_statuses[count - 1] ?? "completed";
      if (thread.turn) thread.turn.status = status;
      result = { thread: { id: threadId, turns: thread.turn ? [thread.turn] : [] } };
    } else if (request.method === "initialized") {
      return;
    } else {
      throw new Error(`Unsupported fixture App Server method: ${request.method}`);
    }
    this.sendResponse(request, result);
  }

  sendResponse(request, result) {
    if (request.id === undefined) return;
    this.callback?.(JSON.stringify({ id: request.id, result }));
  }
}

export async function createAppServerClient(options = {}) {
  const transport = new FakeTask62Transport(options);
  const client = new AppServerClient({ transport });
  await client.connect();
  return { client, transport };
}

export function requestsFor(transport, method) {
  return transport.requests.filter((request) => request.method === method);
}
