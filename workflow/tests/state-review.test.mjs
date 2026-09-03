import test from "node:test";
import assert from "node:assert/strict";
import {
  approvalStillValid,
  nextOwnerAfterChangesRequested,
  reduceState,
  transition,
} from "../state.mjs";
import { validateIndependentReview } from "../review.mjs";
import { planCorrection } from "../correction.mjs";
import { closeoutPlan } from "../closeout.mjs";

const ids = {
  implementationRun: "11111111-1111-4111-8111-111111111111",
  reviewerRun: "22222222-2222-4222-8222-222222222222",
  contributor: "33333333-3333-4333-8333-333333333333",
  reviewer: "44444444-4444-4444-8444-444444444444",
};

function review(overrides = {}) {
  return {
    schema_version: "1.0.0",
    task_key: "task-alpha",
    contract_revision: 1,
    policy_revision: "autonomous-policy-v1",
    owner_role: "TECHNICAL_SEO",
    reviewer_role: "QA_PERFORMANCE",
    implementation_run_id: ids.implementationRun,
    reviewer_run_id: ids.reviewerRun,
    implementation_thread_id: "thread-implementation",
    reviewer_thread_id: "thread-review",
    reviewed_base_sha: "a".repeat(40),
    reviewed_head_sha: "b".repeat(40),
    implementation_contributors: [ids.contributor],
    reviewer_worker_id: ids.reviewer,
    validation_digest: "c".repeat(64),
    outcome: "APPROVED",
    ...overrides,
  };
}

function contract() {
  return {
    task_key: "task-alpha",
    contract_revision: 1,
    owner_role: "TECHNICAL_SEO",
    reviewer_role: "QA_PERFORMANCE",
    branch: "codex/task-alpha",
    worktree: "worktrees/task-alpha",
    limits: { max_correction_cycles: 3 },
    administrative_files: ["tasks/task-alpha.md", "worklog/task-alpha.md"],
    write_files: ["tasks/task-alpha.md", "worklog/task-alpha.md"],
    write_prefixes: [],
  };
}

function currentBinding(approval = review()) {
  return {
    head_sha: approval.reviewed_head_sha,
    base_sha: approval.reviewed_base_sha,
    contract_revision: approval.contract_revision,
    policy_revision: approval.policy_revision,
    validation_digest: approval.validation_digest,
  };
}

test("illegal state transition is rejected", () => {
  assert.throws(() => transition(
    { status: "READY", phase: "QUEUED" },
    { status: "APPROVED", phase: "CLOSEOUT" },
    { reason: "skip" },
  ));
});

test("state reducer applies evidence-backed legal events", () => {
  const next = reduceState(
    { status: "IN_PROGRESS", phase: "VALIDATE" },
    { type: "validation.passed", evidence: { command: "tests", outcome: "PASS" } },
  );
  assert.deepEqual({ status: next.status, phase: next.phase }, {
    status: "REVIEW",
    phase: "INDEPENDENT_REVIEW",
  });
});

test("reviewer role equal to owner role is rejected", () => {
  assert.throws(() => validateIndependentReview(review({ reviewer_role: "TECHNICAL_SEO" })));
});

test("reviewer run reused from implementation is rejected", () => {
  assert.throws(() => validateIndependentReview(review({ reviewer_run_id: ids.implementationRun })));
});

test("reviewer thread reused from implementation is rejected", () => {
  assert.throws(() => validateIndependentReview(review({ reviewer_thread_id: "thread-implementation" })));
});

test("implementation contributor cannot review", () => {
  assert.throws(() => validateIndependentReview(review({ reviewer_worker_id: ids.contributor })));
});

test("implementation modification after approval invalidates approval", () => {
  const approval = review();
  assert.equal(approvalStillValid(approval, {
    head_sha: "d".repeat(40),
    base_sha: approval.reviewed_base_sha,
    contract_revision: approval.contract_revision,
    policy_revision: approval.policy_revision,
    validation_digest: approval.validation_digest,
  }), false);
});

test("closeout cannot modify approved implementation", () => {
  assert.throws(() => closeoutPlan(contract(), review(), {
    changedFiles: ["src/app/layout.tsx"],
    implementationChanged: true,
    current: currentBinding(),
  }));
});

test("CHANGES_REQUESTED returns to owner role", () => {
  const task = contract();
  const plan = planCorrection(task, {
    outcome: "CHANGES_REQUESTED",
    findings: [{ severity: "MAJOR", message: "fix" }],
  }, 0);
  assert.equal(plan.owner_role, nextOwnerAfterChangesRequested(task));
  assert.equal(plan.next_cycle, 1);
  assert.equal(plan.requires_fresh_reviewer_after_validation, true);
});

test("correction-cycle limit blocks after three cycles", () => {
  const plan = planCorrection(contract(), {
    outcome: "CHANGES_REQUESTED",
    findings: [{ severity: "MAJOR", message: "fix" }],
  }, 3);
  assert.equal(plan.status, "BLOCKED");
  assert.equal(plan.reason, "correction-cycle-limit");
});

test("APPROVED triggers closeout once", () => {
  const first = closeoutPlan(contract(), review(), {
    changedFiles: ["tasks/task-alpha.md"],
    current: currentBinding(),
  });
  const second = closeoutPlan(contract(), review(), {
    changedFiles: ["tasks/task-alpha.md"],
    priorCloseoutKeys: new Set([first.idempotency_key]),
    current: currentBinding(),
  });
  assert.equal(first.should_run, true);
  assert.equal(second.should_run, false);
});

test("closeout fails closed without current approval binding", () => {
  assert.throws(() => closeoutPlan(contract(), review(), {
    changedFiles: ["tasks/task-alpha.md"],
  }), /current approval-binding evidence/);
});
