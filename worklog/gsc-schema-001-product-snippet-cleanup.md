---
Task Key: GSC-SCHEMA-001
Role: TECHNICAL_SEO
Task: Fix Invalid Google Product Snippet Markup — evidence audit and CASE A/B decision
Branch: qwen/gsc-schema-001-product-snippet-cleanup
Commit: pending
Date: 2026-09-07

Work Log:
- Read the workspace `AGENTS.md`, the repository `AGENTS.md`, the GSC-SCHEMA-001
  assignment and the GSC-INDEX-002 card/worklog it stacks on. Implementation-only
  role: no merge, deploy, DNS, Search Console or automation authority claimed.
- Fetched origin. Created this task's branch and an isolated worktree at
  `worktrees/qwen-gsc-schema-001-product-snippet-cleanup` from
  `b3bcefd9b86cc3d5614d0cceaa94bb2dc2cfbe52` — the head of
  `qwen/gsc-index-002-fallback-indexation` (PR #19), as the card requires. Not
  started from `main`, and no other branch, worktree or dirty legacy tree was
  touched. `backlink-agent-worktree/` and all `SYS-AUTO-*` worktrees are
  untouched.
- Set and verified Git identity `dylanliu2002 <dylanliu2002@gmail.com>` in this
  worktree before any edit.
- Branch naming deviates from `codex/NN-short-task-name` because the assignment
  specifies `qwen/gsc-schema-001-product-snippet-cleanup`. Per `AGENTS.md` the
  prefix is a repository namespace, not an executor binding; recorded rather
  than silently ignored. Same treatment as the stacked PR #19 branch.
- Reproduced the defect from shipped source instead of trusting the report:
  `productSchema()` in `src/lib/seo.tsx` emitted
  `"@type": "Product"` with `name`, `description`, `image`, `brand`,
  `manufacturer` and `url` — and no `offers`, no `review` and no
  `aggregateRating`. That is precisely the reported GSC state.
- Scope of the shared emitter: three templates call it —
  `src/app/(site)/products/[slug]/page.tsx`,
  `src/app/zh/products/[slug]/page.tsx`,
  `src/app/[lang]/products/[slug]/page.tsx`. All four catalogue products come
  from `src/content/products.ts`, which `build()`s every record through one
  model, and `src/components/product/product-view.tsx` renders all four. The
  defect is therefore systemic, not two pages: **4 affected products**
  (`water-soluble-pva-yarn`, `water-soluble-pva-sewing-thread`,
  `pva-staple-fiber`, `pva-filament-yarn`) across every rendered locale.
  Search Console reported 2 because only those two had been processed into the
  Product-snippet bucket at report time, not because only two are malformed.
  The fix is made in the shared source, per the card, rather than by
  hard-coding the two reported slugs.

Stage Summary — evidence audit (required before any edit):
- **Truthful public fixed price: NO.** The `Product` type in
  `src/content/products.ts` has no price, price-range, offer, availability,
  review or rating field at all, and no product record carries one. A recursive
  key scan over every catalogue entry is pinned by test.
- **Truthful public Offer: NO.** No `Offer`/`AggregateOffer` appears anywhere
  in `src/`. The `/request-quote` route is an inquiry form, not a checkout;
  there is no cart, no payment path and no `Add to cart` control.
- **Truthful customer reviews: NO.** No `testimonial`, `reviewCount`,
  `ratingValue`, `starRating` or equivalent exists in `src/content`. The word
  "review" appears only as prose ("review the certificates", "third-party
  audits are welcome"), never as a customer evaluation of a product.
- **Truthful aggregate rating: NO.** See above; nothing on the site aggregates
  customer opinions.
- **No ecommerce mechanics at all.** `cart`, `checkout`, `Add to cart` and
  `Buy Now` match nothing in `src` beyond unrelated prose ("carton") and a
  recharts CSS class in `src/components/ui/chart.tsx`. There is no payment
  path to describe with an `Offer`.
- **Conversion model: inquiry.** `product-view.tsx` carries exactly five
  conversion links — `/request-quote` three times (hero, spec-aside, closing
  CTA) and `/request-sample` twice — plus the site chrome's `Contact`. Live
  confirmation below.
- Rendered production evidence, captured 2026-09-07 with curl against
  https://www.threethai.com (locale cookie `threethai_locale=en` to pin the
  English document; unprefixed requests are redirected by `src/proxy.ts` from
  the Vercel geo header, which on this network returns `/zh/…`):
  - `/products/water-soluble-pva-yarn` — JSON-LD types
    `Organization, WebSite, Product, Brand, FAQPage, BreadcrumbList`. Key counts
    inside the emitted JSON-LD: `offers` 0, `aggregateRating` 0, `review` 0,
    `price` 0, `priceCurrency` 0, `availability` 0, `ratingValue` 0,
    `reviewCount` 0, `InStock` 0, `seller` 0. Visible-text scan: `US$` 0,
    `USD` 0, `€` 0, `$` 0, `per kg` 0, `price` 0, `Price` 0, `rating` 0,
    `stars` 0, `In stock` 0; against that, `Request a Quote` 4 (three template
    links plus the site-header entry), `Request a Sample` 3, `Contact` 3.
    Canonical `https://www.threethai.com/products/water-soluble-pva-yarn`,
    `og:locale` `en_US`.
  - `/products/pva-staple-fiber` — identical result: Product node with no
    `offers`/`review`/`aggregateRating`, zero price or rating tokens in visible
    copy, quote/sample CTAs present.
  - `/products/water-soluble-pva-sewing-thread` and
    `/products/pva-filament-yarn` — same Product node, same missing properties.
    This is what proves the defect is the shared template, not the two reported
    URLs.
- Corroborating first-party statement, not an inference: the site's own buyer
  answer `/answers/40s-pva-water-soluble-yarn-price-per-kg` states "There is no
  durable public price for '40S PVA yarn' … Request a dated quotation tied to a
  complete specification." Publishing an `offers.price` would contradict the
  site's own published position.

Decision: **CASE B — no truthful public offer, review or rating exists.**
Therefore no commercial field is manufactured. The invalid representation is
removed at the shared source instead: a quote-only product route stops
declaring `@type: Product` and keeps only structured data the page can back
up. `Fake Commercial Data Added: NO`.

---
Task Key: GSC-SCHEMA-001
Role: TECHNICAL_SEO
Task: Fix Invalid Google Product Snippet Markup — implementation and validation
Branch: qwen/gsc-schema-001-product-snippet-cleanup
Commit: pending
Date: 2026-09-07

Work Log:
- Implemented CASE B in the shared source. `productSchema()` became
  `productPageSchema()` in `src/lib/seo.tsx` and now delegates to the existing
  `webPageSchema()`, so a product route declares the one thing it verifiably is
  — a canonical-aware `WebPage`. No `Product`, `Offer`, `AggregateOffer`,
  `AggregateRating` or `Review` node is emitted anywhere in `src/`. The re-entry
  condition (real visible price or authentic review → genuine `Product` node)
  is documented at the helper, and the reason the node was dropped is recorded
  there too so nobody "fixes" the GSC warning by adding a placeholder price.
- Updated the three calling templates. Argument shape was kept deliberately
  (`… slug: product.slug, locale }`) so GSC-INDEX-002's wiring assertion
  continues to pin the product routes; only the now-unused `image` argument was
  dropped, because a `WebPage` node carries none. No other file needed to change:
  `BreadcrumbList`, `FAQPage` and the layout-level `Organization`/`WebSite`
  nodes are untouched, and the product facts stay in the visible HTML.
- No invented abstraction and no conditional branch for a scenario that cannot
  happen: the content model has no offer field, so a "emit Product only if an
  offer exists" switch would have been dead code. Kept one delegating helper.
- Added `tests/gsc-schema-001-product-snippet-cleanup.mjs` (11 tests) and wired
  it into `test:seo` (script list only — no dependency or lock-file change,
  following the GSC-INDEX-002 precedent on this key). Covers all thirteen
  required regressions: the factual premise (recursive key scan over the real
  catalogue proving there is no truthful price/offer/review/rating/availability
  to publish, so none could have been added), source-level absence of Product
  and commercial keys, template wiring, canonical ownership for EN/ZH/eight
  fallbacks, and ground truth from the real production build — 40 rendered
  product pages checked individually, every JSON-LD block on the site parsed,
  schema `url` required to equal `<link rel=canonical>`, and each FAQ question
  required to appear in visible copy so schema cannot lead the content.
- Build-output tests skip when no `.next` exists and hard-fail under
  `REQUIRE_BUILD_OUTPUT=1`; the validation run used that flag so 0 tests were
  skipped. `src/lib/seo.tsx` renders JSX and cannot be imported by the plain
  Node runner, hence the source-plus-build split rather than a refactor that
  would have churned PR #19's hot file.
- Proved the tests can fail before trusting them. Control 1: re-added
  `"@type": "Product"` with `aggregateRating`/`ratingValue: "5"`/
  `reviewCount: "1"` — 2 source tests failed ("Product JSON-LD is back",
  "declares Product structured data"). Control 2: copied the pre-fix PR #19
  build output over `.next/server/app/products/water-soluble-pva-yarn.html` —
  the rendered suite failed with "still declares @type Product". Both mutations
  were reverted by hand and the build regenerated, so nothing mutated survives.
- Environment note: the `AGENTS.md` §3 `node_modules` symlink does not work for
  this stack — Turbopack aborts with "Symlink node_modules is invalid, it
  points out of the filesystem root". The junction was removed and `npm ci` was
  run in the task worktree instead, matching what the PR #19 worktree already
  has. The main checkout's `node_modules` was verified intact afterwards.
- Validation: lint PASS; typecheck PASS; build PASS (555/555 pages, run twice —
  once for the suite, once after reverting the negative-control input);
  `test:seo` PASS 34/34 with `REQUIRE_BUILD_OUTPUT=1` (23 pre-existing, 11 new,
  0 skipped); `git diff --check` clean.
- Whole-build scan: 552 prerendered HTML pages, 1049 JSON-LD blocks, 0 parse
  failures, 0 `Product` nodes, 0 commercial keys — site-wide.
- Production runtime check on `127.0.0.1:3124` (port per `AGENTS.md` §8), then
  stopped. `/products/water-soluble-pva-yarn`, `/products/pva-staple-fiber`,
  `/zh/products/water-soluble-pva-yarn`, `/es/products/water-soluble-pva-yarn`
  each emit `Organization, WebSite, WebPage, FAQPage, BreadcrumbList` and no
  Product. Canonicals: English self, Chinese self, `/es/` → the English URL;
  `og:locale` `en_US` / `zh_CN` / `en_US`. Visible copy unchanged: zero price,
  currency, rating or stock tokens; `Request a Quote` / `Request a Sample` /
  `Contact` intact.
- GSC-INDEX-002 not regressed: all 18 of its tests pass unmodified, including
  "deep-content structured data reports the canonical owner", and its test file
  was not edited. No fallback self-canonical, false fallback hreflang or false
  localized entity URL was restored.
- No merge, no deployment, no DNS, no Search Console or Vercel change. SYS-AUTO-*
  and the legacy dirty worktrees untouched.

Stage Summary:
- Invalid Product-snippet condition removed truthfully; `Fake Commercial Data
  Added: NO`. Status READY_FOR_REVIEW — the implementer has not approved.
- Expected outcome after recrawl: the two URLs leave the invalid Product-snippet
  bucket because the markup is gone. No immediate GSC update is claimed and no
  Product rich result is expected for these pages.
- Open for the reviewer: the deliberate loss of `brand`/`manufacturer`/`image`
  from product structured data (unavoidable once the `Product` node goes — no
  other node legitimately carries `brand` here); and the still-separate
  "Crawled — currently not indexed" review of `/products/water-soluble-pva-yarn`
  that GSC-INDEX-002 handed over.

---
Task Key: GSC-SCHEMA-001
Role: TECHNICAL_SEO
Task: Fix Invalid Google Product Snippet Markup — delivery handoff
Branch: qwen/gsc-schema-001-product-snippet-cleanup
Commit: e68070a99914b0da6b71d4081ae305727d0f2588
Date: 2026-09-07

Work Log:
- Committed the validated implementation as
  `e68070a99914b0da6b71d4081ae305727d0f2588` on base
  `b3bcefd9b86cc3d5614d0cceaa94bb2dc2cfbe52` — the head of PR #19, not `main`.
  6 files, +433/-22 (2 documentation files are in the following commit). Nothing
  unrelated staged.
- Verified identity before pushing: author and committer are both
  `dylanliu2002 <dylanliu2002@gmail.com>`, as `AGENTS.md` requires.
- Pushed only this task branch with an explicit refspec and `--set-upstream`.
  `main` was not written to, merged, rebased or force-pushed; PR #19's branch was
  not touched, and no other task branch was.
- Opened a STACKED pull request against `qwen/gsc-index-002-fallback-indexation`
  (not `main`, because PR #19 is still unmerged). State OPEN, not merged, not
  deployed. Once PR #19 merges, this PR's base should be retargeted to `main`;
  the branch is a direct descendant of PR #19's head, so that is a base change,
  not a rebase.
- This entry updates only this task's card and this append-only worklog. The
  delivered code is byte-identical to what was linted, typechecked, built,
  tested 34/34 and crawled on `127.0.0.1:3124`: no application file changed
  after validation, and both negative-control mutations were reverted and the
  build regenerated before the test suite was run for the record.

Stage Summary:
- GSC-SCHEMA-001 is delivered for independent TECHNICAL_SEO review as a stacked
  PR on PR #19.
- Production deployed: NO. Merged: NO. DNS, Search Console, Vercel: untouched.
  SYS-AUTO-* and legacy dirty worktrees: untouched.
- Awaiting: independent review, PR #19 merge, then base retarget; after
  deployment, a Google recrawl plus optional Search Console URL-inspection /
  revalidation request. No immediate GSC change is claimed.

---
