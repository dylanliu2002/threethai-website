# Task GSC-SCHEMA-001 — Fix Invalid Google Product Snippet Markup

- **Task Key:** `GSC-SCHEMA-001`
- **Machine Contract:** None
- **Task ID:** Not assigned — `tasks/README.md` reserves the numeric namespace
  and states "There is no Task 53". This card is identified by its canonical task
  key only, pending ORCHESTRATOR board registration (same treatment as
  GSC-INDEX-002).
- **Title:** Remove the invalid Product rich-result representation from quote-only product pages
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Qwen Code
- **Priority:** `P1` (card states HIGH)
- **Status:** `READY_FOR_REVIEW`
- **Risk:** `LOW` — structured data only; no route, URL, copy or indexation change
- **Branch:** `qwen/gsc-schema-001-product-snippet-cleanup`
- **Worktree:** `worktrees/qwen-gsc-schema-001-product-snippet-cleanup`
- **Base:** `b3bcefd9b86cc3d5614d0cceaa94bb2dc2cfbe52` — head of
  `qwen/gsc-index-002-fallback-indexation` (PR #19), **not** `main`
- **PR base:** `qwen/gsc-index-002-fallback-indexation` (stacked; retarget to
  `main` after PR #19 merges)
- **Owner:** Implementation worker (Qwen Code)
- **Reviewer:** Unassigned (must be independent — TECHNICAL_SEO review required)
- **depends_on:** `GSC-INDEX-002` (PR #19) — this task edits `src/lib/seo.tsx`,
  which PR #19 also changes
- **blocks:** None

## Goal

Google Search Console reports 2 items under Product snippets with
*"Either "offers", "review", or "aggregateRating" should be specified"*:

- `/products/water-soluble-pva-yarn` — Water-Soluble PVA Yarn
- `/products/pva-staple-fiber` — PVA Staple Fiber

Root cause, reproduced from source and from shipped production HTML:
`productSchema()` in `src/lib/seo.tsx` emitted an `@type: Product` node carrying
`name`, `description`, `image`, `brand`, `manufacturer` and `url` — and none of
the three properties Google requires. Three Thai is a B2B supplier whose product
pages convert through *Request a Sample*, *Request a Quote* and *Contact*; the
content model has no price, offer, availability, review or rating field at all.

The truthful fix is to **remove the unsupported representation**, not to
manufacture the missing fields. A placeholder `price`, an `availability` of
`InStock` or a `ratingValue` of 5 would satisfy the validator while describing a
shop that does not exist, and would contradict the site's own published answer
`/answers/40s-pva-water-soluble-yarn-price-per-kg`: *"There is no durable public
price for '40S PVA yarn' … Request a dated quotation tied to a complete
specification."*

## Evidence Audit (performed before any edit)

| Question | Answer | Evidence |
| --- | --- | --- |
| Truthful public fixed price / range | **NO** | No such field exists in `Product` (`src/content/products.ts`); recursive key scan over all 4 records is pinned by test |
| Truthful public Offer | **NO** | No `Offer`/`AggregateOffer` in `src/`; no cart, checkout or payment path anywhere |
| Truthful customer review | **NO** | No `testimonial`/`reviewCount`/`ratingValue`/`starRating` in `src/content`; "review" occurs only as prose |
| Truthful aggregate rating | **NO** | Nothing on the site aggregates customer opinion |
| Conversion model | inquiry | `product-view.tsx` links `/request-quote` ×3 and `/request-sample` ×2; site chrome supplies `Contact` |

Live production capture (2026-09-07, `threethai_locale=en` cookie to pin the
English document past the geo redirect in `src/proxy.ts`): all **four**
`/products/*` URLs served a `Product` node with zero `offers`, `review`,
`aggregateRating`, `price`, `availability` or `ratingValue` keys, and zero price
or rating tokens in visible copy. The two unreported slugs behave identically —
the defect is the shared template, not two pages.

**Affected count: 4 products** (`water-soluble-pva-yarn`,
`water-soluble-pva-sewing-thread`, `pva-staple-fiber`, `pva-filament-yarn`) ×
every rendered locale = **40 product detail pages**. Search Console reported 2
because only those two had been processed into the Product-snippet bucket, not
because only two were malformed. Fixed in the shared source, per the card.

## Decision

**CASE B.** No `Product`, `Offer`, `AggregateOffer`, `AggregateRating` or
`Review` node is emitted on a quote-only product route any more. `Fake
Commercial Data Added: NO`.

`productSchema()` became `productPageSchema()`, which delegates to the existing
`webPageSchema()` and so declares the one thing the route verifiably is: a
canonical-aware `WebPage`. Everything already valid on the page is preserved —
`BreadcrumbList`, `FAQPage`, and the site-wide `Organization`/`WebSite` nodes
from the layouts. The product's facts remain in the visible HTML. No schema type
was substituted to game Search Console; `WebPage` is the honest description of
the document, and the node is built by the same helper the `/answers/*` detail
pages already use, so there is exactly one `WebPage` per page.

**Re-entry condition** (documented at the helper): if a product ever carries a
real, publicly visible price or an authentic customer review, emit a `Product`
node backed by that genuine data.

## Scope

- `src/lib/seo.tsx` — `productSchema()` → `productPageSchema()`.
- The three product detail templates that called it:
  `src/app/(site)/products/[slug]/page.tsx`,
  `src/app/zh/products/[slug]/page.tsx`,
  `src/app/[lang]/products/[slug]/page.tsx` (call shape preserved, so the
  GSC-INDEX-002 wiring assertion still pins them; `image` dropped — a `WebPage`
  node does not carry one).
- `tests/gsc-schema-001-product-snippet-cleanup.mjs` — new regression suite;
  `package.json` `test:seo` runs it. Script-list change only, no dependency
  touched, matching the GSC-INDEX-002 precedent for the same key.
- This card and `worklog/gsc-schema-001-product-snippet-cleanup.md`.

## Out of Scope

- No product claim, business fact or copy change.
- No new `Review`/`AggregateRating`/`Offer` source data — none exists.
- `BreadcrumbList` item URLs on fallback copies still use the locale path; that
  is GSC-INDEX-002's shipped behaviour and is deliberately untouched.
- `docs/audits/10-technical-seo.md` **TSEO-10-07** still describes the old
  `productSchema()` behaviour. It is a dated, `HISTORICAL` audit record and is
  not rewritten here.
- SYS-AUTO-*, workflow automation, Windows ACLs, DNS, Vercel settings, Search
  Console settings, Sogou/Baidu verification, legacy dirty worktrees.

## Preserving GSC-INDEX-002

The structured-data URL still comes from `canonicalUrlFor()` in
`src/content/availability.ts`, exactly as PR #19 left it:

- `/products/{slug}` and `/zh/products/{slug}` keep self-canonicals and report
  their own entity URL;
- `es, pt, ru, ar, tr, vi, id, de` product copies report the **English**
  canonical URL (`inLanguage` resolves to `en`, because that is the body copy);
- no fallback self-canonical, no false fallback hreflang and no false localized
  entity URL was restored.

All 18 GSC-INDEX-002 tests and the 5 pre-existing SEO-parity tests pass
unmodified — including *"deep-content structured data reports the canonical
owner"*, which pins the product templates' `locale` wiring.

## Success Criteria

- No rendered product page declares `@type: Product` (or `Offer`,
  `AggregateOffer`, `AggregateRating`, `Review`).
- No product page emits `offers`, `price`, `priceCurrency`, `availability`,
  `review`, `reviewCount`, `ratingValue` or `aggregateRating`.
- `BreadcrumbList`, `FAQPage`, `Organization`/`WebSite` and one `WebPage` remain,
  and the `WebPage` URL equals the `<link rel=canonical>`.
- FAQ schema stays backed by visible copy.
- EN / ZH / fallback canonical ownership is unchanged from PR #19.
- `tests/gsc-schema-001-product-snippet-cleanup.mjs` fails if any of the above
  regresses.

## Validation

```bash
npm run lint          # PASS
npm run typecheck     # PASS
npm run build         # PASS — 555/555 static pages
npm run test:seo      # PASS — 34 tests (11 added), 0 skipped, with
                      # REQUIRE_BUILD_OUTPUT=1 so the build-output tests really ran
git diff --check      # PASS
```

Beyond the suite:

- Whole-build scan of `.next/server/app`: **552** prerendered HTML pages,
  **1049** JSON-LD blocks, **0** parse failures, **0** `Product` nodes,
  **0** commercial-property keys — site-wide, not only the product routes.
- All 4 slugs × 10 locales (40 pages) asserted individually: no Product/Offer/
  Rating/Review node, one `WebPage` whose `url` matches the policy canonical,
  `inLanguage` matches the body copy, `BreadcrumbList` intact (3 items),
  `FAQPage` intact with every question also present in the visible text.
- Served pages from a production `next start` on `127.0.0.1:3124` (port per
  `AGENTS.md` §8; 3000/3001 avoided), then the server was stopped:
  `/products/water-soluble-pva-yarn`, `/products/pva-staple-fiber`,
  `/zh/products/water-soluble-pva-yarn`, `/es/products/water-soluble-pva-yarn`.
  Types emitted: `Organization, WebSite, WebPage, FAQPage, BreadcrumbList`.
  Canonicals: English self, Chinese self, `/es/` → the English URL, with
  `og:locale` `en_US` / `zh_CN` / `en_US` respectively. Zero price, currency,
  rating or stock tokens in visible copy; `Request a Quote`, `Request a Sample`
  and `Contact` still present.
- Negative controls, to prove the tests can fail: re-adding a `Product` node
  with `aggregateRating`/`ratingValue: "5"`/`reviewCount: "1"` made 2 source
  tests fail; copying the pre-fix PR #19 build output over one product page made
  the rendered suite fail with *"still declares @type Product"*. Both mutations
  were reverted before delivery and the build was regenerated.

## Expected Search Console outcome

After Google recrawls and reprocesses, these URLs should leave the invalid
Product-snippet bucket, because the unsupported markup they were judged on is no
longer emitted. **No claim is made that GSC updates immediately, and no
Product-snippet rich result is expected for these pages** — that eligibility was
removed deliberately. Search Console settings were not touched.

## Coordination Items

- **Board registration:** requested, not performed. Adding a row to
  `tasks/README.md` and assigning a numeric ID is an ORCHESTRATOR action on a
  shared file.
- **Stacked PR:** base is `qwen/gsc-index-002-fallback-indexation`, not `main`,
  because PR #19 is unmerged. Retarget/rebase onto `main` once PR #19 merges.
  Not merged, not deployed here.
- **`package.json`:** only the `test:seo` script list changed — no dependency,
  no lock file. Flagged because `AGENTS.md` §2.3 lists that file as shared; the
  GSC-INDEX-002 precedent on the same key is what this follows.
- **Reviewer decision:** `/products/water-soluble-pva-yarn` is also one of the
  four "Crawled — currently not indexed" URLs GSC-INDEX-002 flagged for separate
  review. This task changes neither its indexation signals nor its content, so
  that review is still open and independent.
- **If a real price ever becomes public,** the fix direction reverses: restore a
  `Product` node backed by the visible quote-grade data, per the re-entry
  condition above.

## Review Status

- Outcome: Pending — the implementer cannot approve this work.
- Required flow: `IMPLEMENT -> REVIEW -> independent reviewer -> APPROVED -> merge`.

## Completion Record

- Commit: `e68070a99914b0da6b71d4081ae305727d0f2588`
- Base: `b3bcefd9b86cc3d5614d0cceaa94bb2dc2cfbe52` (`qwen/gsc-index-002-fallback-indexation`,
  head of PR #19). Not rebased onto `main`, deliberately.
- Pull request: stacked on `qwen/gsc-index-002-fallback-indexation`. URL recorded
  in `worklog/gsc-schema-001-product-snippet-cleanup.md`.
- Changed files (implementation commit): 6 — `src/lib/seo.tsx`,
  the three product detail templates, the new test file, and the `test:seo`
  script line in `package.json`. +433 / -22.
- Validation results: lint PASS, typecheck PASS, build PASS (555/555 pages),
  `test:seo` PASS 34/34 with `REQUIRE_BUILD_OUTPUT=1` and 0 skipped,
  `git diff --check` clean; whole-build and runtime scans reported above.
- Worklog: `worklog/gsc-schema-001-product-snippet-cleanup.md`
- Remaining risks: see Coordination Items.

## Rollback

Revert the task commit. Structured data only: no route, URL, redirect, sitemap
entry or content file is added, removed or renamed, so rollback restores the
previous (invalid) `Product` node and nothing else changes.
