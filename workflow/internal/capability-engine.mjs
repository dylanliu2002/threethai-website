import crypto from "node:crypto";
import { canonicalJson } from "../canonical.mjs";
import { ControllerCapabilitySchema } from "../schemas.mjs";
import { deriveSandbox, routeTask } from "../routing.mjs";
import { validateGrantAgainstAnchorInternal } from "./authority-engine.mjs";
import {
  mutateControllerStateInternal,
  readControllerStateInternal,
  withStateMutexInternal,
} from "./controller-state-engine.mjs";

function unsigned(capability) {
  const { signature: _signature, ...payload } = capability;
  return payload;
}

function signaturePayload(capability) { return canonicalJson(unsigned(capability)); }

function currentGrant(engine, fallback) {
  return engine.loadGrant ? engine.loadGrant() : fallback;
}

function validateGrant(engine, contract, grant, options = {}) {
  return validateGrantAgainstAnchorInternal(contract, currentGrant(engine, grant), {
    repoRoot: engine.repoRoot,
    verifyCard: options.verifyCard ?? true,
    now: options.now ?? new Date(),
    trustedPublicKeyPem: engine.publicKeyPem,
    trustedFingerprint: engine.keyFingerprint,
  });
}

export function assertCapabilityAgainstStateInternal(capabilityInput, {
  engine, state, contract, grant, action, now = new Date(), verifyCard = true,
} = {}) {
  const capability = ControllerCapabilitySchema.parse(capabilityInput);
  const trusted = validateGrant(engine, contract, grant, { now, verifyCard });
  if (capability.signer_fingerprint !== engine.keyFingerprint) {
    throw new Error("Capability signer is not the pinned controller trust anchor.");
  }
  if (!crypto.verify(
    null,
    Buffer.from(signaturePayload(capability)),
    engine.publicKeyPem,
    Buffer.from(capability.signature, "base64"),
  )) throw new Error("Controller capability signature is invalid.");
  if (Date.parse(capability.expires_at) <= now.getTime()) throw new Error("Controller capability expired.");
  const lease = state.leases[capability.lease_id];
  const task = state.tasks[capability.task_key];
  const run = state.runs[capability.run_id];
  if (!lease || !task || !run
    || lease.task_key !== capability.task_key
    || lease.run_id !== capability.run_id
    || lease.fencing_token !== capability.fencing_token
    || task.lease_id !== capability.lease_id
    || task.current_run_id !== capability.run_id
    || task.fencing_token !== capability.fencing_token
    || run.lease_id !== capability.lease_id
    || run.fencing_token !== capability.fencing_token
    || lease.expires_at_ms <= now.getTime()) {
    throw new Error("Lease/fencing authority is missing, expired, or stale.");
  }
  const routed = routeTask(trusted.contract);
  const exact = capability.authorization_id === trusted.grant.authorization_id
    && capability.task_key === trusted.contract.task_key
    && capability.action === action
    && capability.contract_digest === trusted.grant.contract_digest
    && capability.authorization_revision === trusted.grant.authorization_revision
    && capability.branch === trusted.grant.branch
    && capability.worktree === trusted.grant.worktree
    && capability.role === run.role_id
    && capability.model === routed.model
    && capability.sandbox === deriveSandbox(trusted.contract, run.role_id);
  if (!exact) throw new Error("Controller capability binding mismatch.");
  const phasesByAction = {
    dispatch: ["QUEUED", "IMPLEMENT", "CORRECT", "VALIDATE", "INDEPENDENT_REVIEW"],
    review: ["INDEPENDENT_REVIEW", "CLOSEOUT", "CORRECT"],
    approve: ["INDEPENDENT_REVIEW", "CLOSEOUT"],
    correct: ["CORRECT"],
    closeout: ["CLOSEOUT"],
    commit: ["CLOSEOUT"],
    push: ["CLOSEOUT"],
    pr: ["CLOSEOUT"],
  };
  if (!phasesByAction[action]?.includes(task.phase)) {
    throw new Error("Capability action is not valid for the authoritative task phase.");
  }
  if (["review", "approve"].includes(action) && run.role_id !== trusted.grant.reviewer_role) {
    throw new Error("Independent review/approval requires the authorized reviewer Role.");
  }
  if (["dispatch", "correct", "closeout"].includes(action)
    && run.role_id !== trusted.grant.owner_role) {
    throw new Error("Privileged action requires the authorized owner Role.");
  }
  if (action === "review") {
    const target = task.review_target;
    if (!target
      || capability.reviewed_base_sha !== target.reviewed_base_sha
      || capability.reviewed_head_sha !== target.reviewed_head_sha
      || capability.head_sha !== target.reviewed_head_sha) {
      throw new Error("Review capability does not bind the authoritative reviewed head.");
    }
  } else if (capability.reviewed_base_sha !== null || capability.reviewed_head_sha !== null) {
    throw new Error("Non-review capability cannot carry a caller-selected review target.");
  }
  return { capability, ...trusted, lease, task, run };
}

export function issueCapabilityInternal({
  engine, contract, grant, action, runId, headSha, now = new Date(), ttlMs = 300_000,
  verifyCard = true,
}) {
  if (!engine.privateKeyPem) throw new Error("Controller signing credential is unavailable.");
  return withStateMutexInternal(engine.stateDirectory, () => {
    const state = readControllerStateInternal(engine.stateDirectory);
    const trusted = validateGrant(engine, contract, grant, { now, verifyCard });
    const run = state.runs[runId];
    const task = state.tasks[trusted.contract.task_key];
    const lease = run && state.leases[run.lease_id];
    if (!run || !task || !lease || task.current_run_id !== runId
      || task.lease_id !== lease.lease_id || lease.expires_at_ms <= now.getTime()) {
      throw new Error("Capability issuance requires the current live authoritative lease.");
    }
    const routed = routeTask(trusted.contract);
    const reviewTarget = action === "review" ? task.review_target : null;
    if (action === "review" && !reviewTarget) throw new Error("Reviewer capability requires authoritative implementation evidence.");
    const capability = {
      capability_version: "1.0.0",
      capability_id: crypto.randomUUID(),
      authorization_id: trusted.grant.authorization_id,
      task_key: trusted.contract.task_key,
      action,
      run_id: runId,
      attempt: run.attempt,
      lease_id: lease.lease_id,
      fencing_token: lease.fencing_token,
      contract_digest: trusted.grant.contract_digest,
      authorization_revision: trusted.grant.authorization_revision,
      branch: trusted.grant.branch,
      worktree: trusted.grant.worktree,
      role: run.role_id,
      model: routed.model,
      sandbox: deriveSandbox(trusted.contract, run.role_id),
      head_sha: reviewTarget?.reviewed_head_sha ?? headSha,
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      reviewed_base_sha: reviewTarget?.reviewed_base_sha ?? null,
      reviewed_head_sha: reviewTarget?.reviewed_head_sha ?? null,
      signer_fingerprint: engine.keyFingerprint,
      signature: "A".repeat(88),
    };
    capability.signature = crypto.sign(
      null,
      Buffer.from(signaturePayload(capability)),
      engine.privateKeyPem,
    ).toString("base64");
    return ControllerCapabilitySchema.parse(capability);
  });
}

export function privilegedMutationInternal({
  engine, contract, grant, capability, action, type, taskKey, runId,
  payload = {}, now = new Date(), verifyCard = true,
}, mutate) {
  let validated;
  return mutateControllerStateInternal(engine.stateDirectory, {
    type, taskKey, runId, payload,
    guard: (state) => {
      validated = assertCapabilityAgainstStateInternal(capability, {
        engine, state, contract, grant, action, now, verifyCard,
      });
    },
  }, (state) => mutate(state, validated)).result;
}
