# Task 22 — Technical Gates and SEO Correctness Bundle

Status: COMPLETE

## Includes

Backlog tasks 24, 27, and 28.

## Goal

Remove known structured-data asset defects, stop production builds from ignoring
TypeScript errors, and add a lightweight regression gate using existing tooling.

## Allowed files

- `next.config.ts`
- `package.json`
- `src/proxy.ts`
- `src/lib/seo.tsx`
- `src/app/(site)/answers/[slug]/page.tsx`
- `tests/seo-route-parity.mjs`
- `tests/first-wave-correctness.mjs`
- `scripts/prepare-standalone.mjs`

## Forbidden

- Locale indexing policy, sitemap policy, route architecture, canonical-host
  behavior, redirects, dependencies, lockfiles, content claims.

## Acceptance criteria

- Production build no longer ignores TypeScript errors.
- Existing proxy locale guard compiles under the enforced type gate.
- An explicit typecheck script exists and passes.
- Article schema references an existing social asset.
- English answer metadata uses the shared metadata contract without changing the
  unresolved D1 locale-indexing policy.
- A dependency-free test catches missing social assets, mismatched known routes,
  and reintroduction of `ignoreBuildErrors`.
- A dependency-free first-wave test guards conversion, navigation, modal, and
  contrast contracts introduced by this batch.
- Lint, typecheck, regression test, and production build pass.
- Standalone packaging works on Windows and the existing Unix deployment flow.

## Model

Sol high for high-risk diagnosis and review; Agent 0 integrates shared files.
