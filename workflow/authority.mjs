import fs from "node:fs";
import path from "node:path";
import { resolveCanonicalControllerContext } from "./controller-context.mjs";
import { loadContracts } from "./contract.mjs";
import {
  authorizationFieldsFromContractInternal,
  grantDigestInternal,
  validateGrantAgainstAnchorInternal,
} from "./internal/authority-engine.mjs";

function assertTaskKey(taskKey) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(taskKey)) throw new Error("Invalid task key.");
}

// DATA helper only: the digest grants no authority. Privileged boundaries also
// require an Ed25519 signature from the pinned controller identity.
export function computeGrantDigest(grant) {
  return grantDigestInternal(grant);
}

// DATA helper only, used for static comparison and administrative review.
export function authorizationFieldsFromContract(contract) {
  return authorizationFieldsFromContractInternal(contract);
}

export function canonicalGrantPath(repoRoot, taskKey) {
  assertTaskKey(taskKey);
  const context = resolveCanonicalControllerContext(repoRoot);
  return path.join(context.grants_directory, `${taskKey}.json`);
}

export function loadAuthorizationGrant(repoRoot, taskKey) {
  const file = canonicalGrantPath(repoRoot, taskKey);
  if (!fs.existsSync(file)) throw new Error(`Pinned controller Grant is unavailable for ${taskKey}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// The caller supplies a claim (DATA); the trust anchor is always resolved from
// reviewed controller code and cannot be replaced through this API.
export function validateTrustedGrant(contractInput, grantInput, {
  repoRoot,
  verifyCard = true,
  now = new Date(),
} = {}) {
  if (!repoRoot && verifyCard) throw new Error("repoRoot is required for trusted Grant validation.");
  const context = repoRoot ? resolveCanonicalControllerContext(repoRoot) : null;
  if (!context) throw new Error("Trusted Grant validation requires canonical repository context.");
  return validateGrantAgainstAnchorInternal(contractInput, grantInput, {
    repoRoot,
    verifyCard,
    now,
    trustedPublicKeyPem: context.pinned_public_key_pem,
    trustedFingerprint: context.pinned_key_fingerprint,
  });
}

export function loadTrustedTaskAuthority(repoRoot, taskKey, {
  verifyCard = true,
  now = new Date(),
} = {}) {
  const contracts = loadContracts(repoRoot, { verifyCard });
  const contract = contracts.find((item) => item.task_key === taskKey);
  if (!contract) throw new Error(`Unknown machine Task Contract: ${taskKey}`);
  const grant = loadAuthorizationGrant(repoRoot, taskKey);
  const trusted = validateTrustedGrant(contract, grant, { repoRoot, verifyCard, now });
  return { ...trusted, context: resolveCanonicalControllerContext(repoRoot) };
}

export function defaultControllerStateDirectory(repoRoot) {
  return resolveCanonicalControllerContext(repoRoot).state_directory;
}
