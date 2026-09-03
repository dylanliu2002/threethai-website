import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { WorkerOutputJsonSchema, WorkerResultSchema } from "./schemas.mjs";
import { bindReportedThread } from "./identity.mjs";

export function buildCodexExecArgs({ worktree, model, sandbox, schemaPath, outputPath }) {
  if (!path.isAbsolute(worktree)) throw new Error("Codex working directory must be absolute.");
  if (!path.isAbsolute(schemaPath) || !path.isAbsolute(outputPath)) {
    throw new Error("Schema and output paths must be absolute.");
  }
  return [
    "exec",
    "-",
    "--cd", worktree,
    "--model", model,
    "--sandbox", sandbox,
    "--json",
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
  ];
}

export function parseJsonl(text) {
  if (!text.trim()) return [];
  return text.trim().split(/\r?\n/).map((line) => JSON.parse(line));
}

export function threadIdFromEvents(events) {
  const started = events.find((event) => event.type === "thread.started");
  if (!started?.thread_id) throw new Error("Codex JSONL omitted thread.started/thread_id.");
  return started.thread_id;
}

export async function runCodexExec({
  executable = "codex",
  worktree,
  prompt,
  model,
  sandbox,
  timeoutMs,
  identity,
  signal,
  spawnImpl = spawn,
}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-codex-run-"));
  const schemaPath = path.join(temporary, "worker-result.schema.json");
  const outputPath = path.join(temporary, "worker-result.json");
  fs.writeFileSync(schemaPath, `${JSON.stringify(WorkerOutputJsonSchema, null, 2)}\n`, { mode: 0o600 });
  const args = buildCodexExecArgs({ worktree, model, sandbox, schemaPath, outputPath });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Codex run timeout.")), timeoutMs);
  const forwardAbort = () => controller.abort(signal.reason ?? new Error("Codex run cancelled."));
  signal?.addEventListener("abort", forwardAbort, { once: true });
  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawnImpl(executable, args, {
        cwd: worktree,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
        signal: controller.signal,
      });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", reject);
      child.on("close", (code, closeSignal) => resolve({ code, closeSignal, stdout, stderr }));
      child.stdin.end(prompt);
    });
    if (result.code !== 0) {
      throw new Error(`codex exec failed (${result.code ?? result.closeSignal}): ${result.stderr.slice(-2000)}`);
    }
    const events = parseJsonl(result.stdout);
    const boundIdentity = bindReportedThread(identity, threadIdFromEvents(events));
    if (!fs.existsSync(outputPath)) throw new Error("Codex final structured output is missing.");
    const output = WorkerResultSchema.parse(JSON.parse(fs.readFileSync(outputPath, "utf8")));
    if (output.task_key !== identity.task_key || output.run_id !== identity.run_id || output.role_id !== identity.role_id) {
      throw new Error("Worker output does not match authoritative controller identity.");
    }
    return { output, events, identity: boundIdentity, stderr: result.stderr };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
