# Task 12 — GEO and AI-Search Audit

## Executive summary

The site is already easy to extract: 30 buyer-answer pages, four technical
articles, direct-answer blocks, scannable headings, FAQ and Article markup, and a
strong `/quality` evidence surface. The limiting factor is citation readiness,
not page formatting.

Most technical and commercial claims are not connected to a named method,
versioned TDS/COA, test record, owner-approved evidence item, technical reviewer,
or clear scope limitation. The site tells buyers what evidence to request more
often than it publishes evidence for its own claims.

This audit does not claim actual visibility in ChatGPT, Gemini, Perplexity, or
Google AI Overviews.

## Question clusters and current gaps

| Intent | Current coverage | Main evidence gap |
| --- | --- | --- |
| Dissolution and material selection | Strong guides and answers | No grade-specific method/result tied to a product or batch |
| Application fit | Five coherent application pages | No case study, trial record, or product-to-application evidence chain |
| Product specification | Temperature catalog and selection variables | No versioned TDS, tolerances, grade IDs, package data, or sample COA |
| Manufacturer qualification | Strong buyer guidance | Limited factory-specific proof attached to the guidance |
| Certification and quality | Strongest cluster; certificate/report PDFs exist | Scope limits are not reused beside relevant claims |
| Sample and batch testing | Good process guidance | No published SOP, record template, calibration evidence, or example report |
| Commercial/export | Cautious price and MOQ language | No dated policy, service ranges, or destination evidence |
| Sustainability/regulation | Appropriately cautious | No biodegradation, effluent, safety, regulatory, or end-use evidence |

## Citation-readiness scorecard

| Dimension | Buyer answers | Knowledge | Observation |
| --- | ---: | ---: | --- |
| Extractability | 4.5/5 | 4.0/5 | Static, question-led, scannable content |
| Intent coverage | 4.5/5 | 3.0/5 | Answers are broad; knowledge set is small |
| Answer depth | 3.0/5 | 3.5/5 | Only one buyer answer is fully expanded |
| Authorship/accountability | 2.0/5 | 1.5/5 | Organization is named; no visible qualified reviewer |
| Date freshness | 2.5/5 | 3.0/5 | Dates exist but answer dates are uniform and unexplained |
| Primary-source support | 2.0/5 | 1.5/5 | Quality PDFs exist but are not cited claim by claim |
| Entity consistency | 3.5/5 | 3.5/5 | Centralized identity; schema objects do not consistently reuse `@id` |
| Internal evidence paths | 2.0/5 | 2.0/5 | Generic related links; no evidence registry |
| Machine-readable context | 4.0/5 | 3.5/5 | Good schema breadth; locale/entity mismatch remains |
| Overall | **3.0/5** | **2.8/5** | Good containers, weak evidence attachment |

## Highest-impact trust gaps

1. No claim-level evidence map for dissolution grade, count range, strength,
   traceability, capacity, manufacturer status, or similar statements.
2. No product-specific technical-document layer with revision, test method,
   tolerances, conditioning, package format, storage, and issue date.
3. No named technical author/reviewer, qualification, review date, or correction path.
4. General technical guidance is not connected to primary standards, literature,
   experiments, or explicit Three Thai product evidence.
5. Application pages lack owner-approved trial conditions, measurements, and
   acceptance criteria.

## Scope controls

- OEKO-TEX evidence applies to the certificate's stated raw-white 100%
  water-soluble PVA yarn scope; it must not imply coverage for every product family.
- ISO 9001 supports the management-system scope, not a product-performance promise.
- TESTEX evidence needs a visible mapping of material, report number, date,
  permitted claims, and non-applicability boundaries.
- Patents support process/entity authority but do not prove product performance.
- Factory capacity, employee, export, equipment, and recognition claims require
  current owner-approved records before they become citation-grade facts.

## Structural observations

- Organization schema defines an `@id`, but Product and Article entities use
  separate name objects instead of reusing it.
- Product and Article helpers build English-root URLs even on locale-prefixed pages.
- English fallback body content can be presented as non-English through locale
  metadata, schema context, and hreflang.
- Article schema lacks stable `@id`, `url`, `inLanguage`, `isPartOf`, reviewer,
  and evidence/citation relationships.
- Standard buyer answers show a generic source-transparency panel without an
  actual source list.
- Related content is chosen generically rather than by claim relevance.

## Reusable content modules

1. Direct answer + applicability + limitation + last technical review.
2. Claim–evidence card with document ID, scope, date, and limitation.
3. Dissolution test method with conditioning, bath conditions, endpoint, repeat
   count, calibration, and reporting format.
4. Product-suitability module connecting problem, material function, selection
   variables, trial needs, evidence, and product/TDS.
5. Factory-qualification module with entity, address, USCC, process scope,
   evidence date, and buyer-verification boundary.
6. Commercial-uncertainty module for quote variables, validity, MOQ, lead time,
   and a qualified inquiry path.
7. Evidence footer with reviewer, sources, scope, last update, and correction path.
8. Application evidence module with approved grade, trial conditions, result,
   acceptance criterion, and evidence availability.

## Prioritized work

1. P0: Inventory claims across products, applications, answers, factory, quality,
   and exports; classify as supported, conditional, or unpublishable.
2. P0: Create a versioned evidence registry with scope, issuer, date/expiry,
   source, permitted claims, and approval state.
3. P0: Add scope guards to certificate and testing claims.
4. P1: Publish approved TDS/COA/test-method assets or reduce unsupported claims to
   conditional inquiry language.
5. P1: Expand priority answer hubs and add visible reviewer/evidence metadata.
6. P1: Align localized-content policy with canonical, hreflang, sitemap, and schema.
7. P2: Build approved application case studies, protocols, and buyer templates.
8. P2: Consolidate schema entities using Organization `@id`, locale-aware Article
   URLs, `inLanguage`, and evidence relationships.
9. P3: Add a reviewed technical glossary and evidence-refresh calendar.

## Dependencies and coordination

- Owner/QC: current certificates, technical data, test methods, factory evidence,
  publishable trial records, and designated technical reviewer.
- Orchestrator-owned: `src/content/company.ts` and global schema policy.
- Cross-cutting: `src/lib/seo.tsx`, `src/app/sitemap.ts`, answer/article content
  models, and future evidence-registry content.

No files were edited and no live AI-engine visibility was asserted.
