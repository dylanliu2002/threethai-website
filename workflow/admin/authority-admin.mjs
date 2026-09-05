import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";
import { validateGrantAgainstAnchorInternal } from "../internal/authority-engine.mjs";
import { setActivationForAdministrationInternal } from "../internal/controller-state-engine.mjs";

function privateKeyPublicFingerprint(privateKeyPem) {
  return publicKeyFingerprint(crypto.createPublicKey(privateKeyPem).export({ type: "spki", format: "pem" }));
}

// Deliberately separate from ordinary runtime imports. This bootstrap can only
// provision an INACTIVE canonical authority. Enabling or key rotation is not
// implemented and requires a separate user-authorized task.
export function bootstrapInactiveAuthority({ repoRoot, privateKeyPem }) {
  const context = resolveCanonicalControllerContext(repoRoot);
  if (privateKeyPublicFingerprint(privateKeyPem) !== context.pinned_key_fingerprint) {
    throw new Error("Administrative private key does not match the pinned controller identity.");
  }
  if (fs.existsSync(context.private_key_path)) throw new Error("Controller authority is already provisioned; key replacement is forbidden.");
  fs.mkdirSync(path.dirname(context.private_key_path), { recursive: true, mode: 0o700 });
  fs.mkdirSync(context.grants_directory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(context.private_key_path, privateKeyPem, { mode: 0o600, flag: "wx" });
  return setActivationForAdministrationInternal(context.state_directory, false, {
    source: "separately-authorized-admin-bootstrap",
  });
}

export function installSignedGrant({ repoRoot, contract, grant }) {
  const context = resolveCanonicalControllerContext(repoRoot);
  if (!fs.existsSync(context.private_key_path)) throw new Error("Canonical administration is not provisioned.");
  validateGrantAgainstAnchorInternal(contract, grant, {
    repoRoot,
    trustedPublicKeyPem: context.pinned_public_key_pem,
    trustedFingerprint: context.pinned_key_fingerprint,
  });
  const target = path.join(context.grants_directory, `${contract.task_key}.json`);
  if (fs.existsSync(target)) throw new Error("Grant replacement requires separate revocation/authorization and is not implemented.");
  fs.writeFileSync(target, `${JSON.stringify(grant, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  return { installed: true, task_key: contract.task_key, activation: false };
}

export function enableActivation() {
  throw new Error("Activation is not authorized or implemented by SYS-AUTO-001.");
}
