import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { loadContracts } from "./contract.mjs";
import { validateTaskGraph } from "./dependencies.mjs";
import { LockManager } from "./locks.mjs";
import { Scheduler } from "./scheduler.mjs";
import { readEventDirectory, reconcileRuntime } from "./recovery.mjs";
import { ACTIVATION_ENV, ACTIVATION_VALUE, POLICY_REVISION } from "./constants.mjs";
import { scanArtifactFiles } from "./secrets.mjs";
import { pathAllowed } from "./paths.mjs";

export function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function validateRepository(repoRoot = defaultRepoRoot()) {
  const contracts = loadContracts(repoRoot);
  validateTaskGraph(contracts);
  const artifactFiles = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: repoRoot, encoding: "utf8", windowsHide: true },
  ).split(/\r?\n/).filter(Boolean);
  const authorizedArtifacts = artifactFiles.filter((file) =>
    contracts.some((contract) => pathAllowed(file, contract.write_files, contract.write_prefixes)));
  const secretScan = scanArtifactFiles(repoRoot, authorizedArtifacts);
  return {
    valid: true,
    policy_revision: POLICY_REVISION,
    contract_count: contracts.length,
    task_keys: contracts.map((contract) => contract.task_key),
    secret_scan: { passed: true, files_scanned: secretScan.scanned },
  };
}

export function reconcile(repoRoot = defaultRepoRoot(), { dryRun = true, runtimeDirectory } = {}) {
  if (!dryRun) throw new Error("Bootstrap reconciliation is dry-run only until activation authorization.");
  const contracts = loadContracts(repoRoot);
  const runtime = reconcileRuntime(readEventDirectory(runtimeDirectory));
  return {
    command: "reconcile",
    dry_run: true,
    contracts: contracts.length,
    runtime,
    mutations: [],
    workers_started: 0,
  };
}

export function tick(repoRoot = defaultRepoRoot(), { dryRun = true, wakeupId = "cli-dry-run" } = {}) {
  if (!dryRun) {
    if (process.env[ACTIVATION_ENV] !== ACTIVATION_VALUE) {
      throw new Error("Autonomous activation is not explicitly authorized.");
    }
    throw new Error("Live tick remains disabled in SYS-AUTO-001 bootstrap.");
  }
  const contracts = loadContracts(repoRoot);
  const scheduler = new Scheduler({ lockManager: new LockManager(), maxWorkers: 2 });
  const plan = scheduler.plan(contracts, { wakeupId });
  return {
    command: "tick",
    dry_run: true,
    activation: "DISABLED",
    eligible_dispatches: plan.dispatches,
    blocked: plan.blocked,
    mutations: [],
    workers_started: 0,
    automations_started: 0,
  };
}
