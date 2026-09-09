# Task 56 — SYS-AUTO-007 Worker Authority Context Handoff

- **Task Key:** `sys-auto-007-worker-auth-context`
- **Task ID:** `SYS-AUTO-007 Delta`
- **Mode:** `IMPLEMENT`
- **Execution Responsibility:** `IMPLEMENTER`
- **Governance Role / Owner:** `ORCHESTRATOR`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent review required)
- **Status:** `BLOCKED`
- **Priority:** `P0`
- **Risk:** `HIGH`
- **Branch:** `codex/56-sys-auto-worker-auth-context`
- **Worktree:** `worktrees/sys-auto-007-worker-auth-context`
- **Base:** `3b38e53f11597949f643ee97ff2283b2aafa1ca4`

## Authorization and Goal

After successful controller admission, bind the already-authorized runtime
identity into the worker handoff so the worker recognizes the dispatched run
and executes the restricted synthetic task instead of requesting a second
authorization. The handoff must carry the exact task key, run ID, one-shot
activation ID, Grant authorization ID, lease ID, and fencing token already
validated by the controller.

This Task does not authorize a scheduler tick, retry, Grant rotation,
activation creation, permission change, canonical-state mutation, or a new
authorization layer. The worker must not invent a run identity or receive a
controller signing credential.

## Explicit File Allowlist

```text
workflow/internal/run-engine.mjs
workflow/tests/worker-authority-context.test.mjs
tasks/56-sys-auto-worker-auth-context.md
worklog/agent-56-sys-auto-worker-auth-context.md
```

Every other repository file and every canonical controller artifact is outside
scope.

## Required Behavior

- Construct the authority context only after the controller validates the
  capability against current Grant, run, lease, and fencing state.
- Bind the worker prompt to the exact authoritative task, run, activation,
  Grant authorization, lease, and fencing identities.
- State that the worker is executing an already-admitted run and must neither
  invent a replacement run identity nor demand a second human authorization.
- Do not pass controller private keys, capability signatures, provider API
  keys, or other secrets to the worker.
- Preserve controller admission, lifecycle, retry, worker execution, and
  ChatGPT subscription-authentication behavior.

## Required Tests

- An admitted synthetic-pilot dispatch delivers the exact authority binding to
  the worker and accepts a matching completed result rather than `BLOCKED`.
- The handed-off identities match the authoritative activation, Grant, run,
  lease, and fencing records.
- Existing workflow validation remains green without canonical mutation.

## Validation

```bash
node --test workflow/tests/worker-authority-context.test.mjs
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
git diff --check
```

## Coordination Items

- Historical consumed activations and failed runs remain immutable evidence.
- A future real pilot requires a fresh lifecycle and separate authorization;
  this implementation performs no canonical execution.
- Current `origin/main` fails the repository-wide lint command in
  `src/components/ui/carousel.tsx` and `src/hooks/use-mobile.ts` under the
  lockfile ESLint version. Both files are unchanged from `origin/main` and
  outside this Task's allowlist. Task-scoped lint passes; review readiness is
  blocked until the main baseline gate is restored or governance explicitly
  accepts the verified baseline failure.

## Completion Record

- Focused worker-authority regression: `1/1` passed.
- Full workflow suite: `197/197` passed.
- `validate --all`, `reconcile --dry-run`, and `tick --dry-run` passed with no
  mutation.
- Typecheck and `git diff --check` passed.
- Task-scoped ESLint passed; repository-wide ESLint is blocked only by the two
  unchanged main-baseline files recorded above.
- Canonical authority, controller state, and journal bytes remained unchanged.
