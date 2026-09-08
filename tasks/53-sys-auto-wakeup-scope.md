# Task 53 — SYS-AUTO-007 Activation-Scoped CLI Wakeups

- **Task Key:** `sys-auto-007-activation-wakeup-scope`
- **Task ID:** `SYS-AUTO-007 Delta`
- **Mode:** `IMPLEMENT`
- **Execution Responsibility:** `IMPLEMENTER`
- **Governance Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent review required)
- **Status:** `IN_PROGRESS`
- **Priority:** `P0`
- **Risk:** `HIGH`
- **Branch:** `codex/53-sys-auto-wakeup-scope`
- **Worktree:** `worktrees/sys-auto-007-wakeup-scope`
- **Base:** `0b2ee37904097e638e433c3bbee7c2be38d6862e`

## Authorization and Goal

The user authorized the narrow dispatch fix for the confirmed lifecycle defect
where the permanent default CLI wakeup prefix `cli-tick` expands to a durable
task key already used by an older activation. Scope the default real CLI tick
wakeup identity to the current one-shot activation so historical wakeups do not
block a newly authorized activation, while duplicate delivery for the same
activation remains idempotently blocked.

This Task does not authorize a scheduler tick, dispatch, Grant rotation,
activation creation, worker or model execution, permission changes, controller
policy changes, canonical state cleanup, or deletion/rewrite of wakeup history.

## File Allowlist

```text
workflow/controller.mjs
workflow/internal/scheduler-engine.mjs
workflow/tests/pilot-activation.test.mjs
tasks/53-sys-auto-wakeup-scope.md
worklog/agent-53-sys-auto-wakeup-scope.md
```

Every other repository file and every canonical controller artifact is outside
scope.

## Required Behavior

- Default CLI wakeup identity must include the current READY activation ID.
- The resulting admission key remains stable for repeated delivery of that
  same activation.
- A legacy or prior-activation wakeup must not block a new activation.
- Same-activation duplicate admission must remain blocked.
- Existing wakeup, activation, authorization, run, lease, reservation,
  retirement, rotation, and journal history must never be cleared or rewritten.
- Explicit caller-supplied wakeup IDs retain existing behavior.

## Required Tests

- Old/legacy activation wakeup does not block a new activation.
- Same-activation duplicate remains blocked.
- Historical wakeup records are preserved.

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

All canonical checks are read-only. No non-dry scheduler command is permitted.

## Coordination Items

- Canonical activation `e2c74b86-5089-4de9-b136-460d9ede522a` remains `READY`
  with `dispatch_attempts=0` after the rejected `duplicate-wakeup` admission.
- The canonical failed admission evidence and all historical wakeups must remain
  untouched.
- A future real tick requires separate fresh human authorization after review
  and merge.

## Rollback

Before merge, withhold the branch. After merge, revert the implementation
commit. No canonical rollback is part of this implementation Task.
