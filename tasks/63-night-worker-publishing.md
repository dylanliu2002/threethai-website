# Task 63 — Night Worker publishing, review, correction, and merge gates

- **Task Key:** `TASK-AUTO-001-NIGHT-WORKER-PUBLISHING`
- **Task ID:** `63`
- **Title:** Night Worker publishing, review, correction, and merge gates
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** `Codex App Server`
- **Current Provider:** `OpenAI`
- **Current Model Family:** `gpt-6-luna`
- **Execution Assignment Recorded:** Yes
- **Priority:** `P0`
- **Status:** `BLOCKED`
- **Risk:** `HIGH`
- **Branch:** `codex/63-night-worker-publishing`
- **Worktree:** `worktrees/agent-63-night-worker-publishing`
- **Owner:** Fresh independent persisted implementation thread, `gpt-6-luna`, reasoning `max`
- **Reviewer:** Fresh independent persisted `gpt-6-sol` review thread
- **depends_on:** Task 61 runtime / Thread Broker foundation; starts from main containing merged Task 62

## Goal

Complete the smallest usable Night Worker delivery loop after implementation validation: create a draft PR, run an independent fresh SOL review, allow only bounded correction, re-review exact corrected heads, and merge only the exact approved head when required repository checks and policy permit.

This is the approved TASK-AUTO-001 bootstrap layer above frozen SYS-AUTO-007. It must reuse Task 61/62 runtime primitives and must not create another controller or Grant system.

## File Allowlist

```text
night-worker/github.mjs
night-worker/review-runner.mjs
night-worker/publishing-policy.mjs
night-worker/tests/task-63*.test.mjs
night-worker/config.mjs                                  # only the required GPT-6 model-policy migration
night-worker/tests/runtime.test.mjs                     # only model-policy assertions affected by that migration
night-worker/tests/task-62*.test.mjs                    # only model-policy assertions affected by that migration, if required
```

Task-owned administrative files are this card and `worklog/agent-63-night-worker-publishing.md`.

## Acceptance Criteria

- A draft PR may be created only for a Task 62-publishable exact head after required validation and Git scope gates pass.
- Review always starts in a new independent persisted SOL thread, bound to fresh `origin/main`, exact task head, merge-base, and diff scope; reviewer work is read-only.
- Review/correction is bounded. Corrections stay on the same task branch/worktree and implementation task identity; a corrected head requires a new fresh independent SOL review before approval can advance.
- Merge requires the exact SOL-approved head, required repository checks/policy to be satisfied, and a mergeable PR. Any head drift, stale approval, missing/failed check, or protection failure blocks merge.
- Publishing must never use `--admin`, force-push, GitHub auto-merge waiting/bypass modes, or direct pushes to `main`; repository/GitHub protections are never bypassed.
- Production, deploy, DNS, and secrets remain forbidden. No Terra and no model/provider fallback.
- Implementation workers do not gain review or merge authority. SOL retains review and merge decisions; LUNA performs implementation/corrections/tests only.
- Normal runtime remains idle without an explicit user submission and may not invent repository work.

## Validation

```text
git diff --check origin/main...HEAD
node --test night-worker/tests/*.test.mjs
node night-worker/cli.mjs validate --fixture
node night-worker/cli.mjs run --dry-run --fixture
npm run lint
npm run typecheck
git diff --name-only origin/main...HEAD
git diff --exit-code origin/main...HEAD -- workflow
git diff --exit-code origin/main...HEAD -- package.json package-lock.json .github
git log -1 --format='%an <%ae>'
```

## Coordination Items

- Base at task creation: `36c4dd024118e6c2a8dba1b00c8c7aa54ad15007`, the Task 62 merge commit on current `origin/main`.
- Task 63 was recovered from the previously approved TASK-AUTO-001 decomposition; no new workload was invented.
- Keep SYS-AUTO-007 and `workflow/**` untouched.
- Concrete bootstrap blocker discovered before Task 63 execution: the merged Night Worker config still binds implementation/review to `gpt-5.6-luna` / `gpt-5.6-sol`, while the human's current policy requires `gpt-6-luna` max for implementation/correction and `gpt-6-sol` for fresh review. Task 63 may make only the narrow config/test changes needed to migrate that model policy; no Thread Broker redesign or unrelated runtime refactor is authorized.
- Independent GPT-6 Sol review of head `963cb50e8aea6d3dbd5f62b0828558da614772b9` returned `CHANGES_REQUESTED`: corrected descendants were not pushed to an existing task branch; required-check aggregation could accept a stale success alongside a newer failure; and the GitHub adapter lacked an exact latest-commit author gate before push. The owner is applying only these bounded corrections.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)

## Completion Record

- Commit: Correction commit blocked before staging: shared worktree `index.lock` creation returns `Permission denied`. No correction commit exists; current `HEAD` is `963cb50e8aea6d3dbd5f62b0828558da614772b9` (`dylanliu2002 <dylanliu2002@gmail.com>`). The exact required local identity is verified. Validated changes remain unstaged for orchestrator commit bookkeeping.
- Validation: PASS — focused Task 63 tests (7/7), full Night Worker suite (62/62), changed-file syntax checks, `git diff --check`, allowlist and protected-surface checks. Environment/interface limits: `npm run lint` cannot start (`eslint` not recognized); `npm run typecheck` cannot start (`tsc` not recognized); CLI `validate --fixture` returns `Unknown option: --fixture`; CLI `run --dry-run --fixture` returns `Unknown option: --dry-run`; `git fetch origin` cannot write `FETCH_HEAD` (`Permission denied`). No scope expansion was made for these existing limits.
- Independent review: Prior fresh SOL outcome was `CHANGES_REQUESTED` for the parent implementation at `963cb50e8aea6d3dbd5f62b0828558da614772b9`. The requested corrections are implemented and validated, but a fresh independent SOL review awaits the orchestrator's correction commit. No self-review performed.

## Rollback

Revert the Task 63 merge commit. The publishing layer is additive and must not modify production/deployment configuration or frozen SYS-AUTO-007 surfaces.
