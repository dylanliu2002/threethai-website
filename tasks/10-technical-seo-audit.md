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
- **Status:** `READY`
- **Risk:** `HIGH`
- **Branch:** `codex/10-technical-seo-audit`
- **Worktree:** `worktrees/agent-10-technical-seo`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
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

- [ ] Diff is limited to the dedicated report.
- [ ] No unmeasured browser or search-engine behavior is presented as fact.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/10-technical-seo.md`

## Rollback

Revert the report-only commit if the audit record must be withdrawn; no runtime
behavior is changed by this task.
