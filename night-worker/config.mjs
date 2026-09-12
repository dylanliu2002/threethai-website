const IMPLEMENTATION_MODEL = "gpt-5.6-luna";
const IMPLEMENTATION_EFFORT = "max";
const REVIEW_MODEL = "gpt-5.6-sol";
const DEFAULT_REVIEW_EFFORT = "medium";

const ALLOWED_REVIEW_EFFORTS = Object.freeze(["low", "medium", "high", "xhigh", "max"]);
const FORBIDDEN_MODELS = Object.freeze(["gpt-5.6-terra"]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function nowValue(clock) {
  if (typeof clock === "number" || clock instanceof Date || typeof clock === "string") return clock;
  if (typeof clock === "function") return clock();
  if (clock && typeof clock.now === "function") return clock.now();
  return Date.now();
}

export function toEpochMilliseconds(value, label = "timestamp") {
  const candidate = value instanceof Date ? value.getTime() : value;
  const epoch = typeof candidate === "number" ? candidate : Date.parse(String(candidate));
  if (!Number.isFinite(epoch)) throw new Error(`${label} must be a valid timestamp.`);
  return epoch;
}

export function timestampFrom(clock, label = "clock") {
  const epoch = toEpochMilliseconds(nowValue(clock), label);
  return new Date(epoch).toISOString();
}

export function reviewEffortForDifficulty(difficulty) {
  const normalized = String(difficulty ?? "medium").trim().toLocaleLowerCase("en-US");
  const aliases = {
    simple: "low",
    low: "low",
    medium: "medium",
    normal: "medium",
    standard: "medium",
    high: "high",
    hard: "high",
    xhigh: "xhigh",
    max: "max",
    critical: "max",
  };
  const effort = aliases[normalized];
  if (!effort || !ALLOWED_REVIEW_EFFORTS.includes(effort)) {
    throw new Error(`Unsupported review difficulty/effort: ${String(difficulty)}`);
  }
  return effort;
}

export const MVP_CONFIG = deepFreeze({
  schema_version: 1,
  max_tasks_per_batch: 4,
  max_parallel_implementation_workers: 2,
  max_correction_cycles: 2,
  batch_expiry_ms: 8 * 60 * 60 * 1000,
  max_task_description_chars: 10_000,
  max_total_task_description_chars: 40_000,
  max_reply_metadata_bytes: 16_384,
  max_batch_bytes: 128 * 1024,
  claim_lease_ms: 60_000,
  service_poll_ms: 250,
  implementation: {
    model: IMPLEMENTATION_MODEL,
    effort: IMPLEMENTATION_EFFORT,
    sandbox: "workspace-write",
    read_only: false,
  },
  review: {
    model: REVIEW_MODEL,
    default_effort: DEFAULT_REVIEW_EFFORT,
    allowed_efforts: ALLOWED_REVIEW_EFFORTS,
    sandbox: "read-only",
    read_only: true,
  },
  provider: "OpenAI",
  model_provider: "openai",
  allow_provider_model_fallback: false,
  forbidden_models: FORBIDDEN_MODELS,
  capabilities: {
    branch: true,
    commit: true,
    push: true,
    pr: true,
    approved_safe_pr_merge: true,
    production: false,
    deployment: false,
    dns: false,
    secrets: false,
    protection_bypass: false,
    force_push: false,
    protected_branch_push: false,
  },
});

export const CONFIG = MVP_CONFIG;
export const NIGHT_WORKER_CONFIG = MVP_CONFIG;
export const IMPLEMENTATION_MODEL_NAME = IMPLEMENTATION_MODEL;
export const IMPLEMENTATION_REASONING_EFFORT = IMPLEMENTATION_EFFORT;
export const REVIEW_MODEL_NAME = REVIEW_MODEL;
export const REVIEW_DEFAULT_REASONING_EFFORT = DEFAULT_REVIEW_EFFORT;
export { ALLOWED_REVIEW_EFFORTS, FORBIDDEN_MODELS };

export function assertExactModel(model, label = "model") {
  if (typeof model !== "string" || model.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (FORBIDDEN_MODELS.includes(model)) throw new Error(`Forbidden model: ${model}`);
  if (model !== IMPLEMENTATION_MODEL && model !== REVIEW_MODEL) {
    throw new Error(`Unsupported exact model: ${model}`);
  }
  return model;
}

export function assertNoFallback(value, label = "model policy") {
  function visit(current, key = "") {
    if (/fallback|reroute/i.test(key) && current) throw new Error(`${label} cannot enable model fallback.`);
    if (Array.isArray(current)) {
      for (const child of current) visit(child);
    } else if (current && typeof current === "object") {
      for (const [childKey, child] of Object.entries(current)) visit(child, childKey);
    }
  }
  if (value === true) throw new Error(`${label} cannot enable model fallback.`);
  visit(value);
  return true;
}

export function clockEpoch(clock) {
  return toEpochMilliseconds(nowValue(clock), "clock");
}
