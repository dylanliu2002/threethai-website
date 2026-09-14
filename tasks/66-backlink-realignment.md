# Task 66 — Backlink Task Realignment

- **Task Key:** None
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `66`
- **Title:** Backlink Task Realignment
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** Hermes
- **Current Provider:** Alibaba Token Plan
- **Current Model Family:** Qwen
- **Execution Assignment Recorded:** Yes — 2026-09-14
- **Priority:** `P1`
- **Status:** `IN_PROGRESS`
- **Risk:** `LOW`
- **Branch:** `codex/66-backlink-realignment`
- **Worktree:** `worktrees/agent-66-backlink-realignment`
- **Owner:** `ORCHESTRATOR`
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** None
- **blocks:** Task 67 activation and all follow-up backlink authority work

## Goal

Realign the backlink task records so the backlink audit scope can be executed on
a task that depends on no unresolved legacy hold, without touching `main`, any
other task's branch, card, worklog, or worktree, and without changing website
behavior.

## Success Criteria

- A successor backlink audit card exists with its own branch, worktree, Role,
  Execution Profile, and dedicated report path.
- `tasks/README.md`, `docs/audits/README.md`, `docs/agent-team/EXECUTION-POLICY.md`,
  and `tasks/16-backlink-audit.md` agree on Task 16's disposition and on which
  task now owns the backlink audit scope.
- Legacy Task 48's branch and worktree are untouched by this task.

## In Scope

- The allowlisted governance, board, and coordination documents.
- Recording the disposition of the Task 48 / Task 16 overlap.

## Out of Scope

- Website business code, content, dependencies, configuration, or production.
- Executing or reviewing the backlink audit itself.
- Modifying the legacy Task 48 branch or its dirty worktree.
- Committing the workspace-level `../AGENTS.md` into this repository.
- Editing `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json`.

## File Allowlist

```text
tasks/README.md
tasks/16-backlink-audit.md
tasks/66-backlink-realignment.md
tasks/67-backlink-authority-audit.md
docs/audits/README.md
docs/agent-team/EXECUTION-POLICY.md
worklog/agent-66-backlink-realignment.md
```

## Forbidden / Shared Files

All website source, public assets, dependencies, lock files, runtime and
deployment configuration, Prisma files, SEO copy, and production settings.

## Inputs / Evidence

- `origin/main` at task creation:
  `ab85e1d47e38a1ca3dee4fa782ec831320f29496`.
- `tasks/16-backlink-audit.md` on `origin/main` — `ON_HOLD`, resume condition
  requiring Task 48 to be merged or explicitly retired.
- `tasks/01-execution-policy-migration.md` on `origin/main` — the precedent for an
  ORCHESTRATOR task owning board and execution-policy files.
- Pull request #47 (`codex/48-backlink-agent-reland-main`) — the relanded legacy
  Task 48 work, open, `MERGEABLE`, awaiting independent review.
- `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json` entry for Task 48 is
  historical provenance and is deliberately not edited.

## Acceptance Criteria

- Task 16 is not left silent: its card names its disposition and its successor.
- No Role is permanently bound to an Executor Platform, Provider, or Model
  Family by this change.
- No secret, credential, exact model version, or fabricated evidence is introduced.
- Task 67's report path does not overlap Task 16's, and nothing here authorizes
  performing an audit.

## Validation

```bash
git diff --check
git status --short
git diff --name-only origin/main...HEAD
```

- [x] Diff is limited to the allowlist.
- [x] Legacy Task 48 branch and worktree untouched.
- [x] No website business code or production configuration changed.
- [x] No secret, credential, or exact model version introduced.

## Coordination Items

- PR #47 is open and awaits independent review. This task neither reviews nor
  merges it, and the implementer of PR #47 cannot approve it.
- Task 16 is retained on hold rather than un-held, because its resume condition
  cannot be satisfied while the legacy worktree must stay untouched.
- `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json` is not edited: Task 16 does
  remain on hold, so its `remain-on-hold` policy is still accurate, and editing a
  file under `sys-auto-001`'s independent review would risk conflicting evidence.
- Task 67's execution assignment is left unassigned; the user launches Specialist
  workers independently.

## Review Status

- Outcome: Pending

## Completion Record

- Commit: `f8dd81c875b24124769245ed2beeb4d8e5954182`
- Base / rebase commit: `ab85e1d47e38a1ca3dee4fa782ec831320f29496`
- Changed files: `tasks/README.md`, `tasks/16-backlink-audit.md`,
  `tasks/66-backlink-realignment.md`, `tasks/67-backlink-authority-audit.md`,
  `docs/audits/README.md`, `docs/agent-team/EXECUTION-POLICY.md`,
  `worklog/agent-66-backlink-realignment.md`
- Validation results: `git diff --check` reported no whitespace errors;
  `git diff --name-only origin/main...HEAD` listed exactly the seven allowlist
  paths and nothing else; `git status --short` was clean after the commit; no
  website, dependency, or deployment file appears in the diff. Git identity
  confirmed as `dylanliu2002 <dylanliu2002@gmail.com>`.
- Worklog: `worklog/agent-66-backlink-realignment.md`
- Remaining risks: PR #47 is still open and unreviewed, so legacy Task 48 is
  preserved but not resolved; Task 67 has no assigned executor yet; Task 16
  remains on hold by design. Task 67's evidence basis is still thin — only the
  2026-09-14 referring-domains export has been received.

## Rollback

Revert the governance-only commit. No website runtime or production behavior is
changed by this task.
