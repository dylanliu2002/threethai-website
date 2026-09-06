# Infrastructure Task SYS-AUTO-004 — Pilot Activation Bootstrap

- **Task Key:** `sys-auto-004-pilot-activation-bootstrap`
- **Display Task ID:** `SYS-AUTO-004`
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Requested Model:** GPT-5.6 Sol
- **Reasoning Effort:** `high`
- **Priority:** `P1`
- **Status:** `IN_PROGRESS`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-004-pilot-activation-bootstrap`
- **Worktree:** `worktrees/sys-auto-004-pilot-activation-bootstrap`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent run required)
- **Base:** `2ca8c8f7b5d521bbcf1b14b5e02c546bd14b4680`
- **depends_on:** SYS-AUTO-001 and SYS-AUTO-003 (both merged)

## Authorization and Goal

The user explicitly authorized SYS-AUTO-004 on 2026-09-06. Implement the
minimum controller-owned administration and bootstrap path required for exactly
one future run of `sys-auto-pilot-001-synthetic-fixture`. This Task must not
execute the pilot, activate a heartbeat, adopt existing Tasks, publish, merge,
deploy, change DNS, or enable general autonomous execution.

SYS-AUTO-002 remains deferred hardening and is outside this Task's scope.

## File Allowlist

```text
tasks/sys-auto-004-pilot-activation-bootstrap.md
tasks/sys-auto-pilot-001-synthetic-fixture.md
tasks/machine/sys-auto-pilot-001-synthetic-fixture.json
worklog/sys-auto-004-pilot-activation-bootstrap.md
workflow/**
```

No application source, public assets, package/lock files, production or
deployment configuration, existing Task artifact, or SYS-AUTO-002 artifact is
granted.

## Required Security Boundary

- Canonical controller authority is outside every repository worktree.
- Any new Ed25519 private key is generated locally, never printed, and protected
  for the current controller user.
- A new public trust anchor requires independent review before merge.
- The synthetic Grant binds the exact contract digest, card blob, task key,
  branch/worktree, write scope, routing, limits, permissions, and one-shot
  activation constraints.
- General activation remains unavailable.
- The one-time token is consumed atomically with its first dispatch reservation,
  before worker process creation, and cannot be reused after success or failure.
- `MAX_WORKERS` is exactly one.

## Validation

```bash
git diff --check
node workflow/cli.mjs validate --all
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
```

## Coordination Items

- Exact authorized base confirmed after `git fetch origin`.
- The canonical controller store was absent at preflight; no historical private
  key was guessed or fabricated.
- Any trust-anchor change on this branch must receive independent review.

## Rollback

Before merge, withhold this branch. After a separately approved merge, revert
the SYS-AUTO-004 commits and remove the unactivated canonical controller store
through a separately authorized administrative action. No worker, Automation,
publishing, production, deployment, or DNS rollback is expected because none is
executed by this Task.

