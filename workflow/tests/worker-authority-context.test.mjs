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
import { issueCapabilityInternal } from "../internal/capability-engine.mjs";
import {
  enableSyntheticPilotOnceInternal,
  readControllerStateInternal,
} from "../internal/controller-state-engine.mjs";
import { reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import { issueSyntheticPilotGrantInternal } from "../internal/pilot-admin-engine.mjs";
import { runCodexExecInternal } from "../internal/run-engine.mjs";
import {
  createTestEngineWithAuthority,
  testAuthorityMaterial,
} from "../testing/controller-harness.mjs";
import { cleanupFixture, makeStateDirectory } from "./helpers.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const taskKey = "sys-auto-pilot-001-synthetic-fixture";
const outputRelativePath = "workflow/fixtures/pilot/output/synthetic-result.json";
const contractTemplatePath = path.join(
  sourceRoot,
  "tasks/machine/sys-auto-pilot-001-synthetic-fixture.json",
);
const cardSourcePath = path.join(sourceRoot, "tasks/sys-auto-pilot-001-synthetic-fixture.md");
const expectedOutputPath = path.join(
  sourceRoot,
  "workflow/fixtures/pilot/expected/synthetic-result.json",
);

function git(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function workerEnvironment(codexHome) {
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

function fixture() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-worker-context-repo-"));
  git(repoRoot, ["init", "-b", "codex/sys-auto-pilot-001-synthetic-fixture"]);
  git(repoRoot, ["config", "user.name", "dylanliu2002"]);
  git(repoRoot, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(repoRoot, "tasks"), { recursive: true });
  fs.copyFileSync(cardSourcePath, path.join(repoRoot, "tasks", path.basename(cardSourcePath)));
  git(repoRoot, ["add", "."]);
  git(repoRoot, ["commit", "-m", "test: worker authority context fixture"]);
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
    codexHome: fs.mkdtempSync(path.join(os.tmpdir(), "threethai-worker-context-codex-")),
    contract,
    grant,
    activation,
    admitted,
    capability,
    engine,
    head,
  };
}

function runtimeContextFromPrompt(prompt) {
  const match = prompt.match(
    /<controller_runtime_context>\r?\n([\s\S]*?)\r?\n<\/controller_runtime_context>/,
  );
  return match ? JSON.parse(match[1]) : null;
}

function recognizingWorker(fixtureState, observation) {
  return (_command, args) => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => true;
    child.stdin = {
      end: (prompt) => {
        setImmediate(() => {
          observation.prompt = prompt;
          observation.context = runtimeContextFromPrompt(prompt);
          const expected = {
            task_key: taskKey,
            run_id: fixtureState.admitted.run.run_id,
            activation_id: fixtureState.activation.activation_id,
            grant_authorization_id: fixtureState.grant.authorization_id,
            capability_id: fixtureState.capability.capability_id,
            capability_action: "dispatch",
            lease_id: fixtureState.admitted.lease.lease_id,
            fencing_token: fixtureState.admitted.lease.fencing_token,
            role_id: fixtureState.admitted.run.role_id,
          };
          observation.recognized = JSON.stringify(observation.context) === JSON.stringify(expected);
          const threadId = crypto.randomUUID();
          const outputIndex = args.indexOf("--output-last-message");
          if (observation.recognized) {
            const outputPath = path.join(fixtureState.repoRoot, outputRelativePath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.copyFileSync(expectedOutputPath, outputPath);
            fs.writeFileSync(args[outputIndex + 1], JSON.stringify({
              schema_version: "2.0.0",
              task_key: taskKey,
              run_id: fixtureState.admitted.run.run_id,
              role_id: fixtureState.admitted.run.role_id,
              outcome: "COMPLETED",
              phase: "QUEUED",
              base_sha: fixtureState.head,
              head_sha: fixtureState.head,
              summary: "Created the authorized deterministic synthetic output.",
              changed_files: [outputRelativePath],
              validation: [{
                name: "synthetic output contract",
                outcome: "PASS",
                evidence: "Expected deterministic bytes were written.",
              }],
              findings: [],
              requested_actions: [],
            }));
          }
          child.stdout.end([
            JSON.stringify({ type: "thread.started", thread_id: threadId }),
            JSON.stringify({ type: "turn.started" }),
            JSON.stringify({ type: "turn.completed" }),
          ].join("\n"));
          child.stderr.end("");
          child.emit("close", observation.recognized ? 0 : 1, null);
        });
      },
    };
    return child;
  };
}

test("WORKER-AUTH-CONTEXT-01 admitted pilot worker receives exact authority and executes", async (t) => {
  const fixtureState = fixture();
  t.after(() => cleanupFixture(
    fixtureState.repoRoot,
    fixtureState.stateDirectory,
    fixtureState.codexHome,
  ));
  const observation = { prompt: null, context: null, recognized: false };
  const result = await runCodexExecInternal({
    engine: fixtureState.engine,
    contract: fixtureState.contract,
    grant: fixtureState.grant,
    capability: fixtureState.capability,
    prompt: `Execute only machine task ${taskKey}.`,
    spawnImpl: recognizingWorker(fixtureState, observation),
    validationRunner: () => ({
      exit_code: 0,
      signal: null,
      output_digest: "a".repeat(64),
    }),
    parentEnvironment: workerEnvironment(fixtureState.codexHome),
    sandboxInspector: sandboxEvidence,
  });

  assert.equal(observation.recognized, true);
  assert.match(observation.prompt, /admission and capability validation have already succeeded/i);
  assert.match(observation.prompt, /do not invent another run identity/i);
  assert.equal(observation.prompt.includes(fixtureState.capability.signature), false);
  assert.equal(result.parse_failure, null);
  assert.equal(result.output.outcome, "COMPLETED");
  assert.deepEqual(result.output.requested_actions, []);
  assert.equal(result.authoritative_status, "SUCCESS");
  assert.equal(fs.existsSync(path.join(fixtureState.repoRoot, outputRelativePath)), true);

  const state = readControllerStateInternal(fixtureState.stateDirectory);
  assert.equal(state.runs[fixtureState.admitted.run.run_id].status, "SUCCESS");
  assert.equal(
    state.runs[fixtureState.admitted.run.run_id].one_time_pilot_activation_id,
    fixtureState.activation.activation_id,
  );
});
