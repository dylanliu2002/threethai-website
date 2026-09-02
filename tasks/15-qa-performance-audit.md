# Task 15 — QA / Performance Audit

- **Task ID:** `15`
- **Title:** QA / Performance Audit
- **Mode:** `AUDIT`
- **Role:** `QA_PERFORMANCE`
- **Priority:** `P1`
- **Status:** `READY`
- **Risk:** `HIGH`
- **Branch:** `codex/15-qa-performance-audit`
- **Worktree:** `worktrees/agent-15-qa-performance`
- **Owner:** Unassigned
- **Reviewer:** Unassigned (independent)
- **depends_on:** None
- **blocks:** Follow-up QA, accessibility, and performance tasks

## Goal

Set a reproducible quality baseline and identify static, runtime, responsive,
accessibility, and performance risks for later verification.

## Success Criteria

- The report ranks evidence-backed defects and separates them from runtime risks.
- It supplies a future test matrix and appropriately scoped implementation tasks.

## In Scope

- Read package scripts, configuration, layouts, client boundaries, media, forms,
  navigation, routes, and tests; run non-mutating audit tools when appropriate.
- Assess keyboard semantics, labels, focus, image sizing/loading, error handling,
  likely LCP/CLS/INP/bundle risks, and responsive test coverage.

## Out of Scope

- Editing source, dependencies, configuration, assets, or deployment settings.
- Claiming Lighthouse or browser measurements that were not actually measured.

## File Allowlist

```text
docs/audits/15-qa-performance.md
```

## Forbidden / Shared Files

All files other than the allowlist, including configuration, global layout,
global CSS, forms, dependencies, and deployment files.

## Inputs / Evidence

- Source, tests, reproducible tool output, and explicitly recorded browser or
  device measurements where actually run.

## Acceptance Criteria

- Include P0–P3 findings, accessibility checklist, performance risk register,
  and a 390/768/1440/1920 px verification matrix.
- Mark unmeasured runtime or browser behavior as unverified.

## Validation

```bash
git diff --check
git diff --name-only
```

- [ ] Diff is limited to the dedicated report.
- [ ] Measurements include method and environment when claimed.

## Coordination Items

- None.

## Review Status

- Outcome: Pending

## Completion Record

- Commit:
- Evidence checked:
- Report path: `docs/audits/15-qa-performance.md`

## Rollback

Revert the report-only commit if needed; no website behavior is changed.
