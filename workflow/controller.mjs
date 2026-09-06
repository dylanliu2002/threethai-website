import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";
import { loadContracts } from "./contract.mjs";
import { validateTaskGraph } from "./dependencies.mjs";
import { loadAuthorizationGrant, validateTrustedGrant } from "./authority.mjs";
import { assertNoAuthorityOverrides, resolveCanonicalControllerContext } from "./controller-context.mjs";
import { KILL_SWITCH_ENV, KILL_SWITCH_VALUE, POLICY_REVISION } from "./constants.mjs";
import { pathAllowed } from "./paths.mjs";
import { scanArtifactFiles } from "./secrets.mjs";
import { issueCapabilityInternal } from "./internal/capability-engine.mjs";
import { readControllerStateInternal } from "./internal/controller-state-engine.mjs";
import { productionEngineInternal } from "./internal/production-engine.mjs";
import { reconcileRuntimeInternal } from "./internal/recovery-engine.mjs";
import { runCodexExecInternal } from "./internal/run-engine.mjs";
import { planScheduleInternal } from "./internal/scheduler-engine.mjs";
import { PILOT_MODE } from "./pilot-security.mjs";

export function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function trackedAndUntracked(repoRoot) {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).split(/\r?\n/).filter(Boolean);
}

export function validateRepository(repoRoot = defaultRepoRoot(), options = {}) {
  assertNoAuthorityOverrides(options);
  const contracts = loadContracts(repoRoot);
  validateTaskGraph(contracts);
  const artifacts = trackedAndUntracked(repoRoot);
  const authorizedArtifacts = artifacts.filter((file) => contracts.some((contract) =>
    pathAllowed(file, contract.write_files, contract.write_prefixes)));
  const secretScan = scanArtifactFiles(repoRoot, authorizedArtifacts);
  const context = resolveCanonicalControllerContext(repoRoot);
  return {
    valid: true,
    mode: "STATIC_VALIDATION",
    policy_revision: POLICY_REVISION,
    contract_count: contracts.length,
    task_keys: contracts.map((contract) => contract.task_key),
    authority_checked: false,
    authority_status: context.provisioned ? "AVAILABLE_NOT_USED" : "UNAVAILABLE",
    authorization_grants: 0,
    activation: "NOT_EVALUATED",
    secret_scan: { passed: true, files_scanned: secretScan.scanned },
  };
}

export function reconcile(repoRoot = defaultRepoRoot(), options = {}) {
  assertNoAuthorityOverrides(options);
  if (options.dryRun === false) throw new Error("Reconcile mutation requires separate activation authorization.");
  const contracts = loadContracts(repoRoot);
  validateTaskGraph(contracts);
  const context = resolveCanonicalControllerContext(repoRoot);
  return {
    command: "reconcile",
    dry_run: true,
    authority: context.provisioned ? "AVAILABLE_READ_ONLY" : "UNAVAILABLE",
    runtime: reconcileRuntimeInternal(context.state_directory),
    nondispatchable: contracts.map((contract) => ({ task_key: contract.task_key, reason: "dry-run" })),
    mutations: [], workers_started: 0, github_mutations: 0, publishing_actions: 0,
  };
}

function inactiveTick(dryRun, runtime, activation, contracts = []) {
  return {
    command: "tick", dry_run: dryRun, activation, runtime,
    pilot_mode: {
      name: PILOT_MODE.name,
      activation_enabled: PILOT_MODE.activation_enabled,
      max_workers: PILOT_MODE.max_workers,
    },
    dispatches: [],
    blocked: contracts.map((contract) => ({ task_key: contract.task_key, reason: "authority-unavailable-or-inactive" })),
    mutations: [], workers_started: 0, automations_started: 0,
    github_mutations: 0, publishing_actions: 0, grants_created: 0,
  };
}

function workerPrompt(contract) {
  return [
    `Execute only machine task ${contract.task_key}.`,
    `Read ${contract.card_path} and all applicable AGENTS.md files.`,
    "Do not expand scope. Return only the required structured worker result.",
  ].join("\n");
}

export async function tick(repoRoot = defaultRepoRoot(), options = {}) {
  assertNoAuthorityOverrides(options);
  const dryRun = options.dryRun !== false;
  const wakeupId = options.wakeupId ?? "cli-tick";
  const contracts = loadContracts(repoRoot);
  const context = resolveCanonicalControllerContext(repoRoot);
  const runtime = reconcileRuntimeInternal(context.state_directory);
  if (dryRun) return inactiveTick(true, runtime, context.provisioned ? "DRY_RUN" : "AUTHORITY_UNAVAILABLE", contracts);
  if (process.env[KILL_SWITCH_ENV] === KILL_SWITCH_VALUE) return inactiveTick(false, runtime, "KILL_SWITCH", contracts);
  if (!context.provisioned) return inactiveTick(false, runtime, "AUTHORITY_UNAVAILABLE", contracts);
  const state = readControllerStateInternal(context.state_directory);
  if (!state.activation.authorized) return inactiveTick(false, runtime, "DISABLED", contracts);
  if (!PILOT_MODE.activation_enabled) return inactiveTick(false, runtime, "PILOT_MODE_INACTIVE", contracts);

  const grants = new Map();
  for (const contract of contracts) {
    const grant = loadAuthorizationGrant(repoRoot, contract.task_key);
    validateTrustedGrant(contract, grant, { repoRoot });
    grants.set(contract.task_key, grant);
  }
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
  const schedulerEngine = productionEngineInternal(repoRoot, contracts[0]?.task_key ?? "missing-task");
  const plan = planScheduleInternal(schedulerEngine, contracts, grants, {
    dryRun: false,
    wakeupId,
    baseSha: head,
    pilotPolicy: PILOT_MODE,
  });
  let workersStarted = 0;
  const results = [];
  for (const dispatch of plan.dispatches) {
    const contract = contracts.find((item) => item.task_key === dispatch.run.task_key);
    const grant = grants.get(contract.task_key);
    const engine = productionEngineInternal(repoRoot, contract.task_key, { requirePrivateKey: true });
    const action = dispatch.run.role_id === grant.reviewer_role ? "review" : "dispatch";
    const capability = issueCapabilityInternal({
      engine, contract, grant, action, runId: dispatch.run.run_id, headSha: head,
    });
    results.push(await runCodexExecInternal({
      engine, contract, grant, capability, prompt: workerPrompt(contract), spawnImpl: spawn,
    }));
    workersStarted += 1;
  }
  return {
    command: "tick", dry_run: false, activation: "AUTHORIZED", ...plan,
    results, mutations: plan.dispatches.length, workers_started: workersStarted,
    github_mutations: 0, publishing_actions: 0, grants_created: 0,
  };
}
