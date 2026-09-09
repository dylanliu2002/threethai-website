# Task SYS-AUTO-007 — Abnormal Worker Diagnostics

- **Task Key:** `sys-auto-007-worker-diagnostics`
- **Task ID:** `SYS-AUTO-007`
- **Title:** Persist Sanitized Abnormal Worker Diagnostics
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Risk:** `HIGH`
- **Priority:** `P0`
- **Status:** `REVIEW`
- **Branch:** `codex/54-sys-auto-worker-diagnostics`
- **Worktree:** `worktrees/sys-auto-007-worker-diagnostics`

## Goal

Persist enough sanitized, append-only evidence on abnormal worker completion to
distinguish thread, model, structured-output, and validator failures without
changing scheduler, dispatch, activation, Grant, retry, permission, or worker
execution behavior.

## Scope

- Derive bounded diagnostics from the already-observed child-process result,
  Codex JSONL lifecycle events, structured-output presence, parse failure, and
  controller validation evidence.
- Add those diagnostics only to the existing append-only `run.completed`
  journal event when execution is abnormal.
- Redact secrets before diagnostics cross the durable-state boundary.
- Add disposable regression tests for abnormal persistence, journal
  append-only behavior, and unchanged successful execution behavior.

## Explicit File Allowlist

```text
workflow/internal/run-engine.mjs
workflow/internal/lease-engine.mjs
workflow/schemas.mjs
workflow/tests/worker-diagnostics.test.mjs
```

## Task-Owned Administrative Files

- `tasks/sys-auto-007-worker-diagnostics.md`
- `worklog/sys-auto-007-worker-diagnostics.md` — append only

## Forbidden

- Scheduler or dispatch behavior changes.
- Activation or Grant lifecycle changes.
- Retry/re-arm behavior changes.
- Permission, sandbox, network, or execution-semantics changes.
- Canonical controller execution or mutation.
- Manual synthetic output creation or historical state cleanup.

## Acceptance

- [x] An abnormal worker exit records exit/termination, thread lifecycle, model
  stage, sanitized stderr/error, output presence, and validator evidence in the
  existing `run.completed` journal event.
- [x] The evidence is replay-safe and append-only.
- [x] A successful execution does not receive the abnormal diagnostic payload and
  retains its existing status and event behavior.
- [x] Focused tests use disposable state only; the full workflow suite and the
  repository's read-only/dry-run validation pass without changing canonical
  authority bytes.

## Independent-review remediation

- [x] Bound thread IDs to `256` characters, close signals to `64` characters,
  validator signal strings to `64` characters, and validator evidence to `32`
  commands.
- [x] Normalize builder inputs and degrade invalid completion diagnostics to a
  fixed bounded `UNKNOWN` record so diagnostics cannot prevent terminal run
  persistence or lease/reservation cleanup.
- [x] Parse JSONL incrementally, retaining only the valid prefix before the
  first malformed line and recording bounded parse-degradation evidence.
