# Infrastructure Task SYS-AUTO-005 — Pilot Runtime Compatibility Fix

- **Task Key:** `sys-auto-005-pilot-runtime-compat`
- **Display Task ID:** `SYS-AUTO-005`
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Requested Model:** GPT-5.6 Sol
- **Reasoning Effort:** `high`
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Machine Phase:** `INDEPENDENT_REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-005-pilot-runtime-compat`
- **Worktree:** `worktrees/sys-auto-005-pilot-runtime-compat`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent run required)
- **Base:** `46274ed17100f2f9296b7f234729011d1175f482`
- **depends_on:** SYS-AUTO-004 (merged)

## Authorization and Goal

The user explicitly authorized SYS-AUTO-005 on 2026-09-06. Make the smallest
compatibility correction for the two defects observed during the first real
controller-dispatched synthetic worker attempt:

1. Codex CLI 0.153.4 rejects `--ask-for-approval never` for `codex exec`.
2. A terminal pre-thread CLI failure leaves the worker lease and reservations
   present after the run has become terminal.

The consumed historical pilot activation must remain consumed. This Task does
not authorize a new Grant, activation, dispatch, non-dry-run tick, worker,
publishing action, production action, deployment, DNS action, or existing-Task
adoption.

## Historical Runtime Evidence

Read-only preflight matched the authorized record exactly:

- Pilot activation: `CONSUMED`
- Human authorization ID: `9281b4e4-c5fa-4ea5-a468-e9ef6501798b`
- Run ID: `e9bb0de2-8a33-475d-87ff-c202bad182f8`
- Worker ID: `b5ad9607-6d78-427f-86a1-033d6439006d`
- Lease ID: `f2de4346-3310-4dc4-9b65-5ac1d475d5b6`
- Fencing token: `1`
- Run status: `FAILED`
- Lease expiry: `2026-09-06T10:56:19.765Z` (expired when inspected)
- Grant count: `1`
- Live worker leases in durable state: `1`
- Dispatch attempts: `1`
- General activation: `OFF`

No canonical runtime state was changed during this inspection.

## File Allowlist

```text
workflow/pilot-security.mjs
workflow/internal/run-engine.mjs
workflow/internal/lease-engine.mjs
workflow/tests/pilot-safety.test.mjs
workflow/tests/pilot-activation.test.mjs
tasks/sys-auto-005-pilot-runtime-compat.md
tasks/machine/sys-auto-005-pilot-runtime-compat.json
worklog/sys-auto-005-pilot-runtime-compat.md
```

No application source, public asset, package/lock file, deployment
configuration, existing Task artifact, or canonical controller runtime artifact
is granted.

## Acceptance Criteria

- Generated worker arguments contain no `--ask-for-approval` token.
- Exactly one Codex configuration override sets `approval_policy="never"`.
- Installed Codex CLI 0.153.4 accepts the generated approval configuration in
  a non-network, no-thread parser smoke check.
- Elevated/offline Windows sandbox enforcement, Role-derived sandboxing, user
  and rule isolation, feature disabling, provider/model pinning, and
  `network=false` remain unchanged.
- A non-zero pre-thread Codex exit with no structured output records terminal
  `FAILED`, atomically removes its worker lease and reservations, leaves the
  activation `CONSUMED` with one dispatch attempt, and cannot dispatch a second
  worker.
- No real worker is dispatched and the historical canonical runtime state is
  not mutated.

## Validation

```bash
git diff --check
node workflow/cli.mjs validate --all
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
```

The focused pilot regression suite includes the non-network Codex CLI parser
smoke check.

## Coordination Items

- Historical lease cleanup requires separate human authorization after this
  fix is independently reviewed and merged. No cleanup is performed by
  SYS-AUTO-005.
- The existing reviewed recovery path is a separately authorized call to
  `reserveTaskDispatch("sys-auto-pilot-001-synthetic-fixture", { repoRoot,
  wakeupId })` from `workflow/durable-leases.mjs`, using the exact pilot
  worktree as `repoRoot` and a fresh recovery-only wakeup ID. Admission first
  validates the canonical Grant, then atomically sweeps the expired lease and
  reservations, and finally returns `activation-disabled` because the pilot is
  consumed. This path must not be invoked by this Task. If the one-hour Grant
  has expired before recovery is separately authorized, the existing public
  path fails closed before the sweep; a new narrowly scoped administrative
  recovery authorization/path would then be required.

## Review Status

- Outcome: Pending independent `QA_PERFORMANCE` review.
- Independent reviewer evidence: Not yet recorded.

## Completion Record

- Implementation / handoff commit: Reported after commit and push
- Base / rebase commit: `46274ed17100f2f9296b7f234729011d1175f482`
- Changed files:
  - `workflow/pilot-security.mjs`
  - `workflow/internal/lease-engine.mjs`
  - `workflow/tests/pilot-safety.test.mjs`
  - `workflow/tests/pilot-activation.test.mjs`
  - `tasks/sys-auto-005-pilot-runtime-compat.md`
  - `tasks/machine/sys-auto-005-pilot-runtime-compat.json`
  - `worklog/sys-auto-005-pilot-runtime-compat.md`
- Validation results:
  - Approval configuration contains exactly one
    `-c approval_policy="never"` and no `--ask-for-approval`: `PASS`
  - Codex CLI 0.153.4 no-network/no-thread parser smoke: `PASS`
  - Pre-thread non-zero exit records `FAILED`, releases lease/reservations,
    preserves `CONSUMED` / one attempt, and blocks the second dispatch: `PASS`
  - Expired historical failed-lease recovery-path regression: `PASS`
  - Focused pilot suites: `42/42 PASS`
  - Complete workflow suite: `128/128 PASS`
  - `node workflow/cli.mjs validate --all`: `PASS`
  - `node workflow/cli.mjs reconcile --dry-run`: `PASS` (zero mutations/workers)
  - `node workflow/cli.mjs tick --dry-run`: `PASS` (zero workers/external actions)
  - `npm run lint`: `PASS`
  - `npm run typecheck`: `PASS`
  - `git diff --check`: `PASS`
- Worklog: `worklog/sys-auto-005-pilot-runtime-compat.md`
- Historical canonical state mutation: `NO`; activation remains `CONSUMED`,
  the Grant remains installed, and the expired lease remains present.
- Real worker executed by SYS-AUTO-005: `NO`
- Remaining risks: Historical expired lease remains in canonical state until a
  separately authorized recovery action. Independent `QA_PERFORMANCE` review
  is required before merge.

## Rollback

Revert the SYS-AUTO-005 implementation commit. Runtime rollback is not part of
this Task because no canonical state mutation or real worker dispatch is
authorized.
