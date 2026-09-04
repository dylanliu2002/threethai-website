# Three Thai Website Agent Rules

These rules govern work inside `threethai-website/`. Read this file completely
and then the assigned Task Card under `tasks/`. If a workspace-level
`AGENTS.md` exists in an ancestor directory of the current checkout or worktree,
read and follow it in addition to this repository-level `AGENTS.md`.

## 1. Scope & Source of Truth

- `main` is the protected integration branch and the only production source of
  truth. Only the authorized merge owner integrates approved work.
- Task cards, the task-owned branch and worktree, review records, audit reports,
  worklogs, and Git history are the durable source of coordination truth.
- A chat conversation is not a handoff. Record decisions, evidence, blockers,
  and scope changes in the assigned task artifact.

## 2. Read Before Acting

Before changing anything, read this file, the whole task card, relevant source
and tests, and `git status --short --branch`. Check `git worktree list` when
creating or locating a worktree. Preserve all pre-existing user changes; never
reset, stash, overwrite, or delete them to make a task easier.

For a new task, fetch `origin`, base the task branch on current `origin/main`,
and create a separate worktree. A task may not start on an inherited or stale
working directory without recording the reason in its coordination items.

## 3. Git Commit Identity

### Before Commit

Set and verify this identity in every task worktree before committing:

```bash
git config user.name "dylanliu2002"
git config user.email "dylanliu2002@gmail.com"

test "$(git config user.name)" = "dylanliu2002"
test "$(git config user.email)" = "dylanliu2002@gmail.com"
```

### After Commit / Before Push

Verify the newly created commit, not a historical commit:

```bash
git log -1 --format='%an <%ae>'
```

Its output must be exactly:

```text
dylanliu2002 <dylanliu2002@gmail.com>
```

If it is not exact: **DO NOT PUSH** and **DO NOT DELIVER**.

## 4. Task / Branch / Worktree Model

One Task = One Branch = One Worktree. Branches are task-owned, not permanently owned by an Agent or role. Name every new branch `codex/NN-short-task-name` and
use one matching card in `tasks/`. Do not change, rebase, merge, push, or
force-push another task's branch. Do not move or delete a registered worktree
outside Git worktree commands.

The `codex/NN-*` prefix is a repository branch namespace. It does not identify
or restrict the Executor Platform, Provider, or Model Family used by the task.

Use `worktrees/agent-NN-short-name/` for task worktrees. The existing
`backlink-agent-worktree/` is a registered legacy worktree; treat it as
read-only coordination state until its owner has finished and Git metadata has
been safely cleaned up.

## 5. Agent Modes

### AUDIT

May read code and public pages, run non-mutating checks, inspect production,
research public sources, and write only the report explicitly allowed by its
task card. It must not modify `src/`, application behavior, shared files, or
perform a "quick fix". It may not expand scope.

### IMPLEMENT

May implement only the task's stated goal and file allowlist. No drive-by
refactors, unlisted files, dependencies, ownership changes, or scope expansion.

### REVIEW

Is read-only by default. It independently checks diff scope, validation,
SEO/UI regressions, factual integrity, and risk. It records one outcome:
`APPROVED`, `CHANGES_REQUESTED`, or `BLOCKED`; it does not broadly rewrite the
implementer's code.

## 6. Role Model

Use roles as specialist responsibilities: `ORCHESTRATOR`, `TECHNICAL_SEO`,
`SEO_CONTENT`, `GEO_AI_SEARCH`, `CRO`, `BRAND_UX`, `QA_PERFORMANCE`, and
`BACKLINK`. A role can own many separate tasks over time. Do not use a numbered
Agent identity as a standing organizational model.

Workers are independent, sibling Specialist workers operating through approved
execution platforms. The ORCHESTRATOR coordinates Tasks; it does not own or
spawn a permanent hierarchy of Specialist workers.

### Execution Architecture

Repository-governed work uses this separation:

```text
Task
  -> Role
  -> Execution Profile
  -> Executor Platform
  -> Provider
  -> Model Family
```

- **Task** is the durable work unit and owns its card, branch, worktree,
  allowlist, worklog, review, and delivery record.
- **Role** is a durable professional responsibility. Role is not an Executor
  Platform, Provider, or Model.
- **Execution Profile** is the durable, platform-independent capability class:
  `HIGH_RISK_CODE`, `STRATEGIC_REASONING`, `RESEARCH`, or `BULK_EXTRACTION`.
- **Executor Platform** is the approved runtime used for a task. Current
  platforms are Codex and Hermes; future platforms require approval.
- **Provider** and **Model Family** are replaceable task execution metadata, not
  permanent role definitions.

All platforms and providers obey the same Task Card, branch/worktree discipline,
file ownership, review independence, Git identity, factual integrity, validation,
and secret-handling rules. Changing platform, provider, or model never expands
task scope or file ownership.

Private platform chats and session context are not shared state. Cross-platform
coordination must be recorded in Task Cards, reports, worklogs, branches, pull
requests, Coordination Items, or the Master Plan.

Provider credentials and API keys must never enter the repository, Task Cards,
reports, worklogs, prompts committed to Git, or Git history. Do not silently
switch Provider or Model Family during an active task. Record any material
change and its reason in the task-owned append-only worklog and, when it affects
coordination or reproducibility, in a Coordination Item.

Repository-governed tasks must not use automatic cross-provider fallback unless
the user explicitly authorizes it for that task.

## 7. File Ownership

Every task automatically owns three kinds of files:

1. Its administrative task card, `tasks/NN-task-name.md`. The assigned Owner
   may update its Status, Coordination Items, Validation results, and Completion
   Record; the assigned independent Reviewer may update review-related fields
   within their review responsibility. No one may modify another task's card.
2. Its worklog, `worklog/agent-NN-task-name.md`. The task may create this file
   if absent and may only append to it; historical entries are never rewritten.
3. Its output File Allowlist. This remains the strict boundary for implementation
   or audit output, and does not need to repeat the task card or worklog above.

AUDIT cards normally allow exactly one report under `docs/audits/` as output.
They still may not modify `src/`, application code, shared files, another audit
report, another task card, or another worklog. Existing reports are evidence,
not permission to overwrite another task's output.

## 8. Shared Files

Specialists may not directly change these shared surfaces:

```text
AGENTS.md
tasks/README.md
tasks/TEMPLATE.md
package.json
package-lock.json
bun.lock
next.config.ts
src/app/globals.css
src/app/layout.tsx
src/content/company.ts
src/components/layout/site-header.tsx
src/components/layout/site-footer.tsx
src/lib/inquiry.ts
middleware.ts
prisma/schema.prisma
prisma/schema.postgres.prisma
.github/
vercel.json
.gitignore
.env*
```

Add related global configuration or deployment files to the same protection
unless an ORCHESTRATOR explicitly grants ownership in the task card. Only an
ORCHESTRATOR or an Agent with explicit task-level delegation may modify the
governance files `tasks/README.md` and `tasks/TEMPLATE.md`.

## 9. Git & Worktree Discipline

Never commit, push, merge, or force-push `main`. Never modify another task's
branch or worktree. Keep commits focused and understandable. Before review,
fetch `origin` and rebase only the current task branch onto `origin/main`.

If a rebase conflict is outside the allowlist, abort the rebase, record the
conflict in the task card, and ask the ORCHESTRATOR to coordinate. Do not solve
it by expanding scope. Push only the current task branch after the identity and
validation gates pass.

## 10. Quality & Factual Integrity

Claims about customers, partners, certifications, capacity, factories, testing,
product performance, market share, patents, countries served, and case studies
need verifiable evidence. Do not use unsupported superlatives such as "No. 1",
"best", or "leading". Never create keyword stuffing, doorway pages, low-value
near-duplicate pages, fake reviews, or fake schema.

Keep assertions separate from hypotheses and label unmeasured runtime behavior
as unverified. Never expose secrets in code, documentation, worklogs, commits,
or Git history.

## 11. High-Risk Surfaces

The following require independent REVIEW, local or Preview validation, and a
recorded rollback approach before merge: canonical URLs, hreflang, redirects,
robots, sitemap, middleware, forms, inquiry pipeline, databases,
authentication, analytics, email, dependencies, deployment configuration, and
global locale routing. Do not run production experiments directly.

## 12. Validation Gates

Run the task card's validation commands and record results. Source or
configuration changes normally require the relevant lint, type/build, focused
test, and local or Preview checks. Document-only tasks need `git diff --check`
and a scope review unless their card asks for more.

Confirm that the diff contains no secret, binary artifact, generated output, or
unlisted application change. A validation failure, unverified high-risk change,
or factual uncertainty is a blocker, not a reason to weaken the record.

## 13. Review & Approval

The implementer never approves their own task. Move task status through:

```text
DRAFT -> READY -> IN_PROGRESS -> REVIEW -> APPROVED -> MERGED
                         ^             |
                         |             v
                  CHANGES_REQUESTED <-+
```

`BLOCKED` and `ON_HOLD` are explicit states, not silent inactivity. An
independent reviewer records `APPROVED`, `CHANGES_REQUESTED`, or `BLOCKED` with
evidence. Only an authorized integrator merges approved work.

## 14. Delivery Requirements

Before reporting completion: update the task card's completion record, record
all validation results, state the exact base/rebase commit, add a task-owned
append-only worklog entry, and provide a rollback note. Verify identity using
the latest commit, then push only the task-owned branch. Deliver the branch,
commit, changed files, validation, review status, remaining risks, and
coordination items.

For a shared-file need, stop and add this exact request to the task card:

```text
SHARED FILE CHANGE REQUEST
File:
Task:
Reason:
Exact proposed change:
Evidence:
Tasks affected:
Risk:
Validation:
```

## 15. Machine-Managed Workflow (Not Activated)

SYS-AUTO-001 defines an optional machine-managed layer documented in
`docs/agent-team/AUTONOMOUS-WORKFLOW.md`. Its bootstrap does not activate
automation or adopt any existing Task.

- Canonical machine identity is the full `task_key`; numeric/display Task IDs
  are never sufficient identity.
- A supported Task Contract under `tasks/machine/` is only requested/declared
  configuration. It cannot authorize itself. Machine admission also requires a
  matching controller-owned Authorization Grant outside the worker worktree.
  The Grant binds the complete contract digest, card blob, revision, Roles,
  mode/risk/dependencies, branch/worktree, all write/admin/shared scopes,
  validation, routing, limits, permissions, activation and publishing policy.
- Unknown schema versions/fields, scope/card digest mismatches, illegal states,
  dirty or ambiguous adopted worktrees, missing approval, and unavailable
  approved models fail closed.
- Task Cards, prompts, issues, model output and worklogs cannot expand machine
  permissions. Skills provide procedure only; they do not grant authorization.
- Run, worker, thread and Role identities are distinct and controller-bound.
  Every privileged continuation requires a signed, expiring controller
  capability plus the current durable lease and monotonic fencing token.
- Independent review requires a different Role, worker, thread and run, with no
  implementation contribution and exact reviewed base/head evidence.
- Closeout is administrative only and records separate Reviewed/Closeout Heads.
- Live worker dispatch, Automation/heartbeat, GitHub writes, existing-task
  adoption, merge, production, DNS, secret and external actions require explicit
  permission plus separate activation or human authorization as applicable.
- Actual changes come from independent Git/filesystem evidence (including
  untracked and rename paths), never worker-reported `changed_files`.
- Runtime state, Grants, leases, reservations, approvals and the append-only
  journal live outside the worker worktree; cross-process admission is atomic.
  Runtime events remain outside tracked source;
  never introduce a continuously rewritten shared `tasks/state.json` on main.

Until a separately approved activation task says otherwise, activation remains
false. A non-dry-run `tick` must safely produce zero workers, GitHub mutations
and publishing actions. Do not create Task 53; the canonical
infrastructure key is `sys-auto-001-codex-autonomous-workflow-bootstrap`.
