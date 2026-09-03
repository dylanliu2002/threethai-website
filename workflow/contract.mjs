import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { TaskContractSchema } from "./schemas.mjs";
import { assertIndependentRoles } from "./roles.mjs";
import { assertStatePair } from "./state.mjs";
import { routeTask } from "./routing.mjs";
import {
  assertChangedPathsAllowed,
  normalizeRepoPath,
  resolveWithinRepo,
  windowsPathKey,
} from "./paths.mjs";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

export function scopePayload(contract) {
  return canonical({
    task_key: contract.task_key,
    contract_revision: contract.contract_revision,
    branch: contract.branch,
    worktree: contract.worktree,
    write_files: contract.write_files,
    write_prefixes: contract.write_prefixes,
    administrative_files: contract.administrative_files,
    shared_file_grants: contract.shared_file_grants,
    permissions: contract.permissions,
    routing: contract.routing,
    limits: contract.limits,
  });
}

export function computeScopeDigest(contract) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(scopePayload(contract)))
    .digest("hex");
}

export function configurationDigest(contract) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(canonical({
      schema_version: contract.schema_version,
      task_key: contract.task_key,
      contract_revision: contract.contract_revision,
      policy_revision: contract.routing.policy_revision,
      routing: contract.routing,
      limits: contract.limits,
      validation_profile: contract.validation_profile,
    })))
    .digest("hex");
}

function assertUniquePaths(contract) {
  const seen = new Set();
  for (const candidate of [...contract.write_files, ...contract.write_prefixes]) {
    const key = windowsPathKey(candidate, { prefix: candidate.endsWith("/") });
    if (seen.has(key)) throw new Error(`Duplicate case-equivalent write scope: ${candidate}`);
    seen.add(key);
  }
  for (const administrative of contract.administrative_files) {
    if (!contract.write_files.some((item) => windowsPathKey(item) === windowsPathKey(administrative))) {
      throw new Error(`Administrative file lacks exact write grant: ${administrative}`);
    }
  }
  for (const grant of contract.shared_file_grants) {
    assertChangedPathsAllowed([grant.path], contract);
  }
}

function hashCard(repoRoot, cardPath) {
  return execFileSync("git", ["hash-object", normalizeRepoPath(cardPath)], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function cardBlobIsHistorical(repoRoot, cardPath, expectedBlob) {
  const commits = execFileSync("git", ["log", "--format=%H", "--", cardPath], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim().split(/\r?\n/).filter(Boolean);
  return commits.some((commit) => {
    try {
      return execFileSync("git", ["rev-parse", `${commit}:${cardPath}`], {
        cwd: repoRoot,
        encoding: "utf8",
        windowsHide: true,
      }).trim() === expectedBlob;
    } catch {
      return false;
    }
  });
}

export function validateContract(input, { repoRoot, verifyCard = true } = {}) {
  const contract = TaskContractSchema.parse(input);
  assertStatePair(contract.status, contract.phase);
  assertIndependentRoles(contract.owner_role, contract.reviewer_role);
  assertUniquePaths(contract);
  routeTask(contract);
  if (contract.authorization.scope_digest !== computeScopeDigest(contract)) {
    throw new Error(`Authorization scope digest mismatch for ${contract.task_key}`);
  }
  if (contract.authorization.activation_authorized && !contract.permissions.automation_activation) {
    throw new Error("Activation cannot be authorized when automation permission is false.");
  }
  if (contract.provenance.automatic_existing_task_adoption || contract.permissions.task_adoption) {
    throw new Error("SYS-AUTO-001 must not adopt existing tasks.");
  }
  if (verifyCard) {
    if (!repoRoot) throw new Error("repoRoot is required for card verification.");
    resolveWithinRepo(repoRoot, contract.card_path);
    const actual = hashCard(repoRoot, contract.card_path);
    if (actual !== contract.card_blob_sha
      && !cardBlobIsHistorical(repoRoot, contract.card_path, contract.card_blob_sha)) {
      throw new Error(`Card blob mismatch for ${contract.task_key}: expected ${contract.card_blob_sha}, got ${actual}`);
    }
    for (const writeFile of contract.write_files) resolveWithinRepo(repoRoot, writeFile);
    for (const writePrefix of contract.write_prefixes) {
      resolveWithinRepo(repoRoot, writePrefix.slice(0, -1));
    }
  }
  return contract;
}

export function loadContract(filePath, options = {}) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return validateContract(parsed, options);
}

export function loadContracts(repoRoot, { verifyCard = true } = {}) {
  const directory = path.join(repoRoot, "tasks", "machine");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => loadContract(path.join(directory, name), { repoRoot, verifyCard }));
}
