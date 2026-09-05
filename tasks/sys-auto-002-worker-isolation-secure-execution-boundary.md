# Infrastructure Task SYS-AUTO-002 — Worker Isolation & Secure Execution Boundary

- **Task Key:** `sys-auto-002-worker-isolation-secure-execution-boundary`
- **Display Task ID:** `SYS-AUTO-002`
- **Title:** Worker Isolation & Secure Execution Boundary
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Requested Model:** GPT-5.6 Sol
- **Reasoning Effort:** `high`
- **Execution Assignment Recorded:** Yes
- **Priority:** `P0`
- **Status:** `REVIEW`
- **Machine Phase:** `INDEPENDENT_REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-002-worker-isolation`
- **Worktree:** `worktrees/sys-auto-002-worker-isolation`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent worker-isolation review required)
- **Base Provenance:** `62d99d18f858fde6eee97559b8a9edec81d2a776`
- **Integration Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **Architecture:** `WIN-OCI-CELL-01`
- **depends_on:** None; SYS-AUTO-001 is blocked provenance, not an executable dependency
- **blocks:** Machine setup and all autonomous worker activation

## Authorization and Goal

The user explicitly authorized repository-only implementation of SYS-AUTO-002.
Build the secure boundary that replaces production direct worker spawn with a
dedicated Windows controller, dedicated WSL2 execution host, one ephemeral
non-root OCI cell per run, sanitized disposable workspace projection, pinned
Codex profile, controller-owned inference gateway, protected signer/secret
store abstractions, and controlled evidence import.

No host mutation, live gateway, worker dispatch, automation, existing-task
adoption, PR, merge, deployment, or production action is authorized.

SYS-AUTO-001 remains BLOCKED at provenance head
`62d99d18f858fde6eee97559b8a9edec81d2a776`. This task does not modify its task
card/worklog, create corrective pass #4, merge it, or create Task 53.

## Success Criteria

- Production controller code targets `WorkerRunner`, not direct worker spawn.
- Explicit interfaces exist for WorkerRunner, Signer, InferenceGateway,
  WorkspaceProjector, EvidenceImporter, and SecretStore.
- OCI/WSL/controller configuration is fail-closed and non-activated.
- Clean worker environment, clean Codex home, exact model/provider/version,
  role-specific sandboxes, no fallback, and disabled remote/tool surfaces are
  repository-owned and adversarially tested.
- Projection excludes authority, credentials, Git metadata/remotes, `.env*`,
  project/user Codex configuration, SSH/GPG state, and package-manager secrets.
- Gateway and import contracts bind current Task/run/lease/fence/budgets and
  reject stale, malformed, cross-worker, override, network, and scope attacks.
- OS-dependent claims remain `PENDING_MACHINE_AUTHORIZATION`, never fabricated
  as PASS, and an exact Machine Change Plan is recorded.

## File Allowlist

```text
workflow/**
docs/agent-team/WORKER-ISOLATION.md
.github/workflows/autonomous-validation.yml
tasks/README.md
tasks/TEMPLATE.md
tasks/sys-auto-002-worker-isolation-secure-execution-boundary.md
tasks/machine/sys-auto-002-worker-isolation-secure-execution-boundary.json
worklog/sys-auto-002-worker-isolation-secure-execution-boundary.md
```

## Forbidden and Machine Gate

Do not modify `src/**`, `public/**`, `prisma/**`, `.env*`, `package.json`, any
lockfile, production deployment configuration, Task 48 worktree, or historical
SYS-AUTO-001 task/worklog evidence. Do not create/remove Windows users, install
WSL/container runtimes, modify services/firewall/Hyper-V/automount/interop,
create production keys, alter credential stores or machine environment, or
create persistent scheduled services without `MACHINE CHANGE AUTHORIZATION`.

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

- [x] Repository boundary and interface tests: 26/26
- [x] Full Node suite: 112/112
- [x] Static validation and both dry-run commands
- [x] Lint, typecheck, and diff whitespace validation
- [x] Changed paths limited to this task's authorized scope
- [ ] Independent QA_PERFORMANCE review
- [ ] Machine isolation probes — `PENDING_MACHINE_AUTHORIZATION`

## Coordination Items

- Official OpenAI documentation confirms the pinned `gpt-5.6-sol` model and
  `high` reasoning support. It documents `requirements.toml`, exact sandbox and
  web-search allowlists, empty MCP allowlists, disabled plugin/features, and
  environment inheritance controls used by the clean worker profile.
- Codex `0.153.0-alpha.5` is installed and is pinned for the worker image. The
  repository rejects a version mismatch and mutable/unprovisioned image refs.
- The exact host proposal and machine acceptance evidence are in
  `docs/agent-team/WORKER-ISOLATION.md`. Stop for `MACHINE CHANGE AUTHORIZATION`.

## Review Status

- Outcome: Pending independent review
- Repository implementation commit: `9384c0db5c45e0931177614a199f8622a9cfaaa8`
- Machine enforcement: `PENDING_MACHINE_AUTHORIZATION`

## Rollback

Revert the SYS-AUTO-002 commits. No live service, WSL distribution, OCI runtime,
gateway, key, credential, firewall rule, worker, automation, or deployment was
created or activated, so no host/runtime rollback is currently required.
