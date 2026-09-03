import { createRequire } from "node:module";
import { normalizeRepoPath } from "./paths.mjs";
import {
  EXECUTION_PROFILES,
  PHASES,
  ROLES,
  SCHEMA_VERSION,
  STATUSES,
} from "./constants.mjs";

const require = createRequire(import.meta.url);
const { z } = require("zod");

const sha = z.string().regex(/^[0-9a-f]{40}$/);
const digest = z.string().regex(/^[0-9a-f]{64}$/);
const taskKey = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const role = z.enum(ROLES);
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
    if (normalizeRepoPath(value, { prefix: true }) !== value) {
      throw new Error("not canonical");
    }
  } catch (error) {
    ctx.addIssue({ code: "custom", message: error.message });
  }
});

export const PermissionsSchema = z.object({
  repository_write: z.boolean(),
  git_commit: z.boolean(),
  branch_push: z.boolean(),
  worker_dispatch: z.boolean(),
  automation_activation: z.boolean(),
  github_write: z.boolean(),
  pr_create: z.boolean(),
  merge: z.boolean(),
  production: z.boolean(),
  dns: z.boolean(),
  secret_write: z.boolean(),
  external_action: z.boolean(),
  task_adoption: z.boolean(),
}).strict();

export const TaskContractSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  task_key: taskKey,
  task_id: z.string().min(1),
  card_path: repoPath,
  card_blob_sha: sha,
  contract_revision: z.number().int().positive(),
  status,
  phase,
  mode: z.enum(["AUDIT", "IMPLEMENT", "REVIEW"]),
  owner_role: role,
  reviewer_role: role,
  execution_profile: z.enum(EXECUTION_PROFILES),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  origin: z.object({
    kind: z.enum(["USER_AUTHORIZED", "LEGACY_HERMES", "MIGRATED"]),
    authorized_by: z.string().min(1),
    authorized_at: z.string().min(1),
    source: z.string().min(1),
    base_sha: sha,
  }).strict(),
  dependencies: z.array(taskKey),
  branch: z.string().regex(/^codex\/[a-z0-9-]+$/),
  worktree: repoPath,
  write_files: z.array(repoPath),
  write_prefixes: z.array(repoPrefix),
  administrative_files: z.array(repoPath),
  shared_file_grants: z.array(z.object({
    path: repoPath,
    purpose: z.string().min(1),
  }).strict()),
  validation_profile: z.object({
    name: z.string().min(1),
    commands: z.array(z.string().min(1)).min(1),
  }).strict(),
  permissions: PermissionsSchema,
  routing: z.object({
    policy_revision: z.literal("model-routing-v1"),
    executor_platform: z.literal("Codex"),
    provider: z.literal("OpenAI"),
    model_family: z.literal("GPT-5.6"),
    requested_model: z.enum(["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]),
    reasoning_effort: z.enum(["low", "medium", "high", "xhigh", "max"]),
    fallback: z.literal("BLOCKED"),
  }).strict(),
  limits: z.object({
    max_workers: z.number().int().min(1).max(32),
    max_correction_cycles: z.number().int().min(0).max(20),
    timeout_seconds: z.number().int().min(1),
    lease_seconds: z.number().int().min(1),
  }).strict(),
  authorization: z.object({
    decision: z.literal("AUTHORIZED"),
    recorded_before_implementation: z.literal(true),
    scope_digest: digest,
    activation_authorized: z.boolean(),
  }).strict(),
  provenance: z.object({
    proposal_names: z.array(z.string()),
    historical_task_ids: z.array(z.string()),
    preserve_executor_metadata: z.boolean(),
    automatic_existing_task_adoption: z.boolean(),
  }).strict(),
}).strict();

export const RunIdentitySchema = z.object({
  task_key: taskKey,
  role_id: role,
  worker_id: z.string().uuid(),
  thread_id: z.string().min(1),
  run_id: z.string().uuid(),
  attempt: z.number().int().positive(),
  executor_platform: z.string().min(1),
  provider: z.string().min(1),
  requested_model: z.string().min(1),
  reported_model: z.string().min(1).nullable(),
  reasoning_effort: z.string().min(1),
  configuration_digest: digest,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
}).strict();

export const WorkerResultSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  task_key: taskKey,
  run_id: z.string().uuid(),
  role_id: role,
  outcome: z.enum(["COMPLETED", "CHANGES_REQUESTED", "APPROVED", "BLOCKED", "FAILED"]),
  phase,
  base_sha: sha,
  head_sha: sha.nullable(),
  summary: z.string().min(1),
  changed_files: z.array(repoPath),
  validation: z.array(z.object({
    name: z.string().min(1),
    outcome: z.enum(["PASS", "FAIL", "NOT_AVAILABLE"]),
    evidence: z.string().min(1),
  }).strict()),
  findings: z.array(z.object({
    severity: z.enum(["BLOCKER", "MAJOR", "MINOR"]),
    message: z.string().min(1),
  }).strict()),
  requested_actions: z.array(z.string()),
}).strict();

export const ReviewRecordSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  task_key: taskKey,
  contract_revision: z.number().int().positive(),
  policy_revision: z.string().min(1),
  owner_role: role,
  reviewer_role: role,
  implementation_run_id: z.string().uuid(),
  reviewer_run_id: z.string().uuid(),
  implementation_thread_id: z.string().min(1),
  reviewer_thread_id: z.string().min(1),
  reviewed_base_sha: sha,
  reviewed_head_sha: sha,
  implementation_contributors: z.array(z.string().uuid()),
  reviewer_worker_id: z.string().uuid(),
  validation_digest: digest,
  outcome: z.enum(["APPROVED", "CHANGES_REQUESTED", "BLOCKED"]),
}).strict();

export const RuntimeEventSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  sequence: z.number().int().nonnegative(),
  event_id: z.string().uuid(),
  task_key: taskKey,
  run_id: z.string().uuid().nullable(),
  type: z.string().min(1),
  occurred_at: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
}).strict();

export const WorkerOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "task_key", "run_id", "role_id", "outcome", "phase",
    "base_sha", "head_sha", "summary", "changed_files", "validation",
    "findings", "requested_actions",
  ],
  properties: {
    schema_version: { const: SCHEMA_VERSION },
    task_key: { type: "string" },
    run_id: { type: "string", format: "uuid" },
    role_id: { enum: ROLES },
    outcome: { enum: ["COMPLETED", "CHANGES_REQUESTED", "APPROVED", "BLOCKED", "FAILED"] },
    phase: { enum: PHASES },
    base_sha: { type: "string", pattern: "^[0-9a-f]{40}$" },
    head_sha: { type: ["string", "null"], pattern: "^[0-9a-f]{40}$" },
    summary: { type: "string" },
    changed_files: { type: "array", items: { type: "string" } },
    validation: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "outcome", "evidence"],
        properties: {
          name: { type: "string" },
          outcome: { enum: ["PASS", "FAIL", "NOT_AVAILABLE"] },
          evidence: { type: "string" },
        },
      },
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "message"],
        properties: {
          severity: { enum: ["BLOCKER", "MAJOR", "MINOR"] },
          message: { type: "string" },
        },
      },
    },
    requested_actions: { type: "array", items: { type: "string" } },
  },
};
