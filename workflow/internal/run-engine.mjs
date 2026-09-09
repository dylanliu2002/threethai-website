import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertCapabilityAgainstStateInternal } from "./capability-engine.mjs";
import { readControllerStateInternal } from "./controller-state-engine.mjs";
import {
  completeRunInternal,
  isConsumedSyntheticPilotRunInternal,
  markRunStartedInternal,
} from "./lease-engine.mjs";
import { assertActualChangesAllowed, deriveActualChanges } from "../git-evidence.mjs";
import { bindReportedThread } from "../identity.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE } from "../constants.mjs";
import {
  assertOpenAiStructuredOutputSchema,
  WorkerDiagnosticsSchema,
  WorkerOutputJsonSchema,
  WorkerResultSchema,
} from "../schemas.mjs";
import { assertNoSecretsDeep, assertNoSecretValues, redactSecrets, sanitizeForLog } from "../secrets.mjs";
import { deriveValidationEvidenceInternal } from "./validation-engine.mjs";
import {
  assertPilotWorkerRequestedActions,
  oneTimePilotPolicy,
  PILOT_MODE,
  preparePilotWorkerLaunch,
} from "../pilot-security.mjs";

function gitHead(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).trim();
}

export function buildCodexExecArgsInternal({
  worktree,
  model,
  sandbox,
  schemaPath,
  outputPath,
  securityArgs = [],
}) {
  if (!path.isAbsolute(worktree)) throw new Error("Codex working directory must be absolute.");
  if (!path.isAbsolute(schemaPath) || !path.isAbsolute(outputPath)) throw new Error("Schema and output paths must be absolute.");
  if (sandbox === "danger-full-access") throw new Error("danger-full-access is forbidden.");
  return [
    "exec",
    ...securityArgs,
    "--cd", worktree,
    "--model", model,
    "--sandbox", sandbox,
    "--json",
    "--output-schema", schemaPath,
    "--output-last-message", outputPath,
    "-",
  ];
}

export function serializeWorkerOutputSchemaInternal(schema = WorkerOutputJsonSchema) {
  assertOpenAiStructuredOutputSchema(schema);
  return `${JSON.stringify(schema, null, 2)}\n`;
}

export function buildAuthoritativeWorkerPromptInternal(prompt, validated) {
  const runtimeContext = {
    task_key: validated.contract.task_key,
    run_id: validated.run.run_id,
    activation_id: validated.run.one_time_pilot_activation_id ?? null,
    grant_authorization_id: validated.grant.authorization_id,
    capability_id: validated.capability.capability_id,
    capability_action: validated.capability.action,
    lease_id: validated.lease.lease_id,
    fencing_token: validated.lease.fencing_token,
    role_id: validated.run.role_id,
  };
  return [
    prompt,
    "",
    "Controller admission and capability validation have already succeeded for this worker process.",
    "The following JSON is the authoritative runtime context for this already-dispatched run:",
    "<controller_runtime_context>",
    JSON.stringify(runtimeContext, null, 2),
    "</controller_runtime_context>",
    "Use these exact identities. Do not invent another run identity, request another dispatch, or demand a second human authorization.",
  ].join("\n");
}

export function parseJsonlWithDiagnosticsInternal(text) {
  const events = [];
  if (typeof text !== "string" || !text.trim()) {
    return { events, parse_failure: null };
  }
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        events,
        parse_failure: redactSecrets(
          `Codex JSONL parse degradation at line ${index + 1}: ${message}`,
        ).slice(0, 4096),
      };
    }
  }
  return { events, parse_failure: null };
}

export function parseJsonlInternal(text) {
  return parseJsonlWithDiagnosticsInternal(text).events;
}

export function threadIdFromEventsInternal(events) {
  const started = events.find((event) => event?.type === "thread.started");
  if (typeof started?.thread_id !== "string"
    || started.thread_id.length === 0
    || started.thread_id.length > 256) {
    throw new Error("Codex JSONL omitted a valid bounded thread.started/thread_id.");
  }
  return started.thread_id;
}

const DIAGNOSTIC_TEXT_LIMIT = 4096;
const DIAGNOSTIC_THREAD_ID_LIMIT = 256;
const DIAGNOSTIC_SIGNAL_LIMIT = 64;
const DIAGNOSTIC_COMMAND_LIMIT = 32;
const DIAGNOSTIC_EVENT_ERROR_LIMIT = 8;

function diagnosticText(value) {
  if (value === null || value === undefined || value === "") return null;
  const sanitized = sanitizeForLog(value);
  const text = typeof sanitized === "string" ? sanitized : JSON.stringify(sanitized);
  return redactSecrets(text).slice(0, DIAGNOSTIC_TEXT_LIMIT);
}

function boundedDiagnosticString(value, limit) {
  if (typeof value !== "string" || value.length === 0) return null;
  return diagnosticText(value)?.slice(0, limit) ?? null;
}

function diagnosticDigest(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value)
    ? value
    : null;
}

function degradedWorkerDiagnostics() {
  return {
    diagnostics_version: "1.0.0",
    worker_exit_code: null,
    close_signal: null,
    termination_reason: "UNKNOWN",
    thread_id: null,
    thread_lifecycle_status: "UNKNOWN",
    model_stage_status: "UNKNOWN",
    sanitized_stderr: "",
    sanitized_error: "worker diagnostics degraded due to invalid metadata",
    structured_output_present: false,
    validator_result: {
      status: "UNKNOWN",
      evidence_digest: null,
      commands: [],
    },
  };
}

function lifecycleFromEvents(events, threadId) {
  const eventTypes = new Set(events.map((event) => event?.type).filter(Boolean));
  const failed = eventTypes.has("turn.failed") || eventTypes.has("error");
  const completed = eventTypes.has("turn.completed");
  const started = eventTypes.has("turn.started")
    || eventTypes.has("item.started")
    || eventTypes.has("item.completed");
  return {
    thread_lifecycle_status: failed
      ? "FAILED"
      : completed
        ? "COMPLETED"
        : threadId
          ? "STARTED"
          : "UNKNOWN",
    model_stage_status: failed
      ? "FAILED"
      : completed
        ? "COMPLETED"
        : started
          ? "STARTED"
          : "UNKNOWN",
  };
}

function terminationReason({
  result,
  closeSignal,
  structuredOutputPresent,
  outputValid,
  validationEvidence,
}) {
  if (result.timedOut) return "TIMEOUT";
  if (result.terminationRequested) return "CANCELLED";
  if (closeSignal) return "SIGNAL";
  if (result.code !== 0) return "NONZERO_EXIT";
  if (!structuredOutputPresent) return "MISSING_STRUCTURED_OUTPUT";
  if (!outputValid) return "INVALID_STRUCTURED_OUTPUT";
  if (validationEvidence?.passed === false) return "VALIDATION_FAILED";
  return "UNKNOWN";
}

function buildWorkerDiagnostics({
  result,
  events = [],
  threadId = null,
  parseFailure = null,
  structuredOutputPresent = false,
  outputValid = false,
  validationEvidence = null,
}) {
  const safeResult = result && typeof result === "object" ? result : {};
  const closeSignal = boundedDiagnosticString(
    safeResult.closeSignal,
    DIAGNOSTIC_SIGNAL_LIMIT,
  );
  const normalizedThreadId = boundedDiagnosticString(
    threadId,
    DIAGNOSTIC_THREAD_ID_LIMIT,
  );
  const safeEvents = Array.isArray(events) ? events : [];
  const outputPresent = structuredOutputPresent === true;
  const validOutput = outputValid === true;
  const validationPassed = validationEvidence?.passed === true;
  const abnormal = safeResult.code !== 0
    || safeResult.timedOut === true
    || safeResult.terminationRequested === true
    || Boolean(closeSignal)
    || !outputPresent
    || !validOutput
    || !validationPassed;
  if (!abnormal) return null;
  const lifecycle = lifecycleFromEvents(safeEvents, normalizedThreadId);
  const eventErrors = [];
  for (const event of safeEvents) {
    if (event?.type !== "turn.failed" && event?.type !== "error") continue;
    const value = event.error ?? event.message ?? event;
    if (value !== null && value !== undefined) eventErrors.push(value);
    if (eventErrors.length === DIAGNOSTIC_EVENT_ERROR_LIMIT) break;
  }
  const validatorCommands = Array.isArray(validationEvidence?.commands)
    ? validationEvidence.commands.slice(0, DIAGNOSTIC_COMMAND_LIMIT).map((command, index) => ({
      index,
      exit_code: Number.isInteger(command?.exit_code) ? command.exit_code : null,
      signal: boundedDiagnosticString(command?.signal, DIAGNOSTIC_SIGNAL_LIMIT),
      output_digest: diagnosticDigest(command?.output_digest),
      error_digest: diagnosticDigest(command?.error_digest),
    }))
    : [];
  try {
    return WorkerDiagnosticsSchema.parse({
      diagnostics_version: "1.0.0",
      worker_exit_code: Number.isInteger(safeResult.code) ? safeResult.code : null,
      close_signal: closeSignal,
      termination_reason: terminationReason({
        result: safeResult,
        closeSignal,
        structuredOutputPresent: outputPresent,
        outputValid: validOutput,
        validationEvidence,
      }),
      thread_id: normalizedThreadId,
      ...lifecycle,
      sanitized_stderr: diagnosticText(safeResult.stderr) ?? "",
      sanitized_error: parseFailure || eventErrors.length > 0
        ? diagnosticText([parseFailure, ...eventErrors].filter(Boolean))
        : null,
      structured_output_present: outputPresent,
      validator_result: {
        status: validationEvidence?.passed === true
          ? "PASS"
          : validationEvidence?.passed === false
            ? "FAIL"
            : "UNKNOWN",
        evidence_digest: diagnosticDigest(validationEvidence?.evidence_digest),
        commands: validatorCommands,
      },
    });
  } catch {
    return degradedWorkerDiagnostics();
  }
}

export function buildWorkerDiagnosticsInternal(options) {
  try {
    return buildWorkerDiagnostics(options);
  } catch {
    return degradedWorkerDiagnostics();
  }
}

export async function superviseChildProcessInternal({
  command,
  args,
  cwd,
  env,
  input,
  signal,
  spawnImpl,
  timeoutMs,
  forceKillAfterMs = 5_000,
}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Worker timeout must be finite and positive.");
  return new Promise((resolve, reject) => {
    let child;
    let stdout = "";
    let stderr = "";
    let closed = false;
    let timedOut = false;
    let terminationRequested = false;
    let forceTimer = null;
    const finish = (result) => {
      if (closed) return;
      closed = true;
      clearTimeout(timeoutTimer);
      if (forceTimer) clearTimeout(forceTimer);
      signal?.removeEventListener("abort", forwardAbort);
      resolve({ ...result, stdout, stderr, timedOut, terminationRequested });
    };
    const terminate = (reason) => {
      if (closed || terminationRequested) return;
      terminationRequested = true;
      timedOut = reason === "timeout";
      try {
        child?.kill("SIGTERM");
      } catch (error) {
        stderr += `\n${error instanceof Error ? error.message : String(error)}`;
      }
      forceTimer = setTimeout(() => {
        if (!closed) {
          try {
            child?.kill("SIGKILL");
          } catch (error) {
            stderr += `\n${error instanceof Error ? error.message : String(error)}`;
          }
        }
      }, forceKillAfterMs);
      forceTimer.unref?.();
    };
    const forwardAbort = () => terminate("cancelled");
    const timeoutTimer = setTimeout(() => terminate("timeout"), timeoutMs);
    timeoutTimer.unref?.();
    try {
      if (signal?.aborted) {
        clearTimeout(timeoutTimer);
        reject(signal.reason ?? new Error("Codex run cancelled."));
        return;
      }
      child = spawnImpl(command, args, {
        cwd,
        env,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
      signal?.addEventListener("abort", forwardAbort, { once: true });
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", (error) => {
        stderr += `\n${error instanceof Error ? error.message : String(error)}`;
        finish({ code: -1, closeSignal: null });
      });
      child.on("close", (code, closeSignal) => finish({
        code: code ?? -1,
        closeSignal: closeSignal ?? null,
      }));
      child.stdin.end(input);
    } catch (error) {
      clearTimeout(timeoutTimer);
      if (forceTimer) clearTimeout(forceTimer);
      signal?.removeEventListener("abort", forwardAbort);
      reject(error);
    }
  });
}

export async function runCodexExecInternal({
  engine, contract, grant, capability, prompt, signal, spawnImpl,
  validationRunner, now = new Date(),
  parentEnvironment = process.env,
  codexHome,
  pilotPolicy = PILOT_MODE,
  sandboxInspector,
}) {
  const state = readControllerStateInternal(engine.stateDirectory);
  const validated = assertCapabilityAgainstStateInternal(capability, {
    engine, state, contract, grant, action: capability.action, now,
  });
  if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE) throw new Error("Controller kill switch is active.");
  const generalAuthorized = state.activation.authorized
    && validated.grant.activation.autonomous
    && validated.grant.activation.worker_dispatch
    && validated.grant.permissions.worker_dispatch;
  const oneTimePilotAuthorized = isConsumedSyntheticPilotRunInternal(
    state,
    validated.grant,
    validated.run,
  );
  if (!generalAuthorized && !oneTimePilotAuthorized) {
    throw new Error("Controller activation/worker dispatch is not authorized.");
  }
  assertNoSecretsDeep(contract, "Task Contract");
  assertNoSecretsDeep(grant, "authorization Grant");
  assertNoSecretValues(prompt, "worker prompt");
  const authoritativePrompt = buildAuthoritativeWorkerPromptInternal(prompt, validated);
  assertNoSecretValues(authoritativePrompt, "authoritative worker prompt");
  const effectivePilotPolicy = oneTimePilotAuthorized
    ? oneTimePilotPolicy(state.pilot_activation)
    : pilotPolicy;
  const launch = preparePilotWorkerLaunch({
    contract: validated.contract,
    grant: validated.grant,
    capability: validated.capability,
    repoRoot: engine.repoRoot,
    parentEnvironment,
    codexHome,
    policy: effectivePilotPolicy,
    sandboxInspector,
  });
  const serializedOutputSchema = serializeWorkerOutputSchemaInternal();
  markRunStartedInternal({ engine, contract, grant, capability, now });

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-codex-run-"));
  const schemaPath = path.join(temporary, "worker-result.schema.json");
  const outputPath = path.join(temporary, "worker-result.json");
  fs.writeFileSync(schemaPath, serializedOutputSchema, { mode: 0o600 });
  const args = buildCodexExecArgsInternal({
    worktree: validated.grant.worktree_realpath,
    model: validated.capability.model,
    sandbox: validated.capability.sandbox,
    schemaPath,
    outputPath,
    securityArgs: launch.cli_security_args,
  });
  let result = { code: null, closeSignal: null, stdout: "", stderr: "" };
  let output = null;
  let outputValid = false;
  let events = [];
  let threadId = null;
  let parseFailure = null;
  try {
    result = await superviseChildProcessInternal({
      command: "codex",
      args,
      cwd: validated.grant.worktree_realpath,
      env: launch.process_environment,
      input: authoritativePrompt,
      signal,
      spawnImpl,
      timeoutMs: validated.grant.limits.timeout_seconds * 1000,
    });
    try {
      assertNoSecretValues(result.stdout, "worker stdout");
      assertNoSecretValues(result.stderr, "worker stderr");
      const parsedJsonl = parseJsonlWithDiagnosticsInternal(result.stdout);
      events = parsedJsonl.events;
      parseFailure = parsedJsonl.parse_failure;
      assertNoSecretsDeep(events, "worker JSONL events");
      try {
        threadId = threadIdFromEventsInternal(events);
      } catch (error) {
        parseFailure ??= redactSecrets(error instanceof Error ? error.message : String(error));
      }
      if (parseFailure === null) {
        if (!fs.existsSync(outputPath)) throw new Error("Codex final structured output is missing.");
        output = WorkerResultSchema.parse(JSON.parse(fs.readFileSync(outputPath, "utf8")));
        assertNoSecretsDeep(output, "worker structured result");
        assertPilotWorkerRequestedActions(output.requested_actions);
        const {
          one_time_pilot_activation_id: _pilotActivationId,
          ...baseRunIdentity
        } = validated.run;
        const bound = bindReportedThread(baseRunIdentity, threadId);
        if (output.task_key !== bound.task_key || output.run_id !== bound.run_id || output.role_id !== bound.role_id) {
          throw new Error("Worker output does not match authoritative controller identity.");
        }
        outputValid = true;
      }
    } catch (error) {
      parseFailure ??= redactSecrets(error instanceof Error ? error.message : String(error));
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
    const structuredOutputPresent = fs.existsSync(outputPath);
    const workerDiagnostics = buildWorkerDiagnosticsInternal({
      result,
      events,
      threadId,
      parseFailure,
      structuredOutputPresent,
      outputValid,
      validationEvidence,
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
      workerDiagnostics,
      now,
    });
    const response = {
      authoritative_status: completed.status,
      authoritative_head_sha: completed.head_sha,
      output: output ? sanitizeForLog(output) : null,
      advisory_changed_files: output?.changed_files ?? [],
      actual_changes: scopeEvidence,
      validation_evidence: validationEvidence,
      events: sanitizeForLog(events),
      parse_failure: parseFailure,
      stderr: redactSecrets(result.stderr),
      timed_out: result.timedOut,
      termination_requested: result.terminationRequested,
      worker_security_profile: launch.profile,
      sandbox_evidence: launch.sandbox_evidence,
      identity: completed,
    };
    if (workerDiagnostics) response.worker_diagnostics = workerDiagnostics;
    return response;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
