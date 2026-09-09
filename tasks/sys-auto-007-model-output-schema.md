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
- **Status:** `BLOCKED`
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
- [ ] Focused and full workflow tests pass. Focused tests pass `4/4`; `182/184`
  full-suite tests are established passing, while two existing canonical
  non-dry-run tick tests remain unexecuted under the controller principal
  because elevated execution was denied as a canonical-mutation risk.
- [x] `validate --all`, reconcile/tick dry-runs, lint, typecheck, and
  `git diff --check` pass.
- [x] Canonical authority bytes, controller state, and journal remain unchanged.

## Validation Blocker

The sandbox run cannot read the isolated canonical authority root, so the two
pre-existing tests that call a non-dry-run canonical `tick` fail at `realpath`
before their assertions. An elevated full-suite run was denied because those
tests could mutate canonical state. This task will not bypass that safety gate.
All other tests, including the authority-dependent read-only/dry-run regression
file under the controller principal, pass. Fresh controller-context execution
of those two existing tests remains required before independent review.

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
