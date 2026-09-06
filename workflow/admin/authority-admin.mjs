import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadTrustedTaskAuthority } from "../authority.mjs";
import { loadContracts } from "../contract.mjs";
import { resolveCanonicalControllerContext } from "../controller-context.mjs";
import { SYNTHETIC_PILOT_TASK_KEY } from "../constants.mjs";
import { validateGrantAgainstAnchorInternal } from "../internal/authority-engine.mjs";
import { enableSyntheticPilotOnceInternal } from "../internal/controller-state-engine.mjs";
import {
  bootstrapAuthorityStoreInternal,
  inspectAuthorityStoreInternal,
  issueSyntheticPilotGrantInternal,
  writeSignedGrantOnceInternal,
} from "../internal/pilot-admin-engine.mjs";
import { assertSyntheticPilotContract, assertSyntheticPilotGrant } from "../pilot-security.mjs";
import { SyntheticPilotActivationRequestSchema } from "../schemas.mjs";

function exactOptions(options, allowed) {
  const extras = Object.keys(options).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new Error(`Unsupported pilot administration option: ${extras.sort().join(", ")}`);
  }
}

function requireRepoRoot(repoRoot) {
  if (typeof repoRoot !== "string" || repoRoot.length === 0) {
    throw new Error("Pilot administration requires repoRoot.");
  }
  return repoRoot;
}

function requireMatchingCanonicalAuthority(context) {
  const inspection = inspectAuthorityStoreInternal(context);
  if (!inspection.private_key_exists || !inspection.private_key_matches_pinned
    || !inspection.public_key_exists || !inspection.public_key_matches_private) {
    throw new Error("Canonical controller authority is absent, invalid, or mismatched.");
  }
  return inspection;
}

function assertExactPilotWorktree(context, contract) {
  const expected = path.resolve(context.workspace_directory, contract.worktree);
  const actual = fs.realpathSync.native(context.worktree_root);
  if (!fs.existsSync(expected)
    || fs.realpathSync.native(expected).toLocaleLowerCase("en-US")
      !== actual.toLocaleLowerCase("en-US")) {
    throw new Error("Synthetic pilot Grant must be issued from its exact worktree.");
  }
  const branch = execFileSync("git", ["branch", "--show-current"], {
    cwd: actual,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (branch !== contract.branch) {
    throw new Error("Synthetic pilot Grant worktree is on the wrong branch.");
  }
  return actual;
}

export function inspectCanonicalAuthority(options = {}) {
  exactOptions(options, ["repoRoot"]);
  const context = resolveCanonicalControllerContext(requireRepoRoot(options.repoRoot));
  return inspectAuthorityStoreInternal(context);
}

// Generates an Ed25519 keypair internally when the canonical store has no key.
// Private key injection and historical-key fabrication are deliberately absent.
export function bootstrapCanonicalAuthority(options = {}) {
  exactOptions(options, ["repoRoot"]);
  const context = resolveCanonicalControllerContext(requireRepoRoot(options.repoRoot));
  return bootstrapAuthorityStoreInternal(context);
}

export function bootstrapInactiveAuthority() {
  throw new Error("Caller-supplied controller private keys are forbidden; use bootstrapCanonicalAuthority().");
}

export function installSignedGrant({ repoRoot, contract, grant } = {}) {
  const context = resolveCanonicalControllerContext(requireRepoRoot(repoRoot));
  requireMatchingCanonicalAuthority(context);
  assertSyntheticPilotGrant(contract, grant);
  const worktreeRealpath = assertExactPilotWorktree(context, contract);
  if (!fs.existsSync(grant.worktree_realpath)
    || fs.realpathSync.native(grant.worktree_realpath).toLocaleLowerCase("en-US")
      !== worktreeRealpath.toLocaleLowerCase("en-US")) {
    throw new Error("Synthetic pilot Grant names the wrong physical worktree.");
  }
  validateGrantAgainstAnchorInternal(contract, grant, {
    repoRoot,
    trustedPublicKeyPem: context.pinned_public_key_pem,
    trustedFingerprint: context.pinned_key_fingerprint,
  });
  const target = path.join(context.grants_directory, `${contract.task_key}.json`);
  if (fs.existsSync(target)) {
    throw new Error("Grant replacement requires new human authorization and is not implemented.");
  }
  writeSignedGrantOnceInternal(target, grant);
  return {
    installed: true,
    task_key: contract.task_key,
    authorization_id: grant.authorization_id,
    grant_digest: grant.envelope_digest,
    activation: false,
  };
}

export function issueAndInstallSyntheticPilotGrant(options = {}) {
  exactOptions(options, ["repoRoot"]);
  const repoRoot = requireRepoRoot(options.repoRoot);
  const context = resolveCanonicalControllerContext(repoRoot);
  requireMatchingCanonicalAuthority(context);
  const contract = loadContracts(repoRoot)
    .find((candidate) => candidate.task_key === SYNTHETIC_PILOT_TASK_KEY);
  if (!contract) throw new Error("Synthetic pilot machine contract is unavailable.");
  assertSyntheticPilotContract(contract);
  const worktreeRealpath = assertExactPilotWorktree(context, contract);
  const privateKeyPem = fs.readFileSync(context.private_key_path, "utf8");
  const publicKeyPem = fs.readFileSync(context.public_key_path, "utf8");
  const grant = issueSyntheticPilotGrantInternal({
    contract,
    privateKeyPem,
    publicKeyPem,
    worktreeRealpath,
  });
  return installSignedGrant({ repoRoot, contract, grant });
}

export function enableSyntheticPilotOnce(options = {}) {
  const { repoRoot, ...requestInput } = options;
  exactOptions(options, [
    "repoRoot",
    "human_authorization_id",
    "task_key",
    "max_workers",
    "publishing",
    "network",
    "production",
    "dns",
    "deployment",
  ]);
  const request = SyntheticPilotActivationRequestSchema.parse(requestInput);
  const requiredRoot = requireRepoRoot(repoRoot);
  const context = resolveCanonicalControllerContext(requiredRoot);
  requireMatchingCanonicalAuthority(context);
  const trusted = loadTrustedTaskAuthority(requiredRoot, request.task_key);
  assertSyntheticPilotGrant(trusted.contract, trusted.grant);
  assertExactPilotWorktree(context, trusted.contract);
  return enableSyntheticPilotOnceInternal(context.state_directory, {
    request,
    authorizationId: trusted.grant.authorization_id,
    contractDigest: trusted.grant.contract_digest,
    cardBlobSha: trusted.grant.card_blob_sha,
  });
}

export function enableActivation() {
  throw new Error("Generic or permanent autonomous activation is unavailable.");
}
