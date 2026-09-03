# Autonomous Workflow (Bootstrap v1)

## Activation status

**DISABLED.** SYS-AUTO-001 implements and tests a manually supervised,
live-capable design. It does not activate a heartbeat, Automation, worker,
GitHub mutation, existing-task adoption, unattended run, or production action.
Independent approval and a separate explicit activation authorization are
required before any live operation.

## Native Codex and Symphony alignment

The controller deliberately remains small. It follows the Symphony-style
separation between task-centered orchestration and worker reasoning: durable
tasks are scheduled into isolated worktrees with bounded concurrency, while the
worker chooses the investigation and implementation approach within the exact
contract. ThreeThai-specific authorization, review and external-action controls
remain deterministic controller responsibilities.

The installed Codex CLI is the MVP runtime because it directly supports the
needed non-interactive primitives. Official OpenAI documentation confirms:

- [`codex exec` non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)
  is designed for scripts/CI, supports explicit sandboxes, JSONL event streams,
  JSON Schema final output and an output file for the last message;
- [`AGENTS.md` instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
  are layered repository guidance loaded for every run;
- [repository Skills](https://learn.chatgpt.com/docs/build-skills) use a required
  `SKILL.md` plus optional scripts/references/assets and progressive disclosure.

The bootstrap therefore uses `codex exec` rather than adding an SDK/App Server
dependency. App Server is a valid later integration if live supervision needs
bidirectional session control that the CLI cannot provide. No external
orchestrator is copied and no continuously rewritten `tasks/state.json` exists.

## Durable identity and sources of truth

```text
task_key != display task_id != Role != worker_id != thread_id != run_id
```

The canonical machine identity is the full `task_key`. The strict versioned JSON
contract is the authorization source; Task Cards, prompts, issue text, worker
output and worklogs cannot broaden it. `card_blob_sha`, `contract_revision` and
`scope_digest` bind the recorded card and permissions. Unknown fields and schema
versions fail closed.

Repository/GitHub artifacts remain durable coordination state:

- Task Contract: what is authorized;
- append-only runtime events outside the tracked source tree: what happened;
- review record: exact reviewed base/head, run independence and evidence;
- PR metadata: integration fact;
- Git history: historical provenance.

Runtime events must use controller-assigned monotonic sequence numbers,
idempotent event IDs and controller run IDs. The controller can replay them on
restart. A merge never manufactures `APPROVED` status.

## Lifecycle

```text
DRAFT / INTAKE
  -> READY / QUEUED
  -> IN_PROGRESS / IMPLEMENT
  -> IN_PROGRESS / VALIDATE
  -> REVIEW / INDEPENDENT_REVIEW
  -> CHANGES_REQUESTED / CORRECT -> IN_PROGRESS / VALIDATE
  -> APPROVED / CLOSEOUT
  -> APPROVED / PR_READY
  -> APPROVED / WAITING_FOR_MERGE
  -> MERGED / COMPLETE
```

`BLOCKED/<reason>` stops the affected task. `ON_HOLD/<reason>` is never eligible
for dispatch. Corrective runs return to the same owner Role, branch and worktree,
then require validation and a fresh independent review. Three completed
correction cycles are the MVP limit; the next request becomes `BLOCKED`.

Approval binds reviewed base/head, contract revision, validation digest and
policy revision. Any substantive change invalidates it. Closeout is idempotent,
may write only `administrative_files`, and must record a separate Closeout Head.

## Admission and scheduling

Admission requires all of the following:

1. supported strict contract and authorization decision;
2. card blob and scope digest match;
3. legal status/phase pair and satisfied dependency DAG;
4. independent owner/reviewer Roles;
5. approved model route with no silent fallback;
6. activation and worker-dispatch permissions;
7. clean, unambiguous worktree for any separately authorized adoption;
8. available concurrency and all required locks.

Default `MAX_WORKERS` is two and is configuration, not permanent architecture.
Duplicate wakeup IDs cannot create duplicate runs. Disjoint scopes may acquire
leases concurrently; overlapping case-normalized paths serialize.

## Lock and path model

The lock manager supports controller, task/worktree, path reservation,
shared-governance, resource/build and Git-operation locks. A lease owns the
right to continue/publish; stale workers fail closed after lease loss.

All write paths are repository-relative, NFC-normalized and compared
case-insensitively for Windows. Absolute paths, empty segments, traversal and
symlink/junction escape are rejected. Rename validation includes both source and
destination. Administrative paths participate in write scopes and locks.

The controller never resets, stashes, deletes or recreates an existing dirty
worktree automatically.

## Codex execution adapter

For a live run after activation, the adapter constructs:

```text
codex exec -
  --cd <absolute-worktree>
  --model <approved-model>
  --sandbox <least-required-sandbox>
  --json
  --output-schema <temporary-schema>
  --output-last-message <temporary-result>
```

The prompt is sent over stdin. The controller supervises timeout/cancellation,
requires exit status zero, parses JSONL, binds the reported `thread_id`, and
strictly validates final output against authoritative task/run/Role identity.
Temporary result files live outside the repository and are removed. Free-form
prose is never the sole state-transition input.

## Independent review and publishing

Review requires a different Role, worker, thread and run from implementation,
no implementation contribution, and exact reviewed base/head. Read-only
repository access is preferred. Reviewer output is structured and is still
subject to controller validation.

Git commit, branch push, PR creation and merge are separate permissions. The Git
identity gate is exact. PR creation additionally requires explicit GitHub-write
permission. Production, DNS, secrets and external actions remain human gates.
The bootstrap's live PR adapter always throws because SYS-AUTO-001 is not
activated.

## Wake mechanism and activation

A future Codex heartbeat/Automation may wake `tick`, but it must not contain
authorization and must stay quiet on unchanged state. The contract and current
repository state determine eligibility. Activation requires a new explicit
authorization covering runtime directory, credentials/auth strategy, sandbox,
GitHub permissions, selected pilot tasks, notification policy, operator/stop
procedure and rollback. Until then, only these commands are permitted:

```bash
node workflow/cli.mjs validate --all
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
```

Dry-run returns structured plans with empty mutation lists and zero workers or
automations started.
