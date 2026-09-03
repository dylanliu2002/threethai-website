# Task 11 — SEO Content Audit

Mode: STRICT AUDIT (no implementation). Role: SEO_CONTENT. Profile: RESEARCH.
Platform/Provider/Model: Hermes / Alibaba Token Plan / Qwen (qwen3.8-flash).
Source baseline: `origin/main` @ `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`
(the Task 10 PR #6 merge). Production reference spot-checked 2026-09-03;
runtime/crawl coverage is owned by Task 10 and not repeated here.
Historical input: `docs/audits/11-keyword-strategy.md` (pre-rebuild legacy
report) is treated as HISTORICAL evidence only; this report supersedes it
against the current rebuilt site.

## Executive Summary

Content maturity: **MEDIUM-HIGH for architecture, MEDIUM for depth, MEDIUM-LOW
for evidence distribution.** The rebuild already solved the hardest structural
problem: the site has one clean route family per page type, an explicit
intent-ownership map (`docs/agent-team/PAGE-INTENT-OWNERSHIP.md`), a real
4-format product line, 5 application pages with genuine process structure, 4
technical articles, a 30-question Buyer Answers library, a documented-quality
evidence page (certificates, patents), and a complete sample→quote→inquiry
commercial tail. This is not a content farm and should not be expanded into one.

Largest strengths: application pages are genuinely application-specific
(problem → where PVA sits → why temporary → variables → test → product links);
the quality/manufacturing evidence story is document-backed with a
verify-yourself posture; buyer-question coverage is unusually broad
(price, MOQ, audits, documents, OEKO-TEX/ISO verification, testing method).

Largest gaps:

1. **Depth concentration (selective, not uniform)** — 29 of 30 Buyer Answers
   use the shorter shared template and only one
   (`best-pva-water-soluble-yarn-manufacturers-china`) uses the expanded model.
   Task 12's qualitative assessment: Buyer Answer extractability STRONG
   (ADEQUATE to STRONG) and STRONG format, with WEAK–MODERATE
   depth/evidence — several individual answers are adequate, while sampled
   high-stakes pages are frequently too shallow or insufficiently
   evidenced; the demonstrated weakness is on those sampled pages, not the
   template count itself. See corrected SEO11-01.
2. **Supplier-intent overlap (MEDIUM confidence)** — ~9 URLs sit in the
   manufacturer/supplier/factory/exporter validation space. The strongest
   evidenced overlap is the best/top + manufacturer-comparison pair
   (`best-…manufacturers-china` vs `top-…exporters-china-2026`); remaining
   geo/verification pages hold distinct intents (legal verification, auditing,
   certificate verification, export documentation, destination logistics,
   province-neutral evaluation) that should be differentiated, not merged.
   Intent overlap / doorway-drift / near-duplicate *risk*, not confirmed
   cluster-wide cannibalization. See corrected SEO11-02.
3. **Product-page specificity** — every product detail page renders the same
   full 6-temperature cross-product catalog; there are no product-scoped,
   versioned specification tables (counts, tolerances, packaging, QC evidence
   examples). Specs are EVIDENCE REQUIRED, not invented.
4. **Availability contradiction** — the extended-formats block (PVA cotton,
   PVA top, PPVA fiber, concrete PVA fiber, Gracell yarn) advertises
   "we also manufacture", while a legacy answer page states concrete PVA fiber
   is *not* offered. Task 10 confirmed the contradiction renders in HTML and
   FAQ JSON-LD (TSEO-10-05). Content-wise this blocks the entire extended
   product cluster until the owner resolves it.
5. **Localization content gap** — 8 of 10 locales carry translated chrome
   (home/nav/finder/forms) over English deep content by design; Task 10
   establishes at least 43 English deep-detail routes per fallback locale
   (TSEO-10-02). No content-side evidence-backed priority plan exists for
   which markets get real translation first, and localized chrome promises
   (Spanish title "Fabricante de hilo PVA…") over English bodies weaken the
   buyer-intent match.

No P0. Highest-priority future work: owner-evidence collection, the
selective Buyer-Answer deepening program, product-specific spec data.
Supplier-cluster differentiation is a P2 research-first workstream. All are
scoped in Proposed Follow-Up Tasks below. No fabricated volumes, rankings, or
metrics appear in this report.

Revision: 2026-09-03 corrective pass addressing independent review
(CHANGES_REQUESTED) — evidence-classification, SEO11-01/02/05 wording,
localization counts/priority labels, ownership and arithmetic corrections;
cross-checked against the completed Task 12 report.

## Audit Scope

### Included

- Full read of repository content: `src/content/*.ts` (products, applications,
  articles, answers, answers-zh, answer-expanded, legacy-source, catalog,
  factory, quality, patents, company) and `src/content/i18n/*` (10 dicts).
- Route/template families: `src/app/(site)/*`, `src/app/[lang]/*`,
  `src/app/zh/*`, and view components (`product-view`, `application-view`,
  `answer-article`, knowledge/answers index pages, homepage dictionary copy).
- Intent mapping, funnel coverage, topic clusters, keyword-to-page ownership,
  cannibalization, content-relationship strategy, localization *content*
  implications, claim/evidence risk, gap analysis, keep/merge/expand/retire.
- Task 10 report as merged evidence for runtime facts (fallback locale
  indexability, hreflang semantics, concrete-PVA schema contradiction,
  geo-redirect default landing).

### Excluded

- Crawl/index/canonical/hreflang/sitemap/redirect mechanics — TECHNICAL_SEO
  (Task 10 + proposed Task 31).
- Answer-extractability/entity/LLM-citation architecture — GEO_AI_SEARCH
  (Task 12, in progress downstream of this report).
- Form/CTA/funnel mechanics — CRO (Task 13). Visual brand/UX — Task 14.
  Performance/runtime — Task 15.
- Any change to `src/`, metadata, routes, links, schema, or content. Audit only.
- Search Console/Bing/keyword-tool data — none was available; no volumes,
  difficulty, CPC, traffic, or rankings are asserted anywhere below.

## Evidence and Methodology

1. Read governance first: workspace `AGENTS.md`, repository `AGENTS.md`,
   `docs/agent-team/EXECUTION-POLICY.md`, `tasks/README.md`, Task 11 card,
   `docs/agent-team/PAGE-INTENT-OWNERSHIP.md`, `docs/site-rebuild-plan.md`
   (§8 uncertainty list, §8a patent dossier, §11 brand/language directives).
2. Verified worktree/branch identity and synced the untouched Task 11 branch
   to `origin/main` (`9ff03a9`) by fast-forward rebase; no conflicts.
3. Enumerated the content inventory from source. Cross-check: sitemap English
   URL count (55, per Task 10) equals the enumerated route inventory
   (1 home + 5 products + 6 applications + 5 knowledge + 31 answers +
   7 trust/commercial/utility pages = 55: `/manufacturing`, `/quality`,
   `/about`, `/contact`, `/request-quote`, `/request-sample`,
   `/product-finder`), confirming inventory completeness.
4. Extracted Buyer Answer relationships programmatically from
   `legacy-source.ts`: 30 answers; 25 carry `relatedProduct`; 5 do not
   (`verify-chinese-pva-yarn-factory`, `iso-certified-pva-yarn-manufacturer-shandong`,
   `shandong-vs-guangdong-pva-yarn-manufacturer`,
   `documents-request-pva-yarn-supplier`,
   `factory-audit-checklist-water-soluble-yarn-mill`).
   `answer-expanded.ts` contains exactly 1 expanded answer (EN + ZH).
5. Read rendering components to judge actual page composition (e.g.
   `product-view.tsx` renders the whole shared `temperatureCatalog` and
   `articles.slice(0, 2)` as related reading on every product page).
6. Localized deep content verified at source level: `ContentLocale = "en" | "zh"`
   vs 10 UI locales; the 8 partial dicts (≈8.3–12.7 KB vs 20 KB EN base)
   translate chrome only — matching the documented §11 decision.
7. Runtime checks were limited to two probes: `https://www.threethai.com/`
   (redirects to `/zh`; matches Task 10 TSEO-10-10) and `/sitemap.xml` (200).
   All other production claims are cited to Task 10 rather than re-crawled.

Evidence labels used: **SOURCE-CONFIRMED** (current base `9ff03a9`),
**RUNTIME-CONFIRMED** (production, mostly via Task 10), **HISTORICAL**
(prior-site/dossier documents), **INFERRED**, **HYPOTHESIS**, **UNKNOWN**;
claim status labels: **VERIFIED_IN_CURRENT_EVIDENCE**, **PARTIAL**,
**CONTRADICTORY**, **UNSUPPORTED**, **OWNER_CONFIRMATION_REQUIRED** (synonym:
NEEDS_OWNER_CONFIRMATION). Corrected-pass classification rule: *presence of a
statement or document inside the repository is NOT equivalent to
independently supported business evidence.* Repository/dossier presence yields
at most SOURCE-CONFIRMED or HISTORICAL; a claim earns
VERIFIED_IN_CURRENT_EVIDENCE only when an authoritative register or current
public document supports that exact claim, at that exact scope. Strategic
recommendations that lack demand/commercial evidence are labelled
**STRATEGIC_HYPOTHESIS**.

## Limitations

- No search-performance data of any kind (Search Console, analytics, keyword
  tools). Prioritization is qualitative: buyer intent strength, commercial
  proximity, product fit, evidence readiness, existing coverage, overlap risk.
- Company facts could only be judged against the repository's own evidence
  trail (legacy site copy, certificates dossier recorded in
  `site-rebuild-plan.md` §8/§8a). Where those say "owner to reconfirm", this
  audit repeats the flag rather than resolving it.
- Public competitor research was not used for any finding: the repository's
  intent map and content set are sufficient to judge ownership, depth, and
  duplication. No external claim supports any number or recommendation below.
- The `/[lang]` dynamic locale pages were assessed at source level (they
  render `contentLocaleOf(locale)` = English deep content); Task 10 supplies
  the runtime confirmation.

## Current Content Architecture

The site is a rebuild of a legacy PVA-textile site with URL preservation.
Four content strata are visible in source, each with a stated migration rule
("migrated verbatim from legacy", "written for /zh", "composed from verified
legacy content — no new business facts"):

```text
Commercial core      /products (4 detail)  /applications (5 detail)
                       └── shared temperatureCatalog + extendedFormats
Evidence layer       /manufacturing  /quality (certs, patents)  /about
Decision support     /knowledge (4 articles)  /answers (30; 1 expanded)
                     /product-finder
Conversion tail      /request-sample  /request-quote  /contact
Locale shells        EN root (canonical content), ZH full mirror,
                     8 chrome-only fallback locales
```

The architecture is coherent and deliberate. The weaknesses below are almost
all *depth and distribution* problems, not structural ones.

## Current Route / Template Inventory

| Family | URLs (per locale) | Primary intent | Depth | Evidence quality | Notes |
| --- | --- | --- | --- | --- | --- |
| Home `/` | 1 | BRAND + COMMERCIAL | High (8 sections) | Dated figures, disclosed | Doubles as temperature-catalog entry |
| Product index `/products` | 1 | COMMERCIAL (category) | Medium | Partial | Carries extendedFormats block |
| Product detail | 4 | COMMERCIAL / TECHNICAL selection | Medium | PARTIAL — no product-scoped spec tables | Same full catalog rendered on all 4 |
| Application index | 1 | APPLICATION | Medium | Structure OK; outcome evidence partial | — |
| Application detail | 5 | APPLICATION | High, genuinely process-specific | STRUCTURE strong; EVIDENCE PARTIAL (composed from historical verified copy; no trial/case records per Task 12) | Missing application↔answer links |
| Knowledge index | 1 | INFORMATIONAL hub | Low (list) | — | CollectionPage schema present |
| Article detail | 4 | TECHNICAL / INFORMATIONAL | Medium-high (4–8 sections each) | Cautious, method-led | No article↔owning-answer links; all-4-products related block |
| Answers index | 1 | BUYER_VALIDATION hub | Low (list) | — | "30 practical answers" H1 count |
| Buyer Answer detail | 30 | BUYER_VALIDATION / mixed | **1 expanded, 29 shorter-template** | Shorter ones FAQ-shaped but generally extractable (Task 12); depth varies page-by-page | 25/30 link a product; 5 do not |
| Manufacturing | 1 | BUYER_VALIDATION (capacity/process) | Medium | Dated figures (OWNER_CONFIRMATION_REQUIRED) | Honest source note in dict |
| Quality | 1 | BUYER_VALIDATION (evidence) | High | Document-backed (HISTORICAL dossier + certificate PDFs); narrow certificate claims supported, scope limits apply | Canonical evidence owner |
| About | 1 | BRAND / BUYER_VALIDATION | High | Filings-based (HISTORICAL statements; honors list OWNER_CONFIRMATION_REQUIRED) | Export list = legacy claim |
| Contact / Quote / Sample / Finder | 4 | TRANSACTIONAL / COMMERCIAL | Medium | n/a | Application-prefill on sample links |
| **English total** | **55** | — | — | — | Matches production sitemap (Task 10) |

Locales: full EN + ZH mirrors; 8 fallback locales expose the same 55 URLs, of
which the localized surface is the homepage, chrome/nav, finder and form
shells, while at least 43 per locale are English deep-detail routes (4
products + 5 applications + 4 knowledge + 30 answers, per Task 10 TSEO-10-02;
Task 10's 120-URL matrix also found every locale page indexable).

## Buyer Journey Coverage

| Journey stage | Owner content | Coverage |
| --- | --- | --- |
| Problem/application awareness | Applications pages, home | STRONG |
| Material awareness (what water-soluble PVA is) | Product intros, articles | GOOD (no dedicated glossary; acceptable) |
| Technical understanding | 4 articles + temperature catalog | PARTIAL — dissolution well covered; storage/handling, removal endpoints, solubility-vs-biodegradability scattered or missing |
| Application suitability | 5 application pages | STRONG structurally (process-specific reasoning); PARTIAL on outcome evidence (no trials/cases — Task 12) |
| Product/specification selection | Product pages, finder, checklist article | PARTIAL — selection logic present, hard spec data absent |
| Supplier validation | 9-ish supplier answers + manufacturing + about | PARTIAL — expanded cornerstone exists; most satellites are shorter-template pages whose depth is adequate for some and underdeveloped for high-stakes ones; intent boundaries defined but not yet fully differentiated |
| Quality/evidence validation | Quality page, OEKO-TEX/ISO answers | STRONG (documents) / PARTIAL (link paths from answers to quality) |
| Sample/quote/inquiry | Sample, quote, contact, finder handoff | STRONG (structure; CRO owns mechanics) |

Informational→commercial paths exist on every template (CTA aside blocks),
so content is *not* a disconnected blog. The break is at supplier validation:
thin decision-support pages and no evidence-path links from the 5
supplier-qualification answers to `/quality` or `/manufacturing`.

## Search Intent Framework

Controlled taxonomy used below: COMMERCIAL, TRANSACTIONAL, INFORMATIONAL,
COMPARISON, APPLICATION, TECHNICAL, BUYER_VALIDATION, BRAND.

Worked examples for major pages:

- `/products/water-soluble-pva-yarn` — COMMERCIAL primary. Who: weaving/knit
  process engineers + procurement. They need format capability + selection
  criteria + removal behavior. The page answers "what/who/why" well; the
  hard-spec layer is missing (EVIDENCE REQUIRED).
- `/applications/towel-weaving` — APPLICATION. Who: towel mills evaluating a
  zero-twist line change. Needs exactly what the template provides (problem,
  process position, variables, test method). Fit: GOOD.
- `/knowledge/pva-yarn-dissolution-temperature-guide` — TECHNICAL/
  INFORMATIONAL with commercial adjacency. Fit: GOOD; owns the selection model.
- `/answers/best-pva-water-soluble-yarn-manufacturers-china` —
  BUYER_VALIDATION, expanded, evidence-led, explicitly refuses self-ranking.
  Fit: GOOD (cornerstone).
- `/answers/top-water-soluble-pva-yarn-exporters-china-2026` —
  BUYER_VALIDATION thin page, ranking-flavored phrasing, same funnel stage as
  the cornerstone above. Fit: PARTIAL — currently fails the boundary the
  ownership map assigns it.
- `/request-sample` — TRANSACTIONAL. Fit: GOOD structurally.
- Home title targets "Water-Soluble PVA Yarn Manufacturer China" —
  COMMERCIAL/BRAND. Fit: GOOD; note it claims manufacturer identity, which
  the manufacturing/evidence pages support.

## Topic Cluster Map

**A. Core water-soluble PVA product cluster** — viable, owners exist:
`/products` (category) + 4 detail pages (formats). Missing: product-scoped
spec data; extended formats (PVA cotton/top/PPVA/concrete/Gracell) are
**blocked by CONTRADICTORY availability** — do not create pages for them.

**B. Dissolution / temperature / water-solubility cluster** — owner:
`/knowledge/pva-yarn-dissolution-temperature-guide`; supporters: testing
answer, 20-vs-90 answer, 20°C-bulk answer, catalog blocks. Boundaries defined
in the ownership map and mostly respected. Missing: "defining the removal
endpoint" and "storage/humidity handling" education; one data inconsistency
(70°C in product copy vs 6-temperature catalog).

**C. Application cluster** — owners: 5 application pages. Support: matching
buyer answers exist for towel, embroidery/lace, knitwear, papermaking,
nonwoven, technical/composite, fishing-net, swimwear — but application pages
do not link the answers and vice versa. Cashmere/wool processing appears only
as patent titles (`patents.ts`) — **no product or application page claims it;
do not create one without owner evidence.**

**D. Buyer validation / supplier-selection cluster** — the weak spot. Nine
URLs, one expanded cornerstone, shorter-template satellites, some
ranking/geo-flavored variants with overlap risk.
Evidence pages (`/quality`, `/manufacturing`) are strong but not linked into
the validation journey from answer pages.

**E. Technical education cluster** — 4 articles; cohesive but shallow at the
edges (batch consistency, spec checklist, format comparison covered; unit
conversion, wastewater/solubility-vs-biodegradability, sample→bulk change
control live only inside answer fragments).

**F. Comparison / material-selection cluster** — owner:
`/knowledge/pva-staple-fiber-vs-filament-yarn` (format comparison). No clean
owner for "yarn vs thread vs staple vs filament: which machine route" (finder
covers it interactively). HYPOTHESIS only; RESEARCH_FIRST before any new URL.

## Topic / Keyword-to-Page Ownership

Qualitative; no volumes asserted. Status: GOOD / PARTIAL / POOR / MISSING /
CANNIBALIZED.

| Topic / query concept | Intent | Current best URL | Fit | Competing URL(s) | Action |
| --- | --- | --- | --- | --- | --- |
| water-soluble PVA yarn (manufacturer) | COMMERCIAL | `/products/water-soluble-pva-yarn` | GOOD | home title | keep; add spec depth |
| PVA sewing thread | COMMERCIAL | `/products/water-soluble-pva-sewing-thread` | PARTIAL (generic catalog) | — | expand product-specific data |
| PVA staple fiber / filament | COMMERCIAL | product details | PARTIAL | knowledge article + 2 answers | as above |
| PVA dissolution temperature guide | TECHNICAL | `/knowledge/pva-yarn-dissolution-temperature-guide` | GOOD | home/products catalog blocks (entry role, acceptable) | keep |
| dissolve/test method procedure | TECHNICAL | `/answers/test-pva-yarn-dissolution-temperature` | PARTIAL (thin) | guide §method sections | EXPAND one primary owner (answer) |
| 20°C vs 90°C choice | COMPARISON | `/answers/20c-vs-90c-pva-yarn-difference` | PARTIAL (thin) | guide | expand per defined boundary |
| staple vs filament difference | COMPARISON | `/knowledge/pva-staple-fiber-vs-filament-yarn` | PARTIAL | `/answers/pva-staple-fiber-vs-filament-yarn-difference` | CANNIBALIZED → consolidate ownership |
| best/top China PVA manufacturers, exporters | BUYER_VALIDATION | expanded manufacturers answer | PARTIAL cluster-wide | top-exporters-2026 (strongest overlap pair); verify-factory, shandong-guangdong, iso-shandong hold distinct intents | DIFFERENTIATE the best/top pair (RESEARCH_FIRST; no retirement without query/redirect evidence) |
| factory audit / documents / verification | BUYER_VALIDATION | audit & documents answers | PARTIAL (shorter template; contextual evidence links absent, CTAs present) | — | deepen where high-stakes + link `/quality` `/manufacturing` |
| OEKO-TEX / ISO verification | BUYER_VALIDATION | `oeko-tex-pva-yarn-supplier-china`, `iso-certified…` | PARTIAL | `/quality` (owns facts) | keep both; add evidence links |
| price per kg / MOQ / lead time | BUYER_VALIDATION | price/MOQ answers | PARTIAL | `/request-quote` | keep qualitative; policy = owner input |
| towel zero-twist yarn | APPLICATION | `/applications/towel-weaving` + source answer | GOOD | — | cross-link |
| papermaking / nonwoven fiber | APPLICATION | article-less: app page + 2 answers | PARTIAL | — | link; evidence first |
| biodegradability vs solubility | INFORMATIONAL/TECHNICAL | `/answers/biodegradable-water-soluble-thread-fashion` | PARTIAL | none | EXPAND_EXISTING_PAGE (no eco claims; new page only if research proves distinct intent) |
| "what is PVA yarn" definitional | INFORMATIONAL | product intro absorbs it | PARTIAL | — | NO_ACTION now; watch |

## Cannibalization Analysis

Tested per §17 (same intent? stage? answer? buyer? action?).

1. **Staple-vs-filament article vs difference answer** — same core question,
   same stage, overlapping answer. Real cannibalization risk.
   → **EXPAND ONE PRIMARY OWNER** (article), **REPOSITION** answer to a
   procurement-decision card that links back.
2. **Supplier/manufacturer ranking-flavored answers** (best-manufacturers,
   top-exporters-2026, verify-factory, iso-shandong, shandong-vs-guangdong,
   export-india-pakistan, china-filament-export) — MEDIUM confidence, not a
   confirmed cluster-wide cannibalization. The strongest evidenced overlap is
   the **best/top + manufacturer-comparison pair** (`best-…manufacturers-china`
   expanded vs `top-…exporters-china-2026` short page): same shortlisting
   intent, same stage, same answer method. The geo variants (iso-shandong,
   shandong-vs-guangdong, export-india-pakistan) and the operational tools
   (verify-factory legal check, audit-checklist, documents-request) carry
   *distinct* buyer intents per the ownership map — these are intent-overlap /
   doorway-drift / near-duplicate *risk* until differentiated, not merge
   candidates. → **Differentiate** the overlapping pair first;
   **KEEP + deepen** the functionally distinct pages (legal factory
   verification, factory auditing, certificate verification, export
   documentation, destination logistics, province-neutral evaluation);
   **no new geo/"best/top" variants**. Any retirement/consolidation is gated
   on Search Console/Bing query evidence, ranking/query overlap, legacy URL
   impact, redirect planning, and buyer intent evidence — none of which exists
   yet for the rebuilt site.
3. **Temperature cluster (guide vs 3 answers)** — boundaries are real
   (model vs method vs choice vs procurement) and the content mostly honors
   them. → **NO REAL CANNIBALIZATION**; differentiate further by expanding
   the thin satellites, not by merging.
4. **Full temperature catalog repeated on all 4 product pages + index +
   home** — same block, so product pages partially compete with each other
   on format-agnostic spec terms. → content action: product-scoped subsets
   (EVIDENCE REQUIRED); any noindex/canonical consequence →
   **TECHNICAL_SEO observation, not a fix here**.
5. **Application page vs application-specific answer** — different intents
   (process education vs purchasing question). → **NO REAL
   CANNIBALIZATION**; needs linking instead.
6. **Fallback-locale English duplicate trees** — 8 indexable copies.
   Task 10 owns (TSEO-10-02 / proposed Task 31). → **TECHNICAL SEO ISSUE —
   PASS TO Task 10/31**; content side is §Localization below.

## Product Page Findings

Structure per product: intro, highlights, selection list, technical overview
(2 paras), process guide (3 steps), FAQ (3), typical applications (filtered —
good), evidence blurb, related answers (filtered by `relatedProduct` — good),
next/prev, CTA. This already covers most of §18's checklist conceptually.

Gaps (each EVIDENCE REQUIRED before writing, never invented):

- **SEO11-03 (P1)** — No product-scoped specification tables: per-format
  count ranges, tolerances, twist/ply options, package formats, moisture
  protection, and which dissolution grades actually exist *for this format*.
  Instead all 4 pages + the index render the identical 6-row cross-format
  `temperatureCatalog` (`src/components/product/product-view.tsx:118-130`,
  `src/content/catalog.ts`). Buyers cannot self-qualify a grade; every page
  competes on the same generic spec list. *Why it matters:* product pages are
  the commercial primary owners; without proprietary spec content they are
  interchangeable at the evaluation moment that precedes sampling.
  → Filter catalog per product applicability and add owner-approved spec data;
  publish TDS-style tables only from verified records.
- **Limitations** — no page states material limitations (e.g. humidity
  sensitivity in storage, alkali/acid exposure, strength ceiling vs permanent
  yarns). Partially and correctly handled inside answers; absent from product
  pages. Content action: add an evidence-led "processing considerations /
  limitations" block once owner supplies the facts.
- **SEO11-04 (P1, content side of TSEO-10-05)** — `extendedFormats`
  (`src/content/products.ts:251-266`, rendered on `/products` and `/zh/products`)
  claims "We also manufacture PVA cotton, PVA top, PPVA fiber, **concrete PVA
  fiber** and Gracell yarn", while `legacy-source.ts:76` (rendered as an
  answer FAQ) states concrete PVA fiber is **not** offered. CONTRADICTORY.
  Task 11's content conclusion: the entire extended-formats block is an
  availability claim with zero specifications, zero pages, and one explicit
  negation. Do **not** build extended-format pages; owner resolution is the
  gate (per PAGE-INTENT-OWNERSHIP: "Extended formats remain inquiry-only").
- Minor: product images/alt text are shared generic assets (`/images/pva-yarn.jpg`
  reused) — differentiation of visual evidence → BRAND_UX/QA cross-note.

## Application Page Findings

**GENUINELY APPLICATION-SPECIFIC** for all five: towel-weaving,
embroidery-sewing, knitting, papermaking, technical-textiles. Each page has a
distinct production problem, process position, temporary-role rationale,
selection variables, testing guidance, and scoped product links
(`src/content/applications.ts` structure + `application-view.tsx`). This is
a real strength *of the content architecture* and the correct model —
separate from evidence strength: outcome claims implied by these pages
("works in this process") rest on legacy copy + general material properties,
not trials, so application OUTCOME evidence is PARTIAL /
OWNER_CONFIRMATION-dependent (Task 12 concurs: no case study, trial record,
or product-to-application evidence chain).

Gaps:

- No links from application pages to the matching buyer answers
  (`source-water-soluble-yarn-zero-twist-towels`, `pva-water-soluble-yarn-embroidery-lace`,
  `pva-fiber-supplier-knitwear`, `pva-fiber-for-papermaking-supplier`,
  `pva-water-soluble-fiber-nonwoven-production`) or to relevant articles; the
  only reading link is a generic `/knowledge` index link
  (`application-view.tsx:132`).
- No per-application validated-scenario evidence (real trials/cases =
  EVIDENCE REQUIRED; none fabricated).
- Cashmere/wool and fishing nets appear elsewhere (patents, one answer) but
  are not applications — correctly not manufactured into pages.
  → **NO_ACTION** beyond linking.

## Knowledge Content Findings

The 4 articles are distinct in intent, accurate-in-tone (method-led,
anti-label), evidence-cautious, and each ends with a CTA + product pills +
other articles + answers link. URL-preserved from legacy; EN verbatim +
purpose-written ZH. Verdict: **KEEP all four**.

Findings:

- **SEO11-09 (P2)** — coverage edges are missing where buyer questions
  demonstrably exist *on this site itself* (asked in answers, unexpanded
  anywhere): storage/humidity handling; defining the removal endpoint as a
  measurable acceptance criterion; solubility vs biodegradability/wastewater
  (today only a thin answer owns the boundary). → RESEARCH_FIRST /
  EXPAND_EXISTING_PAGE candidates; new URLs only if the expansion can't fit
  the owning cluster page. Environmental claims must stay evidence-led (§10
  rule; biodegradability is NOT asserted anywhere in site copy — keep it that
  way without data).
- Article related-blocks: every article shows all 4 product pills and the
  other 3 articles regardless of topical relevance (e.g. the dissolution
  guide links staple-fiber-vs-filament equally with batch consistency) —
  weak contextual relationship (feeds SEO11-06).
- Authorship/review metadata: pages show published/updated dates and a
  "technical content team" note; no named reviewer/process claim —
  GEO_AI_SEARCH relevant (answer trust), noted in Cross-Functional.

## Buyer Answer Findings

- **SEO11-01 (P1, corrected)** — Structural fact (confirmed): 30 Buyer
  Answers total; exactly **1 expanded record** and **29 shorter
  template-based records** (question + ~40-word answer + ~3 detail pairs +
  ask-for list). The correct characterization is therefore *29 of 30 use the
  shorter shared template*, **not** "29 of 30 are too thin". Task 12's
  qualitative assessment — no numerical score is used in that report — is:
  Buyer Answer extractability STRONG (ADEQUATE to STRONG) and STRONG format,
  WEAK–MODERATE depth/evidence. The shorter answers are generally
  well-formed, scannable, and question-led, and several individual answers
  are adequate; high-stakes buyer questions are frequently too shallow or
  insufficiently evidenced. The finding must therefore be read as a
  **selective depth/usefulness/evidence gap on sampled high-stakes pages**,
  distinguishing EXTRACTABILITY (good) from DEPTH / USEFULNESS / EVIDENCE
  (varies by page). Sampled high-stakes answers that are demonstrably
  underdeveloped for their decision role:
  `top-water-soluble-pva-yarn-exporters-china-2026` (courts a ranking query it
  doesn't method-answer), `test-pva-yarn-dissolution-temperature` (procedure
  thinner than the guide it defers to), `20c-vs-90c-pva-yarn-difference`,
  `verify-chinese-pva-yarn-factory` and `factory-audit-checklist-*`
  (qualification pages without evidence paths), `documents-request-*`
  (export-documentation checklist carried in ~1 answer).
  → **Selective, evidence-led EXPAND_EXISTING_PAGE program** (priority ≈10
  high-stakes pages, order by commercial proximity × evidence readiness),
  not a bulk rewrite of all 29. Template-model note (corrected): the expanded
  record's `cta`/`ctaLabel` fields exist in `answer-expanded.ts` but are
  **not rendered** by `answer-article.tsx` or the route — the expanded page's
  CTA comes from the shared bottom aside block; the route does render
  sections, comparison scorecard, inquiry/askFor, curated related links, and
  conclusion.
- **SEO11-02 (P2, corrected — downgraded from P1)** — supplier-cluster
  overlap, MEDIUM confidence: intent overlap / doorway-drift / near-duplicate
  *risk*, concentrated in the best/top manufacturer-comparison pair; distinct
  intents (legal verification, auditing, certificate verification, export
  documentation, destination logistics, province-neutral evaluation) are
  preserved, not merged. → Differentiate/deepen per Cannibalization #2;
  **no new "best/top/regional" variants** (anti-content-farm rule);
  URL retirement only behind query/legacy/redirect evidence.
- Missing high-value buyer questions (defensible from site's own inquiry
  fields and answers' "askFor" lists — presented as hypotheses, not proven
  demand): sample→bulk change control; count-system conversion (Ne vs dtex
  vs ticket) for inquiry preparation; wastewater/removal-liquor handling.
  Each maps to an existing cluster parent; RESEARCH_FIRST.
- **SEO11-05 (P2, corrected wording)** — the 5 supplier answers without
  `relatedProduct` still render the shared template's conversion CTA
  (`/request-sample`, `/contact`), so they do **not** lack a commercial path
  entirely. The actual weakness is the **missing contextual product/evidence
  path**: no link from a qualification question to the product set or to
  `/quality`/`/manufacturing` proof — i.e. weak contextual proof transfer
  exactly where trust transfer matters most. (Relationship fix, not link
  edits here; no behavioral impact asserted.)

## Internal Content Relationship Findings

- **SEO11-06 (P2)** — The template-level relationship model is good on
  product pages (application filter + relatedProduct answers) but:
  (a) `articles.slice(0, 2)` hard-codes the *same two* articles onto every
  product page (`product-view.tsx:25`);
  (b) application pages link only to the knowledge index;
  (c) articles relate to all products uniformly;
  (d) no Product↔Answer reciprocity beyond one-way product buttons;
  (e) evidence layer (`/quality`, `/manufacturing`) is a sink — nothing in
  the validation journey links *into* it from answers;
  (f) finder results hand off to inquiry (good) but no educational pages feed
  the finder.
  → Recommended **content relationship model**: define a relation matrix
  keyed by existing slugs (product↔application↔article↔answer↔evidence),
  authored as data (allowlisted content files), rendered by templates.
  Spec the matrix in a content task; implement links in a shared-component
  task with ORCHESTRATOR approval (`src/components/*` are implementation
  surfaces). No links edited by this audit.

## Localization Content Findings

Design (SOURCE-CONFIRMED, §11 of the rebuild plan): EN+ZH have full deep
content (including ZH patches for all 30 answers + expanded answer);
es/pt/ru/ar/tr/vi/id/de have translated chrome + finder/form/home only, with
English deep content — all eight locale trees remain indexable (Task 10).
Per Task 10 TSEO-10-02 the English fallback surface is **at least 43
deep-detail routes per locale** (4 products + 5 applications + 4 knowledge +
30 answers); not all 55 sitemap routes per locale should be described as
wholly English, since the homepage, chrome/nav, product-finder and form
shells *are* localized in those locales.

Content implications:

- **SEO11-07 (P2)** — Intent consistency break: localized home/title/H1
  ("Fabricante de hilo PVA hidrosoluble en China" in ES) sets a translated
  expectation that `/es/products/...` immediately violates with English body.
  For a B2B buyer this reads as either machine-translation posture or
  unfinished site — a trust cost in markets the *legacy export story* targets
  (the legacy list itself is OWNER_CONFIRMATION_REQUIRED).
- Priority classification (**STRATEGIC_HYPOTHESIS — ordering only; pending
  commercial/export evidence, inquiry data, analytics, search/indexing
  policy, and market evidence; NO ordering below is established market
  priority**). The tentative bands, recorded so a research task can confirm
  or refute them:
  - candidate `PRIORITY_TRANSLATION` if demand evidence supports it: vi, tr,
    es/pt (legacy copy names Vietnam, Turkey, Peru among shipment markets).
  - `FALLBACK_ONLY` acceptable near-term: ar, id, de, ru — until demand
    evidence exists.
  - `NEEDS_CONTENT_PARITY`: zh (already good — keep; verify new content
    always ships EN+ZH together, as `answers.ts` build() already enforces).
  - `DO_NOT_LOCALIZE_YET`: extended formats, region-specific manufacturer
    answers (translating doorway-drift variants multiplies the SEO11-02 problem).
- `OWNER_CONFIRMATION_REQUIRED`: which locales are commercially indexed at
  all — a decision Task 10 already routed (proposed Task 31); the content
  answer (what to translate first) should follow the same decision, and the
  locale-ordering hypothesis must be settled with commercial evidence in the
  same pass.

## Claim / Evidence Risks

Classification rule for this table (corrected pass): a claim is
**VERIFIED_IN_CURRENT_EVIDENCE** only when a current authoritative register or
public document supports that exact claim at that exact scope. Statements found
inside the repository, transcribed certificates, or historical filings records
support at most **PARTIAL** / **HISTORICAL** pending independent confirmation.

| Claim (where) | Status |
| --- | --- |
| Dual legal identity 荣沣 = Shandong Three Thai, USCC | PARTIAL — supported by certificate name printing in the Aug 2026 dossier (HISTORICAL transcription); registry re-confirmation cheap, owner to verify |
| ISO 9001 valid→2029-08-06 (cert 23226Q00380R101); OEKO-TEX SH005 149658 valid→2027-01-31; TESTEX test report | VERIFIED_IN_CURRENT_EVIDENCE **only for the narrow certificate facts as transcribed** (cert number, issuer, dates, stated scope: raw-white 100% water-soluble PVA yarn, Class I). Do NOT extend: ISO supports the management-system scope, not product performance; OEKO-TEX covers the certified article, not every product family; TESTEX mapping needs report-number→material→permitted-claim linkage (Task 12 scope controls) |
| 34 CN granted patents + 2 foreign ("portfolio") | PARTIAL / OWNER_CONFIRMATION_REQUIRED — the Aug 2026 dossier (HISTORICAL) records grants, co-ownership with 山东惠民三泰, and 5 CNIPA transfer notices, but current CNIPA register status, ownership, and lapse state were not independently re-checked in this audit; grant-time certificates alone must never be presented without transfer records (§8a audit note). Treat portfolio claims as register-confirmation-pending |
| Nigeria patent (RP: F/PT/C/O/2026/21316) | PARTIAL — certificate PDF present; priority-claim scope (CN 20251132549.7) and any joint-holder relationship on the registered instrument must be quoted from the certificate exactly; do NOT imply exclusive ownership or a scope broader than the granted claims |
| Malta patent (No. 5964) | PARTIAL→VERIFIED (narrow) — registered per Maltese public record as cited in the dossier; supports only the specific registered device claim (dust purification), not general technology leadership |
| Application-content outcome claims (5 application pages) | STRUCTURE strong; outcome EVIDENCE PARTIAL — pages are process-specific and composed from verified legacy copy, but there are no trials, case records, or measurements proving results on real buyer lines; several outcome implications are owner-confirmation-dependent (Task 12: "no case study, trial record, or product-to-application evidence chain") |
| "Manufactures 4 PVA formats" | SOURCE-CONFIRMED + legacy-consistent; spec depth UNSUPPORTED → EVIDENCE_REQUIRED |
| Extended formats "we also manufacture…" incl. concrete PVA fiber | **CONTRADICTORY** (vs legacy FAQ negation; TSEO-10-05) → owner gate |
| 30,000 m², 120,000 spindles, 8,000+ t/yr, 300+ employees, 50+ specs | OWNER_CONFIRMATION_REQUIRED (dated legacy figures; site itself discloses "reproduced from the previous site") |
| "15+ export markets", named shipment countries | OWNER_CONFIRMATION_REQUIRED (verbatim legacy claim, §8.5) |
| 27-person R&D team; Wuhan Textile Univ. workstation; Jiangnan Univ. collab; SAC/TC 209 drafting unit; honors list | OWNER_CONFIRMATION_REQUIRED — "as listed in official company filings" is a HISTORICAL filing statement, not independent verification of a current relationship/team/status; supporting documents are "available on request", not published; do not treat plans or filings as verified current facts |
| "Since 2006" | SOURCE-CONFIRMED (registry-consistent; low-risk) |
| 20→90°C controlled-dissolution range | SOURCE-CONFIRMED in copy; 70°C inconsistency (SEO11-10); grade-by-grade production reality = EVIDENCE_REQUIRED |
| Biodegradability | correctly NOT claimed anywhere; keep evidence-led |
| Fishing-net / swimwear-soluble fabric answers imply development capability | OWNER_CONFIRMATION_REQUIRED (soft capability implication; answers are currently question-framed — acceptable, but do not promote into case claims) |

## Content Gap Analysis

| Gap | Action | Owner/parent | Evidence required | Notes |
| --- | --- | --- | --- | --- |
| Product-scoped spec tables | EXPAND_EXISTING_PAGE | product details | owner-approved count/range/package/QC data | P1; blocks "manufacturer depth" |
| ~10 priority answers expanded | EXPAND_EXISTING_PAGE | /answers | internal method docs only | P1 |
| Removal-endpoint & storage education | EXPAND_EXISTING_PAGE first | temperature guide; product process guide | test-method docs | RESEARCH_FIRST for new URL |
| Solubility vs biodegradability glossary | **EXPAND_EXISTING_PAGE** (ownership map assigns this intent to `/answers/biodegradable-water-soluble-thread-fashion`); a separate new page only if RESEARCH-DEPENDENT evidence shows genuinely distinct intent | expand that answer (ZH parity too) | wastewater/lab evidence for eco claims | no environmental claims without data; avoid unnecessary URL expansion |
| Inquiry-prep / unit-conversion helper | RESEARCH_FIRST | checklist article or finder | none (procedural) | low complexity, moderate value |
| Extended-format pages | **NO_ACTION (blocked)** | — | owner availability decision | contradiction gate |
| Region doorway variants | **NO_ACTION** | — | — | anti-pattern |
| Case studies / customer proof | EVIDENCE_REQUIRED → RESEARCH_FIRST | applications/quality | named-customer permission | never fabricated |

## Keep / Merge / Expand / Retire Matrix

| Asset | Verdict |
| --- | --- |
| `/products` + 4 details | KEEP_AND_IMPROVE (spec depth, product-scoped catalog) |
| extendedFormats block | RESEARCH_FIRST (blocked by contradiction) |
| 5 application pages | KEEP_AND_IMPROVE (linking) |
| 4 knowledge articles | KEEP; guide & comparison articles candidates for EXPAND |
| Expanded manufacturer-comparison answer | KEEP as cluster cornerstone |
| Staple-vs-filament *difference answer* | MERGE/REPOSITION into decision card under article |
| Top-exporters-2026 / best-manufacturers (overlapping pair) | DIFFERENTIATE / deepen first (strongest evidenced overlap); consolidate only behind query-demand + legacy-URL + redirect evidence |
| iso-shandong / shandong-vs-guangdong / export-destination answers | KEEP — distinct intents (province comparison, destination logistics); differentiate answer method, do NOT retire merely for sharing the supplier topic |
| shorter-template operational answers | KEEP_AND_IMPROVE via selective, evidence-led expansion (high-stakes pages first) |
| `/answers` index, `/quality`, `/manufacturing`, `/about`, commercial tail | KEEP |

## Prioritized Findings Register

| ID | Sev | Category | Finding (one line) |
| --- | --- | --- | --- |
| SEO11-01 | P1 | Depth | 29/30 buyer answers use the shorter template; selective depth/evidence gaps on sampled high-stakes pages (extractability itself OK — Task 12) |
| SEO11-02 | P2 | Cannibalization | supplier-cluster intent overlap / doorway-drift / near-duplicate risk (MEDIUM conf.; strongest pair best/top) |
| SEO11-03 | P1 | Product content | no product-scoped specs; identical catalog on all product pages |
| SEO11-04 | P1 | Claims | extended-formats availability claim contradiction blocks product cluster |
| SEO11-05 | P2 | Relationships | 5 supplier answers lack contextual product/evidence path (conversion CTAs exist via template) |
| SEO11-06 | P2 | Relationships | generic slice-based related blocks; evidence pages are link sinks |
| SEO11-07 | P2 | Localization | chrome-only fallback locales break buyer intent trust; no translation priority plan |
| SEO11-08 | P2 | Claims | dated figures (capacity/spindles/employees/markets/specs) still anchor commercial copy |
| SEO11-09 | P2 | Gaps | missing technical edges (endpoints, storage, solubility-vs-biodegradability) |
| SEO11-10 | P3 | Data integrity | 70°C in product copy absent from the 6-row temperature catalog |
| SEO11-11 | P3 | Claims | certification mentions should carry scope qualifiers consistently (OEKO-TEX scope is raw-white yarn) |
| SEO11-12 | P3 | Consistency | answers index H1 hard-counts "30"; count-drift risk when answers change |

Finding format detail for the P1s (P2/P3 abbreviated as above carry the same
fields in the register context):

**SEO11-01** — Severity P1; Confidence HIGH (structure) / MEDIUM (which
pages need depth); Category content depth (selective);
Affected: `/answers/*` — the 29 shorter-template records, of which a sampled
subset of high-stakes pages show demonstrable depth/usefulness/evidence gaps;
Primary intent BUYER_VALIDATION;
Evidence: `legacy-source.ts` answer shape vs `answer-expanded.ts` (1 key) —
SOURCE-CONFIRMED; Task 12's qualitative assessment for the short family:
STRONG extractability, STRONG format, WEAK–MODERATE depth/evidence — the
gap is DEPTH/USEFULNESS/EVIDENCE, not template count;
Why it matters: validation-stage pages are the site's differentiator; the
sampled high-stakes pages under-serve their decision role, and their
under-development — not the template itself — is what caps the cluster;
Action: selective, evidence-led EXPAND_EXISTING_PAGE program (~10
high-stakes pages, order by commercial proximity × evidence readiness;
establish source/editorial/reviewer governance first; factual additions gated
on evidence); Evidence required: internal test-method/QC docs for new
specifics; Suggested owner: SEO_CONTENT (writing) + owner evidence;
Follow-up: Task 11-B (11-A only for pages whose expansion adds
evidence-dependent facts); Dependency: GEO_AI_SEARCH extractability spec
already provided by Task 12; Risk: bulk-expanding all 29 uniformly recreates
bulk-content patterns and overstates demonstrated need.

**SEO11-02** — P2 (downgraded from P1 after review); MEDIUM confidence;
cannibalization risk / intent overlap; `/answers/` supplier set;
BUYER_VALIDATION; evidence: slug/answer comparison + PAGE-INTENT-OWNERSHIP
boundaries; SOURCE-CONFIRMED structure, INFERRED search-cannibalization
(no query data exists yet);
Why it matters: the best/top pair can split a single query intent; the wider
geo/verification set is *at risk* of doorway-drift, not proven duplicate;
Action: differentiate the overlapping pair first; KEEP + deepen distinct
intents (legal factory verification, factory auditing, certificate
verification, export documentation, destination logistics, province-neutral
evaluation); do NOT retire or merge URLs merely for sharing the supplier
topic; no new geo/"best/top" variants;
Dependency: RESEARCH_FIRST — Search Console/Bing query evidence, ranking/query
overlap, legacy URL impact, redirect planning, buyer intent evidence; Task 31
(indexation policy) for satellite handling; Risk: aggressive merge could drop
preserved legacy URLs — coordinate redirects with TECHNICAL_SEO if URLs retire.

**SEO11-03** — P1; HIGH; product content; `/products/*`;
COMMERCIAL/TECHNICAL; evidence: `product-view.tsx:118-130`, `catalog.ts`,
`products.ts`; SOURCE-CONFIRMED; Action: owner spec data → product-scoped
tables + filtered catalog; Evidence required: production-representative spec
registry; Dependency: CRO (quote-form fields already mirror these variables —
align vocabulary); Risk: publishing unverified specs is forbidden — gate hard.

**SEO11-04** — P1; HIGH (content side); claims; `/products` extendedFormats +
answer negation; CONTRADICTORY (TSEO-10-05 RUNTIME-CONFIRMED); Action: owner
resolution task first; strip or substantiate; no extended pages meanwhile;
Dependency: Task 10-proposed 37; Risk: buyer-facing trust + schema integrity.

### Internal Prioritization Score (heuristic, not an SEO score)

Order for the follow-up tasks = (Buyer Impact 40% + Commercial Proximity 30% +
Evidence Readiness 20% + Implementation Complexity⁻¹ 10%), qualitative bands.
Dependencies are **evidence-specific, not a universal 11-A gate**: 11-A gates
current company facts, product availability, product specifications and
evidence-dependent claims (C; the factual parts of B; D-claims; G's
company/process content); purely structural/editorial work (E, differentiation
wording in D, editorial governance in B) proceeds without waiting on 11-A.
Resulting sequence: A (evidence package) → B (prioritized answer improvement,
partial) → C (product specs, gated by A) → D (supplier differentiation,
RESEARCH_FIRST) → E (relationship matrix) → F (localization research, gated by
Task 31 + commercial evidence) → G (education expansion, existing owners first).

## Proposed Follow-Up Tasks

1. **11-A Owner Evidence Package** — Outcome: decision on extended formats/
   concrete fiber + current figures (capacity, spindles, employees, spec
   count, export list) + product spec registry + publishable test/QC document
   list + current patent-register spot-check (status/ownership/transfer).
   Role: SEO_CONTENT (facilitating) + ORCHESTRATOR/owner. Priority: **P1**.
   Scope: **evidence-gated work only** — current company facts, product
   availability, product specifications, evidence-dependent claims. Purely
   structural/editorial follow-ups (11-E, differentiation wording, editorial
   governance) are NOT gated behind it. No code.
2. **11-B Buyer Answer Improvement Program** — NOT a uniform expansion of all
   29. Establish source/editorial/reviewer governance first; then expand a
   prioritized set of high-stakes pages (per Buyer Answer Findings list),
   EN+ZH together, following the existing expanded pattern; gate any factual
   additions on 11-A evidence while procedural/method rewording proceeds.
   Role: SEO_CONTENT. Priority **P1**. Scope: `src/content/` answer files.
   Risk: keep one-voice, evidence-led; no new facts.
3. **11-C Product-Specific Spec Tables + catalog filtering** — Keep **strongly
   gated on owner-approved product data** (11-A). Deliverables: versioned
   product fact sheets, test methods/endpoints, product applicability
   boundaries, approved specifications — never invented values. Role:
   SEO_CONTENT + HIGH_RISK_CODE implementer. Depends: 11-A. Priority **P1**.
   Scope: `src/content/{products,catalog}.ts`, `product-view`, catalog blocks.
   Risk: shared component → ORCHESTRATOR approval.
4. **11-D Supplier-Cluster Differentiation** — **RESEARCH_FIRST**, focused
   initially on the genuinely overlapping best/top pair; deepen/differentiate
   the distinct-intent pages (verification, audit, documents, destination
   logistics) rather than retire them. No URL retirement/consolidation without
   Search Console/Bing query evidence, ranking/query overlap, legacy URL
   impact, redirect planning, and buyer intent evidence. Role:
   SEO_CONTENT + TECHNICAL_SEO. Depends: demand research; Task 31
   (indexation policy); 11-A only for factual claims added during
   differentiation. Priority **P2**.
5. **11-E Content Relationship Matrix** — data-driven product↔application↔
   article↔answer↔evidence links, incl. fixing `slice(0,2)` and the 5
   supplier answers with weak contextual product/evidence paths (their
   template CTAs to `/request-sample`/`/contact` already exist — the fix is
   contextual proof/product linkage, not adding conversion routes). Role:
   SEO_CONTENT authors matrix (content files) + component task for rendering
   (shared files → ORCHESTRATOR). Priority **P2**. No evidence gate.
6. **11-F Localization Content Research + Priority Plan** — **RESEARCH_FIRST**:
   locale priority requires commercial/export evidence, inquiry data,
   analytics, search/indexing policy (Task 31) and market evidence. Any
   vi/tr/es (or other) ordering remains STRATEGIC_HYPOTHESIS until that
   research lands; only then plan a translation wave with parity rules.
   Role: SEO_CONTENT + ORCHESTRATOR. Priority **P2**.
7. **11-G Technical Education Expansion** (endpoint definition, storage/
   humidity, solubility-vs-biodegradability, unit conversion) — expand
   existing owner pages first (avoid one giant content-production wave);
   separate **general sourced education** (ungated) from **owner-dependent
   company/process/product claims** (gated on 11-A). Role: SEO_CONTENT.
   Priority **P3**.

## Cross-Functional Coordination

**TECHNICAL_SEO:**
- EN `/request-sample` metadata declares its `zh` alternate as
  `/zh/request-quote` (`request-sample/page.tsx:15`) — locale-alternate intent
  mismatch (sample→quote); technical fix belongs to Task 10's follow-up family.
- Product/index catalog duplication (§Cannibalization #4) and satellite-locale
  indexability remain Task 31 territory; content report intentionally assumes
  no canonical changes.
- Any 11-D URL retirements need redirect + schema cleanup handling.

**GEO_AI_SEARCH (Task 12 — completed; used as cross-check evidence in this
corrective pass, `docs/audits/12-geo-ai-search.md`):**
- Task 12's qualitative assessment of the Buyer Answer family (no numerical
  score is used there): extractability ADEQUATE–STRONG, STRONG format,
  WEAK–MODERATE depth/evidence — adopted here to recast SEO11-01 as a
  selective depth/evidence gap rather than a blanket thinness claim. Its
  conservative classifications for patents, R&D/company claims, application
  evidence and certification scope informed Correction 1 (reconciled against
  source here, not copied mechanically).
- Entity/author trust ("technical content team", no named reviewers) remains
  for future implementation; concrete-PVA contradiction already confirmed by
  Task 10 in FAQ JSON-LD (TSEO-10-05).

**CRO:**
- Application-prefilled sample links (`?application=slug`) are a good
  content→conversion bridge — preserve in 11-C/E specs.
- Quote form vocabulary (count/dtex/temperature/destination) should align
  with the spec registry from 11-A so educational content and forms use one
  taxonomy; finder→inquiry handoff has no educational reinforcement page.

**BRAND_UX:**
- Chrome-vs-English body language mix in fallback locales is also a perceived
  quality/brand issue (SEO11-07), beyond content strategy.
- Product images are shared generic assets across formats.

**QA_PERFORMANCE:**
- No new runtime defect surfaced by this audit; count-hardcoded strings
  (SEO11-12: "30 practical answers" H1, answers index description) are
  drift-prone — a build-time assertion or derived count is the safe pattern.

## Unknowns / Data Requirements

1. Actual current production capability per format (counts, grades, 70°C,
   extended formats) — owner.
2. Real figures behind capacity/spindle/employee/spec-count claims and
   export-market list — owner.
3. Whether fallback locales should be indexed at all — owner + Task 31.
4. Any demand data for region/ranking queries — Search Console (none exists
   yet for the rebuilt site).
5. Wastewater/environmental test evidence — required before any
   biodegradability content expansion.
6. Permission status for any future named case studies — owner.

## Conclusion

The rebuilt site earns a passing architecture with an incomplete execution of
its own intent map: every important intent already has a designated owner URL;
what's missing is depth where the buyer decides. The next content phase should
not add URLs — it should (1) collect owner evidence, (2) selectively deepen the
high-stakes Buyer Answers and add the product spec layer inside existing URLs,
(3) differentiate the overlapping best/top pair while preserving distinct
supplier intents, and (4) let demand research plus the Task 31 locale decision
drive a first real translation wave. Content-farm paths (extended-format
doorway pages, more geo "best/top" variants, mass translated fallbacks) are
explicitly not recommended.
