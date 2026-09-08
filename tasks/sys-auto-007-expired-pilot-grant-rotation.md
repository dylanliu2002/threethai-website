# Task SYS-AUTO-007 — Safe Expired Synthetic Pilot Grant Rotation

- **Task Key:** `sys-auto-007-expired-pilot-grant-rotation`
- **Machine Contract:** None; this administrative implementation does not
  authorize or activate machine execution
- **Machine Phase:** None
- **Task ID:** `SYS-AUTO-007`
- **Title:** Safe Expired Synthetic Pilot Grant Rotation
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Codex
- **Current Provider:** Not pinned by this remediation card
- **Current Model Family:** Not pinned by this remediation card
- **Execution Assignment Recorded:** No; this card was added as governance
  remediation after implementation
- **Priority:** `P0`
- **Status:** `REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-007-expired-pilot-grant-rotation`
- **Worktree:** `worktrees/sys-auto-007-expired-pilot-grant-rotation`
- **Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE` (independent review required)
- **depends_on:** None recorded
- **blocks:** Fresh human-authorized execution of the synthetic pilot Grant
  rotation until this implementation is independently approved and merged

## Governance Remediation Notice

This authoritative task card was added after independent review of pull request
#25 identified that SYS-AUTO-007 lacked its repository-required card and
explicit file allowlist. It does not claim that a card existed before this
remediation, does not record retrospective approval, and does not authorize
Grant rotation, activation, worker execution, model execution, merge, or
deployment. The implementation at reviewed head
`b2e3cb4a4e1cc1755b9b81941bd7552f8cc0d00e` remains subject to fresh
independent review together with this card.

## Goal

Provide one narrow controller-administration operation that can replace the
canonical Grant for `sys-auto-pilot-001-synthetic-fixture` only when the
installed Grant is authentic, structurally the exact synthetic-pilot Grant,
and truly expired. Preserve the retired Grant and all historical controller
evidence while issuing a fresh Grant bound to the current restricted-network
contract. Rotation itself must not activate or dispatch anything.

## Success Criteria

- The operation is reachable only through the existing controller
  administration boundary and is unavailable to ordinary worker/runtime
  authority.
- The installed Grant must have a valid strict schema, authorization identity,
  envelope digest, pinned-controller signature, exact pilot identity and
  worktree binding, and an expiry at or before controller time.
- An unexpired, malformed, tampered, wrongly signed, wrong-task, missing, or
  otherwise usable Grant cannot be replaced.
- The exact old canonical Grant bytes are published create-once under the
  controller-owned archive with deterministic collision failure and durable
  SHA-256 audit metadata.
- The fresh Grant has a new authorization ID and issue/expiry window and binds
  the current contract digest, Task Card blob, branch, worktree, and physical
  worktree.
- The fresh Grant preserves `MAX_WORKERS=1`, one dispatch attempt,
  `network=true`, enforced restricted proxying, and
  `allowed_domains=["chatgpt.com"]`.
- GitHub writes, publishing, production, DNS, deployment, task adoption, and
  general autonomous activation remain disabled.
- Historical `CONSUMED` pilot activation, dispatch attempts, authorization
  history, runs, leases, reservations, and prior journal events remain intact.
- Rotation creates no `READY` activation and executes zero workers and zero
  models.

## In Scope

- An administration-only expired synthetic-pilot Grant authenticity path that
  allows expiry solely for retirement inspection and never authorizes work.
- Fail-closed controller state checks for general activation, READY pilot
  activation, live worker leases, live reservations, active runs, and reused
  human authorization IDs.
- Byte-for-byte archival, deterministic collision handling, atomic canonical
  installation, failure recovery, and a replayable non-secret audit event.
- Fresh Grant issuance from the current exact synthetic pilot contract with the
  restricted `chatgpt.com` proxy policy and all existing one-shot safety limits.
- Disposable regression fixtures and tests; read-only inspection of canonical
  authority state is permitted for validation.

## Out of Scope

- Generic Grant replacement, revocation, deletion, or manual unlinking.
- Weakening or adding an ignore-expiry option to normal trusted Grant
  validation or worker/runtime authorization.
- Resetting `CONSUMED` activation to `DISABLED`, erasing dispatch attempts,
  consumed run identity, authorization history, runs, leases, reservations, or
  journal events.
- Creating or arming a new activation, dispatching a worker, invoking a model,
  retrying the synthetic pilot, or exercising rotation against canonical state
  during implementation or review.
- Regenerating controller authority keys, broadening network domains, enabling
  GitHub writes or publishing, or performing production, DNS, deployment, or
  other external actions.
- SEO, application UI/content, dependencies, shared configuration, unrelated
  worktrees, and legacy Task48 work.
- Merge or deployment of pull request #25.

## File Allowlist

```text
workflow/admin/authority-admin.mjs
workflow/authority.mjs
workflow/internal/authority-engine.mjs
workflow/internal/controller-state-engine.mjs
workflow/internal/pilot-admin-engine.mjs
workflow/schemas.mjs
workflow/tests/expired-grant-rotation.test.mjs
```

No controller/runtime implementation or test file may be changed during the
governance-remediation follow-up that adds this card.

## Task-Owned Administrative Files

- **Task card:**
  `tasks/sys-auto-007-expired-pilot-grant-rotation.md`
- **Worklog:**
  `worklog/sys-auto-007-expired-pilot-grant-rotation.md` — append only

These administrative files are task-owned under `AGENTS.md`; they do not
expand the implementation File Allowlist.

## Forbidden / Shared Files

- All files not listed in the File Allowlist or Task-Owned Administrative Files
  are forbidden.
- Repository shared files listed in `AGENTS.md`, including dependency locks,
  application configuration, `.github/`, environment files, and governance
  templates/boards, remain unchanged.
- Canonical controller authority, Grant, runtime state, journal, key, and ACL
  files outside the repository are read-only for implementation and review.

## Inputs / Evidence

- The user-provided SYS-AUTO-007 implementation request defined the operation's
  safety scope and prohibited canonical execution during implementation.
- Pull request #25 reviewed head before this remediation:
  `b2e3cb4a4e1cc1755b9b81941bd7552f8cc0d00e`.
- The repository `AGENTS.md` requires a matching human-readable task card and
  an explicit implementation File Allowlist.
- This remediation records no earlier card, approval timestamp, review
  approval, worker run, or model execution.

## Acceptance Criteria

- Pull request #25 contains this card and every implementation/test path in the
  PR is either in its exact File Allowlist or is a task-owned administrative
  file.
- The remediation commit changes governance metadata only; controller/runtime
  implementation and tests are byte-identical to reviewed head
  `b2e3cb4a4e1cc1755b9b81941bd7552f8cc0d00e`.
- Existing focused and full workflow tests and all requested static/dry-run
  gates remain green without rotating the canonical Grant or creating an
  activation.
- The canonical authority-store aggregate fingerprint is identical before and
  after validation.
- A fresh independent reviewer evaluates the new PR head; this implementation
  task does not approve or merge itself.

## Validation

```bash
# Governance and scope validation
git diff --name-only b2e3cb4a4e1cc1755b9b81941bd7552f8cc0d00e..HEAD
git diff --check

# Focused and full workflow validation
node --test workflow/tests/expired-grant-rotation.test.mjs
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
```

- [x] Task-card structure and allowlist reviewed
- [x] Governance-only remediation diff confirmed
- [x] Focused tests passed
- [x] Full workflow tests passed
- [x] Static and dry-run gates passed
- [x] Canonical authority-store fingerprint unchanged
- [x] Required Git identity verified before commit

## Coordination Items

- Independent review must restart from the new PR head because adding this card
  changes the reviewed commit identity.
- No implementation, test, canonical state, activation, merge, or deployment
  change is requested by this remediation.

## Review Status

- Outcome: Pending fresh independent review
- Independent reviewer evidence: Not yet recorded for the remediation head

## Completion Record

- Governance remediation commit: This governance-only card/worklog remediation
  commit; exact pushed head is recorded in pull request #25 and the delivery
  handoff
- Base / prior reviewed head:
  `b2e3cb4a4e1cc1755b9b81941bd7552f8cc0d00e`
- Governance-remediation changed files:
  `tasks/sys-auto-007-expired-pilot-grant-rotation.md` and an append-only entry
  in `worklog/sys-auto-007-expired-pilot-grant-rotation.md`
- Validation results: PASS — task-card structure and exact seven-path
  allowlist; governance-only scope diff; focused rotation tests `24/24`; full
  workflow tests `162/162`; `validate --all`; `reconcile --dry-run`; `tick
  --dry-run`; lint; typecheck; and `git diff --check`
- Canonical authority-store fingerprint: unchanged at
  `71cc274e5090c03dc5028157519097393209873c2e884ebba7d76cb4e01d339c`
  across validation (5 files)
- Worklog: `worklog/sys-auto-007-expired-pilot-grant-rotation.md`
- Remaining risk: Fresh independent review is required before merge or any
  separately human-authorized canonical rotation execution

## Rollback

Revert the governance-remediation commit if the card itself is incorrect, then
correct it in a new reviewed commit. No runtime rollback is required because
this remediation changes governance metadata only and must not mutate
controller code or canonical authority state.
