# Task 50 — Fix merge-resolution deployment failure

Status: REVIEW

## Goal

Repair the three files resolved with "accept both" during pull request #1 so
the repository has one coherent rule set and the production Vercel build
passes TypeScript again.

## Root cause

The buyer-answer metadata function contains both conflict branches. The shared
metadata branch returns first, while the obsolete branch remains below it and
references the removed `clampMetaDescription` import. The two documentation
files also contain both complete conflict branches and contradictory rules.

## Allowed files

- `AGENTS.md`
- `tasks/README.md`
- `tasks/50-fix-merge-deploy.md`
- `src/app/(site)/answers/[slug]/page.tsx`
- `tests/seo-route-parity.mjs`

## Acceptance criteria

- The answer page has exactly one `generateMetadata` return path after its
  not-found guard.
- Shared metadata uses the current localized answer shape (`.en`).
- The regression test rejects reintroduction of the duplicated obsolete block.
- The coordination documents no longer contain two accepted conflict branches.
- Typecheck, lint, regression tests, and the Vercel production build pass.

## Model

Sol high: production deployment failure and conflict-resolution review. The
Site-owning orchestrator performs all source edits.
