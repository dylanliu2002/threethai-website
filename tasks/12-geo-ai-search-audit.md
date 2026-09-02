# Task 12 — GEO / AI Search Audit

- **Task ID:** `12`
- **Title:** GEO / AI Search Audit
- **Mode:** `AUDIT`
- **Role:** `GEO_AI_SEARCH`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** `Codex`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** Yes — 2026-09-03
- **Priority:** `P1`
- **Status:** `READY`
- **Risk:** `MEDIUM`
- **Branch:** `codex/12-geo-ai-search-audit`
- **Worktree:** `worktrees/agent-12-geo-ai-search`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
- **depends_on:** None
- **blocks:** Follow-up GEO / AI-search implementation tasks

## Goal

Assess whether current answer, knowledge, product, and company information can
be extracted, trusted, and cited by answer engines without overstating visibility.

## Success Criteria

- The report separates extractability, authority, and factual support.
- It identifies questions, evidence gaps, trust signals, and scoped next tasks.

## In Scope

- Read answer, knowledge, application, product, company-evidence, and schema
  sources for definitions, comparisons, citations, dates, entity consistency,
  authorship, and answer-first structure.

## Out of Scope

- Editing sources, schema, content, links, or pages.
- Claiming ChatGPT, Gemini, Perplexity, or AI Overview visibility without proof.

## File Allowlist

```text
docs/audits/12-geo-ai-search.md
```

## Forbidden / Shared Files

All files other than the allowlist, including every shared file in `AGENTS.md`.

## Inputs / Evidence

- Source content, public material with direct citations, and observed output
  clearly labelled by date and verification method.

## Acceptance Criteria

- Include an intent-grouped AI user-question set and citation-readiness scorecard.
- Flag every proposed claim that needs owner-supplied proof.
- Keep unsupported visibility and authority claims out of the report.

## Validation

```bash
git diff --check
git diff --name-only
```

- [ ] Diff is limited to the dedicated report.
- [ ] Every finding has source or reproducible evidence.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/12-geo-ai-search.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
