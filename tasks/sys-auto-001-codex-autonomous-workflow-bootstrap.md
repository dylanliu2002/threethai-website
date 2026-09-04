# Infrastructure Task SYS-AUTO-001 — Codex Autonomous Workflow Bootstrap

- **Task Key:** `sys-auto-001-codex-autonomous-workflow-bootstrap`
- **Display Task ID:** `SYS-AUTO-001`
- **Title:** Codex Autonomous Workflow Bootstrap
- **Mode:** `CORRECTIVE / IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Requested Model:** GPT-5.6 Sol
- **Reasoning Effort:** `high`
- **Execution Assignment Recorded:** Yes
- **Priority:** `P1`
- **Status:** `IN_PROGRESS`
- **Machine Phase:** `CORRECT`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-001-bootstrap`
- **Worktree:** `worktrees/sys-auto-001-bootstrap`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent Codex thread/run required)
- **Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **depends_on:** None
- **blocks:** Live autonomous activation until separate approval and activation authorization

Exact model selection is task execution metadata, not a permanent Role binding.
No provider/model switch or automatic fallback is authorized during this task.

## Authorization and Goal

The user explicitly authorized SYS-AUTO-001 on 2026-09-04 before implementation.
It replaces the former proposal label "Task 53"; no numeric Task 53 may be
created or used as machine identity.

Build the minimum Codex-native controller that can deterministically admit
authorized machine contracts, schedule isolated workers, validate structured
results, enforce independent review and bounded correction cycles, prepare
administrative closeout/PR actions behind permissions, and recover from durable
runtime events. This bootstrap produces a live-capable design but does not
activate unattended execution.

## Success Criteria

- Strict, versioned Zod contracts reject unknown fields and unsupported versions.
- Machine identity uses full `task_key`; run identity is controller-generated.
- State, routing, dependency, scheduler, lock, review, correction, closeout,
  publishing and recovery rules fail closed.
- Two disjoint tasks may run concurrently; overlapping scopes serialize.
- `codex exec` adapter uses explicit cwd/model/sandbox, JSONL events, a structured
  output schema, timeout/cancellation and run/thread binding.
- Dry-run CLI commands have no GitHub, task, Git, worker or automation mutations.
- All required tests and repository validation pass with no package changes.

## File Allowlist

```text
AGENTS.md
docs/agent-team/EXECUTION-POLICY.md
docs/agent-team/TEAM-OPERATING-MODEL.md
docs/agent-team/UNIFIED-AGENT-PROMPT.md
docs/agent-team/AUTONOMOUS-WORKFLOW.md
docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json
tasks/TEMPLATE.md
tasks/README.md
worklog/README.md
tasks/sys-auto-001-codex-autonomous-workflow-bootstrap.md
tasks/machine/sys-auto-001-codex-autonomous-workflow-bootstrap.json
worklog/sys-auto-001-codex-autonomous-workflow-bootstrap.md
workflow/**
.agents/skills/task-worker/**
.agents/skills/task-review/**
.agents/skills/task-closeout/**
.github/workflows/autonomous-validation.yml
```

The shared governance files above are explicitly granted to the ORCHESTRATOR for
this infrastructure task. No other shared file is granted.

## Forbidden and Activation Boundary

Do not modify application source, public assets, Prisma, environment files,
package/lock files, deployment configuration, historical reports, existing Task
Cards/worklogs, or any existing task worktree. Do not reset, stash, delete or
rewrite history. Do not push main, merge, create a PR before independent
approval, change production, send external messages or perform webmaster work.

Implementation completion is not activation. This task must not create a live
Automation/heartbeat, dispatch a live Codex worker, enable controller GitHub
writes, adopt existing tasks or run unattended. Those actions need separate
explicit authorization after independent approval.

## Existing Task Preservation

- Tasks 13 and 14: provenance only; do not continue automatically.
- Task 15: provenance only; do not start automatically.
- Task 16: retain `ON_HOLD`; never dispatch automatically.
- Task 48: untouched, including its legacy worktree.
- Task 52: merged before this base; provenance only.
- Tasks 10–16, 48, 51 and 52 retain their historical IDs and executor facts.

No existing unfinished task is adopted by SYS-AUTO-001.

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

- [x] Diff scope reviewed
- [x] Machine contract and authorization-card blob binding validated
- [x] Required test matrix passed: 41/41
- [x] Dry-run mutation boundary verified
- [x] Git identity verified exactly for authored commits; repeat after handoff

## Coordination Items

- Preflight fetched origin and found the exact expected base
  `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`, which merged Task 52 PR #12.
  Task 52 shared-board ownership was released before this task began.
- Installed Codex CLI `0.153.0-alpha.5` exposes the required MVP primitives:
  explicit `--cd`, `--model`, `--sandbox`, `--json`, `--output-schema`, timeout
  supervision by the controller, and session events. App Server remains a later
  option; it is not needed for this bootstrap.
- Official OpenAI documentation describes `codex exec` as the non-interactive
  pipeline interface, JSONL events for machine consumption, JSON Schema final
  output, least-privilege sandbox selection, repository `AGENTS.md` layering and
  repository Skills. The implementation keeps deterministic policy outside the
  model and uses those native primitives only behind an activation gate.
- Symphony-aligned concepts retained: task-centered control, isolated workspace,
  bounded concurrency, durable policy, reconciliation and human review. The
  ThreeThai controller adds exact task contracts, reviewed-head binding,
  independent reviewer identity, path/write locks, Git identity and external
  action gates. No external framework is copied.
- Final pre-review fetch confirmed `origin/main` remains the exact task base.
  `git rebase origin/main` reported up to date; no conflict or rewrite occurred.
- Task 13/14 were not continued, Task 15 was not started, Task 16 remains on
  hold, Task 48 was untouched, and Task 52 is preserved as merged provenance.
  No existing Task was adopted, dispatched or modified.

## Review Status

- Outcome: Pending independent `QA_PERFORMANCE` review.
- Required review: fresh Codex execution, fresh thread/run, no implementation
  contribution, exact reviewed base/head and contract revision binding.

## Independent Review Record — Blocked Head

- **Review Outcome:** `BLOCKED`
- **Reviewed Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **Reviewed Head:** `38e5e74ee70539145756ee22fa52bd8ee578771a`
- **Reviewer Role:** `QA_PERFORMANCE`
- **Corrective authorization:** The user authorized this same Task, branch and
  worktree to move to `IN_PROGRESS / CORRECT`. This historical BLOCKED outcome
  remains unchanged and cannot approve any corrected head.

BLOCKER findings recorded by the independent review:

1. Authorization was self-manufacturable from the worker-writable contract,
   including activation, permissions and scope.
2. `runCodexExec` lacked an unavoidable controller activation/permission gate
   and accepted caller-selected model, sandbox and working directory.
3. Actual Git/filesystem changes were not independently derived and compared
   with authorized scope; worker-reported `changed_files` was trusted.
4. Approval could be manufactured without authoritative independent-review,
   run, contract and evidence binding.

MAJOR findings recorded by the independent review:

1. Locks, active runs and wakeup deduplication were process-local.
2. Recovery did not reconstruct authoritative task/run/lease/lock state.
3. Publishing lacked live lease/fencing, authoritative approval, current SHA,
   exact branch and independently verified Git identity gates.
4. Controller, worktree/path, shared governance, resource/build and Git locks
   were not acquired as durable authoritative reservations.
5. Correction count and fresh-review requirements relied on caller input.
6. Secret detection/redaction did not cover structured worker output,
   stdout/stderr/errors/logs/journal payloads or broad credential classes.

## Completion Record

- Authorization/provenance commit:
  `4f82f9f6c097c8f1b9476f1eb987fb5ccd4f939a`.
- Implementation commit:
  `d343d314f476f148138407fc6a210a7bcc98a71b`.
- Final handoff head: recorded in the delivery report after the administrative
  REVIEW commit; that commit changes only SYS-AUTO-001 state/evidence artifacts.
- Base / rebase commit: `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`.
- Changed files: 43, all within the explicit allowlist; no `src/`, `public/`,
  Prisma, environment, package/lock, deployment or existing Task artifact change.
- Machine contract/schema/Role/state/routing/dependency/scheduler/locks/Codex
  adapter/review/correction/closeout/publishing/recovery/CLI/Skills: PASS.
- `node workflow/cli.mjs validate --all`: PASS; strict contract and secret scan.
- `node --test workflow/tests/*.test.mjs`: PASS, 41/41.
- `node workflow/cli.mjs reconcile --dry-run`: PASS, zero mutations/workers.
- `node workflow/cli.mjs tick --dry-run`: PASS, activation disabled, zero
  mutations/workers/automations.
- `npm run lint`: PASS. `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Worklog: `worklog/sys-auto-001-codex-autonomous-workflow-bootstrap.md`.
- Remaining risks: bootstrap is HIGH risk and remains manually supervised;
  activation, publishing, task adoption and production actions remain disabled.

## Rollback

Before merge, withhold the branch. After a separately approved merge, revert the
SYS-AUTO-001 implementation commits to remove controller code and additive
governance. No live automation or production rollback is needed because this
task does not activate either.
