import { createRequire } from "node:module";
import { normalizeRepoPath } from "./paths.mjs";
import {
  CAPABILITY_ACTIONS,
  EXECUTION_PROFILES,
  GRANT_SCHEMA_VERSION,
  PHASES,
  ROLES,
  SANDBOXES,
  SCHEMA_VERSION,
  STATUSES,
  SYNTHETIC_PILOT_OUTPUT_PATH,
  SYNTHETIC_PILOT_TASK_KEY,
} from "./constants.mjs";

const require = createRequire(import.meta.url);
const { z } = require("zod");

export const ShaSchema = z.string().regex(/^[0-9a-f]{40}$/);
export const DigestSchema = z.string().regex(/^[0-9a-f]{64}$/);
export const SignatureSchema = z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/).min(80);
export const TaskKeySchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const RoleSchema = z.enum(ROLES);
const status = z.enum(STATUSES);
const phase = z.enum(PHASES);
const repoPath = z.string().superRefine((value, ctx) => {
  try {
    if (normalizeRepoPath(value) !== value) throw new Error("not canonical");
  } catch (error) {
    ctx.addIssue({ code: "custom", message: error.message });
  }
});
const repoPrefix = z.string().superRefine((value, ctx) => {
  try {
    if (normalizeRepoPath(value, { prefix: true }) !== value) throw new Error("not canonical");
  } catch (error) {
    ctx.addIssue({ code: "custom", message: error.message });
  }
});

export const PermissionsSchema = z.object({
  repository_write: z.boolean(), git_commit: z.boolean(), branch_push: z.boolean(),
  worker_dispatch: z.boolean(), automation_activation: z.boolean(),
  github_write: z.boolean(), pr_create: z.boolean(), merge: z.boolean(),
  production: z.boolean(), dns: z.boolean(), secret_write: z.boolean(),
  external_action: z.boolean(), task_adoption: z.boolean(),
}).strict();

export const RoutingSchema = z.object({
  policy_revision: z.literal("model-routing-v1"),
  executor_platform: z.literal("Codex"), provider: z.literal("OpenAI"),
  model_family: z.literal("GPT-5.6"),
  requested_model: z.enum(["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]),
  reasoning_effort: z.enum(["low", "medium", "high", "xhigh", "max"]),
  fallback: z.literal("BLOCKED"),
}).strict();

export const ValidationProfileSchema = z.object({
  name: z.string().min(1), commands: z.array(z.string().min(1)).min(1),
}).strict();
export const SharedFileGrantSchema = z.object({
  path: repoPath, purpose: z.string().min(1),
}).strict();
export const LimitsSchema = z.object({
  max_workers: z.number().int().min(1).max(32),
  max_correction_cycles: z.number().int().min(0).max(20),
  timeout_seconds: z.number().int().min(1),
  lease_seconds: z.number().int().min(1),
}).strict();

export const SyntheticPilotConstraintsSchema = z.object({
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
  write_files: z.tuple([z.literal(SYNTHETIC_PILOT_OUTPUT_PATH)]),
  write_prefixes: z.tuple([]),
  network: z.literal(true),
  network_proxy: z.object({
    enabled: z.literal(true),
    enforced: z.literal(true),
    allowed_domains: z.tuple([z.literal("chatgpt.com")]),
    unrestricted_direct_egress: z.literal(false),
    local_private_network: z.literal(false),
    allow_local_binding: z.literal(false),
    allow_upstream_proxy: z.literal(false),
    enable_socks5: z.literal(false),
    enable_socks5_udp: z.literal(false),
    credential_broker: z.literal(false),
    dangerously_allow_non_loopback_proxy: z.literal(false),
    dangerously_allow_all_unix_sockets: z.literal(false),
    unix_sockets: z.tuple([]),
  }).strict(),
  secrets: z.literal(false),
  git_commit: z.literal(false),
  push: z.literal(false),
  pr: z.literal(false),
  merge: z.literal(false),
  production: z.literal(false),
  dns: z.literal(false),
  deployment: z.literal(false),
  task_adoption: z.literal(false),
  max_workers: z.literal(1),
  timeout_seconds: z.number().int().positive(),
}).strict();

export const SyntheticPilotActivationRequestSchema = z.object({
  human_authorization_id: z.string().uuid(),
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
  max_workers: z.literal(1),
  publishing: z.literal(false),
  network: z.literal(true),
  production: z.literal(false),
  dns: z.literal(false),
  deployment: z.literal(false),
}).strict();

export const SyntheticPilotGrantActivationSchema = z.object({
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
  contract_digest: DigestSchema,
  card_blob_sha: ShaSchema,
  max_dispatch_attempts: z.literal(1),
  max_workers: z.literal(1),
  publishing: z.literal(false),
  network: z.literal(true),
  production: z.literal(false),
  dns: z.literal(false),
  deployment: z.literal(false),
}).strict();

export const SyntheticPilotGrantRotationRequestSchema = z.object({
  human_authorization_id: z.string().uuid(),
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
}).strict();

export const SyntheticPilotActivationRetirementRequestSchema = z.object({
  human_authorization_id: z.string().uuid(),
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
}).strict();

// Administration-only compatibility schemas for authenticating the original
// offline synthetic-pilot Grant during retirement. These are deliberately not
// accepted by TaskContractSchema or AuthorizationGrantSchema, so a historical
// Grant can be archived but can never regain runtime authority.
const HistoricalSyntheticPilotConstraintsSchema = z.object({
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
  write_files: z.tuple([z.literal(SYNTHETIC_PILOT_OUTPUT_PATH)]),
  write_prefixes: z.tuple([]),
  network: z.literal(false),
  secrets: z.literal(false),
  git_commit: z.literal(false),
  push: z.literal(false),
  pr: z.literal(false),
  merge: z.literal(false),
  production: z.literal(false),
  dns: z.literal(false),
  deployment: z.literal(false),
  task_adoption: z.literal(false),
  max_workers: z.literal(1),
  timeout_seconds: z.number().int().positive(),
}).strict();

const HistoricalSyntheticPilotGrantActivationSchema = z.object({
  task_key: z.literal(SYNTHETIC_PILOT_TASK_KEY),
  contract_digest: DigestSchema,
  card_blob_sha: ShaSchema,
  max_dispatch_attempts: z.literal(1),
  max_workers: z.literal(1),
  publishing: z.literal(false),
  network: z.literal(false),
  production: z.literal(false),
  dns: z.literal(false),
  deployment: z.literal(false),
}).strict();

export const TaskContractSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  task_key: TaskKeySchema, task_id: z.string().min(1), card_path: repoPath,
  card_blob_sha: ShaSchema, contract_revision: z.number().int().positive(),
  status, phase, mode: z.enum(["AUDIT", "IMPLEMENT", "REVIEW", "CORRECTIVE"]),
  owner_role: RoleSchema, reviewer_role: RoleSchema,
  execution_profile: z.enum(EXECUTION_PROFILES),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]), priority: z.enum(["P0", "P1", "P2", "P3"]),
  request_provenance: z.object({
    kind: z.enum(["USER_REQUESTED", "LEGACY_HERMES", "MIGRATED"]),
    requested_by: z.string().min(1), requested_at: z.string().min(1),
    source: z.string().min(1), base_sha: ShaSchema,
  }).strict(),
  dependencies: z.array(TaskKeySchema),
  branch: z.string().regex(/^codex\/[a-z0-9-]+$/), worktree: repoPath,
  write_files: z.array(repoPath), write_prefixes: z.array(repoPrefix),
  administrative_files: z.array(repoPath),
  shared_file_grants: z.array(SharedFileGrantSchema),
  validation_profile: ValidationProfileSchema,
  requested_permissions: PermissionsSchema,
  requested_routing: RoutingSchema,
  limits: LimitsSchema,
  synthetic_pilot: SyntheticPilotConstraintsSchema.optional(),
  provenance: z.object({
    proposal_names: z.array(z.string()), historical_task_ids: z.array(z.string()),
    preserve_executor_metadata: z.boolean(), automatic_existing_task_adoption: z.boolean(),
  }).strict(),
}).strict();

export const AuthorizationGrantSchema = z.object({
  grant_schema_version: z.literal(GRANT_SCHEMA_VERSION),
  authorization_id: z.string().uuid(), authorization_revision: z.number().int().positive(),
  task_key: TaskKeySchema, contract_revision: z.number().int().positive(),
  contract_digest: DigestSchema, card_blob_sha: ShaSchema,
  owner_role: RoleSchema, reviewer_role: RoleSchema,
  mode: z.enum(["AUDIT", "IMPLEMENT", "REVIEW", "CORRECTIVE"]),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]), dependencies: z.array(TaskKeySchema),
  branch: z.string().regex(/^codex\/[a-z0-9-]+$/), worktree: repoPath,
  worktree_realpath: z.string().min(1),
  write_files: z.array(repoPath), write_prefixes: z.array(repoPrefix),
  administrative_files: z.array(repoPath), shared_file_grants: z.array(SharedFileGrantSchema),
  validation_profile: ValidationProfileSchema, permissions: PermissionsSchema,
  routing: RoutingSchema, limits: LimitsSchema,
  synthetic_pilot: SyntheticPilotConstraintsSchema.optional(),
  activation: z.object({
    autonomous: z.boolean(),
    worker_dispatch: z.boolean(),
    synthetic_pilot_once: SyntheticPilotGrantActivationSchema.optional(),
  }).strict(),
  publishing: z.object({
    commit: z.boolean(), push: z.boolean(), pr: z.boolean(), merge: z.literal(false),
    force: z.literal(false), allowed_branch: z.string().regex(/^codex\/[a-z0-9-]+$/),
    approval_required_actions: z.array(z.enum(["commit", "push", "pr"])),
  }).strict(),
  review_target: z.object({
    implementation_run_id: z.string().uuid(), implementation_worker_id: z.string().uuid(),
    implementation_thread_id: z.string().min(1), reviewed_base_sha: ShaSchema,
    reviewed_head_sha: ShaSchema, validation_digest: DigestSchema,
    implementation_evidence_digest: DigestSchema,
  }).strict().nullable(),
  provenance: z.object({
    authorized_by: z.string().min(1), source: z.string().min(1),
    issued_at: z.string().datetime(), expires_at: z.string().datetime().nullable(),
    non_expiring_policy: z.enum(["NONE", "UNTIL_REVOKED_BY_USER"]),
  }).strict(),
  envelope_digest: DigestSchema,
  signer_fingerprint: DigestSchema,
  signature: SignatureSchema,
}).strict();

export const RetirableSyntheticPilotGrantSchema = AuthorizationGrantSchema.extend({
  synthetic_pilot: z.union([
    SyntheticPilotConstraintsSchema,
    HistoricalSyntheticPilotConstraintsSchema,
  ]),
  activation: z.object({
    autonomous: z.boolean(),
    worker_dispatch: z.boolean(),
    synthetic_pilot_once: z.union([
      SyntheticPilotGrantActivationSchema,
      HistoricalSyntheticPilotGrantActivationSchema,
    ]),
  }).strict(),
}).strict();

export const RunIdentitySchema = z.object({
  task_key: TaskKeySchema, role_id: RoleSchema, worker_id: z.string().uuid(),
  thread_id: z.string().min(1), run_id: z.string().uuid(), attempt: z.number().int().positive(),
  executor_platform: z.string().min(1), provider: z.string().min(1),
  requested_model: z.string().min(1), reported_model: z.string().min(1).nullable(),
  reasoning_effort: z.string().min(1), configuration_digest: DigestSchema,
  contract_digest: DigestSchema, authorization_revision: z.number().int().positive(),
  lease_id: z.string().uuid(), fencing_token: z.number().int().positive(),
  base_sha: ShaSchema, started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  status: z.enum([
    "RESERVED", "RUNNING", "PROCESS_COMPLETED", "SUCCESS", "FAILED",
    "INVALID_OUTPUT", "SCOPE_VIOLATION", "VALIDATION_FAILED", "STALE",
  ]),
}).strict();

export const WorkerDiagnosticsSchema = z.object({
  diagnostics_version: z.literal("1.0.0"),
  worker_exit_code: z.number().int().nullable(),
  close_signal: z.string().min(1).max(64).nullable(),
  termination_reason: z.enum([
    "TIMEOUT", "CANCELLED", "SIGNAL", "NONZERO_EXIT",
    "MISSING_STRUCTURED_OUTPUT", "INVALID_STRUCTURED_OUTPUT",
    "VALIDATION_FAILED", "UNKNOWN",
  ]),
  thread_id: z.string().min(1).max(256).nullable(),
  thread_lifecycle_status: z.enum(["STARTED", "COMPLETED", "FAILED", "UNKNOWN"]),
  model_stage_status: z.enum(["STARTED", "COMPLETED", "FAILED", "UNKNOWN"]),
  sanitized_stderr: z.string().max(4096),
  sanitized_error: z.string().max(4096).nullable(),
  structured_output_present: z.boolean(),
  validator_result: z.object({
    status: z.enum(["PASS", "FAIL", "UNKNOWN"]),
    evidence_digest: DigestSchema.nullable(),
    commands: z.array(z.object({
      index: z.number().int().nonnegative(),
      exit_code: z.number().int().nullable(),
      signal: z.string().min(1).max(64).nullable(),
      output_digest: DigestSchema.nullable(),
      error_digest: DigestSchema.nullable(),
    }).strict()).max(32),
  }).strict(),
}).strict();

export const ControllerCapabilitySchema = z.object({
  capability_version: z.literal("1.0.0"), capability_id: z.string().uuid(),
  authorization_id: z.string().uuid(), task_key: TaskKeySchema,
  action: z.enum(CAPABILITY_ACTIONS), run_id: z.string().uuid(),
  attempt: z.number().int().positive(), lease_id: z.string().uuid(),
  fencing_token: z.number().int().positive(), contract_digest: DigestSchema,
  authorization_revision: z.number().int().positive(),
  branch: z.string().regex(/^codex\/[a-z0-9-]+$/), worktree: repoPath,
  role: RoleSchema, model: z.string().min(1), sandbox: z.enum(SANDBOXES),
  head_sha: ShaSchema, issued_at: z.string().datetime(), expires_at: z.string().datetime(),
  reviewed_base_sha: ShaSchema.nullable(), reviewed_head_sha: ShaSchema.nullable(),
  signer_fingerprint: DigestSchema, signature: SignatureSchema,
}).strict();

export const WorkerResultSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION), task_key: TaskKeySchema,
  run_id: z.string().uuid(), role_id: RoleSchema,
  outcome: z.enum(["COMPLETED", "CHANGES_REQUESTED", "APPROVED", "BLOCKED", "FAILED"]),
  phase, base_sha: ShaSchema, head_sha: ShaSchema.nullable(), summary: z.string().min(1),
  changed_files: z.array(repoPath),
  validation: z.array(z.object({
    name: z.string().min(1), outcome: z.enum(["PASS", "FAIL", "NOT_AVAILABLE"]),
    evidence: z.string().min(1),
  }).strict()),
  findings: z.array(z.object({
    severity: z.enum(["BLOCKER", "MAJOR", "MINOR"]), message: z.string().min(1),
  }).strict()),
  requested_actions: z.array(z.string()),
}).strict();

export const ReviewRecordSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION), task_key: TaskKeySchema,
  contract_revision: z.number().int().positive(), contract_digest: DigestSchema,
  authorization_revision: z.number().int().positive(), owner_role: RoleSchema,
  reviewer_role: RoleSchema, implementation_run_id: z.string().uuid(),
  reviewer_run_id: z.string().uuid(), reviewer_thread_id: z.string().min(1),
  reviewer_worker_id: z.string().uuid(), reviewer_attempt: z.number().int().positive(),
  reviewed_base_sha: ShaSchema,
  reviewed_head_sha: ShaSchema, validation_digest: DigestSchema,
  review_evidence: z.array(z.string().min(1)).min(1),
  review_evidence_digest: DigestSchema, review_completed_at: z.string().datetime(),
  outcome: z.enum(["APPROVED", "CHANGES_REQUESTED", "BLOCKED"]),
}).strict();

export const ApprovalRecordSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION), task_key: TaskKeySchema,
  reviewed_base_sha: ShaSchema, reviewed_head_sha: ShaSchema,
  contract_digest: DigestSchema, contract_revision: z.number().int().positive(),
  authorization_revision: z.number().int().positive(), reviewer_run_id: z.string().uuid(),
  reviewer_worker_id: z.string().uuid(), reviewer_thread_id: z.string().min(1),
  reviewer_attempt: z.number().int().positive(),
  validation_digest: DigestSchema, review_evidence_digest: DigestSchema,
  approval_revision: z.number().int().positive(), issued_at: z.string().datetime(),
}).strict();

export const RuntimeEventSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION), sequence: z.number().int().positive(),
  event_id: z.string().uuid(), task_key: TaskKeySchema.nullable(),
  run_id: z.string().uuid().nullable(), type: z.string().min(1),
  occurred_at: z.string().datetime(), payload: z.record(z.string(), z.unknown()),
}).strict();

const JSON_SCHEMA_TYPES = new Set([
  "array", "boolean", "integer", "null", "number", "object", "string",
]);
const JSON_SCHEMA_STRING_FORMATS = new Set([
  "date", "date-time", "duration", "email", "hostname", "ipv4", "ipv6", "time", "uuid",
]);
const WORKER_OUTPUT_SCHEMA_KEYWORDS = new Set([
  "additionalProperties", "const", "enum", "format", "items",
  "pattern", "properties", "required", "type",
]);

function declaredJsonSchemaTypes(type, location) {
  const types = Array.isArray(type) ? type : [type];
  if (types.length === 0 || new Set(types).size !== types.length
    || types.some((candidate) => !JSON_SCHEMA_TYPES.has(candidate))) {
    throw new Error(`${location} must declare a valid JSON Schema type.`);
  }
  return types;
}

function matchesDeclaredJsonSchemaType(value, types) {
  if (value === null) return types.includes("null");
  if (Array.isArray(value)) return types.includes("array");
  if (Number.isInteger(value) && types.includes("integer")) return true;
  if (typeof value === "number") return types.includes("number");
  return types.includes(typeof value);
}

function canonicalJsonLiteral(value, location, ancestors = new Set()) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${location} must be a valid JSON literal.`);
    return JSON.stringify(value);
  }
  if (typeof value !== "object" || ancestors.has(value)) {
    throw new Error(`${location} must be a valid JSON literal.`);
  }
  const descendants = new Set(ancestors);
  descendants.add(value);
  if (Array.isArray(value)) {
    const items = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new Error(`${location} must be a valid JSON literal.`);
      }
      items.push(canonicalJsonLiteral(value[index], `${location}[${index}]`, descendants));
    }
    return `[${items.join(",")}]`;
  }
  const prototype = Object.getPrototypeOf(value);
  const ownKeys = Reflect.ownKeys(value);
  if ((prototype !== Object.prototype && prototype !== null)
    || ownKeys.some((key) => typeof key !== "string"
      || !Object.getOwnPropertyDescriptor(value, key)?.enumerable)) {
    throw new Error(`${location} must be a valid JSON literal.`);
  }
  return `{${ownKeys.sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJsonLiteral(value[key], `${location}.${key}`, descendants)}`
  ).join(",")}}`;
}

function assertOpenAiStructuredOutputNode(schema, location, { root = false } = {}) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error(`${location} must be a JSON Schema object.`);
  }
  const unsupportedKeyword = Object.keys(schema)
    .find((keyword) => !WORKER_OUTPUT_SCHEMA_KEYWORDS.has(keyword));
  if (unsupportedKeyword) {
    throw new Error(`${location} contains unsupported JSON Schema keyword: ${unsupportedKeyword}.`);
  }
  const types = declaredJsonSchemaTypes(schema.type, location);
  if (root && (types.length !== 1 || types[0] !== "object")) {
    throw new Error("Structured output root must have type object.");
  }
  if (Object.hasOwn(schema, "const") && !matchesDeclaredJsonSchemaType(schema.const, types)) {
    throw new Error(`${location}.const does not match its declared type.`);
  }
  if (Object.hasOwn(schema, "enum")) {
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
      throw new Error(`${location}.enum must contain values matching its declared type.`);
    }
    const enumValues = new Set();
    for (let index = 0; index < schema.enum.length; index += 1) {
      const value = schema.enum[index];
      if (!matchesDeclaredJsonSchemaType(value, types)) {
        throw new Error(`${location}.enum must contain values matching its declared type.`);
      }
      const canonical = canonicalJsonLiteral(value, `${location}.enum[${index}]`);
      if (enumValues.has(canonical)) {
        throw new Error(`${location}.enum must not contain duplicate values.`);
      }
      enumValues.add(canonical);
    }
  }
  if (Object.hasOwn(schema, "pattern")
    && (!types.includes("string") || typeof schema.pattern !== "string")) {
    throw new Error(`${location}.pattern must be a string constraint on a string type.`);
  }
  if (Object.hasOwn(schema, "pattern")) {
    try {
      new RegExp(schema.pattern, "u");
    } catch {
      throw new Error(`${location}.pattern must compile as a valid regular expression.`);
    }
  }
  if (Object.hasOwn(schema, "format")
    && (!types.includes("string") || !JSON_SCHEMA_STRING_FORMATS.has(schema.format))) {
    throw new Error(`${location}.format is not supported for its declared type.`);
  }
  if (types.includes("object")) {
    if (!schema.properties || typeof schema.properties !== "object"
      || Array.isArray(schema.properties) || schema.additionalProperties !== false) {
      throw new Error(`${location} objects require properties and additionalProperties false.`);
    }
    const propertyNames = Object.keys(schema.properties);
    if (!Array.isArray(schema.required)
      || new Set(schema.required).size !== schema.required.length
      || schema.required.some((name) => typeof name !== "string")
      || schema.required.length !== propertyNames.length
      || propertyNames.some((name) => !schema.required.includes(name))) {
      throw new Error(`${location}.required must contain every property exactly once.`);
    }
    for (const [name, propertySchema] of Object.entries(schema.properties)) {
      assertOpenAiStructuredOutputNode(propertySchema, `${location}.properties.${name}`);
    }
  }
  if (types.includes("array")) {
    assertOpenAiStructuredOutputNode(schema.items, `${location}.items`);
  }
}

export function assertOpenAiStructuredOutputSchema(schema) {
  assertOpenAiStructuredOutputNode(schema, "codex_output_schema", { root: true });
  return schema;
}

export const WorkerOutputJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["schema_version", "task_key", "run_id", "role_id", "outcome", "phase",
    "base_sha", "head_sha", "summary", "changed_files", "validation", "findings", "requested_actions"],
  properties: {
    schema_version: { type: "string", const: SCHEMA_VERSION }, task_key: { type: "string" },
    run_id: { type: "string", format: "uuid" }, role_id: { type: "string", enum: ROLES },
    outcome: { type: "string", enum: ["COMPLETED", "CHANGES_REQUESTED", "APPROVED", "BLOCKED", "FAILED"] },
    phase: { type: "string", enum: PHASES }, base_sha: { type: "string", pattern: "^[0-9a-f]{40}$" },
    head_sha: { type: ["string", "null"], pattern: "^[0-9a-f]{40}$" },
    summary: { type: "string" }, changed_files: { type: "array", items: { type: "string" } },
    validation: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["name", "outcome", "evidence"], properties: { name: { type: "string" },
        outcome: { type: "string", enum: ["PASS", "FAIL", "NOT_AVAILABLE"] }, evidence: { type: "string" } } } },
    findings: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["severity", "message"], properties: { severity: { type: "string", enum: ["BLOCKER", "MAJOR", "MINOR"] },
        message: { type: "string" } } } },
    requested_actions: { type: "array", items: { type: "string" } },
  },
};
