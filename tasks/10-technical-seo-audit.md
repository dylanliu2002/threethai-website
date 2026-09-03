# Task 10 — Technical SEO Audit

- **Task ID:** `10`
- **Title:** Technical SEO Audit
- **Mode:** `AUDIT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** `Codex`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/10-technical-seo-audit`
- **Worktree:** `worktrees/agent-10-technical-seo`
- **Owner:** `TECHNICAL_SEO`
- **Reviewer:** Task 15 / `QA_PERFORMANCE` (independent)
- **depends_on:** None
- **blocks:** Follow-up technical SEO implementation tasks

## Goal

Establish evidence for crawlability, indexability, metadata, canonical,
hreflang, structured-data, robots, sitemap, and localized-route risks.

## Success Criteria

- A prioritized, evidence-backed report distinguishes defects from hypotheses.
- Every recommendation can be converted into a scoped follow-up task.

## In Scope

- Read route, metadata, redirect, robots, sitemap, schema, headings, and image
  alternatives in source; inspect public pages or non-mutating checks when useful.
- Assess canonical and hreflang consistency across English and localized routes.

## Out of Scope

- Changing `src/`, metadata, redirects, schema, configuration, or production.
- Keyword research, content writing, or implementation of findings.

## File Allowlist

```text
docs/audits/10-technical-seo.md
```

## Forbidden / Shared Files

All files other than the allowlist, including every shared file in `AGENTS.md`.

## Inputs / Evidence

- Repository source, public production pages, reproducible command output, and
  existing historical audit reports when clearly labelled as prior evidence.

## Acceptance Criteria

- Include P0–P3 findings with exact file, route, or reproducible evidence.
- Cover metadata, canonical, hreflang, schema, robots, sitemap, and redirect risk.
- Separate confirmed defects, source-backed risks, runtime unknowns, and hypotheses.

## Validation

```bash
git diff --check
git diff --name-only origin/main...HEAD
git status --short
```

- [x] Diff is limited to the dedicated report plus this Task-owned card and
  append-only worklog.
- [x] No unmeasured browser or search-engine behavior is presented as fact.

## Coordination Items

- Independent Task 15 / `QA_PERFORMANCE` review of
  `33d08a8fda012572a022993eee1ca78fdf61fc7a` returned
  `CHANGES_REQUESTED`; the corrective head requires independent re-review.
- PR #6 merged the reviewed pre-correction head into `main` at
  `9ff03a94fdc0bfb39557953beb76d06c6adfca9d` before independent approval.
  The corrective PR is intended to reconcile that prematurely integrated audit
  record and must not be represented as approved.
- ORCHESTRATOR coordination is required for proposed changes to root layout,
  proxy/middleware, sitemap, robots, redirects, DNS, and global locale routing.
- SEO_CONTENT and GEO_AI_SEARCH need a verified business decision about the
  contradictory concrete-PVA offering statements before implementation.
- Search Console, Bing Webmaster Tools, crawl logs, legacy URL evidence, and
  multi-region DNS/TLS checks remain data requirements.

## Review Status

- Outcome: `CHANGES_REQUESTED`
- Independent reviewer: Task 15 / `QA_PERFORMANCE`
- Reviewed pre-correction head:
  `33d08a8fda012572a022993eee1ca78fdf61fc7a`
- Review date: 2026-09-03
- Corrections requested: downgrade and reframe TSEO-10-03 and TSEO-10-04;
  reconcile severity totals; add aggregate crawl replayability; distinguish the
  audit-content commit from the reviewed delivery head; and record the
  premature PR #6 merge accurately.
- Current state: Corrections applied; independent re-review pending. **Not
  approved.**

## Completion Record

- Audit-content commit: `37c2c3729f2de7e6abaf2900e47abff1a297b247`
  (`audit: complete technical SEO baseline`).
- Reviewed pre-correction head:
  `33d08a8fda012572a022993eee1ca78fdf61fc7a`.
- Current corrective head: the `audit: address Task 10 review findings` commit;
  exact immutable SHA recorded in the corrective push/PR and delivery.
- Base / synchronization commit:
  `9ff03a94fdc0bfb39557953beb76d06c6adfca9d` (PR #6 merge; fast-forwarded
  without rewriting Task 10 history).
- Changed files: `docs/audits/10-technical-seo.md`, this Task-owned
  card, and `worklog/agent-10-technical-seo.md` only.
- Validation results: corrective replacement procedures reproduced the 55-page,
  120-page, and 142-target aggregate observations; final document-only diff and
  scope validation recorded in the append-only worklog.
- Evidence checked: current source routes and SEO helpers; production 55-URL
  sitemap crawl; 120-URL locale/template matrix; robots, sitemap, redirects,
  status codes, rendered HTML/DOM, internal links, schema, images, and
  historical audit-host/public DNS comparison together with the independent
  review's non-reproduction record.
- Report path: `docs/audits/10-technical-seo.md`
- Worklog: `worklog/agent-10-technical-seo.md`
- Remaining risks: Independent re-review and the previously recorded Search
  Console, Bing Webmaster Tools, crawl-log, legacy-URL, backlink, multi-region
  DNS/TLS, and verified concrete-PVA evidence remain outstanding; no Technical
  SEO fix is included.

## Rollback

Revert the corrective audit-record commit if these record changes must be
withdrawn; no runtime behavior is changed by this task.
