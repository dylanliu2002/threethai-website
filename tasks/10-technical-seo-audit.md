# Task 10 — Technical SEO Audit

## Goal

Determine whether search engines can crawl, index, understand, and present every
important English and localized route correctly.

## Mode

Read-only audit. Do not edit files, install packages, start a browser, or commit.

## Inspect

- App Router layouts, pages, metadata, route generation, and not-found behavior.
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/seo.tsx`.
- Canonical, hreflang, Open Graph, X metadata, structured data, headings, alt text.
- Redirect and duplicate-route risks across `(site)`, `zh`, and `[lang]` trees.

## Deliverable

Return an evidence-backed report with:

1. Executive summary.
2. P0–P3 findings with exact file/route evidence.
3. Coverage matrix for metadata, canonical, hreflang, schema, robots, and sitemap.
4. Recommended implementation tasks and dependencies.
5. Shared-file coordination items.

## Acceptance criteria

- Separate confirmed defects from hypotheses.
- Flag unsupported or risky structured-data claims.
- Do not rewrite marketing content or redesign UI.
