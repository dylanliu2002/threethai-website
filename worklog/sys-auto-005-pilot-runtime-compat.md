# Worklog — SYS-AUTO-005 Pilot Runtime Compatibility Fix

Task ID: SYS-AUTO-005
Role: ORCHESTRATOR
Branch: codex/sys-auto-005-pilot-runtime-compat
Base: 46274ed17100f2f9296b7f234729011d1175f482

## 2026-09-06 — Implementation start

- Verified `origin/main` at the exact authorized base and created the isolated
  task branch/worktree.
- Inspected canonical runtime state read-only. The historical pilot activation
  is `CONSUMED`, dispatch attempts remain `1`, general activation remains off,
  the failed run identity matches the user-provided evidence, the Grant count
  is `1`, and the expired worker lease remains present.
- Did not delete the Grant, change activation, re-arm, dispatch, run a
  non-dry-run tick, edit canonical state/journal files, or remove the historical
  lease.
- Began the narrow Codex CLI approval-policy compatibility and terminal-failure
  lease-release fix. Independent `QA_PERFORMANCE` review remains required.

## 2026-09-06 — Implementation and validation

- Confirmed installed `codex-cli 0.153.4` exposes `-c, --config <key=value>`
  for configuration overrides and rejects the former `--ask-for-approval`
  option before any thread starts.
- Replaced the unsupported argument pair with exactly one generated
  `-c approval_policy="never"` override. The existing strict config, ignored
  user config/rules, ephemeral execution, provider/model pinning, elevated
  Windows sandbox requirement, Role-derived workspace sandbox, disabled
  features, and `sandbox_workspace_write.network_access=false` remain intact.
- Centralized in-memory lease/reservation removal and made every non-success
  terminal completion remove its worker lease and reservations atomically in
  the same `run.completed` state mutation. The terminal run identity and
  current-run evidence remain recorded.
- Strengthened the exact pre-thread failure regression: non-zero process exit,
  no thread ID, no structured output, terminal `FAILED`, zero leases and
  reservations, activation still `CONSUMED`, dispatch attempts still `1`, and
  a second dispatch blocked with `activation-disabled`.
- Added a disposable-state recovery regression proving existing reservation
  admission sweeps an expired historical failed lease before rejecting the
  consumed activation. The real historical lease was not touched.
- Codex CLI parser smoke passed without network access or a model/thread.
- Focused pilot suites passed `42/42`; the complete workflow suite passed
  `128/128`.
- Static validation, reconcile dry-run, tick dry-run, lint, typecheck, and diff
  checks passed. Dry-run controller commands performed zero mutations and
  started zero workers.
- The isolated worktree uses a Git-ignored directory junction to the ordinary
  checkout's existing `node_modules` for dependency resolution. No package was
  installed and no ordinary-checkout file was modified.
- No Grant was deleted, activation changed, worker dispatched, non-dry-run tick
  run, GitHub write performed, or canonical controller state mutated.
- Status advanced to `REVIEW / INDEPENDENT_REVIEW`; a fresh
  `QA_PERFORMANCE` reviewer must inspect the final pushed head before merge.
