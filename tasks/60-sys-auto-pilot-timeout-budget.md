# Task 60 - SYS-AUTO-007 Synthetic Pilot Timeout Budget

- **Task Key:** `sys-auto-007-pilot-timeout-budget`
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE`
- **Status:** `REVIEW`
- **Priority:** `P0`
- **Risk:** `HIGH`
- **Branch:** `codex/60-sys-auto-pilot-timeout-budget`
- **Worktree:** `worktrees/sys-auto-pilot-timeout-budget`
- **Base:** `1edc89ef856bd63fd3df4d4008ac81ce1c8667a8`

## Goal

Give the restricted synthetic pilot enough declared execution time to finish
its final structured worker result after Codex transport fallback. The observed
worker created and validated the deterministic output, then reached the existing
300-second hard timeout before returning its final structured response.

## Required Behavior

- Increase only the synthetic pilot process timeout from 300 to 360 seconds.
- Increase its controller lease from 420 to 480 seconds, preserving the exact
  120-second lease-over-process margin.
- Keep output, network, permissions, worker behavior, and lifecycle unchanged.
- Update the Task Card blob binding in the machine contract.

## Explicit File Allowlist

```text
tasks/sys-auto-pilot-001-synthetic-fixture.md
tasks/machine/sys-auto-pilot-001-synthetic-fixture.json
workflow/fixtures/pilot/synthetic-task.json
workflow/tests/pilot-activation.test.mjs
workflow/tests/pilot-safety.test.mjs
workflow/tests/expired-grant-rotation.test.mjs
tasks/60-sys-auto-pilot-timeout-budget.md
worklog/agent-60-sys-auto-pilot-timeout-budget.md
```

Every other path and all canonical controller artifacts are outside scope.

## Out of Scope

- Scheduler, dispatch, worker, retry, Grant, activation, or closeout code.
- Network or permission expansion.
- Historical Run, activation, wakeup, or journal mutation during validation.

## Validation

- Focused pilot activation and safety tests.
- Full workflow suite in a disposable authority context.
- Legacy expired-Grant rotation from the prior 300/420-second contract to the
  current 360/480-second contract.
- `validate --all`, reconcile/tick dry-runs, task-scoped lint, typecheck, and
  diff check.
- Canonical authority, state, and journal hashes unchanged.
