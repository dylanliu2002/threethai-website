import fs from "node:fs";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";
import { validateGrantAgainstAnchorInternal } from "../internal/authority-engine.mjs";
import { setActivationForAdministrationInternal } from "../internal/controller-state-engine.mjs";

// Deliberately separate from ordinary runtime imports. This bootstrap can only
// provision INACTIVE state around an already installed non-exportable signer.
// It never accepts or writes private key bytes or a private-key filesystem path.
export function bootstrapInactiveAuthority({ repoRoot, signerReference, signerFingerprint }) {
  const context = resolveCanonicalControllerContext(repoRoot);
  if (signerReference !== context.signer_reference || signerFingerprint !== context.pinned_key_fingerprint) {
    throw new Error("Protected signer descriptor does not match the pinned controller identity.");
  }
  if (fs.existsSync(context.authority_root)) throw new Error("Controller authority is already provisioned; replacement is forbidden.");
  fs.mkdirSync(context.grants_directory, { recursive: true, mode: 0o700 });
  return setActivationForAdministrationInternal(context.state_directory, false, {
    source: "separately-authorized-protected-signer-bootstrap",
  });
}

export function installSignedGrant({ repoRoot, contract, grant }) {
  const context = resolveCanonicalControllerContext(repoRoot);
  if (!context.provisioned) throw new Error("Canonical administration is not provisioned.");
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
  throw new Error("Activation is not authorized or implemented by SYS-AUTO-002.");
}
