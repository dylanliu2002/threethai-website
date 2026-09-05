import fs from "node:fs";
import { loadAuthorizationGrant } from "../authority.mjs";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";

export function productionEngineInternal(repoRoot, taskKey, { requirePrivateKey = false } = {}) {
  const context = resolveCanonicalControllerContext(repoRoot);
  const privateKeyPem = fs.existsSync(context.private_key_path)
    ? fs.readFileSync(context.private_key_path, "utf8")
    : null;
  if (requirePrivateKey && !privateKeyPem) {
    throw new Error("Canonical controller administration is not provisioned.");
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
