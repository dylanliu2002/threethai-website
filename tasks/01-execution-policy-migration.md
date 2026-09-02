# Task 01 — Execution Policy Migration

- **Task ID:** `01`
- **Title:** Platform / Model Agnostic Execution Policy Migration
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** `Codex`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `LOW`
- **Branch:** `codex/01-execution-policy-migration`
- **Worktree:** `worktrees/agent-01-execution-policy`
- **Owner:** `ORCHESTRATOR`
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** None
- **blocks:** Consistent cross-platform activation of repository-governed tasks

## Goal

Replace permanent role-to-model assignments with a durable, platform- and
model-agnostic execution architecture while preserving Task, Role, branch,
worktree, ownership, review, factual-integrity, and Git-identity governance.

## Success Criteria

- Repository governance defines `Task -> Role -> Execution Profile -> Executor
  Platform -> Provider -> Model Family` without permanently binding a Role.
- Current Audit Wave execution metadata is recorded without changing audit scope
  or starting any audit.
- Historical model allocations remain identifiable as history and no longer
  control future executor selection.

## In Scope

- Repository governance and coordination documents listed in the allowlist.
- Execution metadata on Audit Wave cards 10–16.
- Task 16 hold metadata required by the unresolved legacy Task 48 overlap.

## Out of Scope

- Website business code, configuration, dependencies, content, or production.
- Executing or reviewing Tasks 10–16.
- Modifying the legacy Task 48 branch or dirty worktree.
- Committing the workspace-level `../AGENTS.md` into this repository.

## File Allowlist

```text
AGENTS.md
docs/agent-team/EXECUTION-POLICY.md
docs/agent-team/TEAM-OPERATING-MODEL.md
docs/agent-team/MASTER-OPTIMIZATION-PLAN.md
docs/agent-team/UNIFIED-AGENT-PROMPT.md
tasks/TEMPLATE.md
tasks/IMPLEMENTATION-BACKLOG.md
tasks/README.md
tasks/11-seo-content-audit.md
tasks/12-geo-ai-search-audit.md
tasks/13-cro-audit.md
tasks/14-brand-ux-audit.md
tasks/15-qa-performance-audit.md
tasks/16-backlink-audit.md
tasks/01-execution-policy-migration.md
worklog/agent-01-execution-policy.md
```

## Forbidden / Shared Files

All website source, public assets, dependencies, lock files, runtime and
deployment configuration, Prisma files, SEO copy, and production settings.

## Inputs / Evidence

- Workspace and repository `AGENTS.md`, current task template, Audit Wave cards,
  execution documents, implementation backlog, and user-authorized migration brief.
- `origin/main` at task creation: `041dcafca0b7097cec9bfd2db68b6628f126f252`.

## Acceptance Criteria

- No Role is permanently bound to Codex, Hermes, a Provider, or a Model Family.
- No exact model version is introduced as permanent governance.
- `codex/NN-*` is explicitly a repository branch namespace, not a platform marker.
- Credential, switching, fallback, and durable cross-platform handoff rules are explicit.
- Completed historical records are not rewritten as future policy.

## Validation

```bash
git diff --check
git status --short
git diff --name-only origin/main...HEAD
git diff
```

- [x] Diff scope reviewed.
- [x] No website business code or production configuration changed.
- [x] No secret, credential, API key, or exact model version was introduced.
- [x] Platform/model independence and Task 16 hold state verified.

## Coordination Items

- `tasks/01-meta-zh.md` is a retired historical card with the same numeric ID.
  It remains untouched; this user-authorized task is identified by its full slug,
  branch, and worktree.
- Task 10 is already active and in `REVIEW` on its own task-owned branch. Task 01
  intentionally does not modify the Task 10 card. Its execution metadata may be
  reconciled by the Task 10 owner during rebase/handoff or by a later
  ORCHESTRATOR-owned administrative update after Task 10 integration.
- The workspace-level `../AGENTS.md` adjustment is local workspace governance and
  must remain outside this repository commit.
- `tasks/README.md` was explicitly added to this Task's allowlist for the minimal
  Task 16 `ON_HOLD` alignment; the Task 16 card remains authoritative.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence:

## Completion Record

- Commit: Governance commit at this task branch head; exact SHA is recorded in delivery.
- Base / rebase commit: `041dcafca0b7097cec9bfd2db68b6628f126f252`
- Changed files: Allowlisted governance, execution-policy, Audit Wave metadata,
  Task Card, and task-owned worklog files only.
- Validation results: `git diff --check`, allowlist, website-code exclusion,
  exact-model-version, credential-value, Task 10 exclusion, Task 16/README state,
  and full diff review passed.
- Worklog: `worklog/agent-01-execution-policy.md`
- Remaining risks: Legacy Task 48 remains unresolved; Task 10 execution metadata
  reconciliation is intentionally delegated to its owner or later administration.

## Rollback

Revert the governance-only commit. No website runtime or production behavior is
changed by this task.
