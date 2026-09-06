import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { computeContractDigest } from "../contract.mjs";
import { createSignedGrantInternal } from "./authority-engine.mjs";
import {
  readControllerStateInternal,
  setActivationForAdministrationInternal,
} from "./controller-state-engine.mjs";
import { assertSyntheticPilotContract, assertSyntheticPilotGrant } from "../pilot-security.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";

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
    authorizationRevision: 1,
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
        network: false,
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
      source: "SYS-AUTO-004 one-time synthetic pilot grant",
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
