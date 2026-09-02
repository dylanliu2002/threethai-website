# Task 10 — Technical SEO Audit

## Executive summary

No confirmed P0 crawl blocker was found. The important page templates define
metadata, detail routes validate slugs, pages expose consistent H1s, and content
images generally have appropriate alt text.

The primary risk is international SEO consistency. The application publishes
large multilingual route trees while much of the deep content remains English.
Those pages are self-canonical, receive blanket hreflang declarations, and keep
the root document language as English. Sitemap and structured-data behavior do
not consistently match the route model.

## Confirmed findings

### P1 — International indexing and language signals

1. `src/app/layout.tsx` hardcodes `<html lang="en">`. Locale layouts apply `lang`
   and `dir` to a nested container, so the document element remains English on
   Chinese, Spanish, Portuguese, Russian, Arabic, Turkish, Vietnamese,
   Indonesian, and German routes.

2. `src/lib/seo.tsx` accepts an `alternates` input but does not use it.
   `buildMetadata()` emits all ten locales plus `x-default` for every caller,
   regardless of whether equivalent translated content exists.

3. Most dynamic-locale product, application, knowledge, and answer routes use
   English body content and English metadata while declaring non-English
   self-canonicals and hreflang. This creates wrong-language and duplicate-content
   signals.

4. `src/app/sitemap.ts` creates one English `<loc>` per route cluster and uses
   alternates for some core routes. Localized deep routes are not consistently
   represented as their own entries even though the application generates and
   internally links them.

5. `next.config.ts` redirects entire legacy product-detail families to product
   listing pages. The file itself notes that exact ID-to-product mapping is still
   pending. This can discard historical detail-page relevance and may create
   soft-404 signals.

6. Product content contradicts itself about concrete PVA fiber:
   `src/content/legacy-source.ts` says it is not currently offered, while
   `src/content/products.ts` says it is manufactured. The negative statement is
   also emitted through FAQ structured data on the staple-fiber route family.

### P2 — Structured data and crawl controls

1. `articleSchema()` in `src/lib/seo.tsx` points to `/og.png`, but the repository
   contains `public/og.jpg` and no `public/og.png`.

2. Article schema URLs are built as English-root URLs. Locale-prefixed knowledge
   and answer pages can therefore have localized canonical metadata while their
   `mainEntityOfPage` points to English. `Article` also lacks `inLanguage`.

3. English buyer-answer pages construct metadata separately from the shared
   helper. They have a canonical but lack reciprocal hreflang and the fuller Open
   Graph/X fields used by localized versions.

4. `/api` returns boilerplate JSON. `robots.ts` disallows `/api/` but not the
   exact `/api` path, and separately allows named AI crawlers at `/`.

### P3 — Consistency improvements

- `WebSite` schema declares only English and Chinese despite ten UI locale trees.
- Dynamic localized homepage schema uses trailing-slash URLs while canonical
  generation uses non-trailing-slash locale roots.
- Localized 404 experiences fall back to the English global not-found page.
- About, contact, manufacturing, quality, and finder routes have uneven
  page-specific schema coverage. This is an enhancement, not an eligibility defect.

## Coverage matrix

| Route family | Metadata | Canonical | Hreflang | Page schema | Sitemap |
| --- | --- | --- | --- | --- | --- |
| English home and core indexes | Present | Present | Blanket 10-locale graph | Mixed | English `<loc>` present |
| English product details | Present | Present | Blanket graph | Product, FAQ, breadcrumb | English `<loc>` present |
| English application details | Present | Present | Blanket graph | Breadcrumb | English `<loc>` present |
| English knowledge details | Present | Present | Blanket graph | Article + breadcrumb; bad image path | English `<loc>` present |
| English answer details | Partial social fields | Present | Missing | Article, FAQ, breadcrumb, WebPage | English `<loc>` present |
| Chinese static routes | Localized | Present | Blanket graph | Mixed | No Chinese primary `<loc>` |
| Dynamic locale routes | Mostly English fallback | Self-canonical | Semantically unreliable | Locale URL mismatch on articles | Incomplete |
| `/api` | N/A | N/A | N/A | N/A | Absent; exact route crawlable |

Static heading and alt-text inspection did not find a systemic blocker.

## Recommended work

1. Decide the indexing policy for each locale and route type: fully translated
   and self-canonical, or excluded/canonicalized while the content is an English
   fallback.
2. Make `buildMetadata()` use an explicit translation-availability map and emit
   only equivalent, reciprocal alternates.
3. Rebuild sitemap output from that same availability source.
4. Correct document-level `lang` and `dir` behavior, then inspect generated HTML
   for all ten locale roots.
5. Make schema URLs locale-aware, add `inLanguage`, reuse the valid OG asset, and
   resolve the concrete-fiber contradiction before emitting product FAQ schema.
6. Build exact legacy redirect mappings from verified Search Console/Bing exports.
7. Remove or consistently protect the demo API route.

## Coordination items

- Orchestrator-owned: `src/app/layout.tsx`, `next.config.ts`,
  `src/content/company.ts`, site header/footer, environment and hosting settings.
- Assign one implementation owner to `src/lib/seo.tsx`, `src/app/sitemap.ts`, and
  `src/app/robots.ts` because the fixes are tightly coupled.
- Live canonical-host redirects remain unverified by this source-only audit.

No files were edited and no runtime or browser claims were made.
