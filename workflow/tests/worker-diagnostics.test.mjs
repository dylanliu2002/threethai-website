import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateTaskContract } from "../contract.mjs";
import { deriveActualChanges } from "../git-evidence.mjs";
import { issueCapabilityInternal } from "../internal/capability-engine.mjs";
import {
  enableSyntheticPilotOnceInternal,
  setActivationForAdministrationInternal,
} from "../internal/controller-state-engine.mjs";
import {
  completeRunInternal,
  reserveTaskDispatchInternal,
} from "../internal/lease-engine.mjs";
import {
  buildWorkerDiagnosticsInternal,
  runCodexExecInternal,
} from "../internal/run-engine.mjs";
import { issueSyntheticPilotGrantInternal } from "../internal/pilot-admin-engine.mjs";
import {
  createTestEngineWithAuthority,
  testAuthorityMaterial,
} from "../testing/controller-harness.mjs";
import {
  cleanupFixture,
  makeGitFixture,
  makeStateDirectory,
} from "./helpers.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const taskKey = "sys-auto-pilot-001-synthetic-fixture";
const contractTemplatePath = path.join(
  sourceRoot,
  "tasks",
  "machine",
  "sys-auto-pilot-001-synthetic-fixture.json",
);
const cardSourcePath = path.join(sourceRoot, "tasks", "sys-auto-pilot-001-synthetic-fixture.md");

function git(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function testEnvironment(codexHome) {
  return {
    PATH: process.env.PATH ?? path.dirname(process.execPath),
    PATHEXT: process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD",
    SYSTEMROOT: process.env.SYSTEMROOT ?? "C:\\Windows",
    WINDIR: process.env.WINDIR ?? "C:\\Windows",
    COMSPEC: process.env.COMSPEC ?? "C:\\Windows\\System32\\cmd.exe",
    TEMP: process.env.TEMP ?? os.tmpdir(),
    TMP: process.env.TMP ?? os.tmpdir(),
    CODEX_HOME: codexHome,
  };
}

function sandboxEvidence() {
  return {
    passed: true,
    backend: "elevated",
    network_profile: "restricted-proxy",
    sandbox_username: "CodexSandboxOffline",
    network_access: true,
    proxy_enforced: true,
    allow_local_binding: false,
    cli_version: "test",
    marker_version: 1,
  };
}

function pilotFixture() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-worker-diagnostics-repo-"));
  git(repoRoot, ["init", "-b", "codex/sys-auto-pilot-001-synthetic-fixture"]);
  git(repoRoot, ["config", "user.name", "dylanliu2002"]);
  git(repoRoot, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(repoRoot, "tasks"), { recursive: true });
  fs.copyFileSync(cardSourcePath, path.join(repoRoot, "tasks", path.basename(cardSourcePath)));
  git(repoRoot, ["add", "."]);
  git(repoRoot, ["commit", "-m", "test: diagnostic fixture"]);
  const head = git(repoRoot, ["rev-parse", "HEAD"]);
  const cardBlobSha = git(repoRoot, ["hash-object", "tasks/sys-auto-pilot-001-synthetic-fixture.md"]);
  const rawContract = JSON.parse(fs.readFileSync(contractTemplatePath, "utf8"));
  rawContract.card_blob_sha = cardBlobSha;
  rawContract.request_provenance.base_sha = head;
  const contract = validateTaskContract(rawContract, { repoRoot });
  const authority = testAuthorityMaterial();
  const grant = issueSyntheticPilotGrantInternal({
    contract,
    privateKeyPem: authority.privateKeyPem,
    publicKeyPem: authority.publicKeyPem,
    worktreeRealpath: repoRoot,
    now: new Date(),
  });
  const stateDirectory = makeStateDirectory({ active: false });
  const engine = createTestEngineWithAuthority({
    repoRoot,
    stateDirectory,
    taskKey,
    grant,
    authority,
  });
  const activation = enableSyntheticPilotOnceInternal(stateDirectory, {
    request: {
      human_authorization_id: crypto.randomUUID(),
      task_key: taskKey,
      max_workers: 1,
      publishing: false,
      network: true,
      production: false,
      dns: false,
      deployment: false,
    },
    authorizationId: grant.authorization_id,
    contractDigest: grant.contract_digest,
    cardBlobSha: grant.card_blob_sha,
  });
  const admitted = reserveTaskDispatchInternal({
    engine,
    contract,
    grant,
    wakeupId: crypto.randomUUID(),
    baseSha: head,
    roleId: contract.owner_role,
    maxWorkersCeiling: 1,
    pilotActivationId: activation.activation_id,
  });
  assert.equal(admitted.acquired, true);
  const capability = issueCapabilityInternal({
    engine,
    contract,
    grant,
    action: "dispatch",
    runId: admitted.run.run_id,
    headSha: head,
  });
  return {
    repoRoot,
    stateDirectory,
    codexHome: fs.mkdtempSync(path.join(os.tmpdir(), "threethai-worker-diagnostics-codex-")),
    contract,
    grant,
    engine,
    admitted,
    capability,
    head,
  };
}

function fakeSpawn({ events, stderr = "", code = 0, output }) {
  return (_command, args) => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => true;
    child.stdin = {
      end: () => {
        setImmediate(() => {
          if (output) {
            const outputIndex = args.indexOf("--output-last-message");
            fs.writeFileSync(args[outputIndex + 1], JSON.stringify(output));
          }
          child.stdout.end(`${events.map((event) => JSON.stringify(event)).join("\n")}\n`);
          child.stderr.end(stderr);
          child.emit("close", code, null);
        });
      },
    };
    return child;
  };
}

function journalEvents(stateDirectory) {
  return fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl"), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function validationRunner(exitCode) {
  return () => ({
    exit_code: exitCode,
    signal: null,
    output_digest: (exitCode === 0 ? "a" : "b").repeat(64),
  });
}

test("WORKER-DIAGNOSTICS-01 abnormal exit persists sanitized lifecycle diagnostics", async (t) => {
  const fixture = pilotFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory, fixture.codexHome));
  const threadId = crypto.randomUUID();
  const result = await runCodexExecInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    capability: fixture.capability,
    prompt: "perform bounded test work",
    spawnImpl: fakeSpawn({
      events: [
        { type: "thread.started", thread_id: threadId },
        { type: "turn.started" },
        { type: "turn.failed", error: { message: "model stream failed" } },
      ],
      stderr: "worker exited after the model stream failed",
      code: 1,
    }),
    validationRunner: validationRunner(1),
    parentEnvironment: testEnvironment(fixture.codexHome),
    sandboxInspector: sandboxEvidence,
  });

  assert.equal(result.authoritative_status, "FAILED");
  assert.equal(result.worker_diagnostics.worker_exit_code, 1);
  assert.equal(result.worker_diagnostics.termination_reason, "NONZERO_EXIT");
  assert.equal(result.worker_diagnostics.thread_id, threadId);
  assert.equal(result.worker_diagnostics.thread_lifecycle_status, "FAILED");
  assert.equal(result.worker_diagnostics.model_stage_status, "FAILED");
  assert.equal(result.worker_diagnostics.structured_output_present, false);
  assert.equal(result.worker_diagnostics.validator_result.status, "FAIL");
  assert.match(result.worker_diagnostics.sanitized_stderr, /model stream failed/);
  assert.match(result.worker_diagnostics.sanitized_error, /model stream failed/);

  const completed = journalEvents(fixture.stateDirectory)
    .findLast((event) => event.type === "run.completed");
  assert.deepEqual(completed.payload.worker_diagnostics, result.worker_diagnostics);
});

test("WORKER-DIAGNOSTICS-02 diagnostic journal evidence remains append-only", async (t) => {
  const fixture = pilotFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory, fixture.codexHome));
  await runCodexExecInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    capability: fixture.capability,
    prompt: "perform bounded test work",
    spawnImpl: fakeSpawn({
      events: [
        { type: "thread.started", thread_id: crypto.randomUUID() },
        { type: "turn.started" },
        { type: "turn.failed", error: { message: "synthetic failure" } },
      ],
      stderr: "synthetic failure",
      code: 1,
    }),
    validationRunner: validationRunner(1),
    parentEnvironment: testEnvironment(fixture.codexHome),
    sandboxInspector: sandboxEvidence,
  });
  const journalPath = path.join(fixture.stateDirectory, "controller-journal.jsonl");
  const before = fs.readFileSync(journalPath, "utf8");
  const diagnosticEvent = journalEvents(fixture.stateDirectory)
    .findLast((event) => event.type === "run.completed");

  setActivationForAdministrationInternal(fixture.stateDirectory, false, {
    source: "diagnostic append-only test",
  });

  const after = fs.readFileSync(journalPath, "utf8");
  const preserved = journalEvents(fixture.stateDirectory)
    .find((event) => event.event_id === diagnosticEvent.event_id);
  assert.ok(after.startsWith(before));
  assert.deepEqual(preserved, diagnosticEvent);
  assert.ok(preserved.payload.worker_diagnostics);
});

test("WORKER-DIAGNOSTICS-03 successful execution behavior remains unchanged", (t) => {
  const threadId = crypto.randomUUID();
  const diagnostics = buildWorkerDiagnosticsInternal({
    result: {
      code: 0,
      closeSignal: null,
      stderr: "",
      timedOut: false,
      terminationRequested: false,
    },
    events: [
      { type: "thread.started", thread_id: threadId },
      { type: "turn.started" },
      { type: "turn.completed" },
    ],
    threadId,
    parseFailure: null,
    structuredOutputPresent: true,
    outputValid: true,
    validationEvidence: {
      passed: true,
      evidence_digest: "a".repeat(64),
      commands: [],
    },
  });
  assert.equal(diagnostics, null);

  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserveTaskDispatchInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    wakeupId: crypto.randomUUID(),
    baseSha: fixture.baseSha,
    roleId: fixture.contract.owner_role,
  });
  assert.equal(admitted.acquired, true);
  const capability = issueCapabilityInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    action: "dispatch",
    runId: admitted.run.run_id,
    headSha: fixture.baseSha,
  });
  const scope = deriveActualChanges(fixture.repoRoot, fixture.baseSha);
  const completed = completeRunInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    capability,
    processExitCode: 0,
    outputValid: true,
    output: { outcome: "COMPLETED", head_sha: fixture.baseSha },
    actualHeadSha: fixture.baseSha,
    scopeEvidence: { ...scope, passed: true },
    validationEvidence: {
      passed: true,
      evidence_digest: "b".repeat(64),
    },
    threadId,
    reportedModel: fixture.grant.routing.requested_model,
    workerDiagnostics: diagnostics,
  });
  assert.equal(completed.status, "SUCCESS");
  const completionEvent = journalEvents(fixture.stateDirectory)
    .findLast((event) => event.type === "run.completed");
  assert.deepEqual(
    Object.keys(completionEvent.payload).sort(),
    ["actual_head_sha", "snapshot", "status"],
  );
  assert.equal("worker_diagnostics" in completionEvent.payload, false);
});

test("WORKER-DIAGNOSTICS-04 diagnostic text is bounded and secret-redacted", () => {
  const secret = `sk-proj-${"x".repeat(32)}`;
  const diagnostics = buildWorkerDiagnosticsInternal({
    result: {
      code: 1,
      closeSignal: null,
      stderr: `${secret}${"z".repeat(5000)}`,
      timedOut: false,
      terminationRequested: false,
    },
    events: [{ type: "turn.failed", error: { message: secret } }],
    parseFailure: secret,
    structuredOutputPresent: false,
    outputValid: false,
    validationEvidence: {
      passed: false,
      evidence_digest: "c".repeat(64),
      commands: [],
    },
  });
  assert.equal(diagnostics.sanitized_stderr.includes(secret), false);
  assert.equal(diagnostics.sanitized_error.includes(secret), false);
  assert.match(diagnostics.sanitized_stderr, /REDACTED:openai-key/);
  assert.ok(diagnostics.sanitized_stderr.length <= 4096);
  assert.ok(diagnostics.sanitized_error.length <= 4096);
});
