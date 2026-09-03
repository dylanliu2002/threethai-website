import { MODEL_ROUTING_REVISION } from "./constants.mjs";

export const MODEL_ROUTING_V1 = Object.freeze({
  codex_native: "gpt-5.6-sol",
  legacy_hermes_complex: "gpt-5.6-terra",
  legacy_hermes_bulk: "gpt-5.6-luna",
  escalation: "gpt-5.6-sol",
});

export function expectedModel(contract, { escalation = false } = {}) {
  if (escalation) return MODEL_ROUTING_V1.escalation;
  if (contract.origin.kind === "LEGACY_HERMES") {
    return contract.execution_profile === "BULK_EXTRACTION"
      ? MODEL_ROUTING_V1.legacy_hermes_bulk
      : MODEL_ROUTING_V1.legacy_hermes_complex;
  }
  return MODEL_ROUTING_V1.codex_native;
}

export function routeTask(contract, { availableModels, escalation = false } = {}) {
  if (contract.routing.policy_revision !== MODEL_ROUTING_REVISION) {
    throw new Error("Unsupported model routing policy revision.");
  }
  if (contract.routing.fallback !== "BLOCKED") {
    throw new Error("Automatic provider/model fallback is forbidden.");
  }
  const selected = expectedModel(contract, { escalation });
  if (contract.routing.requested_model !== selected) {
    throw new Error(`Requested model is outside approved routing: ${contract.routing.requested_model}`);
  }
  if (availableModels && !availableModels.includes(selected)) {
    throw new Error(`BLOCKED: approved model unavailable: ${selected}`);
  }
  return {
    executor_platform: "Codex",
    provider: "OpenAI",
    model: selected,
    reasoning_effort: contract.routing.reasoning_effort,
    fallback: "BLOCKED",
  };
}
