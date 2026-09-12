# Task 64 — R-series plan (R4–R9), execution-ready

Status: `READY`, plan only. R1, R2, R3 are delivered on `codex/62-knowledge-r1-r2-evidence`.
Base: continue on that branch; PR #43 must merge or be rebased against it (both touch
`resources-groups.ts` and the `intl-dees-001` hub test).

## Why each article is three files

One edit carrying a full bilingual article (~1,300 words per locale, typed blocks)
**truncates the tool call and leaves an invalid module**. It happened twice. So per slug:

1. `src/content/article-<slug>-en.ts` → `export const en: ArticleBody`
2. `src/content/article-<slug>-zh.ts` → `export const zh: ArticleBody`, same block shape
   (`assertAlignedBody` compares structural fingerprints and fails the build otherwise)
3. `src/content/article-additions.ts` → import both + `NewArticleSpec` entry
4. `src/content/card-copy.ts` → four-locale `ARTICLE_TEASERS` entry (`en`/`zh` must equal the
   entity verbatim or the build throws; `es`/`de` drafted, flagged for translator review)
5. `src/content/article-related.ts` → `relatedFor` entry (every slug must resolve)
6. `category`: reuse `Technical guide` / `技术指南`; no grouping registry edit needed
7. build → regenerate baseline with `set UPDATE_DOCUMENT_BUDGET=1&&` (**never chain with `&&`**)
   → `set REQUIRE_BUILD_OUTPUT=1&& npm run test:seo` → `npm run test:first-wave` → `npm run lint`
8. commit, push the branch, request independent review. Do not merge.

## Enforced rules

Copy follows `docs/audits/resources-editorial-voice.md`. Two rules are tests, not advice:

- **every figure must already exist in the repository** (whole numeric tokens compared against
  `quality.ts`, `patents.ts`, `factory.ts`, `legacy-source.ts`, `applications.ts`, `catalog.ts`).
  A body with **no** figure also fails — that is the guard catching generic filler, as it did to R3.
- **the Chinese body must be Chinese**, positionally paired, and the built `/zh` page must carry
  the Chinese headings and none of the English ones.

Never invent: dissolution times, strength/tenacity, twist, machine speeds, bath ratios,
tolerances, capacity, headcount, MOQ, lead time, prices, customer names, markets, certifications.
Usable: seven process targets (20/40/55/60/70/80/90 °C), OEKO-TEX `SH005 149658` Class I raw white
to 2027-01-31, TESTEX `SH005 275198.1` (pH 6.2), SGS `SL22002263585101TX` (7.5 tex, four items,
2020, point-in-time), ISO 9001 `23226Q00380R101` scope/dates, registered device numbers.

## R4 — knitting · slug `water-soluble-pva-yarn-knitting`

H1: **Water-Soluble PVA Yarn in Knitting and Knitwear: How and Why It Is Used**

Replaces the brief's cashmere article: cashmere has only a blended-yarn **process** patent title and
no application page; knitting has a full page plus a granted device patent. Facts already read from
`applications.ts` knitting (~lines 169-238):

- problem: a knit or fancy yarn may need support during **spinning, plating or knitting**, gone
  before the garment is worn; heat or aggressive chemistry is often unavailable because the
  surrounding fibres are sensitive;
- three routes in: **plating/support yarn**, **blend component spun into the yarn**, **staple fibre
  in the blend** (distribution matters more than linear strength);
- it stabilises through preparation and knitting, then dissolves in a **mild washing cycle**;
- why temporary: support is only needed while the knit is fragile; residue would change **hand
  feel, structure and shrinkage**, so low-temperature removal is preferred;
- selection variables: material form; fibre length/fineness when blended; knitting process, tension,
  machine compatibility; low-temperature dissolution requirement; final criteria (hand feel,
  structure, shrinkage, residue);
- testing: trial the actual blend or route, evaluate the finished fabric on those four, and keep
  the cycle inside the surrounding fibre's temperature tolerance;
- products: `/products/water-soluble-pva-yarn`, `/products/pva-staple-fiber`;
- patent `CN 218520715 U` (openwork single-jersey with water-soluble yarn, 2023-02-24) — the
  "holes are where the yarn was" case, and the digits the figure guard requires.

## R5 — sewing thread · slug `water-soluble-sewing-thread-guide`

H1: **Water-Soluble Sewing Thread: What It Is, How It Works and Where It Is Used**

Evidence: `legacy-source.ts` sewing-thread product (applications: temporary seams/basting,
embroidery positioning, garment processing, wash-away assembly support; selection: count and ply,
sewing speed and needle conditions, temporary seam strength, removal temperature and cycle; FAQs:
thread is not a film or nonwoven backing; a thread can break although its tensile result is
acceptable — needle conditions, guides, tension, speed, package unwinding, seam design; OEM
packaging). Answers: `pva-sewing-thread-temporary-stitching-garments`,
`reliable-oem-pva-water-soluble-sewing-thread-factory`, `minimum-order-quantity-…` (frame as
sample/pilot/production, never a number). Link `/applications/embroidery-sewing`.

## R6 — the four forms · **no new slug**

H1: **PVA Staple Fiber, Filament or Yarn? A Practical Selection Guide**

Do **not** add a page. `/knowledge/pva-staple-fiber-vs-filament-yarn` already owns the question and
`/answers/pva-staple-fiber-vs-filament-yarn-difference` duplicates it — the one cannibalisation
001A confirmed. Extend the existing article with the brief's four-row table (form / what it is /
how buyers use it / what to specify) and reposition the answer as a decision card linking up.

## R7 — dissolution variables · slug `pva-dissolution-in-textile-processing`

H1: **What Determines How Water-Soluble PVA Dissolves in Real Textile Processing?**

Distinct from the batch-consistency article (records and QC). This owns the variables: temperature,
time, water movement, access/exposure, material quantity, construction, prior processing, grade;
then a **troubleshooting table of questions to investigate**, never asserted causes; plus the
beaker-versus-production case link to R1/R3 rather than a repeat.

## R8 — supplier evaluation · slug `how-to-evaluate-water-soluble-pva-supplier`

H1: **How to Evaluate a Water-Soluble PVA Supplier Before Placing an Order**

Deep version of `/answers/best-pva-water-soluble-yarn-manufacturers-china`, which already refuses
self-ranking. Fair framework: specification clarity, consistency, product range, technical
communication, sampling, quality documentation, manufacturing capability, commercial communication,
packaging/logistics, repeat-order support; plus "questions worth asking every supplier" and one
closing section on how Three Thai answers each point, using only `/quality`, `/manufacturing` and
the registered devices. Keep the no-public-price position.

## R9 — sample to production · slug `pva-sample-to-production-testing`

H1: **From Sample to Production: How to Test Water-Soluble PVA in Your Textile Process**

Evidence: `products[0].processGuide` (define the temporary function; set a repeatable removal
method; approve a production-representative sample) and the answer
`sample-order-process-pva-water-soluble-yarn` (send the brief; agree the trial; record the result;
approve and lock). Structure: define the job → select a candidate → controlled small-scale trial →
observe more than "did it dissolve" → repeat or adjust → production validation, with a **trial
record table** (grade, application, process, observation, result, next adjustment). The brief's
downloadable worksheet is a separate asset task — note it, never fake a link.

## Order

R4 → R5 → R6 (extend) → R7 → R9 → R8, so technical credibility lands before the commercial piece.
All new articles reuse the approved category, so the hub needs no new heading.
