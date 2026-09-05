import { loadAuthorizationGrant } from "../authority.mjs";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";
import { ProtectedControllerSigner } from "../isolation/signer.mjs";

export function productionEngineInternal(repoRoot, taskKey, { requireSigner = false } = {}) {
  const context = resolveCanonicalControllerContext(repoRoot);
  const signer = new ProtectedControllerSigner({
    reference: context.signer_reference,
    fingerprint: context.pinned_key_fingerprint,
  });
  if (requireSigner && !signer.available) {
    throw new Error("PENDING_MACHINE_AUTHORIZATION: protected controller signer is not provisioned.");
  }
  return Object.freeze({
    repoRoot: context.worktree_root,
    stateDirectory: context.state_directory,
    publicKeyPem: context.pinned_public_key_pem,
    keyFingerprint: context.pinned_key_fingerprint,
    signer,
    loadGrant: () => loadAuthorizationGrant(repoRoot, taskKey),
  });
}
