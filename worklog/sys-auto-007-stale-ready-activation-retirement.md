# Worklog — SYS-AUTO-007 Stale READY Activation Retirement

## 2026-09-08 — Implementation start

- Created an isolated branch and worktree from
  `d34cd9560870c15da922a84f4dab7808201dd89d`.
- Confirmed intervening main changes did not overlap controller paths.
- Scoped the change to an administration-only terminal activation transition,
  durable historical evidence, rotation admission, and focused regressions.
- Canonical controller state, Grant, activation, journal, and worker runtime
  were not mutated or invoked.

## 2026-09-08 — Implementation and validation

- Added the administration-only
  `retireExpiredReadySyntheticPilotActivation` operation for the exact
  synthetic pilot task. The operation authenticates the installed Grant using
  the pinned controller trust anchor, requires it to be truly expired, and
  requires the bound activation to be exactly `READY`, undispatched, and
  unconsumed with one allowed dispatch, no associated run, no live lease or
  reservation, and general automation disabled.
- Added the terminal `RETIRED_BEFORE_DISPATCH` state and reason
  `GRANT_EXPIRED_BEFORE_DISPATCH`. The transition retains the original
  activation fields, adds retirement metadata, stores the complete pre-change
  activation in append-only retirement history, and appends the
  `controller.synthetic-pilot.retired-before-dispatch` journal event.
- Updated expired-Grant rotation admission to accept the terminal state only
  after exact
  durable retirement evidence is present. A forged terminal status remains
  blocked. Retirement, Grant rotation, and fresh activation each require a
  distinct, previously unused human authorization ID.
- Added seven focused regressions for successful retirement, no-dispatch and
  state preservation, journal replay, rejection of `CONSUMED`, rejection of an
  unexpired Grant, forged-state rejection, subsequent rotation, fresh
  activation, and public administration-boundary enforcement.
- Focused tests passed `31/31`. Full workflow tests passed `169/169` in a
  disposable, repository-distinct clone with its own unprovisioned authority
  namespace; the clone was removed after the run. The isolated run avoided
  exposing the canonical READY activation to non-dry scheduler tests.
- `validate --all`, `reconcile --dry-run`, `tick --dry-run`, lint, typecheck,
  and `git diff --check` passed. Dry-run output reported zero mutations,
  dispatches, workers, automations, GitHub mutations, publishing actions, and
  Grants created.
- Every canonical authority file hash was identical before and after
  validation. Controller state remained revision `21` at SHA-256
  `da13c169e0eabb8ab61323e65779863c1c448352fc18c73f66bca5a193c51ac6`;
  journal remained event count `21` at SHA-256
  `cf101fe2f3175f7a4d2289059674a0eedf989f112bc666f0656cd7007d0a1a5d`;
  and the canonical Grant file remained SHA-256
  `86216563d259c05eae7290ebdc1e07e2f604f80123e6d3fcc3d28a83204ba122`.
- Canonical activation `e8a5889a-6381-46da-ab2b-4e4c0dc9041b` remained
  `READY` with `dispatch_attempts=0`. No Grant or archive changed; no new
  activation, dispatch, run, lease, reservation, worker, thread, or model
  invocation occurred.
- The implementation is ready for fresh independent review. The implementer
  does not approve or merge this task.
