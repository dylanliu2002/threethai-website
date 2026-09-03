# Task 14 — Brand, UX, and Information Architecture Audit

- Task: 14 — Brand UX Audit
- Role: BRAND_UX
- Mode: AUDIT (no implementation)
- Branch: `codex/14-brand-ux-audit`
- Base SHA: `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`
- Date: 2026-09-03
- Supersedes: the pre-program placeholder report at this path (added in `6631ce3`).

## Methodology / Limitations

Three evidence layers were used:

1. **Source survey (SOURCE_CONFIRMED).** Full read of brand-bearing sources:
   `src/content/company.ts`, `factory.ts`, `products.ts`, `applications.ts`,
   `quality.ts`, `patents.ts`, `i18n/*` (en/zh/de/ar/index), `site-header.tsx`,
   `site-footer.tsx`, `home-hero.tsx`, `home-*.tsx`, `about-view.tsx`,
   `products/page.tsx` (en + zh), `globals.css`, `layout.tsx`, and the
   `public/images` inventory.
2. **Runtime HTML audit (RUNTIME_CONFIRMED).** HTTP fetches of the live
   production site (`https://www.threethai.com`) for `/`, `/about`,
   `/quality`, `/manufacturing`, `/request-quote`, `/request-sample`,
   `/products`, `/products/water-soluble-pva-yarn`, `/applications`,
   `/applications/towel-weaving`, `/knowledge`, `/answers`, `/zh`,
   `/zh/products/water-soluble-pva-yarn`, `/es`, `/es/product-finder`,
   `/de`, `/de/quality`. Server-rendered HTML, visible text, hrefs, image
   references and JSON-LD were parsed programmatically.
3. **Asset inspection (RUNTIME_CONFIRMED for the asset itself).** Product,
   factory, certificate, hero and logo images were downloaded from the live
   site and inspected visually (contact sheets + vision review).

**Limitations.** The Desktop View / interactive browser rendering tool failed
in this execution environment (browser-use daemon unavailable; production site
also intermittently returns 403 to plain fetches — a WAF behavior owned by
Task 10/15, not re-audited here). Therefore:

- All rendered-appearance conclusions (spacing, contrast, RTL arrow mirroring,
  hero crop, mobile layout quality, focus states, motion) are labelled
  **UNVERIFIED_RUNTIME_VISUAL** and must be confirmed in a browser QA pass.
- DOM/HTML facts (links, hrefs, visible SSR text, image srcs) are runtime
  confirmed even without rendering.
- The interactive Product Finder result state could not be exercised; only its
  SSR shell was inspected (caveat noted in BRAND14-04).

No other agent's private context was used. Legacy Task 14 placeholder content
was treated as historical hypotheses to verify, not as evidence.

## Executive diagnosis

Three Thai has a genuinely differentiated core that most Chinese textile
exporter sites do not have: an in-house, evidence-led specialist that matches
traceable water-soluble PVA materials to the buyer's actual removal process,
with real certificates (ISO 9001 `23226Q00380R101`, OEKO-TEX `SH005 149658`
with explicit scope), real factory photography, real patent numbers, and
unusually disciplined caveat language ("A temperature label is a starting
point, not a complete specification", "Figures reproduced from company records
… current values confirmed at contracting").

The brand's problem is not the absence of a story — it is **consistency of
identity signals and credibility of the visual layer**. Concretely:

1. Three naming systems (legal 山东荣沣纺织有限公司, export name Shandong
   Three Thai Textile Co., Ltd., product mark threethai™/THREETHAI) are all
   correct in the central model but surface inconsistently — including a
   **® vs ™ conflict between the logo and all site copy**, and Chinese
   characters embedded in English page titles.
2. The **hero image is AI-generated** while the site's entire trust narrative
   is "documents, not marketing copy" — a tonal contradiction a technical
   buyer can detect, especially next to the authentic factory photos used on
   Manufacturing.
3. The **product photography is decorative supplier-catalog staging**
   (rosewood furniture, leaf props, dishware) rather than industrial
   documentation; the one set of genuinely technical product photos
   (`/images/extended/*`) is orphaned — not referenced by any page.
4. Localized routes (de/es/…) present **German/Spanish chrome around fully
   English deep content** with no on-page disclosure, and the Product Finder
   SSR renders English-only step UI even under `/es`.

The clearest unifying brand idea (unchanged from the prior draft, still
supported by the sources):

> Process-matched, traceable PVA materials — not generic temperature labels.

## Recommended message hierarchy (target state)

1. **What:** PVA yarn, sewing thread, staple fiber, filament — manufactured
   in-house in Shandong since 2006.
2. **Why:** temporary production function matched to the buyer's removal
   conditions, not a catalog temperature label.
3. **Proof:** real certificates with scope, real factory photos, numbered
   patents, traceable samples, written specifications.
4. **Next step:** sample-first progression (send application + form + removal
   condition → matched sample path).
5. **Identity:** one approved taxonomy — Three Thai Textile (buyer-facing) =
   Shandong Three Thai Textile Co., Ltd. (certificate name) = 山东荣沣纺织有限
   公司 (legal), with threethai as the product mark.

## What already works (keep)

- **Design system coherence (SOURCE_CONFIRMED; rendering UNVERIFIED_RUNTIME_VISUAL).**
  Single token set (ink navy `#1a2151` + amber `#f0a437` on warm paper),
  derived from the logo palette; consistent `btn-gold/btn-primary/eyebrow/
  display-3/container-site` primitives across home sections, product and
  application templates. The site does not look like a bootstrap template.
- **Quality page discipline (RUNTIME_CONFIRMED).** Certificate images render
  with numbers, issuer, scope, validity dates; OEKO-TEX scope stays explicit
  ("100% PVA water-soluble yarn in raw white, Class I"); patents show
  sole/joint ownership per certificate with the Santai co-ownership disclosed;
  a "How to verify" section invites document checks. This is the strongest
  trust surface on the site and should be treated as canonical.
- **Manufacturing authenticity (RUNTIME_CONFIRMED + asset inspection).**
  `factory-live/*.webp` are real, visually distinct plant photographs (Savio
  autoconer with machine number "2", JWF1021 blow room, ring-spinning gallery)
  — credible industrial documentation.
- **Caveat culture in copy (SOURCE_CONFIRMED).** Dated factory stats carry a
  "reproduced from company records / confirmed at contracting" note;
  dissolution temperatures are framed as process targets; the answers index
  states "rankings and claims are verified, not repeated".
- **Legacy locale-leak findings are fixed at runtime (RUNTIME_CONFIRMED).**
  `/zh` home emits exclusively `/zh/...` product/application hrefs (zero
  English-root leaks found); `/es/product-finder` result links point to
  `/es/products`, `/es/request-quote`, `/es/request-sample`. The quote page
  links the Finder. The prior placeholder report's P1 #1 and P2 #7 are
  therefore RESOLVED — do not re-file them.

## Findings register

| ID | Sev | Category | One-line summary |
|---|---|---|---|
| BRAND14-01 | P1 | Identity | Logo shows THREETHAI® while all site copy uses threethai™ — trademark-status conflict |
| BRAND14-02 | P1 | Trust/Imagery | AI-generated hero contradicts the "documents, not marketing" brand promise |
| BRAND14-03 | P1 | Evidence integrity | Uncaveated export-market/shipments claim + honors/R&D list need owner confirmation |
| BRAND14-04 | P1 | Localization | Fallback locales render English deep content (and English-only Finder UI) under localized chrome, undisclosed |
| BRAND14-05 | P2 | Identity | Three naming systems mix inconsistently per page; Chinese characters in English `<title>`s |
| BRAND14-06 | P2 | Imagery | Product photography is decorative catalog staging, not industrial documentation; 3 of 4 forms share that style |
| BRAND14-07 | P2 | Imagery/Hierarchy | Technical extended-format photos exist on the server but are orphaned; "Additional formats" shows text chips only |
| BRAND14-08 | P2 | Hierarchy | Applications index shows slug-derived lowercase product labels ("Products : water soluble pva yarn") |
| BRAND14-09 | P2 | CRO/Brand | Sample-first story vs quote-first chrome (desktop header/hero have no sample action) |
| BRAND14-10 | P2 | Hierarchy | Long product pages have no in-page navigation; buyer-critical "Confirm before sampling" competes with FAQ |
| BRAND14-11 | P3 | Brand consistency | LC tool on external `threethailc.xyz` domain exposed in footer |
| BRAND14-12 | P3 | IA | Knowledge vs Answers vs Buyer Answers presented as parallel silos, weak "technical hub" scent |
| BRAND14-13 | P3 | Hygiene | Orphaned legacy image assets (hero-pva*, equipment*, logo.png, legacy/equipment/*) in public/ |
| BRAND14-14 | P3 | Visual QA | RTL/contrast/focus/motion/crop checks impossible headless — browser QA pass required |

### BRAND14-01 — Trademark symbol conflict between logo and site copy
- **Severity:** P1 · **Confidence:** High · **Category:** Brand identity / legal presentation
- **Affected:** header + footer on every page; every page carrying the wordmark
- **Evidence:** Downloaded live `/images/brand/threethai-logo.png` shows
  "THREETHAI®" (registered symbol) plus a duplicated lockup
  ("THREETHAI PVA YARN/THREAD/FIBER"). `company.ts` defines
  `brandMark: "threethai™"`; footer renders `THREE THAI™`; About
  positioningBody says "the threethai™ product brand"; JSON-LD alternateName
  includes `threethai™`. (SOURCE_CONFIRMED + RUNTIME_CONFIRMED asset)
- **Observation:** The site simultaneously claims ™ (unregistered) in text and
  ® (registered) in the logo, in three letter-cases (THREETHAI, Three Thai,
  threethai).
- **Brand/trust impact:** A buyer or competitor checking the register will see
  an inconsistency at the most legally sensitive point of the identity. Using
  ® without a granted registration is also a legal exposure in several markets.
- **Buyer impact:** Erodes the "documents are exact" meta-message the Quality
  page works hard to build.
- **Recommended future action:** Owner confirms actual registration status of
  the mark in target markets; one symbol + one case convention chosen; logo
  asset and `company.ts`/footer updated together by the administrator.
- **Owner decision required:** YES (OWNER_CONFIRMATION_REQUIRED — registration
  status unknown from repo evidence).
- **Suggested owner:** BRAND_UX implementation task after owner ruling; logo
  swap is a shared-file/asset change (site-header.tsx, public/images/brand).
- **Cross-functional dependency:** GEO_AI_SEARCH (JSON-LD alternateName list).
- **Risk/caveat:** None material; do not guess which symbol is correct.

### BRAND14-02 — AI-generated hero vs evidence-led positioning
- **Severity:** P1 · **Confidence:** High · **Category:** Trust / imagery
- **Affected:** Homepage hero (all locales), OG/preview imagery lineage
- **Evidence:** Hero src is `/images/generated/hero-pva-spinning.jpg`
  (home-hero.tsx:14; RUNTIME_CONFIRMED in live HTML). Visual inspection of the
  downloaded asset: dramatic dark scene with floating particle artifacts,
  composited foreground cone, machine geometry that does not resolve to a
  real ring frame — consistent with an AI render; the repo directory name
  `generated/` and sibling `hero-pva-spinning-a/-b.png` (variant renders)
  corroborate. Meanwhile the same page family sells "traceable",
  "backed by documents", and Manufacturing uses authentic plant photos.
  (RUNTIME_CONFIRMED asset + vision inspection; label: image is synthetic —
  supported by filename lineage + structural artifacts, not asserted as
  "stock".)
- **Observation:** The single most-seen visual on the site is the only image
  that is not real, inside a brand whose differentiator is real evidence.
- **Brand/trust impact:** If a textile buyer recognizes it (bokeh machinery,
  impossible bobbin geometry are recognizable to mill people), the "we show
  documents, not marketing" claim reads as another marketing layer.
- **Buyer impact:** First-impression credibility, especially for technical
  evaluators; also weakens the contrast with the genuinely strong
  factory-live photography one scroll/click away.
- **Recommended future action:** Replace hero with a real production-base
  photograph (the factory-live set already contains usable frames) or a
  genuine macro product shot; keep the dark grade if desired. If a rendered
  image is retained, source it from the actual product photography.
- **Owner decision required:** YES — photo selection needs owner access to
  factory photography rights; no new claims are needed.
- **Suggested owner:** BRAND_UX implementation task (asset change under
  public/images + home-hero.tsx = shared-file coordination).
- **Cross-functional dependency:** QA_PERFORMANCE (new asset weight), CRO
  (above-fold message), SEO_CONTENT (alt text).
- **Risk/caveat:** Rendered appearance of the replacement is
  UNVERIFIED_RUNTIME_VISUAL until browser QA.

### BRAND14-03 — Uncaveated market/coverage claims and honors list
- **Severity:** P1 · **Confidence:** Medium-High · **Category:** Evidence integrity
- **Affected:** About (all locales via i18n), home "why" section, any page
  reusing coverageBody
- **Evidence:** `en.ts` coverageBody: "experience across 15+ export markets —
  with regular shipments to India, Pakistan, Vietnam, Turkey, Bangladesh,
  Ukraine and Peru" — no date/source caveat, unlike factoryStats which carry
  "reproduced from company records … confirmed at contracting"
  (RUNTIME_CONFIRMED on live /about). Recognition list (National High-Tech
  Enterprise, 专精特新, 晨星工厂, 瞪羚, digital workshop, etc.) is sourced only
  to "official company filings; supporting certificates available on request";
  research claims include "27-person R&D team", Wuhan Textile University
  master workstation, Prof. Ma Pibo (Jiangnan University), and national
  standard drafting participation. (SOURCE_CONFIRMED)
- **Observation:** The site's own discipline standard (date/scope/caveat per
  claim) is applied to stats and certificates but not to the coverage, honors
  and partnership claims — the ones a diligence buyer will verify first.
- **Brand/trust impact:** Unsupported claims are not positive trust signals;
  if any listed market/honor is stale, the "verified, not repeated" promise on
  Answers is contradicted.
- **Buyer impact:** Buyers shortlist on export footprint and credentials;
  unverifiable specificity is worse than honest generality.
- **Recommended future action:** Owner re-confirmation pass with evidence per
  claim (customs/export records date-stamped, certificate copies for honors,
  agreement basis for university partnerships); otherwise narrow the copy
  ("shipped to buyers in South Asia, Europe and Latin America" style).
- **Owner decision required:** YES (OWNER_CONFIRMATION_REQUIRED for every
  item; factual status UNKNOWN from repo evidence).
- **Suggested owner:** ORCHESTRATOR to route owner confirmation; then
  SEO_CONTENT for rewording, BRAND_UX for placement.
- **Cross-functional dependency:** GEO_AI_SEARCH (these are the exact claims
  AI engines will cite), QA_PERFORMANCE none.
- **Risk/caveat:** Do not delete claims in this audit; flag only. Ukraine
  mention additionally carries sanctions/logistics sensitivity for some buyers
  — owner judgment.

### BRAND14-04 — Undisclosed English deep content under localized chrome
- **Severity:** P1 · **Confidence:** High · **Category:** Localization / brand consistency
- **Affected:** All eight fallback locales (es, pt, ru, ar, tr, vi, id, de) on
  every deep route; Product Finder on all locales
- **Evidence:** Live `/de/quality`: nav and breadcrumb are German ("Qualität",
  "Start / Qualität", "Angebot anfordern") while the page `<title>`, H1 body
  copy, certificate labels ("ISO 9001:2015 certificate (English)") and the
  footer entityNote are English (RUNTIME_CONFIRMED). Live `/es/product-finder`
  SSR: localized page shell but the four-step question UI renders in English
  ("Step 1 of 4 Which material form does your process need?") (RUNTIME_CONFIRMED
  SSR; interactive state not exercised — caveat). i18n architecture confirms
  this is by design: `getDictionary` deep-merges partial UI dicts over `en`
  (SOURCE_CONFIRMED).
- **Observation:** The design is honest engineering (chrome-first
  localization), but the buyer-facing experience is a half-translated site
  with no on-page disclosure ("deep content currently in English; your
  questions answered in your language via the localized form").
- **Brand/trust impact:** Reads as incomplete rather than international;
  damages perceived professionalism exactly where the site claims global
  service (10 locales).
- **Buyer impact:** A Russian or Turkish technical buyer must parse English
  certificate scope text mid-decision; Finder questions in English undercut
  the localized entry point.
- **Recommended future action:** (a) add a small localized notice on fallback
  deep pages; (b) localize Finder step strings (they are UI-chrome-level,
  already inside the partial-dict mechanism); (c) keep hreflang/canonical
  behavior as-is (TECHNICAL_SEO owns that).
- **Owner decision required:** Translation budget/priority — YES.
- **Suggested owner:** BRAND_UX (notice copy), SEO_CONTENT (Finder strings);
  implementation is shared i18n files → coordination item.
- **Cross-functional dependency:** TECHNICAL_SEO (hreflang correctness of
  English-content-under-localized-URL is theirs, not re-judged here).
- **Risk/caveat:** Finder finding is SSR-based; post-hydration UI could differ
  — verify in browser QA (UNVERIFIED_RUNTIME_VISUAL for that half).

### BRAND14-05 — Naming-system mixing and Chinese characters in English titles
- **Severity:** P2 · **Confidence:** High · **Category:** Brand identity clarity
- **Affected:** English `<title>`/meta on /about and /contact (and [lang]
  equivalents), zh product pages, JSON-LD
- **Evidence:** English about page title: "About — Three Thai Textile
  (山东荣沣纺织有限公司)"; contact title: "Contact — Three Thai Textile
  (山东荣沣纺织)" (RUNTIME_CONFIRMED). On the live EN home, visible+JSON-LD
  text contains "Three Thai" ×51, "threethai" ×49, "荣沣" ×23; on the ZH
  product page all three systems appear together (RUNTIME_CONFIRMED, counts
  include structured data — indicative, not exact visible-text counts).
  company.ts is internally consistent and even documents the taxonomy.
- **Observation:** The entity relationship is accurate but presented with
  different surface forms per context: Three Thai Textile, THREE THAI,
  THREETHAI, threethai, threethai™, Shandong Three Thai Textile Co., Ltd.,
  山东荣沣纺织有限公司, 荣沣纺织, 荣沣. English browser tabs show Chinese
  characters to overseas buyers.
- **Brand/trust impact:** Buyers form a one-sentence mental model of "who am I
  dealing with"; inconsistent surfaces force them to decode it on every page.
- **Buyer impact:** Mild confusion; also signals "translated Chinese company
  site" rather than "international brand" at the tab/bookmark level.
- **Recommended future action:** One approved taxonomy + usage rule per
  surface (buyer-facing name in titles; legal name once in footer/About/JSON-LD;
  parenthetical Chinese legal name belongs in zh pages and the entity-note,
  not English titles). Requires shared files (company.ts, page metadata).
- **Owner decision required:** YES — approve the taxonomy.
- **Suggested owner:** BRAND_UX implementation task post-approval.
- **Cross-functional dependency:** GEO_AI_SEARCH (Organization entity
  alignment), TECHNICAL_SEO (title patterns).
- **Risk/caveat:** Do not invent a relationship with Santai beyond the
  documented patent co-ownership; that disclosure is currently handled well.

### BRAND14-06 — Decorative product photography vs industrial credibility
- **Severity:** P2 · **Confidence:** High · **Category:** Product imagery
- **Affected:** /products cards, product detail hero, applications index/detail,
  About page image
- **Evidence:** Vision inspection of the four live product images
  (RUNTIME_CONFIRMED assets): yarn cones staged on rosewood Chinese furniture
  with houseplant; thread cone on dark wood with dried leaf props; staple
  fiber in a decorative leaf-shaped dish; only the filament photo is a plain
  technical shot. All four carry the THREETHAI corner logo watermark. The same
  yarn-cone-on-rosewood image serves as the About page photo
  (`about-yarn.jpg`, RUNTIME_CONFIRMED in /about HTML). Applications reuse the
  same four files mapped by form (applications.ts:35–315).
- **Observation:** Real photographs (not claimed stock), but staged as
  home-textile decor rather than production materials; the same cone image is
  doing duty for "yarn" and for the company page, so form differentiation is
  weak.
- **Brand/trust impact:** Contradicts the technical-materials positioning;
  reads like a generic Alibaba-era supplier catalog — the exact archetype the
  copy claims to transcend ("not a trading catalog").
- **Buyer impact:** Buyers specify by form/structure (count, twist, package);
  decorative staging tells them nothing and the watermarking looks
  defensive rather than confident.
- **Recommended future action:** Commission/curate a consistent technical
  series: neutral background, macro structure detail (twist, cross-section,
  tow, cut length), plus one scale reference (hand/ruler/package). Keep the
  factory-live photographic language as the style anchor.
- **Owner decision required:** YES — photo shoot access/asset rights.
- **Suggested owner:** BRAND_UX implementation task; assets are shared files.
- **Cross-functional dependency:** SEO_CONTENT (alt text), QA_PERFORMANCE
  (asset weight/AVIF).
- **Risk/caveat:** "Looks staged" is an aesthetic judgment; the factual
  findings (same image across contexts, watermark overlays, non-technical
  props) are asset-confirmed.

### BRAND14-07 — Orphaned technical product photos; extended formats are chips only
- **Severity:** P2 · **Confidence:** High · **Category:** Imagery / information hierarchy
- **Affected:** /products "Additional formats" section (en + zh)
- **Evidence:** Five real technical photos exist on the live server
  (`/images/extended/{gracell-yarn,pva-cotton,pva-top,concrete-pva-fiber,ppva-fiber}.jpg`
  — all HTTP 200, RUNTIME_CONFIRMED; vision inspection shows genuine material
  close-ups, two with threethai.com watermarks). `grep -rn "images/extended" src`
  → **zero references** (SOURCE_CONFIRMED). The extendedFormats section renders
  text chips only (products/page.tsx:122–129, RUNTIME_CONFIRMED: no extended
  images in live /products HTML).
- **Observation:** The most technical-looking product photography on the site
  is invisible to buyers, while the visible product photos are the decorative
  ones — an inverted evidence hierarchy.
- **Brand/trust impact:** Missed proof; buyers who ask "show me PVA cotton"
  find nothing.
- **Buyer impact:** Cannot evaluate the five additional forms visually; must
  email to discover what the material looks like.
- **Recommended future action:** Wire the existing five images into the
  extended-formats cards (with owner confirmation that each photo matches its
  named material), or remove the assets if they don't match.
- **Owner decision required:** YES — image-to-material mapping confirmation
  (do not assert correspondence without owner).
- **Suggested owner:** BRAND_UX implementation task (shared content files).
- **Cross-functional dependency:** none.
- **Risk/caveat:** Photo↔label correctness is UNKNOWN from repo evidence.

### BRAND14-08 — Slug-derived lowercase product labels on Applications
- **Severity:** P2 · **Confidence:** High · **Category:** Information hierarchy / polish
- **Affected:** /applications index cards (all locales)
- **Evidence:** Live /applications HTML shows card links reading
  "Products : water soluble pva yarn →", "Products : pva filament yarn"
  (RUNTIME_CONFIRMED) — raw-slug-derived, lowercase, colon-prefixed labels
  instead of the proper product names used elsewhere.
- **Observation:** The applications index — the most buyer-language part of the
  site — drops into database voice at its product hand-off points.
- **Brand/trust impact:** Cheapens the otherwise disciplined surface; visible
  template artifact = "catalog software", not "manufacturer".
- **Buyer impact:** Minor friction; inconsistent product naming when
  cross-referencing with /products.
- **Recommended future action:** Use `productBySlug(...).name` (already
  available in products.ts:248) for the labels.
- **Owner decision required:** No.
- **Suggested owner:** small implementation task (shared content/component
  files → coordination).
- **Cross-functional dependency:** none.
- **Risk/caveat:** none.

### BRAND14-09 — Sample-first story vs quote-first chrome
- **Severity:** P2 · **Confidence:** Medium · **Category:** CRO/brand consistency
- **Affected:** Desktop header, hero CTAs, product page CTA blocks
- **Evidence:** Desktop header exposes only "Request a Quote"
  (`btn-gold … md:inline-flex`, site-header.tsx; hidden below md); mobile panel
  adds "Request a Sample"; hero CTAs are Quote + Explore Products
  (home-hero.tsx). Meanwhile the brand's own risk-reduction narrative is
  sample-centric ("confirm a grade with a traceable sample" — About
  philosophyBody; "Need this grade sampled?" product CTA; RUNTIME_CONFIRMED).
- **Observation:** The persistent chrome optimizes for the wrong next step
  relative to the site's stated method (sample → validate → supply); desktop
  buyers never see a persistent sample path.
- **Brand/trust impact:** Mild — the story says "we prove before you commit",
  the navigation says "send us an RFQ".
- **Buyer impact:** Extra clicks to reach the action the content recommends.
- **Recommended future action:** Test sample-first ordering in header/hero
  (A/B); pass detailed funnel analysis to CRO (Task 13 owns funnel).
- **Owner decision required:** No (test design), but CRO owns prioritization.
- **Suggested owner:** CRO audit cross-reference.
- **Cross-functional dependency:** CRO — hand off; this audit only flags the
  brand-consistency angle.
- **Risk/caveat:** Actual click paths need rendered/browser session —
  UNVERIFIED_RUNTIME_VISUAL for prominence judgments.

### BRAND14-10 — Long product pages without in-page navigation
- **Severity:** P2 · **Confidence:** Medium · **Category:** Information hierarchy
- **Affected:** Product detail template (all 4 products, all locales)
- **Evidence:** Live product page H2 sequence: "Confirm before sampling",
  "Dissolution temperature options", "Typical applications", "From requirement
  to repeatable supply", "Manufacturing & QC evidence", "Related technical
  resources", "Product FAQ", "Need this grade sampled?" — with **zero**
  in-page anchor links in the HTML (`href="#"` search: none; RUNTIME_CONFIRMED).
- **Observation:** A spec-dense page expects a technical buyer to scroll
  linearly; the buyer-critical "Confirm before sampling" checklist sits above
  the spec table but has no jump affordance from the CTA.
- **Brand/trust impact:** Neutral-to-negative; the content is strong, the
  retrieval design undersells it.
- **Buyer impact:** Slow access to specs/FAQ on mobile especially.
- **Recommended future action:** Sticky section jump links or a compact
  contents bar on product templates.
- **Owner decision required:** No.
- **Suggested owner:** BRAND_UX implementation task (shared component).
- **Cross-functional dependency:** QA_PERFORMANCE (mobile), CRO (CTA placement).
- **Risk/caveat:** Rendered scroll length is UNVERIFIED_RUNTIME_VISUAL;
  section count and missing anchors are HTML-confirmed.

### BRAND14-11 — Off-brand external tool domain in footer
- **Severity:** P3 · **Confidence:** High · **Category:** Brand consistency
- **Evidence:** Footer links `letterOfCreditUrl` → default
  `https://lc.threethailc.xyz` (company.ts; footer render SOURCE_CONFIRMED).
- **Observation:** A `.xyz` subdomain tool linked from the global footer sits
  outside the threethai.com brand surface; it is rel="nofollow" and kept out of
  nav, which is correct hygiene, but the domain itself reads temporary.
- **Buyer impact:** Minor trust wobble at a payment-terms-sensitive touchpoint.
- **Recommended future action:** Serve the tool under a threethai.com
  subdomain (e.g. lc.threethai.com) when infrastructure allows.
- **Owner decision required:** YES (infrastructure).
- **Suggested owner:** ORCHESTRATOR/admin.
- **Cross-functional dependency:** TECHNICAL_SEO (new subdomain handling).
- **Risk/caveat:** Tool content itself was not audited here.

### BRAND14-12 — Knowledge vs Answers siloing
- **Severity:** P3 · **Confidence:** Medium · **Category:** IA / brand scent
- **Evidence:** Nav item `knowledge` is labeled "Resources" (en.ts:15/127);
  /knowledge lists 4 long-form articles, /answers lists 30 short Q&As
  (RUNTIME_CONFIRMED counts); product pages link "Related technical resources"
  into both families; home has a knowledge strip. No surface presents them as
  one technical-hub with two depths.
- **Observation:** Two parallel content silos with different names in nav vs
  URL ("Resources" vs /knowledge) dilute the "technical authority" story.
- **Buyer impact:** Buyers don't know where to browse for guidance.
- **Recommended future action:** One hub concept ("Technical resources:
  guides & buyer answers") with two lanes; naming decision shared with
  SEO_CONTENT intent map (Task 23 owns intent ownership).
- **Owner decision required:** No.
- **Suggested owner:** SEO_CONTENT + BRAND_UX joint follow-up.
- **Cross-functional dependency:** SEO_CONTENT (page-intent ownership).
- **Risk/caveat:** Do not duplicate the Task 11 content audit here.

### BRAND14-13 — Orphaned legacy image assets
- **Severity:** P3 · **Confidence:** High · **Category:** Hygiene
- **Evidence:** `public/images/{hero-pva.jpg, hero-pva-optimized.jpg,
  hero-pva-optimized.webp, equipment.jpg, equipment-optimized.jpg, logo.png,
  brand/threethai-hero.jpg, legacy/equipment/01-06.jpg}` have no references in
  `src` (grep SOURCE_CONFIRMED); several are multi-hundred-KB.
- **Observation:** Old-site assets linger; risk of stale-brand images being
  hot-linked or accidentally reused; `legacy/certificates/*` is the exception —
  two of those are intentionally live on Quality.
- **Recommended future action:** Asset inventory + prune pass (keep
  legacy/certificates in use; archive the rest) — implementation task.
- **Owner decision required:** No.
- **Suggested owner:** QA/admin chore task.
- **Cross-functional dependency:** QA_PERFORMANCE (payload if ever served).
- **Risk/caveat:** Deletion must not break next.config redirects or external
  hot-links — verify before pruning.

### BRAND14-14 — Visual QA pass outstanding (meta-finding)
- **Severity:** P3 · **Confidence:** High · **Category:** Methodology gap
- **Evidence:** Desktop View/browser rendering unavailable in this execution
  (Methodology section). RTL (ar) mirror behavior, focus rings, contrast at
  gold-on-paper, hero crop at 390/768/1440 px, and Reveal motion are all
  **UNVERIFIED_RUNTIME_VISUAL**.
- **Recommended future action:** One browser QA session at 390/768/1440 across
  en/zh/ar home + one product page; fold results into Task 15 QA or a
  dedicated visual regression task.
- **Owner decision required:** No.
- **Suggested owner:** QA_PERFORMANCE / reviewer with browser access.
- **Cross-functional dependency:** QA_PERFORMANCE.
- **Risk/caveat:** No visual defect is asserted here; only the absence of
  verification is recorded.

## Page-type summary

| Surface | Brand verdict | Main risk |
|---|---|---|
| Home | Coherent tokens, strong copy, generic category-first H1 | BRAND14-02 hero; BRAND14-09 CTA order |
| Products | Best-in-class evidence structure | BRAND14-06/07/08/10 imagery + navigation |
| Applications | Buyer-language framing works | BRAND14-08 slug labels; same reused imagery |
| Manufacturing | Strongest credibility surface (real photos + caveat note) | dated stats need periodic re-confirmation (owner) |
| Quality | Canonical trust destination; scope-disciplined | keep scope explicit wherever badges are reused |
| About | Good identity explanation | BRAND14-03 uncaveated claims; BRAND14-05 naming noise |
| Knowledge/Answers | Strong content, weak hub identity | BRAND14-12 |
| Finder/Sample/Quote | Honest qualification tool; linked correctly | BRAND14-04 English UI in localized routes |
| Header/Footer/Nav | Clean, consistent | BRAND14-01 ®/™; BRAND14-11 LC domain |
| Localized pages | Chrome-level i18n solid | BRAND14-04 undisclosed English deep content |

## Differentiation assessment

Against the generic "Chinese textile supplier" archetype (temperature labels,
trading-catalog imagery, unverifiable superlatives), Three Thai's sourcing
copy, certificate discipline, patent-ownership transparency and process
narrative are **materially differentiated at the word level**
(SOURCE_CONFIRMED) — but the **visual layer currently undercuts it**:
decorative product staging, an AI hero, watermark overlays and slug-leaked
labels are all archetype behaviors (BRAND14-02/05/06/07/08). Closing the
visual gap is the single highest-leverage brand investment; no competitor
performance data was fabricated or assumed.

## Proposed follow-up tasks (not created in this audit)

1. Owner confirmation pack: trademark status (14-01), coverage/honors/R&D
   claims (14-03), extended-photo↔material mapping (14-07), factory figures
   refresh date.
2. Brand identity implementation task: naming taxonomy rollout, logo/symbol
   fix, English-title cleanup (14-01/05) — shared files via admin.
3. Visual evidence task: hero replacement + technical product photo series +
   wire extended images (14-02/06/07).
4. Localization disclosure + Finder string localization (14-04).
5. Micro-polish task: application labels, product-page jump links, sample-first
   CTA test (14-08/09/10) — coordinate with CRO.
6. Asset prune + browser visual QA session (14-13/14) — coordinate with QA.

## Shared-file / coordination requests (for ORCHESTRATOR)

- `src/content/company.ts`, `site-header.tsx`, `site-footer.tsx`,
  `globals.css`, `public/images/**`, `src/content/i18n/**` — all implementation
  fixes above touch these; this audit changed none of them.
- `tasks/README.md` board row for Task 14 status → this agent did not edit the
  shared board; admin to sync when moving the card to REVIEW.

## Evidence label index

- SOURCE_CONFIRMED: repo files as cited inline.
- RUNTIME_CONFIRMED: live production HTML/asset fetches on 2026-09-03
  (EN/ZH/ES/DE samples; intermittent 403 WAF noted, retries succeeded).
- PUBLIC_SOURCE_CONFIRMED: not used (no third-party sources consulted).
- INFERRED: hero-synthetic judgment (filename lineage + visual artifacts);
  differentiation comparison vs archetype (qualitative, no competitor data).
- HYPOTHESIS: sample-first CTA ordering benefit (needs CRO test).
- UNKNOWN: trademark registration status; extended-photo material mapping;
  current validity of honors/export claims; rendered visual details.
- Claim support labels: factory stats = PARTIAL (caveated legacy figures);
  certificates = SUPPORTED (documents on page); export markets/honors/R&D =
  OWNER_CONFIRMATION_REQUIRED; "since 2006" = SUPPORTED (USCC/founding date in
  schema + company.ts); OEKO-TEX scope statements = SUPPORTED.
