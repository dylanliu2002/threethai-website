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
- **Status:** `READY`
- **Risk:** `MEDIUM`
- **Branch:** `codex/11-seo-content-audit`
- **Worktree:** `worktrees/agent-11-seo-content`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
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

- [ ] Diff is limited to the dedicated report.
- [ ] Claims and evidence sources are distinguished.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/11-seo-content.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
