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
- **Status:** `REVIEW`
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

- Final fetched/rebase base: `d34cd9560870c15da922a84f4dab7808201dd89d`
  (`origin/main` unchanged; rebase was a no-op)
- Implementation commit: `0303b24daf9488e931f7960d79d3cb0a31107841`
- Focused expiry/rotation/retirement tests: `31/31` passed
- Full workflow tests: `169/169` passed in a disposable independent clone
  with an unprovisioned, repository-distinct authority namespace; the clone was
  deleted after the run
- `validate --all`: passed (`4` contracts; secret scan `87` files)
- `reconcile --dry-run`: passed; revision/event count `21/21`, zero mutations,
  zero live leases and zero reservations
- `tick --dry-run`: passed; zero dispatches, mutations, workers, automation,
  GitHub mutations, publishing actions, or Grants created
- Lint, typecheck, and `git diff --check`: passed
- Canonical controller state SHA-256 before/after:
  `da13c169e0eabb8ab61323e65779863c1c448352fc18c73f66bca5a193c51ac6`
- Canonical journal SHA-256 before/after:
  `cf101fe2f3175f7a4d2289059674a0eedf989f112bc666f0656cd7007d0a1a5d`
- Canonical Grant file SHA-256 before/after:
  `86216563d259c05eae7290ebdc1e07e2f604f80123e6d3fcc3d28a83204ba122`
- All six canonical authority files were byte-identical before and after
  validation; activation remained `READY` with `dispatch_attempts=0`
- Canonical controller state mutated: `NO`
- Grant changed: `NO`
- Activation created: `NO`
- Worker/model executed: `NO`

## Rollback

Before merge, withhold this branch. After an authorized merge, revert the
implementation commit. No runtime rollback is part of this Task because the
canonical operation is not executed during implementation or review.
