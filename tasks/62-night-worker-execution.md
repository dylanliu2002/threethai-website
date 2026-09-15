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
- **Status:** `REVIEW`
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

- [x] Diff scope reviewed
- [x] Validation recorded

Validation evidence:

- `node --test night-worker/tests/task-62*.test.mjs` — PASS, 14/14.
- `node --test night-worker/tests/*.test.mjs` — PASS, 47/47.
- `npm run lint` — BLOCKED in the restricted environment because the
  `eslint` executable was unavailable after dependency installation could not
  materialize packages; no package file was changed.
- `npm run build` — BLOCKED in the same restricted environment because the
  `next` executable was unavailable; no application or shared layout file was
  changed.
- Hash-qualified diff/scope, package/workflow immutability, exact
  `origin/main` ancestry, and identity gates were run against implementation
  commit `92c796e104fe741c8cc7c0b4c7b6ff913e9af27c` and are recorded in the
  task-owned worklog.

Correction cycle 1 validation evidence:

- Correction base: reviewed head `e90f1cc1aba9537c8b24bf4c3747d1ade0f6ec66`;
  no Task 61 source, workflow, package/lock, `.github`, or SYS-AUTO-007 file
  was changed.
- `node --test night-worker/tests/task-62*.test.mjs` — PASS, 20/20.
- `node --test night-worker/tests/*.test.mjs` — PASS, 53/53.
- `node --check` — PASS for all changed production and Task 62 test modules.
- `npm run lint` — BLOCKED because the restricted environment has no
  `eslint` executable; `npm run build` — BLOCKED because it has no `next`
  executable; `npm run typecheck` — BLOCKED because it has no `tsc`
  executable. No dependency or package file was changed.
- `git diff --check` — PASS; exact allowlist, forbidden-surface immutability,
  ancestry, and final identity checks are recorded in the correction worklog.

## Coordination Items

- Origin fetch was attempted from this isolated worktree but the shared
  worktree Git metadata denied `FETCH_HEAD`; `origin/main` already equals the
  current base `ab85e1d`.
- The pre-existing untracked `.night-worker/runtime.json` is preserved as
  runtime state and is not an implementation artifact.
- Shared worktree Git metadata also denied the normal index/config/commit
  paths. The verified implementation commit is preserved through the
  task-scoped alternate Git object/index path, following Task 61's recorded
  delivery procedure; no shared metadata, remote ref, or remote state was
  changed.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence:

## Completion Record

- Commit: `92c796e104fe741c8cc7c0b4c7b6ff913e9af27c` (implementation tip;
  exact author and committer `dylanliu2002 <dylanliu2002@gmail.com>`)
- Base / rebase commit: `ab85e1d47e38a1ca3dee4fa782ec831320f29496`
  (`origin/main` at task start)
- Changed files: the eight owned `night-worker/*.mjs` production files, the
  two Task 62 regression files under `night-worker/tests/`, this task card,
  and `worklog/agent-62-night-worker-execution.md`.
- Validation results: focused Task 62 tests PASS (14/14); all Night Worker
  tests PASS (47/47); lint and build are environment-blocked by unavailable
  executables after restricted dependency installation; hash-qualified scope,
  immutability, ancestry, and identity checks PASS.
- Worklog: `worklog/agent-62-night-worker-execution.md`
- Remaining risks: independent SOL review is pending; lint/build require a
  dependency-capable validation environment.

Correction cycle 1 completion record:

- Correction implementation commit: `742102952084ad693f8bcfacca439437e3347a1b`,
  parent reviewed head `e90f1cc1aba9537c8b24bf4c3747d1ade0f6ec66`; exact author
  and committer are `dylanliu2002 <dylanliu2002@gmail.com>`.
- Correction base / reviewed head: `e90f1cc1aba9537c8b24bf4c3747d1ade0f6ec66`.
- Correction validation: focused Task 62 PASS (20/20); all Night Worker PASS
  (53/53); lint, build, and typecheck remain environment-blocked as recorded
  above.
- Correction changes remain within the Task 62 production/test/card/worklog
  allowlist; no push or PR was performed.

Correction cycle 2 completion record:

- Correction base / reviewed head: `ac79bcb693c3316a696e8cd2d5485e6bfe9b1fc3`;
  implementation is a fast-forward descendant of that head and remains on
  `codex/62-night-worker-execution`.
- Correction implementation commit: `e8f26614c70506e0531f807615771f5c75861840`,
  parent `ac79bcb693c3316a696e8cd2d5485e6bfe9b1fc3`; exact author and
  committer are `dylanliu2002 <dylanliu2002@gmail.com>`.
- Hardened validation commands to an explicit fixed test/static-gate allowlist;
  protected allowlist glob coverage, durable terminal worker evidence,
  persistent SOL planner branding, canonical worktree derivation, fresh
  `origin/main` provenance, and publishability evidence integrity now fail
  closed.
- `node --test night-worker/tests/task-62*.test.mjs` — PASS, 20/20.
- `node --test night-worker/tests/*.test.mjs` — PASS, 53/53, preserving Task 61
  lifecycle and recovery regressions.
- `node --check` — PASS for all 11 changed Task 62 production/test modules.
- `npm run lint` — BLOCKED: `eslint` is not recognized in the restricted
  environment. `npm run build` — BLOCKED: `next` is not recognized.
  `npm run typecheck` — BLOCKED: `tsc` is not recognized. No package or lock
  file was changed.
- `git diff --check` — PASS before commit; the final hash-qualified exact
  13-path allowlist, protected-surface immutability, `origin/main` ancestry,
  and identity gates all PASS against `e8f26614c70506e0531f807615771f5c75861840`.
- Advancing the local branch ref was attempted with the verified old head and
  was denied by the managed environment while creating the shared
  `.git/refs/heads/codex/62-night-worker-execution.lock`. The verified commit
  object is preserved through the task-scoped alternate Git object/index path;
  no push or remote ref mutation was attempted.
- Status remains `REVIEW`; implementation is ready for a fresh independent SOL
  review. No push, PR, merge, publishing, or activation was performed.

Correction cycle 3 validation record:

- Continued from exact reviewed head `1b31553e5684a4c2db958d42b41a127548e9cec0`.
- Closed the fresh review findings only within the Task 62 allowlist: validation
  commands now reject indirect executable aliases, shell metacharacter quoting,
  pathless or help-spoofed Node gates, and unchanged validation targets;
  protected namespace checks reject single-character and equivalent wildcard
  variants; canonical RuntimeStore reads reject own/prototype authority
  overrides and use captured methods; forged durable terminal state cannot mint
  publishability evidence; and persistent SOL planners require the genuine
  ready App Server lifecycle identity and persistent Orchestrator thread.
- `node --test night-worker/tests/task-62-planning.test.mjs night-worker/tests/task-62-execution.test.mjs` — PASS, 20/20.
- `node --test night-worker/tests/*.test.mjs` — PASS, 53/53, including all
  Task 61 lifecycle and recovery regressions.
- `node --check` — PASS for all 12 Task 62 `.mjs` production/test modules.
- `npm run lint` — BLOCKED: `eslint` is not recognized. `npm run build` —
  BLOCKED: `next` is not recognized. `npm run typecheck` — BLOCKED: `tsc` is
  not recognized in the restricted environment. No package or lock file changed.
- `git diff --check` — PASS before commit; final hash-qualified scope,
  protected-surface immutability, ancestry, and identity checks remain required
  after commit. Status remains `REVIEW`; no push, PR, merge, publishing,
  activation, subagent, `codex exec`, Terra, or fallback action was performed.

Correction cycle 3 completion record:

- Correction base / reviewed head: `1b31553e5684a4c2db958d42b41a127548e9cec0`.
- Correction implementation commit: `ea482f955b68579afae70e71d6cefc226a9c35a3`,
  parent `1b31553e5684a4c2db958d42b41a127548e9cec0`; exact author and committer
  are `dylanliu2002 <dylanliu2002@gmail.com>`.
- Final handoff evidence commit: `27dd89da41e5bda8b28fc12d05779f381850a787`,
  parent `ea482f955b68579afae70e71d6cefc226a9c35a3`; exact author and committer
  are `dylanliu2002 <dylanliu2002@gmail.com>`.
- Against final handoff commit `27dd89da41e5bda8b28fc12d05779f381850a787`,
  `origin/main` `ab85e1d47e38a1ca3dee4fa782ec831320f29496` is the merge base,
  `git diff --check` passes, and the exact changed-path count is 13 within the
  Task 62 production/test/card/worklog allowlist. Workflow, package/lock,
  `.github`, Task 61, and SYS-AUTO-007 paths are unchanged.
- The final administrative evidence update is a descendant of this handoff;
  status remains `REVIEW` pending fresh independent SOL review.

## Correction cycle 4 validation record

- Continued from exact reviewed head `b3fbe196f9349bd39282c1e58ad83f9b79e8369e`.
- Closed the four fresh independent-review findings within the Task 62
  allowlist: validation now re-derives authoritative Git scope after every
  worker-controlled command and before publishability; protected source and
  secret-bearing wildcard-equivalent variants fail closed; canonical
  RuntimeStore authority is reread and compared after validation and before
  publication; and persistent SOL planning requires the genuine ready App
  Server Orchestrator lifecycle rather than an arbitrary caller lambda.
- `node --test night-worker/tests/task-62-planning.test.mjs
  night-worker/tests/task-62-execution.test.mjs` — PASS, 21/21.
- `node --test night-worker/tests/*.test.mjs` — PASS, 54/54, including all
  Task 61 lifecycle and recovery regressions.
- `node --check` — PASS for all 11 changed Task 62 production/test modules.
- `npm run lint` — BLOCKED: `eslint` is not recognized in the restricted
  environment. `npm run build` — BLOCKED: `next` is not recognized. `npm run
  typecheck` — BLOCKED: `tsc` is not recognized. No package or lock file was
  changed.
- Final hash-qualified scope, ancestry, protected-surface immutability,
  identity, and push gates will be recorded after the correction commit is
  created. Status remains `REVIEW`; no PR or merge is authorized here.

## Rollback

Revert the Task 62 commit. The changes are additive and do not alter
production/deployment integration or the frozen SYS-AUTO-007 surfaces.

## Correction cycle 4 completion record

- Correction base / reviewed head: `b3fbe196f9349bd39282c1e58ad83f9b79e8369e`.
- Correction implementation commit: `e2efd41632a90973d175596d1dad073d054c0f52`,
  parent `b3fbe196f9349bd39282c1e58ad83f9b79e8369e`; author and committer are
  exactly `dylanliu2002 <dylanliu2002@gmail.com>`.
- `origin/main` is
  `ab85e1d47e38a1ca3dee4fa782ec831320f29496`; the merge base with the
  implementation commit equals that exact base.
- Hash-qualified `git diff --check` passes. The exact 13 changed paths are
  within the Task 62 production/test/card/worklog allowlist; workflow,
  package/lock, `.github`, Task 61, and SYS-AUTO-007 paths are unchanged.
- The final implementation object is preserved in the task-scoped alternate
  object store. The managed environment still denies the shared local branch
  lock; the exact current-branch refspec remains the only intended push
  target. No PR or merge was created.
