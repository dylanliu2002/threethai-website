import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { z } = require("zod");
const directory = path.dirname(fileURLToPath(import.meta.url));
export const WORKER_POLICY_PATH = path.join(directory, "worker-security-policy.json");

const stringArray = z.array(z.string().min(1));
const PolicySchema = z.object({
  schema_version: z.literal("1.0.0"),
  architecture: z.literal("WIN-OCI-CELL-01"),
  activation: z.literal("DISABLED"),
  machine_enforcement: z.literal("PENDING_MACHINE_AUTHORIZATION"),
  controller: z.object({
    service_identity: z.string().min(1), non_admin: z.literal(true),
    signer_reference: z.string().startsWith("cng://"),
    secret_store_reference: z.string().startsWith("windows-credential-manager://"),
    worker_receives_signer: z.literal(false), worker_receives_secret_store: z.literal(false),
  }).strict(),
  wsl: z.object({
    distribution: z.string().min(1), dedicated: z.literal(true),
    automount_enabled: z.literal(false), interop_enabled: z.literal(false),
    append_windows_path: z.literal(false), workspace_root: z.string().startsWith("/"),
    windows_drive_mounts_forbidden: z.literal(true),
  }).strict(),
  codex: z.object({
    package: z.literal("@openai/codex"), cli_version: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-z]+\.\d+)?$/),
    provider_id: z.literal("openai"), provider: z.literal("OpenAI"),
    model: z.literal("gpt-5.6-sol"), reasoning_effort: z.literal("high"),
    approval_policy: z.literal("never"), web_search: z.literal("disabled"),
    automatic_fallback: z.literal(false), worker_cwd: z.literal("/workspace"),
    codex_home: z.literal("/run/codex-home"),
    profiles: z.object({ implementation: z.literal("workspace-write"), review: z.literal("read-only") }).strict(),
    disabled_capabilities: stringArray,
  }).strict(),
  environment: z.object({
    inherit: z.literal("none"), allowlist: stringArray, forbidden: stringArray,
  }).strict(),
  oci: z.object({
    runtime: z.literal("podman"), image_build_context: z.string().min(1),
    runtime_image_ref: z.string().min(1), digest_required: z.literal(true),
    uid: z.number().int().positive(), gid: z.number().int().positive(),
    read_only_root_filesystem: z.literal(true), capabilities_drop: z.tuple([z.literal("ALL")]),
    no_new_privileges: z.literal(true), network: z.literal("none"),
    pid_namespace: z.literal("private"), ipc_namespace: z.literal("private"),
    uts_namespace: z.literal("private"), user_namespace: z.literal("auto:size=65536"),
    cgroup_namespace: z.literal("private"), seccomp_profile: z.string().min(1),
    pids_limit: z.number().int().positive(), memory_bytes: z.number().int().positive(),
    cpu_quota: z.number().int().positive(), cpu_period: z.number().int().positive(),
    ephemeral: z.literal(true), runtime_socket_exposed: z.literal(false),
    host_namespace_sharing: z.literal(false),
  }).strict(),
  projection: z.object({
    source_mount_allowed: z.literal(false), git_metadata_included: z.literal(false),
    review_read_only: z.literal(true), exclude_names: stringArray,
    exclude_prefixes: stringArray, exclude_suffixes: stringArray,
    max_file_bytes: z.number().int().positive(),
    max_bundle_bytes: z.number().int().positive(),
  }).strict(),
  gateway: z.object({
    transport: z.literal("controller-owned-unix-socket"), socket_path: z.string().startsWith("/"),
    lease_path: z.string().startsWith("/"), provider_destination: z.literal("https://api.openai.com/v1/responses"),
    allowed_operations: z.tuple([z.literal("responses.create")]),
    connect_tunneling: z.literal(false), arbitrary_urls: z.literal(false),
    private_destinations: z.literal(false), max_requests: z.number().int().positive(),
    max_input_tokens: z.number().int().positive(), max_output_tokens: z.number().int().positive(),
    max_duration_seconds: z.number().int().positive(),
  }).strict(),
}).strict();

function unique(values, label) {
  if (new Set(values.map((value) => value.toLocaleLowerCase("en-US"))).size !== values.length) {
    throw new Error(`${label} contains duplicate case-equivalent values.`);
  }
}

export function validateWorkerSecurityPolicy(input) {
  const policy = PolicySchema.parse(input);
  unique(policy.environment.allowlist, "Environment allowlist");
  unique(policy.environment.forbidden, "Environment forbidden list");
  unique(policy.projection.exclude_names, "Projection excluded names");
  unique(policy.projection.exclude_prefixes, "Projection excluded prefixes");
  unique(policy.projection.exclude_suffixes, "Projection excluded suffixes");
  for (const forbidden of policy.environment.forbidden) {
    if (policy.environment.allowlist.includes(forbidden)) {
      throw new Error(`Forbidden environment variable is allowlisted: ${forbidden}`);
    }
  }
  const disabled = new Set(policy.codex.disabled_capabilities);
  for (const required of ["apps", "browser_use", "computer_use", "mcp", "plugins", "skills", "web_search"]) {
    if (!disabled.has(required)) throw new Error(`Required disabled capability is missing: ${required}`);
  }
  return Object.freeze(structuredClone(policy));
}

export function loadWorkerSecurityPolicy() {
  return validateWorkerSecurityPolicy(JSON.parse(fs.readFileSync(WORKER_POLICY_PATH, "utf8")));
}

export function assertRuntimeImagePinned(policy) {
  if (policy.oci.runtime_image_ref === "PENDING_MACHINE_AUTHORIZATION") {
    throw new Error("PENDING_MACHINE_AUTHORIZATION: a built OCI image digest is not provisioned.");
  }
  if (!/@sha256:[0-9a-f]{64}$/.test(policy.oci.runtime_image_ref)) {
    throw new Error("Worker OCI image must be pinned by sha256 digest.");
  }
  return policy.oci.runtime_image_ref;
}
