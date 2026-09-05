import { stateKey } from "./constants.mjs";

const transitions = new Map([
  ["DRAFT/INTAKE", new Set(["READY/QUEUED", "BLOCKED/INTAKE", "ON_HOLD/INTAKE"])],
  ["READY/QUEUED", new Set(["IN_PROGRESS/IMPLEMENT", "BLOCKED/QUEUED", "ON_HOLD/QUEUED"])],
  ["IN_PROGRESS/IMPLEMENT", new Set(["IN_PROGRESS/VALIDATE", "BLOCKED/IMPLEMENT", "ON_HOLD/IMPLEMENT"])],
  ["IN_PROGRESS/CORRECT", new Set(["IN_PROGRESS/VALIDATE", "BLOCKED/CORRECT", "ON_HOLD/CORRECT"])],
  ["IN_PROGRESS/VALIDATE", new Set(["REVIEW/INDEPENDENT_REVIEW", "BLOCKED/VALIDATE", "ON_HOLD/VALIDATE"])],
  ["REVIEW/INDEPENDENT_REVIEW", new Set([
    "CHANGES_REQUESTED/CORRECT",
    "APPROVED/CLOSEOUT",
    "BLOCKED/INDEPENDENT_REVIEW",
    "ON_HOLD/INDEPENDENT_REVIEW",
  ])],
  ["CHANGES_REQUESTED/CORRECT", new Set(["IN_PROGRESS/VALIDATE", "BLOCKED/CORRECT", "ON_HOLD/CORRECT"])],
  ["APPROVED/CLOSEOUT", new Set(["APPROVED/PR_READY", "BLOCKED/CLOSEOUT", "ON_HOLD/CLOSEOUT"])],
  ["APPROVED/PR_READY", new Set(["APPROVED/WAITING_FOR_MERGE", "BLOCKED/PR_READY", "ON_HOLD/PR_READY"])],
  ["APPROVED/WAITING_FOR_MERGE", new Set(["MERGED/COMPLETE", "BLOCKED/WAITING_FOR_MERGE", "ON_HOLD/WAITING_FOR_MERGE"])],
]);

export function assertStatePair(status, phase) {
  const key = stateKey(status, phase);
  const known = transitions.has(key)
    || key === "MERGED/COMPLETE"
    || key.startsWith("BLOCKED/")
    || key.startsWith("ON_HOLD/");
  if (!known) throw new Error(`Unsupported status/phase pair: ${key}`);
  return true;
}

export function canTransition(from, to) {
  assertStatePair(from.status, from.phase);
  assertStatePair(to.status, to.phase);
  if (from.status === "BLOCKED" || from.status === "ON_HOLD" || from.status === "MERGED") {
    return false;
  }
  return transitions.get(stateKey(from.status, from.phase))?.has(stateKey(to.status, to.phase))
    ?? false;
}

export function transition(from, to, evidence) {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal state transition: ${stateKey(from.status, from.phase)} -> ${stateKey(to.status, to.phase)}`);
  }
  if (!evidence || typeof evidence !== "object") {
    throw new Error("State transition requires structured evidence.");
  }
  return { ...to, evidence };
}

const eventTargets = Object.freeze({
  "task.authorized": { status: "READY", phase: "QUEUED" },
  "worker.started": { status: "IN_PROGRESS", phase: "IMPLEMENT" },
  "implementation.completed": { status: "IN_PROGRESS", phase: "VALIDATE" },
  "validation.passed": { status: "REVIEW", phase: "INDEPENDENT_REVIEW" },
  "review.changes_requested": { status: "CHANGES_REQUESTED", phase: "CORRECT" },
  "review.approved": { status: "APPROVED", phase: "CLOSEOUT" },
  "closeout.completed": { status: "APPROVED", phase: "PR_READY" },
  "pr.prepared": { status: "APPROVED", phase: "WAITING_FOR_MERGE" },
  "merge.observed": { status: "MERGED", phase: "COMPLETE" },
});

export function reduceState(current, event) {
  if (!event || typeof event !== "object" || !event.type || !event.evidence) {
    throw new Error("Reducer requires a structured event with evidence.");
  }
  if (event.type === "task.blocked") {
    return transition(current, { status: "BLOCKED", phase: current.phase }, event.evidence);
  }
  if (event.type === "task.held") {
    return transition(current, { status: "ON_HOLD", phase: current.phase }, event.evidence);
  }
  const target = eventTargets[event.type];
  if (!target) throw new Error(`Unknown state event: ${event.type}`);
  return transition(current, target, event.evidence);
}

export function approvalStillValid(approval, current) {
  return approval.reviewed_head_sha === current.head_sha
    && approval.reviewed_base_sha === current.base_sha
    && approval.contract_revision === current.contract_revision
    && approval.contract_digest === current.contract_digest
    && approval.authorization_revision === current.authorization_revision
    && approval.reviewer_run_id === current.reviewer_run_id
    && approval.reviewer_worker_id === current.reviewer_worker_id
    && approval.reviewer_thread_id === current.reviewer_thread_id
    && approval.reviewer_attempt === current.reviewer_attempt
    && approval.validation_digest === current.validation_digest
    && approval.review_evidence_digest === current.review_evidence_digest;
}

export function nextOwnerAfterChangesRequested(contract) {
  return contract.owner_role;
}
