import crypto from "node:crypto";
import fs from "node:fs";
import { canonicalJson, canonicalize, equalCanonical, sha256 } from "../canonical.mjs";
import { computeContractDigest, hashWorkingTreeFile, validateTaskContract } from "../contract.mjs";
import { AuthorizationGrantSchema } from "../schemas.mjs";
import { assertScopePathsSafe } from "../paths.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";

function unsignedGrant(grant) {
  const { signature: _signature, envelope_digest: _digest, ...payload } = grant;
  return payload;
}

export function grantDigestInternal(grant) {
  return sha256(canonicalize(unsignedGrant(grant)));
}

export function grantSignaturePayloadInternal(grant) {
  return canonicalJson({ ...unsignedGrant(grant), envelope_digest: grant.envelope_digest });
}

export function authorizationFieldsFromContractInternal(contract) {
  return canonicalize({
    task_key: contract.task_key,
    contract_revision: contract.contract_revision,
    contract_digest: computeContractDigest(contract),
    card_blob_sha: contract.card_blob_sha,
    owner_role: contract.owner_role,
    reviewer_role: contract.reviewer_role,
    mode: contract.mode,
    risk: contract.risk,
    dependencies: contract.dependencies,
    branch: contract.branch,
    worktree: contract.worktree,
    write_files: contract.write_files,
    write_prefixes: contract.write_prefixes,
    administrative_files: contract.administrative_files,
    shared_file_grants: contract.shared_file_grants,
    validation_profile: contract.validation_profile,
    permissions: contract.requested_permissions,
    routing: contract.requested_routing,
    limits: contract.limits,
    synthetic_pilot: contract.synthetic_pilot,
  });
}

export function createSignedGrantInternal(contractInput, {
  privateKeyPem,
  publicKeyPem,
  authorizationId = crypto.randomUUID(),
  authorizationRevision,
  worktreeRealpath,
  activation,
  publishing,
  reviewTarget = null,
  provenance,
} = {}) {
  if (!privateKeyPem || !publicKeyPem) throw new Error("Grant signing requires an administrative key pair.");
  const contract = validateTaskContract(contractInput, { verifyCard: false });
  const signerFingerprint = publicKeyFingerprint(publicKeyPem);
  const record = {
    grant_schema_version: "1.0.0",
    authorization_id: authorizationId,
    authorization_revision: authorizationRevision,
    ...authorizationFieldsFromContractInternal(contract),
    worktree_realpath: worktreeRealpath,
    activation,
    publishing,
    review_target: reviewTarget,
    provenance,
    envelope_digest: "0".repeat(64),
    signer_fingerprint: signerFingerprint,
    signature: "A".repeat(88),
  };
  record.envelope_digest = grantDigestInternal(record);
  record.signature = crypto.sign(
    null,
    Buffer.from(grantSignaturePayloadInternal(record)),
    privateKeyPem,
  ).toString("base64");
  return AuthorizationGrantSchema.parse(record);
}

function assertedGrantFields(grant) {
  const {
    grant_schema_version: _schema,
    authorization_id: _id,
    authorization_revision: _revision,
    worktree_realpath: _realpath,
    activation: _activation,
    publishing: _publishing,
    review_target: _reviewTarget,
    provenance: _provenance,
    envelope_digest: _digest,
    signer_fingerprint: _fingerprint,
    signature: _signature,
    ...fields
  } = grant;
  return canonicalize(fields);
}

export function validateGrantAgainstAnchorInternal(contractInput, grantInput, {
  repoRoot,
  verifyCard = true,
  now = new Date(),
  trustedPublicKeyPem,
  trustedFingerprint,
} = {}) {
  if (!trustedPublicKeyPem || !trustedFingerprint) {
    throw new Error("A controller-pinned trust anchor is required.");
  }
  if (publicKeyFingerprint(trustedPublicKeyPem) !== trustedFingerprint) {
    throw new Error("Controller trust-anchor fingerprint mismatch.");
  }
  const contract = validateTaskContract(contractInput, { repoRoot, verifyCard });
  const grant = AuthorizationGrantSchema.parse(grantInput);
  if (grant.signer_fingerprint !== trustedFingerprint) {
    throw new Error("Grant signer is not the pinned controller trust anchor.");
  }
  if (grantDigestInternal(grant) !== grant.envelope_digest) {
    throw new Error("Trusted authorization envelope digest mismatch.");
  }
  if (!crypto.verify(
    null,
    Buffer.from(grantSignaturePayloadInternal(grant)),
    trustedPublicKeyPem,
    Buffer.from(grant.signature, "base64"),
  )) {
    throw new Error("Authorization Grant signature is not from the pinned controller.");
  }
  if (!equalCanonical(assertedGrantFields(grant), authorizationFieldsFromContractInternal(contract))) {
    throw new Error("Task Contract does not match the trusted authorization grant.");
  }
  if (grant.contract_digest !== computeContractDigest(contract)) {
    throw new Error("Task Contract digest does not match the trusted authorization grant.");
  }
  if (grant.provenance.expires_at && Date.parse(grant.provenance.expires_at) <= now.getTime()) {
    throw new Error("Trusted authorization grant is expired.");
  }
  if (!grant.provenance.expires_at && grant.provenance.non_expiring_policy !== "UNTIL_REVOKED_BY_USER") {
    throw new Error("Grant requires an expiry or explicit non-expiring policy.");
  }
  if (grant.activation.autonomous && !grant.permissions.automation_activation) {
    throw new Error("Autonomous activation exceeds the permission grant.");
  }
  if (grant.activation.worker_dispatch && !grant.permissions.worker_dispatch) {
    throw new Error("Worker activation exceeds the permission grant.");
  }
  if (grant.publishing.allowed_branch !== grant.branch || grant.publishing.merge || grant.publishing.force) {
    throw new Error("Publishing grant is broader than the Task branch policy.");
  }
  const mapping = { commit: "git_commit", push: "branch_push", pr: "pr_create" };
  for (const [action, permission] of Object.entries(mapping)) {
    if (grant.publishing[action] && !grant.permissions[permission]) {
      throw new Error(`Publishing ${action} exceeds the permission grant.`);
    }
  }
  if (grant.permissions.task_adoption || contract.provenance.automatic_existing_task_adoption) {
    throw new Error("Existing-task adoption is not authorized.");
  }
  const pilotActivation = grant.activation.synthetic_pilot_once;
  if (pilotActivation) {
    if (grant.activation.autonomous || grant.permissions.automation_activation) {
      throw new Error("Synthetic pilot Grant cannot authorize general autonomous activation.");
    }
    if (!grant.synthetic_pilot
      || pilotActivation.task_key !== grant.task_key
      || pilotActivation.contract_digest !== grant.contract_digest
      || pilotActivation.card_blob_sha !== grant.card_blob_sha
      || pilotActivation.max_workers !== grant.limits.max_workers) {
      throw new Error("Synthetic pilot activation does not bind the exact Grant and contract.");
    }
    if (grant.publishing.commit || grant.publishing.push || grant.publishing.pr
      || grant.publishing.merge || grant.publishing.force
      || grant.publishing.approval_required_actions.length > 0) {
      throw new Error("Synthetic pilot Grant cannot authorize publishing.");
    }
  }
  if (repoRoot) {
    const actualRoot = fs.realpathSync.native(repoRoot);
    const expectedRoot = fs.realpathSync.native(grant.worktree_realpath);
    if (actualRoot.toLocaleLowerCase("en-US") !== expectedRoot.toLocaleLowerCase("en-US")) {
      throw new Error("Controller grant is bound to a different worktree realpath.");
    }
    assertScopePathsSafe(repoRoot, grant);
    if (verifyCard && hashWorkingTreeFile(repoRoot, contract.card_path) !== grant.card_blob_sha) {
      throw new Error("Current Task Card is not the card blob bound by the trusted grant.");
    }
  }
  return { contract, grant };
}
