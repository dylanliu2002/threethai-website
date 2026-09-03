# Task 13 — CRO Audit

- **Task ID:** `13`
- **Title:** CRO Audit
- **Mode:** `AUDIT`
- **Role:** `CRO`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** `Codex`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/13-cro-audit`
- **Worktree:** `worktrees/agent-13-cro`
- **Owner:** `CRO`
- **Reviewer:** Task 14 / `BRAND_UX` (recommended, independent)
- **depends_on:** None
- **blocks:** Follow-up conversion implementation tasks

## Goal

Identify evidence-backed friction and trust risks from discovery through sample,
quote, or technical inquiry without submitting forms or altering the funnel.

## Success Criteria

- The report maps primary user journeys, CTA hierarchy, and form friction.
- Recommendations distinguish quick wins from owner decisions and high-risk work.

## In Scope

- Read home, product, application, knowledge, answer, contact, sample, quote,
  finder, CTA, form, and inquiry sources; inspect public flows without submission.
- Evaluate message continuity, qualification, trust, error/failure states, and
  measurement hypotheses.

## Out of Scope

- Editing UI, forms, inquiry pipeline, analytics, email, or production data.
- Sending a form, inventing conversion rates, or claiming customer behavior.

## File Allowlist

```text
docs/audits/13-cro.md
```

## Forbidden / Shared Files

All files other than the allowlist, especially headers, footers, forms,
`src/lib/inquiry.ts`, analytics, and deployment settings.

## Inputs / Evidence

- Source, publicly observable routes, non-submitting test observations, and
  documented business evidence supplied by the owner.

## Acceptance Criteria

- Provide journeys, CTA matrix, friction points, and prioritized follow-up tasks.
- Identify any shared header, footer, inquiry, analytics, or tracking request.
- Separate observed behavior from untested or unmeasured hypotheses.

## Validation

```bash
git diff --check
git diff --name-only
```

- [x] Diff is limited to the dedicated report plus Task-owned card/worklog administration.
- [x] No form or external message was submitted.

## Coordination Items

- Independent review recommended for Task 14 / `BRAND_UX` after audit delivery.
- `TECHNICAL_SEO` + `SEO_CONTENT` + `BRAND_UX`: approve and implement locale/content continuity; no shared routing or navigation file was changed here.
- OWNER + `SEO_CONTENT` + `GEO_AI_SEARCH`: resolve the concrete-PVA offering contradiction before any copy/schema change.
- ORCHESTRATOR / inquiry owner: decide locale preservation, notification health, privacy, qualification, and measurement policy before touching shared inquiry/database/analytics surfaces.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Base SHA: `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`
- Execution: Codex / GPT-5.6 Sol
- Evidence checked: current source; representative German production journeys; read-only public HTTP/search evidence; committed Task 10 audit; no form submission.
- Report path: `docs/audits/13-cro.md`
- Findings: P0 0; P1 5; P2 7; P3 1.
- Validation: `git diff --check`; scope limited to Task 13 card, append-only worklog, and report; no transactional test.

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
