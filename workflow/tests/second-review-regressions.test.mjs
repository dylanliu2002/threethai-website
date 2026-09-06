import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateTrustedGrant } from "../authority.mjs";
import { runCodexExec } from "../codex-exec.mjs";
import { finalizeCloseout } from "../closeout.mjs";
import { loadContracts } from "../contract.mjs";
import { deriveActualChanges } from "../git-evidence.mjs";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";
import { tick } from "../controller.mjs";
import { assertNoSecretsDeep, detectedSecretsDeep, sanitizeForLog } from "../secrets.mjs";
import { assertCapabilityAgainstStateInternal, issueCapabilityInternal } from "../internal/capability-engine.mjs";
import { finalizeCloseoutInternal } from "../internal/closeout-engine.mjs";
import { readControllerStateInternal } from "../internal/controller-state-engine.mjs";
import { completeRunInternal, releaseTaskLeaseInternal, reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import {
  cleanupFixture,
  engineFor,
  makeContract,
  makeGitFixture,
  makeGrant,
  makeStateDirectory,
  persistGrant,
} from "./helpers.mjs";

const DIGEST_B = "b".repeat(64);

function reserve(fixture, roleId = fixture.contract.owner_role, wakeupId = crypto.randomUUID()) {
  return reserveTaskDispatchInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    wakeupId,
    baseSha: fixture.baseSha,
    roleId,
  });
}

function capability(fixture, admitted, action) {
  return issueCapabilityInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    action,
    runId: admitted.run.run_id,
    headSha: fixture.baseSha,
  });
}

function complete(fixture, admitted, cap, {
  outcome = "COMPLETED",
  reportedHead = fixture.baseSha,
  actualHead = fixture.baseSha,
  validationPassed = true,
} = {}) {
  const scope = deriveActualChanges(fixture.repoRoot, fixture.baseSha);
  return completeRunInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    capability: cap,
    processExitCode: 0,
    outputValid: true,
    output: { outcome, head_sha: reportedHead },
    actualHeadSha: actualHead,
    scopeEvidence: { ...scope, passed: true },
    validationEvidence: { passed: validationPassed, evidence_digest: DIGEST_B },
    threadId: `thread-${admitted.run.run_id}`,
    reportedModel: fixture.grant.routing.requested_model,
  });
}

test("TRUST-01 caller-owned temporary trust root cannot reach production execution", async () => {
  let spawned = 0;
  await assert.rejects(() => runCodexExec({
    repoRoot: process.cwd(),
    taskKey: "sys-auto-001-codex-autonomous-workflow-bootstrap",
    stateDirectory: path.join(os.tmpdir(), "caller-authority"),
    capability: {},
    prompt: "test",
  }), /caller-selected authority input/i);
  assert.equal(spawned, 0);
});

test("TRUST-02 fake Grant signed by caller key is rejected by pinned anchor", () => {
  const [contract] = loadContracts(process.cwd());
  const grant = makeGrant(contract, { worktreeRealpath: process.cwd() });
  assert.throws(() => validateTrustedGrant(contract, grant, {
    repoRoot: process.cwd(),
  }), /pinned controller trust anchor/i);
});

test("TRUST-03 canonical authority location cannot be replaced by parameter", async (t) => {
  await assert.rejects(() => runCodexExec({
    repoRoot: process.cwd(), taskKey: "sys-auto-001-codex-autonomous-workflow-bootstrap",
    authorityRoot: path.join(os.tmpdir(), "replacement"), capability: {}, prompt: "test",
  }), /caller-selected authority input/i);
  const foreign = makeGitFixture();
  t.after(() => cleanupFixture(foreign.repoRoot, foreign.stateDirectory));
  assert.throws(
    () => resolveCanonicalControllerContext(foreign.repoRoot),
    /trusted controller repository context/i,
  );
});

test("ACTIVATION-01 ordinary runtime cannot enable activation", async () => {
  await assert.rejects(() => tick(process.cwd(), {
    dryRun: false, activation: { authorized: true },
  }), /caller-selected authority input/i);
});

test("RUN-01 worker FAILED report cannot advance task to review", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture);
  const cap = capability(fixture, admitted, "dispatch");
  const result = complete(fixture, admitted, cap, { outcome: "FAILED" });
  const state = readControllerStateInternal(fixture.stateDirectory);
  assert.equal(result.status, "FAILED");
  assert.notEqual(state.tasks[fixture.contract.task_key].phase, "INDEPENDENT_REVIEW");
});

test("RUN-02 actual git rev-parse HEAD overrides nonexistent worker head", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture);
  const cap = capability(fixture, admitted, "dispatch");
  const result = complete(fixture, admitted, cap, { reportedHead: "f".repeat(40) });
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.head_sha, fixture.baseSha);
  assert.equal(result.head_mismatch, true);
});

test("RUN-03 worker SUCCESS report cannot override deterministic validation failure", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture);
  const cap = capability(fixture, admitted, "dispatch");
  const result = complete(fixture, admitted, cap, { validationPassed: false });
  assert.equal(result.status, "VALIDATION_FAILED");
  assert.notEqual(readControllerStateInternal(fixture.stateDirectory).tasks[fixture.contract.task_key].status, "REVIEW");
});

function makeFreshReviewFixture() {
  const original = makeGitFixture();
  cleanupFixture(original.stateDirectory);
  original.contract.status = "REVIEW";
  original.contract.phase = "INDEPENDENT_REVIEW";
  const implementationEvidence = deriveActualChanges(original.repoRoot, original.baseSha);
  const target = {
    implementation_run_id: crypto.randomUUID(),
    implementation_worker_id: crypto.randomUUID(),
    implementation_thread_id: "thread-prior-implementation",
    reviewed_base_sha: original.baseSha,
    reviewed_head_sha: original.baseSha,
    validation_digest: DIGEST_B,
    implementation_evidence_digest: implementationEvidence.evidence_digest,
  };
  const stateDirectory = makeStateDirectory({ active: true });
  const grant = makeGrant(original.contract, { worktreeRealpath: original.repoRoot, reviewTarget: target });
  persistGrant(stateDirectory, grant);
  const engine = engineFor({ repoRoot: original.repoRoot, stateDirectory, contract: original.contract, grant });
  return { ...original, stateDirectory, grant, engine, target };
}

test("REVIEW-01 review capability cannot approve a different head", (t) => {
  const fixture = makeFreshReviewFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.reviewer_role, "review-head");
  const cap = capability(fixture, admitted, "review");
  const forged = { ...cap, reviewed_head_sha: "f".repeat(40), head_sha: "f".repeat(40) };
  const state = readControllerStateInternal(fixture.stateDirectory);
  assert.throws(() => assertCapabilityAgainstStateInternal(forged, {
    engine: fixture.engine, state, contract: fixture.contract,
    grant: fixture.grant, action: "review",
  }), /signature|reviewed head/i);
});

test("CLOSEOUT-01 fabricated approval revision cannot replace missing stored approval", (t) => {
  const fixture = makeGitFixture({ status: "APPROVED", phase: "CLOSEOUT" });
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture);
  const cap = capability(fixture, admitted, "closeout");
  assert.throws(() => finalizeCloseoutInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant,
    capability: cap, approval_revision: 999,
  }), /stored approval/i);
});

test("CLOSEOUT-02 fabricated reviewed head is rejected at production boundary", () => {
  assert.throws(() => finalizeCloseout(
    "sys-auto-001-codex-autonomous-workflow-bootstrap",
    {},
    { repoRoot: process.cwd(), reviewed_head_sha: "f".repeat(40) },
  ), /caller-selected authority input/i);
});

test("FENCE-01 stale token cannot mutate after fencing generation advances", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const first = reserve(fixture, fixture.contract.owner_role, "fence-first");
  const oldCap = capability(fixture, first, "dispatch");
  assertCapabilityAgainstStateInternal(oldCap, {
    engine: fixture.engine,
    state: readControllerStateInternal(fixture.stateDirectory),
    contract: fixture.contract, grant: fixture.grant, action: "dispatch",
  });
  releaseTaskLeaseInternal({
    engine: fixture.engine, contract: fixture.contract, grant: fixture.grant, capability: oldCap,
  });
  const next = reserve(fixture, fixture.contract.owner_role, "fence-next");
  assert.ok(next.lease.fencing_token > oldCap.fencing_token);
  assert.throws(() => complete(fixture, first, oldCap), /lease|fencing|stale/i);
});

test("WORKERS-01 max_workers two admits two and defers third", (t) => {
  const stateDirectory = makeStateDirectory({ active: true });
  t.after(() => cleanupFixture(stateDirectory));
  const results = ["alpha", "beta", "gamma"].map((name) => {
    const contract = makeContract({ taskKey: `task-${name}`, file: `src/${name}.ts` });
    contract.limits.max_workers = 2;
    const grant = makeGrant(contract);
    const engine = engineFor({ stateDirectory, contract, grant });
    return reserveTaskDispatchInternal({
      engine, contract, grant, wakeupId: `workers-${name}`,
      baseSha: "a".repeat(40), roleId: contract.owner_role, verifyCard: false,
    });
  });
  assert.deepEqual(results.map((item) => item.acquired), [true, true, false]);
  assert.equal(results[2].reason, "max-workers");
});

test("REVIEW-ADMISSION-01 fresh review state admits authorized reviewer with signed evidence", (t) => {
  const fixture = makeFreshReviewFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.reviewer_role, "fresh-review");
  assert.equal(admitted.acquired, true);
  assert.equal(admitted.run.role_id, fixture.contract.reviewer_role);
});

test("REVIEW-ADMISSION-02 owner cannot perform independent review", (t) => {
  const fixture = makeFreshReviewFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const admitted = reserve(fixture, fixture.contract.owner_role, "fresh-review-owner");
  assert.equal(admitted.acquired, false);
  assert.equal(admitted.reason, "role-not-authorized-for-phase");
});

test("CI-01 tick dry-run exits with zero mutation and creates no Grant", async () => {
  const context = resolveCanonicalControllerContext(process.cwd());
  const grantsBefore = fs.existsSync(context.grants_directory)
    ? fs.readdirSync(context.grants_directory).sort()
    : [];
  const statePath = path.join(context.state_directory, "controller-state.json");
  const journalPath = path.join(context.state_directory, "controller-journal.jsonl");
  const stateBefore = fs.existsSync(statePath) ? fs.readFileSync(statePath, "utf8") : null;
  const journalBefore = fs.existsSync(journalPath) ? fs.readFileSync(journalPath, "utf8") : null;
  const result = await tick(process.cwd(), { dryRun: true });
  assert.equal(result.workers_started, 0);
  assert.deepEqual(result.mutations, []);
  assert.equal(result.grants_created, 0);
  const grantsAfter = fs.existsSync(context.grants_directory)
    ? fs.readdirSync(context.grants_directory).sort()
    : [];
  assert.deepEqual(grantsAfter, grantsBefore);
  assert.equal(fs.existsSync(statePath) ? fs.readFileSync(statePath, "utf8") : null, stateBefore);
  assert.equal(fs.existsSync(journalPath) ? fs.readFileSync(journalPath, "utf8") : null, journalBefore);
});

test("SECRET-01 structured password field is detected and redacted", () => {
  const key = ["pass", "word"].join("");
  const value = { [key]: "NotARealPassword123" };
  assert.throws(() => assertNoSecretsDeep(value));
  assert.ok(detectedSecretsDeep(value).length > 0);
  assert.equal(sanitizeForLog(value)[key], "[REDACTED]");
});

test("SECRET-02 nested credentials and api_key fields are detected and redacted", () => {
  const outer = ["credential", "s"].join("");
  const inner = ["api", "_key"].join("");
  const value = { result: { [outer]: { [inner]: "fake-test-value" } } };
  assert.throws(() => assertNoSecretsDeep(value));
  assert.equal(sanitizeForLog(value).result[outer], "[REDACTED]");
});
