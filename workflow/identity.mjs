import crypto from "node:crypto";
import { RunIdentitySchema } from "./schemas.mjs";
import { configurationDigest } from "./contract.mjs";

export function createRunIdentity(contract, {
  roleId,
  workerId = crypto.randomUUID(),
  threadId = "PENDING",
  runId = crypto.randomUUID(),
  attempt,
  reportedModel = null,
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
    executor_platform: contract.routing.executor_platform,
    provider: contract.routing.provider,
    requested_model: contract.routing.requested_model,
    reported_model: reportedModel,
    reasoning_effort: contract.routing.reasoning_effort,
    configuration_digest: configurationDigest(contract),
    started_at: now.toISOString(),
    completed_at: null,
  });
}

export function bindReportedThread(identity, reportedThreadId) {
  if (!reportedThreadId || reportedThreadId === "PENDING") {
    throw new Error("Runtime must report a concrete thread ID.");
  }
  if (identity.thread_id !== "PENDING" && identity.thread_id !== reportedThreadId) {
    throw new Error("Runtime thread ID does not match controller binding.");
  }
  return RunIdentitySchema.parse({ ...identity, thread_id: reportedThreadId });
}
