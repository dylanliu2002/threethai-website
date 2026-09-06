# Infrastructure Task SYS-AUTO-003 — Lightweight Activation Safety Pack

- **Task Key:** `sys-auto-003-lightweight-activation-safety-pack`
- **Display Task ID:** `SYS-AUTO-003`
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
- **Branch:** `codex/sys-auto-003-activation-safety-pack`
- **Worktree:** `worktrees/sys-auto-003-activation-safety-pack`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent run required)
- **Base:** `e4634686f4cf7beb415ede5d482a22fa8f83b276`
- **depends_on:** `sys-auto-001-codex-autonomous-workflow-bootstrap`

Exact model selection is Task execution metadata, not a permanent Role binding.
Automatic provider/model fallback is forbidden.

## Authorization and Goal

The user explicitly authorized SYS-AUTO-003 on 2026-09-06. Prepare the merged,
inactive SYS-AUTO-001 controller for a future one-worker low-risk pilot using
Codex's supported native Windows sandbox. Do not activate autonomous execution,
start a Codex worker, create an Automation, adopt an existing Task, publish,
merge, deploy, change DNS or modify production.

SYS-AUTO-002 remains deferred hardening and is outside this Task's scope.

## File Allowlist

```text
tasks/sys-auto-003-lightweight-activation-safety-pack.md
tasks/machine/sys-auto-003-lightweight-activation-safety-pack.json
worklog/sys-auto-003-lightweight-activation-safety-pack.md
workflow/**
```

No application source, public assets, package/lock files, production
configuration, deployment configuration, existing Task artifact or
SYS-AUTO-002 artifact is granted.

## Implemented Safety Pack

- Pilot activation remains hard-coded off and the production tick fails closed
  even if legacy controller activation state were enabled.
- Pilot scheduling accepts only the explicit synthetic pilot Task key and
  enforces a controller-wide `MAX_WORKERS = 1` ceiling.
- The worker subprocess receives a newly constructed environment containing
  only required runtime paths and locale values plus `CODEX_HOME`. The worker
  shell receives a still smaller allowlist and never receives `CODEX_HOME`.
- Credential-bearing environment names, including token, secret, password and
  key suffixes plus GitHub, OpenAI, AWS, Azure, Google, SSH, deployment, DNS,
  Vercel and Cloudflare prefixes, are not copied from the Controller.
- Every future launch re-verifies Codex CLI `>= 0.149.0`, the native elevated
  sandbox setup marker, the dedicated online/offline sandbox accounts and the
  offline marker settings. Failure returns `PILOT_SANDBOX_UNAVAILABLE`.
- Codex invocation pins the exact model, OpenAI provider, Role-derived
  `workspace-write`/`read-only` sandbox, exact worktree, `approval_policy =
  "never"`, elevated Windows sandbox and disabled sandbox network.
- User configuration is ignored for the worker; any project `.codex`
  configuration blocks launch. Rules, hooks, shell snapshots, browser,
  computer use, MCP/app/plugin discovery, multi-agent, automation, search,
  image and other external tool features are disabled.
- Caller attempts to override model, provider, cwd, sandbox, network,
  environment, tools or approval/escalation behavior are rejected.
- Worker-requested actions must be empty. GitHub publishing, deployment, DNS,
  production, secrets and external actions are not worker capabilities.
- Existing durable lease/fencing/stale-run checks are reused. Timeout handling
  now requests termination and escalates to a forced kill after a finite grace
  period.

The exact literals follow the current official OpenAI documentation for the
[Windows elevated sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox)
and [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).
Installed Codex CLI evidence: `0.153.0-alpha.5`; local detector evidence:
`elevated`, `offline`, setup marker version `5`.

## Synthetic Pilot Fixture

`workflow/fixtures/pilot/synthetic-task.json` prepares, but does not execute,
`sys-auto-pilot-001-synthetic-fixture`. A later separately authorized pilot
would create only
`workflow/fixtures/pilot/output/synthetic-result.json`, matching the tracked,
timestamp-free expected JSON. Network, secrets, commit, push, PR, merge,
deployment, DNS and production are all disabled in the fixture.

## Validation Evidence

- Focused pilot safety regressions: PASS, 18/18.
- Complete workflow regression suite: PASS, 104/104.
- Elevated/offline Windows sandbox detector: PASS.
- Real Codex worker executed: NO.
- Autonomous workflow active: NO.
- Existing Tasks adopted: NO.
- GitHub/publishing/deployment/DNS/production actions: NO.
- `node workflow/cli.mjs validate --all`: PASS.
- `node workflow/cli.mjs reconcile --dry-run`: PASS.
- `node workflow/cli.mjs tick --dry-run`: PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.

## Review Status

Implementation is ready for a fresh independent `QA_PERFORMANCE` review. The
implementer does not approve this HIGH-risk safety boundary. No PR or merge is
authorized in this Task.

## Rollback

Before merge, withhold this branch. After a separately approved merge, revert
the SYS-AUTO-003 commit. No Automation, live worker or production rollback is
needed because activation remains off.
