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
  after exact durable retirement evidence is present. A forged terminal status
  remains blocked. Retirement, Grant rotation, and fresh activation each require a
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
- Final pre-review fetch confirmed `origin/main` remained
  `d34cd9560870c15da922a84f4dab7808201dd89d`. Rebasing the task branch
  onto that exact commit was a no-op.

## 2026-09-08 — Independent-review remediation

- Fresh independent review of
  `98b5814ed2847d39e51ea19bf90a794138bbdd2e` returned `CHANGES_REQUIRED`.
  The blocker showed that the successful test fixture supplied
  `max_dispatch_attempts` even though the real activation constructor does not;
  the major finding showed that retirement evidence could be reused while
  rotating a different authentic expired Grant.
- Updated the retirement path to operate on the real activation schema. The
  fixture now creates the `READY` activation through
  `enableSyntheticPilotOnceInternal`, and the successful regression asserts
  that the constructed activation has no fixture-only maximum-attempt field.
- Bound retirement history and its append-only journal event to the expired
  Grant authorization ID, Grant digest, contract digest, and card blob. The
  rotation admission check receives the exact Grant being rotated and rejects
  evidence whose activation or Grant bindings do not match it.
- Added a cross-Grant regression that retires against Grant A, installs a
  different authentic expired Grant B in the disposable authority, and proves
  rotation is rejected before archive, state, or journal mutation.
- Focused tests passed `32/32`; the complete workflow suite passed `170/170` in
  a disposable exact-head clone with an unprovisioned authority namespace.
  `validate --all`, `reconcile --dry-run`, `tick --dry-run`, lint, typecheck,
  syntax checking, and `git diff --check` passed.
- Canonical state was read only. All six canonical authority hashes matched the
  pre-remediation baseline, controller state remained revision `21`, journal
  remained at `21` events, and activation
  `e8a5889a-6381-46da-ab2b-4e4c0dc9041b` remained `READY` with
  `dispatch_attempts=0`. No Grant rotation, activation creation, retirement,
  dispatch, run, lease, worker, thread, or model invocation occurred.
- The prior reviewer findings are resolved in implementation commit
  `35614588e5c854e5037fbc972b10d5a636cf5824`; the updated head requires fresh
  independent review.
