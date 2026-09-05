import path from "node:path";
import { loadWorkerSecurityPolicy } from "./policy.mjs";
import { assertWorkerEnvironment, buildWorkerEnvironment } from "./environment.mjs";

function assertId(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9-]{0,127}$/.test(value)) throw new Error(`${label} is invalid.`);
}

function posixJoin(...parts) { return path.posix.join(...parts); }

function expectedMounts(cellRoot, profile, policy) {
  const workspaceReadOnly = profile === "review";
  return [
    { type: "bind", source: posixJoin(cellRoot, "workspace"), target: "/workspace", read_only: workspaceReadOnly, purpose: "sanitized-projection" },
    { type: "bind", source: posixJoin(cellRoot, "codex-home"), target: "/run/codex-home", read_only: false, purpose: "disposable-codex-home" },
    { type: "bind", source: posixJoin(cellRoot, "requirements.toml"), target: "/etc/codex/requirements.toml", read_only: true, purpose: "managed-requirements" },
    { type: "bind", source: posixJoin(cellRoot, "gateway.sock"), target: policy.gateway.socket_path, read_only: false, purpose: "inference-gateway" },
    { type: "bind", source: posixJoin(cellRoot, "gateway-lease.json"), target: policy.gateway.lease_path, read_only: true, purpose: "gateway-lease" },
    { type: "bind", source: posixJoin(cellRoot, "controller-input"), target: "/run/controller-input", read_only: true, purpose: "controller-input" },
    { type: "bind", source: posixJoin(cellRoot, "worker-output"), target: "/run/worker-output", read_only: false, purpose: "untrusted-worker-output" },
    { type: "tmpfs", source: null, target: "/tmp", read_only: false, purpose: "disposable-temp" },
  ];
}

function exactEnvironment(actual, expected) {
  const actualEntries = Object.entries(actual);
  const expectedEntries = Object.entries(expected);
  return actualEntries.length === expectedEntries.length
    && expectedEntries.every(([key, value]) => actual[key] === value);
}

export function buildOciRunSpec({ taskKey, runId, profile, policy = loadWorkerSecurityPolicy() }) {
  assertId(taskKey, "Task key");
  assertId(runId, "Run ID");
  if (!Object.hasOwn(policy.codex.profiles, profile)) throw new Error("Unknown worker profile.");
  const cellRoot = posixJoin(policy.wsl.workspace_root, taskKey, runId);
  const environment = buildWorkerEnvironment({ taskKey, runId, policy });
  return Object.freeze({
    architecture: policy.architecture,
    task_key: taskKey,
    run_id: runId,
    cell_root: cellRoot,
    runtime: policy.oci.runtime,
    image: policy.oci.runtime_image_ref,
    remove: true,
    user: `${policy.oci.uid}:${policy.oci.gid}`,
    workdir: policy.codex.worker_cwd,
    read_only_root_filesystem: true,
    capabilities_drop: ["ALL"],
    no_new_privileges: true,
    network: "none",
    namespaces: Object.freeze({
      pid: "private", ipc: "private", uts: "private",
      user: policy.oci.user_namespace, cgroup: "private",
    }),
    default_environment_unset: true,
    http_proxy_passthrough: false,
    image_pull_policy: "never",
    resources: Object.freeze({
      pids_limit: policy.oci.pids_limit,
      memory_bytes: policy.oci.memory_bytes,
      cpu_quota: policy.oci.cpu_quota,
      cpu_period: policy.oci.cpu_period,
    }),
    seccomp_profile: policy.oci.seccomp_profile,
    mounts: Object.freeze(expectedMounts(cellRoot, profile, policy)),
    environment,
    host_namespace_sharing: false,
    runtime_socket_exposed: false,
    windows_worktree_mounted: false,
    controller_state_mounted: false,
    profile,
  });
}

function unsafeHostPath(value) {
  return typeof value === "string" && (
    /^[A-Za-z]:[\\/]/.test(value)
    || value.startsWith("//")
    || value.startsWith("/mnt/")
    || /(?:docker|podman)\.sock$/i.test(value)
    || value.includes(".threethai-controller")
  );
}

export function assertOciRunSpec(spec, policy = loadWorkerSecurityPolicy()) {
  if (spec.architecture !== "WIN-OCI-CELL-01" || spec.runtime !== "podman") throw new Error("Wrong worker architecture/runtime.");
  assertId(spec.task_key, "Task key");
  assertId(spec.run_id, "Run ID");
  if (!Object.hasOwn(policy.codex.profiles, spec.profile)) throw new Error("Unknown worker profile.");
  const cellRoot = posixJoin(policy.wsl.workspace_root, spec.task_key, spec.run_id);
  if (spec.cell_root !== cellRoot) throw new Error("Worker cell root override rejected.");
  if (spec.image !== policy.oci.runtime_image_ref) throw new Error("Worker image override rejected.");
  if (!spec.remove || !spec.read_only_root_filesystem || !spec.no_new_privileges) throw new Error("Ephemeral/read-only/no-new-privileges policy is required.");
  if (spec.user !== `${policy.oci.uid}:${policy.oci.gid}` || spec.capabilities_drop.join() !== "ALL") throw new Error("Non-root/drop-all policy is required.");
  if (spec.network !== "none" || spec.host_namespace_sharing || spec.runtime_socket_exposed) throw new Error("Direct network, host namespaces, and runtime sockets are forbidden.");
  if (spec.namespaces.pid !== "private" || spec.namespaces.ipc !== "private"
    || spec.namespaces.uts !== "private" || spec.namespaces.cgroup !== "private"
    || spec.namespaces.user !== policy.oci.user_namespace) {
    throw new Error("All worker namespaces must be isolated with the pinned modes.");
  }
  if (!spec.default_environment_unset || spec.http_proxy_passthrough
    || spec.image_pull_policy !== "never") {
    throw new Error("Container defaults, proxy inheritance, and image pulls must fail closed.");
  }
  if (spec.windows_worktree_mounted || spec.controller_state_mounted) throw new Error("Authoritative/controller mounts are forbidden.");
  if (spec.workdir !== policy.codex.worker_cwd) throw new Error("Worker cwd override rejected.");
  if (spec.seccomp_profile !== policy.oci.seccomp_profile
    || spec.resources.pids_limit !== policy.oci.pids_limit
    || spec.resources.memory_bytes !== policy.oci.memory_bytes
    || spec.resources.cpu_quota !== policy.oci.cpu_quota
    || spec.resources.cpu_period !== policy.oci.cpu_period) {
    throw new Error("Worker seccomp or resource limit override rejected.");
  }
  for (const mount of spec.mounts) {
    if (unsafeHostPath(mount.source)) throw new Error(`Forbidden worker mount source: ${mount.source}`);
    if (unsafeHostPath(mount.target)) throw new Error(`Forbidden worker mount target: ${mount.target}`);
  }
  if (JSON.stringify(spec.mounts) !== JSON.stringify(expectedMounts(cellRoot, spec.profile, policy))) {
    throw new Error("OCI mount plan differs from the exact per-run allowlist.");
  }
  assertWorkerEnvironment(spec.environment, policy);
  if (!exactEnvironment(spec.environment, buildWorkerEnvironment({ taskKey: spec.task_key, runId: spec.run_id, policy }))) {
    throw new Error("Worker environment values differ from the exact per-run allowlist.");
  }
  const workspace = spec.mounts.find((mount) => mount.target === "/workspace");
  if (!workspace || (spec.profile === "review" && !workspace.read_only)) throw new Error("Review projection must be read-only.");
  return true;
}

export function toPodmanArgs(spec, policy = loadWorkerSecurityPolicy()) {
  assertOciRunSpec(spec, policy);
  const args = [
    "run", "--rm", "--pull", "never", "--network", "none", "--read-only",
    "--unsetenv-all", "--http-proxy=false", "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges", "--security-opt", `seccomp=${spec.seccomp_profile}`,
    "--user", spec.user, "--workdir", spec.workdir,
    "--pids-limit", String(spec.resources.pids_limit),
    "--memory", String(spec.resources.memory_bytes),
    "--cpu-period", String(spec.resources.cpu_period), "--cpu-quota", String(spec.resources.cpu_quota),
    "--pid", "private", "--ipc", "private", "--uts", "private",
    "--userns", spec.namespaces.user, "--cgroupns", "private",
  ];
  for (const mount of spec.mounts) {
    if (mount.type === "tmpfs") args.push("--tmpfs", `${mount.target}:rw,noexec,nosuid,nodev,size=256m`);
    else args.push("--mount", `type=bind,src=${mount.source},dst=${mount.target},${mount.read_only ? "ro" : "rw"}`);
  }
  for (const [key, value] of Object.entries(spec.environment)) args.push("--env", `${key}=${value}`);
  args.push(spec.image);
  return args;
}
