import crypto from "node:crypto";
import { validateTrustedGrant } from "./authority.mjs";
import { validateControllerCapability } from "./capability.mjs";
import { createRunIdentity } from "./identity.mjs";
import { contractLockRequests, lockRequestsConflict } from "./locks.mjs";
import { mutateControllerState } from "./controller-state.mjs";

function expireStale(state, nowMs) {
  for (const [leaseId, lease] of Object.entries(state.leases)) {
    if (lease.expires_at_ms > nowMs) continue;
    delete state.leases[leaseId];
    for (const [key, reservation] of Object.entries(state.reservations)) {
      if (reservation.lease_id === leaseId) delete state.reservations[key];
    }
    const task = state.tasks[lease.task_key];
    if (task?.lease_id === leaseId) {
      task.lease_id = null;
      task.current_run_id = null;
    }
    const run = state.runs[lease.run_id];
    if (run && !["COMPLETED", "FAILED"].includes(run.status)) run.status = "STALE";
  }
}

function conflictingReservation(state, requests, taskKey) {
  for (const reservation of Object.values(state.reservations)) {
    if (reservation.task_key === taskKey) continue;
    for (const request of requests) {
      if (lockRequestsConflict(request, reservation)) return reservation;
    }
  }
  return null;
}

export function reserveTaskDispatch({
  stateDirectory,
  contract: contractInput,
  grant: grantInput,
  wakeupId,
  baseSha,
  roleId,
  repoRoot,
  verifyCard = true,
  now = new Date(),
}) {
  const { contract, grant } = validateTrustedGrant(contractInput, grantInput, {
    repoRoot,
    stateDirectory,
    verifyCard,
    now,
  });
  const nowMs = now.getTime();
  return mutateControllerState(stateDirectory, {
    type: "scheduler.admission",
    taskKey: contract.task_key,
    payload: { wakeup_id: wakeupId },
  }, (state) => {
    expireStale(state, nowMs);
    if (state.wakeups[wakeupId]) return { acquired: false, duplicate: true, reason: "duplicate-wakeup" };
    state.wakeups[wakeupId] = { task_key: contract.task_key, observed_at: now.toISOString() };
    if (!state.activation.authorized || !grant.activation.autonomous || !grant.activation.worker_dispatch) {
      return { acquired: false, duplicate: false, reason: "activation-disabled" };
    }
    const currentTask = state.tasks[contract.task_key];
    if (currentTask?.lease_id && state.leases[currentTask.lease_id]) {
      return { acquired: false, duplicate: false, reason: "task-already-leased" };
    }
    const expectedRole = currentTask?.phase === "INDEPENDENT_REVIEW"
      ? grant.reviewer_role
      : grant.owner_role;
    if (roleId !== expectedRole) {
      return { acquired: false, duplicate: false, reason: "role-not-authorized-for-phase" };
    }
    const requests = contractLockRequests(grant);
    const conflict = conflictingReservation(state, requests, contract.task_key);
    if (conflict) {
      return { acquired: false, duplicate: false, reason: "lock-conflict", blocked_by: conflict.task_key };
    }
    state.fencing_generation += 1;
    const priorAttempt = currentTask?.attempt ?? 0;
    const attempt = priorAttempt + 1;
    const leaseId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    const workerId = crypto.randomUUID();
    const expiresAtMs = nowMs + grant.limits.lease_seconds * 1000;
    const lease = {
      lease_id: leaseId,
      task_key: contract.task_key,
      run_id: runId,
      attempt,
      fencing_token: state.fencing_generation,
      issued_at: now.toISOString(),
      expires_at: new Date(expiresAtMs).toISOString(),
      expires_at_ms: expiresAtMs,
      requests,
    };
    const run = createRunIdentity(contract, grant, lease, {
      roleId,
      workerId,
      runId,
      attempt,
      baseSha,
      now,
    });
    state.leases[leaseId] = lease;
    requests.forEach((request, index) => {
      state.reservations[`${leaseId}:${index}`] = {
        ...request,
        lease_id: leaseId,
        task_key: contract.task_key,
        fencing_token: lease.fencing_token,
        expires_at_ms: expiresAtMs,
      };
    });
    state.runs[runId] = run;
    state.tasks[contract.task_key] = {
      status: contract.status,
      phase: contract.phase,
      current_run_id: runId,
      attempt,
      lease_id: leaseId,
      fencing_token: lease.fencing_token,
      correction_count: currentTask?.correction_count ?? 0,
      reviewer_run_ids: currentTask?.reviewer_run_ids ?? [],
      review_record: currentTask?.review_record ?? null,
      approval_revision: currentTask?.approval_revision ?? 0,
      owner_role: grant.owner_role,
      reviewer_role: grant.reviewer_role,
    };
    return { acquired: true, duplicate: false, lease: structuredClone(lease), run: structuredClone(run) };
  }).result;
}

export function completeAuthoritativeRun({
  stateDirectory,
  contract,
  grant,
  capability,
  repoRoot,
  verifyCard = true,
  status = "COMPLETED",
  threadId,
  reportedModel,
  headSha,
  validationDigest,
  now = new Date(),
}) {
  if (!["dispatch", "review"].includes(capability.action)) {
    throw new Error("Run completion requires a dispatch or review capability.");
  }
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: capability.action, repoRoot, verifyCard, now,
  });
  return mutateControllerState(stateDirectory, {
    type: "run.completed",
    taskKey: capability.task_key,
    runId: capability.run_id,
  }, (state) => {
    const run = state.runs[capability.run_id];
    run.thread_id = threadId ?? run.thread_id;
    run.reported_model = reportedModel ?? run.reported_model;
    run.head_sha = headSha ?? run.head_sha ?? null;
    run.validation_digest = validationDigest ?? run.validation_digest ?? null;
    run.completed_at = now.toISOString();
    run.status = status;
    const task = state.tasks[capability.task_key];
    if (status === "COMPLETED" && run.role_id === task.owner_role) {
      task.status = "REVIEW";
      task.phase = "INDEPENDENT_REVIEW";
    }
    return structuredClone(run);
  }).result;
}

export function releaseTaskLease({
  stateDirectory,
  contract,
  grant,
  capability,
  repoRoot,
  verifyCard = true,
  now = new Date(),
}) {
  validateControllerCapability(capability, {
    stateDirectory, contract, grant, action: capability.action, repoRoot, verifyCard, now,
  });
  return mutateControllerState(stateDirectory, {
    type: "lease.released",
    taskKey: capability.task_key,
    runId: capability.run_id,
  }, (state) => {
    delete state.leases[capability.lease_id];
    for (const [key, reservation] of Object.entries(state.reservations)) {
      if (reservation.lease_id === capability.lease_id) delete state.reservations[key];
    }
    const task = state.tasks[capability.task_key];
    if (task?.lease_id === capability.lease_id) task.lease_id = null;
    return { released: true, released_at: now.toISOString() };
  }).result;
}
