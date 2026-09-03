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

- 2026-09-03: Task 10 finding **TSEO-10-02** (eight fallback locale trees label
  English fallback content as translated alternatives; at least 43 English
  deep-detail routes per locale) is reinforced by content evidence
  (report Localization Findings). Not to be confused with TSEO-10-08
  (redirecting `?_locale=en` self-links). Merge-ordering of locale-route
  fixes vs content work is an ORCHESTRATOR decision.
- 2026-09-03: Report proposes 7 follow-up workstreams (11-A … 11-G) with
  **evidence-specific dependencies** — 11-A (owner evidence) gates current
  company facts, availability, specs and evidence-dependent claims only;
  structural/editorial workstreams (11-E, differentiation, editorial
  governance) are not blocked behind it. Task Cards were NOT created per
  task §35 — synthesis reserved to ORCHESTRATOR.
- 2026-09-03: Legacy report `docs/audits/11-keyword-strategy.md` shares the "11"
  prefix from a previous task model; retained as HISTORICAL input, not
  overwritten. Current report supersedes it against the `9ff03a9` baseline.

## Review Status

- Prior Review Outcome: **CHANGES_REQUESTED** (2026-09-03, independent
  GEO_AI_SEARCH review of head `3a7b91a`): no BLOCKER; 9 documentation/
  strategy corrections (claim-evidence classification, SEO11-01/02/05
  wording, localization counts/priorities, solubility-biodegradability
  ownership, route arithmetic, Task 10 cross-reference, follow-up
  dependencies). All corrections applied in the corrective pass recorded in
  the Completion Record below.
- Focused Re-Review Outcome: **CHANGES_REQUESTED** (head `6c3f437`) —
  single remaining issue: SEO11-01 PARTIAL (report attributed numerical
  GEO scores to Task 12, which uses no numerical GEO score).
  Resolved in the second corrective pass (see worklog clarification +
  "audit: remove unsupported Task 12 scores"): qualitative assessment
  (extractability ADEQUATE–STRONG, STRONG format, WEAK–MODERATE
  depth/evidence) substituted; 30/1/29 structure and the
  extractability-vs-depth distinction preserved; totals unchanged.
- Outcome: REVIEW — **final focused independent re-review required** on
  the second corrective head.
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
- Findings (corrected 2026-09-03 after review): 12 total (P0: 0, P1: 3,
  P2: 6, P3: 3) — SEO11-02 downgraded P1→P2; 7 proposed follow-up
  workstreams (11-A…11-G) with evidence-specific dependencies.
- Corrective pass 2026-09-03: all 9 review corrections applied to the report
  (see worklog entry "corrective pass"); previous reviewed head `3a7b91a`
  retained in history; corrective head = the commit introduced by this
  change set ("audit: address Task 11 review findings"); independent
  focused re-review required. Task status deliberately kept at REVIEW;
  not self-approved.
- Report path: `docs/audits/11-seo-content.md`
- Validation: `git diff --check` clean; diff scope pass; identity pass
  (`dylanliu2002 <dylanliu2002@gmail.com>` on audit commit); no secrets; no
  implementation; worktree clean; branch pushed to origin, remote == local.

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
