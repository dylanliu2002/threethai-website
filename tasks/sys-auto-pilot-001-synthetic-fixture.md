# Synthetic Pilot Task SYS-AUTO-PILOT-001

- **Task Key:** `sys-auto-pilot-001-synthetic-fixture`
- **Display Task ID:** `SYS-AUTO-PILOT-001`
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Risk:** `LOW`
- **Priority:** `P1`
- **Status:** `READY`
- **Machine Phase:** `QUEUED`
- **Branch:** `codex/sys-auto-pilot-001-synthetic-fixture`
- **Worktree:** `worktrees/sys-auto-pilot-001-synthetic-fixture`

## Deterministic Fixture Goal

When and only when separately authorized by a human through the reviewed
one-time pilot administration path, create exactly:

```text
workflow/fixtures/pilot/output/synthetic-result.json
```

Its bytes must match
`workflow/fixtures/pilot/expected/synthetic-result.json`. Do not modify any
other file.

## Machine Boundary

- Write files: only the exact output file above.
- Write prefixes: none.
- Network and secrets: forbidden.
- Git commit, push, pull request, merge, publishing: forbidden.
- Production, DNS, and deployment: forbidden.
- Task adoption: forbidden.
- `MAX_WORKERS`: exactly one.
- Timeout: 300 seconds.
- The one-time activation is consumed before process launch on the first
  dispatch attempt, whether that attempt later succeeds or fails.

## Activation

This card and its machine contract do not activate themselves. A matching
controller-signed Grant and a fresh explicit human authorization ID are both
required. Generic or permanent activation is unavailable.

## Validation

```bash
git diff --check
node workflow/cli.mjs validate --all
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
```

## Execution Record

- Real worker executed during SYS-AUTO-004: `NO`
- Expected output is tracked under `workflow/fixtures/pilot/expected/`; the live
  output path must remain absent until a separate pilot authorization.

