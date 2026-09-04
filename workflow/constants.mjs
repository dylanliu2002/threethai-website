export const SCHEMA_VERSION = "2.0.0";
export const GRANT_SCHEMA_VERSION = "1.0.0";
export const POLICY_REVISION = "autonomous-policy-v2";
export const MODEL_ROUTING_REVISION = "model-routing-v1";

export const ROLES = Object.freeze([
  "ORCHESTRATOR",
  "TECHNICAL_SEO",
  "SEO_CONTENT",
  "GEO_AI_SEARCH",
  "CRO",
  "BRAND_UX",
  "QA_PERFORMANCE",
  "BACKLINK",
]);

export const EXECUTION_PROFILES = Object.freeze([
  "HIGH_RISK_CODE",
  "STRATEGIC_REASONING",
  "RESEARCH",
  "BULK_EXTRACTION",
]);

export const STATUSES = Object.freeze([
  "DRAFT", "READY", "IN_PROGRESS", "REVIEW", "CHANGES_REQUESTED",
  "APPROVED", "MERGED", "BLOCKED", "ON_HOLD",
]);

export const PHASES = Object.freeze([
  "INTAKE", "QUEUED", "IMPLEMENT", "VALIDATE", "INDEPENDENT_REVIEW",
  "CORRECT", "CLOSEOUT", "PR_READY", "WAITING_FOR_MERGE", "COMPLETE",
]);

export const CAPABILITY_ACTIONS = Object.freeze([
  "dispatch", "validate", "review", "approve", "correct", "closeout",
  "commit", "push", "pr",
]);

export const SANDBOXES = Object.freeze(["read-only", "workspace-write"]);

export const DEFAULT_LIMITS = Object.freeze({
  max_workers: 2,
  max_correction_cycles: 3,
  timeout_seconds: 3600,
  lease_seconds: 900,
});

// Environment is an emergency kill switch only. It is never positive authority.
export const KILL_SWITCH_ENV = "THREETHAI_AUTONOMOUS_KILL";
export const KILL_SWITCH_VALUE = "1";

export function stateKey(status, phase) {
  return `${status}/${phase}`;
}
