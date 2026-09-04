import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  defaultControllerStateDirectory,
  loadAuthorizationGrant,
  validateTrustedGrant,
} from "./authority.mjs";
import { loadContracts } from "./contract.mjs";
import { validateTaskGraph } from "./dependencies.mjs";
import { issueControllerCapability } from "./capability.mjs";
import { readControllerState } from "./controller-state.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE, POLICY_REVISION } from "./constants.mjs";
import { reconcileRuntime } from "./recovery.mjs";
import { Scheduler } from "./scheduler.mjs";
import { scanArtifactFiles } from "./secrets.mjs";
import { pathAllowed } from "./paths.mjs";

export function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function trackedAndUntracked(repoRoot) {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).split(/\r?\n/).filter(Boolean);
}

export function validateRepository(repoRoot = defaultRepoRoot(), {
  stateDirectory = defaultControllerStateDirectory(repoRoot),
  contractsOnly = false,
} = {}) {
  const contracts = loadContracts(repoRoot);
  validateTaskGraph(contracts);
  const grants = new Map();
  if (!contractsOnly) {
    for (const contract of contracts) {
      const grant = loadAuthorizationGrant(stateDirectory, contract.task_key);
      validateTrustedGrant(contract, grant, { repoRoot, stateDirectory });
      grants.set(contract.task_key, grant);
    }
  }
  const artifacts = trackedAndUntracked(repoRoot);
  const authorizedArtifacts = artifacts.filter((file) => contracts.some((contract) =>
    pathAllowed(file, contract.write_files, contract.write_prefixes)));
  const secretScan = scanArtifactFiles(repoRoot, authorizedArtifacts);
  return {
    valid: true,
    policy_revision: POLICY_REVISION,
    contract_count: contracts.length,
    task_keys: contracts.map((contract) => contract.task_key),
    authority_checked: !contractsOnly,
    authority_location: contractsOnly ? "UNAVAILABLE_IN_VALIDATION_ONLY_CI" : stateDirectory,
    authorization_grants: grants.size,
    activation: "DISABLED",
    secret_scan: { passed: true, files_scanned: secretScan.scanned },
  };
}

export function reconcile(repoRoot = defaultRepoRoot(), {
  dryRun = true,
  stateDirectory = defaultControllerStateDirectory(repoRoot),
} = {}) {
  if (!dryRun) throw new Error("Reconcile mutation requires separate activation authorization.");
  loadContracts(repoRoot);
  return {
    command: "reconcile",
    dry_run: true,
    runtime: reconcileRuntime(stateDirectory),
    mutations: [],
    workers_started: 0,
    github_mutations: 0,
    publishing_actions: 0,
  };
}

export async function tick(repoRoot = defaultRepoRoot(), {
  dryRun = true,
  wakeupId = "cli-tick",
  stateDirectory = defaultControllerStateDirectory(repoRoot),
  dispatchWorker,
} = {}) {
  const contracts = loadContracts(repoRoot);
  const grants = new Map(contracts.map((contract) => {
    const grant = loadAuthorizationGrant(stateDirectory, contract.task_key);
    validateTrustedGrant(contract, grant, { repoRoot, stateDirectory });
    return [contract.task_key, grant];
  }));
  const runtime = reconcileRuntime(stateDirectory);
  if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE) {
    return inactiveTick(dryRun, runtime, "KILL_SWITCH");
  }
  const scheduler = new Scheduler({ stateDirectory, repoRoot });
  const state = readControllerState(stateDirectory);
  if (!state.activation.authorized) return inactiveTick(dryRun, runtime, "DISABLED");
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
  const plan = scheduler.plan(contracts, grants, { dryRun, wakeupId, baseSha: head });
  if (dryRun) {
    return { command: "tick", dry_run: true, activation: "AUTHORIZED", ...plan, mutations: [], workers_started: 0, github_mutations: 0, publishing_actions: 0 };
  }
  if (plan.dispatches.length && typeof dispatchWorker !== "function") {
    throw new Error("Live dispatch requires the controller-owned worker runner.");
  }
  let workersStarted = 0;
  for (const dispatch of plan.dispatches) {
    const contract = contracts.find((item) => item.task_key === dispatch.run.task_key);
    const grant = grants.get(contract.task_key);
    const capability = issueControllerCapability({
      stateDirectory, contract, grant, action: "dispatch",
      runId: dispatch.run.run_id, leaseId: dispatch.lease.lease_id,
      fencingToken: dispatch.lease.fencing_token, headSha: head, repoRoot,
    });
    await dispatchWorker({ contract, grant, capability, stateDirectory, repoRoot });
    workersStarted += 1;
  }
  return { command: "tick", dry_run: false, activation: "AUTHORIZED", ...plan, mutations: plan.dispatches.length, workers_started: workersStarted, github_mutations: 0, publishing_actions: 0 };
}

function inactiveTick(dryRun, runtime, activation) {
  return {
    command: "tick",
    dry_run: dryRun,
    activation,
    runtime,
    dispatches: [], blocked: [], mutations: [], workers_started: 0,
    automations_started: 0, github_mutations: 0, publishing_actions: 0,
  };
}
