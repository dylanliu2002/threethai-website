# Task 67 — Backlink Authority and Citation Gap Audit

- **Task Key:** None
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `67`
- **Title:** Backlink Authority and Citation Gap Audit
- **Mode:** `AUDIT`
- **Role:** `BACKLINK`
- **Execution Profile:** `RESEARCH`
- **Executor Platform:** Unassigned
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** No
- **Priority:** `P1`
- **Status:** `READY`
- **Risk:** `MEDIUM`
- **Branch:** `codex/67-backlink-authority-audit`
- **Worktree:** `worktrees/agent-67-backlink-authority`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** None
- **blocks:** Follow-up authority-building, citation-hygiene, and outreach tasks

## Goal

Assess threethai.com's actual backlink authority, separate observed citations
from unverified hypotheses, and recommend only policy-safe next tasks. This card
carries the backlink audit scope that Task 16 cannot start while the legacy
Task 48 hold is unresolved.

## Success Criteria

- The report states the measured referring-domain and link profile with its
  exact source, export date, and column meaning.
- Every entry is labelled `observed`, `source-backed risk`, `unverified from
  this host`, or `hypothesis`; no label is inferred silently.
- Every recommendation names the evidence the owner must still supply, the
  approval it needs, and a next task key.

## In Scope

- Read existing backlink and outreach documentation, owner-provided webmaster-tool
  exports, public company evidence, current citations, directory/association/
  trade-media criteria, and linkable-asset readiness.
- Research public, relevant opportunities when the source is cited and
  retrievable from the executor host.

## Out of Scope

- Editing website code, content, configuration, or structured data.
- Contacting, submitting to, registering with, or negotiating with any external
  party.
- Paid links, private blog networks, link farms, footer/sitewide link schemes,
  fake reviews, or unverifiable placement claims.
- Claiming access to any third-party account (Bing Webmaster Tools, Google
  Search Console, analytics) that the executor cannot actually open.

## File Allowlist

```text
docs/audits/67-backlink-authority.md
```

## Forbidden / Shared Files

All files other than the allowlist, including outbound-email, contact, analytics,
deployment, and website content files.

## Inputs / Evidence

- Owner-provided export, 2026-09-14, Bing Webmaster Tools > Backlinks > Referring
  domains: `www.threethai.com_ReferringDomains_9_14_2026.csv` — 3 referring
  domains and 73 links. Columns are `Domain`, `Backlinks Count`.
- Bing Webmaster Tools site-scan advisory, pasted by the owner: "Your site lacks
  inbound links from high-quality domains", severity Moderate, 1 total error.
- Pending owner exports: Google Search Console > Links (top linking sites, top
  linked pages), and Bing Webmaster Tools > Backlinks page-level tab
  (referring page → target page).
- `docs/backlink-outreach-agent.md` from legacy Task 48, once PR #47 merges.
- Mark these clearly if used: the executor host resolves all DNS through a local
  proxy in fake-ip mode, so a TLS failure on a referring domain is a routing
  artefact and is **not** evidence that the site is down.

## Acceptance Criteria

- Distinguish observed links and opportunities from hypotheses and
  paid-placement risk.
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

- **Creating this card does not authorize performing the audit.** The audit starts
  only when an owner assigns it and a matching branch and worktree are created from
  the then-current `origin/main`.
- **Evidence gate.** The report may be published from the evidence listed above as
  available, provided every Success Criterion that needs a pending export is
  recorded as unmet and every claim resting on it is labelled `unverified from this
  host` or `hypothesis`. If nothing beyond the 2026-09-14 referring-domains export
  has arrived, set this card to `BLOCKED` naming the missing exports rather than
  publishing a three-domain profile as a complete authority audit.
- **Why this card exists:** Task 16 is `ON_HOLD` on the condition "Task 48 is
  completed, independently reviewed, and merged, or explicitly and safely retired
  by its owner/user". That condition is not met — PR #47 has no review decision and
  Task 48 has not been retired — and retiring it is the owner/user's decision, not
  something this reassignment can make for them. Task 67 was therefore given the
  scope with no legacy dependency rather than waiting on that decision.
- **Legacy Task 48:** its previously uncommitted work is preserved in PR #47
  (`codex/48-backlink-agent-reland-main`), open against `main` and not yet reviewed
  or merged. Its original worktree `backlink-agent-worktree/` remains untouched:
  do not reset, stash, overwrite, move, or delete it.
- Task 48's Qwen-specific tooling is legacy implementation metadata. It does not
  permanently bind the `BACKLINK` Role or Hermes to Qwen.
- The execution assignment is deliberately left unassigned. The user launches
  long-lived Specialist workers independently.
- Nothing in this card authorizes external contact, submission, or purchase.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/67-backlink-authority.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
