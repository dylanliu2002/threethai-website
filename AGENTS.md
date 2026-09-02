# Three Thai Website Agent Rules

These rules apply to every Codex agent, worktree, and task in this repository.

## 1. Read before acting

Before any work:

1. Read this file completely.
2. Read the assigned task card completely.
3. Inspect the current branch and working tree.
4. Stay inside the task card's file allowlist.
5. Record shared-file needs as coordination items instead of editing them.

## 2. Git commit identity — hard requirement

Every commit must use exactly:

- `user.name`: `dylanliu2002`
- `user.email`: `dylanliu2002@gmail.com`

Before the first commit in every worktree or session, configure and verify the
repository-local identity. Before delivery, verify the latest commit author is:

`dylanliu2002 <dylanliu2002@gmail.com>`

If the identity does not match exactly, do not push or deliver the branch.

## 3. Branch and worktree isolation

- Start implementation work from the latest `main`.
- Use one branch and one worktree per implementation task.
- Branch names use `codex/NN-short-task-name`.
- Never commit directly to `main`.
- Never merge, push, rebase, or rewrite another agent's branch.
- Audit tasks 10–15 are read-only and do not create branches or commits.

## 4. File ownership

Every implementation task card must define a non-overlapping file allowlist.
Editing outside that allowlist is prohibited.

Only the orchestrator may edit these shared files unless a task card explicitly
delegates one of them after all overlapping work is paused:

- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `bun.lock`
- `next.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/content/company.ts`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/lib/inquiry.ts`
- `middleware.ts`
- `prisma/schema.prisma`
- `prisma/schema.postgres.prisma`
- `.env*`

If a shared file is needed, add a coordination item to the task report with the
exact requested change and why it is required.

## 5. Task lifecycle

1. Confirm goal, dependencies, allowed files, forbidden files, and acceptance criteria.
2. Audit before implementation when the task changes product direction.
3. Keep changes narrowly scoped and preserve the established architecture.
4. Run the task card's required checks.
5. Rebase on the current integration base before handoff when instructed by the orchestrator.
6. Report changed files, checks, risks, coordination items, and commit hash.

## 6. Quality and safety

- Preserve English and localized routes unless the task explicitly scopes language changes.
- Do not invent product, certification, factory, customer, or performance claims.
- Treat schema, canonical, hreflang, redirects, forms, and analytics as high-risk surfaces.
- Never expose credentials or copy secrets into reports, logs, or commits.
- Do not add dependencies without orchestrator approval.
- Do not deploy or publish unless the user explicitly authorizes that phase.

## 7. Agent roles

- Agent 0: Orchestrator and integration reviewer.
- Agent 1: Technical SEO.
- Agent 2: SEO content and keyword architecture.
- Agent 3: GEO and AI-search visibility.
- Agent 4: Conversion and lead generation.
- Agent 5: Brand, UX, and information architecture.
- Agent 6: QA, accessibility, regression, and performance.

Role ownership does not override task-card file ownership.
