import { MODEL_ROUTING_REVISION } from "./constants.mjs";

export const MODEL_ROUTING_V1 = Object.freeze({
  codex_native: "gpt-5.6-sol",
  legacy_hermes_complex: "gpt-5.6-terra",
  legacy_hermes_bulk: "gpt-5.6-luna",
  escalation: "gpt-5.6-sol",
});

function routingOf(value) {
  return value.routing ?? value.requested_routing;
}

export function expectedModel(contract, { escalation = false } = {}) {
  if (escalation) return MODEL_ROUTING_V1.escalation;
  if (contract.request_provenance?.kind === "LEGACY_HERMES") {
    return contract.execution_profile === "BULK_EXTRACTION"
      ? MODEL_ROUTING_V1.legacy_hermes_bulk
      : MODEL_ROUTING_V1.legacy_hermes_complex;
  }
  return MODEL_ROUTING_V1.codex_native;
}

export function routeTask(contract, { availableModels, escalation = false } = {}) {
  const routing = routingOf(contract);
  if (routing.policy_revision !== MODEL_ROUTING_REVISION) {
    throw new Error("Unsupported model routing policy revision.");
  }
  if (routing.fallback !== "BLOCKED") {
    throw new Error("Automatic provider/model fallback is forbidden.");
  }
  const selected = expectedModel(contract, { escalation });
  if (routing.requested_model !== selected) {
    throw new Error(`Requested model is outside approved routing: ${routing.requested_model}`);
  }
  if (availableModels && !availableModels.includes(selected)) {
    throw new Error(`BLOCKED: approved model unavailable: ${selected}`);
  }
  return {
    executor_platform: routing.executor_platform,
    provider: routing.provider,
    model: selected,
    reasoning_effort: routing.reasoning_effort,
    fallback: "BLOCKED",
  };
}

export function deriveSandbox(contract, role) {
  if (role === contract.reviewer_role) return "read-only";
  if (role !== contract.owner_role) throw new Error("Role is not authorized for this task.");
  if (!contract.requested_permissions.repository_write || contract.mode === "REVIEW") return "read-only";
  return "workspace-write";
}

export function assertSandboxAllowed(sandbox) {
  if (sandbox === "danger-full-access") {
    throw new Error("danger-full-access is forbidden by the MVP sandbox policy.");
  }
  if (!["read-only", "workspace-write"].includes(sandbox)) {
    throw new Error(`Unsupported sandbox: ${sandbox}`);
  }
  return sandbox;
}
