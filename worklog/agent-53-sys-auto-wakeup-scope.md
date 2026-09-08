# Worklog — Task 53 SYS-AUTO-007 Activation-Scoped CLI Wakeups

## 2026-09-08 — Implementation and validation

- Created `codex/53-sys-auto-wakeup-scope` in the isolated
  `worktrees/sys-auto-007-wakeup-scope` worktree from exact `origin/main`
  `0b2ee37904097e638e433c3bbee7c2be38d6862e`.
- Confirmed the durable duplicate came from the legacy global admission key
  `cli-tick:sys-auto-pilot-001-synthetic-fixture`, not from a lease,
  reservation, fencing token, Grant, or activation linkage.
- Added an internal READY-activation wakeup helper. The default CLI prefix is
  now `cli-tick:<activation_id>` and the unchanged scheduler task suffix makes
  the durable admission key `cli-tick:<activation_id>:<task_key>`.
- Explicit caller-supplied wakeup IDs retain their prior behavior. Duplicate
  detection, activation lifecycle, Grant validation, and controller policy were
  not changed.
- Added regressions proving a legacy activation wakeup does not block a new
  activation, the legacy record remains byte-for-byte represented in state,
  and repeated delivery for the same activation remains rejected as
  `duplicate-wakeup`.
- Focused tests passed `26/26`. The full workflow suite passed `172/172` in a
  disposable exact-commit clone with a distinct unprovisioned authority root.
- Lint, typecheck, syntax checks, `validate --all`, `reconcile --dry-run`,
  `tick --dry-run`, and `git diff --check` passed. The disposable clone used
  lockfile-declared dependencies and generated its own Prisma client; no
  dependency or lockfile was changed.
- Canonical validation was read-only and kill-switch protected. State remained
  revision `25` at SHA-256
  `a259ce0d676612db0e171e811766303818ac74907afae70ca89c27c9acbd7976`;
  journal remained `25` events at SHA-256
  `c73650f61d86ba954791f4b162a580ffcc5b38e93c9f2843229f6d3936c0d890`;
  and all seven authority files retained their exact hashes.
- No canonical tick, dispatch, activation, Grant rotation, worker, thread,
  model, state mutation, wakeup cleanup, or history rewrite occurred.
