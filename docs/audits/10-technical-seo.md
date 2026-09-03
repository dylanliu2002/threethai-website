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
3. the audit host's default resolver produced a historical Netsun/wrong-name
   certificate anomaly on 2026-09-02 that independent review did not reproduce
   on 2026-09-03; real-user prevalence is unknown;
4. historical product/news detail URL families currently reach live,
   intent-preserving section-level fallbacks; exact historical semantic
   equivalence and material impact are unknown;
5. production simultaneously says concrete PVA fiber is manufactured and says
   it is not offered; the negative claim is also emitted in FAQ JSON-LD.

Counts in this report are audit observations, not Search Console index counts.
No Google Search Console, Bing Webmaster Tools, log-file, impression, click, or
crawl-stat data was available.

The revised finding totals are **P0: 0, P1: 3, P2: 7, P3: 3**.

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
| TSEO-10-03 | P2 | LOW | DNS / crawlability | Historical audit-host resolver anomaly; not reproduced in independent review |
| TSEO-10-04 | P2 | MEDIUM | Redirects | Historical detail URLs use intent-preserving section fallbacks; exact equivalence unknown |
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

### TSEO-10-03 — Historical audit-host resolver anomaly was not reproduced in review

- **State:** HISTORICAL OBSERVATION — observed on the audit host on 2026-09-02;
  **not independently reproduced** during review on 2026-09-03.
- **Observed scope:** only the audit host's default resolver path for
  `www.threethai.com` on 2026-09-02. No evidence establishes that a geographic
  or regional user population was affected.
- **Historical audit evidence:**
  - default `Resolve-DnsName www.threethai.com` returned the Vercel CNAME but
    an A response of `115.238.21.52`;
  - Node/SChannel connections on that path received a certificate for
    `*.y.netsun.com` / `y.netsun.com`, causing hostname validation failure;
  - Google Public DNS and Cloudflare DNS returned Vercel addresses;
  - an independent browser and requests pinned to a public Vercel address
    reached the deployed site.
- **Review evidence:** the independent reviewer did not reproduce the anomaly
  on 2026-09-03. The original observation therefore does not establish current
  authoritative-DNS state, crawler impact, or real-user prevalence.
- **How to investigate without changing DNS:**

  ```powershell
  Resolve-DnsName www.threethai.com -Type A
  Resolve-DnsName www.threethai.com -Type CNAME
  nslookup -type=A www.threethai.com 8.8.8.8
  nslookup -type=A www.threethai.com 1.1.1.1
  ```

- **Confidence:** LOW regarding current real-user prevalence; the single-host
  historical observation may reflect resolver interception, stale cache, or
  local-network behavior.
- **Impact:** UNKNOWN. A material crawlability or availability impact would
  require independent multi-region evidence that is not currently available.
- **Data requirement / next action:** retain multi-resolver, multi-region DNS
  and TLS measurement plus authoritative configuration review as an
  investigation requirement. **No immediate DNS change is recommended.**
- **Suggested owner:** QA_PERFORMANCE + ORCHESTRATOR / DNS administrator.
- **Suggested task:** **35 — Investigate the historical audit-host resolver
  anomaly**.
- **Risk:** any later DNS change would be production-critical and requires
  separate evidence, authorization, review, and rollback planning.

### TSEO-10-04 — Historical detail URLs use section-level fallback destinations

- **State:** SOURCE-CONFIRMED and RUNTIME-CONFIRMED for the current redirect
  destinations; material SEO impact remains UNKNOWN.
- **Affected scope:** `/product_detail_en/:rest*`,
  `/product_detail_zh/:rest*`, `/wap_product_detail/:rest*`,
  `/news_detail/:rest*`, and `/wap_news_detail/:rest*`.
- **Repository evidence:** `next.config.ts:38-49` routes those historical detail
  families to `/products`, `/zh/products`, or `/knowledge` while exact
  historical ID mappings remain unavailable.
- **Production evidence:**
  - `/product_detail_en/id/73.html` returned `308` to `/products`;
  - `/news_detail/id/123.html` returned `308` to `/knowledge`;
  - the sampled no-cookie path could add locale routing and end at
    `/zh/products`.
- **Assessment:** the current destinations are live, intent-preserving
  section-level fallbacks. Exact historical semantic equivalence is unknown.
  No legacy URL inventory, Search Console, server-log, or backlink evidence
  currently establishes material impact.
- **Impact:** HYPOTHESIS only. Page-specific relevance or link equity could be
  reduced where an exact successor exists, but the available evidence neither
  identifies those cases nor quantifies traffic, indexation, or backlink loss.
- **Recommended next action:** first inventory historical URLs and collect
  Search Console, Bing, log, backlink, sitemap, or archive evidence. Retain the
  current intent-preserving fallbacks unless that evidence supports a reviewed
  mapping change.
- **Suggested owner:** TECHNICAL_SEO + ORCHESTRATOR.
- **Suggested task:** **36 — Inventory and evaluate legacy detail fallbacks**.
- **Depends on:** GSC/Bing exports, server logs, backlink data, and old
  sitemap/archive evidence.
- **Risk:** MEDIUM; any redirect change remains a separately reviewed high-risk
  implementation task.

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

- historical audit-host resolver anomaly requiring more data: TSEO-10-03.
- intent-preserving legacy section fallbacks with unknown equivalence:
  TSEO-10-04.
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
| Legacy detail families | `308` | N/A | live section fallback | Intent preserved at section level; exact equivalence unknown |
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

Current legacy destinations are permanent, live, intent-preserving
section-level fallbacks. Exact historical semantic equivalence is unknown, and
no available legacy inventory, Search Console, log, or backlink evidence
establishes material impact. See TSEO-10-04.

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

The audit host's 2026-09-02 resolver anomaly was external to repository source.
It was not independently reproduced during review on 2026-09-03 and is not
established as a current production or regional condition. To isolate the
application from that historical resolver observation, the original bulk audit
and the 2026-09-03 replacement replay used the previously validated Vercel
answer `64.29.17.65`; this pinning does not establish current DNS prevalence.

## Historical Findings Revalidated

| Historical item | Current outcome |
| --- | --- |
| Root `html lang="en"` on localized pages | Still reproducible |
| Shared metadata helper ignores explicit alternates | Still reproducible |
| Fallback deep content is English but self-canonical/hreflang-localized | Still reproducible |
| Sitemap inconsistent with locale route model | Still reproducible; production now measured |
| Audit-host resolver anomaly | Historical observation from 2026-09-02; not independently reproduced on 2026-09-03; prevalence unknown |
| Legacy detail section fallbacks | Destinations reproduced; exact historical equivalence and material impact unknown |
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
- **QA_PERFORMANCE:** retain multi-region DNS/TLS investigation for the
  historical audit-host anomaly; review redirect chains and any future post-fix
  server HTML across locales.

## Data Gaps

- Google Search Console access/exports;
- Bing Webmaster Tools coverage and legacy URL exports;
- CDN/server access logs and bot user-agent logs;
- backlink list for historical detail URLs;
- authoritative DNS/registrar/CDN configuration access;
- multi-region DNS and TLS measurement for the historical audit-host anomaly;
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
| 35 — Investigate historical audit-host resolver anomaly | INVESTIGATE | QA_PERFORMANCE + ORCHESTRATOR | MEDIUM | DNS access | multi-resolver/region DNS and TLS evidence; no DNS change |
| 36 — Inventory and evaluate legacy detail fallbacks | INVESTIGATE | TECHNICAL_SEO + ORCHESTRATOR | MEDIUM | GSC/Bing/log/backlink/archive inventory | document intent/equivalence and material-impact evidence before any redirect proposal |
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

The normal commands are shown below. The 2026-09-02 audit used
`--resolve www.threethai.com:443:64.29.17.65` after public DNS validation to
isolate application responses from the historical audit-host resolver anomaly.
Independent review did not reproduce that anomaly on 2026-09-03.

```bash
curl -sS -D - -o /dev/null https://www.threethai.com/
curl -sS https://www.threethai.com/robots.txt
curl -sS https://www.threethai.com/sitemap.xml
curl -sS https://www.threethai.com/zh |
  rg -o '<html[^>]*>|<title>[^<]*</title>|<link rel="canonical"[^>]*>|<link rel="alternate"[^>]*>'
curl -sS https://www.threethai.com/es/products/water-soluble-pva-yarn
curl -sS -I https://www.threethai.com/product_detail_en/id/73.html
```

### Aggregate crawl replay procedure added after review

The exact 2026-09-02 aggregate script invocations were not stored in the Task
branch and could not be recovered. They are not reconstructed here. The
following self-contained replacement procedures were actually run and passed
on 2026-09-03 (Asia/Shanghai) with Node `v24.12.0` and curl `8.21.0`. They use
the previously validated Vercel address only to make the HTTP application
measurement independent of the historical resolver observation; they do not
test, modify, or make a claim about current DNS.

#### 55-page sitemap, metadata, schema, crawl-graph, and 142-target replay

Run this exact block in PowerShell 7 from any directory. It fetches the sitemap,
crawls each unique `<loc>`, builds a bounded graph from rendered anchor `href`
values, and checks every unique unprefixed English internal target without
following redirects.

```powershell
@'
const { execFile } = require("node:child_process");

const ORIGIN = "https://www.threethai.com";
const HOST = "www.threethai.com";
const PIN = "64.29.17.65";
const LOCALES = new Set(["zh", "es", "pt", "ru", "ar", "tr", "vi", "id", "de"]);
const markerStatus = "\n__TASK10_STATUS__:";
const markerUrl = "\n__TASK10_EFFECTIVE__:";

function request(url, follow = true, locale = "en") {
  const args = [
    "--resolve", HOST + ":443:" + PIN,
    "-sS",
    "--connect-timeout", "10",
    "--max-time", "45",
    "-H", "Cookie: threethai_locale=" + locale
  ];
  if (follow) args.push("-L", "--max-redirs", "5");
  args.push("-w", markerStatus + "%{http_code}" + markerUrl + "%{url_effective}", url);
  return new Promise((resolve, reject) => {
    execFile("curl.exe", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(url + ": " + (stderr || error.message)));
      const statusAt = stdout.lastIndexOf(markerStatus);
      const urlAt = stdout.lastIndexOf(markerUrl);
      if (statusAt < 0 || urlAt < statusAt) return reject(new Error("Missing curl markers for " + url));
      resolve({
        url,
        body: stdout.slice(0, statusAt),
        status: Number(stdout.slice(statusAt + markerStatus.length, urlAt)),
        effective: stdout.slice(urlAt + markerUrl.length).trim()
      });
    });
  });
}

async function mapLimit(items, limit, fn) {
  const output = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function tags(html, name) {
  return html.match(new RegExp("<" + name + "\\b[^>]*>", "gi")) || [];
}

function attr(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return match ? decode(match[2]) : "";
}

function oneMeta(html, name) {
  return tags(html, "meta").find((tag) => attr(tag, "name").toLowerCase() === name) || "";
}

function oneLink(html, rel) {
  return tags(html, "link").find((tag) => attr(tag, "rel").toLowerCase().split(/\s+/).includes(rel)) || "";
}

function normalize(url, keepQuery = true) {
  const parsed = new URL(url, ORIGIN);
  parsed.hash = "";
  if (!keepQuery) parsed.search = "";
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.href;
}

function internalLinks(html) {
  const found = [];
  const pattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = pattern.exec(html))) {
    try {
      const url = new URL(decode(match[2]), ORIGIN);
      if (url.origin !== ORIGIN) continue;
      found.push(normalize(url.href, true));
    } catch {}
  }
  return [...new Set(found)];
}

function isEnglishTarget(url) {
  const first = new URL(url).pathname.split("/")[1];
  return !LOCALES.has(first);
}

(async () => {
  const sitemap = await request(ORIGIN + "/sitemap.xml");
  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1].trim()));
  const urls = [...new Set(locs)].map((url) => normalize(url, false));
  const pages = await mapLimit(urls, 10, (url) => request(url, true, "en"));
  const sitemapSet = new Set(urls);
  const pageMap = new Map();
  const inbound = new Map(urls.map((url) => [url, 0]));
  const allTargets = new Set();
  const titles = new Map();
  let missingTitle = 0;
  let missingDescription = 0;
  let missingRobots = 0;
  let canonicalMismatch = 0;
  let h1Anomaly = 0;
  let invalidJsonLd = 0;

  for (const page of pages) {
    const titleMatch = page.body.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const description = attr(oneMeta(page.body, "description"), "content");
    const robots = attr(oneMeta(page.body, "robots"), "content");
    const canonical = attr(oneLink(page.body, "canonical"), "href");
    if (!title) missingTitle++;
    if (!description) missingDescription++;
    if (!robots) missingRobots++;
    if (!canonical || normalize(canonical, false) !== normalize(page.url, false)) canonicalMismatch++;
    if ((page.body.match(/<h1\b/gi) || []).length !== 1) h1Anomaly++;
    for (const match of page.body.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(match[2]); } catch { invalidJsonLd++; }
    }
    titles.set(title, (titles.get(title) || 0) + 1);
    const links = internalLinks(page.body);
    pageMap.set(normalize(page.url, false), links.map((url) => normalize(url, false)));
    for (const target of links) {
      allTargets.add(target);
      const clean = normalize(target, false);
      if (sitemapSet.has(clean)) inbound.set(clean, inbound.get(clean) + 1);
    }
  }

  const reachable = new Set([normalize(ORIGIN + "/", false)]);
  const queue = [...reachable];
  while (queue.length) {
    const current = queue.shift();
    for (const target of pageMap.get(current) || []) {
      if (sitemapSet.has(target) && !reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  const englishTargets = [...allTargets].filter(isEnglishTarget).sort();
  const targetResponses = await mapLimit(englishTargets, 10, (url) => request(url, false, "en"));
  const localeOverrideRedirects = targetResponses.filter((r) =>
    new URL(r.url).searchParams.get("_locale") === "en" && r.status >= 300 && r.status < 400);
  const otherNon200 = targetResponses.filter((r) =>
    new URL(r.url).searchParams.get("_locale") !== "en" && r.status !== 200);

  console.log(JSON.stringify({
    replacementValidatedUtc: new Date().toISOString(),
    pinnedEndpoint: PIN,
    sitemapLocs: urls.length,
    sitemapStatuses: Object.fromEntries([...new Set(pages.map((p) => p.status))].map((status) =>
      [status, pages.filter((p) => p.status === status).length])),
    missingTitle,
    missingDescription,
    missingRobots,
    canonicalMismatch,
    duplicateTitleGroups: [...titles.values()].filter((count) => count > 1).length,
    h1Anomaly,
    invalidJsonLd,
    reachableSitemapUrlsFromHome: [...sitemapSet].filter((url) => reachable.has(url)).length,
    zeroInboundSitemapUrls: [...inbound.values()].filter((count) => count === 0).length,
    uniqueEnglishInternalTargets: englishTargets.length,
    localeOverrideRedirects: localeOverrideRedirects.length,
    otherNon200EnglishTargets: otherNon200.map((r) => ({ url: r.url, status: r.status }))
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
'@ | node -
```

Corrective replay result: 55 unique sitemap `<loc>` URLs; 55 returned `200`;
zero missing title, description, or robots fields; zero canonical mismatches,
duplicate-title groups, H1 anomalies, or JSON-LD parse failures; 55 sitemap URLs
reachable from home; zero zero-inbound sitemap URLs; 142 unique English
internal targets; 55 redirecting `?_locale=en` targets; and zero other non-200
English targets.

#### 120-page locale-template matrix replay

Run this exact block in PowerShell 7. The 12 listed paths crossed with the ten
listed locale mappings are the complete 120-page sample. For each page it
checks final status, self-canonical, 11 unique alternates, the full expected
ten-locale plus `x-default` graph, and document-level `lang`.

```powershell
@'
const { execFile } = require("node:child_process");

const ORIGIN = "https://www.threethai.com";
const HOST = "www.threethai.com";
const PIN = "64.29.17.65";
const localeRows = [
  ["en", ""],
  ["zh-CN", "zh"],
  ["es", "es"],
  ["pt", "pt"],
  ["ru", "ru"],
  ["ar", "ar"],
  ["tr", "tr"],
  ["vi", "vi"],
  ["id", "id"],
  ["de", "de"],
];
const paths = [
  "/",
  "/products",
  "/products/water-soluble-pva-yarn",
  "/applications",
  "/applications/towel-weaving",
  "/knowledge",
  "/knowledge/pva-yarn-dissolution-temperature-guide",
  "/answers",
  "/answers/20c-vs-90c-pva-yarn-difference",
  "/about",
  "/quality",
  "/contact",
];
const markerStatus = "\n__TASK10_STATUS__:";
const markerUrl = "\n__TASK10_EFFECTIVE__:";

function route(prefix, path) {
  if (!prefix) return ORIGIN + path;
  return ORIGIN + "/" + prefix + (path === "/" ? "" : path);
}

function normalize(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.href;
}

function request(item) {
  const args = [
    "--resolve", HOST + ":443:" + PIN,
    "-sS", "-L", "--max-redirs", "5",
    "--connect-timeout", "10", "--max-time", "45",
    "-H", "Cookie: threethai_locale=" + (item.prefix || "en"),
    "-w", markerStatus + "%{http_code}" + markerUrl + "%{url_effective}",
    item.url,
  ];
  return new Promise((resolve, reject) => {
    execFile("curl.exe", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(item.url + ": " + (stderr || error.message)));
      const statusAt = stdout.lastIndexOf(markerStatus);
      const urlAt = stdout.lastIndexOf(markerUrl);
      if (statusAt < 0 || urlAt < statusAt) return reject(new Error("Missing curl markers for " + item.url));
      resolve({
        ...item,
        body: stdout.slice(0, statusAt),
        status: Number(stdout.slice(statusAt + markerStatus.length, urlAt)),
        effective: stdout.slice(urlAt + markerUrl.length).trim(),
      });
    });
  });
}

async function mapLimit(items, limit, fn) {
  const output = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

function decode(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function tags(html, name) {
  return html.match(new RegExp("<" + name + "\\b[^>]*>", "gi")) || [];
}

function attr(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return match ? decode(match[2]) : "";
}

function linksByHreflang(html) {
  const output = new Map();
  for (const tag of tags(html, "link")) {
    const rel = attr(tag, "rel").toLowerCase().split(/\s+/);
    const hreflang = attr(tag, "hreflang").toLowerCase();
    const href = attr(tag, "href");
    if (rel.includes("alternate") && hreflang && href) output.set(hreflang, normalize(href));
  }
  return output;
}

(async () => {
  const matrix = [];
  for (const path of paths) {
    for (const [hreflang, prefix] of localeRows) {
      matrix.push({ path, hreflang, prefix, url: route(prefix, path) });
    }
  }
  const pages = await mapLimit(matrix, 10, request);
  let status200 = 0;
  let selfCanonical = 0;
  let elevenAlternates = 0;
  let reciprocalGraphs = 0;
  let htmlLangEn = 0;
  const failures = [];

  for (const page of pages) {
    const canonicalTag = tags(page.body, "link").find((tag) =>
      attr(tag, "rel").toLowerCase().split(/\s+/).includes("canonical")) || "";
    const canonical = attr(canonicalTag, "href");
    const alternates = linksByHreflang(page.body);
    const htmlTag = tags(page.body, "html")[0] || "";
    const expected = new Map(localeRows.map(([hreflang, prefix]) =>
      [hreflang.toLowerCase(), normalize(route(prefix, page.path))]));
    expected.set("x-default", normalize(route("", page.path)));
    const graphOk = [...expected].every(([code, url]) => alternates.get(code) === url);

    if (page.status === 200) status200++;
    if (canonical && normalize(canonical) === normalize(page.url)) selfCanonical++;
    if (alternates.size === 11) elevenAlternates++;
    if (graphOk) reciprocalGraphs++;
    if (attr(htmlTag, "lang").toLowerCase() === "en") htmlLangEn++;
    if (page.status !== 200 || !canonical || normalize(canonical) !== normalize(page.url) || alternates.size !== 11 || !graphOk) {
      failures.push({ url: page.url, status: page.status, canonical, alternates: alternates.size, graphOk });
    }
  }

  console.log(JSON.stringify({
    replacementValidatedUtc: new Date().toISOString(),
    pinnedEndpoint: PIN,
    templates: paths.length,
    locales: localeRows.length,
    samples: pages.length,
    status200,
    selfCanonical,
    elevenAlternates,
    reciprocalGraphs,
    htmlLangEn,
    failures,
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
'@ | node -
```

Corrective replay result: 12 templates × 10 locales = 120 samples; 120 returned
`200`; 120 were self-canonical; 120 emitted 11 unique alternates; 120 matched
the full expected reciprocal/self-reference graph; 120 rendered
`<html lang="en">`; and the failure list was empty.

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

## Review Traceability

- **Audit-content commit:**
  `37c2c3729f2de7e6abaf2900e47abff1a297b247` — the original report-content
  commit, not the full reviewed delivery head.
- **Reviewed pre-correction head:**
  `33d08a8fda012572a022993eee1ca78fdf61fc7a` — the full Task 10 delivery
  reviewed independently on 2026-09-03.
- **Official review outcome:** `CHANGES_REQUESTED`.
- **Premature integration:** PR #6 merged the reviewed pre-correction head into
  `main` at `9ff03a94fdc0bfb39557953beb76d06c6adfca9d` before independent approval.
  That integration was not approved and is not represented as approved here.
- **Current corrective head:** the new `audit: address Task 10 review findings`
  commit created from this corrective pass; its immutable SHA is recorded in
  the corrective push/PR and delivery because a Git commit cannot contain its
  own final hash.

## Review Handoff

This corrective audit-record pass changes only the existing report and Task 10
coordination artifacts. It contains no Technical SEO implementation, DNS or
redirect change, or website-source change. The corrective PR is intended to
reconcile the audit record after the independent `CHANGES_REQUESTED` review and
is ready for independent re-review by Task 15 / QA_PERFORMANCE. It must not be
treated as approved until that re-review records `APPROVED`.
