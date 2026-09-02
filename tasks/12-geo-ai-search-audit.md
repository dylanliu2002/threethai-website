# Task 12 — GEO / AI Search Audit

- **Task ID:** `12`
- **Title:** GEO / AI Search Audit
- **Mode:** `AUDIT`
- **Role:** `GEO_AI_SEARCH`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** `Codex`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `codex/12-geo-ai-search-audit`
- **Worktree:** `worktrees/agent-12-geo-ai-search`
- **Owner:** `GEO_AI_SEARCH`
- **Reviewer:** Task 11 / `SEO_CONTENT` (recommended independent reviewer)
- **depends_on:** None
- **blocks:** Follow-up GEO / AI-search implementation tasks

## Goal

Assess whether current answer, knowledge, product, and company information can
be extracted, trusted, and cited by answer engines without overstating visibility.

## Success Criteria

- The report separates extractability, authority, and factual support.
- It identifies questions, evidence gaps, trust signals, and scoped next tasks.

## In Scope

- Read answer, knowledge, application, product, company-evidence, and schema
  sources for definitions, comparisons, citations, dates, entity consistency,
  authorship, and answer-first structure.

## Out of Scope

- Editing sources, schema, content, links, or pages.
- Claiming ChatGPT, Gemini, Perplexity, or AI Overview visibility without proof.

## File Allowlist

```text
docs/audits/12-geo-ai-search.md
```

## Forbidden / Shared Files

All files other than the allowlist, including every shared file in `AGENTS.md`.

## Inputs / Evidence

- Source content, public material with direct citations, and observed output
  clearly labelled by date and verification method.

## Acceptance Criteria

- Include an intent-grouped AI user-question set and citation-readiness scorecard.
- Flag every proposed claim that needs owner-supplied proof.
- Keep unsupported visibility and authority claims out of the report.

## Validation

```bash
git diff --check
git diff --name-only
```

- [x] Diff is limited to Task 12-owned artifacts: report, own Task Card, and own append-only worklog.
- [x] Every finding has source or reproducible evidence.

## Coordination Items

- Task activated from `origin/main` at `9ff03a94fdc0bfb39557953beb76d06c6adfca9d` in the dedicated worktree `worktrees/agent-12-geo-ai-search`.
- Execution: Codex / GPT-5.6 Sol; Provider and durable Model Family remain not pinned per execution policy.

## Review Status

- Outcome: Pending
- Recommended Reviewer: Task 11 / `SEO_CONTENT` (independent)

## Completion Record

- Audit commit: `b044f722f345fffc69bb45d69d04fc94adf107d8`
- Base SHA: `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`
- Evidence checked: 4 core product families, shared temperature catalog, 5 application families, 4 knowledge articles, 30 Buyer Answers, company/About/Manufacturing/Quality/patent sources, Product/Article/FAQ/Organization/WebSite schema helpers, ten-locale content model, six public PDFs, representative production pages, merged Task 10 report, and committed/pushed Task 11 audit boundary evidence.
- Report path: `docs/audits/12-geo-ai-search.md`
- Findings: 13 total (`P0: 0`, `P1: 5`, `P2: 7`, `P3: 1`).
- Validation: `git diff --check` passed; required finding fields present for all 13 findings; scope limited to Task 12-owned artifacts; no implementation or production mutation.
- Remaining unknowns: current product/grade availability, company/capacity/export/R&D facts, product test methods and batch evidence, reviewer assignments, locale policy, and AI visibility data.

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
