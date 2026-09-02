# Task 11 — SEO Content and Keyword Strategy Audit

## Executive summary

The site already has a useful search architecture: four product pages, five
application pages, four technical articles, 30 buyer-answer URLs, trust pages,
product finder, and conversion routes. The immediate problem is not a shortage
of URLs. It is intent overlap, repeated generic content, inconsistent depth, and
unsupported localization signals.

Only one buyer answer has expanded long-form content. Several answer pages target
nearly identical manufacturer/supplier/factory queries. Every product template
renders the same full temperature catalog. A product-range contradiction also
needs owner resolution before further product SEO work.

## Intent ownership map

| Search intent hypothesis | Primary owner | Supporting routes |
| --- | --- | --- |
| Dissolution temperature selection | `/knowledge/pva-yarn-dissolution-temperature-guide` | Testing and 20°C-vs-90°C answers; product finder |
| Dissolution test procedure | `/answers/test-pva-yarn-dissolution-temperature` | Temperature guide; quality |
| Batch consistency | `/knowledge/pva-batch-dissolution-consistency` | Quality; factory-audit answer |
| Staple fiber vs filament | `/knowledge/pva-staple-fiber-vs-filament-yarn` | Buyer-decision answer; both product pages |
| Buyer specification checklist | `/knowledge/pva-yarn-buyer-specification-checklist` | Quote and sample routes |
| Water-soluble PVA yarn | `/products/water-soluble-pva-yarn` | Manufacturing, quality, supplier-comparison answer |
| PVA sewing thread | `/products/water-soluble-pva-sewing-thread` | Embroidery/sewing application; OEM answer |
| PVA staple fiber | `/products/pva-staple-fiber` | Papermaking/nonwoven application answers |
| PVA filament yarn | `/products/pva-filament-yarn` | Technical-textiles application; export answer |
| Towel, embroidery, knitting, papermaking, technical textiles | Matching `/applications/*` page | Specific buyer answers and relevant products |
| Supplier/factory qualification | Expanded manufacturer-comparison answer | Manufacturing, quality, audit and document answers |
| Quote, sample, product selection | `/request-quote`, `/request-sample`, `/product-finder` | Product/application CTA paths |

These are hypotheses based on the repository. No search volume or ranking data
was used.

## Keep, consolidate, and expand

### Keep

- The four product detail pages as the main commercial landing pages.
- The five application pages as owners of application-category intent.
- The four knowledge articles as technical cornerstone content.
- `/answers` as a grouped buyer-question hub.
- `/quality` and `/manufacturing` as evidence and qualification support.

### Differentiate overlapping clusters

1. Temperature:
   - knowledge guide owns broad selection education;
   - testing answer owns procedure;
   - 20°C-vs-90°C answer owns application choice;
   - 20°C bulk-supply answer owns procurement/sample qualification.

2. Staple-versus-filament:
   - knowledge article owns the comprehensive comparison;
   - buyer answer should remain only if it offers a distinct machine-route or
     purchasing decision framework.

3. Supplier/factory:
   - expanded manufacturer-comparison page becomes the cornerstone;
   - factory-audit and required-document pages remain operational tools;
   - certification and regional pages must be narrowly scoped and evidence-led;
   - avoid doorway-style repetition of “best,” “top,” “manufacturer,” and “China.”

### Expand existing assets before adding URLs

- Prioritize high-intent buyer answers: manufacturer comparison, 20°C bulk
  supply, OEM sewing thread, OEKO-TEX verification, factory verification, price
  comparison, MOQ, sample process, papermaking, and nonwoven use.
- Make product pages product-specific rather than showing every temperature and
  specification on every material form.
- Add process route, removal conditions, acceptance criteria, and relevant
  resources to application pages.
- Replace generic related-content selection with a deliberate product–application–
  knowledge–answer matrix.

## Confirmed gaps and risks

### Content depth and evidence

- Twenty-nine buyer answers use a short template rather than unique, evidence-led
  landing-page content.
- Product pages lack public, versioned TDS/spec tables, tolerances, package data,
  sample protocols, or example COA material.
- Application pages lack approved process briefs, test matrices, and case evidence.
- Visible author/reviewer and evidence-review metadata is missing.

### Contradictory product scope

`src/content/products.ts` advertises concrete PVA fiber among extended formats,
while `src/content/legacy-source.ts` says it is not currently offered. PVA cotton,
PVA top, PPVA fiber, and Gracell yarn also need current availability and evidence
before dedicated pages are created.

### Cannibalization

- Every product page repeats the complete temperature catalog.
- Temperature and material-form article/answer pairs overlap.
- Several supplier/factory answers differ mainly in keyword phrasing.
- Application pages and application-specific answers need clearer ownership.

### Localization

- Eight dynamic locales expose English deep content and often English metadata.
- Blanket hreflang claims stronger equivalence than the content supports.
- The English knowledge index and request-sample page contain incorrect Chinese
  alternate destinations in their caller data.
- Some localized internal links drop the locale prefix, including home application
  links and finder result links.

## Validated content-gap hypotheses

Consider these only after existing overlaps are resolved and technical review is
available:

- storage, moisture, and package handling;
- defining removal endpoints;
- solubility versus biodegradability and wastewater handling;
- interpreting OEKO-TEX scope;
- sample-to-bulk change control;
- count-unit conversion and inquiry preparation;
- yarn/thread/staple/filament choice by machine route.

## Prioritized work

1. P0: Create a single keyword/intent ownership matrix.
2. P0: Align localization, hreflang, sitemap, metadata, and internal links with
   actual translated-content availability.
3. P0: Resolve concrete-fiber and extended-format availability with the owner.
4. P1: Add verified product-specific specification data and filter catalogs by
   product applicability.
5. P1: Expand application pages and the ten highest-intent answers.
6. P1: Implement contextual related-content rules from the ownership matrix.
7. P2: Add evidence-backed buyer tools such as an inquiry brief, sample test
   protocol, batch comparison sheet, or factory-audit checklist.
8. P2: Add content-review metadata and measure actual performance only after
   deployment using Search Console and analytics.

## Dependencies and coordination

- Owner/product team: current product formats, catalog applicability, factory
  facts, specifications, and publishable evidence.
- Technical SEO: metadata and sitemap policy.
- Orchestrator: shared `src/lib/seo.tsx`, locale utilities, global navigation,
  finder, and content-model changes.

No web research, ranking claims, file edits, or commits were made.
