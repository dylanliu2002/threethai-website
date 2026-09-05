import fs from "node:fs";
import path from "node:path";
import { loadWorkerSecurityPolicy } from "./policy.mjs";

const PROFILE_NAMES = new Set(["implementation", "review"]);

function assertProfile(profile) {
  if (!PROFILE_NAMES.has(profile)) throw new Error(`Unknown worker profile: ${profile}`);
}

export function renderCodexConfig(profile, policy = loadWorkerSecurityPolicy()) {
  assertProfile(profile);
  const sandbox = policy.codex.profiles[profile];
  return `#:schema https://developers.openai.com/codex/config-schema.json
model = "${policy.codex.model}"
model_provider = "${policy.codex.provider_id}"
model_reasoning_effort = "${policy.codex.reasoning_effort}"
approval_policy = "${policy.codex.approval_policy}"
sandbox_mode = "${sandbox}"
web_search = "disabled"
allow_login_shell = false
check_for_update_on_startup = false
history.persistence = "none"

[sandbox_workspace_write]
network_access = false
writable_roots = []

[shell_environment_policy]
inherit = "none"
ignore_default_excludes = false
experimental_use_profile = false

[tools]
web_search = false
view_image = false

[features]
apps = false
browser_use = false
browser_use_external = false
browser_use_full_cdp_access = false
computer_use = false
in_app_browser = false
multi_agent = false
plugins = false
remote_plugin = false
skill_mcp_dependency_install = false
web_search = false
web_search_cached = false
web_search_request = false
`;
}

export function renderCodexRequirements(profile, policy = loadWorkerSecurityPolicy()) {
  assertProfile(profile);
  const sandbox = policy.codex.profiles[profile];
  return `allowed_approval_policies = ["never"]
allowed_sandbox_modes = ["${sandbox}"]
allowed_web_search_modes = ["disabled"]
allow_appshots = false
allow_browser_and_computer_use = false
allow_login_shell = false
allow_managed_hooks_only = true
allow_remote_control = false
check_for_update_on_startup = false

[features]
apps = false
browser_use = false
browser_use_external = false
browser_use_full_cdp_access = false
computer_use = false
in_app_browser = false
multi_agent = false
plugins = false
remote_plugin = false
skill_mcp_dependency_install = false
web_search = false
web_search_cached = false
web_search_request = false

[mcp_servers]

[plugins]

[marketplaces]
restrict_to_allowed_sources = true
`;
}

function assertEmptyDirectory(directory) {
  if (fs.existsSync(directory)) {
    if (!fs.statSync(directory).isDirectory() || fs.readdirSync(directory).length !== 0) {
      throw new Error("CODEX_HOME target must be a new empty directory.");
    }
  } else {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
}

export function writeCleanCodexConfiguration({ codexHome, requirementsPath, profile, policy = loadWorkerSecurityPolicy() }) {
  if (!path.isAbsolute(codexHome) || !path.isAbsolute(requirementsPath)) {
    throw new Error("Codex configuration paths must be absolute controller-selected paths.");
  }
  assertEmptyDirectory(codexHome);
  fs.writeFileSync(path.join(codexHome, "config.toml"), renderCodexConfig(profile, policy), { mode: 0o600, flag: "wx" });
  fs.writeFileSync(requirementsPath, renderCodexRequirements(profile, policy), { mode: 0o600, flag: "wx" });
  return Object.freeze({
    codex_home: codexHome,
    requirements_path: requirementsPath,
    profile,
    inherited_user_configuration: false,
    project_configuration_allowed: false,
  });
}

export function assertPinnedCodexInvocation({ executable, version, args, cwd, profile }, policy = loadWorkerSecurityPolicy()) {
  assertProfile(profile);
  if (executable !== "codex" || version !== policy.codex.cli_version) throw new Error("Codex CLI version is not pinned.");
  if (cwd !== policy.codex.worker_cwd) throw new Error("Codex cwd override rejected.");
  const expected = [
    "--strict-config",
    "--ask-for-approval", policy.codex.approval_policy,
    "--model", policy.codex.model,
    "--sandbox", policy.codex.profiles[profile],
    "--cd", policy.codex.worker_cwd,
    "exec", "-", "--ephemeral", "--ignore-rules",
    "--json",
    "--output-schema", "/run/controller-input/worker-result.schema.json",
    "--output-last-message", "/run/worker-output/worker-result.json",
  ];
  if (args.length !== expected.length || args.some((arg, index) => arg !== expected[index])) {
    throw new Error("Codex invocation override rejected: command differs from the exact pin.");
  }
  if (args.some((arg) => /danger-full-access|--yolo|--full-auto/i.test(arg))) {
    throw new Error("danger-full-access is forbidden.");
  }
  return true;
}
