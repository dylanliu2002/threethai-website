# Task 61 — Night Worker runtime and Thread Broker foundation

- **Task Key:** `TASK-AUTO-001-RUNTIME`
- **Machine Contract:** None; this additive MVP does not use the frozen SYS-AUTO-007 grant path
- **Machine Phase:** None
- **Task ID:** `61`
- **Title:** Persistent intake, runtime, and Codex App Server Thread Broker
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** `Codex App Server`
- **Current Provider:** `OpenAI`
- **Current Model Family:** `gpt-5.6-luna`
- **Execution Assignment Recorded:** Yes
- **Priority:** `P0`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `codex/61-night-worker-runtime`
- **Worktree:** `worktrees/agent-61-night-worker-runtime`
- **Owner:** Independent persisted LUNA implementation thread, reasoning `max`
- **Reviewer:** Fresh independent persisted SOL review thread
- **depends_on:** None
- **blocks:** Task 62 — Night Worker planning and execution

## Goal

Implement the smallest persistent Night Worker intake/queue runtime and its
Codex App Server Thread Broker. Human task submission atomically creates a
bounded internal batch. Durable implementation and review workers are sibling
Codex threads created with `thread/start`, never subagents or `codex exec`.

## Success Criteria

- A valid submission atomically creates and enqueues one internal batch.
- A running service claims batches FIFO, processes one batch at a time, and
  continues accepting later submissions.
- Durable state survives restart without duplicating a batch, worker thread, or
  worker turn.
- The Thread Broker validates exact model/effort availability, starts persisted
  independent threads, and durably records every returned thread ID before its
  first `turn/start` request.
- Fixed limits and permissions cannot be broadened by submission or worker data.
- SYS-AUTO-007 and every existing `workflow/**` file remain unchanged.

## In Scope

- Fixed deeply immutable MVP configuration:
  - at most 4 submitted tasks per batch;
  - at most 2 parallel implementation workers in later stages;
  - at most 2 correction cycles in later stages;
  - 8-hour batch expiry;
  - exact implementation model `gpt-5.6-luna`, effort `max`;
  - exact review model `gpt-5.6-sol`, default effort `medium`;
  - branch, commit, push, PR, and approved-safe-PR merge capabilities enabled;
  - production, deployment, DNS, secrets, protection bypass, force-push, and
    direct protected-branch push capabilities disabled;
  - Terra and model fallback forbidden.
- Submission API: repository root, 1–4 non-empty task descriptions, and optional
  non-authority reply metadata. Submission cannot supply policy/model/sandbox.
- Stable generated submission/batch identifiers, timestamps, and expiry.
- Filesystem-backed, schema-versioned runtime store using same-directory
  temporary files and atomic rename.
- FIFO queue and one-active-batch service lifecycle with an injected handler.
- Claim owner token plus heartbeat/lease; only stale claims can be requeued.
- CLI surfaces for `submit`, `status`, and internal `serve`; no activation API.
- `app-server-client.mjs`: start/connect to `codex app-server` over JSONL stdio,
  perform `initialize` + `initialized` exactly once per connection, correlate
  requests, stream notifications, redact diagnostics, reject pending requests
  on exit, and support `model/list`, `thread/start`, `turn/start`, `thread/read`,
  and `thread/resume`.
- `thread-broker.mjs`: the only Night Worker surface allowed to call
  `thread/start`. Validate exact models and supported effort via `model/list`.
  Create non-ephemeral independent root threads (`thread/start`, never fork) and
  expose typed implementation/review starts plus read/resume recovery.
- Durable worker mapping must contain batch/task/role/model/effort/cwd,
  `thread_id`, optional `turn_id`, and lifecycle state. Persist `thread_id`
  atomically before the corresponding first `turn/start`; persist `turn_id`
  immediately after a successful response.
- Implementation starts use `gpt-5.6-luna`, `max`, and the exact isolated
  worktree cwd. Review starts use `gpt-5.6-sol`, supplied difficulty effort
  defaulting to `medium`, and read-only policy.
- Secret detection/redaction on accepted text and persisted/logged metadata,
  reusing `workflow/secrets.mjs` read-only where practical.

## Out of Scope

- Task decomposition, worktree creation, business implementation, validation,
  Git publishing, PR review decisions, correction routing, merge, or summaries.
- Operating-system service registration, distributed/multi-host queues, UI, or
  databases.
- Another authorization Grant, capability system, or full controller.
- Manual Night Session, activation, or per-batch permission step.
- Subagent APIs, `codex exec`, thread forks, ephemeral worker threads, Terra, or
  model fallback.
- Any modification to SYS-AUTO-007 or existing `workflow/**` files.

## File Allowlist

```text
night-worker/config.mjs
night-worker/submission.mjs
night-worker/queue.mjs
night-worker/runtime-store.mjs
night-worker/service.mjs
night-worker/cli.mjs
night-worker/app-server-client.mjs
night-worker/thread-broker.mjs
night-worker/tests/**
```

## Task-Owned Administrative Files

- **Task card:** `tasks/61-night-worker-runtime.md`
- **Worklog:** `worklog/agent-61-night-worker-runtime.md`

## Forbidden / Shared Files

- All existing `workflow/**` files and frozen SYS-AUTO-007 surfaces.
- `package.json`, lock files, `.github/**`, `.gitignore`, `AGENTS.md`, `.env*`,
  production/deployment/DNS configuration, and secrets.
- Other task cards, worklogs, branches, or worktrees.

## Inputs / Evidence

- Approved TASK-AUTO-001 architecture and Architecture Correction.
- Official Codex App Server lifecycle: initialization, `model/list`,
  `thread/start`, `turn/start`, `thread/read`, and `thread/resume`.
- Repository and workspace `AGENTS.md` governance.

## Acceptance Criteria

- `submit` is the only user action required to create/start a batch; no manual
  session or activation command/API exists.
- Accepted submission is durable before success is returned. Empty, oversized,
  expired, secret-bearing, or policy-override submissions fail closed without a
  partially visible batch.
- FIFO, active serialization, later submission, stale claim recovery, corrupt
  state, unsupported schema, and restart behavior have deterministic tests.
- A fake App Server protocol test proves request/event correlation and exactly
  one initialize handshake per connection.
- Broker tests prove ordering:
  `model/list -> thread/start -> durable thread mapping -> turn/start -> durable turn mapping`.
- Crash/retry after durable thread persistence but before `turn/start` resumes
  that same thread; it never creates a replacement sibling.
- Exact LUNA/max and SOL/difficulty effort policies are enforced. Missing model,
  unsupported effort, Terra, fallback, fork, subagent, and `codex exec` paths
  fail closed.
- Implementation workspaces are workspace-write only within the supplied
  worktree. Reviewer threads are read-only.
- Thread IDs and turn IDs are not inferred from output text and cannot be
  overwritten by submission data.
- SYS-AUTO-007 remains byte-for-byte unchanged from `origin/main`.

## Validation

```bash
node --test night-worker/tests/*.test.mjs
npm run lint
npm run build
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --exit-code origin/main...HEAD -- workflow
git log -1 --format='%an <%ae>'
```

- [x] Diff scope reviewed: implementation changes are limited to the Task 61 allowlist plus this card and its task-owned worklog; package files, shared files, `workflow/**`, and SYS-AUTO-007 are not Task 61 changes.
- [x] Validation recorded below; correction cycle 4 is rebuilt on the current `origin/main` tip and remains pending independent SOL re-review.

Validation results so far:

- `node --test night-worker/tests/*.test.mjs` — PASS (31/31), including durable turn-start ambiguity with response-loss/empty-read recovery, broker-only lifecycle authority, complete canonical-store dependency validation, and effective SOL difficulty concurrency regression tests.
- `npm run lint` — PASS.
- `npm run build` — BLOCKED by the restricted validation environment: Next.js 16.1.3/Turbopack could not fetch the Google Geist and Geist Mono font CSS, ending with `Failed to fetch Geist from Google Fonts`. No shared layout/font file was changed.
- Independent SOL evidence for reviewed PR head `b9902288b4bf81781841c7fe4232b3b6ff63b207`: clean `npm run build` PASS.
- `git diff --check origin/main...16c368aac9d77250e5e2889cc88cc37b76a06391` — PASS.
- `git diff --name-only origin/main...16c368aac9d77250e5e2889cc88cc37b76a06391` — PASS; only the nine Task 61 `night-worker` files plus this card and its task-owned worklog are present.
- `git diff --exit-code origin/main...16c368aac9d77250e5e2889cc88cc37b76a06391 -- workflow` — PASS; no workflow changes.
- `git diff --exit-code origin/main...16c368aac9d77250e5e2889cc88cc37b76a06391 -- package-lock.json` — PASS; package files are unchanged.
- `git merge-base --is-ancestor aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4 16c368aac9d77250e5e2889cc88cc37b76a06391` — PASS; the handoff is linearly based on current `origin/main`.
- Required Git identity configuration — the shared worktree config could not be locked in this environment; the alternate commit path set and verified `dylanliu2002 <dylanliu2002@gmail.com>` on the implementation tip.

## Coordination Items

- The numeric namespace also contains an unrelated unmerged
  `codex/61-knowledge-article-foundation` worktree. This task owns only the
  distinct `61-night-worker-runtime` branch/card/worktree and must not touch it.

## Review Status

- Outcome: CHANGES_REQUESTED from fresh independent SOL review; correction cycle 4 is implemented and pending re-review.
- Independent reviewer evidence:
  - Reviewer run `01a09574-c580-7802-9ac3-2892989a16e7` reviewed base `aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4` and delivery head `10a2933ff762a2e379dda842947e58fde918c017`.
  - Findings addressed: durable turn-start ambiguity/recovery, broker-only typed lifecycle authority and inert transports, real canonical RuntimeStore dependency validation, and policy-complete in-flight deduplication.

## Completion Record

- Commit: `771c4554d9272f6deb24efa0071e8933eda1a7a5` (cycle-4 implementation tip, linearly based on current `origin/main`; final card/worklog delivery descendant is recorded in the worklog)
- Handoff evidence commit: `16c368aac9d77250e5e2889cc88cc37b76a06391` (Task 61 card/worklog descendant carrying the correction-cycle evidence and exact implementation SHA)
- Base / rebase commit: `aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4`
- Changed files: `night-worker/app-server-client.mjs`, `night-worker/cli.mjs`, `night-worker/config.mjs`, `night-worker/queue.mjs`, `night-worker/runtime-store.mjs`, `night-worker/service.mjs`, `night-worker/submission.mjs`, `night-worker/tests/runtime.test.mjs`, `night-worker/thread-broker.mjs`, `tasks/61-night-worker-runtime.md`, `worklog/agent-61-night-worker-runtime.md`.
- Validation results: focused tests PASS (31/31); `npm run lint` PASS; local `npm run build` is blocked because the restricted environment cannot fetch Google Geist and Geist Mono from Google Fonts; independent SOL evidence records a clean build PASS for reviewed PR head `b9902288b4bf81781841c7fe4232b3b6ff63b207`; implementation and handoff diff/check, committed paths, package/workflow immutability, `origin/main` ancestry, and exact identity gates PASS for `16c368aac9d77250e5e2889cc88cc37b76a06391`.
- Worklog: `worklog/agent-61-night-worker-runtime.md`
- Remaining risks: independent SOL review is pending; local build evidence remains environment-blocked by Google Fonts network access, with independent SOL clean-build evidence recorded above. The corrected tip will be handed to the SOL orchestrator for safe non-force delivery of PR #44. This implementer performs no push, force-push, approval, or merge.

## Rollback

Revert Task 61 commits. This task is additive and has no production or deploy
integration.
