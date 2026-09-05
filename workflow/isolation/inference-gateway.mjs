import { createRequire } from "node:module";
import { canonicalJson, sha256 } from "../canonical.mjs";
import { InferenceGateway } from "./interfaces.mjs";
import { loadWorkerSecurityPolicy } from "./policy.mjs";

const require = createRequire(import.meta.url);
const { z } = require("zod");
const leaseSchema = z.object({
  schema_version: z.literal("1.0.0"), lease_id: z.string().uuid(), task_key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  run_id: z.string().uuid(), provider: z.literal("OpenAI"), model: z.literal("gpt-5.6-sol"),
  issued_at: z.string().datetime(), expires_at: z.string().datetime(),
  allowed_operations: z.tuple([z.literal("responses.create")]),
  max_requests: z.number().int().positive(), max_input_tokens: z.number().int().positive(),
  max_output_tokens: z.number().int().positive(), max_duration_seconds: z.number().int().positive(),
  signer_fingerprint: z.string().regex(/^[0-9a-f]{64}$/), capability_digest: z.string().regex(/^[0-9a-f]{64}$/),
  signature: z.string().min(80),
}).strict();
const requestSchema = z.object({
  operation: z.literal("responses.create"), method: z.literal("POST"), path: z.literal("/v1/responses"),
  estimated_input_tokens: z.number().int().nonnegative(), payload: z.record(z.string(), z.unknown()),
}).strict();

function unsignedLease(lease) {
  const { signature: _signature, ...payload } = lease;
  return payload;
}

function forbiddenOverride(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => forbiddenOverride(item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const normalized = key.toLocaleLowerCase("en-US").replace(/[^a-z]/g, "");
      if (normalized.endsWith("url") || ["provider", "modelprovider"].includes(normalized)) {
        throw new Error(`Gateway request contains forbidden destination/provider override: ${path}.${key}`);
      }
      forbiddenOverride(item, `${path}.${key}`);
    }
  }
}

function isPrivateDestination(url) {
  const parsed = new URL(url);
  const host = parsed.hostname.toLocaleLowerCase("en-US").replace(/^\[|\]$/g, "");
  if (host === "localhost" || host === "::1" || host === "0.0.0.0" || host.endsWith(".local")) return true;
  const octets = host.split(".").map(Number);
  if (octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return octets[0] === 10 || octets[0] === 127 || octets[0] === 0
      || (octets[0] === 169 && octets[1] === 254)
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168);
  }
  return /^(?:fc|fd|fe8|fe9|fea|feb)/.test(host.replaceAll(":", ""));
}

export function issueGatewayLease({ capability, signer, expiresAt, policy = loadWorkerSecurityPolicy() }) {
  if (!signer?.available) throw new Error("Gateway lease requires the protected controller signer.");
  if (!capability || typeof capability !== "object") throw new Error("Gateway lease requires a controller capability.");
  const issuedAt = new Date().toISOString();
  const lease = {
    schema_version: "1.0.0", lease_id: capability.lease_id, task_key: capability.task_key,
    run_id: capability.run_id, provider: policy.codex.provider, model: policy.codex.model,
    issued_at: issuedAt, expires_at: expiresAt, allowed_operations: [...policy.gateway.allowed_operations],
    max_requests: policy.gateway.max_requests, max_input_tokens: policy.gateway.max_input_tokens,
    max_output_tokens: policy.gateway.max_output_tokens, max_duration_seconds: policy.gateway.max_duration_seconds,
    signer_fingerprint: signer.fingerprint, capability_digest: sha256(capability), signature: "A".repeat(88),
  };
  lease.signature = signer.sign(canonicalJson(unsignedLease(lease)));
  return leaseSchema.parse(lease);
}

export class ControllerInferenceGateway extends InferenceGateway {
  #usage = new Map();

  constructor({ signer, destination, forwarder, policy = loadWorkerSecurityPolicy() }) {
    super();
    if (!signer || typeof forwarder !== "function") throw new Error("Gateway requires signer and forwarder.");
    const parsed = new URL(destination);
    if (parsed.protocol !== "https:" || destination !== policy.gateway.provider_destination || isPrivateDestination(destination)) {
      throw new Error("Gateway destination is arbitrary, private, link-local, or unapproved.");
    }
    this.signer = signer;
    this.destination = destination;
    this.forwarder = forwarder;
    this.policy = policy;
  }

  authorize(leaseInput, requestInput) {
    const lease = leaseSchema.parse(leaseInput);
    const request = requestSchema.parse(requestInput);
    if (lease.signer_fingerprint !== this.signer.fingerprint
      || !this.signer.verify(canonicalJson(unsignedLease(lease)), lease.signature)) {
      throw new Error("Inference gateway lease signature is invalid.");
    }
    const issued = Date.parse(lease.issued_at);
    const expires = Date.parse(lease.expires_at);
    const now = Date.now();
    if (expires <= now || expires <= issued || expires - issued > lease.max_duration_seconds * 1000) {
      throw new Error("Inference gateway lease is expired or exceeds its time budget.");
    }
    if (!lease.allowed_operations.includes(request.operation) || request.method === "CONNECT") {
      throw new Error("Inference gateway operation or CONNECT tunnel is forbidden.");
    }
    forbiddenOverride(request.payload);
    if (request.payload.model !== lease.model) throw new Error("Inference gateway model override rejected.");
    const requestedOutput = request.payload.max_output_tokens;
    if (!Number.isInteger(requestedOutput) || requestedOutput < 1) throw new Error("Gateway request requires bounded max_output_tokens.");
    const usage = this.#usage.get(lease.lease_id) ?? { requests: 0, input_tokens: 0, output_tokens_reserved: 0 };
    const next = {
      requests: usage.requests + 1,
      input_tokens: usage.input_tokens + request.estimated_input_tokens,
      output_tokens_reserved: usage.output_tokens_reserved + requestedOutput,
    };
    if (next.requests > lease.max_requests || next.input_tokens > lease.max_input_tokens
      || next.output_tokens_reserved > lease.max_output_tokens) {
      throw new Error("Inference gateway request/token budget exceeded.");
    }
    this.#usage.set(lease.lease_id, next);
    return Object.freeze({ lease, request, usage: Object.freeze(next), destination: this.destination });
  }

  async forward(lease, request) {
    const authorized = this.authorize(lease, request);
    return this.forwarder({
      destination: authorized.destination,
      method: authorized.request.method,
      path: authorized.request.path,
      payload: authorized.request.payload,
      provider_credential_exposed_to_worker: false,
    });
  }
}

export function createLocalInferenceGatewayStub({ signer, policy = loadWorkerSecurityPolicy() }) {
  return new ControllerInferenceGateway({
    signer,
    destination: policy.gateway.provider_destination,
    policy,
    forwarder: async ({ payload }) => ({
      id: "local-stub", object: "response", status: "completed", model: payload.model,
      output: [], usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      local_stub: true,
    }),
  });
}

export { isPrivateDestination };
