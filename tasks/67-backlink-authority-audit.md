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
- **depends_on:** PR #48 merged into `main`. This card is created by Task 66 and
  does not exist on `main` until that merge, so a worker branching from
  `origin/main` today cannot find it. Beyond that it carries no legacy dependency:
  it does not wait on Task 48, PR #47, or Task 16's hold.
- **blocks:** Follow-up authority-building, citation-hygiene, and outreach tasks

## Goal

Assess threethai.com's actual backlink authority, separate observed citations
from unverified hypotheses, and recommend only policy-safe next tasks. This card
carries the backlink audit scope that Task 16 does not start while its resume
condition is unmet — a statement about now, not a limitation of Task 16, whose
hold its owner/user can still lift.

## Success Criteria

- The report states the measured referring-domain and link profile with its
  exact source, export date, and column meaning.
- Every entry is labelled with one of the four defined labels below; no label is
  inferred silently and no other label is introduced.
  - **`observed`** — a value the executor read in a named artifact it opened, or in
    an owner-provided export cited by filename and date. Reproducible by anyone who
    can open that artifact.
  - **`source-backed risk`** — a defect or exposure that follows from an `observed`
    item plus a named public rule or source, with the source cited. Not measured
    here; argued from evidence.
  - **`unverified from this host`** — something that would need a live fetch, an
    account, or a tool the executor cannot reach or open from this machine. The
    report must name what would verify it and who can.
  - **`hypothesis`** — the executor's own strategic reading, stated as such, with
    the observation that prompted it. Carries no evidentiary weight and may not
    appear in a recommendation without a named owner check first.
- Every recommendation names the evidence the owner must still supply, the
  approval it needs, and a next task key.

## In Scope

- Read existing backlink and outreach documentation, owner-provided webmaster-tool
  exports, public company evidence, current citations, directory/association/
  trade-media criteria, and linkable-asset readiness.
- Research public, relevant opportunities when the source is named and cited.
  Whether the source loads **from this host** is not a gate and must not be used as
  one: this machine resolves all DNS through a fake-ip proxy, so a fetch failure
  here is a routing artefact and a fetch success proves nothing about the source's
  standing either. Record retrievability as a limitation of the executor, cite the
  source, and label any claim resting on it `unverified from this host`.

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
  domains and 73 links. Columns are `Domain`, `Backlinks Count`. Re-read on
  2026-09-28, the file holds exactly:

  | Domain | Backlinks Count |
  | --- | --- |
  | `https://hmsantai.com` | 65 |
  | `https://chinatexnet.com` | 6 |
  | `https://tendata.com` | 2 |

  **This artifact is not in the repository** and cannot be: it sits in the owner's
  `Downloads`, and this card's allowlist bars writing anywhere but its report path.
  The report must therefore reproduce the rows it reasons from **inline**, with the
  filename and export date, so that a later reader who cannot open the CSV can still
  audit the arithmetic and nothing rests on an unopenable citation.
- What the export does **not** contain, and must never be inferred from it: which
  pages are linked, the anchor text, whether a link is editorial or sitewide, the
  linking site's quality or topic, the date range, and whether Bing deduplicates.
  `Backlinks Count` is Bing's own count per referring domain as of the export date;
  its counting rule is not stated in the file. 89.0% of the counted links come from
  one domain that no agent on this host has been able to open.
- Bing Webmaster Tools site-scan advisory, pasted by the owner: "Your site lacks
  inbound links from high-quality domains", severity Moderate, 1 total error.
- Pending owner exports: Google Search Console > Links (top linking sites, top
  linked pages), and Bing Webmaster Tools > Backlinks page-level tab
  (referring page → target page). Not received as at 2026-09-28, fourteen days after
  the scope was assigned.
- `docs/backlink-outreach-agent.md` from legacy Task 48, once PR #47 merges. Note
  before relying on it: that file exists in at least two versions — 3,714 bytes on
  PR #47's head `f6c7ab5` and 3,390 bytes at the legacy commit `8365d63` — and which
  one corresponds to the uncommitted work in `backlink-agent-worktree/` was
  established only by byte length, never by content. `tasks/66-backlink-realignment.md`
  records the measurement and its limits.
- The executor host resolves all DNS through a local proxy in fake-ip mode, so a TLS
  failure on a referring domain is a routing artefact and is **not** evidence that
  the site is down — and a successful fetch here is not evidence that it is up. See
  In Scope: retrievability from this host is not a gate.

## Acceptance Criteria

- Distinguish observed links and opportunities from hypotheses and
  paid-placement risk.
- Every entry carries one of the four defined labels, and no `hypothesis` appears
  inside a recommendation without the owner check that would promote it.
- Recommend only policy-safe, relevant, evidence-supported next tasks.
- Make no external contact and create no outreach copy presented as sent.
- The report reproduces inline every row it reasons from from an off-repo artifact,
  and names what it could not verify and who could.

## Validation

```bash
git diff --check
git diff --name-only
git diff --name-only origin/main...HEAD
```

- [ ] Diff is limited to the dedicated report, this card, and this task's worklog.
- [ ] No outreach, submission, or external message was sent.
- [ ] No invented customer, partner, certification, capacity, test result, or
      performance figure appears in the report.

## Coordination Items

- **Creating this card does not authorize performing the audit.** The audit starts
  only when an owner assigns it and a matching branch and worktree are created from
  the then-current `origin/main`.
- **Evidence gate — one rule, no precedence puzzle.** A report **may** be published
  from whatever is listed above as available, provided it opens by naming which
  Success Criteria it cannot satisfy for lack of a page-level export, and confines
  every conclusion to what domain-level data supports: no per-page attribution, no
  anchor-text or editorial-versus-sitewide judgement, and no statement about link
  quality beyond what Bing itself reports. An earlier version of this bullet
  permitted that and simultaneously forbade it for the same case; this replaces it.
  `BLOCKED` is **not** the default when exports are missing — it is reserved for the
  case where the owner declines to supply them and the audit cannot be bounded as
  above. A three-domain profile published under this rule is a partial audit, must
  title itself as such, and must not be described as complete.
- **Why this card exists:** Task 16 is `ON_HOLD` on the condition "Task 48 is
  completed, independently reviewed, and merged, or explicitly and safely retired
  by its owner/user". That condition is not met — PR #47 has no review decision and
  Task 48 has not been retired — and retiring it is the owner/user's decision, not
  something this reassignment can make for them. Task 67 was therefore given the
  scope with no legacy dependency rather than waiting on that decision.
- **Legacy Task 48:** its work is preserved in PR #47
  (`codex/48-backlink-agent-reland-main`), open against `main` and not yet reviewed
  or merged. Measured 2026-09-28 that PR is a mixture of committed and uncommitted
  revisions, not a snapshot of the uncommitted state; see
  `tasks/66-backlink-realignment.md` before repeating any claim about what it lands.
  Its original worktree `backlink-agent-worktree/` remains untouched: do not reset,
  stash, overwrite, move, or delete it.
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
