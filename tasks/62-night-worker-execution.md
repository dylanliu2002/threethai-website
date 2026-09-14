# Task 62 — Night Worker planning and execution

- **Task Key:** `TASK-AUTO-001-NIGHT-WORKER-EXECUTION`
- **Machine Contract:** None; explicitly human-approved additive bootstrap layer above frozen SYS-AUTO-007
- **Machine Phase:** None
- **Task ID:** `62`
- **Title:** Night Worker planning and execution
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** `Codex App Server`
- **Current Provider:** `OpenAI`
- **Current Model Family:** `gpt-5.6-luna`
- **Execution Assignment Recorded:** Yes
- **Priority:** `P0`
- **Status:** `IN_PROGRESS`
- **Risk:** `HIGH`
- **Branch:** `codex/62-night-worker-execution`
- **Worktree:** `worktrees/agent-62-night-worker-execution`
- **Owner:** Independent persisted LUNA implementation thread, reasoning `max`
- **Reviewer:** Fresh independent persisted SOL review thread
- **depends_on:** Task 61 — Night Worker runtime and Thread Broker foundation
- **blocks:** None

## Goal

Extend the Task 61 Night Worker runtime with minimal, production-usable
planning and execution. A persistent Orchestrator thread turns one explicit
submitted batch into bounded, file-scoped task plans, and disjoint ready plans
execute concurrently through the real typed Task 61 ThreadBroker lifecycle.

This is the explicitly human-approved TASK-AUTO-001 bootstrap layer above the
frozen SYS-AUTO-007 surfaces. It does not require or create the older
Grant/controller activation mechanism.

## Success Criteria

- SOL planning remains in the persistent Orchestrator thread, decomposes only
  an explicit submitted batch, uses difficulty-based reasoning with `medium`
  default, and emits bounded plans with distinct branches, canonical isolated
  worktrees, allowlists, acceptance criteria, and validation commands.
- Implementation units dispatch only through Task 61's typed ThreadBroker
  implementation lifecycle with exact `gpt-5.6-luna` and `max` reasoning, the
  exact task worktree cwd, durable thread/turn traceability, no fallback,
  no Terra, no subagents, and no `codex exec` worker path.
- Disjoint ready plans run concurrently up to the configured maximum;
  file-overlapping plans are rejected or serialized, and authoritative Git
  scope plus required validation gates determine publishability.
- Normal runtime is idle without an explicit submitted batch, every child task
  remains traceable to that submission, and workers receive no publishing
  credentials or publishing/review/merge authority through this layer.

## In Scope

- SOL planner and bounded task-plan schema/validation.
- Stable task branch and canonical isolated worktree planning and lifecycle
  helpers using existing repository Git primitives.
- Agent runner and executor orchestration over the Task 61 ThreadBroker,
  including bounded parallelism, overlap handling, durable mapping, and
  explicit no-authority worker prompts/options.
- Git-derived merge-base and diff enforcement as the authoritative changed-file
  source, allowlist rejection, required validation execution, and publishable
  gating.
- Model-policy helpers and schema validation for exact LUNA/max implementation,
  SOL difficulty-based planning, medium default, no fallback, and no Terra.
- Focused regressions for model policy, bounded planning, overlap handling,
  parallel execution, exact cwd/worktree validation, authoritative Git diff
  enforcement, validation gating, no-authority/no-fallback/no-Terra behavior,
  and idle/no-submission behavior.

## Out of Scope

- Any redesign of Task 61's queue, runtime store, service, AppServer client,
  ThreadBroker, or configuration primitives.
- Any modification to `workflow/**`, SYS-AUTO-007, package/lock files,
  `.github/**`, shared files, deployment, production, DNS, secrets, or
  publishing/PR/merge APIs.
- Subagents, `codex exec`, Terra, provider/model fallback, publishing
  credentials, PR creation, review decisions, merge, deployment, or activation.
- Work without an explicit submitted batch or plans outside their declared
  task scope.

## File Allowlist

```text
night-worker/model-policy.mjs
night-worker/planner.mjs
night-worker/task-plan.mjs
night-worker/worktrees.mjs
night-worker/agent-runner.mjs
night-worker/executor.mjs
night-worker/validation.mjs
night-worker/schemas.mjs
night-worker/tests/**
```

## Task-Owned Administrative Files

- **Task card:** `tasks/62-night-worker-execution.md`
- **Worklog:** `worklog/agent-62-night-worker-execution.md`

## Forbidden / Shared Files

- All existing `workflow/**` files and every frozen SYS-AUTO-007 surface.
- `package.json`, `package-lock.json`, `bun.lock`, `.github/**`, `.gitignore`,
  `AGENTS.md`, `.env*`, deployment/configuration files, and secrets.
- Task 61 source files, other task cards/worklogs, branches, and worktrees,
  except for read-only reuse of their public runtime APIs.

## Inputs / Evidence

- Approved TASK-AUTO-001 planning and execution requirements in the task
  submission.
- Task 61's persistent queue, RuntimeStore, service, AppServer client, and
  typed ThreadBroker at `origin/main` `ab85e1d`.
- Repository and workspace `AGENTS.md` governance.

## Acceptance Criteria

- Planning is persistent Orchestrator-thread work only and cannot create child
  work without an explicit submitted batch; a plan is bounded to its allowlist
  and carries a distinct `codex/NN-*` branch, canonical isolated worktree,
  acceptance criteria, and validation commands.
- Implementation dispatch uses only the actual typed Task 61 ThreadBroker
  implementation lifecycle, exact LUNA/max, exact cwd, durable mapping, and
  no fallback/Terra/subagent/`codex exec` route.
- Ready disjoint plans overlap in execution up to the configured limit;
  overlapping file scopes are rejected or serialized deterministically.
- Worker-reported changed files are advisory. Git-derived merge-base/diff scope
  is authoritative; out-of-allowlist changes, failed required tests, failed
  validation, missing worktrees, wrong cwd, and missing submission traceability
  cannot become publishable.
- No publishing credentials, PR/review/merge authority, or production access
  is given to workers through this layer.
- Idle/no-submission runtime performs no work, and all child tasks retain the
  originating submission and batch identifiers.
- Task 61 lifecycle and recovery guarantees remain intact, and all changes
  remain within this Task 62 allowlist plus its card and append-only worklog.

## Validation

```bash
node --test night-worker/tests/task-62*.test.mjs
node --test night-worker/tests/*.test.mjs
npm run lint
npm run build
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --exit-code origin/main...HEAD -- workflow
git diff --exit-code origin/main...HEAD -- package.json package-lock.json .github
git log -1 --format='%an <%ae>'
```

- [ ] Diff scope reviewed
- [ ] Validation recorded

## Coordination Items

- Origin fetch was attempted from this isolated worktree but the shared
  worktree Git metadata denied `FETCH_HEAD`; `origin/main` already equals the
  current base `ab85e1d`.
- The pre-existing untracked `.night-worker/runtime.json` is preserved as
  runtime state and is not an implementation artifact.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence:

## Completion Record

- Commit:
- Base / rebase commit: `ab85e1d` (`origin/main` at task start)
- Changed files:
- Validation results:
- Worklog: `worklog/agent-62-night-worker-execution.md`
- Remaining risks:

## Rollback

Revert the Task 62 commit. The changes are additive and do not alter
production/deployment integration or the frozen SYS-AUTO-007 surfaces.
