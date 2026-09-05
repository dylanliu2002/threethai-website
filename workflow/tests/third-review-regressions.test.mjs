import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateTrustedGrant } from "../authority.mjs";
import { validateControllerCapability } from "../capability.mjs";
import { runCodexExec } from "../codex-exec.mjs";
import { tick } from "../controller.mjs";
import { releaseTaskLease } from "../durable-leases.mjs";
import { deriveActualChanges } from "../git-evidence.mjs";
import { createRunIdentity } from "../identity.mjs";
import { assertNoSecretValues, sanitizeForLog, scanArtifactFiles } from "../secrets.mjs";
import { deriveValidationEvidence } from "../validation.mjs";
import { issueCapabilityInternal } from "../internal/capability-engine.mjs";
import {
  mutateControllerStateInternal,
  readControllerStateInternal,
  releaseStateMutexInternal,
} from "../internal/controller-state-engine.mjs";
import {
  completeRunInternal,
  releaseTaskLeaseInternal,
  reserveTaskDispatchInternal,
} from "../internal/lease-engine.mjs";
import {
  issueApprovalRecordInternal,
  recordIndependentReviewInternal,
  reviewEvidenceDigestInternal,
} from "../internal/review-engine.mjs";
import { testAuthorityMaterial } from "../testing/controller-harness.mjs";
import {
  cleanupFixture,
  makeContract,
  makeGitFixture,
  makeGrant,
  makeStateDirectory,
} from "./helpers.mjs";

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const leaseContender = path.join(sourceDirectory, "lease-contender.mjs");
const mutexHolder = path.join(sourceDirectory, "mutex-holder.mjs");
const VALIDATION_DIGEST = "9".repeat(64);
const FORMER_STALE_THRESHOLD_MS = 30_000;
const LONG_HOLD_MS = 31_000;
const PASSWORD_FIELD = ["pass", "word"].join("");
const API_KEY_FIELD = ["api", "_key"].join("");
const API_KEY_CAMEL_FIELD = ["api", "Key"].join("");
const CREDENTIALS_FIELD = ["credential", "s"].join("");
const TEST_PASSWORD_VALUE = ["NotAReal", "Password123"].join("");

function reserve(fixture, roleId, wakeupId) {
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

function complete(fixture, admitted, cap, outcome, threadId) {
  const scope = deriveActualChanges(fixture.repoRoot, fixture.baseSha);
  return completeRunInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    capability: cap,
    processExitCode: 0,
    outputValid: true,
    output: {
      outcome,
      head_sha: fixture.baseSha,
      summary: `reviewer authoritative outcome ${outcome}`,
      validation: [{ name: "review", outcome: "PASS", evidence: "checked exact head" }],
      findings: outcome === "APPROVED" ? [] : [{ severity: "BLOCKER", message: "blocked evidence" }],
      requested_actions: [],
    },
    actualHeadSha: fixture.baseSha,
    scopeEvidence: { ...scope, passed: true },
    validationEvidence: { passed: true, evidence_digest: VALIDATION_DIGEST },
    threadId,
    reportedModel: fixture.grant.routing.requested_model,
  });
}

function setupReview(t, outcome = "APPROVED") {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  const implementation = reserve(fixture, fixture.contract.owner_role, "third-implementation");
  const implementationCapability = capability(fixture, implementation, "dispatch");
  complete(fixture, implementation, implementationCapability, "COMPLETED", "thread-third-implementation");
  releaseTaskLeaseInternal({
    engine: fixture.engine,
    contract: fixture.contract,
    grant: fixture.grant,
    capability: implementationCapability,
  });
  const reviewer = reserve(fixture, fixture.contract.reviewer_role, "third-reviewer");
  const reviewerCapability = capability(fixture, reviewer, "review");
  const completed = complete(fixture, reviewer, reviewerCapability, outcome, "thread-third-reviewer");
  return {
    fixture,
    implementation,
    reviewer,
    reviewerCapability,
    review: structuredClone(completed.review_result),
  };
}

function assertRejectedWithoutMutation(env, review, pattern = /authoritative|exactly match|binding/i) {
  const before = readControllerStateInternal(env.fixture.stateDirectory).revision;
  assert.throws(() => recordIndependentReviewInternal(review, {
    engine: env.fixture.engine,
    contract: env.fixture.contract,
    grant: env.fixture.grant,
    capability: env.reviewerCapability,
  }), pattern);
  const after = readControllerStateInternal(env.fixture.stateDirectory);
  assert.equal(after.revision, before);
  assert.notEqual(after.tasks[env.fixture.contract.task_key].status, "APPROVED");
  assert.equal(Object.keys(after.approvals).length, 0);
}

test("REVIEW-BIND-01 capability run A cannot submit reviewer run B", (t) => {
  const env = setupReview(t);
  const runB = crypto.randomUUID();
  const workerB = crypto.randomUUID();
  const reviewB = {
    ...env.review,
    reviewer_run_id: runB,
    reviewer_worker_id: workerB,
    reviewer_thread_id: "thread-reviewer-b",
  };
  mutateControllerStateInternal(env.fixture.stateDirectory, {
    type: "test.reviewer-b", taskKey: env.fixture.contract.task_key, runId: runB,
  }, (state) => {
    state.runs[runB] = {
      ...structuredClone(state.runs[env.reviewer.run.run_id]),
      run_id: runB,
      worker_id: workerB,
      thread_id: reviewB.reviewer_thread_id,
      review_result: structuredClone(reviewB),
    };
  });
  assertRejectedWithoutMutation(env, reviewB);
});

test("REVIEW-BIND-02 stored BLOCKED outcome cannot be submitted as APPROVED", (t) => {
  const env = setupReview(t, "BLOCKED");
  assertRejectedWithoutMutation(env, { ...env.review, outcome: "APPROVED" });
});

test("REVIEW-BIND-03 capability from run A cannot accept evidence from run B", (t) => {
  const env = setupReview(t);
  const otherEvidence = ["evidence from another reviewer run"];
  assertRejectedWithoutMutation(env, {
    ...env.review,
    review_evidence: otherEvidence,
    review_evidence_digest: reviewEvidenceDigestInternal(otherEvidence),
  });
});

test("REVIEW-BIND-04 reviewer thread and worker identity mismatch is rejected", (t) => {
  const env = setupReview(t);
  assertRejectedWithoutMutation(env, {
    ...env.review,
    reviewer_thread_id: "thread-forged",
    reviewer_worker_id: crypto.randomUUID(),
  });
});

test("REVIEW-BIND-05 reviewed head mismatch is rejected", (t) => {
  const env = setupReview(t);
  assertRejectedWithoutMutation(env, { ...env.review, reviewed_head_sha: "f".repeat(40) });
});

test("APPROVAL-BIND-01 approval requires the exact authoritative accepted review", (t) => {
  const env = setupReview(t);
  const approveCapability = capability(env.fixture, env.reviewer, "approve");
  const before = readControllerStateInternal(env.fixture.stateDirectory).revision;
  assert.throws(() => issueApprovalRecordInternal({
    engine: env.fixture.engine,
    contract: env.fixture.contract,
    grant: env.fixture.grant,
    capability: approveCapability,
  }), /stored APPROVED review/i);
  const state = readControllerStateInternal(env.fixture.stateDirectory);
  assert.equal(state.revision, before);
  assert.equal(Object.keys(state.approvals).length, 0);
});

test("TIME-01 expired Grant cannot be revived with caller backdated now", () => {
  const fixture = makeGitFixture();
  try {
    const expired = structuredClone(fixture.grant);
    expired.provenance.expires_at = "2020-01-01T00:00:00.000Z";
    assert.throws(() => validateTrustedGrant(fixture.contract, expired, {
      repoRoot: fixture.repoRoot,
      now: new Date("2019-01-01T00:00:00.000Z"),
    }), /caller-selected authority input.*now/i);
  } finally {
    cleanupFixture(fixture.repoRoot, fixture.stateDirectory);
  }
});

test("TIME-02 expired capability cannot be revived with caller backdated now", () => {
  assert.throws(() => validateControllerCapability("task-alpha", {
    expires_at: "2020-01-01T00:00:00.000Z",
  }, {
    repoRoot: process.cwd(), action: "dispatch", now: new Date("2019-01-01T00:00:00.000Z"),
  }), /caller-selected authority input.*now/i);
});

test("TIME-03 expired lease cannot be revived with caller backdated now", () => {
  assert.throws(() => releaseTaskLease("task-alpha", {}, {
    repoRoot: process.cwd(), now: new Date("2019-01-01T00:00:00.000Z"),
  }), /caller-selected authority input.*now/i);
});

test("TIME-04 production privileged exports expose no caller authority clock", async () => {
  await assert.rejects(() => runCodexExec({ now: new Date(0) }), /caller-selected authority input.*now/i);
  await assert.rejects(() => tick(process.cwd(), { dryRun: false, clock: () => new Date(0) }), /caller-selected authority input.*clock/i);
  assert.throws(() => createRunIdentity({}, {}, {}, { now: new Date(0) }), /caller-selected authority input.*now/i);
  assert.throws(() => deriveValidationEvidence({ dateNow: () => 0 }), /caller-selected authority input.*dateNow/i);
});

function launchJsonProcess(script, args) {
  const child = spawn(process.execPath, [script, ...args], {
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  const messages = [];
  const waiters = [];
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    let newline;
    while ((newline = stdout.indexOf("\n")) >= 0) {
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      messages.push(message);
      for (const waiter of waiters.splice(0)) waiter(message);
    }
  });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const nextMessage = () => messages.length
    ? Promise.resolve(messages.shift())
    : new Promise((resolve) => waiters.push(resolve));
  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr || `Child exited ${code}`));
      else resolve(messages);
    });
  });
  return { nextMessage, done };
}

function writeLeaseFixture(directory, name, contract, grant) {
  const target = path.join(directory, `${name}.json`);
  fs.writeFileSync(target, JSON.stringify({
    contract, grant, baseSha: "a".repeat(40), authority: testAuthorityMaterial(),
  }));
  return target;
}

let longMutexScenarioPromise;
function longMutexScenario() {
  if (longMutexScenarioPromise) return longMutexScenarioPromise;
  longMutexScenarioPromise = (async () => {
    const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-long-mutex-"));
    const dispatchState = makeStateDirectory({ active: true });
    const workerState = makeStateDirectory({ active: true });
    try {
      const dispatchContract = makeContract({ taskKey: "task-lock-dispatch", file: "src/dispatch.ts" });
      const dispatchGrant = makeGrant(dispatchContract);
      const dispatchFixture = writeLeaseFixture(
        fixtureDirectory, "dispatch", dispatchContract, dispatchGrant,
      );
      const workerFixtures = ["alpha", "beta", "gamma"].map((name) => {
        const contract = makeContract({ taskKey: `task-lock-${name}`, file: `src/${name}.ts` });
        contract.limits.max_workers = 2;
        return writeLeaseFixture(fixtureDirectory, name, contract, makeGrant(contract));
      });
      const fenceBefore = readControllerStateInternal(dispatchState).fencing_generation;
      const dispatchHolder = launchJsonProcess(mutexHolder, [dispatchState, String(LONG_HOLD_MS)]);
      const workerHolder = launchJsonProcess(mutexHolder, [workerState, String(LONG_HOLD_MS)]);
      const dispatchAcquired = await dispatchHolder.nextMessage();
      const workerAcquired = await workerHolder.nextMessage();
      const dispatchAttempts = ["one", "two"].map((name) =>
        launchJsonProcess(leaseContender, [dispatchFixture, dispatchState, `long-${name}`]));
      const workerAttempts = workerFixtures.map((fixture, index) =>
        launchJsonProcess(leaseContender, [fixture, workerState, `worker-${index}`]));
      await new Promise((resolve) => setTimeout(resolve, FORMER_STALE_THRESHOLD_MS + 250));
      const fenceDuring = readControllerStateInternal(dispatchState).fencing_generation;
      const dispatchResultsPromise = Promise.all(dispatchAttempts.map(async (child) => {
        const message = await child.nextMessage();
        await child.done;
        return message;
      }));
      const workerResultsPromise = Promise.all(workerAttempts.map(async (child) => {
        const message = await child.nextMessage();
        await child.done;
        return message;
      }));
      const [dispatchHolderMessages, workerHolderMessages, dispatchResults, workerResults] = await Promise.all([
        dispatchHolder.done, workerHolder.done, dispatchResultsPromise, workerResultsPromise,
      ]);
      return {
        dispatchAcquired,
        workerAcquired,
        dispatchHolderMessages,
        workerHolderMessages,
        dispatchResults,
        workerResults,
        fenceBefore,
        fenceDuring,
        fenceAfter: readControllerStateInternal(dispatchState).fencing_generation,
      };
    } finally {
      cleanupFixture(fixtureDirectory, dispatchState, workerState);
    }
  })();
  return longMutexScenarioPromise;
}

test("LOCK-OWNER-01 non-owner cannot release controller mutex", async () => {
  const stateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-owner-lock-"));
  try {
    const holder = launchJsonProcess(mutexHolder, [stateDirectory, "500"]);
    await holder.nextMessage();
    const mutex = path.join(stateDirectory, ".controller-mutex");
    const owner = JSON.parse(fs.readFileSync(path.join(mutex, "owner.json"), "utf8"));
    assert.throws(
      () => releaseStateMutexInternal(stateDirectory, owner.owner_token),
      /exact owner process identity and token/i,
    );
    assert.throws(
      () => fs.rmdirSync(mutex),
      (error) => ["ENOTEMPTY", "EPERM"].includes(error.code),
    );
    assert.equal(fs.existsSync(mutex), true);
    await holder.done;
  } finally {
    cleanupFixture(stateDirectory);
  }
});

test("LOCK-LONG-01 live holder beyond former threshold is never evicted", async () => {
  const result = await longMutexScenario();
  const criticalEnd = result.dispatchHolderMessages.find((item) => item.event === "critical-end");
  assert.ok(criticalEnd.critical_end_at_ms - result.dispatchAcquired.acquired_at_ms >= FORMER_STALE_THRESHOLD_MS);
  assert.ok(result.dispatchResults.every((item) => item.observed_at_ms >= criticalEnd.critical_end_at_ms));
});

test("LOCK-DISPATCH-01 long-held admission mutex still permits one authoritative dispatch", async () => {
  const result = await longMutexScenario();
  assert.equal(result.dispatchResults.filter((item) => item.acquired).length, 1);
});

test("LOCK-WORKERS-01 max_workers remains two after long-held cross-process contention", async () => {
  const result = await longMutexScenario();
  assert.equal(result.workerResults.filter((item) => item.acquired).length, 2);
  assert.equal(result.workerResults.filter((item) => item.reason === "max-workers").length, 1);
});

test("LOCK-FENCE-01 no fencing advance while live long-holder owns mutex", async () => {
  const result = await longMutexScenario();
  assert.equal(result.fenceDuring, result.fenceBefore);
  assert.equal(result.fenceAfter, result.fenceBefore + 1);
});

test("SECRET-JSON-01 JSON artifact password field is detected", () => {
  assert.throws(
    () => assertNoSecretValues(JSON.stringify({ [PASSWORD_FIELD]: TEST_PASSWORD_VALUE })),
    /sensitive-field/i,
  );
});

test("SECRET-JSON-02 nested JSON artifact api_key field is detected", () => {
  assert.throws(
    () => assertNoSecretValues(JSON.stringify({ x: { [API_KEY_FIELD]: "fake-test-value" } })),
    /sensitive-field/i,
  );
});

test("SECRET-LOG-01 JSON string sanitization removes raw password", () => {
  const raw = JSON.stringify({ [PASSWORD_FIELD]: TEST_PASSWORD_VALUE });
  const sanitized = sanitizeForLog(raw);
  assert.equal(sanitized.includes(TEST_PASSWORD_VALUE), false);
  assert.equal(JSON.parse(sanitized)[PASSWORD_FIELD], "[REDACTED]");
});

test("SECRET-STDERR-01 structured error JSON credential field is redacted", () => {
  const raw = JSON.stringify({ error: { [CREDENTIALS_FIELD]: { [API_KEY_CAMEL_FIELD]: "fake-test-value" } } });
  const sanitized = sanitizeForLog(raw);
  assert.equal(sanitized.includes("fake-test-value"), false);
  assert.equal(JSON.parse(sanitized).error[CREDENTIALS_FIELD], "[REDACTED]");
});

test("SECRET-PUBLIC-01 public search verification metadata is not falsely blocked", () => {
  const publicVerification = JSON.stringify({
    name: "sogou_site_verification", content: "Bkr0mB0f4m",
  });
  assert.doesNotThrow(() => assertNoSecretValues(publicVerification));
  assert.equal(sanitizeForLog(publicVerification), publicVerification);
});

test("artifact publication scan rejects structured ordinary-looking secrets", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-secret-artifact-"));
  try {
    fs.writeFileSync(path.join(directory, "artifact.json"), JSON.stringify({
      [PASSWORD_FIELD]: "ordinary-looking-value", nested: { [API_KEY_FIELD]: "fake-test-value" },
    }));
    assert.throws(() => scanArtifactFiles(directory, ["artifact.json"]), /sensitive-field/i);
  } finally {
    cleanupFixture(directory);
  }
});
