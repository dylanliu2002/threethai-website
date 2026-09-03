# Task Cards

Each card is the durable contract for one task. The card owns its branch,
worktree, mode, scope, evidence, validation, review, and completion record.
Read the repository `AGENTS.md` before creating, updating, or accepting a card.

## Status Model

```text
DRAFT -> READY -> IN_PROGRESS -> REVIEW -> APPROVED -> MERGED
                         ^             |
                         |             v
                  CHANGES_REQUESTED <-+
```

The complete status vocabulary is `DRAFT`, `READY`, `IN_PROGRESS`, `BLOCKED`,
`ON_HOLD`, `REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, and `MERGED`. A blocked
or held task must name its reason in **Coordination items**; it is never silent.

## Creating a Task

1. Copy `TEMPLATE.md` to `NN-short-task-name.md` and complete every field.
2. Check that its file allowlist does not overlap active tasks. Send any shared
   file request to the ORCHESTRATOR instead of widening the allowlist.
3. Fetch `origin`, create `codex/NN-short-task-name` from `origin/main`, and
   add one worktree beneath workspace `worktrees/`.
4. Set the required Git identity, record the branch and worktree on the card,
   and move the card to `IN_PROGRESS` only when the owner starts.

## Current Audit Wave

| ID | Task card | Role | Branch | Dedicated report |
| --- | --- | --- | --- | --- |
| 10 | `10-technical-seo-audit.md` | TECHNICAL_SEO | `codex/10-technical-seo-audit` | `docs/audits/10-technical-seo.md` |
| 11 | `11-seo-content-audit.md` | SEO_CONTENT | `codex/11-seo-content-audit` | `docs/audits/11-seo-content.md` |
| 12 | `12-geo-ai-search-audit.md` | GEO_AI_SEARCH | `codex/12-geo-ai-search-audit` | `docs/audits/12-geo-ai-search.md` |
| 13 | `13-cro-audit.md` | CRO | `codex/13-cro-audit` | `docs/audits/13-cro.md` |
| 14 | `14-brand-ux-audit.md` | BRAND_UX | `codex/14-brand-ux-audit` | `docs/audits/14-brand-ux.md` |
| 15 | `15-qa-performance-audit.md` | QA_PERFORMANCE | `codex/15-qa-performance-audit` | `docs/audits/15-qa-performance.md` |
| 16 | `16-backlink-audit.md` | BACKLINK | `codex/16-backlink-audit` | `docs/audits/16-backlink.md` |

Tasks 10–15 are the current Audit Wave. Read each task-owned card and branch for
its live status; this table records the durable task, Role, branch, and report
mapping and does not override task-owned state.

Task 16 is `AUDIT`, `P1`, and `ON_HOLD` because legacy Task 48 overlaps backlink
research and retains a dirty worktree. Its resume condition is authoritative in
`tasks/16-backlink-audit.md`; do not launch it while that hold remains.

## Current Implementation Tasks

| ID | Task card | Role | Branch | Status |
| --- | --- | --- | --- | --- |
| 51 | `51-baidu-verification.md` | TECHNICAL_SEO | `codex/51-baidu-verification` | REVIEW |

Each Audit Task's output allowlist contains only its dedicated report path. Each
task also automatically owns its own task card and append-only matching worklog
under the model in `AGENTS.md`. Creating a card does not authorize performing
its audit.

## Historical Records

Older cards and reports remain as historical evidence. Their former `agent/*`
branch references are retired: a restarted task must be given a newly reviewed
card and a `codex/NN-short-task-name` branch. Task 50 was merged into
`origin/main`; its card is retained only as a completion record.
