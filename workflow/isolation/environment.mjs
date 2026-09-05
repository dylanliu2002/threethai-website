import { loadWorkerSecurityPolicy } from "./policy.mjs";

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value)) {
    throw new Error(`${label} is invalid.`);
  }
}

export function buildWorkerEnvironment({ taskKey, runId, policy = loadWorkerSecurityPolicy() }) {
  assertIdentifier(taskKey, "Task key");
  assertIdentifier(runId, "Run ID");
  const environment = Object.create(null);
  Object.assign(environment, {
    CODEX_HOME: policy.codex.codex_home,
    HOME: "/home/codex",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    PATH: "/usr/local/bin:/usr/bin:/bin",
    TMPDIR: "/tmp",
    THREETHAI_GATEWAY_LEASE_PATH: policy.gateway.lease_path,
    THREETHAI_GATEWAY_SOCKET: policy.gateway.socket_path,
    THREETHAI_RUN_ID: runId,
    THREETHAI_TASK_KEY: taskKey,
  });
  const keys = Object.keys(environment);
  if (keys.some((key) => !policy.environment.allowlist.includes(key))) {
    throw new Error("Worker environment includes a value outside the explicit allowlist.");
  }
  if (policy.environment.forbidden.some((key) => Object.hasOwn(environment, key))) {
    throw new Error("Worker environment includes a forbidden controller credential.");
  }
  return Object.freeze(environment);
}

export function assertWorkerEnvironment(environment, policy = loadWorkerSecurityPolicy()) {
  if (!environment || Object.getPrototypeOf(environment) !== null) {
    throw new Error("Worker environment must be constructed from an empty map.");
  }
  for (const key of Object.keys(environment)) {
    if (!policy.environment.allowlist.includes(key)) throw new Error(`Worker environment key is not allowed: ${key}`);
  }
  for (const key of policy.environment.forbidden) {
    if (Object.hasOwn(environment, key)) throw new Error(`Forbidden worker environment key: ${key}`);
  }
  return true;
}
