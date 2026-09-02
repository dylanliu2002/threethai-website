# Task [NN] — [Title]

- **Task ID:** `NN`
- **Title:** [short, outcome-oriented title]
- **Mode:** `AUDIT` | `IMPLEMENT` | `REVIEW`
- **Role:** `ORCHESTRATOR` | `TECHNICAL_SEO` | `SEO_CONTENT` | `GEO_AI_SEARCH` | `CRO` | `BRAND_UX` | `QA_PERFORMANCE` | `BACKLINK`
- **Priority:** `P0` | `P1` | `P2` | `P3`
- **Status:** `DRAFT`
- **Risk:** `LOW` | `MEDIUM` | `HIGH`
- **Branch:** `codex/NN-short-task-name`
- **Worktree:** `worktrees/agent-NN-short-name`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** None
- **blocks:** None

## Goal

[What outcome is needed and why it matters.]

## Success Criteria

- [Measurable result 1]
- [Measurable result 2]

## In Scope

- [Allowed behavior, route, evidence, or decision.]

## Out of Scope

- [Explicitly excluded work and non-goals.]

## File Allowlist

```text
[Only implementation or audit output files this task may modify]
```

The File Allowlist does not need to repeat this task's administrative card or
worklog; their automatic ownership is defined below and in `AGENTS.md`.

## Task-Owned Administrative Files

- **Task card:** `tasks/NN-task-name.md` — the assigned Owner may update Status,
  Coordination Items, Validation results, and Completion Record. The assigned
  independent Reviewer may update review-related fields within their role.
- **Worklog:** `worklog/agent-NN-task-name.md` — create if absent; append only.
  Never rewrite history or modify another task's worklog.

## Forbidden / Shared Files

List task-specific exclusions. Repository shared files remain forbidden unless
the ORCHESTRATOR adds an explicit authorization to this card.

## Inputs / Evidence

- [Source, existing report, route, data owner, or reproducible evidence.]
- [Mark assumptions and unverified runtime behavior clearly.]

## Acceptance Criteria

- [Objective acceptance condition]
- [Factual-integrity or scope condition]

## Validation

```bash
# Exact commands, environments, and expected results
```

- [ ] Diff scope reviewed
- [ ] Validation recorded

## Coordination Items

- None

For a shared-file need, use:

```text
SHARED FILE CHANGE REQUEST
File:
Task:
Reason:
Exact proposed change:
Evidence:
Tasks affected:
Risk:
Validation:
```

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence:

## Completion Record

- Commit:
- Base / rebase commit:
- Changed files:
- Validation results:
- Worklog:
- Remaining risks:

## Rollback

[Revert commit, disable safe configuration, or state why no runtime rollback is needed.]
