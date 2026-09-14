import {
  IMPLEMENTATION_MODEL_NAME,
  IMPLEMENTATION_REASONING_EFFORT,
  MVP_CONFIG,
  REVIEW_DEFAULT_REASONING_EFFORT,
  REVIEW_MODEL_NAME,
  assertExactModel,
  assertNoFallback,
  reviewEffortForDifficulty,
} from "./config.mjs";

const PLANNING_ROLE = "ORCHESTRATOR";
const IMPLEMENTATION_ROLE = "IMPLEMENTATION";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertFalseOrAbsent(value, label) {
  if (value !== undefined && value !== false && value !== null) {
    throw new Error(`${label} is forbidden.`);
  }
}

function assertPlanningOverrides(options = {}) {
  assertObject(options, "planning policy options");
  assertNoFallback(options, "Planning policy");
  if (options.model !== undefined && options.model !== REVIEW_MODEL_NAME) {
    throw new Error("SOL is the only planning model.");
  }
  if (options.provider !== undefined && options.provider !== MVP_CONFIG.provider) {
    throw new Error("Planning provider must be OpenAI.");
  }
  if (options.modelProvider !== undefined && options.modelProvider !== MVP_CONFIG.model_provider) {
    throw new Error("Planning model provider must be OpenAI.");
  }
  if (options.effort !== undefined
    && options.effort !== reviewEffortForDifficulty(options.difficulty ?? REVIEW_DEFAULT_REASONING_EFFORT)) {
    throw new Error("Planning effort must be derived from difficulty.");
  }
  if (options.sandbox !== undefined && options.sandbox !== "read-only") {
    throw new Error("Planning must use the read-only sandbox.");
  }
  if (options.persistent !== undefined && options.persistent !== true) {
    throw new Error("Planning must remain in the persistent Orchestrator thread.");
  }
  assertFalseOrAbsent(options.ephemeral, "Ephemeral planning threads");
  assertFalseOrAbsent(options.fork, "Forked planning threads");
  assertFalseOrAbsent(options.subagent, "Subagent planning");
  assertFalseOrAbsent(options.subagents, "Subagent planning");
  assertFalseOrAbsent(options.allowProviderModelFallback, "Provider model fallback");
  if (options.role !== undefined && options.role !== PLANNING_ROLE) {
    throw new Error("Planning must remain owned by the Orchestrator role.");
  }
  if (options.capabilities !== undefined) {
    assertObject(options.capabilities, "planning capabilities");
    if (Object.values(options.capabilities).some((value) => value === true)) {
      throw new Error("Persistent planning cannot enable worker capabilities.");
    }
  }
}

function assertImplementationOverrides(options = {}) {
  assertObject(options, "implementation policy options");
  assertNoFallback(options, "Implementation policy");
  if (options.model !== undefined && options.model !== IMPLEMENTATION_MODEL_NAME) {
    throw new Error("LUNA is the only implementation model.");
  }
  if (options.effort !== undefined && options.effort !== IMPLEMENTATION_REASONING_EFFORT) {
    throw new Error("Implementation reasoning effort must be max.");
  }
  if (options.sandbox !== undefined && options.sandbox !== "workspace-write") {
    throw new Error("Implementation workers must use the workspace-write sandbox.");
  }
  if (options.provider !== undefined && options.provider !== MVP_CONFIG.provider) {
    throw new Error("Implementation provider must be OpenAI.");
  }
  if (options.modelProvider !== undefined && options.modelProvider !== MVP_CONFIG.model_provider) {
    throw new Error("Implementation model provider must be OpenAI.");
  }
  assertFalseOrAbsent(options.ephemeral, "Ephemeral implementation threads");
  assertFalseOrAbsent(options.fork, "Forked implementation threads");
  assertFalseOrAbsent(options.subagent, "Subagent implementation");
  assertFalseOrAbsent(options.subagents, "Subagent implementation");
  assertFalseOrAbsent(options.allowProviderModelFallback, "Provider model fallback");
  if (options.difficulty !== undefined) throw new Error("Implementation starts do not accept review difficulty.");
  if (options.capabilities !== undefined) assertNoWorkerAuthority(options.capabilities);
}

export const PLANNING_MODEL_POLICY = deepFreeze({
  role: PLANNING_ROLE,
  model: REVIEW_MODEL_NAME,
  provider: MVP_CONFIG.provider,
  model_provider: MVP_CONFIG.model_provider,
  default_effort: REVIEW_DEFAULT_REASONING_EFFORT,
  sandbox: "read-only",
  persistent: true,
  ephemeral: false,
  fork: false,
  subagent: false,
  allow_provider_model_fallback: false,
  authority: "persistent-orchestrator-only",
});

export const IMPLEMENTATION_WORKER_POLICY = deepFreeze({
  role: IMPLEMENTATION_ROLE,
  model: IMPLEMENTATION_MODEL_NAME,
  provider: MVP_CONFIG.provider,
  model_provider: MVP_CONFIG.model_provider,
  effort: IMPLEMENTATION_REASONING_EFFORT,
  sandbox: "workspace-write",
  approval_policy: "never",
  ephemeral: false,
  fork: false,
  subagent: false,
  allow_provider_model_fallback: false,
  // A worker may make its task branch/commit for later human integration, but
  // this layer never gives it publishing credentials or publishing authority.
  capabilities: deepFreeze({
    branch: true,
    commit: true,
    push: false,
    pr: false,
    review: false,
    merge: false,
    publishing_credentials: false,
    production: false,
    deployment: false,
    dns: false,
    secrets: false,
  }),
});

export function planningPolicyForDifficulty(difficulty = REVIEW_DEFAULT_REASONING_EFFORT, options = {}) {
  assertPlanningOverrides(options);
  const effort = reviewEffortForDifficulty(difficulty);
  return deepFreeze({
    ...PLANNING_MODEL_POLICY,
    difficulty: effort,
    effort,
  });
}

export const resolvePlanningPolicy = planningPolicyForDifficulty;
export const getPlanningPolicy = planningPolicyForDifficulty;

export function implementationPolicyForWorktree(cwd, options = {}) {
  assertImplementationOverrides(options);
  if (typeof cwd !== "string" || cwd.trim().length === 0 || cwd.includes("\0")) {
    throw new Error("Implementation worker cwd is required.");
  }
  return deepFreeze({
    ...IMPLEMENTATION_WORKER_POLICY,
    cwd: cwd.trim(),
  });
}

export const resolveImplementationPolicy = implementationPolicyForWorktree;
export const getImplementationPolicy = implementationPolicyForWorktree;

export function assertPlanningPolicy(value = {}) {
  assertPlanningOverrides(value);
  if (value.model !== undefined) assertExactModel(value.model, "planning model");
  const policy = planningPolicyForDifficulty(value.difficulty ?? REVIEW_DEFAULT_REASONING_EFFORT, value);
  if (policy.model !== REVIEW_MODEL_NAME || policy.effort !== reviewEffortForDifficulty(value.difficulty ?? "medium")) {
    throw new Error("Planning policy is not the exact SOL difficulty policy.");
  }
  return policy;
}

export function assertImplementationPolicy(value = {}) {
  assertImplementationOverrides(value);
  if (value.model !== undefined) assertExactModel(value.model, "implementation model");
  const policy = implementationPolicyForWorktree(value.cwd, value);
  if (policy.model !== IMPLEMENTATION_MODEL_NAME || policy.effort !== IMPLEMENTATION_REASONING_EFFORT) {
    throw new Error("Implementation policy is not the exact LUNA/max policy.");
  }
  return policy;
}

export function assertNoWorkerAuthority(value = {}) {
  assertObject(value, "worker authority");
  assertNoFallback(value, "Worker authority");
  const forbidden = new Set([
    "push", "pr", "pullrequest", "openpr", "review", "merge", "publishingcredentials",
    "production", "deployment", "dns", "secrets",
  ]);
  for (const [key, current] of Object.entries(value)) {
    const normalizedKey = key.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
    if (forbidden.has(normalizedKey) && current !== undefined && current !== null && current !== false) {
      throw new Error(`Worker authority cannot enable ${key}.`);
    }
  }
  return true;
}

export {
  IMPLEMENTATION_ROLE,
  PLANNING_ROLE,
};
