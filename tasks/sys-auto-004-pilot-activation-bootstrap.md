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
- **Status:** `REVIEW`
- **Machine Phase:** `INDEPENDENT_REVIEW`
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

## Completion Record

- **Implementation commit:** `21035fa03162a93b7be932df5131b6f8a618160c`
- **Final administrative handoff head:** the task-card/worklog commit reported
  after push; independent review must use that exact final head.
- **Rebased/final base:** `2ca8c8f7b5d521bbcf1b14b5e02c546bd14b4680`
- **Authority previously provisioned:** `NO`
- **Fresh Ed25519 controller keypair generated:** `YES`
- **Controller public fingerprint:**
  `2b083b22e59b767683b38c305683b69511ba80956e9ac1d6efe7bc9f331806a1`
- **Private key exposed or placed in Git-visible content:** `NO`
- **Canonical authority store:** `PASS`; outside all worktrees, matching
  private/public key, Windows ACL restricted to the current controller account.
- **Grant installed:** `NO`; canonical Grant count remains zero.
- **One-time pilot activation state enabled:** `NO`; state remains `DISABLED`.
- **General autonomous activation:** `OFF` and generic enable path unavailable.
- **Existing Tasks adopted:** `NO`
- **Real worker executed:** `NO`
- **Focused SYS-AUTO-004 regressions:** `21/21 PASS`
- **Complete workflow suite:** `125/125 PASS`
- **`node workflow/cli.mjs validate --all`:** `PASS` (three contracts,
  authority available but unused, zero Grants)
- **`node workflow/cli.mjs reconcile --dry-run`:** `PASS` (zero mutations and
  zero workers)
- **`node workflow/cli.mjs tick --dry-run`:** `PASS` (activation disabled,
  zero workers, Automations, GitHub mutations, publishing actions, or Grants)
- **`npm run lint`:** `PASS`
- **`npm run typecheck`:** `PASS`
- **`git diff --check`:** `PASS`
- **Independent review:** Required from a fresh `QA_PERFORMANCE` run. The
  implementer does not approve this HIGH-risk trust-anchor and activation
  boundary.

## Rollback

Before merge, withhold this branch. After a separately approved merge, revert
the SYS-AUTO-004 commits and remove the unactivated canonical controller store
through a separately authorized administrative action. No worker, Automation,
publishing, production, deployment, or DNS rollback is expected because none is
executed by this Task.
