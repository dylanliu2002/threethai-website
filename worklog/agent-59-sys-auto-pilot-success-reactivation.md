# Task 59 Worklog — Fresh Pilot Reactivation After Terminal Run

## 2026-09-10 — Implementation started

- Base: `cd2fe5b797af122ecb01e4ed5c4bf90a82b596bf`.
- Observed canonical failure: a fresh READY activation was rejected with
  `role-not-authorized-for-phase` because the current task projection retained
  a prior successful Run's `REVIEW / INDEPENDENT_REVIEW` phase.
- The rejected admission appended its activation-scoped wakeup without creating
  a Run, leaving `dispatch_attempts=0` but making a later delivery duplicate.
- Scope is limited to the one-time pilot admission lifecycle and its existing
  focused tests. Canonical authority, state, and journal remain read-only during
  implementation and validation.

## 2026-09-10 — Implementation and validation complete

- A fresh exact one-time activation now derives its dispatch phase and Role
  from the current Task Contract rather than a previous terminal Run's task
  projection.
- Prior Runs and wakeups remain intact; only current-cycle review and approval
  pointers are reset when the new Run is admitted.
- Recovery is limited to the exact default CLI wakeup for the current READY
  activation with no bound Run. Foreign and arbitrary same-task wakeups remain
  duplicate-blocked, and repeat delivery after consumption is still blocked.
- Missing or non-terminal prior Runs fail closed.
- Focused tests: `31/31 PASS`; disposable-authority full workflow: `210/210 PASS`.
- Static validation, reconcile/tick dry-runs, task-scoped lint, typecheck, and
  diff check: `PASS`.
- Repository-wide lint reproduced only the two known pre-existing React effect
  findings outside the Task 59 allowlist.
- Canonical state remained revision `53`, hash
  `eed3249e25d94148993598eec2f88b456701a10cb64196199bbe1101d4ac70d3`.
- Canonical journal remained sequence `53`, hash
  `40aea406d0d25b219bc6e540d5a3d5c6dd2456fd3e414606dc762f623ef8aaad`.
