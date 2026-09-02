# Three Thai Website Agent Rules

These rules govern work inside `threethai-website/`. Read this file completely,
then the assigned `tasks/NN-short-task-name.md` card; `../AGENTS.md` supplies the wider collaboration rules.

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

Set and verify this identity in every task worktree before committing:

```bash
git config user.name "dylanliu2002"
git config user.email "dylanliu2002@gmail.com"
git log -1 --format='%an <%ae>'
```

The final verification must be exactly:

```text
dylanliu2002 <dylanliu2002@gmail.com>
```

If it is not exact: **DO NOT PUSH** and **DO NOT DELIVER**.

## 4. Task / Branch / Worktree Model

One Task = One Branch = One Worktree. Branches are task-owned, not permanently owned by an Agent or role. Name every new branch `codex/NN-short-task-name` and
use one matching card in `tasks/`. Do not change, rebase, merge, push, or
force-push another task's branch. Do not move or delete a registered worktree
outside Git worktree commands.

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

## 7. File Ownership

The task card's file allowlist is the exclusive edit boundary. An Agent may edit
only its own task card, its allowed task output, and its task-owned worklog when
the card explicitly permits it. Never alter another task card, report, or
worklog history. Append-only worklogs never have their existing entries edited.

AUDIT cards normally allow exactly one report under `docs/audits/`. Existing
reports are evidence, not permission to overwrite another task's output.

## 8. Shared Files

Specialists may not directly change these shared surfaces:

```text
AGENTS.md
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
unless an ORCHESTRATOR explicitly grants ownership in the task card.

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
all validation results, state the exact base/rebase commit, add a permitted
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
