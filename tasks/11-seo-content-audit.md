# Task 11 — SEO Content Audit

- **Task ID:** `11`
- **Title:** SEO Content Audit
- **Mode:** `AUDIT`
- **Role:** `SEO_CONTENT`
- **Execution Profile:** `RESEARCH`
- **Executor Platform:** `Hermes`
- **Current Provider:** Alibaba Token Plan
- **Current Model Family:** Qwen
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `codex/11-seo-content-audit`
- **Worktree:** `worktrees/agent-11-seo-content`
- **Base SHA:** `9ff03a94fdc0bfb39557953beb76d06c6adfca9d` (origin/main, 2026-09-03; branch fast-forwarded from `91443ad` after Task 10 PR #6 merge)
- **Owner:** SEO_CONTENT
- **Reviewer:** Task 12 / GEO_AI_SEARCH (independent)
- **depends_on:** None
- **blocks:** Follow-up content implementation tasks

## Goal

Map current commercial and informational content to user intent without
manufacturing volume, rankings, facts, or low-value pages.

## Success Criteria

- The report maps existing routes to intent, funnel stage, and evidence quality.
- Gaps, overlaps, localization risks, and follow-up tasks are prioritized.

## In Scope

- Read product, application, article, answer, catalog, and localized content.
- Inspect current route inventory, internal-link opportunities, duplication,
  thin content, buyer questions, and decision-stage coverage.

## Out of Scope

- Editing content, metadata, routes, internal links, or structured data.
- Fabricating keyword volumes, rankings, customer evidence, or search behavior.

## File Allowlist

```text
docs/audits/11-seo-content.md
```

## Forbidden / Shared Files

All files other than the allowlist, including every shared file in `AGENTS.md`.

## Inputs / Evidence

- Repository content and routes, public-source research where cited, and prior
  audit material clearly marked as historical input.

## Acceptance Criteria

- Provide intent-to-page mapping and keep, merge, expand, or retire guidance.
- Label inferred opportunities as hypotheses; identify evidence still required.
- Avoid keyword stuffing, doorway-page proposals, and low-value near duplicates.

## Validation

```bash
git diff --check
git diff --name-only
```

- [x] `git diff --check` — clean.
- [x] Claims and evidence sources are distinguished (evidence labels throughout;
  proposed keyword map marked HYPOTHESIS with no numeric metrics).
- [x] Diff limited to Task 11-owned artifacts: report, own Task Card, own
  append-only worklog (Card/worklog ownership per governance §7).

## Coordination Items

- 2026-09-03: Task 10 (in REVIEW) finding TECH10-08 (fallback-locale
  indexability / content-language mismatch) is reinforced by content evidence
  (report Localization Findings). Merge-ordering of locale-route fixes vs
  content work is an ORCHESTRATOR decision.
- 2026-09-03: Report proposes 7 follow-up workstreams (11-A … 11-G) gated on an
  owner-evidence package (11-A); Task Cards were NOT created per task §35 —
  synthesis reserved to ORCHESTRATOR.
- 2026-09-03: Legacy report `docs/audits/11-keyword-strategy.md` shares the "11"
  prefix from a previous task model; retained as HISTORICAL input, not
  overwritten. Current report supersedes it against the `9ff03a9` baseline.

## Review Status

- Outcome: Pending
- Recommended Reviewer: Task 12 / GEO_AI_SEARCH (independent)

## Completion Record

- Audit complete 2026-09-03 (Hermes / Alibaba Token Plan / Qwen qwen3.8-flash).
- Status transition: IN_PROGRESS → REVIEW.
- Base SHA: `9ff03a94f` (origin/main after Task 10 PR #6; branch fast-forwarded
  from `91443ad6eb36a5f9cb2d08b4d44f374cc260a5ae`).
- Evidence checked: full `src/content/` inventory (products, applications,
  legacy-source 12 articles + 35 answers, answers-zh, answer-expanded,
  company, i18n dictionaries), route/generator files under `src/app/`,
  `middleware.ts` (read-only), Task 10 report (cross-reference only),
  `docs/site-rebuild-plan.md` §7–§8, `docs/agent-team/*` governance, public
  production check (root → `/zh` 308; sitemap 200).
- Findings: 12 total (P0: 0, P1: 4, P2: 5, P3: 3); 7 proposed follow-up
  workstreams (11-A…11-G).
- Report path: `docs/audits/11-seo-content.md`
- Validation: `git diff --check` clean; diff scope pass; identity pass
  (`dylanliu2002 <dylanliu2002@gmail.com>` on audit commit); no secrets; no
  implementation; worktree clean; branch pushed to origin, remote == local.

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
