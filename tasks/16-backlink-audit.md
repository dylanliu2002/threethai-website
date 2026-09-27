# Task 16 — Backlink Audit

- **Task ID:** `16`
- **Title:** Backlink Audit
- **Mode:** `AUDIT`
- **Role:** `BACKLINK`
- **Execution Profile:** `RESEARCH`
- **Executor Platform:** `Hermes`
- **Current Provider:** Alibaba Token Plan
- **Current Model Family:** Qwen
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `ON_HOLD`
- **Risk:** `MEDIUM`
- **Branch:** `codex/16-backlink-audit`
- **Worktree:** `worktrees/agent-16-backlink`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
- **depends_on:** Legacy Task 48 resolution
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

- **Scope reassigned 2026-09-14 (written by Task 66, which does not own this
  card):** the backlink audit scope is now carried by Task 67
  (`tasks/67-backlink-authority-audit.md`, branch
  `codex/67-backlink-authority-audit`, report
  `docs/audits/67-backlink-authority.md`), which depends on no legacy hold. While
  the resume condition below is unmet, do not start this card: it is the held Audit
  Wave card and it produced no report. §7.1 bars a task from editing another task's
  card and provides no exception, so Task 66 submitted this bullet as a §14 change
  request for ratification. Nothing in this card's own fields was changed; if the
  owner declines, revert these two bullets and the card reverts to its `origin/main`
  text.
- Lifting the hold belongs to this card's owner/user and follows the condition
  below as written: Task 48 completed, independently reviewed **and** merged, or
  explicitly and safely retired. Merging PR #47 without that review does not
  satisfy the first half.
- Legacy Task 48's work is preserved in PR #47
  (`codex/48-backlink-agent-reland-main`), open against `main`, not yet reviewed or
  merged. Measured 2026-09-28, PR #47 is a **mixture** — three of its six files
  match the dirty worktree and three are identical to the legacy commit — not a
  snapshot of the uncommitted state. See
  `tasks/66-backlink-realignment.md` for the file-level table before relying on
  any claim about what PR #47 lands. Its original worktree stays untouched.
- **Reason:** Legacy Task 48 overlaps backlink research and retains uncommitted
  work on `codex/48-backlink-agent` in `backlink-agent-worktree/`.
- **Resume condition:** Task 48 is completed, independently reviewed, and merged,
  or explicitly and safely retired by its owner/user.
- Do not reset, stash, overwrite, move, delete, or otherwise modify the legacy
  worktree as part of this Task.
- Task 48's Qwen-specific tooling is legacy implementation metadata. It does not
  permanently bind the `BACKLINK` Role or Hermes to Qwen.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/16-backlink.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
