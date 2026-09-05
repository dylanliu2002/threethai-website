import { RunIdentitySchema } from "./schemas.mjs";
import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { createRunIdentityInternal } from "./internal/identity-engine.mjs";

export function createRunIdentity(contract, grant, lease, options = {}) {
  assertNoAuthorityOverrides(options);
  return createRunIdentityInternal(contract, grant, lease, { ...options, now: new Date() });
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
