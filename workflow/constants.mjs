export const SCHEMA_VERSION = "1.0.0";
export const POLICY_REVISION = "autonomous-policy-v1";
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
  "DRAFT",
  "READY",
  "IN_PROGRESS",
  "REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "MERGED",
  "BLOCKED",
  "ON_HOLD",
]);

export const PHASES = Object.freeze([
  "INTAKE",
  "QUEUED",
  "IMPLEMENT",
  "VALIDATE",
  "INDEPENDENT_REVIEW",
  "CORRECT",
  "CLOSEOUT",
  "PR_READY",
  "WAITING_FOR_MERGE",
  "COMPLETE",
]);

export const DEFAULT_LIMITS = Object.freeze({
  max_workers: 2,
  max_correction_cycles: 3,
  timeout_seconds: 3600,
  lease_seconds: 900,
});

export const ACTIVATION_ENV = "THREETHAI_AUTONOMOUS_ACTIVATION";
export const ACTIVATION_VALUE = "EXPLICITLY_AUTHORIZED";

export function stateKey(status, phase) {
  return `${status}/${phase}`;
}
