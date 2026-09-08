# Worklog — SYS-AUTO-007 Expired Synthetic Pilot Grant Rotation

Task ID: SYS-AUTO-007
Role: ORCHESTRATOR
Branch: codex/sys-auto-007-expired-pilot-grant-rotation
Base: 4c2c969f02e807e8172688246861406ac01f8395

## 2026-09-08 — Implementation and validation

- Added the narrow `rotateExpiredSyntheticPilotGrant` controller
  administration operation. Generic Grant replacement, generic revocation,
  activation, worker dispatch, and runtime authority entry points remain
  absent from the operation.
- Added an administration-only retirement validator for the authentic original
  offline pilot Grant schema and the current restricted-network Grant schema.
  It verifies the strict schema, pinned signer, envelope digest, signature, and
  explicit expiry while refusing unexpired Grants. Normal trusted Grant loading
  remains current-schema-only and continues to reject expired Grants.
- Required the exact synthetic task, branch, registered worktree and physical
  worktree binding; a matching pinned controller keypair; the current validated
  machine contract; general activation off; no READY pilot activation; no live
  worker lease or reservation; no active run; and a fresh human authorization
  ID absent from historical authorization and rotation records.
- Preserved historical `CONSUMED` activation state, dispatch attempts,
  authorization history, runs, leases, reservations, and journal events.
  Rotation does not arm a new activation or start a worker.
- Implemented create-once atomic archive publication under
  `grants/archive/sys-auto-pilot-001-synthetic-fixture/`, preserving the exact
  canonical bytes under a deterministic authorization-ID filename. The raw
  file SHA-256, old/new authorization identities, new envelope digest,
  timestamp, and authority-relative archive identifier are recorded in a
  durable controller journal event and replayable state history.
- Prepared the fresh signed Grant from the current contract with a new
  authorization ID, issue time, expiry, contract/card binding, revision,
  `network=true`, enforced restricted proxy, exact `chatgpt.com` allowlist, one
  worker, one dispatch attempt, and disabled GitHub write, publishing,
  production, DNS, deployment, task adoption, and autonomous activation.
- Used temporary files plus atomic publication for archive and canonical Grant
  visibility. A simulated install failure after archive publication preserved
  both the unchanged canonical old bytes and the exact archived evidence; an
  archive collision failed closed without overwrite.
- Added 24 focused disposable-state regressions covering the requested success,
  rejection, preservation, atomicity, active-loader isolation, and journal
  replay cases. No test used the canonical real controller store.
- Negative control passed: temporarily disabling the unexpired-Grant guard made
  `ROTATE-04` fail with `Missing expected exception`; restoring the guard made
  the focused suite pass `24/24`.
- Read-only validation authenticated the installed historical revision-1,
  `network=false` Grant for retirement without invoking the rotation API.
- Full workflow tests passed `162/162`; `validate --all`,
  `reconcile --dry-run`, `tick --dry-run`, lint, typecheck, and
  `git diff --check` passed.
- The canonical authority aggregate fingerprint remained
  `71cc274e5090c03dc5028157519097393209873c2e884ebba7d76cb4e01d339c`
  across final validation (5 files). No canonical Grant, controller state,
  journal, key, or ACL was mutated.
- No worker was executed, model invoked, activation armed, Grant rotated,
  GitHub write performed, or production/DNS/deployment action taken.
- Implementation is ready for fresh independent `QA_PERFORMANCE` review. The
  implementer does not approve or merge this change.
