import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertCapabilityAgainstStateInternal } from "./capability-engine.mjs";
import { readControllerStateInternal } from "./controller-state-engine.mjs";
import { completeRunInternal, markRunStartedInternal } from "./lease-engine.mjs";
import { assertActualChangesAllowed, deriveActualChanges } from "../git-evidence.mjs";
import { bindReportedThread } from "../identity.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE } from "../constants.mjs";
import { WorkerOutputJsonSchema, WorkerResultSchema } from "../schemas.mjs";
import { assertNoSecretsDeep, assertNoSecretValues, redactSecrets, sanitizeForLog } from "../secrets.mjs";
import { deriveValidationEvidenceInternal } from "./validation-engine.mjs";

function gitHead(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).trim();
}

export function buildCodexExecArgsInternal({ worktree, model, sandbox, schemaPath, outputPath }) {
  if (!path.isAbsolute(worktree)) throw new Error("Codex working directory must be absolute.");
  if (!path.isAbsolute(schemaPath) || !path.isAbsolute(outputPath)) throw new Error("Schema and output paths must be absolute.");
  if (sandbox === "danger-full-access") throw new Error("danger-full-access is forbidden.");
  return [
    "exec", "-", "--cd", worktree, "--model", model, "--sandbox", sandbox,
    "--json", "--output-schema", schemaPath, "--output-last-message", outputPath,
  ];
}

export function parseJsonlInternal(text) {
  if (!text.trim()) return [];
  return text.trim().split(/\r?\n/).map((line) => JSON.parse(line));
}

export function threadIdFromEventsInternal(events) {
  const started = events.find((event) => event.type === "thread.started");
  if (!started?.thread_id) throw new Error("Codex JSONL omitted thread.started/thread_id.");
  return started.thread_id;
}

export async function runCodexExecInternal({
  engine, contract, grant, capability, prompt, signal, spawnImpl,
  validationRunner, now = new Date(),
}) {
  const state = readControllerStateInternal(engine.stateDirectory);
  const validated = assertCapabilityAgainstStateInternal(capability, {
    engine, state, contract, grant, action: capability.action, now,
  });
  if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE) throw new Error("Controller kill switch is active.");
  assertNoSecretsDeep(contract, "Task Contract");
  assertNoSecretsDeep(grant, "authorization Grant");
  assertNoSecretValues(prompt, "worker prompt");
  markRunStartedInternal({ engine, contract, grant, capability, now });

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-codex-run-"));
  const schemaPath = path.join(temporary, "worker-result.schema.json");
  const outputPath = path.join(temporary, "worker-result.json");
  fs.writeFileSync(schemaPath, `${JSON.stringify(WorkerOutputJsonSchema, null, 2)}\n`, { mode: 0o600 });
  const args = buildCodexExecArgsInternal({
    worktree: validated.grant.worktree_realpath,
    model: validated.capability.model,
    sandbox: validated.capability.sandbox,
    schemaPath,
    outputPath,
  });
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(new Error("Codex run timeout.")), validated.grant.limits.timeout_seconds * 1000);
  const forwardAbort = () => abortController.abort(signal.reason ?? new Error("Codex run cancelled."));
  signal?.addEventListener("abort", forwardAbort, { once: true });
  let result = { code: null, closeSignal: null, stdout: "", stderr: "" };
  let output = null;
  let outputValid = false;
  let events = [];
  let threadId = null;
  let parseFailure = null;
  try {
    result = await new Promise((resolve, reject) => {
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
      child.on("error", (error) => resolve({
        code: -1,
        closeSignal: null,
        stdout,
        stderr: redactSecrets(error instanceof Error ? error.message : String(error)),
      }));
      child.on("close", (code, closeSignal) => resolve({ code, closeSignal, stdout, stderr }));
      child.stdin.end(prompt);
    });
    try {
      assertNoSecretValues(result.stdout, "worker stdout");
      assertNoSecretValues(result.stderr, "worker stderr");
      events = parseJsonlInternal(result.stdout);
      assertNoSecretsDeep(events, "worker JSONL events");
      threadId = threadIdFromEventsInternal(events);
      if (!fs.existsSync(outputPath)) throw new Error("Codex final structured output is missing.");
      output = WorkerResultSchema.parse(JSON.parse(fs.readFileSync(outputPath, "utf8")));
      assertNoSecretsDeep(output, "worker structured result");
      const bound = bindReportedThread(validated.run, threadId);
      if (output.task_key !== bound.task_key || output.run_id !== bound.run_id || output.role_id !== bound.role_id) {
        throw new Error("Worker output does not match authoritative controller identity.");
      }
      outputValid = true;
    } catch (error) {
      parseFailure = redactSecrets(error instanceof Error ? error.message : String(error));
    }
    const actualHeadSha = gitHead(engine.repoRoot);
    let scopeEvidence;
    try {
      const evidence = assertActualChangesAllowed({
        repoRoot: engine.repoRoot,
        baseSha: validated.run.base_sha,
        grant: validated.grant,
      });
      scopeEvidence = { ...evidence, passed: true };
    } catch (error) {
      const evidence = deriveActualChanges(engine.repoRoot, validated.run.base_sha);
      scopeEvidence = { ...evidence, passed: false, error: redactSecrets(error.message) };
    }
    const validationEvidence = deriveValidationEvidenceInternal({
      repoRoot: engine.repoRoot,
      contract: validated.contract,
      actualHeadSha,
      runCommand: validationRunner,
      now,
    });
    const completed = completeRunInternal({
      engine, contract, grant, capability,
      processExitCode: result.code,
      outputValid,
      output,
      actualHeadSha,
      scopeEvidence,
      validationEvidence,
      threadId,
      reportedModel: validated.capability.model,
      now,
    });
    return {
      authoritative_status: completed.status,
      authoritative_head_sha: completed.head_sha,
      output: output ? sanitizeForLog(output) : null,
      advisory_changed_files: output?.changed_files ?? [],
      actual_changes: scopeEvidence,
      validation_evidence: validationEvidence,
      events: sanitizeForLog(events),
      parse_failure: parseFailure,
      stderr: redactSecrets(result.stderr),
      identity: completed,
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
