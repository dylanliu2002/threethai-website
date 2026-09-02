# Task 14 — Brand UX Audit

- **Task ID:** `14`
- **Title:** Brand UX Audit
- **Mode:** `AUDIT`
- **Role:** `BRAND_UX`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** `Hermes`
- **Current Provider:** Alibaba Token Plan
- **Current Model Family:** Qwen
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `READY`
- **Risk:** `MEDIUM`
- **Branch:** `codex/14-brand-ux-audit`
- **Worktree:** `worktrees/agent-14-brand-ux`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
- **depends_on:** None
- **blocks:** Follow-up brand and UX implementation tasks

## Goal

Assess whether the site communicates one distinctive, credible Three Thai story
and offers clear information architecture across its important routes.

## Success Criteria

- The report identifies positioning, message-hierarchy, and UX risks with evidence.
- It identifies which recommendations need business proof or shared-file changes.

## In Scope

- Read global theme, typography, layout primitives, navigation, product,
  application, manufacturing, quality, localized, and brand messaging sources.
- Inspect public routes for verifiable hierarchy, information scent, consistency,
  repetition, unsupported claims, and generic exporter language.

## Out of Scope

- Editing CSS, components, theme, navigation, footer, company content, copy, or images.
- Generating assets, redesigning UI, or asserting visual defects not evidenced.

## File Allowlist

```text
docs/audits/14-brand-ux.md
```

## Forbidden / Shared Files

All files other than the allowlist, especially global CSS, layout, header,
footer, and company content.

## Inputs / Evidence

- Source and observable public pages, with page/viewport evidence noted for every
  visual finding and business evidence noted for every factual recommendation.

## Acceptance Criteria

- Report positioning and message hierarchy, findings by page type, and next tasks.
- Flag unsubstantiated claims and shared navigation/theme/company requests.
- Preserve localization and factual integrity constraints.

## Validation

```bash
git diff --check
git diff --name-only
```

- [ ] Diff is limited to the dedicated report.
- [ ] Visual findings name their evidence and uncertainty.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/14-brand-ux.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
