# Task SYS-AUTO-007 Delta — Retire an Expired-Grant READY Pilot Activation

- **Task Key:** `sys-auto-007-stale-ready-activation-retirement`
- **Machine Contract:** None; this is controller administration implementation only
- **Machine Phase:** None
- **Task ID:** `SYS-AUTO-007 Delta`
- **Mode:** `IMPLEMENT`
- **Execution Responsibility:** `IMPLEMENTER`
- **Governance Role / Owner:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Priority:** `P0`
- **Status:** `IN_PROGRESS`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-007-stale-ready-retirement`
- **Worktree:** `worktrees/sys-auto-007-stale-ready-retirement`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent review required)
- **Base:** `d34cd9560870c15da922a84f4dab7808201dd89d`
- **depends_on:** SYS-AUTO-007 merged implementation

## Authorization and Goal

The user authorized implementation of the minimum administration-only lifecycle
transition needed when a one-shot synthetic-pilot activation remains `READY`
but its exactly bound authentic Grant expired before dispatch. The transition
must retire that activation without representing it as consumed, preserve its
complete evidence, and allow the existing expired-Grant rotation path to run
only after a separate human authorization.

This Task does not authorize execution against the canonical controller store,
Grant rotation, activation creation, scheduler tick, dispatch, worker or model
execution, GitHub mutation, publishing, deployment, DNS, or production action.

## File Allowlist

```text
workflow/admin/authority-admin.mjs
workflow/internal/controller-state-engine.mjs
workflow/internal/pilot-admin-engine.mjs
workflow/schemas.mjs
workflow/tests/expired-grant-rotation.test.mjs
```

Task-owned administrative files are this card and
`worklog/sys-auto-007-stale-ready-activation-retirement.md` (append only).
Every other repository file and every canonical controller artifact is outside
scope.

## Required Behavior

- Expose the transition only through the controller administration surface.
- Require a fresh human authorization ID and the exact synthetic-pilot task.
- Authenticate the installed Grant against the pinned controller identity and
  require it to be truly expired.
- Require an exact `READY` activation binding to that Grant, one maximum
  dispatch attempt, zero dispatch attempts, no consumed identity/timestamp, no
  associated run, no live lease, no live reservation, and general activation
  off.
- Transition to terminal `RETIRED_BEFORE_DISPATCH` with reason
  `GRANT_EXPIRED_BEFORE_DISPATCH` and append one journal event.
- Preserve a complete immutable copy of the pre-retirement activation in
  dedicated durable retirement history.
- Permit the existing rotation path to accept `RETIRED_BEFORE_DISPATCH` only
  when its durable retirement evidence is present and consistent.
- Do not modify the Grant, archive, Task Contract, activation authorization
  history, runs, leases, reservations, or prior journal events.

## Validation

```bash
git diff --check
node --test workflow/tests/expired-grant-rotation.test.mjs
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
```

Tests must prove successful retirement and journal replay, rejection of
`CONSUMED`, rejection of an unexpired Grant, exact historical preservation, and
the separately authorized retire -> rotate -> fresh-activation lifecycle.

## Coordination Items

- `origin/main` advanced from the last SYS-AUTO-007 merge through an unrelated
  translation change only; no controller-path drift was present at task start.
- Canonical activation `e8a5889a-6381-46da-ab2b-4e4c0dc9041b` remains outside
  implementation scope and must not be mutated by this Task.
- Canonical execution of this new administration operation requires a separate
  human authorization after merge.

## Completion Record

- Implementation commit: pending
- Validation results: pending
- Canonical controller state mutated: `NO`
- Grant changed: `NO`
- Activation created: `NO`
- Worker/model executed: `NO`

## Rollback

Before merge, withhold this branch. After an authorized merge, revert the
implementation commit. No runtime rollback is part of this Task because the
canonical operation is not executed during implementation or review.
