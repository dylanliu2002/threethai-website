# Task SYS-AUTO-007 — Structured Worker Output Schema Compatibility

- **Task Key:** `sys-auto-007-model-output-schema`
- **Task ID:** `SYS-AUTO-007`
- **Title:** Fix Codex Structured Worker Output Schema
- **Mode:** `IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Risk:** `HIGH`
- **Priority:** `P0`
- **Status:** `REVIEW`
- **Branch:** `codex/55-sys-auto-output-schema`
- **Worktree:** `worktrees/sys-auto-007-output-schema`
- **Base:** `12741462dcc3b6ffe905f6429c5d35b7e16a4ffc`

## Goal

Correct only the JSON Schema emitted through `codex exec --output-schema` so
every property has an explicit valid JSON Schema type and the schema satisfies
the supported strict Structured Outputs shape. Reject an invalid controller
schema before it can cross the model-request boundary, without changing the
successful synthetic worker-result contract.

## Scope

- Add the missing explicit types to constant- and enum-constrained properties
  in both the runtime schema and its tracked JSON copy.
- Add a narrow fail-closed structural assertion for the emitted schema,
  including typed properties/items, complete `required` arrays, and
  `additionalProperties: false` on objects.
- Invoke that assertion before a worker run is marked started or a Codex child
  process can be launched.
- Add disposable regression coverage for explicit typing, schema validity,
  request-boundary rejection, and the unchanged successful output contract.

## Explicit File Allowlist

```text
workflow/schemas.mjs
workflow/schemas/worker-result.schema.json
workflow/internal/run-engine.mjs
workflow/tests/worker-output-schema.test.mjs
```

## Task-Owned Administrative Files

- `tasks/sys-auto-007-model-output-schema.md`
- `worklog/sys-auto-007-model-output-schema.md` — append only

## Forbidden

- Scheduler, dispatch, activation, Grant, retry, diagnostics, permission, or
  worker-lifecycle behavior changes.
- A real tick, dispatch, worker, thread, model request, activation, Grant
  rotation, or canonical controller mutation.
- Dependency, shared-file, policy, unrelated source, or historical-state
  changes.

## Acceptance

- [x] Every emitted property schema has a valid explicit `type`.
- [x] The generated schema passes the local strict Structured Outputs guard.
- [x] A malformed schema fails before worker start or model invocation.
- [x] A known-good synthetic worker result retains its existing shape and
  validation behavior.
- [x] Focused and full workflow tests pass. Focused tests pass `4/4`; the full
  workflow suite passes `184/184` in a disposable repository/authority context.
- [x] `validate --all`, reconcile/tick dry-runs, lint, typecheck, and
  `git diff --check` pass.
- [x] Canonical authority bytes, controller state, and journal remain unchanged.

## Validation Context Resolution

The two pre-existing tests that call a non-dry-run `tick` are coupled to the
repository-derived authority context. They do not require fresh pilot execution
authorization: their purpose is to exercise the inactive/unprovisioned path and
assert zero workers and zero external mutation. The complete suite therefore
ran from a disposable clone whose repository identity derived an isolated,
unprovisioned authority path. Both tests passed, and the disposable authority
root remained absent before and after execution. Canonical authority was never
used by the test process.

## Fresh-review Schema Guard Remediation

- [x] Reject `allOf` before schema serialization.
- [x] Reject any schema keyword outside the guard's explicit supported subset,
  including at nested property and item nodes.
- [x] Preserve acceptance of the tracked worker output schema.
- [x] Preserve the successful synthetic worker-result contract.
- [x] Focused tests pass `6/6`; full workflow tests pass `186/186` in the
  isolated disposable context.
- [x] Static validation, reconcile/tick dry-runs, lint, typecheck, and diff
  checks pass with canonical state unchanged.

## Fresh-review Constraint Value Remediation

- [x] Reject a non-string or non-compiling `pattern` before serialization.
- [x] Require `enum` to be a non-empty array of valid JSON literals matching
  the declared type.
- [x] Reject duplicate enum values using canonical JSON value equality.
- [x] Accept valid patterns and valid unique enums.
- [x] Preserve the tracked worker-result schema and successful output contract.
- [x] Focused tests pass `11/11`; full workflow tests pass `191/191` in the
  isolated disposable context.
- [x] Static validation, reconcile/tick dry-runs, lint, typecheck, and diff
  checks pass with canonical state unchanged.

## Validation

```text
node --test workflow/tests/worker-output-schema.test.mjs
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
git diff --check
```

## Rollback

Revert the task commit. No canonical runtime rollback is required because this
task must not operate on canonical state or launch a worker.
