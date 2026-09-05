import { WorkerRunner } from "./interfaces.mjs";
import { loadWorkerSecurityPolicy, assertRuntimeImagePinned } from "./policy.mjs";
import { buildOciRunSpec, assertOciRunSpec, toPodmanArgs } from "./container-policy.mjs";
import { assertPinnedCodexInvocation } from "./codex-home.mjs";

function profileForCapability(capability, policy) {
  if (capability.sandbox === policy.codex.profiles.review) return "review";
  if (capability.sandbox === policy.codex.profiles.implementation) return "implementation";
  throw new Error("Capability sandbox is outside pinned worker profiles.");
}

function assertRunnerRequest(request, policy) {
  const { contract, grant, capability, prompt } = request ?? {};
  if (!contract || !grant || !capability || typeof prompt !== "string" || prompt.length === 0) {
    throw new Error("WorkerRunner requires contract, Grant, capability, and prompt data.");
  }
  const exact = contract.task_key === grant.task_key
    && grant.task_key === capability.task_key
    && grant.authorization_id === capability.authorization_id
    && grant.authorization_revision === capability.authorization_revision
    && grant.contract_digest === capability.contract_digest
    && capability.model === policy.codex.model;
  if (!exact) throw new Error("WorkerRunner identity/authority binding mismatch.");
  return profileForCapability(capability, policy);
}

export class OciCellWorkerRunner extends WorkerRunner {
  constructor({ policy = loadWorkerSecurityPolicy() } = {}) {
    super();
    this.policy = policy;
  }

  plan(request) {
    const profile = assertRunnerRequest(request, this.policy);
    const { contract, capability } = request;
    const oci = buildOciRunSpec({
      taskKey: contract.task_key,
      runId: capability.run_id,
      profile,
      policy: this.policy,
    });
    assertOciRunSpec(oci, this.policy);
    const codexArgs = [
      "--strict-config",
      "--ask-for-approval", this.policy.codex.approval_policy,
      "--model", this.policy.codex.model,
      "--sandbox", this.policy.codex.profiles[profile],
      "--cd", this.policy.codex.worker_cwd,
      "exec", "-", "--ephemeral", "--ignore-rules",
      "--json",
      "--output-schema", "/run/controller-input/worker-result.schema.json",
      "--output-last-message", "/run/worker-output/worker-result.json",
    ];
    assertPinnedCodexInvocation({
      executable: "codex",
      version: this.policy.codex.cli_version,
      args: codexArgs,
      cwd: this.policy.codex.worker_cwd,
      profile,
    }, this.policy);
    return Object.freeze({
      schema_version: "1.0.0",
      architecture: this.policy.architecture,
      task_key: contract.task_key,
      run_id: capability.run_id,
      profile,
      activation: this.policy.activation,
      machine_enforcement: this.policy.machine_enforcement,
      authoritative_worktree_mounted: false,
      controller_authority_mounted: false,
      provider_credential_exposed_to_worker: false,
      oci,
      launcher: Object.freeze({
        windows_command: "wsl.exe",
        windows_args: Object.freeze([
          "--distribution", this.policy.wsl.distribution, "--exec", this.policy.oci.runtime,
          ...toPodmanArgs(oci, this.policy), ...codexArgs,
        ]),
        container_command: "codex",
        container_args: Object.freeze(codexArgs),
      }),
    });
  }

  async run(request) {
    const plan = this.plan(request);
    if (plan.activation !== "ENABLED") {
      throw new Error("WorkerRunner is repository-implemented but activation is not authorized.");
    }
    assertRuntimeImagePinned(this.policy);
    throw new Error("PENDING_MACHINE_AUTHORIZATION: WSL2/OCI runner adapter is not provisioned.");
  }
}

export function createProductionWorkerRunner() {
  return new OciCellWorkerRunner();
}
