import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { canonicalJson } from "../canonical.mjs";
import { computeContractDigest } from "../contract.mjs";
import {
  createSignedGrantInternal,
  validateExpiredSyntheticPilotGrantForRetirementInternal,
  validateGrantAgainstAnchorInternal,
} from "./authority-engine.mjs";
import {
  mutateControllerStateUnderMutexInternal,
  readControllerStateInternal,
  setActivationForAdministrationInternal,
  withStateMutexInternal,
} from "./controller-state-engine.mjs";
import { assertSyntheticPilotContract, assertSyntheticPilotGrant } from "../pilot-security.mjs";
import {
  SYNTHETIC_PILOT_BRANCH,
  SYNTHETIC_PILOT_OUTPUT_PATH,
  SYNTHETIC_PILOT_TASK_KEY,
  SYNTHETIC_PILOT_WORKTREE,
} from "../constants.mjs";
import {
  SyntheticPilotActivationRetirementRequestSchema,
  SyntheticPilotGrantRotationRequestSchema,
} from "../schemas.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";

const TERMINAL_RUN_STATUSES = new Set([
  "SUCCESS",
  "FAILED",
  "INVALID_OUTPUT",
  "SCOPE_VIOLATION",
  "VALIDATION_FAILED",
  "STALE",
]);

export const EXPIRED_READY_PILOT_RETIREMENT = Object.freeze({
  status: "RETIRED_BEFORE_DISPATCH",
  reason: "GRANT_EXPIRED_BEFORE_DISPATCH",
  event: "controller.synthetic-pilot.retired-before-dispatch",
});

function publicKeyPemFromPrivate(privateKeyPem) {
  return crypto.createPublicKey(privateKeyPem).export({ type: "spki", format: "pem" });
}

function restrictControllerPath(target, {
  directory,
  platform = process.platform,
  execFile = execFileSync,
} = {}) {
  fs.chmodSync(target, directory ? 0o700 : 0o600);
  if (platform !== "win32") return;
  const principal = execFile("whoami", [], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (!principal) throw new Error("Cannot determine the controller user for ACL restriction.");
  const access = directory ? `${principal}:(OI)(CI)F` : `${principal}:F`;
  execFile("icacls", [target, "/inheritance:r", "/grant:r", access, "/Q"], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "ignore", "ignore"],
  });
}

function ensureRestrictedDirectory(directory, options) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  restrictControllerPath(directory, { ...options, directory: true });
}

export function inspectAuthorityStoreInternal(context) {
  const result = {
    authority_root_exists: fs.existsSync(context.authority_root),
    private_key_exists: fs.existsSync(context.private_key_path),
    public_key_exists: fs.existsSync(context.public_key_path),
    private_key_matches_pinned: false,
    public_key_matches_private: false,
    public_fingerprint: null,
    pinned_fingerprint: context.pinned_key_fingerprint,
  };
  if (!result.private_key_exists) return result;
  try {
    const signingMaterial = fs.readFileSync(context.private_key_path);
    const derivedPublic = publicKeyPemFromPrivate(signingMaterial);
    result.public_fingerprint = publicKeyFingerprint(derivedPublic);
    result.private_key_matches_pinned = result.public_fingerprint === context.pinned_key_fingerprint;
    if (result.public_key_exists) {
      const storedPublic = fs.readFileSync(context.public_key_path, "utf8");
      result.public_key_matches_private = publicKeyFingerprint(storedPublic) === result.public_fingerprint;
    }
  } catch {
    result.private_key_matches_pinned = false;
    result.public_key_matches_private = false;
  }
  return result;
}

export function bootstrapAuthorityStoreInternal(context, options = {}) {
  const before = inspectAuthorityStoreInternal(context);
  if (before.private_key_exists) {
    if (!before.private_key_matches_pinned) {
      throw new Error("Existing controller private key does not match the pinned trust anchor.");
    }
    if (before.public_key_exists && !before.public_key_matches_private) {
      throw new Error("Stored controller public key does not match the private key.");
    }
    ensureRestrictedDirectory(context.authority_root, options);
    ensureRestrictedDirectory(path.dirname(context.private_key_path), options);
    ensureRestrictedDirectory(context.grants_directory, options);
    ensureRestrictedDirectory(context.state_directory, options);
    const signingMaterial = fs.readFileSync(context.private_key_path);
    if (!before.public_key_exists) {
      fs.writeFileSync(context.public_key_path, publicKeyPemFromPrivate(signingMaterial), {
        mode: 0o600,
        flag: "wx",
      });
    }
    restrictControllerPath(context.private_key_path, { ...options, directory: false });
    restrictControllerPath(context.public_key_path, { ...options, directory: false });
    const state = readControllerStateInternal(context.state_directory);
    return {
      authority_provisioned: true,
      fresh_keypair_generated: false,
      public_fingerprint: before.public_fingerprint,
      private_key_matches_pinned: true,
      trust_anchor_update_required: false,
      activation_authorized: state.activation.authorized,
      pilot_activation_status: state.pilot_activation?.status ?? "DISABLED",
    };
  }
  if (before.public_key_exists) {
    throw new Error("Partial controller authority store contains a public key without its private key.");
  }

  ensureRestrictedDirectory(context.authority_root, options);
  ensureRestrictedDirectory(path.dirname(context.private_key_path), options);
  ensureRestrictedDirectory(context.grants_directory, options);
  ensureRestrictedDirectory(context.state_directory, options);
  const keyPair = crypto.generateKeyPairSync("ed25519");
  const privateKeyPem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" });
  const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" });
  fs.writeFileSync(context.private_key_path, privateKeyPem, { mode: 0o600, flag: "wx" });
  restrictControllerPath(context.private_key_path, { ...options, directory: false });
  fs.writeFileSync(context.public_key_path, publicKeyPem, { mode: 0o600, flag: "wx" });
  restrictControllerPath(context.public_key_path, { ...options, directory: false });
  const fingerprint = publicKeyFingerprint(publicKeyPem);
  setActivationForAdministrationInternal(context.state_directory, false, {
    source: "SYS-AUTO-004 secure authority bootstrap",
  });
  const state = readControllerStateInternal(context.state_directory);
  if (state.activation.authorized || state.pilot_activation.status !== "DISABLED") {
    throw new Error("Fresh controller authority did not default to inactive state.");
  }
  return {
    authority_provisioned: true,
    fresh_keypair_generated: true,
    public_fingerprint: fingerprint,
    private_key_matches_pinned: fingerprint === context.pinned_key_fingerprint,
    trust_anchor_update_required: fingerprint !== context.pinned_key_fingerprint,
    activation_authorized: false,
    pilot_activation_status: "DISABLED",
  };
}

export function issueSyntheticPilotGrantInternal({
  contract,
  privateKeyPem,
  publicKeyPem,
  worktreeRealpath,
  authorizationId = crypto.randomUUID({ disableEntropyCache: true }),
  authorizationRevision = 1,
  provenanceSource = "SYS-AUTO-004 one-time synthetic pilot grant",
  now = new Date(),
} = {}) {
  assertSyntheticPilotContract(contract);
  if (publicKeyFingerprint(publicKeyPem)
    !== publicKeyFingerprint(publicKeyPemFromPrivate(privateKeyPem))) {
    throw new Error("Controller signing keypair mismatch.");
  }
  const contractDigest = computeContractDigest(contract);
  const grant = createSignedGrantInternal(contract, {
    privateKeyPem,
    publicKeyPem,
    authorizationId,
    authorizationRevision,
    worktreeRealpath,
    activation: {
      autonomous: false,
      worker_dispatch: true,
      synthetic_pilot_once: {
        task_key: contract.task_key,
        contract_digest: contractDigest,
        card_blob_sha: contract.card_blob_sha,
        max_dispatch_attempts: 1,
        max_workers: 1,
        publishing: false,
        network: true,
        production: false,
        dns: false,
        deployment: false,
      },
    },
    publishing: {
      commit: false,
      push: false,
      pr: false,
      merge: false,
      force: false,
      allowed_branch: contract.branch,
      approval_required_actions: [],
    },
    provenance: {
      authorized_by: "human-authorized synthetic pilot administration",
      source: provenanceSource,
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      non_expiring_policy: "NONE",
    },
  });
  assertSyntheticPilotGrant(contract, grant);
  return grant;
}

export function writeSignedGrantOnceInternal(target, grant, options = {}) {
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  fs.writeFileSync(target, `${JSON.stringify(grant, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  restrictControllerPath(target, { ...options, directory: false });
  return target;
}

function samePath(left, right) {
  return path.resolve(left).replace(/\\/g, "/").toLocaleLowerCase("en-US")
    === path.resolve(right).replace(/\\/g, "/").toLocaleLowerCase("en-US");
}

function assertRetirableSyntheticPilotGrant(grant, worktreeRealpath) {
  if (grant.task_key !== SYNTHETIC_PILOT_TASK_KEY
    || grant.branch !== SYNTHETIC_PILOT_BRANCH
    || grant.worktree !== SYNTHETIC_PILOT_WORKTREE
    || !samePath(grant.worktree_realpath, worktreeRealpath)) {
    throw new Error("Expired Grant is not bound to the exact synthetic pilot identity and worktree.");
  }
  if (grant.owner_role !== "ORCHESTRATOR" || grant.reviewer_role !== "QA_PERFORMANCE"
    || grant.mode !== "IMPLEMENT" || grant.risk !== "LOW" || grant.dependencies.length !== 0
    || grant.write_files.length !== 1 || grant.write_files[0] !== SYNTHETIC_PILOT_OUTPUT_PATH
    || grant.write_prefixes.length !== 0 || grant.administrative_files.length !== 0
    || grant.shared_file_grants.length !== 0) {
    throw new Error("Expired Grant is not structurally a synthetic-pilot Grant.");
  }
  if (grant.review_target !== null
    || grant.validation_profile.name !== "synthetic-pilot-deterministic-output"
    || JSON.stringify(grant.validation_profile.commands) !== JSON.stringify([
      "git diff --check",
      "node workflow/fixtures/pilot/validate-synthetic-result.mjs",
    ])) {
    throw new Error("Expired Grant is not the exact deterministic synthetic-pilot profile.");
  }
  const permissions = grant.permissions;
  if (!permissions.repository_write || !permissions.worker_dispatch) {
    throw new Error("Expired synthetic-pilot Grant lacks its exact one-shot permissions.");
  }
  for (const permission of [
    "git_commit", "branch_push", "automation_activation", "github_write", "pr_create",
    "merge", "production", "dns", "secret_write", "external_action", "task_adoption",
  ]) {
    if (permissions[permission] !== false) {
      throw new Error(`Expired synthetic-pilot Grant has forbidden permission: ${permission}`);
    }
  }
  if (grant.limits.max_workers !== 1 || grant.limits.max_correction_cycles !== 0
    || grant.synthetic_pilot.max_workers !== 1
    || grant.synthetic_pilot.timeout_seconds !== grant.limits.timeout_seconds
    || grant.limits.lease_seconds <= grant.limits.timeout_seconds + 5
    || grant.synthetic_pilot.write_files.length !== 1
    || grant.synthetic_pilot.write_files[0] !== SYNTHETIC_PILOT_OUTPUT_PATH
    || grant.synthetic_pilot.write_prefixes.length !== 0) {
    throw new Error("Expired synthetic-pilot Grant has broader scope or worker limits.");
  }
  const activation = grant.activation.synthetic_pilot_once;
  if (grant.activation.autonomous || !grant.activation.worker_dispatch
    || activation.task_key !== grant.task_key
    || activation.contract_digest !== grant.contract_digest
    || activation.card_blob_sha !== grant.card_blob_sha
    || activation.max_dispatch_attempts !== 1 || activation.max_workers !== 1
    || activation.network !== grant.synthetic_pilot.network) {
    throw new Error("Expired synthetic-pilot Grant has an invalid one-shot activation binding.");
  }
  for (const field of ["publishing", "production", "dns", "deployment"]) {
    if (activation[field] !== false) {
      throw new Error(`Expired synthetic-pilot Grant broadens ${field}.`);
    }
  }
  if (grant.publishing.commit || grant.publishing.push || grant.publishing.pr
    || grant.publishing.merge || grant.publishing.force
    || grant.publishing.allowed_branch !== SYNTHETIC_PILOT_BRANCH
    || grant.publishing.approval_required_actions.length !== 0) {
    throw new Error("Expired synthetic-pilot Grant contains publishing authority.");
  }
  if (grant.routing.executor_platform !== "Codex" || grant.routing.provider !== "OpenAI"
    || grant.routing.requested_model !== "gpt-5.6-sol"
    || grant.routing.reasoning_effort !== "high" || grant.routing.fallback !== "BLOCKED") {
    throw new Error("Expired synthetic-pilot Grant has a broadened routing profile.");
  }
  return true;
}

function liveAt(record, nowMs) {
  return !Number.isFinite(record?.expires_at_ms) || record.expires_at_ms > nowMs;
}

function retiredActivationFromRecord(record) {
  return {
    ...structuredClone(record.activation_before),
    status: EXPIRED_READY_PILOT_RETIREMENT.status,
    retired_at: record.retired_at,
    retirement_reason: record.retirement_reason,
    retirement_human_authorization_id: record.retirement_human_authorization_id,
    expired_grant_authorization_id: record.expired_grant_authorization_id,
    expired_grant_digest: record.expired_grant_digest,
    expired_grant_expires_at: record.expired_grant_expires_at,
  };
}

function matchingRetirementRecord(state, grant) {
  const activation = state.pilot_activation;
  const humanAuthorizationId = activation?.retirement_human_authorization_id;
  const record = state.pilot_activation_retirement_history?.[humanAuthorizationId];
  if (!record
    || record.activation_id !== activation.activation_id
    || record.task_key !== activation.task_key
    || record.retirement_reason !== EXPIRED_READY_PILOT_RETIREMENT.reason
    || record.expired_grant_authorization_id !== grant.authorization_id
    || record.expired_grant_digest !== grant.envelope_digest
    || record.expired_grant_expires_at !== grant.provenance.expires_at
    || record.contract_digest !== grant.contract_digest
    || record.card_blob_sha !== grant.card_blob_sha
    || record.activation_before.authorization_id !== grant.authorization_id
    || record.activation_before.contract_digest !== grant.contract_digest
    || record.activation_before.card_blob_sha !== grant.card_blob_sha
    || canonicalJson(retiredActivationFromRecord(record)) !== canonicalJson(activation)) {
    throw new Error("RETIRED_BEFORE_DISPATCH durable retirement evidence does not match the exact expired Grant being rotated.");
  }
  return record;
}

function assertRetirementStateSafe(state, grant, humanAuthorizationId, now) {
  if (state.activation?.authorized !== false) {
    throw new Error("General autonomous activation must remain disabled during activation retirement.");
  }
  const activation = state.pilot_activation;
  if (activation?.status !== "READY") {
    throw new Error("Only a READY synthetic pilot activation can be retired before dispatch.");
  }
  if (activation.task_key !== SYNTHETIC_PILOT_TASK_KEY
    || activation.authorization_id !== grant.authorization_id
    || activation.contract_digest !== grant.contract_digest
    || activation.card_blob_sha !== grant.card_blob_sha
    || activation.max_workers !== 1
    || activation.dispatch_attempts !== 0
    || activation.network !== grant.activation.synthetic_pilot_once.network
    || activation.publishing !== false
    || activation.production !== false
    || activation.dns !== false
    || activation.deployment !== false
    || activation.consumed_at !== null
    || activation.consumed_run_id !== null) {
    throw new Error("READY synthetic pilot activation does not exactly match an undispatched expired Grant.");
  }
  const activationAuthorization = state.pilot_authorization_history
    ?.[activation.human_authorization_id];
  if (!activationAuthorization
    || activationAuthorization.activation_id !== activation.activation_id
    || activationAuthorization.task_key !== activation.task_key
    || activationAuthorization.activated_at !== activation.activated_at) {
    throw new Error("READY synthetic pilot activation authorization history is unavailable or inconsistent.");
  }
  state.pilot_activation_retirement_history ??= {};
  state.grant_rotation_history ??= {};
  if (state.pilot_authorization_history[humanAuthorizationId]
    || state.pilot_activation_retirement_history[humanAuthorizationId]
    || state.grant_rotation_history[humanAuthorizationId]) {
    throw new Error("Synthetic pilot human authorization ID has already been used.");
  }
  const associatedRuns = Object.values(state.runs ?? {})
    .filter((run) => run.one_time_pilot_activation_id === activation.activation_id);
  if (associatedRuns.length > 0) {
    throw new Error("Undispatched activation retirement requires zero associated runs.");
  }
  const nowMs = now.getTime();
  const liveLeases = Object.values(state.leases ?? {})
    .filter((lease) => liveAt(lease, nowMs));
  if (liveLeases.length > 0) {
    throw new Error("Undispatched activation retirement requires zero live leases.");
  }
  const liveReservations = Object.values(state.reservations ?? {})
    .filter((reservation) => liveAt(reservation, nowMs));
  if (liveReservations.length > 0) {
    throw new Error("Undispatched activation retirement requires zero live reservations.");
  }
  return activation;
}

function assertRotationStateSafe(state, grant, humanAuthorizationId, now) {
  if (state.activation?.authorized !== false) {
    throw new Error("General autonomous activation must remain disabled during Grant rotation.");
  }
  const pilotStatus = state.pilot_activation?.status;
  if (pilotStatus === "READY") {
    throw new Error("A READY synthetic pilot activation blocks Grant rotation.");
  }
  if (!["DISABLED", "CONSUMED", EXPIRED_READY_PILOT_RETIREMENT.status].includes(pilotStatus)) {
    throw new Error("Synthetic pilot activation state is not safe for Grant rotation.");
  }
  if (pilotStatus === EXPIRED_READY_PILOT_RETIREMENT.status) {
    matchingRetirementRecord(state, grant);
  }
  if (!state.pilot_authorization_history
    || typeof state.pilot_authorization_history !== "object"
    || Array.isArray(state.pilot_authorization_history)) {
    throw new Error("Synthetic pilot authorization history is unavailable or invalid.");
  }
  state.grant_rotation_history ??= {};
  if (state.pilot_authorization_history[humanAuthorizationId]
    || state.pilot_activation_retirement_history?.[humanAuthorizationId]
    || state.grant_rotation_history[humanAuthorizationId]) {
    throw new Error("Synthetic pilot human authorization ID has already been used.");
  }
  const nowMs = now.getTime();
  const liveWorkers = Object.values(state.leases ?? {})
    .filter((lease) => lease.kind === "worker" && liveAt(lease, nowMs));
  if (liveWorkers.length > 0) {
    throw new Error("Expired Grant rotation requires zero live worker leases.");
  }
  const liveReservations = Object.values(state.reservations ?? {})
    .filter((reservation) => liveAt(reservation, nowMs));
  if (liveReservations.length > 0) {
    throw new Error("Expired Grant rotation requires zero live reservations.");
  }
  const activeRuns = Object.values(state.runs ?? {})
    .filter((run) => !TERMINAL_RUN_STATUSES.has(run.status));
  if (activeRuns.length > 0) {
    throw new Error("Expired Grant rotation requires zero active worker runs.");
  }
}

export function retireExpiredReadySyntheticPilotActivationInternal({
  context,
  worktreeRealpath,
  request,
  now = new Date(),
} = {}) {
  const parsedRequest = SyntheticPilotActivationRetirementRequestSchema.parse(request);
  if (!context?.grants_directory || !context?.state_directory
    || !context?.pinned_public_key_pem || !context?.pinned_key_fingerprint) {
    throw new Error("Expired READY activation retirement requires controller authority context.");
  }
  if (!path.isAbsolute(worktreeRealpath) || !fs.existsSync(worktreeRealpath)
    || !samePath(worktreeRealpath, fs.realpathSync.native(worktreeRealpath))) {
    throw new Error("Synthetic pilot worktree must be an existing exact realpath.");
  }
  const canonicalGrant = path.join(context.grants_directory, `${SYNTHETIC_PILOT_TASK_KEY}.json`);

  return withStateMutexInternal(context.state_directory, ({ ownerToken }) => {
    if (!fs.existsSync(canonicalGrant)) {
      throw new Error("Existing canonical synthetic-pilot Grant is unavailable.");
    }
    let grantInput;
    try {
      grantInput = JSON.parse(fs.readFileSync(canonicalGrant, "utf8"));
    } catch (error) {
      throw new Error("Existing canonical synthetic-pilot Grant is not valid JSON.", { cause: error });
    }
    const grant = validateExpiredSyntheticPilotGrantForRetirementInternal(grantInput, {
      now,
      trustedPublicKeyPem: context.pinned_public_key_pem,
      trustedFingerprint: context.pinned_key_fingerprint,
    });
    assertRetirableSyntheticPilotGrant(grant, worktreeRealpath);
    const state = readControllerStateInternal(context.state_directory);
    const activation = assertRetirementStateSafe(
      state,
      grant,
      parsedRequest.human_authorization_id,
      now,
    );
    const record = {
      task_key: SYNTHETIC_PILOT_TASK_KEY,
      activation_id: activation.activation_id,
      activation_human_authorization_id: activation.human_authorization_id,
      retirement_human_authorization_id: parsedRequest.human_authorization_id,
      retirement_reason: EXPIRED_READY_PILOT_RETIREMENT.reason,
      retired_at: now.toISOString(),
      expired_grant_authorization_id: grant.authorization_id,
      expired_grant_digest: grant.envelope_digest,
      expired_grant_expires_at: grant.provenance.expires_at,
      contract_digest: grant.contract_digest,
      card_blob_sha: grant.card_blob_sha,
      activation_before: structuredClone(activation),
    };
    const mutation = mutateControllerStateUnderMutexInternal(context.state_directory, ownerToken, {
      type: EXPIRED_READY_PILOT_RETIREMENT.event,
      taskKey: SYNTHETIC_PILOT_TASK_KEY,
      payload: {
        task_key: record.task_key,
        activation_id: record.activation_id,
        activation_human_authorization_id: record.activation_human_authorization_id,
        retirement_human_authorization_id: record.retirement_human_authorization_id,
        retirement_reason: record.retirement_reason,
        retired_at: record.retired_at,
        expired_grant_authorization_id: record.expired_grant_authorization_id,
        expired_grant_digest: record.expired_grant_digest,
        expired_grant_expires_at: record.expired_grant_expires_at,
        contract_digest: record.contract_digest,
        card_blob_sha: record.card_blob_sha,
        dispatch_attempts: 0,
      },
    }, (nextState) => {
      assertRetirementStateSafe(
        nextState,
        grant,
        parsedRequest.human_authorization_id,
        now,
      );
      nextState.pilot_activation_retirement_history[parsedRequest.human_authorization_id]
        = structuredClone(record);
      nextState.pilot_activation = retiredActivationFromRecord(record);
      return structuredClone(record);
    });
    return {
      retired: true,
      ...mutation.result,
      activation_status: EXPIRED_READY_PILOT_RETIREMENT.status,
      dispatches: 0,
      workers_started: 0,
    };
  });
}

function restrictedTemporary(target, bytes, options) {
  const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, bytes, { mode: 0o600, flag: "wx" });
  restrictControllerPath(temporary, { ...options, directory: false });
  return temporary;
}

function createArchiveFromTemporary(temporary, target) {
  fs.linkSync(temporary, target);
  fs.unlinkSync(temporary);
}

function relativeAuthorityPath(context, target) {
  const relative = path.relative(context.authority_root, target).replace(/\\/g, "/");
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Grant archive must remain inside the canonical authority root.");
  }
  return relative;
}

function fileSha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function rotationRecorded(stateDirectory, humanAuthorizationId, newAuthorizationId) {
  try {
    const recorded = readControllerStateInternal(stateDirectory)
      .grant_rotation_history?.[humanAuthorizationId];
    return recorded?.new_authorization_id === newAuthorizationId;
  } catch {
    return false;
  }
}

// Internal implementation for the controller administration facade. Test-only
// hooks are accepted here so failure paths can be proven without touching the
// canonical controller store; the public facade exposes none of them.
export function rotateExpiredSyntheticPilotGrantInternal({
  context,
  contract,
  worktreeRealpath,
  request,
  now = new Date(),
  fileOptions = {},
  beforeFreshInstall,
} = {}) {
  const parsedRequest = SyntheticPilotGrantRotationRequestSchema.parse(request);
  assertSyntheticPilotContract(contract);
  if (!context?.authority_root || !context?.grants_directory || !context?.state_directory
    || !context?.private_key_path || !context?.public_key_path
    || !context?.pinned_public_key_pem || !context?.pinned_key_fingerprint) {
    throw new Error("Expired Grant rotation requires controller authority context.");
  }
  if (!path.isAbsolute(worktreeRealpath) || !fs.existsSync(worktreeRealpath)
    || !samePath(worktreeRealpath, fs.realpathSync.native(worktreeRealpath))) {
    throw new Error("Synthetic pilot worktree must be an existing exact realpath.");
  }
  const canonicalGrant = path.join(context.grants_directory, `${SYNTHETIC_PILOT_TASK_KEY}.json`);

  return withStateMutexInternal(context.state_directory, ({ ownerToken }) => {
    if (!fs.existsSync(canonicalGrant)) {
      throw new Error("Existing canonical synthetic-pilot Grant is unavailable.");
    }
    const oldBytes = fs.readFileSync(canonicalGrant);
    let oldInput;
    try {
      oldInput = JSON.parse(oldBytes.toString("utf8"));
    } catch (error) {
      throw new Error("Existing canonical synthetic-pilot Grant is not valid JSON.", { cause: error });
    }
    const oldGrant = validateExpiredSyntheticPilotGrantForRetirementInternal(oldInput, {
      now,
      trustedPublicKeyPem: context.pinned_public_key_pem,
      trustedFingerprint: context.pinned_key_fingerprint,
    });
    assertRetirableSyntheticPilotGrant(oldGrant, worktreeRealpath);

    const state = readControllerStateInternal(context.state_directory);
    assertRotationStateSafe(state, oldGrant, parsedRequest.human_authorization_id, now);

    const privateKeyPem = fs.readFileSync(context.private_key_path, "utf8");
    const publicKeyPem = fs.readFileSync(context.public_key_path, "utf8");
    if (publicKeyFingerprint(publicKeyPem) !== context.pinned_key_fingerprint) {
      throw new Error("Stored controller public key does not match the pinned trust anchor.");
    }
    const newGrant = issueSyntheticPilotGrantInternal({
      contract,
      privateKeyPem,
      publicKeyPem,
      worktreeRealpath,
      authorizationRevision: oldGrant.authorization_revision + 1,
      provenanceSource: "SYS-AUTO-007 expired synthetic pilot Grant rotation",
      now,
    });
    if (newGrant.authorization_id === oldGrant.authorization_id) {
      throw new Error("Fresh synthetic-pilot Grant reused the old authorization ID.");
    }
    validateGrantAgainstAnchorInternal(contract, newGrant, {
      repoRoot: worktreeRealpath,
      now,
      trustedPublicKeyPem: context.pinned_public_key_pem,
      trustedFingerprint: context.pinned_key_fingerprint,
    });
    assertSyntheticPilotGrant(contract, newGrant);

    const archiveDirectory = path.join(
      context.grants_directory,
      "archive",
      SYNTHETIC_PILOT_TASK_KEY,
    );
    ensureRestrictedDirectory(path.join(context.grants_directory, "archive"), fileOptions);
    ensureRestrictedDirectory(archiveDirectory, fileOptions);
    const archiveTarget = path.join(archiveDirectory, `${oldGrant.authorization_id}.json`);
    if (fs.existsSync(archiveTarget)) {
      throw new Error("Expired Grant archive record already exists; refusing collision.");
    }

    const oldGrantDigest = fileSha256(oldBytes);
    const archiveIdentifier = relativeAuthorityPath(context, archiveTarget);
    const newBytes = Buffer.from(`${JSON.stringify(newGrant, null, 2)}\n`, "utf8");
    let archiveTemporary;
    let canonicalTemporary;
    let canonicalReplaced = false;
    try {
      archiveTemporary = restrictedTemporary(archiveTarget, oldBytes, fileOptions);
      canonicalTemporary = restrictedTemporary(canonicalGrant, newBytes, fileOptions);
      createArchiveFromTemporary(archiveTemporary, archiveTarget);
      archiveTemporary = null;
      if (!fs.readFileSync(archiveTarget).equals(oldBytes)) {
        throw new Error("Archived Grant bytes do not match the retired canonical Grant.");
      }
      if (beforeFreshInstall) beforeFreshInstall();
      fs.renameSync(canonicalTemporary, canonicalGrant);
      canonicalTemporary = null;
      canonicalReplaced = true;

      const rotationTimestamp = now.toISOString();
      const audit = {
        task_key: SYNTHETIC_PILOT_TASK_KEY,
        human_authorization_id: parsedRequest.human_authorization_id,
        old_authorization_id: oldGrant.authorization_id,
        old_grant_digest: oldGrantDigest,
        new_authorization_id: newGrant.authorization_id,
        new_grant_digest: newGrant.envelope_digest,
        rotation_timestamp: rotationTimestamp,
        archive_identifier: archiveIdentifier,
      };
      mutateControllerStateUnderMutexInternal(context.state_directory, ownerToken, {
        type: "controller.synthetic-pilot.grant-rotated",
        taskKey: SYNTHETIC_PILOT_TASK_KEY,
        payload: audit,
      }, (nextState) => {
        assertRotationStateSafe(
          nextState,
          oldGrant,
          parsedRequest.human_authorization_id,
          now,
        );
        nextState.grant_rotation_history[parsedRequest.human_authorization_id] = structuredClone(audit);
        return structuredClone(audit);
      });
      return {
        rotated: true,
        ...audit,
        authorization_revision: newGrant.authorization_revision,
        activation: false,
        workers_started: 0,
      };
    } catch (error) {
      if (canonicalReplaced
        && rotationRecorded(
          context.state_directory,
          parsedRequest.human_authorization_id,
          newGrant.authorization_id,
        )) {
        return {
          rotated: true,
          task_key: SYNTHETIC_PILOT_TASK_KEY,
          human_authorization_id: parsedRequest.human_authorization_id,
          old_authorization_id: oldGrant.authorization_id,
          old_grant_digest: oldGrantDigest,
          new_authorization_id: newGrant.authorization_id,
          new_grant_digest: newGrant.envelope_digest,
          rotation_timestamp: now.toISOString(),
          archive_identifier: archiveIdentifier,
          authorization_revision: newGrant.authorization_revision,
          activation: false,
          workers_started: 0,
        };
      }
      if (canonicalReplaced) {
        const rollback = restrictedTemporary(canonicalGrant, oldBytes, fileOptions);
        fs.renameSync(rollback, canonicalGrant);
      }
      throw error;
    } finally {
      for (const temporary of [archiveTemporary, canonicalTemporary]) {
        if (temporary && fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
    }
  });
}
