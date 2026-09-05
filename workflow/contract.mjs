import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { canonicalize, sha256 } from "./canonical.mjs";
import { TaskContractSchema } from "./schemas.mjs";
import { assertIndependentRoles } from "./roles.mjs";
import { assertStatePair } from "./state.mjs";
import { routeTask } from "./routing.mjs";
import {
  assertChangedPathsAllowed,
  assertScopePathsSafe,
  normalizeRepoPath,
  windowsPathKey,
} from "./paths.mjs";

export function computeContractDigest(contract) {
  return sha256(canonicalize(contract));
}

export function configurationDigest(contract) {
  return sha256({
    schema_version: contract.schema_version,
    task_key: contract.task_key,
    contract_revision: contract.contract_revision,
    routing: contract.requested_routing,
    limits: contract.limits,
    validation_profile: contract.validation_profile,
  });
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
      throw new Error(`Administrative file lacks exact requested write scope: ${administrative}`);
    }
  }
  for (const shared of contract.shared_file_grants) {
    assertChangedPathsAllowed([shared.path], contract);
  }
}

export function hashWorkingTreeFile(repoRoot, cardPath) {
  return execFileSync("git", ["hash-object", normalizeRepoPath(cardPath)], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

export function validateTaskContract(input, { repoRoot, verifyCard = true } = {}) {
  const contract = TaskContractSchema.parse(input);
  assertStatePair(contract.status, contract.phase);
  assertIndependentRoles(contract.owner_role, contract.reviewer_role);
  assertUniquePaths(contract);
  routeTask(contract);
  if (contract.provenance.automatic_existing_task_adoption || contract.requested_permissions.task_adoption) {
    throw new Error("SYS-AUTO-001 must not request automatic adoption of existing tasks.");
  }
  if (verifyCard) {
    if (!repoRoot) throw new Error("repoRoot is required for card verification.");
    assertScopePathsSafe(repoRoot, contract);
    const actual = hashWorkingTreeFile(repoRoot, contract.card_path);
    if (actual !== contract.card_blob_sha) {
      throw new Error(`Current card blob mismatch for ${contract.task_key}: expected ${contract.card_blob_sha}, got ${actual}`);
    }
  }
  return contract;
}

export const validateContract = validateTaskContract;

export function loadContract(filePath, options = {}) {
  return validateTaskContract(JSON.parse(fs.readFileSync(filePath, "utf8")), options);
}

export function loadContracts(repoRoot, { verifyCard = true } = {}) {
  const directory = path.join(repoRoot, "tasks", "machine");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => loadContract(path.join(directory, name), { repoRoot, verifyCard }));
}
