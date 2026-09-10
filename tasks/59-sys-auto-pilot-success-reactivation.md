# Task 59 — SYS-AUTO-007 Fresh Pilot Reactivation After Terminal Run

- **Task Key:** `sys-auto-007-pilot-success-reactivation`
- **Task ID:** `SYS-AUTO-007 Delta`
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent review required)
- **Status:** `READY_FOR_REVIEW`
- **Priority:** `P0`
- **Risk:** `HIGH`
- **Branch:** `codex/59-sys-auto-pilot-success-reactivation`
- **Worktree:** `worktrees/sys-auto-pilot-success-reactivation`
- **Base:** `cd2fe5b797af122ecb01e4ed5c4bf90a82b596bf`

## Goal

Make a fresh, explicitly authorized one-shot synthetic-pilot activation start a
new implementation cycle after a prior terminal run instead of inheriting the
prior run's `REVIEW / INDEPENDENT_REVIEW` task projection. A scheduler wakeup
that was durably observed but produced no Run must not strand that still-READY
activation.

## Required Behavior

- Apply only to the exact one-time synthetic pilot authorization path.
- Require `READY`, `dispatch_attempts=0`, exact current Grant/card/contract
  binding, and no Run already bound to the activation.
- Start the fresh dispatch using the Task Contract's owner Role, status, and
  phase; reset only current-cycle review/approval pointers.
- Preserve every prior Run, activation, wakeup, journal event, and historical
  evidence.
- Permit a previously observed activation-scoped wakeup to reach admission only
  while the exact activation remains unconsumed and has no bound Run.
- After dispatch, consume the activation exactly once and continue rejecting
  repeated delivery of the same wakeup.
- Fail closed when the prior current Run is not terminal or when a wakeup is
  owned by another task.

## Explicit File Allowlist

```text
workflow/internal/lease-engine.mjs
workflow/tests/pilot-activation.test.mjs
tasks/59-sys-auto-pilot-success-reactivation.md
worklog/agent-59-sys-auto-pilot-success-reactivation.md
```

Every other repository path and every canonical controller artifact is outside
scope.

## Out of Scope

- Grant issuance, rotation, authenticity, expiry, or contract policy.
- Activation creation or retirement schema changes.
- Worker, model, output, closeout, permission, network, or retry redesign.
- Clearing or rewriting wakeups, Runs, activations, or journal history.
- Canonical controller mutation during implementation or validation.

## Validation

```bash
node --test workflow/tests/pilot-activation.test.mjs
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
git diff --check
```

Completed validation:

- Focused pilot lifecycle tests: `31/31 PASS`.
- Full workflow tests in a disposable authority context: `210/210 PASS`.
- `validate --all`: `PASS`.
- `reconcile --dry-run`: `PASS`, no mutations.
- `tick --dry-run`: `PASS`, no mutations.
- Task-scoped ESLint: `PASS`.
- Typecheck: `PASS`.
- `git diff --check`: `PASS`.
- Repository-wide ESLint still reports only the two pre-existing React effect
  baseline findings outside this Task's allowlist; Task 59 does not modify them.
- Canonical authority, controller state, and journal hashes remained unchanged.

## Rollback

Revert the Task 59 commit. Tests use disposable authority only; no canonical
rollback is required.
