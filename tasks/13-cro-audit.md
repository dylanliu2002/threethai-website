# Task 13 — CRO Audit

- **Task ID:** `13`
- **Title:** CRO Audit
- **Mode:** `AUDIT`
- **Role:** `CRO`
- **Priority:** `P1`
- **Status:** `READY`
- **Risk:** `HIGH`
- **Branch:** `codex/13-cro-audit`
- **Worktree:** `worktrees/agent-13-cro`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
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

- [ ] Diff is limited to the dedicated report.
- [ ] No form or external message was submitted.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/13-cro.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
