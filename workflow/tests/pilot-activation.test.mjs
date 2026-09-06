import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { enableActivation } from "../admin/authority-admin.mjs";
import { computeContractDigest, validateTaskContract } from "../contract.mjs";
import { deriveActualChanges } from "../git-evidence.mjs";
import { issueCapabilityInternal } from "../internal/capability-engine.mjs";
import {
  enableSyntheticPilotOnceInternal,
  mutateControllerStateInternal,
  readControllerStateInternal,
  setActivationForAdministrationInternal,
} from "../internal/controller-state-engine.mjs";
import {
  completeRunInternal,
  markRunStartedInternal,
  reserveTaskDispatchInternal,
} from "../internal/lease-engine.mjs";
import {
  bootstrapAuthorityStoreInternal,
  inspectAuthorityStoreInternal,
  issueSyntheticPilotGrantInternal,
} from "../internal/pilot-admin-engine.mjs";
import {
  assertSyntheticPilotContract,
  assertSyntheticPilotGrant,
  oneTimePilotPolicy,
  pilotTaskKeyAuthorized,
} from "../pilot-security.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";
import {
  createTestEngineWithAuthority,
  testAuthorityMaterial,
} from "../testing/controller-harness.mjs";
import { cleanupFixture, makeStateDirectory } from "./helpers.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contractPath = path.join(
  sourceRoot,
  "tasks",
  "machine",
  "sys-auto-pilot-001-synthetic-fixture.json",
);
const TASK_KEY = "sys-auto-pilot-001-synthetic-fixture";
const OUTPUT_PATH = "workflow/fixtures/pilot/output/synthetic-result.json";
const HEAD = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: sourceRoot,
  encoding: "utf8",
  windowsHide: true,
}).trim();

function contract() {
  return validateTaskContract(JSON.parse(fs.readFileSync(contractPath, "utf8")), {
    repoRoot: sourceRoot,
  });
}

function authorityContext(root, pinnedFingerprint) {
  return {
    authority_root: root,
    private_key_path: path.join(root, "admin", "controller-private-key.pem"),
    public_key_path: path.join(root, "admin", "controller-public-key.pem"),
    grants_directory: path.join(root, "grants"),
    state_directory: path.join(root, "runtime"),
    pinned_key_fingerprint: pinnedFingerprint,
  };
}

function activationRequest(overrides = {}) {
  return {
    human_authorization_id: crypto.randomUUID(),
    task_key: TASK_KEY,
    max_workers: 1,
    publishing: false,
    network: false,
    production: false,
    dns: false,
    deployment: false,
    ...overrides,
  };
}

function pilotFixture() {
  const machineContract = contract();
  const authority = testAuthorityMaterial();
  const grant = issueSyntheticPilotGrantInternal({
    contract: machineContract,
    privateKeyPem: authority.privateKeyPem,
    publicKeyPem: authority.publicKeyPem,
    worktreeRealpath: sourceRoot,
    now: new Date("2026-09-06T00:00:00.000Z"),
  });
  const stateDirectory = makeStateDirectory({ active: false });
  const engine = createTestEngineWithAuthority({
    repoRoot: sourceRoot,
    stateDirectory,
    taskKey: machineContract.task_key,
    grant,
    authority,
  });
  const activation = enableSyntheticPilotOnceInternal(stateDirectory, {
    request: activationRequest(),
    authorizationId: grant.authorization_id,
    contractDigest: grant.contract_digest,
    cardBlobSha: grant.card_blob_sha,
    now: new Date("2026-09-06T00:01:00.000Z"),
  });
  return { machineContract, grant, stateDirectory, engine, activation };
}

function reservePilot(fixture, wakeupId = crypto.randomUUID()) {
  return reserveTaskDispatchInternal({
    engine: fixture.engine,
    contract: fixture.machineContract,
    grant: fixture.grant,
    wakeupId,
    baseSha: HEAD,
    roleId: fixture.machineContract.owner_role,
    maxWorkersCeiling: 1,
    pilotActivationId: fixture.activation.activation_id,
    now: new Date("2026-09-06T00:02:00.000Z"),
  });
}

test("PILOT-BOOTSTRAP-01 no matching key creates a fresh secure authority keypair", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-authority-bootstrap-"));
  t.after(() => cleanupFixture(root));
  const unrelated = crypto.generateKeyPairSync("ed25519").publicKey
    .export({ type: "spki", format: "pem" });
  const context = authorityContext(root, publicKeyFingerprint(unrelated));
  const result = bootstrapAuthorityStoreInternal(context, { platform: "linux" });
  const inspected = inspectAuthorityStoreInternal(context);
  assert.equal(result.fresh_keypair_generated, true);
  assert.equal(result.activation_authorized, false);
  assert.equal(inspected.private_key_exists, true);
  assert.equal(inspected.public_key_matches_private, true);
  assert.equal(Object.hasOwn(result, "privateKeyPem"), false);
});

test("PILOT-BOOTSTRAP-02 mismatched private and pinned public keys fail closed", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-authority-mismatch-"));
  t.after(() => cleanupFixture(root));
  const left = crypto.generateKeyPairSync("ed25519");
  const right = crypto.generateKeyPairSync("ed25519");
  const context = authorityContext(root, publicKeyFingerprint(
    right.publicKey.export({ type: "spki", format: "pem" }),
  ));
  fs.mkdirSync(path.dirname(context.private_key_path), { recursive: true });
  fs.writeFileSync(
    context.private_key_path,
    left.privateKey.export({ type: "pkcs8", format: "pem" }),
  );
  fs.writeFileSync(
    context.public_key_path,
    left.publicKey.export({ type: "spki", format: "pem" }),
  );
  assert.throws(
    () => bootstrapAuthorityStoreInternal(context, { platform: "linux" }),
    /does not match the pinned trust anchor/,
  );
});

test("PILOT-BOOTSTRAP-03 authority bootstrap remains inactive by default", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-authority-inactive-"));
  t.after(() => cleanupFixture(root));
  const pinned = crypto.generateKeyPairSync("ed25519").publicKey
    .export({ type: "spki", format: "pem" });
  const context = authorityContext(root, publicKeyFingerprint(pinned));
  bootstrapAuthorityStoreInternal(context, { platform: "linux" });
  const state = readControllerStateInternal(context.state_directory);
  assert.equal(state.activation.authorized, false);
  assert.equal(state.pilot_activation.status, "DISABLED");
});

test("PILOT-ACTIVATION-02 generic permanent activation remains unavailable", () => {
  assert.throws(() => enableActivation(), /unavailable/);
  assert.throws(
    () => setActivationForAdministrationInternal(path.join(os.tmpdir(), "not-used"), true),
    /unavailable/,
  );
});

test("PILOT-CONTRACT-01 machine contract allows only the expected output file", () => {
  const machineContract = contract();
  assert.equal(assertSyntheticPilotContract(machineContract), true);
  assert.deepEqual(machineContract.write_files, [OUTPUT_PATH]);
  assert.deepEqual(machineContract.write_prefixes, []);
});

test("PILOT-CONTRACT-02 wrong branch or worktree fails closed", () => {
  const wrongWorktree = structuredClone(contract());
  wrongWorktree.worktree = "worktrees/not-the-synthetic-pilot";
  assert.throws(() => assertSyntheticPilotContract(wrongWorktree), /worktree/);
  const wrongBranch = structuredClone(contract());
  wrongBranch.branch = "codex/not-the-synthetic-pilot";
  assert.throws(() => assertSyntheticPilotContract(wrongBranch), /branch/);
});

test("PILOT-GRANT-01 signed Grant binds the exact contract digest", () => {
  const fixture = pilotFixture();
  try {
    assert.equal(fixture.grant.contract_digest, computeContractDigest(fixture.machineContract));
    const altered = structuredClone(fixture.grant);
    altered.contract_digest = "f".repeat(64);
    assert.throws(() => assertSyntheticPilotGrant(fixture.machineContract, altered), /exact contract/);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-GRANT-02 signed Grant binds the exact Task Card blob", () => {
  const fixture = pilotFixture();
  try {
    assert.equal(fixture.grant.card_blob_sha, fixture.machineContract.card_blob_sha);
    const altered = structuredClone(fixture.grant);
    altered.card_blob_sha = "f".repeat(40);
    assert.throws(() => assertSyntheticPilotGrant(fixture.machineContract, altered), /card/);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-GRANT-03 Grant cannot authorize publishing", () => {
  const fixture = pilotFixture();
  try {
    const altered = structuredClone(fixture.grant);
    altered.publishing.push = true;
    assert.throws(() => assertSyntheticPilotGrant(fixture.machineContract, altered), /publishing/);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-GRANT-04 Grant cannot authorize network", () => {
  const fixture = pilotFixture();
  try {
    const altered = structuredClone(fixture.grant);
    altered.activation.synthetic_pilot_once.network = true;
    assert.throws(() => assertSyntheticPilotGrant(fixture.machineContract, altered), /network/);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-GRANT-05 Grant cannot authorize production, DNS, or deployment", () => {
  const fixture = pilotFixture();
  try {
    for (const field of ["production", "dns", "deployment"]) {
      const altered = structuredClone(fixture.grant);
      altered.activation.synthetic_pilot_once[field] = true;
      assert.throws(() => assertSyntheticPilotGrant(fixture.machineContract, altered), new RegExp(field, "i"));
    }
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-ACTIVATION-03 one-time activation permits only the synthetic Task", () => {
  const fixture = pilotFixture();
  try {
    const policy = oneTimePilotPolicy(fixture.activation);
    assert.equal(pilotTaskKeyAuthorized(TASK_KEY, policy), true);
    assert.equal(pilotTaskKeyAuthorized("sys-auto-001-codex-autonomous-workflow-bootstrap", policy), false);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-ACTIVATION-05 broader administration parameters fail closed", (t) => {
  const stateDirectory = makeStateDirectory({ active: false });
  t.after(() => cleanupFixture(stateDirectory));
  assert.throws(() => enableSyntheticPilotOnceInternal(stateDirectory, {
    request: activationRequest({ network: true }),
    authorizationId: crypto.randomUUID(),
    contractDigest: "a".repeat(64),
    cardBlobSha: "b".repeat(40),
  }));
  assert.equal(readControllerStateInternal(stateDirectory).pilot_activation.status, "DISABLED");
});

test("PILOT-WORKERS-02 contract, Grant, activation, and policy all bind MAX_WORKERS=1", () => {
  const fixture = pilotFixture();
  try {
    assert.equal(fixture.machineContract.limits.max_workers, 1);
    assert.equal(fixture.grant.limits.max_workers, 1);
    assert.equal(fixture.activation.max_workers, 1);
    assert.equal(oneTimePilotPolicy(fixture.activation).max_workers, 1);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-DISPATCH-01 first dispatch reservation consumes the activation", () => {
  const fixture = pilotFixture();
  try {
    const admitted = reservePilot(fixture);
    const state = readControllerStateInternal(fixture.stateDirectory);
    assert.equal(admitted.acquired, true);
    assert.equal(state.pilot_activation.status, "CONSUMED");
    assert.equal(state.pilot_activation.dispatch_attempts, 1);
    assert.equal(state.pilot_activation.consumed_run_id, admitted.run.run_id);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-DISPATCH-02 a second dispatch is blocked", () => {
  const fixture = pilotFixture();
  try {
    assert.equal(reservePilot(fixture, "first").acquired, true);
    const second = reservePilot(fixture, "second");
    assert.equal(second.acquired, false);
    assert.equal(second.reason, "activation-disabled");
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-DISPATCH-04 consumed human authorization cannot be replayed", () => {
  const fixture = pilotFixture();
  try {
    reservePilot(fixture, "consume-for-replay-test");
    assert.throws(() => enableSyntheticPilotOnceInternal(fixture.stateDirectory, {
      request: activationRequest({
        human_authorization_id: fixture.activation.human_authorization_id,
      }),
      authorizationId: fixture.grant.authorization_id,
      contractDigest: fixture.grant.contract_digest,
      cardBlobSha: fixture.grant.card_blob_sha,
    }), /already been used/);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-DISPATCH-03 a pre-thread CLI failure releases its lease and stays consumed", () => {
  const fixture = pilotFixture();
  try {
    const admitted = reservePilot(fixture, "failed-first");
    const isolatedEngine = { ...fixture.engine, repoRoot: null };
    const capability = issueCapabilityInternal({
      engine: isolatedEngine,
      contract: fixture.machineContract,
      grant: fixture.grant,
      action: "dispatch",
      runId: admitted.run.run_id,
      headSha: HEAD,
      now: new Date("2026-09-06T00:03:00.000Z"),
      verifyCard: false,
    });
    markRunStartedInternal({
      engine: isolatedEngine,
      contract: fixture.machineContract,
      grant: fixture.grant,
      capability,
      now: new Date("2026-09-06T00:03:01.000Z"),
      verifyCard: false,
    });
    const scope = deriveActualChanges(sourceRoot, HEAD);
    const completed = completeRunInternal({
      engine: isolatedEngine,
      contract: fixture.machineContract,
      grant: fixture.grant,
      capability,
      processExitCode: 1,
      outputValid: false,
      output: null,
      actualHeadSha: HEAD,
      scopeEvidence: { ...scope, passed: true },
      validationEvidence: { passed: false, actual_head_sha: HEAD, evidence_digest: "d".repeat(64) },
      threadId: null,
      reportedModel: "gpt-5.6-sol",
      now: new Date("2026-09-06T00:03:02.000Z"),
      verifyCard: false,
    });
    const state = readControllerStateInternal(fixture.stateDirectory);
    assert.equal(completed.status, "FAILED");
    assert.equal(state.runs[admitted.run.run_id].thread_id, "PENDING");
    assert.equal(state.pilot_activation.status, "CONSUMED");
    assert.equal(state.pilot_activation.dispatch_attempts, 1);
    assert.deepEqual(Object.keys(state.leases), []);
    assert.deepEqual(Object.keys(state.reservations), []);
    assert.equal(state.tasks[TASK_KEY].lease_id, null);
    const second = reservePilot(fixture, "after-failure");
    assert.equal(second.acquired, false);
    assert.equal(second.reason, "activation-disabled");
    const afterSecond = readControllerStateInternal(fixture.stateDirectory);
    assert.equal(afterSecond.pilot_activation.status, "CONSUMED");
    assert.equal(afterSecond.pilot_activation.dispatch_attempts, 1);
    assert.equal(Object.keys(afterSecond.runs).length, 1);
    assert.equal(Object.keys(afterSecond.leases).length, 0);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-RECOVERY-01 reservation admission sweeps an expired historical failed lease", () => {
  const fixture = pilotFixture();
  try {
    const admitted = reservePilot(fixture, "historical-failed-lease");
    mutateControllerStateInternal(fixture.stateDirectory, {
      type: "test.historical-terminal-failure",
      taskKey: TASK_KEY,
      runId: admitted.run.run_id,
    }, (state) => {
      state.runs[admitted.run.run_id].status = "FAILED";
      return { simulated: true };
    });
    const recoveryAdmission = reserveTaskDispatchInternal({
      engine: fixture.engine,
      contract: fixture.machineContract,
      grant: fixture.grant,
      wakeupId: "expired-lease-recovery",
      baseSha: HEAD,
      roleId: fixture.machineContract.owner_role,
      maxWorkersCeiling: 1,
      pilotActivationId: fixture.activation.activation_id,
      now: new Date("2026-09-06T00:10:00.000Z"),
    });
    const state = readControllerStateInternal(fixture.stateDirectory);
    assert.equal(recoveryAdmission.acquired, false);
    assert.equal(recoveryAdmission.reason, "activation-disabled");
    assert.equal(state.runs[admitted.run.run_id].status, "FAILED");
    assert.equal(state.pilot_activation.status, "CONSUMED");
    assert.equal(state.pilot_activation.dispatch_attempts, 1);
    assert.deepEqual(Object.keys(state.leases), []);
    assert.deepEqual(Object.keys(state.reservations), []);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-ADOPTION-02 existing Tasks remain unadopted", () => {
  const fixture = pilotFixture();
  try {
    const state = readControllerStateInternal(fixture.stateDirectory);
    assert.deepEqual(Object.keys(state.tasks), []);
    assert.equal(fixture.machineContract.provenance.automatic_existing_task_adoption, false);
    assert.equal(fixture.grant.permissions.task_adoption, false);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-ACTIVATION-04 general autonomous workflow remains off", () => {
  const fixture = pilotFixture();
  try {
    const state = readControllerStateInternal(fixture.stateDirectory);
    assert.equal(state.activation.authorized, false);
    assert.equal(fixture.grant.activation.autonomous, false);
    assert.equal(fixture.grant.permissions.automation_activation, false);
  } finally {
    cleanupFixture(fixture.stateDirectory);
  }
});

test("PILOT-SECRET-01 no private key material enters Git-visible files or bootstrap output", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-authority-secret-boundary-"));
  t.after(() => cleanupFixture(root));
  const pinned = crypto.generateKeyPairSync("ed25519").publicKey
    .export({ type: "spki", format: "pem" });
  const context = authorityContext(root, publicKeyFingerprint(pinned));
  const result = bootstrapAuthorityStoreInternal(context, { platform: "linux" });
  const serialized = JSON.stringify(result);
  const privateMarker = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
  assert.equal(serialized.includes(privateMarker), false);
  assert.equal(Object.keys(result).some((key) => /private.*pem|secret|credential/i.test(key)), false);
  const grep = spawnSync("git", ["grep", "-F", "-l", "--", privateMarker], {
    cwd: sourceRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.ok([0, 1].includes(grep.status));
  assert.equal(grep.stdout.trim(), "");
});
