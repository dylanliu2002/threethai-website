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
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `codex/14-brand-ux-audit`
- **Worktree:** `worktrees/agent-14-brand-ux`
- **Base SHA:** `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`
- **Owner:** BRAND_UX (Hermes / Alibaba Token Plan / Qwen)
- **Reviewer:** Recommended independent reviewer: Task 13 / CRO (Unassigned)
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

- Execution environment limitation: Desktop View / interactive browser was
  unavailable for this run; runtime evidence was collected via production HTML
  fetches and downloaded asset inspection. Rendered-appearance conclusions are
  labelled UNVERIFIED_RUNTIME_VISUAL in the report and need one browser QA
  pass (BRAND14-14).
- All implementation fixes proposed by the report touch shared files
  (`src/content/company.ts`, header/footer, `globals.css`, `public/images/**`,
  `src/content/i18n/**`) and require ORCHESTRATOR-owned follow-up tasks.
- Owner confirmations requested by the report: trademark symbol status
  (BRAND14-01), export-market/honors/R&D claims (BRAND14-03),
  extended-photo↔material mapping (BRAND14-07).
- `tasks/README.md` board row for Task 14 is shared — admin to sync status.

## Review Status

- Outcome: Awaiting independent review (recommended reviewer: Task 13 / CRO).

## Completion Record

- Commit: (see branch `codex/14-brand-ux-audit`)
- Evidence checked: source survey (SOURCE_CONFIRMED) + live production HTML
  for 17 routes in en/zh/es/de (RUNTIME_CONFIRMED) + downloaded image asset
  inspection (product, factory, hero, logo, certificates).
- Report path: `docs/audits/14-brand-ux.md`
- Findings: 14 total — P0: 0, P1: 4, P2: 6, P3: 4.

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
