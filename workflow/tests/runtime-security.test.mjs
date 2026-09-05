import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runCodexExec } from "../codex-exec.mjs";
import { tick } from "../controller.mjs";
import { issueCapabilityInternal } from "../internal/capability-engine.mjs";
import { readControllerStateInternal } from "../internal/controller-state-engine.mjs";
import { releaseTaskLeaseInternal, reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import { planPublishingInternal } from "../internal/publishing-engine.mjs";
import { reconcileRuntimeInternal } from "../internal/recovery-engine.mjs";
import { runCodexExecInternal } from "../internal/run-engine.mjs";
import { setTestActivation, testAuthorityMaterial } from "../testing/controller-harness.mjs";
import {
  cleanupFixture,
  engineFor,
  makeContract,
  makeGitFixture,
  makeGrant,
  makeStateDirectory,
  persistGrant,
} from "./helpers.mjs";

const contender = path.join(path.dirname(fileURLToPath(import.meta.url)), "lease-contender.mjs");

function reserve(fixture, roleId = fixture.contract.owner_role) {
  return reserveTaskDispatchInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    wakeupId: `wake-${Math.random()}`,
    baseSha: fixture.baseSha,
    roleId,
    repoRoot: fixture.repoRoot,
  });
}

test("EXEC-01 runCodexExec with activation disabled never invokes spawn", async (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture);
  const capability = issueCapabilityInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    action: "dispatch", runId: admitted.run.run_id, headSha: fixture.baseSha,
  });
  setTestActivation(fixture.stateDirectory, false, { source: "test-disable" });
  let spawned = 0;
  await assert.rejects(() => runCodexExecInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant, capability,
    prompt: "perform bounded test work", spawnImpl: () => { spawned += 1; },
  }), /activation/i);
  assert.equal(spawned, 0);
});

test("EXEC-02 caller cannot request danger-full-access", async () => {
  let spawned = 0;
  await assert.rejects(() => runCodexExec({
    sandbox: "danger-full-access",
  }), /caller-selected.*sandbox/i);
  assert.equal(spawned, 0);
});

test("EXEC-03 caller alternate model cwd or sandbox is rejected", async () => {
  await assert.rejects(() => runCodexExec({ model: "alternate" }), /caller-selected.*model/i);
  await assert.rejects(() => runCodexExec({ cwd: "C:/other" }), /caller-selected.*cwd/i);
});

function runContender(fixturePath, stateDirectory, wakeupId) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [contender, fixturePath, stateDirectory, wakeupId], {
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr));
      else resolve(JSON.parse(stdout.trim()));
    });
  });
}

test("LOCK-01 two separate controller processes produce exactly one task lease", async (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-contention-"));
  t.after(() => cleanupFixture(stateDirectory, fixtureDirectory));
  const contract = makeContract();
  const grant = makeGrant(contract);
  const fixturePath = path.join(fixtureDirectory, "fixture.json");
  fs.writeFileSync(fixturePath, JSON.stringify({ contract, grant, baseSha: "a".repeat(40), authority: testAuthorityMaterial() }));
  const results = await Promise.all([
    runContender(fixturePath, stateDirectory, "process-one"),
    runContender(fixturePath, stateDirectory, "process-two"),
  ]);
  assert.equal(results.filter((item) => item.acquired).length, 1);
  assert.equal(Object.keys(readControllerStateInternal(stateDirectory).runs).length, 1);
});

test("LOCK-02 overlapping paths serialize across separate controller processes", async (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-path-contention-"));
  t.after(() => cleanupFixture(stateDirectory, fixtureDirectory));
  const left = makeContract({ taskKey: "task-alpha", file: "src/shared.ts" });
  const right = makeContract({ taskKey: "task-beta", file: "SRC/shared.ts" });
  const files = [left, right].map((contract, index) => {
    const file = path.join(fixtureDirectory, `${index}.json`);
    fs.writeFileSync(file, JSON.stringify({ contract, grant: makeGrant(contract), baseSha: "a".repeat(40), authority: testAuthorityMaterial() }));
    return file;
  });
  const results = await Promise.all([
    runContender(files[0], stateDirectory, "path-one"),
    runContender(files[1], stateDirectory, "path-two"),
  ]);
  assert.equal(results.filter((item) => item.acquired).length, 1);
});

test("LEASE-01 stale worker publish after lease loss is rejected", (t) => {
  const fixture = makeGitFixture({ status: "APPROVED", phase: "CLOSEOUT" });
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture);
  const capability = issueCapabilityInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    action: "push", runId: admitted.run.run_id, headSha: fixture.baseSha,
  });
  releaseTaskLeaseInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant, capability,
  });
  assert.throws(() => planPublishingInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    capability, action: "push",
  }), /lease|stale/i);
});

test("RECOVERY-01 restart reconstructs active run lease locks and task state", (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  t.after(() => cleanupFixture(stateDirectory));
  const contract = makeContract();
  const grant = makeGrant(contract);
  const admitted = reserveTaskDispatchInternal({
    engine: engineFor({ stateDirectory, contract, grant }),
    contract, grant, wakeupId: "recover-one", baseSha: "a".repeat(40),
    roleId: contract.owner_role, verifyCard: false,
  });
  assert.equal(admitted.acquired, true);
  const recovered = reconcileRuntimeInternal(stateDirectory);
  assert.equal(recovered.run_count, 1);
  assert.equal(recovered.live_lease_count, 1);
  assert.ok(recovered.reservation_count >= 1);
  assert.equal(recovered.reconstructed, true);
});

test("RECOVERY-02 duplicate reconcile is idempotent with no duplicate run", (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  t.after(() => cleanupFixture(stateDirectory));
  const contract = makeContract();
  const grant = makeGrant(contract);
  reserveTaskDispatchInternal({
    engine: engineFor({ stateDirectory, contract, grant }),
    contract, grant, wakeupId: "recover-two", baseSha: "a".repeat(40),
    roleId: contract.owner_role, verifyCard: false,
  });
  const before = readControllerStateInternal(stateDirectory).revision;
  const first = reconcileRuntimeInternal(stateDirectory);
  const second = reconcileRuntimeInternal(stateDirectory);
  assert.equal(first.run_count, 1);
  assert.equal(second.run_count, 1);
  assert.equal(readControllerStateInternal(stateDirectory).revision, before);
  assert.deepEqual(second.mutations, []);
});

test("inactive non-dry-run tick starts no workers and performs no external mutation", async () => {
  const result = await tick(process.cwd(), { dryRun: false });
  assert.equal(result.workers_started, 0);
  assert.equal(result.github_mutations, 0);
  assert.equal(result.publishing_actions, 0);
});
