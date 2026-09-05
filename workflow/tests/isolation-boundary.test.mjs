import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { renderCodexConfig, renderCodexRequirements, writeCleanCodexConfiguration, assertPinnedCodexInvocation } from "../isolation/codex-home.mjs";
import { assertOciRunSpec, buildOciRunSpec, toPodmanArgs } from "../isolation/container-policy.mjs";
import { ControlledEvidenceImporter } from "../isolation/evidence-importer.mjs";
import { assertWorkerEnvironment, buildWorkerEnvironment } from "../isolation/environment.mjs";
import { ControllerInferenceGateway, createLocalInferenceGatewayStub, issueGatewayLease } from "../isolation/inference-gateway.mjs";
import { machineIsolationStatus } from "../isolation/machine-probes.mjs";
import { loadWorkerSecurityPolicy, validateWorkerSecurityPolicy } from "../isolation/policy.mjs";
import { ControllerSecretStore } from "../isolation/secret-store.mjs";
import { createMemorySignerForTests, ProtectedControllerSigner } from "../isolation/signer.mjs";
import { OciCellWorkerRunner } from "../isolation/worker-runner.mjs";
import { buildUntrustedResultBundle, GitWorkspaceProjector } from "../isolation/workspace-projector.mjs";
import { testAuthorityMaterial } from "../testing/controller-harness.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const policy = loadWorkerSecurityPolicy();

function git(repoRoot, args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
}

function write(root, repositoryPath, value) {
  const target = path.join(root, ...repositoryPath.split("/"));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

function makeProjectionFixture() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sys-auto-002-source-"));
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "sys-auto-002-projection-"));
  git(repoRoot, ["init", "-b", "main"]);
  git(repoRoot, ["config", "user.name", "dylanliu2002"]);
  git(repoRoot, ["config", "user.email", "dylanliu2002@gmail.com"]);
  write(repoRoot, "allowed.txt", "base\n");
  write(repoRoot, "nested/visible.txt", "visible\n");
  write(repoRoot, ".env.production", "placeholder-not-a-secret\n");
  write(repoRoot, ".npmrc", "registry=https://registry.npmjs.org\n");
  write(repoRoot, ".codex/config.toml", "sandbox_mode = \"danger-full-access\"\n");
  write(repoRoot, ".gitmodules", "[submodule \"private\"]\n\turl = https://example.invalid/private.git\n");
  write(repoRoot, ".docker/config.json", "{\"auths\":{}}\n");
  write(repoRoot, "client.pem", "test-only-placeholder\n");
  write(repoRoot, "settings.xml", "<settings/>\n");
  git(repoRoot, ["add", "-f", "."]);
  git(repoRoot, ["commit", "-m", "test: projection source"]);
  return { repoRoot, destination, baseSha: git(repoRoot, ["rev-parse", "HEAD"]) };
}

function remove(...directories) {
  for (const directory of directories) {
    if (directory && fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
  }
}

function gatewayFixture(policyOverride = policy) {
  const authority = testAuthorityMaterial();
  const signer = createMemorySignerForTests(authority);
  const capability = {
    task_key: "task-alpha",
    run_id: crypto.randomUUID(),
    lease_id: crypto.randomUUID(),
    capability_id: crypto.randomUUID(),
  };
  const lease = issueGatewayLease({
    capability,
    signer,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    policy: policyOverride,
  });
  return { signer, capability, lease };
}

function gatewayRequest(overrides = {}) {
  return {
    operation: "responses.create",
    method: "POST",
    path: "/v1/responses",
    estimated_input_tokens: 10,
    payload: { model: "gpt-5.6-sol", max_output_tokens: 100, input: "bounded test" },
    ...overrides,
  };
}

test("ISO-POLICY-01 repository policy pins WIN-OCI-CELL-01 without activation", () => {
  assert.equal(policy.architecture, "WIN-OCI-CELL-01");
  assert.equal(policy.activation, "DISABLED");
  assert.equal(policy.machine_enforcement, "PENDING_MACHINE_AUTHORIZATION");
  assert.equal(policy.codex.cli_version, "0.153.0-alpha.5");
  assert.equal(policy.codex.model, "gpt-5.6-sol");
  assert.equal(policy.codex.reasoning_effort, "high");
  assert.equal(policy.codex.automatic_fallback, false);
});

test("ISO-ENV-01 worker environment starts empty and never inherits controller secrets", () => {
  process.env.OPENAI_API_KEY = "should-not-cross-boundary";
  process.env.GITHUB_TOKEN = "should-not-cross-boundary";
  const environment = buildWorkerEnvironment({ taskKey: "task-alpha", runId: crypto.randomUUID() });
  assert.equal(Object.getPrototypeOf(environment), null);
  assert.equal(Object.hasOwn(environment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(environment, "GITHUB_TOKEN"), false);
  assert.equal(Object.hasOwn(environment, "SSH_AUTH_SOCK"), false);
  assertWorkerEnvironment(environment);
  delete process.env.OPENAI_API_KEY;
  delete process.env.GITHUB_TOKEN;
});

test("ISO-ENV-02 injected environment keys and non-empty-map environments are rejected", () => {
  const environment = buildWorkerEnvironment({ taskKey: "task-alpha", runId: crypto.randomUUID() });
  assert.throws(() => assertWorkerEnvironment({ ...environment, OPENAI_API_KEY: "x" }), /empty map|forbidden/i);
  const clone = Object.assign(Object.create(null), environment, { EXTRA: "x" });
  assert.throws(() => assertWorkerEnvironment(clone), /not allowed/i);
});

test("ISO-CODEX-01 clean Codex profiles pin model/provider/cwd/approval/network and disable tools", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sys-auto-002-codex-home-"));
  t.after(() => remove(root));
  const codexHome = path.join(root, "home");
  const requirementsPath = path.join(root, "requirements.toml");
  const result = writeCleanCodexConfiguration({ codexHome, requirementsPath, profile: "implementation" });
  const config = fs.readFileSync(path.join(codexHome, "config.toml"), "utf8");
  const requirements = fs.readFileSync(requirementsPath, "utf8");
  assert.equal(result.inherited_user_configuration, false);
  for (const fragment of [
    'model = "gpt-5.6-sol"', 'model_provider = "openai"', 'model_reasoning_effort = "high"',
    'approval_policy = "never"', 'sandbox_mode = "workspace-write"', 'web_search = "disabled"',
    'inherit = "none"', 'network_access = false', 'plugins = false', '[mcp_servers]',
  ]) assert.ok(`${config}\n${requirements}`.includes(fragment), fragment);
  assert.throws(() => writeCleanCodexConfiguration({ codexHome, requirementsPath: path.join(root, "second.toml"), profile: "review" }), /empty/i);
});

test("ISO-CODEX-02 review requirements cannot broaden beyond read-only", () => {
  const requirements = renderCodexRequirements("review");
  assert.ok(requirements.includes('allowed_sandbox_modes = ["read-only"]'));
  assert.equal(requirements.includes("workspace-write"), false);
  assert.ok(renderCodexConfig("review").includes('sandbox_mode = "read-only"'));
});

test("ISO-CODEX-03 danger-full-access and model/provider/cwd overrides are rejected", () => {
  const base = [
    "--strict-config", "--ask-for-approval", "never",
    "--model", "gpt-5.6-sol", "--sandbox", "workspace-write", "--cd", "/workspace",
    "exec", "-", "--ephemeral", "--ignore-rules",
    "--json", "--output-schema", "/run/controller-input/worker-result.schema.json",
    "--output-last-message", "/run/worker-output/worker-result.json",
  ];
  const check = (args, cwd = "/workspace", version = policy.codex.cli_version) =>
    assertPinnedCodexInvocation({ executable: "codex", version, args, cwd, profile: "implementation" });
  assert.equal(check(base), true);
  assert.throws(() => check(base.map((item) => item === "workspace-write" ? "danger-full-access" : item)), /override|danger/i);
  assert.throws(() => check(base.map((item) => item === "gpt-5.6-sol" ? "other-model" : item)), /override/i);
  assert.throws(() => check([...base, "--dangerously-bypass-approvals-and-sandbox"]), /exact|danger/i);
  assert.throws(() => check(base.filter((item) => item !== "--strict-config")), /exact/i);
  assert.throws(() => check(base, "/other"), /cwd/i);
  assert.throws(() => check(base, "/workspace", "0.0.0"), /version/i);
});

test("ISO-OCI-01 container policy is non-root, ephemeral, read-only, drop-all, network-none, and namespace-private", () => {
  const spec = buildOciRunSpec({ taskKey: "task-alpha", runId: crypto.randomUUID(), profile: "implementation" });
  assertOciRunSpec(spec);
  assert.equal(spec.remove, true);
  assert.equal(spec.user, "65532:65532");
  assert.equal(spec.read_only_root_filesystem, true);
  assert.deepEqual(spec.capabilities_drop, ["ALL"]);
  assert.equal(spec.no_new_privileges, true);
  assert.equal(spec.network, "none");
  assert.equal(spec.namespaces.user, "auto:size=65536");
  assert.ok(["pid", "ipc", "uts", "cgroup"].every((name) => spec.namespaces[name] === "private"));
  const args = toPodmanArgs(spec);
  for (const required of ["--rm", "--pull", "--read-only", "--unsetenv-all", "--http-proxy=false", "--cap-drop", "--network", "--pids-limit", "--memory", "--userns", "--cgroupns"]) {
    assert.ok(args.includes(required), required);
  }
});

test("ISO-OCI-02 Windows drives, controller state, runtime sockets, and host namespaces are rejected", () => {
  const original = buildOciRunSpec({ taskKey: "task-alpha", runId: crypto.randomUUID(), profile: "implementation" });
  const windowsMount = structuredClone(original);
  windowsMount.mounts.push({ type: "bind", source: "C:\\repo", target: "/host", read_only: false, purpose: "bad" });
  assert.throws(() => assertOciRunSpec(windowsMount), /forbidden.*mount/i);
  const controllerMount = structuredClone(original);
  controllerMount.mounts.push({ type: "bind", source: "/var/lib/.threethai-controller", target: "/controller", read_only: true, purpose: "bad" });
  assert.throws(() => assertOciRunSpec(controllerMount), /forbidden.*mount/i);
  const socket = structuredClone(original);
  socket.runtime_socket_exposed = true;
  assert.throws(() => assertOciRunSpec(socket), /runtime sockets/i);
  const namespace = structuredClone(original);
  namespace.namespaces.pid = "host";
  assert.throws(() => assertOciRunSpec(namespace), /namespace/i);
  const hostUserNamespace = structuredClone(original);
  hostUserNamespace.namespaces.user = "host";
  assert.throws(() => assertOciRunSpec(hostUserNamespace), /namespace/i);
  const inheritedDefaults = structuredClone(original);
  inheritedDefaults.default_environment_unset = false;
  assert.throws(() => assertOciRunSpec(inheritedDefaults), /defaults/i);
  const inheritedProxy = structuredClone(original);
  inheritedProxy.http_proxy_passthrough = true;
  assert.throws(() => assertOciRunSpec(inheritedProxy), /proxy/i);
  const arbitraryMount = structuredClone(original);
  arbitraryMount.mounts[0].source = "/etc";
  assert.throws(() => assertOciRunSpec(arbitraryMount), /mount plan/i);
  const mutableImage = structuredClone(original);
  mutableImage.image = "example.invalid/worker:latest";
  assert.throws(() => assertOciRunSpec(mutableImage), /image override/i);
  const broaderResources = structuredClone(original);
  broaderResources.resources.memory_bytes += 1;
  assert.throws(() => assertOciRunSpec(broaderResources), /resource limit/i);
  const changedEnvironment = structuredClone(original);
  changedEnvironment.environment = Object.assign(Object.create(null), original.environment, { PATH: "/host/bin" });
  assert.throws(() => assertOciRunSpec(changedEnvironment), /environment values/i);
});

test("ISO-OCI-03 review workspace projection is mounted read-only", () => {
  const spec = buildOciRunSpec({ taskKey: "task-alpha", runId: crypto.randomUUID(), profile: "review" });
  assertOciRunSpec(spec);
  assert.equal(spec.mounts.find((mount) => mount.target === "/workspace").read_only, true);
});

test("ISO-OCI-04 seccomp defaults deny and does not allow privilege/namespace syscalls", () => {
  const seccomp = JSON.parse(fs.readFileSync(path.join(sourceRoot, policy.oci.seccomp_profile), "utf8"));
  assert.equal(seccomp.defaultAction, "SCMP_ACT_ERRNO");
  const allowed = new Set(seccomp.syscalls.filter((entry) => entry.action === "SCMP_ACT_ALLOW").flatMap((entry) => entry.names));
  for (const forbidden of ["mount", "umount2", "ptrace", "setns", "unshare", "bpf", "keyctl", "reboot", "kexec_load"]) {
    assert.equal(allowed.has(forbidden), false, forbidden);
  }
});

test("ISO-WSL-01 templates disable Windows drive automount and interop", () => {
  const wsl = fs.readFileSync(path.join(sourceRoot, "workflow/isolation/templates/wsl.conf"), "utf8");
  assert.match(wsl, /\[automount\][\s\S]*enabled=false/);
  assert.match(wsl, /\[interop\][\s\S]*enabled=false[\s\S]*appendWindowsPath=false/);
  const controller = JSON.parse(fs.readFileSync(path.join(sourceRoot, "workflow/isolation/templates/windows-controller-service.json"), "utf8"));
  assert.equal(controller.administrator, false);
  assert.equal(controller.production_activation, false);
  assert.equal(controller.status, "PENDING_MACHINE_AUTHORIZATION");
});

test("ISO-SIGNER-01 production signer is a protected non-path reference and fails closed while unprovisioned", () => {
  const signer = new ProtectedControllerSigner({ reference: policy.controller.signer_reference, fingerprint: "a".repeat(64) });
  assert.equal(signer.reference.includes(".pem"), false);
  assert.equal(signer.available, false);
  assert.throws(() => signer.sign("data"), /PENDING_MACHINE_AUTHORIZATION/);
});

test("ISO-SECRET-01 SecretStore rejects filesystem paths and never marks secrets exportable to workers", () => {
  const store = new ControllerSecretStore();
  assert.throws(() => store.describe("C:\\keys\\controller.pem"), /invalid|path-backed/i);
  const descriptor = store.describe(policy.controller.secret_store_reference);
  assert.equal(descriptor.exportable_to_worker, false);
  assert.equal(descriptor.available, false);
  assert.throws(() => store.withSecret(policy.controller.secret_store_reference, () => true), /PENDING_MACHINE_AUTHORIZATION/);
});

test("ISO-GATEWAY-01 signed gateway lease binds task/run/model/provider/expiry and local stub exposes no provider credential", async () => {
  const { signer, capability, lease } = gatewayFixture();
  const gateway = createLocalInferenceGatewayStub({ signer });
  const result = await gateway.forward(lease, gatewayRequest());
  assert.equal(lease.task_key, capability.task_key);
  assert.equal(lease.run_id, capability.run_id);
  assert.equal(lease.model, "gpt-5.6-sol");
  assert.equal(lease.provider, "OpenAI");
  assert.equal(result.local_stub, true);
  assert.equal(JSON.stringify(result).includes("credential"), false);
});

test("ISO-GATEWAY-02 arbitrary URLs, CONNECT, provider/base URL, model overrides, and private destinations are rejected", () => {
  const { signer, lease } = gatewayFixture();
  const gateway = createLocalInferenceGatewayStub({ signer });
  assert.throws(() => gateway.authorize(lease, gatewayRequest({ path: "https://example.com/" })), /invalid|expected/i);
  assert.throws(() => gateway.authorize(lease, gatewayRequest({ method: "CONNECT" })), /invalid|expected/i);
  assert.throws(() => gateway.authorize(lease, gatewayRequest({ payload: { model: "gpt-5.6-sol", max_output_tokens: 1, base_url: "https://example.com" } })), /override/i);
  assert.throws(() => gateway.authorize(lease, gatewayRequest({ payload: { model: "gpt-5.6-sol", max_output_tokens: 1, input: [{ image_url: "http://169.254.169.254/latest" }] } })), /override/i);
  assert.throws(() => gateway.authorize(lease, gatewayRequest({ payload: { model: "other", max_output_tokens: 1 } })), /model override/i);
  assert.throws(() => new ControllerInferenceGateway({ signer, destination: "http://169.254.169.254/v1/responses", forwarder: async () => ({}) }), /private|unapproved/i);
});

test("ISO-GATEWAY-03 request/token budgets fail closed", () => {
  const limited = structuredClone(policy);
  limited.gateway.max_requests = 1;
  limited.gateway.max_input_tokens = 10;
  limited.gateway.max_output_tokens = 100;
  const { signer, lease } = gatewayFixture(limited);
  const gateway = createLocalInferenceGatewayStub({ signer, policy: limited });
  gateway.authorize(lease, gatewayRequest());
  assert.throws(() => gateway.authorize(lease, gatewayRequest()), /budget/i);
});

test("ISO-PROJECTION-01 projection copies verified Git blobs but excludes secrets, Git metadata, and project Codex config", (t) => {
  const fixture = makeProjectionFixture();
  t.after(() => remove(fixture.repoRoot, fixture.destination));
  const runId = crypto.randomUUID();
  const projector = new GitWorkspaceProjector();
  const manifest = projector.project({ ...fixture, taskKey: "task-alpha", runId, profile: "implementation" });
  assert.equal(projector.verify(manifest, fixture.destination), true);
  assert.equal(fs.existsSync(path.join(fixture.destination, "allowed.txt")), true);
  for (const excluded of [".git", ".env.production", ".npmrc", ".codex", ".gitmodules", ".docker", "client.pem", "settings.xml"]) {
    assert.equal(fs.existsSync(path.join(fixture.destination, excluded)), false, excluded);
  }
  assert.equal(manifest.authoritative_worktree_mounted, false);
  assert.equal(manifest.git_metadata_included, false);
});

test("ISO-PROJECTION-02 projection tampering is detected", (t) => {
  const fixture = makeProjectionFixture();
  t.after(() => remove(fixture.repoRoot, fixture.destination));
  const projector = new GitWorkspaceProjector();
  const manifest = projector.project({ ...fixture, taskKey: "task-alpha", runId: crypto.randomUUID(), profile: "implementation" });
  fs.appendFileSync(path.join(fixture.destination, "allowed.txt"), "tampered\n");
  assert.throws(() => projector.verify(manifest, fixture.destination), /does not match/i);
});

test("ISO-PROJECTION-03 a junction back into the authoritative worktree is rejected", (t) => {
  const fixture = makeProjectionFixture();
  const inTree = path.join(fixture.repoRoot, "empty-projection-target");
  fs.mkdirSync(inTree);
  remove(fixture.destination);
  fs.symlinkSync(inTree, fixture.destination, process.platform === "win32" ? "junction" : "dir");
  t.after(() => remove(fixture.destination, fixture.repoRoot));
  const projector = new GitWorkspaceProjector();
  assert.throws(() => projector.project({
    ...fixture, taskKey: "task-alpha", runId: crypto.randomUUID(), profile: "implementation",
  }), /symlink|junction|authoritative/i);
});

test("ISO-IMPORT-01 controlled import accepts only a digest-bound, current lease/fence, authorized bundle", (t) => {
  const fixture = makeProjectionFixture();
  t.after(() => remove(fixture.repoRoot, fixture.destination));
  const runId = crypto.randomUUID();
  const leaseId = crypto.randomUUID();
  const projector = new GitWorkspaceProjector();
  const manifest = projector.project({ ...fixture, taskKey: "task-alpha", runId, profile: "implementation" });
  fs.writeFileSync(path.join(fixture.destination, "allowed.txt"), "updated\n");
  const bundle = buildUntrustedResultBundle({ manifest, workspace: fixture.destination, leaseId, fencingToken: 7 });
  const authority = {
    task_key: "task-alpha", run_id: runId, lease_id: leaseId, fencing_token: 7,
    base_sha: fixture.baseSha, projection_digest: manifest.projection_digest, lease_active: true,
  };
  const importer = new ControlledEvidenceImporter({
    repoRoot: fixture.repoRoot,
    grant: { write_files: ["allowed.txt"], write_prefixes: [] },
    authorityProvider: () => authority,
  });
  assert.throws(() => importer.apply({ bundle_digest: bundle.bundle_digest, operations: [] }), /validated plan/i);
  const plan = importer.plan(bundle);
  const result = importer.apply(plan);
  assert.equal(result.imported, true);
  assert.equal(fs.readFileSync(path.join(fixture.repoRoot, "allowed.txt"), "utf8"), "updated\n");
  assert.throws(() => importer.apply(plan), /unused.*validated plan/i);
});

test("ISO-IMPORT-02 stale fence and cross-worker bundle are rejected", (t) => {
  const fixture = makeProjectionFixture();
  t.after(() => remove(fixture.repoRoot, fixture.destination));
  const runId = crypto.randomUUID();
  const leaseId = crypto.randomUUID();
  const projector = new GitWorkspaceProjector();
  const manifest = projector.project({ ...fixture, taskKey: "task-alpha", runId, profile: "implementation" });
  fs.writeFileSync(path.join(fixture.destination, "allowed.txt"), "updated\n");
  const bundle = buildUntrustedResultBundle({ manifest, workspace: fixture.destination, leaseId, fencingToken: 2 });
  const baseAuthority = {
    task_key: "task-alpha", run_id: runId, lease_id: leaseId, fencing_token: 3,
    base_sha: fixture.baseSha, projection_digest: manifest.projection_digest, lease_active: true,
  };
  const importer = new ControlledEvidenceImporter({
    repoRoot: fixture.repoRoot,
    grant: { write_files: ["allowed.txt"], write_prefixes: [] },
    authorityProvider: () => baseAuthority,
  });
  assert.throws(() => importer.plan(bundle), /stale|cross-worker/i);
  assert.throws(() => importer.plan({ ...bundle, run_id: crypto.randomUUID() }), /digest|stale|cross-worker/i);
});

test("ISO-IMPORT-03 malformed, out-of-scope, and secret-bearing bundles are rejected", (t) => {
  const fixture = makeProjectionFixture();
  t.after(() => remove(fixture.repoRoot, fixture.destination));
  const runId = crypto.randomUUID();
  const leaseId = crypto.randomUUID();
  const projector = new GitWorkspaceProjector();
  const manifest = projector.project({ ...fixture, taskKey: "task-alpha", runId, profile: "implementation" });
  write(fixture.destination, "forbidden.txt", "not allowed\n");
  const bundle = buildUntrustedResultBundle({ manifest, workspace: fixture.destination, leaseId, fencingToken: 1 });
  const authority = {
    task_key: "task-alpha", run_id: runId, lease_id: leaseId, fencing_token: 1,
    base_sha: fixture.baseSha, projection_digest: manifest.projection_digest, lease_active: true,
  };
  const importer = new ControlledEvidenceImporter({
    repoRoot: fixture.repoRoot,
    grant: { write_files: ["allowed.txt"], write_prefixes: [] },
    authorityProvider: () => authority,
  });
  assert.throws(() => importer.plan(bundle), /outside authorization/i);
  assert.throws(() => importer.plan({ ...bundle, unexpected: true }), /unrecognized|invalid/i);
  write(fixture.destination, ".env.secret", "not-a-real-secret\n");
  assert.throws(() => buildUntrustedResultBundle({ manifest, workspace: fixture.destination, leaseId, fencingToken: 1 }), /excluded file/i);
});

test("ISO-RUNNER-01 production runner plans only the OCI boundary and refuses activation", async () => {
  const taskKey = "task-alpha";
  const runId = crypto.randomUUID();
  const contract = { task_key: taskKey };
  const grant = { task_key: taskKey, authorization_id: crypto.randomUUID(), authorization_revision: 1, contract_digest: "a".repeat(64) };
  const capability = {
    task_key: taskKey, run_id: runId, authorization_id: grant.authorization_id,
    authorization_revision: 1, contract_digest: grant.contract_digest,
    model: "gpt-5.6-sol", sandbox: "workspace-write",
  };
  const runner = new OciCellWorkerRunner();
  const plan = runner.plan({ contract, grant, capability, prompt: "bounded work" });
  assert.equal(plan.authoritative_worktree_mounted, false);
  assert.equal(plan.controller_authority_mounted, false);
  assert.equal(plan.provider_credential_exposed_to_worker, false);
  assert.equal(plan.launcher.windows_command, "wsl.exe");
  assert.deepEqual(plan.launcher.windows_args.slice(-plan.launcher.container_args.length), plan.launcher.container_args);
  assert.equal(plan.launcher.windows_args.filter((item) => item === "codex").length, 0);
  await assert.rejects(() => runner.run({ contract, grant, capability, prompt: "bounded work" }), /activation is not authorized/i);
});

test("ISO-RUNNER-02 production controller contains no direct worker spawn", () => {
  const controller = fs.readFileSync(path.join(sourceRoot, "workflow/controller.mjs"), "utf8");
  const facade = fs.readFileSync(path.join(sourceRoot, "workflow/codex-exec.mjs"), "utf8");
  assert.equal(/\bspawn\b/.test(controller), false);
  assert.equal(/runCodexExecInternal/.test(controller), false);
  assert.equal(/from\s+["']node:child_process["']/.test(facade), false);
  assert.equal(/runCodexExecInternal/.test(facade), false);
  assert.ok(facade.includes("createProductionWorkerRunner"));
});

test("ISO-MACHINE-01 unexecuted OS enforcement probes are PENDING_MACHINE_AUTHORIZATION, never fabricated PASS", () => {
  const status = machineIsolationStatus();
  assert.equal(status.status, "PENDING_MACHINE_AUTHORIZATION");
  assert.equal(status.passed, 0);
  assert.ok(status.pending >= 15);
  assert.ok(status.probes.every((probe) => probe.outcome === "PENDING_MACHINE_AUTHORIZATION"));
});

test("ISO-POLICY-02 a broadened policy fails strict validation", () => {
  const broadened = structuredClone(policy);
  broadened.oci.network = "host";
  assert.throws(() => validateWorkerSecurityPolicy(broadened));
  const fallback = structuredClone(policy);
  fallback.codex.automatic_fallback = true;
  assert.throws(() => validateWorkerSecurityPolicy(fallback));
});
