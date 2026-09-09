# Task 58 — SYS-AUTO-007 Expired SUCCESS Closeout Recovery

- **Task Key:** `sys-auto-007-expired-success-closeout`
- **Task ID:** `SYS-AUTO-007 Delta`
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent review required)
- **Status:** `REVIEW`
- **Priority:** `P0`
- **Risk:** `HIGH`
- **Branch:** `codex/58-sys-auto-expired-success-closeout`
- **Worktree:** `worktrees/sys-auto-007-expired-success-closeout`
- **Base:** `b5e8e605845bf69518967a18b0e427222363b620`

## Goal

Add one controller-owned administrative recovery operation that releases the
exact expired worker lease and its active reservations for an already-terminal
`SUCCESS` run. The operation must preserve the successful run and append durable
release evidence without scheduling, dispatching, or executing work.

## Required Behavior

- Require exact `task_key`, `run_id`, and `lease_id` ownership and matching
  fencing/task state.
- Permit recovery only when the authoritative run is `SUCCESS` and its exact
  worker lease has expired.
- Remove only that lease and reservations bound to that lease from live state.
- Preserve the run status and historical lease/reservation evidence in the
  append-only controller journal.
- Make a second exact recovery call a no-op with no additional journal event.
- Reject live leases, non-success runs, mismatched identities, and inconsistent
  partial cleanup.

## Explicit File Allowlist

```text
workflow/admin/authority-admin.mjs
workflow/internal/lease-engine.mjs
workflow/tests/expired-success-closeout.test.mjs
tasks/58-sys-auto-expired-success-closeout.md
worklog/agent-58-sys-auto-expired-success-closeout.md
```

Every other repository path and every canonical controller artifact is outside
scope.

## Out of Scope

- Scheduler admission, dispatch, retries, activation or Grant lifecycle.
- Worker, thread, model, output, review, publishing, or permission behavior.
- General stale-resource cleanup or lease/capability redesign.
- Mutation of canonical controller state during implementation or validation.
- Recovery of the observed canonical run before this patch is independently
  reviewed, merged, and separately authorized for administration.

## Validation

```bash
node --test workflow/tests/expired-success-closeout.test.mjs
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
git diff --check
```

## Coordination Items

- The observed canonical run, lease, reservations, authority, state, journal,
  and output remain read-only during implementation and validation.
- A later canonical recovery requires separate explicit authorization after
  independent review and merge.

## Completion Record

- Implemented an exact synthetic-pilot administration facade and internal
  expired-`SUCCESS` recovery transition.
- Focused closeout recovery tests: `8/8` passed, including fail-closed
  idempotency checks for retained-fence mismatch, a competing run lease, and a
  conflicting task reservation.
- Full workflow tests: `205/205` passed under the controller principal.
- `validate --all`, `reconcile --dry-run`, `tick --dry-run`, lint, typecheck,
  and `git diff --check`: passed.
- Canonical authority fingerprint remained
  `c417a74d395f271cb5429dcfee83b443a3a752e9f136e1ee9440db7873be84a8`.
- Canonical controller-state hash remained
  `9341341539778aa88afae27d021b32b3a2822d5107a2a292631d572d2f48f064`.
- Canonical journal hash remained
  `15701d57f57d1dd84a2b4eea1b1968cd14e07e751136d63f2f6e5fc1d6cdb442`.
- Fresh independent review remains required before merge or canonical recovery.

## Rollback

Revert the task commit. The implementation and tests do not execute recovery
against canonical state, so no canonical rollback is required.
