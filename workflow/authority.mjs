import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { canonicalize, equalCanonical, sha256 } from "./canonical.mjs";
import { computeContractDigest, hashWorkingTreeFile, validateTaskContract } from "./contract.mjs";
import { AuthorizationGrantSchema } from "./schemas.mjs";
import { assertScopePathsSafe } from "./paths.mjs";

export function defaultControllerStateDirectory(repoRoot) {
  const common = execFileSync("git", ["rev-parse", "--git-common-dir"], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
  return path.resolve(repoRoot, common, "threethai-workflow");
}

export function grantPath(stateDirectory, taskKey) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(taskKey)) throw new Error("Invalid task key.");
  return path.join(stateDirectory, "grants", `${taskKey}.json`);
}

export function computeGrantDigest(grant) {
  const { envelope_digest: _ignored, ...payload } = grant;
  return sha256(canonicalize(payload));
}

export function authorizationFieldsFromContract(contract) {
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
  });
}

export function createAuthorizationGrantRecord(contractInput, {
  authorizationId = crypto.randomUUID(),
  authorizationRevision,
  worktreeRealpath,
  activation,
  publishing,
  provenance,
} = {}) {
  const contract = validateTaskContract(contractInput, { verifyCard: false });
  const record = {
    grant_schema_version: "1.0.0",
    authorization_id: authorizationId,
    authorization_revision: authorizationRevision,
    ...authorizationFieldsFromContract(contract),
    worktree_realpath: worktreeRealpath,
    activation,
    publishing,
    provenance,
    envelope_digest: "0".repeat(64),
  };
  record.envelope_digest = computeGrantDigest(record);
  return AuthorizationGrantSchema.parse(record);
}

export function loadAuthorizationGrant(stateDirectory, taskKey) {
  const file = grantPath(stateDirectory, taskKey);
  if (!fs.existsSync(file)) {
    throw new Error(`Trusted controller grant is missing for ${taskKey}`);
  }
  return AuthorizationGrantSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

function assertedGrantFields(grant) {
  const {
    grant_schema_version: _schema,
    authorization_id: _id,
    authorization_revision: _revision,
    worktree_realpath: _realpath,
    activation: _activation,
    publishing: _publishing,
    provenance: _provenance,
    envelope_digest: _digest,
    ...fields
  } = grant;
  return canonicalize(fields);
}

export function validateTrustedGrant(contractInput, grantInput, {
  repoRoot,
  stateDirectory,
  verifyCard = true,
  now = new Date(),
} = {}) {
  const contract = validateTaskContract(contractInput, { repoRoot, verifyCard });
  const grant = AuthorizationGrantSchema.parse(grantInput);
  if (computeGrantDigest(grant) !== grant.envelope_digest) {
    throw new Error("Trusted authorization envelope digest mismatch.");
  }
  if (!equalCanonical(assertedGrantFields(grant), authorizationFieldsFromContract(contract))) {
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
    const authorityDirectory = stateDirectory ?? defaultControllerStateDirectory(repoRoot);
    const relative = path.relative(actualRoot, path.resolve(authorityDirectory));
    if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
      throw new Error("Controller authority state must be outside the worker worktree.");
    }
  }
  return { contract, grant };
}
