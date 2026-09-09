# Worklog — SYS-AUTO-007 Abnormal Worker Diagnostics

## 2026-09-09 — Implementation and validation

- Added a strict, bounded worker-diagnostics schema and derived diagnostics
  from the already-observed child result, Codex JSONL events, output presence,
  parse status, and validation evidence.
- Persisted diagnostics only inside the existing append-only `run.completed`
  journal event when completion is abnormal. Normal successful completion does
  not receive a diagnostics field and retains the prior event payload shape.
- Diagnostic stderr and errors are sanitized, secret-redacted, and capped at
  4096 characters. Validator evidence stores status and digests rather than raw
  validator output.
- Focused diagnostics tests passed `4/4`; full workflow tests passed `176/176`.
  `validate --all`, `reconcile --dry-run`, `tick --dry-run`, lint, typecheck,
  and `git diff --check` passed.
- Every canonical authority file hash remained unchanged across validation.
  Controller state remained revision `34` with SHA-256
  `ab66d1b8f9f7b4e1b4c40fb85c924c9c426035866e57bebaa15f2f5555d87b6c`;
  the journal remained sequence `34` with SHA-256
  `d2ecd0d59f9c97e70583489271f4a27cff447dc3bcd3e6b353d4e398622b857e`.
- No canonical Grant, activation, run, worker, thread, model, lease,
  reservation, permission, scheduler, dispatch, or lifecycle state was changed.
- The implementation is ready for fresh independent `QA_PERFORMANCE` review;
  the implementer does not approve or merge it.

## 2026-09-09 — Independent-review remediation

- Resolved the two review blockers by bounding every variable diagnostic field
  and validator command count, and by making the completion boundary degrade
  malformed diagnostics to a fixed, schema-valid `UNKNOWN` record instead of
  throwing before `run.completed`.
- Resolved the major finding by parsing Codex JSONL line-by-line. Valid events
  before the first malformed or truncated line are preserved for lifecycle
  inference; later content is not parsed or invented, and the degradation is
  stored only as bounded sanitized diagnostic evidence.
- Added adversarial coverage for two-megabyte inputs, oversized thread/signal
  metadata, excessive validator commands, a truthy non-string thread ID with
  terminal cleanup, completion-boundary degradation, and truncated JSONL prefix
  preservation.
- Focused diagnostics tests passed `8/8`; the full workflow suite passed
  `180/180`. Static validation, reconcile and tick dry-runs, lint, typecheck,
  syntax checks, and `git diff --check` passed.
- Canonical controller state and journal remained at revision/sequence `34`;
  all nine authority-file SHA-256 hashes remained byte-identical. No scheduler,
  dispatch, activation, Grant, retry, permission, worker, successful-event, or
  lifecycle behavior changed.
