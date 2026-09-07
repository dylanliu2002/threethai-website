import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { computeContractDigest } from "./contract.mjs";
import {
  SYNTHETIC_PILOT_BRANCH,
  SYNTHETIC_PILOT_CARD_PATH,
  SYNTHETIC_PILOT_OUTPUT_PATH,
  SYNTHETIC_PILOT_TASK_KEY,
  SYNTHETIC_PILOT_WORKTREE,
} from "./constants.mjs";
import { deriveSandbox, routeTask } from "./routing.mjs";

export const PILOT_SANDBOX_UNAVAILABLE = "PILOT_SANDBOX_UNAVAILABLE";

export const PILOT_NETWORK_PROXY_POLICY = Object.freeze({
  enabled: true,
  enforced: true,
  allowed_domains: Object.freeze(["chatgpt.com"]),
  unrestricted_direct_egress: false,
  local_private_network: false,
  allow_local_binding: false,
  allow_upstream_proxy: false,
  enable_socks5: false,
  enable_socks5_udp: false,
  credential_broker: false,
  dangerously_allow_non_loopback_proxy: false,
  dangerously_allow_all_unix_sockets: false,
  unix_sockets: Object.freeze([]),
});

export const PILOT_MODE = Object.freeze({
  name: "ONE_WORKER_LOW_RISK_PILOT",
  activation_enabled: false,
  max_workers: 1,
  authorized_task_keys: Object.freeze([
    SYNTHETIC_PILOT_TASK_KEY,
  ]),
  automatic_existing_task_adoption: false,
  scheduler_heartbeat: false,
  network_access: true,
  network_proxy: PILOT_NETWORK_PROXY_POLICY,
  publishing: false,
  production_actions: false,
});

export const PILOT_PROCESS_ENV_ALLOWLIST = Object.freeze([
  "PATH",
  "PATHEXT",
  "SYSTEMROOT",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "NO_COLOR",
  "TERM",
  "COLORTERM",
]);

export const PILOT_SHELL_ENV_ALLOWLIST = Object.freeze([
  "PATH",
  "PATHEXT",
  "SYSTEMROOT",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "NO_COLOR",
  "TERM",
  "COLORTERM",
]);

export const PILOT_DISABLED_FEATURES = Object.freeze([
  "apps",
  "auth_elicitation",
  "browser_use",
  "browser_use_external",
  "browser_use_full_cdp_access",
  "computer_use",
  "enable_mcp_apps",
  "goals",
  "hooks",
  "image_generation",
  "in_app_browser",
  "in_app_local_automation",
  "mcp_2026_07_28",
  "multi_agent",
  "multi_agent_v2",
  "plugins",
  "remote_plugin",
  "request_permissions_tool",
  "shell_snapshot",
  "shell_snapshot_v2",
  "skill_mcp_dependency_install",
  "skill_search",
  "standalone_web_search",
  "tool_call_mcp_elicitation",
  "tool_suggest",
  "view_image",
  "workspace_dependencies",
]);

const SENSITIVE_ENVIRONMENT_NAMES = Object.freeze([
  /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE_KEY|API_KEY|ACCESS_KEY|KEY)$/i,
  /^(?:OPENAI_API_KEY|GH_TOKEN|GITHUB_TOKEN)$/i,
  /^(?:AWS|AZURE|GOOGLE|GCP|SSH|DEPLOY|DEPLOYMENT|DNS|VERCEL|CLOUDFLARE)_/i,
  /(?:^|_)(?:DEPLOY|DEPLOYMENT|DNS)_(?:CREDENTIAL|CREDENTIALS|TOKEN|SECRET|PASSWORD|KEY)$/i,
]);

const FORBIDDEN_PILOT_PERMISSIONS = Object.freeze([
  "git_commit",
  "branch_push",
  "github_write",
  "pr_create",
  "merge",
  "production",
  "dns",
  "secret_write",
  "external_action",
  "task_adoption",
]);

const REQUIRED_FALSE_PILOT_PERMISSIONS = Object.freeze([
  "git_commit",
  "branch_push",
  "automation_activation",
  "github_write",
  "pr_create",
  "merge",
  "production",
  "dns",
  "secret_write",
  "external_action",
  "task_adoption",
]);

const NETWORK_PROXY_BOOLEAN_REQUIREMENTS = Object.freeze({
  enabled: true,
  enforced: true,
  unrestricted_direct_egress: false,
  local_private_network: false,
  allow_local_binding: false,
  allow_upstream_proxy: false,
  enable_socks5: false,
  enable_socks5_udp: false,
  credential_broker: false,
  dangerously_allow_non_loopback_proxy: false,
  dangerously_allow_all_unix_sockets: false,
});

export function assertRestrictedPilotNetworkPolicy(profile, label = "pilot runtime profile") {
  if (profile?.network_access !== true) {
    throw new Error(`${label} requires network_access=true for remote model transport.`);
  }
  const proxy = profile.network_proxy;
  if (!proxy || typeof proxy !== "object" || Array.isArray(proxy)) {
    throw new Error(`${label} requires an enforced network_proxy policy.`);
  }
  const expectedKeys = [
    ...Object.keys(NETWORK_PROXY_BOOLEAN_REQUIREMENTS),
    "allowed_domains",
    "unix_sockets",
  ].sort();
  if (JSON.stringify(Object.keys(proxy).sort()) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${label} network_proxy contains missing or unsupported policy fields.`);
  }
  for (const [field, expected] of Object.entries(NETWORK_PROXY_BOOLEAN_REQUIREMENTS)) {
    if (proxy[field] !== expected) {
      throw new Error(`${label} network_proxy.${field} must be ${expected}.`);
    }
  }
  if (!Array.isArray(proxy.allowed_domains)
    || proxy.allowed_domains.length !== 1
    || proxy.allowed_domains[0] !== "chatgpt.com") {
    throw new Error(`${label} network_proxy allowlist must be exactly ["chatgpt.com"].`);
  }
  if (!Array.isArray(proxy.unix_sockets) || proxy.unix_sockets.length !== 0) {
    throw new Error(`${label} network_proxy must not allow Unix sockets.`);
  }
  return true;
}

export function assertSyntheticPilotContract(contract) {
  if (contract.task_key !== SYNTHETIC_PILOT_TASK_KEY
    || contract.card_path !== SYNTHETIC_PILOT_CARD_PATH
    || contract.branch !== SYNTHETIC_PILOT_BRANCH
    || contract.worktree !== SYNTHETIC_PILOT_WORKTREE) {
    throw new Error("Synthetic pilot identity, card, branch, and worktree must be exact.");
  }
  if (contract.status !== "READY" || contract.phase !== "QUEUED"
    || contract.mode !== "IMPLEMENT" || contract.owner_role !== "ORCHESTRATOR"
    || contract.reviewer_role !== "QA_PERFORMANCE") {
    throw new Error("Synthetic pilot lifecycle and Roles must be exact.");
  }
  if (contract.dependencies.length !== 0
    || contract.write_files.length !== 1
    || contract.write_files[0] !== SYNTHETIC_PILOT_OUTPUT_PATH
    || contract.write_prefixes.length !== 0
    || contract.administrative_files.length !== 0
    || contract.shared_file_grants.length !== 0) {
    throw new Error("Synthetic pilot write scope must contain only the deterministic output file.");
  }
  if (!contract.requested_permissions.repository_write
    || !contract.requested_permissions.worker_dispatch) {
    throw new Error("Synthetic pilot requires only repository write and one-time worker dispatch.");
  }
  for (const permission of REQUIRED_FALSE_PILOT_PERMISSIONS) {
    if (contract.requested_permissions[permission] !== false) {
      throw new Error(`Synthetic pilot permission must remain false: ${permission}`);
    }
  }
  if (contract.provenance.automatic_existing_task_adoption
    || contract.limits.max_workers !== 1
    || contract.limits.max_correction_cycles !== 0
    || !Number.isInteger(contract.limits.timeout_seconds)
    || contract.limits.timeout_seconds <= 0
    || contract.limits.lease_seconds <= contract.limits.timeout_seconds + 5) {
    throw new Error("Synthetic pilot limits or adoption policy are broader than authorized.");
  }
  const constraints = contract.synthetic_pilot;
  if (!constraints
    || constraints.task_key !== contract.task_key
    || constraints.write_files.length !== 1
    || constraints.write_files[0] !== SYNTHETIC_PILOT_OUTPUT_PATH
    || constraints.write_prefixes.length !== 0
    || constraints.max_workers !== 1
    || constraints.timeout_seconds !== contract.limits.timeout_seconds) {
    throw new Error("Synthetic pilot machine constraints are missing or inconsistent.");
  }
  if (constraints.network !== true) {
    throw new Error("Synthetic pilot network permission must be true for remote model transport.");
  }
  assertRestrictedPilotNetworkPolicy({
    network_access: constraints.network,
    network_proxy: constraints.network_proxy,
  }, "synthetic pilot contract");
  for (const field of [
    "secrets", "git_commit", "push", "pr", "merge", "production",
    "dns", "deployment", "task_adoption",
  ]) {
    if (constraints[field] !== false) {
      throw new Error(`Synthetic pilot constraint must remain false: ${field}`);
    }
  }
  const routed = routeTask(contract, { availableModels: ["gpt-5.6-sol"] });
  if (routed.executor_platform !== "Codex" || routed.provider !== "OpenAI"
    || routed.model !== "gpt-5.6-sol" || routed.reasoning_effort !== "high"
    || routed.fallback !== "BLOCKED") {
    throw new Error("Synthetic pilot routing must remain pinned to Codex/OpenAI/gpt-5.6-sol/high.");
  }
  return true;
}

export function assertSyntheticPilotGrant(contract, grant) {
  assertSyntheticPilotContract(contract);
  const activation = grant.activation.synthetic_pilot_once;
  if (!activation
    || grant.task_key !== contract.task_key
    || grant.contract_digest !== computeContractDigest(contract)
    || grant.card_blob_sha !== contract.card_blob_sha
    || grant.synthetic_pilot?.task_key !== contract.task_key
    || activation.task_key !== contract.task_key
    || activation.contract_digest !== grant.contract_digest
    || activation.card_blob_sha !== grant.card_blob_sha
    || activation.max_dispatch_attempts !== 1
    || activation.max_workers !== 1
    || grant.limits.max_workers !== 1) {
    throw new Error("Synthetic pilot Grant does not bind the exact contract, card, and one-shot limits.");
  }
  if (grant.synthetic_pilot.network !== true
    || activation.network !== grant.synthetic_pilot.network) {
    throw new Error("Synthetic pilot Grant network permission must match the network-enabled contract.");
  }
  assertRestrictedPilotNetworkPolicy({
    network_access: grant.synthetic_pilot.network,
    network_proxy: grant.synthetic_pilot.network_proxy,
  }, "synthetic pilot Grant");
  if (grant.activation.autonomous || !grant.activation.worker_dispatch
    || grant.permissions.automation_activation || !grant.permissions.worker_dispatch) {
    throw new Error("Synthetic pilot Grant must authorize one-shot dispatch without autonomous activation.");
  }
  assertNoForbiddenPermissions(grant.permissions);
  for (const field of ["publishing", "production", "dns", "deployment"]) {
    if (activation[field] !== false) {
      throw new Error(`Synthetic pilot activation constraint must remain false: ${field}`);
    }
  }
  if (grant.publishing.commit || grant.publishing.push || grant.publishing.pr
    || grant.publishing.merge || grant.publishing.force
    || grant.publishing.approval_required_actions.length !== 0) {
    throw new Error("Synthetic pilot Grant cannot authorize publishing.");
  }
  return true;
}

export function oneTimePilotPolicy(activation) {
  const enabled = activation?.status === "READY"
    || (activation?.status === "CONSUMED" && Boolean(activation.consumed_run_id));
  return Object.freeze({
    ...PILOT_MODE,
    activation_enabled: enabled,
    authorized_task_keys: Object.freeze(enabled ? [activation.task_key] : []),
    network_access: activation?.network === true,
  });
}

function unavailable(reason, cause) {
  const error = new Error(`${PILOT_SANDBOX_UNAVAILABLE}: ${reason}`, { cause });
  error.code = PILOT_SANDBOX_UNAVAILABLE;
  return error;
}

function environmentValue(environment, wanted) {
  const entry = Object.entries(environment).find(([name]) =>
    name.toLocaleUpperCase("en-US") === wanted.toLocaleUpperCase("en-US"));
  return entry?.[1];
}

export function isCredentialEnvironmentName(name) {
  return SENSITIVE_ENVIRONMENT_NAMES.some((pattern) => pattern.test(name));
}

export function assertCredentialEnvironmentAbsent(environment, label = "worker environment") {
  const forbidden = Object.keys(environment).filter(isCredentialEnvironmentName);
  if (forbidden.length > 0) {
    throw new Error(`${label} contains forbidden credential-bearing names: ${forbidden.sort().join(", ")}`);
  }
  return true;
}

export function resolveCodexHome(parentEnvironment = process.env, explicitCodexHome) {
  const candidate = explicitCodexHome
    ?? environmentValue(parentEnvironment, "CODEX_HOME")
    ?? path.join(os.homedir(), ".codex");
  if (!path.isAbsolute(candidate)) throw new Error("CODEX_HOME must resolve to an absolute path.");
  return path.resolve(candidate);
}

export function buildWorkerProcessEnvironment(parentEnvironment = process.env, {
  platform = process.platform,
  codexHome,
} = {}) {
  const environment = {};
  for (const name of PILOT_PROCESS_ENV_ALLOWLIST) {
    const value = environmentValue(parentEnvironment, name);
    if (value !== undefined && value !== "") environment[name] = value;
  }
  environment.CODEX_HOME = resolveCodexHome(parentEnvironment, codexHome);
  environment.NO_COLOR ??= "1";
  if (!environment.PATH) throw new Error("Pilot worker environment requires PATH.");
  if (!environment.TEMP && !environment.TMP) {
    throw new Error("Pilot worker environment requires TEMP or TMP.");
  }
  if (platform === "win32" && !environment.SYSTEMROOT) {
    throw new Error("Pilot Windows worker environment requires SYSTEMROOT.");
  }
  assertCredentialEnvironmentAbsent(environment);
  return Object.freeze(environment);
}

export function buildWorkerShellEnvironment(workerProcessEnvironment) {
  const environment = {};
  for (const name of PILOT_SHELL_ENV_ALLOWLIST) {
    const value = environmentValue(workerProcessEnvironment, name);
    if (value !== undefined && value !== "") environment[name] = value;
  }
  assertCredentialEnvironmentAbsent(environment, "worker shell environment");
  return Object.freeze(environment);
}

function parseCodexVersion(output) {
  const match = String(output).match(/codex-cli\s+(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?/i);
  if (!match) throw unavailable("installed Codex CLI version could not be parsed");
  return {
    raw: match[0],
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

function versionAtLeast(version, required) {
  const left = [version.major, version.minor, version.patch];
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] > required[index]) return true;
    if (left[index] < required[index]) return false;
  }
  return true;
}

export function detectWindowsElevatedSandbox({
  platform = process.platform,
  parentEnvironment = process.env,
  codexHome,
  networkAccess = true,
  proxyEnforced = true,
  readFile = (file) => fs.readFileSync(file, "utf8"),
  fileExists = fs.existsSync,
  execFile = execFileSync,
} = {}) {
  if (platform !== "win32") throw unavailable("native Windows elevated sandbox is required");
  if (typeof networkAccess !== "boolean") {
    throw unavailable("sandbox network selection must be boolean");
  }
  if (typeof proxyEnforced !== "boolean") {
    throw unavailable("sandbox proxy enforcement selection must be boolean");
  }
  if (proxyEnforced && !networkAccess) {
    throw unavailable("network proxy enforcement requires sandbox network access");
  }
  const resolvedCodexHome = resolveCodexHome(parentEnvironment, codexHome);
  const processEnvironment = buildWorkerProcessEnvironment(parentEnvironment, {
    platform,
    codexHome: resolvedCodexHome,
  });
  let version;
  try {
    version = parseCodexVersion(execFile("codex", ["--version"], {
      encoding: "utf8",
      windowsHide: true,
      env: processEnvironment,
    }));
  } catch (error) {
    if (error?.code === PILOT_SANDBOX_UNAVAILABLE) throw error;
    throw unavailable("installed Codex CLI could not be inspected", error);
  }
  if (!versionAtLeast(version, [0, 149, 0])) {
    throw unavailable(`Codex CLI ${version.raw} is older than required 0.149.0`);
  }
  const markerPath = path.join(resolvedCodexHome, ".sandbox", "setup_marker.json");
  if (!fileExists(markerPath)) throw unavailable("elevated sandbox setup marker is missing");
  let marker;
  try {
    marker = JSON.parse(readFile(markerPath));
  } catch (error) {
    throw unavailable("elevated sandbox setup marker is unreadable", error);
  }
  if (!Number.isInteger(marker.version)
    || marker.offline_username !== "CodexSandboxOffline"
    || marker.online_username !== "CodexSandboxOnline"
    || marker.allow_local_binding !== false
    || !Array.isArray(marker.proxy_ports)
    || marker.proxy_ports.some((port) => !Number.isInteger(port) || port < 1 || port > 65_535)) {
    throw unavailable("elevated sandbox setup marker does not describe the required network profiles");
  }
  for (const username of [marker.offline_username, marker.online_username]) {
    try {
      execFile("net", ["user", username], {
        encoding: "utf8",
        windowsHide: true,
        env: processEnvironment,
        stdio: ["ignore", "ignore", "ignore"],
      });
    } catch (error) {
      throw unavailable(`required sandbox account is unavailable: ${username}`, error);
    }
  }
  const proxyRestricted = networkAccess && proxyEnforced;
  return Object.freeze({
    passed: true,
    backend: "elevated",
    network_profile: proxyRestricted ? "restricted-proxy" : (networkAccess ? "online" : "offline"),
    sandbox_username: proxyRestricted || !networkAccess
      ? marker.offline_username
      : marker.online_username,
    network_access: networkAccess,
    proxy_enforced: proxyEnforced,
    allow_local_binding: marker.allow_local_binding,
    cli_version: version.raw.replace(/^codex-cli\s+/i, ""),
    marker_version: marker.version,
  });
}

export function validateProjectCodexConfiguration(worktree) {
  const configurationDirectory = path.join(worktree, ".codex");
  if (!fs.existsSync(configurationDirectory)) {
    return Object.freeze({ passed: true, project_configuration: "ABSENT" });
  }
  throw new Error("Pilot blocks project .codex configuration because it could broaden the effective worker profile.");
}

function samePath(left, right) {
  const normalize = (value) => path.resolve(value).replace(/\\/g, "/").toLocaleLowerCase("en-US");
  return normalize(left) === normalize(right);
}

function assertNoForbiddenPermissions(permissions) {
  for (const permission of FORBIDDEN_PILOT_PERMISSIONS) {
    if (permissions[permission]) throw new Error(`Pilot worker permission is forbidden: ${permission}`);
  }
}

export function assertPilotDispatchProfile({
  contract,
  grant,
  capability,
  repoRoot,
  policy = PILOT_MODE,
}) {
  if (!policy.activation_enabled) throw new Error("Pilot mode is inactive; worker dispatch is blocked.");
  if (policy.max_workers !== 1 || contract.limits.max_workers !== 1 || grant.limits.max_workers !== 1) {
    throw new Error("Pilot MAX_WORKERS must be exactly 1.");
  }
  if (!policy.authorized_task_keys.includes(contract.task_key)) {
    throw new Error(`Pilot task key is not explicitly authorized: ${contract.task_key}`);
  }
  if (policy.automatic_existing_task_adoption
    || contract.provenance.automatic_existing_task_adoption
    || contract.requested_permissions.task_adoption
    || grant.permissions.task_adoption) {
    throw new Error("Pilot cannot automatically adopt existing tasks.");
  }
  assertNoForbiddenPermissions(contract.requested_permissions);
  assertNoForbiddenPermissions(grant.permissions);
  assertSyntheticPilotGrant(contract, grant);
  const contractNetwork = contract.synthetic_pilot.network;
  const grantNetwork = grant.activation.synthetic_pilot_once.network;
  if (contractNetwork !== true || grantNetwork !== contractNetwork
    || policy.network_access !== grantNetwork) {
    throw new Error("Pilot contract, Grant, activation, and runtime network permissions must match.");
  }
  assertRestrictedPilotNetworkPolicy(policy);
  assertRestrictedPilotNetworkPolicy({
    network_access: contractNetwork,
    network_proxy: contract.synthetic_pilot.network_proxy,
  }, "synthetic pilot contract");
  assertRestrictedPilotNetworkPolicy({
    network_access: grant.synthetic_pilot.network,
    network_proxy: grant.synthetic_pilot.network_proxy,
  }, "synthetic pilot Grant");
  if (!grant.permissions.worker_dispatch || !grant.activation.worker_dispatch
    || grant.activation.autonomous) {
    throw new Error("Pilot dispatch requires a separate one-shot worker Grant.");
  }
  if (Object.entries(grant.publishing).some(([key, value]) =>
    key !== "allowed_branch" && key !== "approval_required_actions"
      && typeof value === "boolean" && value)) {
    throw new Error("Pilot workers cannot request publishing.");
  }
  if (grant.publishing.approval_required_actions.length > 0) {
    throw new Error("Pilot workers cannot request publishing approval actions.");
  }
  const routed = routeTask(contract, { availableModels: ["gpt-5.6-sol"] });
  if (routed.provider !== "OpenAI" || routed.model !== "gpt-5.6-sol" || routed.fallback !== "BLOCKED") {
    throw new Error("Pilot model/provider/fallback profile is not pinned.");
  }
  if (grant.routing.provider !== routed.provider
    || grant.routing.requested_model !== routed.model
    || grant.routing.fallback !== "BLOCKED") {
    throw new Error("Pilot Grant broadens the pinned model/provider/fallback profile.");
  }
  const sandbox = deriveSandbox(contract, capability.role);
  if (sandbox !== capability.sandbox || !["workspace-write", "read-only"].includes(sandbox)) {
    throw new Error("Pilot sandbox is not pinned to the authorized Role.");
  }
  if (!samePath(repoRoot, grant.worktree_realpath)) {
    throw new Error("Pilot cwd must be the exact authorized task worktree.");
  }
  return Object.freeze({
    mode: policy.name,
    model: routed.model,
    provider: "openai",
    reasoning_effort: routed.reasoning_effort,
    sandbox,
    windows_sandbox: "elevated",
    cwd: path.resolve(grant.worktree_realpath),
    approval_policy: "never",
    network_access: policy.network_access,
    network_proxy: policy.network_proxy,
    model_fallback: false,
    max_workers: 1,
    user_config: "ignored",
    project_config: "must-be-absent",
    external_tools: false,
    publishing: false,
  });
}

export function assertNoPilotProfileBroadening(request, requiredProfile) {
  const comparisons = [
    ["sandbox", requiredProfile.sandbox],
    ["model", requiredProfile.model],
    ["provider", requiredProfile.provider],
    ["cwd", requiredProfile.cwd],
    ["approval_policy", requiredProfile.approval_policy],
    ["network_access", requiredProfile.network_access],
    ["max_workers", requiredProfile.max_workers],
  ];
  for (const [key, expected] of comparisons) {
    if (!Object.hasOwn(request, key)) continue;
    const actual = key === "cwd" ? path.resolve(request[key]) : request[key];
    if (key === "cwd" ? !samePath(actual, expected) : actual !== expected) {
      throw new Error(`Pilot security broadening rejected for ${key}.`);
    }
  }
  if (Object.hasOwn(request, "network_proxy")) {
    assertRestrictedPilotNetworkPolicy({
      network_access: request.network_access ?? requiredProfile.network_access,
      network_proxy: request.network_proxy,
    }, "pilot request");
  }
  if (request.external_tools || request.browser || request.computer_use
    || request.mcp || request.plugins || request.escalation || request.model_fallback) {
    throw new Error("Pilot external tool or escalation broadening rejected.");
  }
  if (request.environment && Object.keys(request.environment).some((name) =>
    !PILOT_PROCESS_ENV_ALLOWLIST.includes(name) && name !== "CODEX_HOME")) {
    throw new Error("Pilot environment broadening rejected.");
  }
  return true;
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

export function buildPilotCliSecurityArgs(profile, workerShellEnvironment) {
  assertRestrictedPilotNetworkPolicy(profile, "synthetic pilot launcher");
  const args = [
    "--strict-config",
    "--ignore-user-config",
    "--ignore-rules",
    "--ephemeral",
    "-c", `approval_policy=${tomlString(profile.approval_policy)}`,
    "-c", `model_provider=${tomlString(profile.provider)}`,
    "-c", `model_reasoning_effort=${tomlString(profile.reasoning_effort)}`,
    "-c", `windows.sandbox=${tomlString(profile.windows_sandbox)}`,
    "-c", "sandbox_workspace_write.network_access=true",
    "-c", "features.network_proxy.enabled=true",
    "-c", "features.network_proxy.domains={ \"chatgpt.com\" = \"allow\" }",
    "-c", "features.network_proxy.allow_local_binding=false",
    "-c", "features.network_proxy.allow_upstream_proxy=false",
    "-c", "features.network_proxy.enable_socks5=false",
    "-c", "features.network_proxy.enable_socks5_udp=false",
    "-c", "features.network_proxy.credential_broker=false",
    "-c", "features.network_proxy.dangerously_allow_non_loopback_proxy=false",
    "-c", "features.network_proxy.dangerously_allow_all_unix_sockets=false",
    "-c", "features.network_proxy.unix_sockets={}",
    "-c", "shell_environment_policy.inherit=\"none\"",
    "-c", "shell_environment_policy.ignore_default_excludes=false",
  ];
  for (const [name, value] of Object.entries(workerShellEnvironment)) {
    args.push("-c", `shell_environment_policy.set.${name}=${tomlString(value)}`);
  }
  for (const feature of PILOT_DISABLED_FEATURES) args.push("--disable", feature);
  args.push("--enable", "skip_host_skill_discovery");
  return args;
}

export function preparePilotWorkerLaunch({
  contract,
  grant,
  capability,
  repoRoot,
  parentEnvironment = process.env,
  codexHome,
  policy = PILOT_MODE,
  sandboxInspector = detectWindowsElevatedSandbox,
}) {
  const profile = assertPilotDispatchProfile({ contract, grant, capability, repoRoot, policy });
  const projectConfiguration = validateProjectCodexConfiguration(profile.cwd);
  const processEnvironment = buildWorkerProcessEnvironment(parentEnvironment, { codexHome });
  let sandboxEvidence;
  try {
    sandboxEvidence = sandboxInspector({
      platform: process.platform,
      parentEnvironment,
      codexHome: processEnvironment.CODEX_HOME,
      networkAccess: profile.network_access,
      proxyEnforced: profile.network_proxy.enforced,
    });
  } catch (error) {
    if (error?.code === PILOT_SANDBOX_UNAVAILABLE) throw error;
    throw unavailable("elevated sandbox inspection failed", error);
  }
  const requiredNetworkProfile = "restricted-proxy";
  const requiredSandboxUsername = "CodexSandboxOffline";
  if (!sandboxEvidence?.passed || sandboxEvidence.backend !== "elevated"
    || sandboxEvidence.network_profile !== requiredNetworkProfile
    || sandboxEvidence.sandbox_username !== requiredSandboxUsername
    || sandboxEvidence.network_access !== true
    || sandboxEvidence.proxy_enforced !== true
    || sandboxEvidence.allow_local_binding !== false) {
    throw unavailable(`required elevated/${requiredNetworkProfile} sandbox could not be verified`);
  }
  const shellEnvironment = buildWorkerShellEnvironment(processEnvironment);
  return Object.freeze({
    profile,
    process_environment: processEnvironment,
    shell_environment: shellEnvironment,
    cli_security_args: Object.freeze(buildPilotCliSecurityArgs(profile, shellEnvironment)),
    sandbox_evidence: sandboxEvidence,
    project_configuration: projectConfiguration,
  });
}

export function assertPilotWorkerRequestedActions(requestedActions) {
  if (!Array.isArray(requestedActions)) throw new Error("Pilot requested actions must be an array.");
  if (requestedActions.length > 0) {
    throw new Error("Pilot worker cannot request GitHub publishing, deployment, DNS, production, or other external actions.");
  }
  return true;
}

export function pilotTaskKeyAuthorized(taskKey, policy = PILOT_MODE) {
  return policy.activation_enabled && policy.authorized_task_keys.includes(taskKey);
}
