import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRunIdentityInternal } from "./identity-engine.mjs";
import { canonicalJson, sha256 } from "../canonical.mjs";
import { assertActualChangesAllowed } from "../git-evidence.mjs";
import { ReviewRecordSchema } from "../schemas.mjs";
import { SCHEMA_VERSION } from "../constants.mjs";
import { contractLockRequests, lockRequestsConflict } from "../locks.mjs";
import { validateGrantAgainstAnchorInternal } from "./authority-engine.mjs";
import { privilegedMutationInternal } from "./capability-engine.mjs";
import { mutateControllerStateInternal } from "./controller-state-engine.mjs";

function validateGrant(engine, contract, grant, { verifyCard = true, now = new Date() } = {}) {
  return validateGrantAgainstAnchorInternal(contract, engine.loadGrant ? engine.loadGrant() : grant, {
    repoRoot: engine.repoRoot,
    verifyCard,
    now,
    trustedPublicKeyPem: engine.publicKeyPem,
    trustedFingerprint: engine.keyFingerprint,
  });
}

function removeLeaseAndReservations(state, leaseId, { clearCurrentRun = false } = {}) {
  const lease = state.leases[leaseId];
  if (!lease) return false;
  delete state.leases[leaseId];
  for (const [key, reservation] of Object.entries(state.reservations)) {
    if (reservation.lease_id === leaseId) delete state.reservations[key];
  }
  const task = state.tasks[lease.task_key];
  if (task?.lease_id === leaseId) {
    task.lease_id = null;
    if (clearCurrentRun) task.current_run_id = null;
  }
  return true;
}

function expireStale(state, nowMs) {
  for (const [leaseId, lease] of Object.entries(state.leases)) {
    if (lease.expires_at_ms > nowMs) continue;
    removeLeaseAndReservations(state, leaseId, { clearCurrentRun: true });
    const run = state.runs[lease.run_id];
    if (run && !["SUCCESS", "FAILED", "INVALID_OUTPUT", "SCOPE_VIOLATION", "VALIDATION_FAILED"].includes(run.status)) {
      run.status = "STALE";
    }
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

function expectedRoleForPhase(phase, grant) {
  if (phase === "INDEPENDENT_REVIEW") return grant.reviewer_role;
  if (phase === "CLOSEOUT") return grant.owner_role;
  return grant.owner_role;
}

function actualHead(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true,
  }).trim();
}

function ensureFreshReviewPrerequisites(state, contract, grant, repoRoot) {
  if (contract.phase !== "INDEPENDENT_REVIEW") return null;
  const existing = state.tasks[contract.task_key]?.review_target;
  if (existing) return existing;
  const target = grant.review_target;
  if (!target) throw new Error("Fresh review admission requires signed implementation evidence.");
  if (repoRoot && actualHead(repoRoot) !== target.reviewed_head_sha) {
    throw new Error("Fresh review target does not match actual Git HEAD.");
  }
  if (repoRoot) {
    const evidence = assertActualChangesAllowed({
      repoRoot,
      baseSha: target.reviewed_base_sha,
      grant,
    });
    if (evidence.evidence_digest !== target.implementation_evidence_digest) {
      throw new Error("Fresh review target does not match controller-derived Git evidence.");
    }
  }
  state.runs[target.implementation_run_id] = {
    task_key: contract.task_key,
    role_id: grant.owner_role,
    worker_id: target.implementation_worker_id,
    thread_id: target.implementation_thread_id,
    run_id: target.implementation_run_id,
    attempt: 1,
    executor_platform: grant.routing.executor_platform,
    provider: grant.routing.provider,
    requested_model: grant.routing.requested_model,
    reported_model: grant.routing.requested_model,
    reasoning_effort: grant.routing.reasoning_effort,
    configuration_digest: target.implementation_evidence_digest,
    contract_digest: grant.contract_digest,
    authorization_revision: grant.authorization_revision,
    lease_id: crypto.randomUUID(),
    fencing_token: 1,
    base_sha: target.reviewed_base_sha,
    head_sha: target.reviewed_head_sha,
    validation_digest: target.validation_digest,
    started_at: new Date(0).toISOString(),
    completed_at: new Date(0).toISOString(),
    status: "SUCCESS",
    source: "SIGNED_REVIEW_TARGET",
  };
  return target;
}

export function reserveTaskDispatchInternal({
  engine,
  contract: contractInput,
  grant: grantInput,
  wakeupId,
  baseSha,
  roleId,
  verifyCard = true,
  now = new Date(),
  maxWorkersCeiling = Number.POSITIVE_INFINITY,
  pilotActivationId = null,
}) {
  if (maxWorkersCeiling !== Number.POSITIVE_INFINITY
    && (!Number.isInteger(maxWorkersCeiling) || maxWorkersCeiling < 1)) {
    throw new Error("Worker ceiling must be a positive integer.");
  }
  const nowMs = now.getTime();
  return mutateControllerStateInternal(engine.stateDirectory, {
    type: "scheduler.admission", taskKey: contractInput.task_key, payload: { wakeup_id: wakeupId },
  }, (state) => {
    const { contract, grant } = validateGrant(engine, contractInput, grantInput, { verifyCard, now });
    expireStale(state, nowMs);
    if (state.wakeups[wakeupId]) return { acquired: false, duplicate: true, reason: "duplicate-wakeup" };
    state.wakeups[wakeupId] = { task_key: contract.task_key, observed_at: now.toISOString() };
    const pilotActivation = state.pilot_activation;
    const oneTimePilotAuthorized = Boolean(pilotActivationId)
      && pilotActivation?.status === "READY"
      && pilotActivation.activation_id === pilotActivationId
      && pilotActivation.task_key === contract.task_key
      && pilotActivation.authorization_id === grant.authorization_id
      && pilotActivation.contract_digest === grant.contract_digest
      && pilotActivation.card_blob_sha === grant.card_blob_sha
      && pilotActivation.max_workers === 1
      && pilotActivation.dispatch_attempts === 0
      && grant.activation.synthetic_pilot_once?.task_key === contract.task_key
      && grant.activation.synthetic_pilot_once?.contract_digest === grant.contract_digest
      && grant.activation.synthetic_pilot_once?.card_blob_sha === grant.card_blob_sha
      && grant.activation.synthetic_pilot_once?.max_dispatch_attempts === 1
      && grant.activation.synthetic_pilot_once?.max_workers === 1
      && !grant.activation.autonomous
      && grant.activation.worker_dispatch
      && grant.permissions.worker_dispatch;
    const generalActivationAuthorized = state.activation.authorized
      && grant.activation.autonomous
      && grant.activation.worker_dispatch;
    if (!oneTimePilotAuthorized && !generalActivationAuthorized) {
      return { acquired: false, duplicate: false, reason: "activation-disabled" };
    }
    const currentTask = state.tasks[contract.task_key];
    if (currentTask?.lease_id && state.leases[currentTask.lease_id]) {
      return { acquired: false, duplicate: false, reason: "task-already-leased" };
    }
    const phase = currentTask?.phase ?? contract.phase;
    const expectedRole = expectedRoleForPhase(phase, grant);
    if (roleId !== expectedRole) {
      return { acquired: false, duplicate: false, reason: "role-not-authorized-for-phase" };
    }
    const activeWorkerLeases = Object.values(state.leases).filter((lease) => lease.kind === "worker");
    const effectiveMaximum = Math.min(
      maxWorkersCeiling,
      grant.limits.max_workers,
      ...activeWorkerLeases.map((lease) => lease.max_workers ?? grant.limits.max_workers),
    );
    if (activeWorkerLeases.length >= effectiveMaximum) {
      return { acquired: false, duplicate: false, reason: "max-workers", active_workers: activeWorkerLeases.length };
    }
    let reviewTarget;
    try {
      reviewTarget = ensureFreshReviewPrerequisites(state, contract, grant, engine.repoRoot);
    } catch (error) {
      return { acquired: false, duplicate: false, reason: "review-prerequisites", detail: error.message };
    }
    const requests = contractLockRequests(grant);
    const conflict = conflictingReservation(state, requests, contract.task_key);
    if (conflict) return { acquired: false, duplicate: false, reason: "lock-conflict", blocked_by: conflict.task_key };
    state.fencing_generation += 1;
    const priorAttempt = currentTask?.attempt ?? 0;
    const attempt = priorAttempt + 1;
    const leaseId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    const workerId = crypto.randomUUID();
    if (oneTimePilotAuthorized) {
      state.pilot_activation = {
        ...pilotActivation,
        status: "CONSUMED",
        dispatch_attempts: 1,
        consumed_at: now.toISOString(),
        consumed_run_id: runId,
      };
    }
    const expiresAtMs = nowMs + grant.limits.lease_seconds * 1000;
    const lease = {
      kind: "worker", lease_id: leaseId, task_key: contract.task_key, run_id: runId,
      attempt, fencing_token: state.fencing_generation, issued_at: now.toISOString(),
      expires_at: new Date(expiresAtMs).toISOString(), expires_at_ms: expiresAtMs,
      max_workers: effectiveMaximum, requests,
    };
    const run = createRunIdentityInternal(contract, grant, lease, { roleId, workerId, runId, attempt, baseSha, now });
    if (oneTimePilotAuthorized) {
      run.one_time_pilot_activation_id = pilotActivation.activation_id;
    }
    state.leases[leaseId] = lease;
    requests.forEach((request, index) => {
      state.reservations[`${leaseId}:${index}`] = {
        ...request, lease_id: leaseId, task_key: contract.task_key,
        fencing_token: lease.fencing_token, expires_at_ms: expiresAtMs,
      };
    });
    state.runs[runId] = run;
    state.tasks[contract.task_key] = {
      status: currentTask?.status ?? contract.status,
      phase,
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
      review_target: currentTask?.review_target ?? reviewTarget ?? null,
      implementation_run_id: currentTask?.implementation_run_id ?? reviewTarget?.implementation_run_id ?? null,
    };
    return { acquired: true, duplicate: false, lease: structuredClone(lease), run: structuredClone(run) };
  }).result;
}

export function isConsumedSyntheticPilotRunInternal(state, grant, run) {
  const activation = state.pilot_activation;
  return Boolean(run?.one_time_pilot_activation_id)
    && activation?.status === "CONSUMED"
    && activation.activation_id === run.one_time_pilot_activation_id
    && activation.consumed_run_id === run.run_id
    && activation.task_key === run.task_key
    && activation.authorization_id === grant.authorization_id
    && activation.contract_digest === grant.contract_digest
    && activation.card_blob_sha === grant.card_blob_sha
    && activation.dispatch_attempts === 1
    && grant.activation.synthetic_pilot_once?.task_key === run.task_key
    && grant.activation.synthetic_pilot_once?.max_dispatch_attempts === 1
    && grant.activation.synthetic_pilot_once?.max_workers === 1
    && !grant.activation.autonomous
    && grant.activation.worker_dispatch
    && grant.permissions.worker_dispatch;
}

function completionStatus({ processExitCode, outputValid, output, scopePassed, validationPassed, stale, action }) {
  if (stale) return "STALE";
  if (processExitCode !== 0) return "FAILED";
  if (!outputValid) return "INVALID_OUTPUT";
  if (output?.outcome === "FAILED") return "FAILED";
  const permitted = action === "review"
    ? ["APPROVED", "CHANGES_REQUESTED", "BLOCKED"].includes(output?.outcome)
    : output?.outcome === "COMPLETED";
  if (!permitted) return "INVALID_OUTPUT";
  if (!scopePassed) return "SCOPE_VIOLATION";
  if (!validationPassed) return "VALIDATION_FAILED";
  return "SUCCESS";
}

function authoritativeReviewResult({ output, contract, grant, capability, run, task, now }) {
  if (!output || typeof output.summary !== "string" || output.summary.length === 0) {
    throw new Error("Authoritative reviewer output requires a non-empty summary.");
  }
  const reviewEvidence = [canonicalJson({
    summary: output.summary,
    validation: output.validation ?? [],
    findings: output.findings ?? [],
    requested_actions: output.requested_actions ?? [],
  })];
  return ReviewRecordSchema.parse({
    schema_version: SCHEMA_VERSION,
    task_key: contract.task_key,
    contract_revision: contract.contract_revision,
    contract_digest: grant.contract_digest,
    authorization_revision: grant.authorization_revision,
    owner_role: grant.owner_role,
    reviewer_role: grant.reviewer_role,
    implementation_run_id: task.review_target.implementation_run_id,
    reviewer_run_id: run.run_id,
    reviewer_thread_id: run.thread_id,
    reviewer_worker_id: run.worker_id,
    reviewer_attempt: run.attempt,
    reviewed_base_sha: capability.reviewed_base_sha,
    reviewed_head_sha: capability.reviewed_head_sha,
    validation_digest: task.review_target.validation_digest,
    review_evidence: reviewEvidence,
    review_evidence_digest: sha256(reviewEvidence),
    review_completed_at: now.toISOString(),
    outcome: output.outcome,
  });
}

export function completeRunInternal({
  engine, contract, grant, capability, processExitCode, outputValid, output,
  actualHeadSha, scopeEvidence, validationEvidence, threadId, reportedModel,
  now = new Date(), verifyCard = true,
}) {
  const status = completionStatus({
    processExitCode, outputValid, output,
    scopePassed: scopeEvidence?.passed === true,
    validationPassed: validationEvidence?.passed === true,
    action: capability.action,
  });
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: capability.action,
    type: "run.completed", taskKey: capability.task_key, runId: capability.run_id,
    payload: { status, actual_head_sha: actualHeadSha }, now, verifyCard,
  }, (state, validated) => {
    const run = state.runs[validated.capability.run_id];
    const task = state.tasks[validated.capability.task_key];
    if (!["RESERVED", "RUNNING"].includes(run.status)) {
      throw new Error("Run completion requires a current unfinished authoritative run.");
    }
    const observedHead = engine.repoRoot ? actualHead(engine.repoRoot) : actualHeadSha;
    let observedScope = scopeEvidence;
    let authoritativeStatus = status;
    if (observedHead !== actualHeadSha
      || (validationEvidence?.actual_head_sha && validationEvidence.actual_head_sha !== observedHead)) {
      authoritativeStatus = "STALE";
    }
    if (engine.repoRoot) {
      try {
        const independentlyObserved = assertActualChangesAllowed({
          repoRoot: engine.repoRoot, baseSha: run.base_sha, grant: validated.grant,
        });
        observedScope = { ...independentlyObserved, passed: true };
        if (scopeEvidence?.evidence_digest !== independentlyObserved.evidence_digest) authoritativeStatus = "STALE";
      } catch (error) {
        authoritativeStatus = "SCOPE_VIOLATION";
        observedScope = { passed: false, evidence_digest: scopeEvidence?.evidence_digest ?? null };
      }
    }
    run.thread_id = threadId ?? run.thread_id;
    run.reported_model = reportedModel ?? run.reported_model;
    run.reported_outcome = output?.outcome ?? null;
    run.reported_head_sha = output?.head_sha ?? null;
    run.head_sha = observedHead;
    run.head_mismatch = Boolean(output?.head_sha && output.head_sha !== observedHead);
    run.process_exit_code = processExitCode;
    run.process_status = processExitCode === 0 ? "PROCESS_COMPLETED" : "FAILED";
    run.validation_digest = validationEvidence?.evidence_digest ?? null;
    run.scope_evidence_digest = observedScope?.evidence_digest ?? null;
    run.completed_at = now.toISOString();
    run.status = authoritativeStatus;
    if (authoritativeStatus === "SUCCESS" && validated.capability.action === "review") {
      run.review_result = authoritativeReviewResult({
        output,
        contract: validated.contract,
        grant: validated.grant,
        capability: validated.capability,
        run,
        task,
        now,
      });
    }
    state.validation_evidence[run.run_id] = validationEvidence ?? null;
    if (authoritativeStatus === "SUCCESS" && run.role_id === task.owner_role) {
      task.status = "REVIEW";
      task.phase = "INDEPENDENT_REVIEW";
      task.implementation_run_id = run.run_id;
      task.review_target = {
        implementation_run_id: run.run_id,
        implementation_worker_id: run.worker_id,
        implementation_thread_id: run.thread_id,
        reviewed_base_sha: run.base_sha,
        reviewed_head_sha: observedHead,
        validation_digest: run.validation_digest,
        implementation_evidence_digest: observedScope.evidence_digest,
      };
    }
    if (authoritativeStatus !== "SUCCESS") {
      removeLeaseAndReservations(state, validated.capability.lease_id);
    }
    return structuredClone(run);
  });
}

export function markRunStartedInternal({
  engine, contract, grant, capability, now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: capability.action,
    type: "run.started", taskKey: capability.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    const generalAuthorized = state.activation.authorized
      && validated.grant.activation.autonomous
      && validated.grant.activation.worker_dispatch
      && validated.grant.permissions.worker_dispatch;
    const oneTimePilotAuthorized = isConsumedSyntheticPilotRunInternal(
      state,
      validated.grant,
      state.runs[validated.capability.run_id],
    );
    if (!generalAuthorized && !oneTimePilotAuthorized) {
      throw new Error("Controller activation/worker dispatch is not authorized.");
    }
    const run = state.runs[validated.capability.run_id];
    if (run.status !== "RESERVED") throw new Error("Run is not reserved for start.");
    run.status = "RUNNING";
    return structuredClone(run);
  });
}

export function releaseTaskLeaseInternal({
  engine, contract, grant, capability, now = new Date(), verifyCard = true,
}) {
  return privilegedMutationInternal({
    engine, contract, grant, capability, action: capability.action,
    type: "lease.released", taskKey: capability.task_key, runId: capability.run_id,
    now, verifyCard,
  }, (state, validated) => {
    removeLeaseAndReservations(state, validated.capability.lease_id);
    return { released: true, released_at: now.toISOString() };
  });
}
