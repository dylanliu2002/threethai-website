import crypto from "node:crypto";
import fs from "node:fs";
import { loadAuthorizationGrant } from "../authority.mjs";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";

export function productionEngineInternal(repoRoot, taskKey, { requirePrivateKey = false } = {}) {
  const context = resolveCanonicalControllerContext(repoRoot);
  const privateKeyPem = fs.existsSync(context.private_key_path)
    ? fs.readFileSync(context.private_key_path, "utf8")
    : null;
  if (requirePrivateKey && !privateKeyPem) {
    throw new Error("Canonical controller administration is not provisioned.");
  }
  if (privateKeyPem) {
    let fingerprint;
    try {
      fingerprint = publicKeyFingerprint(
        crypto.createPublicKey(privateKeyPem).export({ type: "spki", format: "pem" }),
      );
    } catch {
      throw new Error("Canonical controller signing credential is invalid.");
    }
    if (fingerprint !== context.pinned_key_fingerprint) {
      throw new Error("Canonical controller signing credential does not match the pinned trust anchor.");
    }
  }
  return Object.freeze({
    repoRoot: context.worktree_root,
    stateDirectory: context.state_directory,
    publicKeyPem: context.pinned_public_key_pem,
    keyFingerprint: context.pinned_key_fingerprint,
    privateKeyPem,
    loadGrant: () => loadAuthorizationGrant(repoRoot, taskKey),
  });
}
