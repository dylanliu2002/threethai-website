# Technical SEO Audit

## Executive Summary

This audit establishes the Technical SEO baseline for Three Thai from
`origin/main` commit `041dcafca0b7097cec9bfd2db68b6628f126f252` and the
production site on 2026-09-02 (Asia/Shanghai).

No P0 outage or site-wide indexation blocker was confirmed. The production
baseline is strong in several important ways:

- all 55 English `<loc>` URLs in the production sitemap returned `200`;
- those 55 pages had a title, description, `index, follow`, a self-canonical,
  one H1, and parseable JSON-LD;
- all 55 sitemap pages were reachable from the English homepage through
  rendered internal links, with no sitemap-orphan candidate in that crawl;
- 120 sampled URLs across 12 templates and all 10 locales returned `200`,
  were self-canonical, and rendered self-referential/reciprocal hreflang;
- true missing routes returned `404` and `noindex`;
- trailing-slash variants permanently redirected to the no-slash URL, while
  query variants canonicalized to the clean route;
- 21 literal source image references existed, and five important production
  image/SEO assets returned `200`.

The material risks are concentrated in international signals and migration
architecture:

1. all 120 localized template samples rendered `<html lang="en">`;
2. at least 344 Spanish, Portuguese, Russian, Arabic, Turkish, Vietnamese,
   Indonesian, and German deep-content URLs are English fallbacks while being
   indexable, self-canonical, and labelled as those languages in hreflang;
3. the audit host's default DNS path resolved `www.threethai.com` to a legacy
   Netsun endpoint with a wrong-name certificate, while public resolvers and an
   independent browser reached Vercel;
4. whole families of historical product/news detail URLs still redirect to
   section listings rather than verified equivalents;
5. production simultaneously says concrete PVA fiber is manufactured and says
   it is not offered; the negative claim is also emitted in FAQ JSON-LD.

Counts in this report are audit observations, not Search Console index counts.
No Google Search Console, Bing Webmaster Tools, log-file, impression, click, or
crawl-stat data was available.

## Audit Scope

### Included

- repository route, locale, metadata, canonical, hreflang, sitemap, robots,
  schema, redirect, heading, internal-link, image, and rendering architecture;
- production status/redirect sampling for key templates and edge cases;
- a 55-URL English sitemap crawl;
- a 10-locale by 12-template hreflang/canonical matrix (120 URLs);
- public versus local DNS resolution comparison;
- revalidation of the historical Task 10 report.

### Excluded

- implementation or changes to application behavior;
- Search Console/Bing index coverage, performance, and crawl data;
- full keyword/content strategy, GEO strategy, CRO, brand redesign, or full
  performance testing;
- claims that require company/business confirmation.

### Evidence labels

- **SOURCE-CONFIRMED** — reproduced in current `origin/main`.
- **RUNTIME-CONFIRMED** — reproduced against production.
- **HISTORICAL** — appeared in the prior report and was rechecked.
- **HYPOTHESIS** — plausible impact needing more data.
- **UNKNOWN** — not determinable from the available evidence.

## Current Baseline

| Surface | Current evidence |
| --- | --- |
| Source base | `041dcafca0b7097cec9bfd2db68b6628f126f252` |
| Production origin | `https://www.threethai.com` |
| Locales | `en`, `zh-CN`, `es`, `pt`, `ru`, `ar`, `tr`, `vi`, `id`, `de` |
| Sitemap | `200 application/xml`; 55 `<url>` / `<loc>` entries |
| Sitemap locale data | 231 alternate links on 21 core entries; 21 `x-default` entries |
| English sitemap crawl | 55/55 `200`; 0 missing metadata; 0 canonical mismatches; 0 duplicate titles |
| English headings | 55/55 pages had exactly one H1 |
| English schema syntax | 0 invalid JSON-LD blocks in 55 pages |
| English crawl graph | 55/55 sitemap routes reachable from home; 0 orphan candidates |
| Locale template matrix | 120/120 `200`; 120/120 self-canonical; 11 alternates per page |
| Document language | 120/120 samples rendered `<html lang="en">` |
| Missing-route behavior | Real `404` plus `noindex`; no canonical |
| Canonical host | HTTPS apex `308` to HTTPS `www`; HTTP `www` `308` to HTTPS `www` |
| Trailing slash | `/products/` `308` to `/products` |
| Query variant | `/products?temperature=20` `200`, canonical `/products` |
| Image sample | `/og.jpg`, square favicon, logo, PVA product and factory image all `200` |

## Findings Register

| ID | Severity | Confidence | Category | Short finding |
| --- | --- | --- | --- | --- |
| TSEO-10-01 | P1 | HIGH | International SEO | Root document language is English on every locale |
| TSEO-10-02 | P1 | HIGH | Hreflang / indexability | Eight locale trees label English fallback content as translated alternatives |
| TSEO-10-03 | P1 | MEDIUM | DNS / crawlability | One regional/default DNS path reaches a legacy wrong-certificate endpoint |
| TSEO-10-04 | P1 | MEDIUM | Redirects | Historical detail URL families collapse to section listings |
| TSEO-10-05 | P1 | HIGH | Structured data / facts | Concrete PVA product claims contradict each other in HTML and JSON-LD |
| TSEO-10-06 | P2 | HIGH | Sitemap | International sitemap coverage is incomplete and internally inconsistent |
| TSEO-10-07 | P2 | HIGH | Structured data | Localized Product/Article entity URLs point to English canonicals |
| TSEO-10-08 | P2 | HIGH | Internal linking | Every English page exposes a redirecting `?_locale=en` self-link |
| TSEO-10-09 | P2 | HIGH | Internal linking | Eight localized homepages link application cards to English URLs |
| TSEO-10-10 | P2 | MEDIUM | Locale routing | IP/cookie logic automatically redirects unprefixed URLs |
| TSEO-10-11 | P3 | HIGH | Robots / utility routes | Exact `/api` is crawlable despite the intended `/api/` disallow |
| TSEO-10-12 | P3 | HIGH | Sitemap | All sitemap `lastmod` values come from one hardcoded date |
| TSEO-10-13 | P3 | HIGH | 404 / locale UX | Localized 404s use English copy and English-root recovery links |

## P0 Findings

No confirmed P0 finding.

## P1 Findings

### TSEO-10-01 — Root document language is English on every locale

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — still reproducible.
- **Affected scope:** every non-English route; 120/120 locale-matrix samples
  rendered `<html lang="en">`.
- **Repository evidence:** `src/app/layout.tsx:56` hardcodes
  `<html lang="en">`. `src/app/[lang]/layout.tsx:20-25` and
  `src/app/zh/layout.tsx:8` put the correct language only on a descendant
  `div`.
- **Production evidence:** `/zh`, `/zh/knowledge/pva-yarn-dissolution-temperature-guide`,
  `/es/products/water-soluble-pva-yarn`, and `/ar/contact` all rendered
  `<html lang="en">`. The Spanish product had a nested `div lang="es"`.
- **How to reproduce:**

  ```bash
  curl -sS https://www.threethai.com/zh | rg -o '<html[^>]*>'
  curl -sS https://www.threethai.com/es/products/water-soluble-pva-yarn | rg -o '<html[^>]*>'
  ```

- **Impact:** crawlers, screen readers, translation systems, and text
  segmentation receive a document-level signal that conflicts with canonical,
  hreflang, visible language, and nested `lang`.
- **Recommended next action:** make the actual document element carry the
  resolved locale and Arabic direction; verify server HTML for every locale.
- **Suggested owner:** ORCHESTRATOR + TECHNICAL_SEO; BRAND_UX accessibility
  review.
- **Suggested task:** **30 — Correct document-level locale and direction
  attributes**.
- **Risk:** HIGH because root layout and global locale routing are shared
  surfaces.

### TSEO-10-02 — Eight locale trees label English fallback content as translated alternatives

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — still reproducible.
- **Affected scope:** the `es`, `pt`, `ru`, `ar`, `tr`, `vi`, `id`,
  and `de` route trees. At minimum, 4 product + 5 application + 4 knowledge +
  30 answer details = 43 English deep routes per fallback locale, or 344
  indexable localized URLs.
- **Repository evidence:**
  - `src/content/company.ts:67-69` maps every locale other than Chinese to
    English deep content;
  - dynamic product/application/knowledge/answer detail routes use that content
    locale;
  - `src/lib/seo.tsx:39-44` ignores the caller's `alternates` input and emits
    all ten locales plus `x-default`;
  - `src/lib/seo.tsx:63` makes each locale path self-canonical and indexable.
- **Production evidence:** the Spanish PVA-yarn detail page is self-canonical,
  has `hreflang="es"`, and visibly renders English product name, overview,
  specifications, and FAQ. In the 12-template matrix, eight fallback locales
  shared the English title on product, application, knowledge, answer, about,
  quality, and contact samples.
- **How to reproduce:**

  ```bash
  curl -sS https://www.threethai.com/es/products/water-soluble-pva-yarn |
    rg -o '<title>[^<]+|rel="canonical"[^>]+|hrefLang="es"[^>]+'
  ```

- **Impact:** incorrect language targeting, large groups of near-duplicate
  self-canonical URLs, inefficient crawling, and unreliable locale selection.
  Search engines may ignore hreflang or choose a different canonical.
- **Recommended next action:** first decide, per template and locale, whether
  content is genuinely localized, intentionally English-but-market-specific, or
  should not be independently indexed. Build canonical, robots, hreflang,
  sitemap, and internal-link output from the same reviewed availability policy.
- **Suggested owner:** TECHNICAL_SEO with SEO_CONTENT and GEO_AI_SEARCH.
- **Suggested task:** **31 — Define and implement fallback-locale indexation and
  hreflang policy**.
- **Risk:** HIGH; canonical/hreflang changes require independent review and
  production validation.

### TSEO-10-03 — One regional/default DNS path reaches a legacy wrong-certificate endpoint

- **State:** RUNTIME-CONFIRMED on this audit network; public-resolution impact
  is not fully measured.
- **Affected scope:** `www.threethai.com` lookups using the audit host's
  default resolver.
- **Evidence:**
  - default `Resolve-DnsName www.threethai.com` returned the Vercel CNAME but
    an A response of `115.238.21.52`;
  - Node/SChannel connections on that path received a certificate for
    `*.y.netsun.com` / `y.netsun.com`, causing hostname validation failure;
  - Google Public DNS returned the Vercel CNAME and Vercel anycast addresses;
  - Cloudflare DNS also returned Vercel addresses;
  - an independent in-app browser and web fetch reached the Vercel site;
  - requests pinned to the public Vercel address returned valid Vercel
    production responses.
- **How to reproduce:**

  ```powershell
  Resolve-DnsName www.threethai.com -Type A
  nslookup -type=A www.threethai.com 8.8.8.8
  nslookup -type=A www.threethai.com 1.1.1.1
  ```

- **Impact:** if reproducible for real users or crawlers on affected resolvers,
  the site is unreachable over valid HTTPS on that path. This can suppress
  crawling, referrals, and conversions for an entire network/region.
- **Uncertainty:** one local/default resolver path is insufficient to establish
  prevalence; this may be ISP DNS interception, a stale regional record, or
  local-network behavior rather than authoritative DNS.
- **Recommended next action:** perform multi-resolver and multi-region DNS/TLS
  monitoring, inspect authoritative DNS and any historical Netsun configuration,
  and remove stale routing only after ownership is confirmed.
- **Suggested owner:** QA_PERFORMANCE + ORCHESTRATOR / DNS administrator.
- **Suggested task:** **35 — Validate and remediate regional DNS/TLS divergence**.
- **Risk:** HIGH; DNS changes are production-critical.

### TSEO-10-04 — Historical detail URL families collapse to section listings

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — still reproducible.
- **Affected scope:** `/product_detail_en/:rest*`,
  `/product_detail_zh/:rest*`, `/wap_product_detail/:rest*`,
  `/news_detail/:rest*`, and `/wap_news_detail/:rest*`.
- **Repository evidence:** `next.config.ts:38-49` explicitly says exact
  ID-to-route mappings are pending and sends entire detail families to
  `/products`, `/zh/products`, or `/knowledge`.
- **Production evidence:**
  - `/product_detail_en/id/73.html` returned `308` to `/products`;
  - `/news_detail/id/123.html` returned `308` to `/knowledge`;
  - on the sampled no-cookie regional path, the product-detail URL needed a
    second `307` hop and ended at `/zh/products`.
- **Impact:** old detail URLs may lose page-specific relevance, backlinks, and
  canonical signals; listing destinations can be treated as soft 404s when not
  equivalent.
- **Uncertainty:** current traffic/backlink/index coverage is UNKNOWN without
  Search Console, Bing, logs, and a legacy URL inventory.
- **Recommended next action:** export known legacy URLs and map each to the
  closest verified current equivalent. Preserve a documented fallback only when
  no equivalent exists.
- **Suggested owner:** TECHNICAL_SEO + ORCHESTRATOR.
- **Suggested task:** **36 — Replace blanket legacy detail redirects with a
  verified one-to-one map**.
- **Depends on:** GSC/Bing exports, server logs, old sitemap/archive evidence.
- **Risk:** HIGH.

### TSEO-10-05 — Concrete PVA product claims contradict each other in HTML and JSON-LD

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — still reproducible.
- **Affected routes:** homepage and every localized homepage; PVA staple-fiber
  product family and its FAQ schema.
- **Repository evidence:**
  - `src/content/products.ts:255` says, “We also manufacture ... concrete PVA
    fiber”;
  - `src/content/legacy-source.ts:76` says concrete PVA fiber is not part of
    the current offering;
  - product routes emit the latter answer through `faqSchema()`.
- **Production evidence:** both statements appeared in rendered English HTML;
  the negative statement also appeared in `FAQPage` JSON-LD.
- **Impact:** contradictory entity/product facts reduce buyer and crawler trust
  and may cause inaccurate answer extraction.
- **Recommended next action:** obtain a written business-source decision, then
  align homepage copy, product content, FAQ, schema, and all locales. Do not
  choose a claim from code alone.
- **Suggested owner:** SEO_CONTENT + GEO_AI_SEARCH; company fact owner required.
- **Suggested task:** **37 — Resolve and propagate the verified concrete-PVA
  offering fact**.
- **Risk:** HIGH factual-integrity risk.

## P2 Findings

### TSEO-10-06 — International sitemap coverage is incomplete and inconsistent

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — changed but still
  reproducible.
- **Evidence:** production sitemap contains 55 `<loc>` entries, all English.
  Only 21 core entries contain locale alternates (231 links = 21 × 11).
  Localized deep knowledge/answer routes are live, self-canonical, and declare
  all languages in HTML, but have no corresponding sitemap alternates or primary
  localized `<loc>` entries.
- **Repository evidence:** `src/app/sitemap.ts:20-38` divides routes into core
  and “English-only” deep content, while the dynamic route tree actually serves
  those deep paths in nine prefixed locales.
- **Impact:** inconsistent discovery and international cluster declarations.
  The sitemap does not describe the same locale universe as rendered HTML.
- **Recommended next action:** generate sitemap entries from the same reviewed
  availability/indexation map required by TSEO-10-02. If using XML hreflang,
  list each eligible language version with reciprocal/self references.
- **Suggested owner:** TECHNICAL_SEO.
- **Suggested task:** **33 — Rebuild the multilingual sitemap from canonical
  route availability**.
- **Depends on:** Task 31.
- **Risk:** HIGH.

### TSEO-10-07 — Localized Product/Article entity URLs point to English canonicals

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — partially changed;
  the bad image path was fixed, the locale mismatch remains.
- **Repository evidence:**
  - `productSchema()` fixes `url` and `@id` to
    `/products/{slug}` (`src/lib/seo.tsx:138-153`);
  - `articleSchema()` fixes `mainEntityOfPage` to the English
    `/{section}/{slug}` and has no `inLanguage`
    (`src/lib/seo.tsx:170-181`);
  - `websiteSchema()` declares only English and Chinese despite ten route
    trees (`src/lib/seo.tsx:111-119`).
- **Production evidence:**
  - Spanish product canonical:
    `/es/products/water-soluble-pva-yarn`; Product `@id`/URL:
    `/products/water-soluble-pva-yarn`;
  - Chinese article canonical:
    `/zh/knowledge/pva-yarn-dissolution-temperature-guide`;
    `mainEntityOfPage`: the English article URL.
- **Impact:** structured data describes a different page/entity URL from the
  canonical document and omits the actual content language.
- **Recommended next action:** make schema IDs, URLs, breadcrumbs, and
  `inLanguage` follow the reviewed canonical locale policy; preserve stable
  organization identity.
- **Suggested owner:** TECHNICAL_SEO + GEO_AI_SEARCH.
- **Suggested task:** **32 — Make Product and Article schema canonical- and
  locale-aware**.
- **Depends on:** Task 31.
- **Risk:** HIGH.

### TSEO-10-08 — Every English page exposes a redirecting `?_locale=en` self-link

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED.
- **Repository evidence:** `src/components/layout/site-header.tsx:60-65`
  appends `?_locale=en` to every English language-switch URL, including the
  already-selected English option. Client click prevention does not stop
  crawlers from discovering the `href`.
- **Production evidence:** the 55-page English crawl found 142 unique internal
  targets. Exactly 55 were route-specific `?_locale=en` URLs, each returning
  `307` to the same clean route; the other checked English targets returned
  `200`.
- **Impact:** every English route publishes an unnecessary duplicate crawl path
  and a link to a redirect.
- **Recommended next action:** render the current-locale option without a
  crawlable redirect URL, and reserve the override parameter for a genuine
  language switch.
- **Suggested owner:** TECHNICAL_SEO + BRAND_UX.
- **Suggested task:** **34A — Remove crawlable current-English locale override
  links**.
- **Risk:** MEDIUM; validate cookie behavior and accessibility.

### TSEO-10-09 — Eight localized homepages link application cards to English URLs

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED.
- **Affected locales:** `es`, `pt`, `ru`, `ar`, `tr`, `vi`, `id`,
  `de`.
- **Repository evidence:** `src/components/sections/home-applications.tsx:21`
  and `:31` special-case only Chinese; every other locale receives the
  unprefixed English path instead of `localePath()`.
- **Production evidence:** Spanish homepage application-card links were
  `/applications/towel-weaving`, `/applications/embroidery-sewing`, etc.,
  rather than `/es/applications/...`.
- **Impact:** localized crawl paths lose language context and users/crawlers are
  sent into the English tree despite the advertised localized alternative.
- **Recommended next action:** use the shared locale path function and add route
  parity tests for homepage cards in every locale.
- **Suggested owner:** TECHNICAL_SEO + BRAND_UX.
- **Suggested task:** **34B — Preserve locale on homepage application links**.
- **Risk:** MEDIUM.

### TSEO-10-10 — IP/cookie logic automatically redirects unprefixed URLs

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED on the audit request path.
- **Repository evidence:** `src/proxy.ts:35-46` selects Chinese for CN/HK;
  `src/proxy.ts:77-90` redirects every unprefixed HTML route when the stored or
  inferred locale is non-English.
- **Production evidence:**
  - no-cookie `/` returned `307` to `/zh`;
  - no-cookie `/products` returned `307` to `/zh/products`;
  - a Chinese locale cookie produced the same behavior;
  - `?_locale=en` returned `307` to the clean English URL.
- **Impact:** crawler-visible responses depend on request geography/cookie,
  complicating stable canonical discovery and creating extra hops after legacy
  redirects. Explicit locale URLs remain available, which limits severity.
- **Uncertainty:** behavior varies by crawler origin and cookie support; no
  crawl logs were available.
- **Recommended next action:** review locale-adaptive behavior against crawler
  goals. Prefer stable URLs and a user-visible suggestion when automatic
  redirects are not a firm business requirement.
- **Suggested owner:** TECHNICAL_SEO + CRO + BRAND_UX.
- **Suggested task:** **31B — Review and test geo/cookie locale redirect policy**.
- **Risk:** HIGH because middleware/proxy routing is shared.

## P3 Findings

### TSEO-10-11 — Exact `/api` is crawlable despite the intended `/api/` disallow

- **State:** SOURCE-CONFIRMED, RUNTIME-CONFIRMED, HISTORICAL — still reproducible.
- **Evidence:** `src/app/robots.ts:7-13` disallows `/api/`, not exact
  `/api`. Production `/api` returned `200 application/json` with
  `{"message":"Hello, world!"}` and no `X-Robots-Tag`; `/api/` returned
  `308` to `/api`. Named AI crawler groups explicitly allow `/`.
- **Impact:** a boilerplate utility response remains an unnecessary crawl/index
  candidate. No sensitive data was observed.
- **Recommended next action:** decide whether the route is needed, then align
  exact-path robots/noindex protection or remove it through a scoped task.
- **Suggested owner:** TECHNICAL_SEO + GEO_AI_SEARCH.
- **Suggested task:** **38 — Align exact API route and crawler controls**.
- **Risk:** MEDIUM.

### TSEO-10-12 — All sitemap `lastmod` values come from one hardcoded date

- **State:** SOURCE-CONFIRMED; runtime serialization confirmed; actual
  inaccuracy is a HYPOTHESIS.
- **Evidence:** `src/app/sitemap.ts:17` sets
  `new Date("2026-09-01")` for every entry. Production had that same date on
  all 55 URLs.
- **Impact:** future deployments can leave stale or misleading modification
  signals; identical dates do not prove every page materially changed.
- **Recommended next action:** use reliable content modification data or omit
  `lastmod` when no trustworthy source exists.
- **Suggested owner:** TECHNICAL_SEO + SEO_CONTENT.
- **Suggested task:** **39 — Make sitemap lastmod evidence-based**.
- **Risk:** LOW.

### TSEO-10-13 — Localized 404s use English copy and English-root recovery links

- **State:** SOURCE-CONFIRMED, HISTORICAL — still reproducible.
- **Evidence:** `src/app/not-found.tsx:1-14` always uses the English dictionary
  and links to `/`, `/products`, and `/contact`. The sampled missing URL
  correctly returned `404` and `noindex`, so this is not a soft-404 defect.
- **Impact:** a localized crawl/user path loses locale context after a 404.
- **Recommended next action:** add locale-aware recovery behavior without
  changing the correct `404`/`noindex` response.
- **Suggested owner:** BRAND_UX + TECHNICAL_SEO.
- **Suggested task:** **40 — Localize 404 recovery while preserving true 404s**.
- **Risk:** LOW.

## Crawlability

### Confirmed healthy

- `robots.txt` and `sitemap.xml` both returned `200`.
- All 55 English sitemap routes returned `200`.
- Key locale routes in Chinese, Spanish, and Arabic returned `200`.
- Invalid paths, `/Products`, `/en`, and `/fr` returned true `404`.
- No redirect loop was found in sampled current or legacy paths.
- Every English sitemap page was reachable from the homepage in the rendered
  anchor graph.

### Confirmed risks

- DNS divergence: TSEO-10-03.
- blanket legacy detail redirects: TSEO-10-04.
- redirecting language-switcher paths: TSEO-10-08.
- wrong-locale homepage links: TSEO-10-09.
- request-dependent geo/cookie redirects: TSEO-10-10.

## Indexability

| Route class | Crawl response | Robots | Canonical | Assessment |
| --- | --- | --- | --- | --- |
| English canonical pages | `200` | `index, follow` | self | Crawlable and indexable |
| Chinese canonical pages | `200` | `index, follow` | self | Indexable; document `lang` conflict |
| Eight fallback locale trees | `200` | `index, follow` | self | Indexable, but English deep-content/language conflict |
| Query variants | `200` | `index, follow` | clean path | Crawlable and canonicalized |
| Trailing-slash variants | `308` | N/A | destination | Redirected |
| Invalid routes | `404` | `noindex` | none | Correct non-indexable response |
| Legacy detail families | `308` | N/A | listing destination | Redirected; equivalence unresolved |
| Exact `/api` | `200 JSON` | no X-Robots | none | Crawlable utility response |

No Search Console index-selection data was available. Whether search engines
currently ignore hreflang, cluster fallback pages, or select unexpected
canonicals requires Search Console/Bing validation.

## Canonicals

### Confirmed healthy

- 55/55 English sitemap pages had self-canonicals.
- 120/120 locale-matrix URLs had self-canonicals.
- canonical host is HTTPS `www`.
- `https://threethai.com/` returned `308` to
  `https://www.threethai.com/` when pinned to public Vercel DNS.
- query parameters such as `?temperature=20` were excluded from canonical.
- trailing slashes permanently redirected to the no-slash route.

### Risk

Self-canonical output is technically consistent but strategically incorrect if
the fallback locale page should not be independently indexed. Treat any change
under Task 31 as high risk.

## Hreflang / International SEO

All 120 matrix pages returned `200`, were self-canonical, and contained 11
alternate links: ten locale codes plus `x-default`. Reciprocity and
self-reference therefore exist mechanically. Semantic equivalence and document
language are the failures.

### Sample matrix

| Template | EN | ZH | ES/PT/RU/AR/TR/VI/ID/DE | Canonical / hreflang |
| --- | --- | --- | --- | --- |
| Home | English | Chinese | localized title/H1 | 10/10 self; full graph |
| Products index | English | Chinese | localized H1, English title/deep data | 10/10 self; full graph |
| Product detail | English | Chinese | English main content/title | 10/10 self; full graph |
| Applications index | English | Chinese | localized H1, English title/deep data | 10/10 self; full graph |
| Application detail | English | Chinese | English main content/title | 10/10 self; full graph |
| Knowledge index | English | Chinese H1; English title | localized chrome, English title/content for other locales | 10/10 self; full graph |
| Knowledge detail | English | Chinese | English main content/title | 10/10 self; full graph |
| Answers index | English | Chinese H1; English title | localized chrome, English title/content for other locales | 10/10 self; full graph |
| Answer detail | English | Chinese | English main content/title | 10/10 self; full graph |
| About | English | Chinese | localized H1, English title/body fallback | 10/10 self; full graph |
| Quality | English | Chinese | localized H1, largely English deep data | 10/10 self; full graph |
| Contact | English | Chinese | localized H1, English metadata/body fallback | 10/10 self; full graph |

All 120 documents nevertheless had `<html lang="en">`.

## Sitemap

- production status: `200 application/xml`;
- 33,608 bytes at audit time;
- 55 URL entries and 55 `<loc>` elements;
- all `<loc>` values use HTTPS `www`;
- all 55 `<loc>` URLs returned `200`;
- no duplicate English `<loc>` was found;
- 21 core entries contain 231 hreflang links, including 21 `x-default`;
- all 55 entries serialize `lastmod` as `2026-09-01`;
- no utility/API URL is in the sitemap.

The material gaps are recorded in TSEO-10-06 and TSEO-10-12.

## Robots

Production output:

```text
User-Agent: *
Allow: /

User-Agent: GPTBot
User-Agent: OAI-SearchBot
User-Agent: ChatGPT-User
User-Agent: Google-Extended
User-Agent: ClaudeBot
User-Agent: PerplexityBot
Allow: /

User-Agent: *
Disallow: /api/

Host: https://www.threethai.com
Sitemap: https://www.threethai.com/sitemap.xml
```

No accidental blocking of public page routes was confirmed. No recommendation
is made to block AI crawlers without a business policy. The exact `/api`
exception is TSEO-10-11.

## Metadata Architecture

### Confirmed healthy

- 55/55 English sitemap pages: non-empty title, description, canonical, robots;
- 0 duplicate titles within those 55 English URLs;
- Open Graph and Twitter fields are generated by the shared helper;
- article/product images referenced by SEO helpers exist;
- descriptions are clamped through the shared helper.

### Confirmed defects

- `buildMetadata()` documents an `alternates` input but ignores it and emits
  every locale, creating the semantic hreflang problem.
- dynamic fallback pages often reuse English title/description across eight
  distinct locale canonicals.
- the 404 inherits the default homepage title; because it is `404` +
  `noindex`, this is low impact.

Content rewriting and keyword targeting belong to SEO_CONTENT, not this audit.

## Heading Structure

All 55 English sitemap pages had exactly one H1. The sampled localized templates
also exposed one clear H1. Static inspection found normal H2/H3 section
hierarchies and one intentionally visually hidden products-section H2.

No material heading defect was confirmed in sampled scope.

## Structured Data

### Present

- Organization
- WebSite
- WebPage on homepages
- BreadcrumbList
- Product
- FAQPage
- Article

### Confirmed healthy

- 0 JSON parse failures across the 55 English sitemap pages;
- Organization uses the verified English legal name and Chinese legal identity;
- stable Organization and WebSite `@id` values are used;
- the historical missing `/og.png` reference is resolved; schemas use
  `/og.jpg`, which returned `200`;
- no fake rating/review schema was found.

### Risks

- localized entity URL mismatch: TSEO-10-07;
- factual contradiction emitted as FAQ schema: TSEO-10-05;
- WebSite `inLanguage` covers only English and Chinese while ten locale trees
  are presented.

No recommendation is made to invent Offers, ratings, reviews, certifications,
capacity, or customer data to obtain rich results.

## Redirects

### Current URL normalization

- HTTP `www` → HTTPS `www`: one `308`;
- HTTPS apex → HTTPS `www`: one `308`;
- HTTP apex → HTTPS apex → HTTPS `www`: two `308` hops;
- trailing slash → no trailing slash: one `308`.

No loop was confirmed.

### Locale routing

No-cookie/root requests on the audit path returned `307` to Chinese, and
English override query URLs returned `307` back to clean English. See
TSEO-10-08 and TSEO-10-10.

### Historical URLs

Section-level legacy redirects are permanent and reach live routes, but detail
families are not mapped to equivalent details. See TSEO-10-04.

## URL Architecture

The principal route families are stable and descriptive:

- `/products/{slug}`
- `/applications/{slug}`
- `/knowledge/{slug}`
- `/answers/{slug}`
- `/manufacturing`, `/quality`, `/about`, `/contact`
- `/product-finder`, `/request-quote`, `/request-sample`

English is unprefixed and nine other locales are prefixed. Invalid `/en`,
`/fr`, and case variant `/Products` returned `404`.

The main duplicate-intent risk is the eight self-canonical English fallback
trees, not slug ambiguity.

## Internal Linking

The rendered 55-page English crawl found:

- all 55 sitemap routes reachable from home;
- no sitemap URL with zero inbound links;
- 142 unique English internal targets;
- 55 redirecting `?_locale=en` targets;
- no other non-`200` English link target in that bounded set.

Localized home application links lose locale context (TSEO-10-09). Anchor
keyword strategy and content-cluster design are outside scope.

## Rendering

Raw Vercel responses contained server-rendered:

- title and description;
- robots and canonical;
- all hreflang alternates;
- H1 and critical body content;
- navigation links;
- JSON-LD.

An independent browser confirmed the same data and visible body content. The
Spanish product page visibly rendered an English technical overview, proving
that TSEO-10-02 is not only a source-code inference.

No systemic client-only critical SEO content defect was confirmed.

## Images

- 21 unique literal `/images/` references were found in source; none was
  missing from `public/`.
- Source components provide meaningful alt text for content images.
- One related-product thumbnail uses `alt=""` inside a link that already has
  adjacent product name/tagline text; treating it as decorative is reasonable.
- Production samples for `/og.jpg`, `/favicon-256.png`, logo, product image,
  and factory image all returned `200` with appropriate image content types.
- Next Image usage generally supplies dimensions through width/height or
  `fill` plus `sizes`.

Non-Chinese fallback locales often receive English alt text because they use
English deep content; that belongs to the broader locale policy in TSEO-10-02,
not an independent keyword-alt finding.

No material broken-image or missing-alt defect was confirmed in sampled scope.

## Status-Code Validation

| URL / class | Expected | Actual | Evidence |
| --- | --- | --- | --- |
| `/` with English cookie | 200 | 200 | Vercel-pinned GET |
| `/products` | 200 | 200 | production |
| `/products/water-soluble-pva-yarn` | 200 | 200 | production |
| `/applications/towel-weaving` | 200 | 200 | production |
| `/knowledge/pva-yarn-dissolution-temperature-guide` | 200 | 200 | production |
| `/answers/20c-vs-90c-pva-yarn-difference` | 200 | 200 | production |
| `/manufacturing`, `/quality`, `/about`, `/contact` | 200 | 200 | production |
| `/product-finder`, quote, sample | 200 | 200 | production |
| Chinese knowledge/answer samples | 200 | 200 | production |
| Spanish home/product and Arabic contact | 200 | 200 | production |
| fabricated missing URL | 404 | 404 + noindex | production |
| `/Products` | 404 | 404 | production |
| `/en`, `/fr` | 404 | 404 | production |
| `/products/` | redirect | 308 → `/products` | production |
| `/products?temperature=20` | 200/canonicalized | 200; canonical `/products` | production |
| `/api` | utility | 200 JSON | production |
| `/api/` | redirect | 308 → `/api` | production |
| `/robots.txt` | 200 | 200 text/plain | production |
| `/sitemap.xml` | 200 | 200 application/xml | production |
| legacy product detail | permanent redirect | 308 → product listing | production |
| legacy news detail | permanent redirect | 308 → knowledge listing | production |

No `5xx` was observed in the sampled URLs.

## Production vs Source Differences

Production matched current source for sampled:

- ten-locale hreflang graph;
- hardcoded root `html lang`;
- metadata/canonical output;
- robots and sitemap;
- schema URL behavior;
- concrete-PVA contradiction;
- geo/cookie redirects;
- legacy redirect destinations;
- localized homepage application links.

The DNS divergence is external to repository source and was the only material
runtime/environment difference. To avoid confusing that resolver path with the
deployed application, runtime crawl commands were pinned to the public Vercel
answer `64.29.17.65` and cross-checked with an independent browser.

## Historical Findings Revalidated

| Historical item | Current outcome |
| --- | --- |
| Root `html lang="en"` on localized pages | Still reproducible |
| Shared metadata helper ignores explicit alternates | Still reproducible |
| Fallback deep content is English but self-canonical/hreflang-localized | Still reproducible |
| Sitemap inconsistent with locale route model | Still reproducible; production now measured |
| Blanket legacy detail redirects | Still reproducible |
| Concrete PVA offering contradiction | Still reproducible in HTML and FAQ JSON-LD |
| Article schema used missing `/og.png` | Resolved; `/og.jpg` exists and returns 200 |
| Localized Article URL points to English page | Still reproducible |
| English answer metadata lacked shared social/hreflang contract | Resolved; now uses `buildMetadata()` |
| Exact `/api` crawlability | Still reproducible |
| WebSite schema only declared English/Chinese | Still reproducible |
| Localized 404 English fallback | Still reproducible |
| Live canonical-host behavior unknown | Now verified through public Vercel endpoint |

## Cross-Functional Observations

- **SEO_CONTENT:** decide which locales have substantive equivalents; resolve
  English fallback duplication; verify the concrete-PVA product fact; provide
  trustworthy content modification dates.
- **GEO_AI_SEARCH:** review schema language/entity URLs and the factual
  contradiction; clarify whether named AI crawler access is a deliberate policy.
- **CRO:** assess whether forced geo/cookie redirects help or harm international
  buyer journeys; no CTA redesign is requested here.
- **BRAND_UX:** document-level language/direction, locale-preserving cards, and
  localized 404 recovery affect accessibility and language continuity.
- **QA_PERFORMANCE:** independently validate regional DNS/TLS, redirect chains,
  and post-fix server HTML across locales.

## Data Gaps

- Google Search Console access/exports;
- Bing Webmaster Tools coverage and legacy URL exports;
- CDN/server access logs and bot user-agent logs;
- backlink list for historical detail URLs;
- authoritative DNS/registrar/CDN configuration access;
- multi-region DNS and TLS monitoring, especially mainland China;
- approved business statement for concrete PVA fiber;
- content-specific modification timestamps;
- confirmed commercial indexing goal per fallback locale.

Do not infer indexed-page counts, impressions, clicks, crawl volume, or selected
canonicals without those data.

## Recommended Follow-Up Tasks

These are proposals for the ORCHESTRATOR, not created tasks.

| Suggested task | Mode | Owner | Risk | Depends on | Validation |
| --- | --- | --- | --- | --- | --- |
| 30 — Correct document-level locale and direction attributes | IMPLEMENT | ORCHESTRATOR + TECHNICAL_SEO | HIGH | None | raw HTML `html[lang]`/dir for all locales |
| 31 — Define and implement fallback-locale indexation/hreflang policy | IMPLEMENT | TECHNICAL_SEO + SEO_CONTENT | HIGH | business locale decision | canonical/hreflang reciprocity matrix, Search Console follow-up |
| 31B — Review geo/cookie locale redirect policy | IMPLEMENT | TECHNICAL_SEO + CRO | HIGH | locale policy | bot/no-cookie/cookie/geo redirect matrix |
| 32 — Make Product and Article schema locale-aware | IMPLEMENT | TECHNICAL_SEO + GEO_AI_SEARCH | HIGH | 31 | schema IDs equal canonical; `inLanguage`; validator |
| 33 — Rebuild multilingual sitemap from canonical availability | IMPLEMENT | TECHNICAL_SEO | HIGH | 31 | every eligible URL 200/self/reciprocal; no ineligible URL |
| 34A — Remove current-English redirecting language links | IMPLEMENT | TECHNICAL_SEO + BRAND_UX | MEDIUM | None | rendered-link crawl; cookie switch test |
| 34B — Preserve locale on homepage application links | IMPLEMENT | TECHNICAL_SEO + BRAND_UX | MEDIUM | 31 | 10-locale rendered href test |
| 35 — Validate and remediate regional DNS/TLS divergence | INVESTIGATE / IMPLEMENT | QA_PERFORMANCE + ORCHESTRATOR | HIGH | DNS access | multi-resolver/region DNS and certificate checks |
| 36 — Replace blanket legacy detail redirects | IMPLEMENT | TECHNICAL_SEO | HIGH | GSC/Bing/log/archive inventory | old→new status/equivalence map, no loops/chains |
| 37 — Resolve verified concrete-PVA offering fact | IMPLEMENT | SEO_CONTENT + GEO_AI_SEARCH | HIGH factual | business approval | HTML/schema/all-locale string audit |
| 38 — Align exact API route and crawler controls | IMPLEMENT | TECHNICAL_SEO | MEDIUM | API ownership decision | `/api`, `/api/`, robots, X-Robots checks |
| 39 — Make sitemap lastmod evidence-based | IMPLEMENT | TECHNICAL_SEO + SEO_CONTENT | LOW | modification source | sample timestamps match source of truth |
| 40 — Localize 404 recovery | IMPLEMENT | BRAND_UX + TECHNICAL_SEO | LOW | locale routing decision | localized copy/links; retain 404/noindex |

## Appendix — Evidence / Commands / URLs

### Source commands

```bash
git rev-parse origin/main
rg --files src/app
rg -n "buildMetadata|canonical|alternates|html lang|inLanguage" src
rg -n "source:|destination:|permanent:" next.config.ts
rg -n "<Image|alt=" src/app src/components --glob "*.tsx"
npm run test:seo
```

### Production commands

The normal commands are shown below. On the audit host, runtime crawls used
`--resolve www.threethai.com:443:64.29.17.65` after public DNS validation to
bypass the separately reported default-resolver anomaly.

```bash
curl -sS -D - -o /dev/null https://www.threethai.com/
curl -sS https://www.threethai.com/robots.txt
curl -sS https://www.threethai.com/sitemap.xml
curl -sS https://www.threethai.com/zh |
  rg -o '<html[^>]*>|<title>[^<]*</title>|<link rel="canonical"[^>]*>|<link rel="alternate"[^>]*>'
curl -sS https://www.threethai.com/es/products/water-soluble-pva-yarn
curl -sS -I https://www.threethai.com/product_detail_en/id/73.html
```

### DNS commands

```powershell
Resolve-DnsName www.threethai.com -Type A
Resolve-DnsName www.threethai.com -Type CNAME
nslookup -type=A www.threethai.com 8.8.8.8
nslookup -type=A www.threethai.com 1.1.1.1
```

### Sampled production URLs

- `https://www.threethai.com/`
- `https://www.threethai.com/products/water-soluble-pva-yarn`
- `https://www.threethai.com/applications/towel-weaving`
- `https://www.threethai.com/knowledge/pva-yarn-dissolution-temperature-guide`
- `https://www.threethai.com/answers/20c-vs-90c-pva-yarn-difference`
- `https://www.threethai.com/zh/knowledge/pva-yarn-dissolution-temperature-guide`
- `https://www.threethai.com/es/products/water-soluble-pva-yarn`
- `https://www.threethai.com/ar/contact`
- `https://www.threethai.com/robots.txt`
- `https://www.threethai.com/sitemap.xml`

## Review Handoff

This audit changes documentation and Task-owned coordination artifacts only.
It contains no Technical SEO implementation. It is ready for independent review
by Task 15 / QA_PERFORMANCE.
