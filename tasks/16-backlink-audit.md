# Task 16 — Backlink Audit

- **Task ID:** `16`
- **Title:** Backlink Audit
- **Mode:** `AUDIT`
- **Role:** `BACKLINK`
- **Priority:** `P1`
- **Status:** `READY`
- **Risk:** `MEDIUM`
- **Branch:** `codex/16-backlink-audit`
- **Worktree:** `worktrees/agent-16-backlink`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
- **depends_on:** None
- **blocks:** Follow-up outreach and authority-building tasks

## Goal

Assess externally credible, policy-safe authority and referral opportunities for
Three Thai without outreach, fabricated placements, or unverified claims.

## Success Criteria

- The report provides a source-backed opportunity and risk framework.
- Every recommendation identifies required owner evidence, approval, and next task.

## In Scope

- Read existing backlink/outreach documentation, public company evidence, current
  citations, partner or directory criteria, competitor-independent opportunities,
  and linkable-asset readiness.
- Research public, relevant industry, supplier, association, trade-media, and
  resource opportunities when sources are cited.

## Out of Scope

- Editing website code or content; contacting, submitting to, or negotiating with
  any external party; using paid links, private networks, fake reviews, or claims.

## File Allowlist

```text
docs/audits/16-backlink.md
```

## Forbidden / Shared Files

All files other than the allowlist, including outbound-email, contact, analytics,
deployment, and website content files.

## Inputs / Evidence

- Existing backlink documentation, publicly accessible opportunity pages, and
  owner-provided proof of partnerships, certifications, products, or assets.

## Acceptance Criteria

- Distinguish observed links/opportunities from hypotheses and paid-placement risk.
- Recommend only policy-safe, relevant, evidence-supported next tasks.
- Make no external contact and create no outreach copy presented as sent.

## Validation

```bash
git diff --check
git diff --name-only
```

- [ ] Diff is limited to the dedicated report.
- [ ] No outreach, submission, or external message was sent.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/16-backlink.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
