import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { validateControllerCapability } from "./capability.mjs";
import { readControllerState } from "./controller-state.mjs";
import { completeAuthoritativeRun } from "./durable-leases.mjs";
import { assertActualChangesAllowed } from "./git-evidence.mjs";
import { bindReportedThread } from "./identity.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE } from "./constants.mjs";
import { WorkerOutputJsonSchema, WorkerResultSchema } from "./schemas.mjs";
import {
  assertNoSecretsDeep,
  assertNoSecretValues,
  redactSecrets,
  sanitizeForLog,
} from "./secrets.mjs";

export function buildCodexExecArgs({ worktree, model, sandbox, schemaPath, outputPath }) {
  if (!path.isAbsolute(worktree)) throw new Error("Codex working directory must be absolute.");
  if (!path.isAbsolute(schemaPath) || !path.isAbsolute(outputPath)) {
    throw new Error("Schema and output paths must be absolute.");
  }
  if (sandbox === "danger-full-access") throw new Error("danger-full-access is forbidden.");
  return [
    "exec", "-", "--cd", worktree, "--model", model, "--sandbox", sandbox,
    "--json", "--output-schema", schemaPath, "--output-last-message", outputPath,
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

export async function runCodexExec(options) {
  for (const forbidden of ["model", "sandbox", "worktree", "cwd", "permission", "dangerouslyAllowAll"]) {
    if (Object.hasOwn(options, forbidden)) {
      throw new Error(`Caller-selected ${forbidden} is forbidden; controller policy derives it.`);
    }
  }
  const {
    repoRoot,
    stateDirectory,
    contract,
    grant,
    capability,
    prompt,
    signal,
    spawnImpl = spawn,
  } = options;
  const validated = validateControllerCapability(capability, {
    stateDirectory,
    contract,
    grant,
    action: "dispatch",
    repoRoot,
  });
  const state = readControllerState(stateDirectory);
  if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE) throw new Error("Controller kill switch is active.");
  if (!state.activation.authorized
    || !validated.grant.activation.autonomous
    || !validated.grant.activation.worker_dispatch
    || !validated.grant.permissions.worker_dispatch) {
    throw new Error("Controller activation/worker dispatch is not authorized.");
  }
  assertNoSecretsDeep(contract, "Task Contract");
  assertNoSecretsDeep(grant, "authorization grant");
  assertNoSecretValues(prompt, "worker prompt");

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-codex-run-"));
  const schemaPath = path.join(temporary, "worker-result.schema.json");
  const outputPath = path.join(temporary, "worker-result.json");
  fs.writeFileSync(schemaPath, `${JSON.stringify(WorkerOutputJsonSchema, null, 2)}\n`, { mode: 0o600 });
  const args = buildCodexExecArgs({
    worktree: validated.grant.worktree_realpath,
    model: validated.capability.model,
    sandbox: validated.capability.sandbox,
    schemaPath,
    outputPath,
  });
  const abortController = new AbortController();
  const timeoutMs = validated.grant.limits.timeout_seconds * 1000;
  const timer = setTimeout(() => abortController.abort(new Error("Codex run timeout.")), timeoutMs);
  const forwardAbort = () => abortController.abort(signal.reason ?? new Error("Codex run cancelled."));
  signal?.addEventListener("abort", forwardAbort, { once: true });
  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawnImpl("codex", args, {
        cwd: validated.grant.worktree_realpath,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
        signal: abortController.signal,
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
      throw new Error(`codex exec failed (${result.code ?? result.closeSignal}): ${redactSecrets(result.stderr.slice(-2000))}`);
    }
    assertNoSecretValues(result.stdout, "worker stdout");
    assertNoSecretValues(result.stderr, "worker stderr");
    const events = parseJsonl(result.stdout);
    assertNoSecretsDeep(events, "worker JSONL events");
    const identity = bindReportedThread(validated.run, threadIdFromEvents(events));
    if (!fs.existsSync(outputPath)) throw new Error("Codex final structured output is missing.");
    const output = WorkerResultSchema.parse(JSON.parse(fs.readFileSync(outputPath, "utf8")));
    assertNoSecretsDeep(output, "worker structured result");
    if (output.task_key !== identity.task_key || output.run_id !== identity.run_id || output.role_id !== identity.role_id) {
      throw new Error("Worker output does not match authoritative controller identity.");
    }
    const actualChanges = assertActualChangesAllowed({
      repoRoot,
      baseSha: identity.base_sha,
      grant: validated.grant,
    });
    const completed = completeAuthoritativeRun({
      stateDirectory,
      contract,
      grant,
      capability,
      repoRoot,
      threadId: identity.thread_id,
      reportedModel: identity.requested_model,
      headSha: output.head_sha ?? identity.base_sha,
    });
    return {
      output: sanitizeForLog(output),
      advisory_changed_files: output.changed_files,
      actual_changes: actualChanges,
      events: sanitizeForLog(events),
      identity: completed,
      stderr: redactSecrets(result.stderr),
    };
  } catch (error) {
    throw new Error(redactSecrets(error instanceof Error ? error.message : String(error)));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
