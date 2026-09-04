import crypto from "node:crypto";
import { canonicalJson } from "./canonical.mjs";
import { validateTrustedGrant } from "./authority.mjs";
import { ensureControllerKey } from "./controller-state.mjs";
import { assertCurrentLease } from "./lease-state.mjs";
import { ControllerCapabilitySchema } from "./schemas.mjs";
import { deriveSandbox, routeTask } from "./routing.mjs";

function unsigned(capability) {
  const { signature: _signature, ...payload } = capability;
  return payload;
}

function sign(stateDirectory, capability) {
  return crypto.createHmac("sha256", ensureControllerKey(stateDirectory))
    .update(canonicalJson(unsigned(capability)))
    .digest("hex");
}

export function issueControllerCapability({
  stateDirectory,
  contract: contractInput,
  grant: grantInput,
  action,
  runId,
  leaseId,
  fencingToken,
  headSha,
  repoRoot,
  verifyCard = true,
  now = new Date(),
  ttlMs = 300_000,
}) {
  const { contract, grant } = validateTrustedGrant(contractInput, grantInput, {
    repoRoot, stateDirectory, verifyCard, now,
  });
  const { run } = assertCurrentLease(stateDirectory, {
    taskKey: contract.task_key, runId, leaseId, fencingToken, now,
  });
  const routed = routeTask(contract);
  const capability = {
    capability_version: "1.0.0",
    capability_id: crypto.randomUUID(),
    authorization_id: grant.authorization_id,
    task_key: contract.task_key,
    action,
    run_id: runId,
    attempt: run.attempt,
    lease_id: leaseId,
    fencing_token: fencingToken,
    contract_digest: grant.contract_digest,
    authorization_revision: grant.authorization_revision,
    branch: grant.branch,
    worktree: grant.worktree,
    role: run.role_id,
    model: routed.model,
    sandbox: deriveSandbox(contract, run.role_id),
    head_sha: headSha,
    issued_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    signature: "0".repeat(64),
  };
  capability.signature = sign(stateDirectory, capability);
  return ControllerCapabilitySchema.parse(capability);
}

export function validateControllerCapability(capabilityInput, {
  stateDirectory,
  contract,
  grant,
  action,
  repoRoot,
  verifyCard = true,
  now = new Date(),
}) {
  const capability = ControllerCapabilitySchema.parse(capabilityInput);
  const trusted = validateTrustedGrant(contract, grant, { repoRoot, stateDirectory, verifyCard, now });
  const expectedSignature = sign(stateDirectory, capability);
  const left = Buffer.from(capability.signature, "hex");
  const right = Buffer.from(expectedSignature, "hex");
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error("Controller capability signature is invalid.");
  }
  if (Date.parse(capability.expires_at) <= now.getTime()) throw new Error("Controller capability expired.");
  const routed = routeTask(trusted.contract);
  const lease = assertCurrentLease(stateDirectory, {
    taskKey: capability.task_key,
    runId: capability.run_id,
    leaseId: capability.lease_id,
    fencingToken: capability.fencing_token,
    now,
  });
  const exact = capability.authorization_id === trusted.grant.authorization_id
    && capability.task_key === trusted.contract.task_key
    && capability.action === action
    && capability.contract_digest === trusted.grant.contract_digest
    && capability.authorization_revision === trusted.grant.authorization_revision
    && capability.branch === trusted.grant.branch
    && capability.worktree === trusted.grant.worktree
    && capability.role === lease.run.role_id
    && capability.model === routed.model
    && capability.sandbox === deriveSandbox(trusted.contract, lease.run.role_id);
  if (!exact) throw new Error("Controller capability binding mismatch.");
  return { capability, ...trusted, ...lease };
}
