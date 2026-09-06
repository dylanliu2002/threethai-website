# Worklog — SYS-AUTO-003 Lightweight Activation Safety Pack

## 2026-09-06 — Implementation handoff

- Created `codex/sys-auto-003-activation-safety-pack` in the dedicated worktree
  from exact base `e4634686f4cf7beb415ede5d482a22fa8f83b276`.
- Inspected official OpenAI Windows sandbox/configuration documentation and the
  installed `codex-cli 0.153.0-alpha.5` command surface before selecting config
  literals. Did not use deprecated `approval_policy = "untrusted"`.
- Verified the already-provisioned native sandbox read-only: backend
  `elevated`, network profile `offline`, setup marker version `5`.
- Added an inactive one-worker pilot policy, explicit process/shell environment
  allowlists, credential-variable exclusion, exact security-profile pinning,
  project-config broadening protection and external-tool disabling.
- Added finite timeout supervision with graceful termination and forced kill,
  while retaining SYS-AUTO-001 durable leases, fencing and stale-run checks.
- Prepared the deterministic disposable pilot fixture without creating its
  output or executing a Codex worker.
- Added 18 focused safety regressions. Full workflow suite passed 104/104.
- Static validation, dry-run reconcile/tick, lint, typecheck and diff check all
  passed. Activation, worker dispatch, task adoption, publishing, deployment,
  DNS and production actions remained zero.
- SYS-AUTO-002 and all existing Task artifacts/worktrees were left untouched.
- Status moved to `REVIEW / INDEPENDENT_REVIEW`; fresh QA_PERFORMANCE review is
  required. No PR or merge was created.
