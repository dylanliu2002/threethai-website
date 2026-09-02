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
git diff --name-only
```

- [x] Diff is limited to the dedicated report plus this Task-owned card and
  append-only worklog.
- [x] No unmeasured browser or search-engine behavior is presented as fact.

## Coordination Items

- Independent review requested from Task 15 / `QA_PERFORMANCE`.
- ORCHESTRATOR coordination is required for proposed changes to root layout,
  proxy/middleware, sitemap, robots, redirects, DNS, and global locale routing.
- SEO_CONTENT and GEO_AI_SEARCH need a verified business decision about the
  contradictory concrete-PVA offering statements before implementation.
- Search Console, Bing Webmaster Tools, crawl logs, legacy URL evidence, and
  multi-region DNS/TLS checks remain data requirements.

## Review Status

- Outcome: Pending

## Completion Record

- Commit: `37c2c3729f2de7e6abaf2900e47abff1a297b247`
  (`audit: complete technical SEO baseline`, rewritten by rebase).
- Base / rebase commit: `91443ad6eb36a5f9cb2d08b4d44f374cc260a5ae`.
- Changed files: `docs/audits/10-technical-seo.md`, this Task-owned
  card, and `worklog/agent-10-technical-seo.md` only.
- Validation results: report blob preserved as
  `aa6e986301f8be38fd5437353108705b62cb7bc0`; document-only diff and scope
  validation passed after rebase.
- Evidence checked: current source routes and SEO helpers; production 55-URL
  sitemap crawl; 120-URL locale/template matrix; robots, sitemap, redirects,
  status codes, rendered HTML/DOM, internal links, schema, images, and
  public/default DNS resolution.
- Report path: `docs/audits/10-technical-seo.md`
- Worklog: `worklog/agent-10-technical-seo.md`
- Remaining risks: Independent review and the previously recorded Search
  Console, Bing Webmaster Tools, crawl-log, legacy-URL, DNS/TLS, and verified
  concrete-PVA evidence remain outstanding; no Technical SEO fix is included.

## Rollback

Revert the audit report commit and its Task-owned handoff record if the audit
must be withdrawn; no runtime behavior is changed by this task.
