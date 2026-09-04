import crypto from "node:crypto";
import { RunIdentitySchema } from "./schemas.mjs";
import { configurationDigest } from "./contract.mjs";

export function createRunIdentity(contract, grant, lease, {
  roleId,
  workerId = crypto.randomUUID(),
  threadId = "PENDING",
  runId = crypto.randomUUID(),
  attempt = lease.attempt,
  reportedModel = null,
  baseSha,
  now = new Date(),
} = {}) {
  if (workerId === runId) throw new Error("worker_id and run_id must be distinct.");
  return RunIdentitySchema.parse({
    task_key: contract.task_key,
    role_id: roleId,
    worker_id: workerId,
    thread_id: threadId,
    run_id: runId,
    attempt,
    executor_platform: grant.routing.executor_platform,
    provider: grant.routing.provider,
    requested_model: grant.routing.requested_model,
    reported_model: reportedModel,
    reasoning_effort: grant.routing.reasoning_effort,
    configuration_digest: configurationDigest(contract),
    contract_digest: grant.contract_digest,
    authorization_revision: grant.authorization_revision,
    lease_id: lease.lease_id,
    fencing_token: lease.fencing_token,
    base_sha: baseSha,
    started_at: now.toISOString(),
    completed_at: null,
    status: "RESERVED",
  });
}

export function bindReportedThread(identity, reportedThreadId) {
  if (!reportedThreadId || reportedThreadId === "PENDING") {
    throw new Error("Runtime must report a concrete thread ID.");
  }
  if (identity.thread_id !== "PENDING" && identity.thread_id !== reportedThreadId) {
    throw new Error("Runtime thread ID does not match controller binding.");
  }
  return RunIdentitySchema.parse({ ...identity, thread_id: reportedThreadId, status: "RUNNING" });
}
