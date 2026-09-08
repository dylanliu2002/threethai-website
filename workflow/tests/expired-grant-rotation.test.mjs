import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  retireExpiredReadySyntheticPilotActivation,
  rotateExpiredSyntheticPilotGrant,
} from "../admin/authority-admin.mjs";
import { computeContractDigest, validateTaskContract } from "../contract.mjs";
import {
  grantDigestInternal,
  grantSignaturePayloadInternal,
  loadActiveGrantFromStoreInternal,
  validateExpiredSyntheticPilotGrantForRetirementInternal,
  validateGrantAgainstAnchorInternal,
} from "../internal/authority-engine.mjs";
import {
  enableSyntheticPilotOnceInternal,
  mutateControllerStateInternal,
  readControllerStateInternal,
  replayControllerJournalInternal,
  setActivationForAdministrationInternal,
} from "../internal/controller-state-engine.mjs";
import {
  EXPIRED_READY_PILOT_RETIREMENT,
  issueSyntheticPilotGrantInternal,
  retireExpiredReadySyntheticPilotActivationInternal,
  rotateExpiredSyntheticPilotGrantInternal,
} from "../internal/pilot-admin-engine.mjs";
import { SYNTHETIC_PILOT_TASK_KEY } from "../constants.mjs";
import { testAuthorityMaterial } from "../testing/controller-harness.mjs";
import { cleanupFixture } from "./helpers.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contractPath = path.join(
  sourceRoot,
  "tasks",
  "machine",
  "sys-auto-pilot-001-synthetic-fixture.json",
);
const NOW = new Date("2026-09-08T06:00:00.000Z");
const OLD_HUMAN_AUTHORIZATION_ID = "00000000-0000-4000-8000-000000000001";
const OLD_RUN_ID = "00000000-0000-4000-8000-000000000002";

function currentContract() {
  return validateTaskContract(JSON.parse(fs.readFileSync(contractPath, "utf8")), {
    repoRoot: sourceRoot,
  });
}

function authorityContext(root, authority) {
  return {
    authority_root: root,
    private_key_path: path.join(root, "admin", "controller-private-key.pem"),
    public_key_path: path.join(root, "admin", "controller-public-key.pem"),
    grants_directory: path.join(root, "grants"),
    state_directory: path.join(root, "runtime"),
    pinned_public_key_pem: authority.publicKeyPem,
    pinned_key_fingerprint: authority.keyFingerprint,
  };
}

function resign(grant, authority) {
  grant.envelope_digest = grantDigestInternal(grant);
  grant.signature = crypto.sign(
    null,
    Buffer.from(grantSignaturePayloadInternal(grant)),
    authority.privateKeyPem,
  ).toString("base64");
  return grant;
}

function legacyExpiredGrant(contract, authority, worktreeRealpath, {
  expiresAt = "2026-09-07T06:00:00.000Z",
} = {}) {
  const grant = issueSyntheticPilotGrantInternal({
    contract,
    privateKeyPem: authority.privateKeyPem,
    publicKeyPem: authority.publicKeyPem,
    worktreeRealpath,
    now: new Date("2026-09-06T06:00:00.000Z"),
  });
  grant.contract_revision = 1;
  grant.contract_digest = "1".repeat(64);
  grant.synthetic_pilot = {
    task_key: SYNTHETIC_PILOT_TASK_KEY,
    write_files: ["workflow/fixtures/pilot/output/synthetic-result.json"],
    write_prefixes: [],
    network: false,
    secrets: false,
    git_commit: false,
    push: false,
    pr: false,
    merge: false,
    production: false,
    dns: false,
    deployment: false,
    task_adoption: false,
    max_workers: 1,
    timeout_seconds: 300,
  };
  grant.activation.synthetic_pilot_once = {
    ...grant.activation.synthetic_pilot_once,
    contract_digest: grant.contract_digest,
    network: false,
  };
  grant.provenance = {
    ...grant.provenance,
    issued_at: "2026-09-06T06:00:00.000Z",
    expires_at: expiresAt,
  };
  return resign(grant, authority);
}

function createFixture(t, {
  expiresAt,
  pilotStatus = "CONSUMED",
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-grant-rotation-"));
  t.after(() => cleanupFixture(root));
  const authority = testAuthorityMaterial();
  const context = authorityContext(root, authority);
  fs.mkdirSync(path.dirname(context.private_key_path), { recursive: true });
  fs.mkdirSync(context.grants_directory, { recursive: true });
  fs.writeFileSync(context.private_key_path, authority.privateKeyPem);
  fs.writeFileSync(context.public_key_path, authority.publicKeyPem);
  setActivationForAdministrationInternal(context.state_directory, false, {
    source: "rotation-test",
    now: new Date("2026-09-06T05:00:00.000Z"),
  });
  mutateControllerStateInternal(context.state_directory, {
    type: "test.historical-pilot-state",
    taskKey: SYNTHETIC_PILOT_TASK_KEY,
  }, (state) => {
    state.pilot_activation = {
      status: pilotStatus,
      activation_id: "00000000-0000-4000-8000-000000000003",
      human_authorization_id: OLD_HUMAN_AUTHORIZATION_ID,
      task_key: SYNTHETIC_PILOT_TASK_KEY,
      authorization_id: "00000000-0000-4000-8000-000000000004",
      contract_digest: "2".repeat(64),
      card_blob_sha: "3".repeat(40),
      max_workers: 1,
      max_dispatch_attempts: 1,
      dispatch_attempts: pilotStatus === "CONSUMED" ? 1 : 0,
      publishing: false,
      network: false,
      production: false,
      dns: false,
      deployment: false,
      activated_at: "2026-09-06T05:30:00.000Z",
      consumed_at: pilotStatus === "CONSUMED" ? "2026-09-06T05:31:00.000Z" : null,
      consumed_run_id: pilotStatus === "CONSUMED" ? OLD_RUN_ID : null,
    };
    state.pilot_authorization_history[OLD_HUMAN_AUTHORIZATION_ID] = {
      activation_id: state.pilot_activation.activation_id,
      task_key: SYNTHETIC_PILOT_TASK_KEY,
      activated_at: state.pilot_activation.activated_at,
    };
    if (pilotStatus === "CONSUMED") {
      state.runs[OLD_RUN_ID] = {
        task_key: SYNTHETIC_PILOT_TASK_KEY,
        run_id: OLD_RUN_ID,
        status: "FAILED",
        completed_at: "2026-09-06T05:32:00.000Z",
      };
    }
    return { prepared: true };
  });
  const contract = currentContract();
  const oldGrant = legacyExpiredGrant(contract, authority, sourceRoot, { expiresAt });
  const oldBytes = Buffer.from(`${JSON.stringify(oldGrant, null, 4)}\n`, "utf8");
  const canonicalGrant = path.join(
    context.grants_directory,
    `${SYNTHETIC_PILOT_TASK_KEY}.json`,
  );
  fs.writeFileSync(canonicalGrant, oldBytes);
  const humanAuthorizationId = crypto.randomUUID();
  const beforeState = readControllerStateInternal(context.state_directory);
  const rotate = (overrides = {}) => {
    const { request: requestOverrides = {}, ...internalOverrides } = overrides;
    return rotateExpiredSyntheticPilotGrantInternal({
      context,
      contract,
      worktreeRealpath: sourceRoot,
      request: {
        task_key: SYNTHETIC_PILOT_TASK_KEY,
        human_authorization_id: humanAuthorizationId,
        ...requestOverrides,
      },
      now: NOW,
      fileOptions: { platform: "linux" },
      ...internalOverrides,
    });
  };
  return {
    root,
    authority,
    context,
    contract,
    oldGrant,
    oldBytes,
    canonicalGrant,
    humanAuthorizationId,
    beforeState,
    rotate,
  };
}

function createRetirementFixture(t, {
  expiresAt = "2026-09-08T05:00:00.000Z",
} = {}) {
  const fixture = createFixture(t, { pilotStatus: "READY" });
  const grant = issueSyntheticPilotGrantInternal({
    contract: fixture.contract,
    privateKeyPem: fixture.authority.privateKeyPem,
    publicKeyPem: fixture.authority.publicKeyPem,
    worktreeRealpath: sourceRoot,
    now: new Date("2026-09-08T04:00:00.000Z"),
  });
  grant.provenance.expires_at = expiresAt;
  resign(grant, fixture.authority);
  fixture.oldGrant = grant;
  fixture.oldBytes = Buffer.from(`${JSON.stringify(grant, null, 2)}\n`, "utf8");
  fs.writeFileSync(fixture.canonicalGrant, fixture.oldBytes);
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.bind-ready-activation-to-grant",
    taskKey: SYNTHETIC_PILOT_TASK_KEY,
  }, (state) => {
    state.pilot_activation.authorization_id = grant.authorization_id;
    state.pilot_activation.contract_digest = grant.contract_digest;
    state.pilot_activation.card_blob_sha = grant.card_blob_sha;
    state.pilot_activation.network = grant.activation.synthetic_pilot_once.network;
  });
  fixture.beforeState = readControllerStateInternal(fixture.context.state_directory);
  fixture.retirementHumanAuthorizationId = crypto.randomUUID();
  fixture.retire = (overrides = {}) => {
    const { request: requestOverrides = {}, ...internalOverrides } = overrides;
    return retireExpiredReadySyntheticPilotActivationInternal({
      context: fixture.context,
      worktreeRealpath: sourceRoot,
      request: {
        task_key: SYNTHETIC_PILOT_TASK_KEY,
        human_authorization_id: fixture.retirementHumanAuthorizationId,
        ...requestOverrides,
      },
      now: NOW,
      ...internalOverrides,
    });
  };
  return fixture;
}

function archivedGrantPath(fixture) {
  return path.join(
    fixture.context.grants_directory,
    "archive",
    SYNTHETIC_PILOT_TASK_KEY,
    `${fixture.oldGrant.authorization_id}.json`,
  );
}

function assertRotationRejectedWithoutCanonicalMutation(fixture, pattern) {
  assert.throws(() => fixture.rotate(), pattern);
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(fixture.oldBytes), true);
  assert.equal(
    readControllerStateInternal(fixture.context.state_directory).grant_rotation_history
      ?.[fixture.humanAuthorizationId],
    undefined,
  );
}

test("ROTATE-01 expired authentic legacy Grant rotates to the current restricted contract", (t) => {
  const fixture = createFixture(t);
  const result = fixture.rotate();
  const freshBytes = fs.readFileSync(fixture.canonicalGrant);
  const freshGrant = JSON.parse(freshBytes.toString("utf8"));
  const archivedBytes = fs.readFileSync(archivedGrantPath(fixture));

  assert.equal(result.rotated, true);
  assert.equal(result.workers_started, 0);
  assert.equal(result.activation, false);
  assert.equal(archivedBytes.equals(fixture.oldBytes), true);
  assert.notEqual(freshGrant.authorization_id, fixture.oldGrant.authorization_id);
  assert.equal(freshGrant.authorization_id, result.new_authorization_id);
  assert.equal(freshGrant.authorization_revision, fixture.oldGrant.authorization_revision + 1);
  assert.equal(freshGrant.contract_digest, computeContractDigest(fixture.contract));
  validateGrantAgainstAnchorInternal(fixture.contract, freshGrant, {
    repoRoot: sourceRoot,
    now: NOW,
    trustedPublicKeyPem: fixture.authority.publicKeyPem,
    trustedFingerprint: fixture.authority.keyFingerprint,
  });
  assert.equal(freshGrant.synthetic_pilot.network, true);
  assert.equal(freshGrant.synthetic_pilot.network_proxy.enforced, true);
  assert.deepEqual(freshGrant.synthetic_pilot.network_proxy.allowed_domains, ["chatgpt.com"]);
  assert.equal(freshGrant.limits.max_workers, 1);
  assert.equal(freshGrant.activation.synthetic_pilot_once.max_dispatch_attempts, 1);
  assert.equal(freshGrant.activation.synthetic_pilot_once.network, true);
  assert.equal(freshGrant.activation.autonomous, false);
  for (const permission of [
    "git_commit", "branch_push", "automation_activation", "github_write", "pr_create",
    "merge", "production", "dns", "external_action", "task_adoption",
  ]) {
    assert.equal(freshGrant.permissions[permission], false, permission);
  }
  for (const action of ["commit", "push", "pr", "merge", "force"]) {
    assert.equal(freshGrant.publishing[action], false, action);
  }
});

test("ROTATE-02 rotation preserves CONSUMED activation, authorization history, and runs", (t) => {
  const fixture = createFixture(t);
  fixture.rotate();
  const after = readControllerStateInternal(fixture.context.state_directory);
  assert.deepEqual(after.pilot_activation, fixture.beforeState.pilot_activation);
  assert.deepEqual(after.pilot_authorization_history, fixture.beforeState.pilot_authorization_history);
  assert.deepEqual(after.runs, fixture.beforeState.runs);
  assert.deepEqual(after.leases, fixture.beforeState.leases);
  assert.deepEqual(after.reservations, fixture.beforeState.reservations);
  assert.equal(after.pilot_activation.status, "CONSUMED");
  assert.equal(after.pilot_activation.dispatch_attempts, 1);
  assert.equal(after.grant_rotation_history[fixture.humanAuthorizationId].task_key,
    SYNTHETIC_PILOT_TASK_KEY);
});

test("ROTATE-03 successful audit event is durable and journal replayable", (t) => {
  const fixture = createFixture(t);
  const result = fixture.rotate();
  const journal = fs.readFileSync(
    path.join(fixture.context.state_directory, "controller-journal.jsonl"),
    "utf8",
  ).trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const event = journal.at(-1);
  assert.equal(event.type, "controller.synthetic-pilot.grant-rotated");
  for (const field of [
    "task_key", "human_authorization_id", "old_authorization_id", "old_grant_digest",
    "new_authorization_id", "new_grant_digest", "rotation_timestamp", "archive_identifier",
  ]) {
    assert.equal(event.payload[field], result[field], field);
  }
  assert.equal(event.payload.private_key, undefined);
  const replayed = replayControllerJournalInternal(journal).state;
  assert.deepEqual(replayed, readControllerStateInternal(fixture.context.state_directory));
  assert.equal(replayed.grant_rotation_history[fixture.humanAuthorizationId].new_authorization_id,
    result.new_authorization_id);
});

test("ROTATE-04 unexpired Grant cannot be replaced", (t) => {
  const fixture = createFixture(t, { expiresAt: "2026-09-09T06:00:00.000Z" });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /unexpired/);
});

test("ROTATE-05 tampered envelope cannot be rotated", (t) => {
  const fixture = createFixture(t);
  const tampered = structuredClone(fixture.oldGrant);
  tampered.validation_profile.name = "tampered";
  fs.writeFileSync(fixture.canonicalGrant, `${JSON.stringify(tampered)}\n`);
  fixture.oldBytes = fs.readFileSync(fixture.canonicalGrant);
  assertRotationRejectedWithoutCanonicalMutation(fixture, /envelope digest/);
});

test("ROTATE-06 bad signature cannot be rotated", (t) => {
  const fixture = createFixture(t);
  const badSignature = structuredClone(fixture.oldGrant);
  const replacement = badSignature.signature[0] === "A" ? "B" : "A";
  badSignature.signature = `${replacement}${badSignature.signature.slice(1)}`;
  fs.writeFileSync(fixture.canonicalGrant, `${JSON.stringify(badSignature)}\n`);
  fixture.oldBytes = fs.readFileSync(fixture.canonicalGrant);
  assertRotationRejectedWithoutCanonicalMutation(fixture, /signature/);
});

test("ROTATE-07 wrong-task Grant cannot be rotated", (t) => {
  const fixture = createFixture(t);
  const wrongTask = structuredClone(fixture.oldGrant);
  wrongTask.task_key = "task-alpha";
  resign(wrongTask, fixture.authority);
  fs.writeFileSync(fixture.canonicalGrant, `${JSON.stringify(wrongTask)}\n`);
  fixture.oldBytes = fs.readFileSync(fixture.canonicalGrant);
  assertRotationRejectedWithoutCanonicalMutation(fixture, /synthetic pilot|identity/i);
});

test("ROTATE-08 missing canonical Grant does not become an install operation", (t) => {
  const fixture = createFixture(t);
  fs.unlinkSync(fixture.canonicalGrant);
  assert.throws(() => fixture.rotate(), /unavailable/);
  assert.equal(fs.existsSync(archivedGrantPath(fixture)), false);
});

test("ROTATE-09 READY activation blocks rotation without erasing it", (t) => {
  const fixture = createFixture(t, { pilotStatus: "READY" });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /READY/);
  assert.equal(readControllerStateInternal(fixture.context.state_directory).pilot_activation.status,
    "READY");
});

test("ROTATE-10 live worker lease blocks rotation", (t) => {
  const fixture = createFixture(t);
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.live-lease",
  }, (state) => {
    state.leases.live = { kind: "worker", expires_at_ms: NOW.getTime() + 60_000 };
  });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /live worker leases/);
});

test("ROTATE-11 live reservation blocks rotation", (t) => {
  const fixture = createFixture(t);
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.live-reservation",
  }, (state) => {
    state.reservations.live = { expires_at_ms: NOW.getTime() + 60_000 };
  });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /live reservations/);
});

test("ROTATE-12 active run blocks rotation while terminal historical run remains allowed", (t) => {
  const fixture = createFixture(t);
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.active-run",
  }, (state) => {
    state.runs.active = { status: "RUNNING" };
  });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /active worker runs/);
});

test("ROTATE-13 general autonomous activation blocks rotation", (t) => {
  const fixture = createFixture(t);
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.general-activation",
  }, (state) => {
    state.activation.authorized = true;
  });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /General autonomous activation/);
});

test("ROTATE-14 reused pilot human authorization blocks rotation", (t) => {
  const fixture = createFixture(t);
  assert.throws(() => fixture.rotate({
    request: { human_authorization_id: OLD_HUMAN_AUTHORIZATION_ID },
  }), /already been used/);
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(fixture.oldBytes), true);
});

test("ROTATE-15 archive collision fails closed", (t) => {
  const fixture = createFixture(t);
  const archive = archivedGrantPath(fixture);
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  fs.writeFileSync(archive, "existing audit evidence\n");
  assertRotationRejectedWithoutCanonicalMutation(fixture, /archive record already exists/);
  assert.equal(fs.readFileSync(archive, "utf8"), "existing audit evidence\n");
});

test("ROTATE-16 fresh-install failure preserves both canonical and archived old bytes", (t) => {
  const fixture = createFixture(t);
  assert.throws(() => fixture.rotate({
    beforeFreshInstall: () => { throw new Error("simulated install failure"); },
  }), /simulated install failure/);
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(fixture.oldBytes), true);
  assert.equal(fs.readFileSync(archivedGrantPath(fixture)).equals(fixture.oldBytes), true);
  const state = readControllerStateInternal(fixture.context.state_directory);
  assert.equal(state.grant_rotation_history[fixture.humanAuthorizationId], undefined);
});

test("ROTATE-17 expired archived Grant remains unusable for runtime authorization", (t) => {
  const fixture = createFixture(t);
  fixture.rotate();
  const archived = JSON.parse(fs.readFileSync(archivedGrantPath(fixture), "utf8"));
  assert.throws(() => validateGrantAgainstAnchorInternal(fixture.contract, archived, {
    repoRoot: sourceRoot,
    now: NOW,
    trustedPublicKeyPem: fixture.authority.publicKeyPem,
    trustedFingerprint: fixture.authority.keyFingerprint,
  }));
  assert.doesNotThrow(() => validateExpiredSyntheticPilotGrantForRetirementInternal(archived, {
    now: NOW,
    trustedPublicKeyPem: fixture.authority.publicKeyPem,
    trustedFingerprint: fixture.authority.keyFingerprint,
  }));
});

test("ROTATE-18 active Grant loading ignores archive-only records", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-active-grant-store-"));
  t.after(() => cleanupFixture(root));
  const archive = path.join(root, "archive", SYNTHETIC_PILOT_TASK_KEY);
  fs.mkdirSync(archive, { recursive: true });
  fs.writeFileSync(path.join(archive, `${crypto.randomUUID()}.json`), "{\"archived\":true}\n");
  assert.throws(() => loadActiveGrantFromStoreInternal(root, SYNTHETIC_PILOT_TASK_KEY),
    /unavailable/);
  const active = { active: true };
  fs.writeFileSync(path.join(root, `${SYNTHETIC_PILOT_TASK_KEY}.json`), JSON.stringify(active));
  assert.deepEqual(loadActiveGrantFromStoreInternal(root, SYNTHETIC_PILOT_TASK_KEY), active);
});

test("ROTATE-19 stale leases and reservations are historical, not live blockers", (t) => {
  const fixture = createFixture(t);
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.stale-lock-evidence",
  }, (state) => {
    state.leases.stale = { kind: "worker", expires_at_ms: NOW.getTime() - 1 };
    state.reservations.stale = { expires_at_ms: NOW.getTime() - 1 };
  });
  const before = readControllerStateInternal(fixture.context.state_directory);
  fixture.rotate();
  const after = readControllerStateInternal(fixture.context.state_directory);
  assert.deepEqual(after.leases, before.leases);
  assert.deepEqual(after.reservations, before.reservations);
});

test("ROTATE-20 public administration boundary rejects overrides and non-pilot tasks", () => {
  assert.throws(() => rotateExpiredSyntheticPilotGrant({
    repoRoot: sourceRoot,
    task_key: SYNTHETIC_PILOT_TASK_KEY,
    human_authorization_id: crypto.randomUUID(),
    now: NOW,
  }), /Unsupported pilot administration option: now/);
  assert.throws(() => rotateExpiredSyntheticPilotGrant({
    repoRoot: sourceRoot,
    task_key: "task-alpha",
    human_authorization_id: crypto.randomUUID(),
  }), /exact synthetic pilot task/);
});

test("ROTATE-21 authentic Grant with the wrong physical worktree is rejected", (t) => {
  const fixture = createFixture(t);
  const wrongWorktree = structuredClone(fixture.oldGrant);
  wrongWorktree.worktree_realpath = path.dirname(sourceRoot);
  resign(wrongWorktree, fixture.authority);
  fs.writeFileSync(fixture.canonicalGrant, `${JSON.stringify(wrongWorktree)}\n`);
  fixture.oldBytes = fs.readFileSync(fixture.canonicalGrant);
  assertRotationRejectedWithoutCanonicalMutation(fixture, /identity and worktree/);
});

test("ROTATE-22 mismatched signing keypair fails before archival or replacement", (t) => {
  const fixture = createFixture(t);
  const unrelated = crypto.generateKeyPairSync("ed25519").privateKey
    .export({ type: "pkcs8", format: "pem" });
  fs.writeFileSync(fixture.context.private_key_path, unrelated);
  assertRotationRejectedWithoutCanonicalMutation(fixture, /keypair mismatch/);
  assert.equal(fs.existsSync(archivedGrantPath(fixture)), false);
});

test("ROTATE-23 malformed fresh human authorization fails closed", (t) => {
  const fixture = createFixture(t);
  assert.throws(() => fixture.rotate({
    request: { human_authorization_id: "not-a-uuid" },
  }));
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(fixture.oldBytes), true);
  assert.equal(fs.existsSync(archivedGrantPath(fixture)), false);
});

test("ROTATE-24 expired current-schema synthetic Grant is also safely rotatable", (t) => {
  const fixture = createFixture(t);
  const currentExpired = issueSyntheticPilotGrantInternal({
    contract: fixture.contract,
    privateKeyPem: fixture.authority.privateKeyPem,
    publicKeyPem: fixture.authority.publicKeyPem,
    worktreeRealpath: sourceRoot,
    now: new Date("2026-09-07T00:00:00.000Z"),
  });
  fixture.oldGrant = currentExpired;
  fixture.oldBytes = Buffer.from(`${JSON.stringify(currentExpired, null, 2)}\n`, "utf8");
  fs.writeFileSync(fixture.canonicalGrant, fixture.oldBytes);
  const result = fixture.rotate();
  assert.equal(result.rotated, true);
  assert.equal(fs.readFileSync(archivedGrantPath(fixture)).equals(fixture.oldBytes), true);
  assert.notEqual(result.new_authorization_id, currentExpired.authorization_id);
});

test("RETIRE-01 expired-Grant READY activation retires without dispatch and remains replayable", (t) => {
  const fixture = createRetirementFixture(t);
  const before = structuredClone(fixture.beforeState);
  const beforeGrant = fs.readFileSync(fixture.canonicalGrant);
  const journalPath = path.join(fixture.context.state_directory, "controller-journal.jsonl");
  const beforeEvents = fs.readFileSync(journalPath, "utf8").trim().split(/\r?\n/).length;

  const result = fixture.retire();
  const after = readControllerStateInternal(fixture.context.state_directory);
  const record = after.pilot_activation_retirement_history
    [fixture.retirementHumanAuthorizationId];

  assert.equal(result.retired, true);
  assert.equal(result.activation_status, EXPIRED_READY_PILOT_RETIREMENT.status);
  assert.equal(result.dispatches, 0);
  assert.equal(result.workers_started, 0);
  assert.equal(after.pilot_activation.status, "RETIRED_BEFORE_DISPATCH");
  assert.equal(after.pilot_activation.retirement_reason, "GRANT_EXPIRED_BEFORE_DISPATCH");
  assert.equal(after.pilot_activation.dispatch_attempts, 0);
  assert.equal(after.pilot_activation.consumed_at, null);
  assert.equal(after.pilot_activation.consumed_run_id, null);
  assert.deepEqual(record.activation_before, before.pilot_activation);
  assert.equal(record.expired_grant_authorization_id, fixture.oldGrant.authorization_id);
  assert.equal(record.expired_grant_digest, fixture.oldGrant.envelope_digest);
  assert.deepEqual(after.pilot_authorization_history, before.pilot_authorization_history);
  assert.deepEqual(after.runs, before.runs);
  assert.deepEqual(after.leases, before.leases);
  assert.deepEqual(after.reservations, before.reservations);
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(beforeGrant), true);

  const journal = fs.readFileSync(journalPath, "utf8").trim().split(/\r?\n/)
    .map((line) => JSON.parse(line));
  assert.equal(journal.length, beforeEvents + 1);
  assert.equal(journal.at(-1).type, EXPIRED_READY_PILOT_RETIREMENT.event);
  assert.equal(journal.at(-1).payload.activation_id, before.pilot_activation.activation_id);
  assert.equal(journal.at(-1).payload.dispatch_attempts, 0);
  assert.deepEqual(replayControllerJournalInternal(journal).state, after);
});

test("RETIRE-02 CONSUMED activation cannot be retired and no evidence changes", (t) => {
  const fixture = createFixture(t);
  const beforeState = readControllerStateInternal(fixture.context.state_directory);
  const beforeGrant = fs.readFileSync(fixture.canonicalGrant);
  const journalPath = path.join(fixture.context.state_directory, "controller-journal.jsonl");
  const beforeJournal = fs.readFileSync(journalPath);
  assert.throws(() => retireExpiredReadySyntheticPilotActivationInternal({
    context: fixture.context,
    worktreeRealpath: sourceRoot,
    request: {
      task_key: SYNTHETIC_PILOT_TASK_KEY,
      human_authorization_id: crypto.randomUUID(),
    },
    now: NOW,
  }), /Only a READY/);
  assert.deepEqual(readControllerStateInternal(fixture.context.state_directory), beforeState);
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(beforeGrant), true);
  assert.equal(fs.readFileSync(journalPath).equals(beforeJournal), true);
});

test("RETIRE-03 READY activation with a valid unexpired Grant cannot be retired", (t) => {
  const fixture = createRetirementFixture(t, { expiresAt: "2026-09-09T06:00:00.000Z" });
  const beforeState = readControllerStateInternal(fixture.context.state_directory);
  const beforeGrant = fs.readFileSync(fixture.canonicalGrant);
  assert.throws(() => fixture.retire(), /unexpired/);
  assert.deepEqual(readControllerStateInternal(fixture.context.state_directory), beforeState);
  assert.equal(fs.readFileSync(fixture.canonicalGrant).equals(beforeGrant), true);
});

test("RETIRE-04 evidenced RETIRED_BEFORE_DISPATCH state permits rotation and preserves the old activation", (t) => {
  const fixture = createRetirementFixture(t);
  fixture.retire();
  const beforeRotation = readControllerStateInternal(fixture.context.state_directory);
  const result = fixture.rotate();
  const afterRotation = readControllerStateInternal(fixture.context.state_directory);
  assert.equal(result.rotated, true);
  assert.deepEqual(afterRotation.pilot_activation, beforeRotation.pilot_activation);
  assert.deepEqual(
    afterRotation.pilot_activation_retirement_history,
    beforeRotation.pilot_activation_retirement_history,
  );
  assert.deepEqual(afterRotation.pilot_authorization_history, beforeRotation.pilot_authorization_history);
  assert.deepEqual(afterRotation.runs, beforeRotation.runs);
  assert.deepEqual(afterRotation.leases, beforeRotation.leases);
  assert.deepEqual(afterRotation.reservations, beforeRotation.reservations);
});

test("RETIRE-05 forged RETIRED_BEFORE_DISPATCH status without durable evidence cannot rotate", (t) => {
  const fixture = createFixture(t, { pilotStatus: "READY" });
  mutateControllerStateInternal(fixture.context.state_directory, {
    type: "test.forged-retired-status",
  }, (state) => {
    state.pilot_activation.status = "RETIRED_BEFORE_DISPATCH";
    state.pilot_activation.retirement_human_authorization_id = crypto.randomUUID();
  });
  assertRotationRejectedWithoutCanonicalMutation(fixture, /durable retirement evidence/);
});

test("RETIRE-06 retire, rotate, and fresh activation preserve retired evidence", (t) => {
  const fixture = createRetirementFixture(t);
  fixture.retire();
  const retired = readControllerStateInternal(fixture.context.state_directory);
  fixture.rotate();
  const freshGrant = JSON.parse(fs.readFileSync(fixture.canonicalGrant, "utf8"));
  const activation = enableSyntheticPilotOnceInternal(fixture.context.state_directory, {
    request: {
      human_authorization_id: crypto.randomUUID(),
      task_key: SYNTHETIC_PILOT_TASK_KEY,
      max_workers: 1,
      publishing: false,
      network: true,
      production: false,
      dns: false,
      deployment: false,
    },
    authorizationId: freshGrant.authorization_id,
    contractDigest: freshGrant.contract_digest,
    cardBlobSha: freshGrant.card_blob_sha,
    now: new Date("2026-09-08T06:01:00.000Z"),
  });
  const after = readControllerStateInternal(fixture.context.state_directory);
  assert.equal(activation.status, "READY");
  assert.notEqual(activation.activation_id, retired.pilot_activation.activation_id);
  assert.equal(activation.authorization_id, freshGrant.authorization_id);
  assert.equal(activation.dispatch_attempts, 0);
  assert.deepEqual(
    after.pilot_activation_retirement_history,
    retired.pilot_activation_retirement_history,
  );
});

test("RETIRE-07 public administration boundary rejects overrides and non-pilot tasks", () => {
  assert.throws(() => retireExpiredReadySyntheticPilotActivation({
    repoRoot: sourceRoot,
    task_key: SYNTHETIC_PILOT_TASK_KEY,
    human_authorization_id: crypto.randomUUID(),
    now: NOW,
  }), /Unsupported pilot administration option: now/);
  assert.throws(() => retireExpiredReadySyntheticPilotActivation({
    repoRoot: sourceRoot,
    task_key: "another-task",
    human_authorization_id: crypto.randomUUID(),
  }), /exact synthetic pilot task/);
});
