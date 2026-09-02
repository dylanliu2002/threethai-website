# Task 12 — GEO / AI Search Audit

Mode: STRICT AUDIT (no implementation)

Role: `GEO_AI_SEARCH`

Execution: Codex / GPT-5.6 Sol

Source baseline: `origin/main` at `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`

Audit date: 2026-09-03 (Asia/Shanghai)

## Executive Summary

Three Thai is structurally better prepared for answer extraction than many B2B
manufacturer sites: important pages use clear headings, product/application
relationships, direct-answer boxes, test variables, qualification checklists,
and specific commercial next steps. The English and Chinese answer architecture
is especially easy to parse.

That is **readiness**, not evidence of visibility. No answer-engine citation
logs, prompt tracking, referral analytics, search-console AI features, or
reproducible platform observations were available. This audit therefore makes
no claim that ChatGPT, Gemini, Perplexity, Google AI Overviews, or another answer
engine currently surfaces or cites Three Thai.

The material risks are factual and evidentiary:

1. Production simultaneously says concrete PVA fiber is manufactured and not
   offered. The negative claim is also present in FAQ structured data.
2. Product pages publish exact temperature/specification rows without a
   version, method, grade identifier, tolerance, or downloadable product record;
   the same cross-product table appears on every product family.
3. Certificate evidence is strong but narrow. It does not substantiate the
   site's broader product, capacity, process, export, R&D, or performance claims.
4. Major company claims (capacity, spindles, export markets, current product
   availability, R&D and recognition) rely on legacy/company-record statements
   rather than retrievable claim-level evidence.
5. Eight locale trees present English deep content under localized URLs and
   localized chrome. A live German article remained English, had `html lang="en"`,
   and its Article entity pointed to the English URL.

Overall assessment:

- **Extractability:** ADEQUATE to STRONG in English and Chinese.
- **Entity clarity:** MODERATE; the legal/English/brand relationship is mostly
  understandable but not represented consistently at claim and schema level.
- **Authority / trust:** MODERATE on the Quality page, WEAK to MODERATE elsewhere.
- **Citation readiness:** MODERATE for narrowly scoped certificate facts; WEAK
  for product performance, technical guidance, manufacturing, application, and
  corporate claims.
- **Visibility:** UNKNOWN.

Finding count: **P0 0 · P1 5 · P2 7 · P3 1**.

## Scope

Included:

- current source for company, product, catalog, application, article, answer,
  manufacturing, quality, patent, localization, and structured-data models;
- the page templates that render product, application, article, answer, About,
  Manufacturing, and Quality content;
- all 4 product families, 5 application families, 4 knowledge articles, and 30
  buyer answers at source level;
- the six public PDFs in `public/documents/` and representative document renders;
- representative production pages and production HTML for English and German
  deep-content routes;
- the merged Task 10 Technical SEO report as existing specialist evidence;
- the committed and pushed Task 11 report only as a boundary/coverage cross-check.

Excluded:

- implementation, copy rewriting, schema changes, route changes, crawler-policy
  changes, new content, deployment, forms, and production mutation;
- a full technical SEO recrawl;
- competitor copying or inference of Three Thai capabilities from other firms;
- live answer-engine ranking tests as a proxy for stable visibility.

## Methodology

1. Read workspace and repository governance, execution policy, Task 12 card,
   operating model, master plan, and task instructions.
2. Created the dedicated Task 12 branch/worktree from current `origin/main`.
3. Enumerated and read the current information architecture and rendering
   templates, separating visible statements from comments and historical notes.
4. Mapped buyer questions to current answer owners and graded answer quality,
   evidence, and citation readiness qualitatively.
5. Inspected all six public PDFs by text extraction; visually checked the ISO,
   OEKO-TEX, TESTEX, Malta, and Nigeria evidence. The PDFs support only their
   stated holders, scopes, dates, samples, and registrations.
6. Checked representative production pages on 2026-09-03. The public homepage,
   yarn product, towel application, Quality, and About pages were retrievable.
   Direct HTTP checks confirmed the knowledge and answer routes exist but the
   unprefixed requests were redirected to `/zh/` by locale logic. With an
   explicit English locale cookie, the pages returned their expected content.
   A German knowledge route returned 200 but rendered English deep content.
7. Reused Task 10 runtime evidence for full-route schema/locale observations
   rather than repeating that audit.

No numerical GEO score is used. Grades in this report are an **INTERNAL AUDIT
HEURISTIC**, not an OpenAI, Google, Perplexity, Gemini, or industry metric.

## Evidence Model

- **SOURCE_CONFIRMED:** directly present in current repository source at the base SHA.
- **RUNTIME_CONFIRMED:** observed on the public site during this audit or in the
  merged Task 10 runtime record.
- **PUBLIC_SOURCE_CONFIRMED:** supported by a retrievable public document in the repository.
- **HISTORICAL:** legacy copy or a historical report; not proof of current state.
- **INFERRED:** reasoned from confirmed evidence but not directly measured.
- **HYPOTHESIS:** a future testable opportunity, not a fact.
- **UNKNOWN:** not verifiable from available evidence.

Business-claim states:

- **SUPPORTED:** the claim and its scope are supported by current evidence.
- **PARTIAL:** some elements are supported, but the published wording is broader.
- **CONTRADICTORY:** current sources disagree.
- **UNSUPPORTED:** no retrievable evidence was found.
- **OWNER_CONFIRMATION_REQUIRED:** confidential/current business evidence is needed.

## Limitations

- No AI-referral analytics, bot logs, Search Console/Bing data, prompt-monitoring
  dataset, or answer-engine citations were available.
- No confidential TDS, COA, batch record, calibration record, business license,
  shipment record, capacity record, customer reference, or audit report was available.
- The Chinese patent portfolio was inspected through current source and the
  repository dossier record; this audit did not independently query every CNIPA record.
- Production checks were representative, not a new full crawl. Task 10 remains
  authoritative for crawl, canonical, hreflang, robots, sitemap, and redirects.
- Technical statements were assessed for traceability and context, not laboratory truth.

## GEO Framework

### Extractability

Strengths:

- Buyer Answer pages state the question in H1 and place a concise direct answer
  immediately below it.
- Product pages separate overview, selection variables, temperature options,
  process guide, applications, evidence links, FAQs, and next action.
- Application pages use a consistent problem → process position → temporary role
  → variables → testing → next-step structure.
- Tables and lists make the temperature catalog, patents, certificate facts, and
  qualification inputs easy to isolate.

Weaknesses:

- Extractable text can be confidently wrong when facts conflict (concrete PVA).
- Exact catalog rows are not scoped to the product page on which they appear.
- Important statements such as “remove completely,” “wash out cleanly,” “same
  method,” and “batch-level QC” can be extracted without a method or evidence link.
- There is no clear foundational definition of PVA/polyvinyl alcohol or a clean
  answer to “what is water-soluble PVA yarn?” separated from company promotion.

### Entity Clarity

The site centrally identifies:

```text
山东荣沣纺织有限公司
  ↔ Shandong Three Thai Textile Co., Ltd. (English name on certificates)
  → Three Thai Textile / Three Thai (customer-facing short name)
  → threethai™ (product/brand mark)
```

The ISO and OEKO-TEX PDFs support the Chinese/English company-name pairing. The
site also identifies 山东惠民三泰纺织有限公司 / Shandong Huimin Santai Textile
Co., Ltd. as a separate related entity for joint patent ownership. However,
visible About copy sometimes calls the English certificate name an “overseas
brand,” while source governance calls it the official English legal name.
Structured data also creates unlinked inline Organization objects for product
manufacturer and article author rather than consistently referencing the stable
root Organization `@id`.

### Evidence / Trust

The Quality page is the strongest trust asset because it exposes certificate
numbers, scope, issuer, dates, and public PDFs. The ISO PDF supports production
of water-soluble PVA yarns and sales of water-soluble PVA fibers. The OEKO-TEX
certificate and TESTEX report support 100% raw-white water-soluble PVA yarn,
Product Class I, Annex 6, through 2027-01-31 and the tested samples/report scope.

Those documents do not by themselves prove all current grades, every product
family, every batch, every application, production volume, traceability process,
custom development, export markets, response times, or all corporate honors.
The site often moves from narrow proof to broad “every claim” language.

### Citation Readiness

Citation-ready content must preserve the answer, subject, conditions, scope,
date, and proof when extracted. The Quality page does this moderately well for
specific certificate facts. Elsewhere, answer clarity is usually higher than
evidence clarity. Technical articles and Buyer Answers have no claim-level
external references, no named technical reviewer, and no attached method or
revision record. Their “source transparency” block identifies the company team
but not the sources behind individual assertions.

### Visibility vs Readiness

Current visibility is **UNKNOWN**. A permissive robots policy, Article/FAQ schema,
clear headings, or an optional `llms.txt` file cannot establish citation or
ranking. No `llms.txt` exists; that absence is not treated as a ranking defect.

## Current Information Architecture

| Family | Current inventory | GEO role | Current readiness |
| --- | ---: | --- | --- |
| Homepage | 1 | Entity/category summary and proof gateway | MODERATE |
| Product index + detail | 1 + 4 | Product definition and selection | WEAK–MODERATE |
| Application index + detail | 1 + 5 | Process/application explanation | MODERATE |
| Knowledge index + detail | 1 + 4 | Technical education | MODERATE extractability, WEAK evidence |
| Buyer Answers index + detail | 1 + 30 | Direct buyer questions | STRONG format, WEAK–MODERATE depth/evidence |
| Manufacturing | 1 | Process/capability proof | WEAK–MODERATE |
| Quality | 1 | Certificate/test/patent evidence | MODERATE–STRONG for narrow claims |
| About | 1 | Entity, history, claims, recognition | MODERATE identity, WEAK evidence distribution |
| Finder / sample / quote / contact | 4 | Commercial next step | ADEQUATE |
| Localized deep content | ZH translated; 8 fallback locales | Non-English answer ownership | ZH ADEQUATE; other 8 WEAK |

## Entity Identity Audit

| Element | Evidence | Assessment |
| --- | --- | --- |
| Chinese company name | ISO Chinese PDF, source, footer, About | SUPPORTED |
| English company name | ISO English PDF and OEKO-TEX PDF | SUPPORTED |
| Unified Social Credit Code | ISO PDFs and About | SUPPORTED |
| Address | ISO PDFs and About | SUPPORTED, but English PDF renders “Zibocape” while site normalizes to “Zijiao” |
| Short brand “Three Thai Textile” | Site-controlled usage | SUPPORTED as site brand; legal status should not be inferred |
| `threethai™` | Site-controlled mark | SUPPORTED as claimed product mark; no trademark registration proof assessed |
| Related company | Repository dossier and joint patent statements | PARTIAL; relationship type/control is not documented for public extraction |
| External identity links (`sameAs`) | None in Organization schema | MISSING; add only after owner verifies authoritative profiles |

## Entity Consistency Findings

- The English name is document-supported, but “official English legal name” and
  “overseas brand” are used interchangeably. A buyer or model may treat these as
  different entity roles.
- Product schema uses an inline manufacturer named only in Chinese, while the
  stable Organization entity is named in English. Article author and publisher
  repeat the two names as separate inline organizations without shared `@id` links.
- The Nigeria patent certificate visibly names both Shandong Three Thai Textile
  Co., Ltd. and Shandong Huimin Three Thai Textile Co., Ltd.; the quality page
  does not expose that joint ownership nuance beside the foreign-patent card.
- No verified external corporate identifiers or `sameAs` relationships are
  published. This is a gap, not permission to invent links.

## AI / Buyer Question Set

Grades are qualitative. “Current owner” means the best current page, not proof
that it ranks or is cited.

| Question | Intent group | Buyer stage | Current answer owner | Answer quality | Evidence strength | Citation readiness | Gap / future action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| What is water-soluble PVA yarn? | DEFINITION | Discovery | `/products/water-soluble-pva-yarn` | ADEQUATE | WEAK | WEAK | Add a reviewed definition separating general material facts from Three Thai product facts. |
| What does PVA/polyvinyl alcohol mean in textiles? | DEFINITION | Discovery | None | MISSING | MISSING | MISSING | Future reviewed glossary/definition section with primary technical source. |
| What is the difference between PVA yarn and PVA sewing thread? | COMPARISON | Consideration | Two product pages | WEAK | WEAK | WEAK | Add an evidence-bounded comparison owned by an existing page, not a doorway URL. |
| Staple fiber or filament: which form fits my process? | PRODUCT_SELECTION | Consideration | `/knowledge/pva-staple-fiber-vs-filament-yarn` | STRONG | WEAK | MODERATE | Attach reviewed technical sources and Three Thai-specific availability evidence. |
| How should dissolution temperature be selected? | PRODUCT_SELECTION | Consideration | `/knowledge/pva-yarn-dissolution-temperature-guide` | STRONG | WEAK | MODERATE | Publish method, reviewer, and grade-specific evidence. |
| What do 20°C, 40°C, and 90°C labels actually mean? | TECHNICAL | Consideration | Temperature guide; `/answers/20c-vs-90c-pva-yarn-difference` | ADEQUATE | WEAK | WEAK | Define test conditions and distinguish target label from guaranteed result. |
| How is dissolution tested reproducibly? | TECHNICAL | Validation | `/answers/test-pva-yarn-dissolution-temperature` | STRONG | WEAK | MODERATE | Attach a controlled, versioned method and reviewer. |
| Why did PVA fail to remove completely? | TROUBLESHOOTING | Validation | Temperature guide/product FAQ | WEAK | WEAK | WEAK | Consolidate causes, diagnostics, caveats, and escalation inputs on the owning guide. |
| Why does PVA sewing thread break in production? | TROUBLESHOOTING | Validation | Sewing-thread FAQ | ADEQUATE | WEAK | WEAK | Add method-bounded diagnostic decision tree with no unsupported performance promises. |
| How is PVA used in zero-twist towels? | APPLICATION | Consideration | `/applications/towel-weaving` | STRONG | WEAK | MODERATE | Replace absolutes with scoped conditions and attach application evidence. |
| How is PVA used for embroidery or temporary seams? | APPLICATION | Consideration | `/applications/embroidery-sewing` | STRONG | WEAK | MODERATE | Link exact product form, method, limitations, and sample proof. |
| How should PVA be selected for knitting? | APPLICATION | Consideration | `/applications/knitting` | ADEQUATE | WEAK | WEAK | Clarify material-form choice and validated temperature/process boundaries. |
| How is PVA staple fiber evaluated for papermaking? | APPLICATION | Validation | `/applications/papermaking`; related answer | ADEQUATE | WEAK | WEAK | Add evidence for retained vs sacrificial uses and current grade availability. |
| Can Three Thai PVA be used in composites/technical textiles? | APPLICATION | Consideration | `/applications/technical-textiles` | ADEQUATE | UNSUPPORTED | WEAK | Treat as conditional until product/application evidence exists. |
| How should manufacturers be compared? | SUPPLIER_VALIDATION | Shortlist | `/answers/best-pva-water-soluble-yarn-manufacturers-china` | STRONG | MODERATE framework | MODERATE | Keep as method, avoid self-ranking; add source/reviewer accountability. |
| How can I verify that Three Thai is the manufacturer? | SUPPLIER_VALIDATION | Due diligence | `/manufacturing`; factory-verification answer | ADEQUATE | PARTIAL | WEAK | Provide current auditable entity/process evidence, not only photos and statements. |
| What documents should I request? | SUPPLIER_VALIDATION | Due diligence | `/answers/documents-request-pva-yarn-supplier` | ADEQUATE | MODERATE framework | MODERATE | Link available Three Thai documents and label missing/current-on-request items. |
| What exactly does the OEKO-TEX certificate cover? | QUALITY_VALIDATION | Due diligence | `/quality`; OEKO answer | STRONG | STRONG | STRONG | Preserve exact raw-white 100% PVA yarn scope and validity; avoid product-wide implication. |
| What does ISO 9001 prove about the offered products? | QUALITY_VALIDATION | Due diligence | `/quality`; ISO answer | ADEQUATE | STRONG certificate | MODERATE | State that ISO certifies the QMS scope, not product performance or every claimed capability. |
| How should batch consistency be checked? | QUALITY_VALIDATION | Validation | `/knowledge/pva-batch-dissolution-consistency` | STRONG | WEAK | MODERATE | Add versioned method, reviewer, acceptance-plan example, and proof boundary. |
| What is Three Thai's current product/specification range? | COMMERCIAL / BUYING | Shortlist | `/products` and product pages | WEAK | CONTRADICTORY/PARTIAL | WEAK | Owner-approved availability matrix and dated product fact sheets are required. |
| What is the MOQ and lead time? | COMMERCIAL / BUYING | Purchase | MOQ answer / inquiry | ADEQUATE for qualification | UNKNOWN | WEAK | Keep conditional; owner should define current policy or explicitly retain quote-only treatment. |
| What information is required for a sample? | PROCESS | Validation | `/request-sample`; specification checklist | STRONG | MODERATE process | MODERATE | Publish the actual current sample stages, traceability fields, and service boundaries. |
| Who is Three Thai, and what is its legal entity? | BRAND / COMPANY | Due diligence | `/about`; `/quality` | ADEQUATE | STRONG for names/address | MODERATE | Normalize legal-name/brand wording and related-company relationships. |
| What current capacity, markets, honors, and R&D evidence can be verified? | BRAND / COMPANY | Due diligence | `/about`; `/manufacturing` | WEAK | OWNER_CONFIRMATION_REQUIRED | WEAK | Create a dated evidence registry and expose only approved, retrievable proof. |

## Answer Extractability Audit

| Page family | Topic/question obvious | Answer early | Conditions/caveats | Stand-alone extraction | Grade |
| --- | --- | --- | --- | --- | --- |
| Buyer Answers | Yes | Yes, direct-answer box | Usually present | Usually good | STRONG |
| Knowledge articles | Yes | Intro first | Good method caveats | Good, but unsourced | ADEQUATE–STRONG |
| Product pages | Yes | Intro early | Good selection caveats | Cross-product catalog breaks context | ADEQUATE |
| Application pages | Yes | Summary early | Variables/testing present | Absolute benefit wording can lose caveats | ADEQUATE |
| Quality | Yes | Evidence summary early | Scope/date often explicit | Good for certificate facts | STRONG |
| Manufacturing | Yes | Capability first | Dated-source note low on page | Extracted figures lack proof context | WEAK–ADEQUATE |
| About | Yes | Entity statement early | Mixed | Many claims detach from evidence note | ADEQUATE |
| Eight fallback locales | Localized shell, English answer | English answer early | English caveats retained | Language identity is misleading | WEAK |

## Citation-Readiness Scorecard

Qualitative **INTERNAL AUDIT HEURISTIC**: STRONG means the page usually keeps
subject, scope, date, conditions, and retrievable proof together; MODERATE means
some are present; WEAK means clarity exists without proof/context; MISSING means
the dimension is absent.

| Page/entity family | Answer clarity | Entity clarity | Evidence strength | Technical specificity | Citation support | Accountability | Freshness | Structured consistency | Localization readiness | Overall |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage/company identity | STRONG | MODERATE | WEAK | MODERATE | WEAK | WEAK | WEAK | MODERATE | MODERATE | MODERATE |
| Core PVA yarn | STRONG | MODERATE | WEAK | MODERATE | WEAK | WEAK | MISSING | MODERATE | WEAK | WEAK–MODERATE |
| Sewing thread | STRONG | MODERATE | WEAK | MODERATE | MISSING | WEAK | MISSING | MODERATE | WEAK | WEAK |
| Staple fiber | STRONG | MODERATE | CONTRADICTORY/PARTIAL | MODERATE | WEAK | WEAK | MISSING | WEAK | WEAK | WEAK |
| Filament | STRONG | MODERATE | WEAK | MODERATE | MISSING | WEAK | MISSING | MODERATE | WEAK | WEAK |
| Major application pages | STRONG | MODERATE | WEAK | MODERATE | MISSING | MISSING | MISSING | WEAK | WEAK | WEAK–MODERATE |
| Knowledge articles | STRONG | MODERATE | WEAK | STRONG | MISSING | WEAK | MODERATE | MODERATE | WEAK | MODERATE |
| Buyer Answers | STRONG | MODERATE | WEAK | ADEQUATE | MISSING | WEAK | WEAK | MODERATE | WEAK | WEAK–MODERATE |
| Quality/evidence | STRONG | STRONG | STRONG for narrow scope | STRONG | STRONG | MODERATE | STRONG for current PDFs | MODERATE | MODERATE | MODERATE–STRONG |
| Manufacturing | ADEQUATE | MODERATE | WEAK | MODERATE | WEAK | MISSING | WEAK | MISSING | MODERATE | WEAK |
| About/company | ADEQUATE | MODERATE | WEAK–MODERATE | MODERATE | WEAK | WEAK | WEAK | MISSING | MODERATE | WEAK–MODERATE |

## Product Fact Readiness

| Product | Definition/form | Applications | Temperature/spec facts | Conditions/limitations | Quality/sample evidence | Assessment |
| --- | --- | --- | --- | --- | --- | --- |
| Water-soluble PVA yarn | ADEQUATE | STRONG | Exact rows but unversioned | STRONG caveats | ISO/OEKO/TESTEX narrow support | MODERATE |
| PVA sewing thread | ADEQUATE | STRONG | Mixed into shared catalog | ADEQUATE | No thread-specific public fact sheet/report | WEAK |
| PVA staple fiber | ADEQUATE | STRONG | Mixed into shared catalog | ADEQUATE | ISO covers sales, not production/performance; concrete contradiction | WEAK |
| PVA filament yarn | ADEQUATE | ADEQUATE | Mixed into shared catalog | ADEQUATE | No filament-specific public fact sheet/report | WEAK |
| Extended formats | Names only | MISSING | MISSING | MISSING | No current availability proof | OWNER_CONFIRMATION_REQUIRED |

Product fact sheets should be future evidence artifacts, not invented content.
Each needs an owner-approved product/grade identifier, status, construction,
units/tolerances, dissolution method and endpoint, process limits, storage and
packaging, applicable certificates, version/date, and approver.

## Application Fact Readiness

The five application pages answer the right process questions and are among the
site's best extractable content. They identify the problem, PVA position,
temporary role, selection variables, test conditions, related products, and
next action. Their weakness is evidentiary: no source, customer-approved case,
test record, or product-grade mapping supports the strongest statements.

“Removes completely,” “wash out cleanly,” “leaving only the cotton
construction,” “protecting final hand feel,” and technical-composite outcomes
must be conditional on grade, construction, method, endpoint, and actual trial.
No customer/case claims should be added without permission and proof.

## Comparison / Selection Readiness

Strong current comparison topics:

- staple fiber vs filament form;
- low- vs high-temperature selection principles;
- manufacturer, price, sample, and audit comparison frameworks.

Weak or missing comparison topics:

- PVA yarn vs PVA sewing thread;
- exact grade-to-grade comparisons using one documented method;
- product-scoped availability by temperature;
- processing limits, storage, packaging, and test acceptance ranges;
- Three Thai-specific evidence linking samples to current bulk grades.

The site should not publish comparative performance until equivalent methods and
approved data exist.

## Knowledge / Buyer Answer Readiness

- Four knowledge articles are well structured and method-conscious. They show
  visible publication/update dates and Article schema, but no named reviewer,
  bibliography, method version, or primary technical citation.
- All 30 Buyer Answers use direct-answer architecture. Only one has expanded
  decision content; 29 are short, usually one answer plus three sections and a
  checklist. This is useful for extraction but frequently too shallow for
  high-stakes supplier, technical, environmental, or quality questions.
- Answer Article dates are the same hardcoded dates for every answer and are not
  displayed in the answer body. The provenance of those dates is not recorded.
- “Prepared by the technical content team” establishes organizational
  accountability but does not identify a qualified reviewer or claim sources.
- “30 common sourcing questions” and “rankings and claims are verified” are not
  supported by query data or page-level verification records.

## Source / Citation Quality

| Claim class | Current source quality | Result |
| --- | --- | --- |
| ISO certificate facts | Public certificate PDF, number/scope/date shown | STRONG within scope |
| OEKO-TEX facts | Public certificate and supporting TESTEX report | STRONG within raw-white yarn/sample scope |
| TESTEX analytes/results | Full public report | STRONG for submitted samples; not all grades/batches |
| SGS yarn report | 2020 image/summary, no PDF | PARTIAL and historical |
| Foreign patents | Public PDFs | STRONG for registrations; Nigeria joint-holder nuance needed |
| Chinese patent count/ownership | Source dossier/list; public proof not complete in page assets | PARTIAL |
| General material/process guidance | No external citations | WEAK |
| Three Thai product specifications | Catalog claims without versioned product records | WEAK |
| Company/process/export/R&D claims | Company/legacy statements | OWNER_CONFIRMATION_REQUIRED |

## Authorship / Freshness / Accountability

- Knowledge pages show publication and modified dates and name the company as
  Article author in JSON-LD.
- Buyer Answers name the company technical content team in visible copy, but
  omit visible publication/update dates.
- No page identifies a named technical reviewer, qualifications, review scope,
  version, or source list.
- All four knowledge articles share one modified date; all 30 answers share one
  published and one modified date. Without an editorial record, these dates are
  not independently traceable.
- “Reviewed periodically” is not a freshness statement because it has no date,
  interval, accountable reviewer, or change history.

## Structured Data — GEO Perspective

Positive:

- Organization, WebSite, Product, Article, FAQPage, and BreadcrumbList entities exist.
- The stable Organization has a consistent `@id` and document-supported English name.
- Product and answer structured data broadly mirrors visible content in English.

Risks:

- The concrete-PVA contradiction is amplified through FAQPage structured data.
- Localized Product and Article objects use English entity URLs rather than the
  localized canonical; the live German Article schema confirmed an English
  `mainEntityOfPage`.
- Product manufacturer and Article author/publisher are inline Organization
  objects without the stable root Organization `@id`, weakening entity unification.
- Product schema contains name, description, image, brand, manufacturer, and URL
  but no evidence-bound technical properties. Do not add properties until facts
  and methods are approved.
- Organization `sameAs` is absent. That is safer than invented identity links;
  future additions require verified authoritative profiles.
- WebSite `inLanguage` lists English and Chinese while ten locale trees are public.

Implementation defects remain a TECHNICAL_SEO dependency; Task 12 does not fix them.

## Trust / Proof Architecture

Current strong path:

```text
ISO/OEKO/TESTEX claim
  → Quality page fact card
  → public PDF
  → certificate/report number, scope, issuer, date
```

Current weak path:

```text
product / application / manufacturing / company claim
  → generic Manufacturing or Quality page
  → document that often does not prove that exact claim
```

The future evidence architecture should connect each approved claim to a
specific evidence artifact, scope, owner, date, and review status. A certificate
must not become a general-purpose proof badge for unrelated capabilities.

## Localization GEO Findings

- Chinese deep content is translated and generally preserves the English caveats.
- Spanish, Portuguese, Russian, Arabic, Turkish, Vietnamese, Indonesian, and
  German use translated navigation/home/forms with English product, application,
  knowledge, and answer bodies.
- A live German knowledge route showed German chrome and English article text;
  the HTML document language was `en`, while the URL/canonical was German and
  the Article entity pointed to English.
- Some localized metadata and schema retain English suffixes, descriptions,
  questions, and breadcrumb names.
- These pages cannot be treated as citation-ready localized answers. Their
  meaningful answer language is English, even when the route implies otherwise.

Content-language strategy belongs to SEO_CONTENT; canonical/hreflang/schema
mechanics belong to TECHNICAL_SEO.

## Claim / Evidence Register

| Claim | Current evidence | Status | Evidence needed / constraint |
| --- | --- | --- | --- |
| 山东荣沣纺织有限公司 = Shandong Three Thai Textile Co., Ltd. | ISO and OEKO-TEX PDFs | SUPPORTED | Preserve exact certificate spelling and entity scope. |
| USCC and registered address | ISO PDFs | SUPPORTED | Keep document-linked. |
| ISO 9001 QMS through 2029-08-06 | ISO PDFs | SUPPORTED | Scope is production of water-soluble PVA yarns; sales of fibers. |
| OEKO-TEX Class I through 2027-01-31 | OEKO-TEX PDF | SUPPORTED | Only 100% raw-white water-soluble PVA yarn, Annex 6. |
| TESTEX report SH005 275198.1 passed listed tests | Full report | SUPPORTED | Applies to submitted raw PVA yarn samples; retain report limitations. |
| SGS quality result | 2020 image/summary | PARTIAL | Current PDF or issuer-verifiable report if still relied upon. |
| 34 granted Chinese patents | Dossier list in source | PARTIAL | Current register extracts and ownership/status mapping for public reliance. |
| Nigeria patent | Public certificate | PARTIAL | Show joint holder with Shandong Huimin Three Thai Textile Co., Ltd. |
| Malta patent 5964 | Public grant/register PDF | SUPPORTED | Keep registration/status/date scoped. |
| Manufacture of concrete PVA fiber | Homepage says yes; staple FAQ says no | CONTRADICTORY | Written owner decision and current catalog/production proof. |
| PVA cotton, PVA top, PPVA fiber, Gracell yarn availability | Extended-format statement only | OWNER_CONFIRMATION_REQUIRED | Current offering status, specification, production/sales role, sample status. |
| 20–90°C development and exact catalog rows | Legacy/company catalog | OWNER_CONFIRMATION_REQUIRED | Versioned grade list and dissolution method/endpoint. |
| 30,000 m², 120,000 spindles, 8,000+ t, 300+, 50+ | Dated legacy/company records | OWNER_CONFIRMATION_REQUIRED | Current dated facility/capacity records and responsible approver. |
| Integrated in-house process and named equipment | Photos and company statements | PARTIAL | Equipment register, process ownership/in-house vs outsourced map, audit evidence. |
| Batch-level QC, traceable samples, change control | Company statements | UNSUPPORTED | Current procedures, sample records, COA examples, change-control policy. |
| 15+ export markets and named regular destinations | Legacy/company statement | OWNER_CONFIRMATION_REQUIRED | Current dated shipment/market evidence; confidentiality review. |
| 27-person R&D team, university partnerships, honors, standard drafting | About copy | OWNER_CONFIRMATION_REQUIRED | Current official records, partner permission, program/status dates. |
| “Every claim backed by a document” | Narrow certificate/patent documents only | UNSUPPORTED | Replace future wording with claim-level evidence coverage. |
| Product/application performance and complete removal | General guidance/company statements | OWNER_CONFIRMATION_REQUIRED | Grade-specific method, results, conditions, sample identity, reviewer. |
| Biodegradability | Site correctly refuses to infer it from solubility | SUPPORTED as a caution | Any affirmative environmental claim needs exact method, grade, result, and scope. |

## Prioritized Findings Register

### GEO12-01

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Factual integrity / Product availability
- **Affected URL / Template / Entity / Cluster:** Homepage extended formats; PVA staple-fiber product/FAQ; all localized equivalents; FAQPage schema
- **Buyer / AI Question:** Does Three Thai currently manufacture or supply concrete PVA fiber?
- **Evidence:** `src/content/products.ts:251-262` says it is manufactured; `src/content/legacy-source.ts:76` says it is not offered; Task 10 runtime confirmed both statements and FAQ JSON-LD; production homepage displayed “Concrete PVA fiber.”
- **Evidence Label:** SOURCE_CONFIRMED, RUNTIME_CONFIRMED, CONTRADICTORY
- **Observation:** The same entity gives mutually exclusive current-offering answers.
- **Extractability Impact:** HIGH; both answers are short and easy to extract.
- **Trust / Authority Impact:** HIGH; a buyer cannot know which catalog is current.
- **Citation Readiness Impact:** HIGH; any citation may repeat a false branch.
- **Why It Matters:** Product availability is a purchase-critical fact and the contradiction is machine-readable.
- **Recommended Future Action:** Obtain a signed/current owner decision, then align every visible, localized, metadata, answer, and schema occurrence.
- **Evidence Required:** Current approved product catalog, manufacturing/sales role, sample availability, effective date, approver.
- **Suggested Owner:** SEO_CONTENT + GEO_AI_SEARCH; business fact owner required.
- **Suggested Follow-Up Task:** Resolve and propagate the concrete-PVA product fact.
- **Cross-Functional Dependency:** TECHNICAL_SEO for schema verification.
- **Risk / Caveat:** Do not choose either code path as truth without owner evidence.

### GEO12-02

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Evidence scope / Trust claims
- **Affected URL / Template / Entity / Cluster:** Homepage, Quality, product evidence blocks, all locales
- **Buyer / AI Question:** What does Three Thai's quality evidence actually prove?
- **Evidence:** ISO scope is yarn production/fiber sales; OEKO-TEX and TESTEX cover raw-white 100% PVA yarn/samples; site says “Evidence behind every claim” and “every claim backed by a document.”
- **Evidence Label:** PUBLIC_SOURCE_CONFIRMED, SOURCE_CONFIRMED, PARTIAL/UNSUPPORTED
- **Observation:** Narrow, high-quality evidence is generalized to unrelated product, process, performance, capacity, and company claims.
- **Extractability Impact:** MEDIUM; broad slogans can be extracted without scope.
- **Trust / Authority Impact:** HIGH; valid certificates may be misused as universal proof.
- **Citation Readiness Impact:** HIGH; citations need exact subject/scope/date.
- **Why It Matters:** Overgeneralization reduces the value of otherwise strong primary evidence.
- **Recommended Future Action:** Build claim-to-evidence mapping and scope every certificate reference.
- **Evidence Required:** Claim register with evidence ID, scope, date, owner, review status, and approved wording.
- **Suggested Owner:** GEO_AI_SEARCH + ORCHESTRATOR/business evidence owner.
- **Suggested Follow-Up Task:** Company and product evidence registry.
- **Cross-Functional Dependency:** SEO_CONTENT for copy; TECHNICAL_SEO for schema.
- **Risk / Caveat:** Certificate wording and issuer restrictions must be preserved.

### GEO12-03

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Product fact architecture
- **Affected URL / Template / Entity / Cluster:** All four product detail pages; product index/finder catalog
- **Buyer / AI Question:** Which current specification applies to this product and under what dissolution method?
- **Evidence:** `temperatureCatalog` publishes exact count/dtex/length rows; `ProductView` renders the same complete cross-product table on every product; no grade ID, version, tolerance, method, endpoint, or fact sheet is attached.
- **Evidence Label:** SOURCE_CONFIRMED, RUNTIME_CONFIRMED, OWNER_CONFIRMATION_REQUIRED
- **Observation:** Precise-looking facts are easy to extract but lack product-page scope and evidence context.
- **Extractability Impact:** HIGH; a filament or fiber row can be attributed to the wrong product page.
- **Trust / Authority Impact:** HIGH; buyers cannot verify currency or method.
- **Citation Readiness Impact:** HIGH; numbers without version/method are unsafe citations.
- **Why It Matters:** Product specification is central to supplier qualification and sample selection.
- **Recommended Future Action:** Create owner-approved product-scoped fact sheets and render only applicable rows.
- **Evidence Required:** Current grade catalog, TDS/COA fields, method, tolerances, version/date, approver.
- **Suggested Owner:** GEO_AI_SEARCH + SEO_CONTENT + business technical owner.
- **Suggested Follow-Up Task:** Versioned product fact-sheet and catalog-scope program.
- **Cross-Functional Dependency:** TECHNICAL_SEO for Product schema; CRO for Finder handoff.
- **Risk / Caveat:** No numeric field should be inferred from the current shared table.

### GEO12-04

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Company authority / Claim evidence
- **Affected URL / Template / Entity / Cluster:** Homepage, About, Manufacturing, footer, localized home/about/manufacturing
- **Buyer / AI Question:** What current manufacturing, export, R&D, recognition, and service claims can a buyer verify?
- **Evidence:** Current copy claims facility size, spindles, capacity, employees, specifications, markets/destinations, R&D headcount/partners, honors, standard participation, traceability, and change control; repository plan labels several as dated or requiring owner confirmation; no claim-level public records are linked.
- **Evidence Label:** SOURCE_CONFIRMED, HISTORICAL, OWNER_CONFIRMATION_REQUIRED
- **Observation:** High-value authority claims are grouped together but not evidence-addressable.
- **Extractability Impact:** HIGH; figures and named institutions are highly extractable.
- **Trust / Authority Impact:** HIGH; stale or unapproved claims can undermine entity credibility.
- **Citation Readiness Impact:** HIGH; no stable proof path exists.
- **Why It Matters:** These are the facts a B2B buyer and answer engine use to qualify a supplier.
- **Recommended Future Action:** Owner evidence review; retain, qualify, date, or remove each claim in a future scoped implementation.
- **Evidence Required:** Current official filings, records, permission where needed, dates, and accountable approver.
- **Suggested Owner:** ORCHESTRATOR/business owner + GEO_AI_SEARCH.
- **Suggested Follow-Up Task:** Corporate evidence and freshness architecture.
- **Cross-Functional Dependency:** BRAND_UX and SEO_CONTENT.
- **Risk / Caveat:** Do not publish confidential records or invent public proof.

### GEO12-05

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Multilingual GEO / Content identity
- **Affected URL / Template / Entity / Cluster:** `/es`, `/pt`, `/ru`, `/ar`, `/tr`, `/vi`, `/id`, `/de` deep product/application/knowledge/answer routes
- **Buyer / AI Question:** Is this a German/Spanish/etc. answer or an English answer at a localized URL?
- **Evidence:** `ContentLocale` supports only EN/ZH; eight locales fall back to English. A live German knowledge route returned English article content, `html lang="en"`, German URL/canonical, and an English Article `mainEntityOfPage`.
- **Evidence Label:** SOURCE_CONFIRMED, RUNTIME_CONFIRMED
- **Observation:** Locale URL/chrome and substantive answer language disagree.
- **Extractability Impact:** HIGH for non-English questions; extraction is English despite localized context.
- **Trust / Authority Impact:** MEDIUM–HIGH; users/models may misclassify language and market relevance.
- **Citation Readiness Impact:** HIGH; localized citations do not contain localized answers.
- **Why It Matters:** Language identity is part of answer context and citation usability.
- **Recommended Future Action:** Decide which locales merit true deep translation; otherwise stop representing fallback bodies as equivalent localized answers.
- **Evidence Required:** Locale priority/business policy, reviewed translations, terminology glossary, parity QA.
- **Suggested Owner:** SEO_CONTENT + TECHNICAL_SEO.
- **Suggested Follow-Up Task:** Localized GEO availability and translation-governance program.
- **Cross-Functional Dependency:** TECHNICAL_SEO canonical/hreflang/schema; BRAND_UX language UX.
- **Risk / Caveat:** Machine translation alone is not evidence review.

### GEO12-06

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Technical source quality
- **Affected URL / Template / Entity / Cluster:** Knowledge, Buyer Answers, applications, product technical overviews
- **Buyer / AI Question:** What sources support these general technical and process statements?
- **Evidence:** No external/primary source URLs appear in educational content; internal links point to other unsourced site pages.
- **Evidence Label:** SOURCE_CONFIRMED
- **Observation:** Clear advice lacks claim-level sources, methods, or literature boundaries.
- **Extractability Impact:** LOW; answers remain easy to extract.
- **Trust / Authority Impact:** MEDIUM–HIGH.
- **Citation Readiness Impact:** HIGH; the page asks to be cited without showing why.
- **Why It Matters:** General science, process guidance, and environmental boundaries require traceable authority distinct from company claims.
- **Recommended Future Action:** Add a reviewed source policy and claim-level references where appropriate.
- **Evidence Required:** Primary technical sources, standards where licensed/appropriate, reviewer sign-off.
- **Suggested Owner:** GEO_AI_SEARCH + SEO_CONTENT.
- **Suggested Follow-Up Task:** Technical sourcing and editorial evidence pass.
- **Cross-Functional Dependency:** None beyond content review.
- **Risk / Caveat:** Do not copy competitor wording or cite sources that do not support the exact claim.

### GEO12-07

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Authorship / Freshness / Accountability
- **Affected URL / Template / Entity / Cluster:** Four knowledge articles; 30 Buyer Answers; footer
- **Buyer / AI Question:** Who reviewed this answer, when, and against what evidence?
- **Evidence:** Articles show dates and organizational author; answers use identical hardcoded schema dates without visible dates; pages name a generic technical content team; no reviewer, qualifications, method version, bibliography, or change record exists.
- **Evidence Label:** SOURCE_CONFIRMED
- **Observation:** Organizational accountability exists but is not auditable at page level.
- **Extractability Impact:** LOW.
- **Trust / Authority Impact:** MEDIUM.
- **Citation Readiness Impact:** MEDIUM–HIGH.
- **Why It Matters:** Technical buyers need recency and responsibility, especially for specifications and compliance.
- **Recommended Future Action:** Establish author/reviewer/version/date governance before expanding content.
- **Evidence Required:** Named role or accountable team, review criteria, source list, revision record.
- **Suggested Owner:** SEO_CONTENT + GEO_AI_SEARCH.
- **Suggested Follow-Up Task:** Editorial accountability and freshness metadata.
- **Cross-Functional Dependency:** TECHNICAL_SEO for Article schema parity.
- **Risk / Caveat:** Do not invent expert biographies or retroactive dates.

### GEO12-08

- **Severity:** P2
- **Confidence:** MEDIUM–HIGH
- **Category:** Entity relationship consistency
- **Affected URL / Template / Entity / Cluster:** About, footer, Organization/Product/Article schema, patents
- **Buyer / AI Question:** Is Shandong Three Thai Textile a legal name, a brand, or a different company, and how is the related Santai entity connected?
- **Evidence:** Certificates support the English/Chinese name pair; visible copy also calls the English name an overseas brand; schema creates unlinked English- and Chinese-named Organization nodes; Nigeria patent has joint holders.
- **Evidence Label:** SOURCE_CONFIRMED, PUBLIC_SOURCE_CONFIRMED, INFERRED
- **Observation:** Identity components are individually present but their roles/relationships are not consistently modeled.
- **Extractability Impact:** MEDIUM.
- **Trust / Authority Impact:** MEDIUM.
- **Citation Readiness Impact:** MEDIUM.
- **Why It Matters:** Entity ambiguity can detach evidence from the entity it is meant to support.
- **Recommended Future Action:** Approve one entity taxonomy and map legal name, English name, short brand, product mark, related entity, and document holder.
- **Evidence Required:** Owner/legal confirmation and document mapping.
- **Suggested Owner:** BRAND_UX + GEO_AI_SEARCH + business owner.
- **Suggested Follow-Up Task:** Entity taxonomy normalization.
- **Cross-Functional Dependency:** TECHNICAL_SEO for stable `@id` reuse.
- **Risk / Caveat:** Do not imply ownership/control of the related company without proof.

### GEO12-09

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Buyer-question coverage
- **Affected URL / Template / Entity / Cluster:** Products, Knowledge, Buyer Answers
- **Buyer / AI Question:** What foundational and diagnostic questions remain unanswered?
- **Evidence:** No direct PVA definition, no yarn-vs-thread comparison, limited failure diagnostics, no product-scoped storage/handling/safety or current availability answer.
- **Evidence Label:** SOURCE_CONFIRMED
- **Observation:** The library is broad in supplier/commercial variants but misses foundational and troubleshooting ownership.
- **Extractability Impact:** MEDIUM; missing answers force inference across pages.
- **Trust / Authority Impact:** MEDIUM.
- **Citation Readiness Impact:** MEDIUM.
- **Why It Matters:** Buyers need definition → selection → validation → troubleshooting, not only supplier-query variants.
- **Recommended Future Action:** Consolidate/expand existing owners after evidence review; create a new URL only if intent is genuinely distinct.
- **Evidence Required:** Buyer/support questions, technical owner input, reviewed sources.
- **Suggested Owner:** SEO_CONTENT + GEO_AI_SEARCH.
- **Suggested Follow-Up Task:** Evidence-gated answer coverage and consolidation.
- **Cross-Functional Dependency:** CRO for post-answer next steps.
- **Risk / Caveat:** No search volume is claimed; validate demand before expansion.

### GEO12-10

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Application evidence / Absolute wording
- **Affected URL / Template / Entity / Cluster:** Five application pages and homepage application summaries
- **Buyer / AI Question:** Will the material remove cleanly and deliver the stated application outcome?
- **Evidence:** Pages use absolute outcomes while later sections advise process-specific trials; no grade/method/result/case is attached.
- **Evidence Label:** SOURCE_CONFIRMED, UNSUPPORTED/OWNER_CONFIRMATION_REQUIRED
- **Observation:** The strongest sentence is more absolute than the page's own caveats.
- **Extractability Impact:** HIGH; summaries are likely isolated from testing sections.
- **Trust / Authority Impact:** MEDIUM.
- **Citation Readiness Impact:** MEDIUM–HIGH.
- **Why It Matters:** Application suitability depends on construction, chemistry, temperature, time, agitation, and endpoint.
- **Recommended Future Action:** Future copy must keep conditional scope in the answer block and link applicable product evidence.
- **Evidence Required:** Grade-specific trial data or carefully bounded general sources.
- **Suggested Owner:** SEO_CONTENT + GEO_AI_SEARCH + technical owner.
- **Suggested Follow-Up Task:** Application claim and evidence alignment.
- **Cross-Functional Dependency:** None for audit; CRO may use the resulting qualification inputs.
- **Risk / Caveat:** Do not invent case studies or imply guaranteed results.

### GEO12-11

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Knowledge graph / Supporting relationships
- **Affected URL / Template / Entity / Cluster:** Product related resources, applications, knowledge, answers, quality
- **Buyer / AI Question:** Which evidence and guidance support this exact product/application claim?
- **Evidence:** Every product page links the first two articles regardless of product; applications link only a generic Knowledge index; most answer pages link one product but not the exact supporting evidence; certificates are not mapped to applicable products/grades.
- **Evidence Label:** SOURCE_CONFIRMED
- **Observation:** Relationships exist, but are generic rather than claim-specific.
- **Extractability Impact:** MEDIUM.
- **Trust / Authority Impact:** MEDIUM.
- **Citation Readiness Impact:** MEDIUM.
- **Why It Matters:** A citation-ready source needs a navigable proof chain, not just topical adjacency.
- **Recommended Future Action:** Define evidence-backed Product → Property → Application → Method → Evidence → Next-step relationships.
- **Evidence Required:** Approved claim/evidence registry and content ownership map.
- **Suggested Owner:** GEO_AI_SEARCH + SEO_CONTENT.
- **Suggested Follow-Up Task:** Evidence-aware related-content mapping.
- **Cross-Functional Dependency:** TECHNICAL_SEO if encoded in structured data.
- **Risk / Caveat:** Relationships must not imply a certificate covers an unlisted product.

### GEO12-12

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Structured data / Localized entity coherence
- **Affected URL / Template / Entity / Cluster:** Localized Product and Article pages; Organization relationships
- **Buyer / AI Question:** Does structured data identify the same localized page and organization visible to the user?
- **Evidence:** Task 10 and live German HTML confirm localized Article/Product URL mismatch; inline author/manufacturer entities do not reuse the stable Organization `@id`; WebSite language list and public locale trees disagree.
- **Evidence Label:** SOURCE_CONFIRMED, RUNTIME_CONFIRMED
- **Observation:** Schema reinforces content types but not a single consistent localized entity graph.
- **Extractability Impact:** LOW–MEDIUM.
- **Trust / Authority Impact:** MEDIUM.
- **Citation Readiness Impact:** MEDIUM.
- **Why It Matters:** Conflicting entity URLs and language context complicate source identity.
- **Recommended Future Action:** After locale and entity decisions, make IDs, URLs, language, visible facts, and evidence scope consistent.
- **Evidence Required:** Approved locale availability and entity taxonomy.
- **Suggested Owner:** TECHNICAL_SEO + GEO_AI_SEARCH.
- **Suggested Follow-Up Task:** Locale-aware, evidence-consistent entity graph.
- **Cross-Functional Dependency:** Task 10 follow-ups for canonical/hreflang/schema.
- **Risk / Caveat:** Do not add unverified `sameAs`, Offers, ratings, reviews, or technical properties.

### GEO12-13

- **Severity:** P3
- **Confidence:** HIGH
- **Category:** Visibility evidence / Crawler policy
- **Affected URL / Template / Entity / Cluster:** `robots.txt`, absent `llms.txt`, analytics/log evidence
- **Buyer / AI Question:** Are answer engines actually discovering and citing the site?
- **Evidence:** Production `robots.txt` returned 200 and allows named AI crawlers; `/llms.txt` returned 404; no bot logs, AI referrals, or citation observations were available.
- **Evidence Label:** RUNTIME_CONFIRMED, UNKNOWN
- **Observation:** Access policy is permissive, but discovery/citation is unmeasured. `llms.txt` absence proves nothing about visibility.
- **Extractability Impact:** NONE.
- **Trust / Authority Impact:** NONE.
- **Citation Readiness Impact:** NONE directly.
- **Why It Matters:** Readiness must not be reported as visibility.
- **Recommended Future Action:** If business-relevant, define a privacy-safe measurement plan using logs/referrals and dated observational tests; do not add `llms.txt` as a presumed ranking fix.
- **Evidence Required:** Bot user-agent logs, referral analytics, exact dated prompts/platforms/results.
- **Suggested Owner:** QA_PERFORMANCE + TECHNICAL_SEO + ORCHESTRATOR.
- **Suggested Follow-Up Task:** AI discovery/citation measurement baseline.
- **Cross-Functional Dependency:** Privacy/analytics decision.
- **Risk / Caveat:** One-time prompts are observations, not stable rankings.

## Proposed Follow-Up Tasks

These are proposals only. No Task Cards were created.

| Outcome | Reason | Suggested role | Dependencies | Likely scope | Evidence requirement | Risk | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Resolve concrete-PVA and extended-format availability | Current contradiction blocks reliable answers | SEO_CONTENT + GEO_AI_SEARCH | Business owner decision | Current offering matrix; propagate approved fact | Signed/date-stamped catalog and sample status | High factual | P1 |
| Build a claim/evidence registry | Narrow certificates are overgeneralized | GEO_AI_SEARCH + ORCHESTRATOR | Owner evidence package | Claim IDs, scope, artifact, owner, date, status | Public/confidential handling rules | Medium | P1 |
| Publish versioned product fact sheets | Exact specs lack method/scope/version | GEO_AI_SEARCH + SEO_CONTENT | Current product data | Four core products first | TDS/COA fields, method, approver | High factual | P1 |
| Normalize entity taxonomy | Legal/English/brand/related roles vary | BRAND_UX + GEO_AI_SEARCH | Owner/legal confirmation | Visible copy and entity map | Certificate and relationship evidence | Medium | P1 |
| Technical sourcing/editorial governance | Educational content lacks sources/reviewer | SEO_CONTENT + GEO_AI_SEARCH | Reviewer assignment | Four articles + priority answers | Primary sources, review log, dates | Medium | P1 |
| Evidence-gated answer consolidation/expansion | Foundational/diagnostic gaps; 29 short answers | SEO_CONTENT | Claim registry and demand validation | Expand owners, merge overlaps, avoid new doorway pages | Buyer/support evidence; no invented volume | Medium | P2 |
| Localized GEO readiness policy | Eight locales are English fallback | SEO_CONTENT + TECHNICAL_SEO | Locale indexing/business decision | Priority locales, glossary, translation/review QA | Human-reviewed translation and parity checks | High search | P1 |
| Evidence-aware relationship and schema mapping | Current links/entities are generic | GEO_AI_SEARCH + TECHNICAL_SEO | Claim registry, entity and locale decisions | Product/application/method/evidence graph | Exact scope and stable IDs | High semantic | P2 |
| AI discovery/citation measurement baseline | Visibility is unknown | QA_PERFORMANCE + TECHNICAL_SEO | Privacy/analytics authorization | Logs, referrals, limited dated observations | Reproducible methods and limitations | Medium | P3 |

## Cross-Functional Coordination

### TECHNICAL_SEO

- Own localized Product/Article URLs, `inLanguage`, stable Organization links,
  concrete-PVA FAQ schema propagation, and locale/canonical/hreflang fixes.
- Retain Task 10 ownership of crawler, sitemap, redirects, and DNS.

### SEO_CONTENT

- Own answer consolidation, intent boundaries, foundational/troubleshooting
  coverage, source integration, and translation priorities.
- Task 11 is in REVIEW and is a suitable independent reviewer for this report.

### CRO

- Use the evidence-approved sample/specification fields to preserve question
  context into quote/sample flows. Do not promise current MOQ, lead time, or
  response SLA without owner policy.

### BRAND_UX

- Own the visible legal-name/English-name/short-brand/product-mark hierarchy and
  presentation of related entities and proof scope.

### QA_PERFORMANCE

- If authorized, own repeatable bot/referral measurement, multilingual rendered
  parity checks, and verification that evidence links remain retrievable.

## Unknowns / Owner Data Requirements

- Current product availability for concrete PVA fiber and all extended formats.
- Current approved grade/specification matrix and dissolution methods.
- Current facility, capacity, spindle, employee, and specification counts.
- Current export markets and wording permitted for public disclosure.
- Actual batch QC, sample traceability, change-control, COA, and test procedures.
- Current R&D headcount, partnerships, recognitions, standard-project status,
  permissions, and supporting records.
- Current MOQ, lead-time, sample, and service-response policies.
- Approved legal/brand/related-company relationship wording.
- Qualified technical/content reviewer and editorial revision process.
- Priority locales and whether fallback deep routes should remain indexable.
- Any AI crawler logs, answer-engine referrals, or dated citation observations.

## Methodology Limitations

This report assesses whether content can be understood, extracted, trusted,
contextualized, and cited from available evidence. It does not estimate ranking,
traffic, prompt share, AI impressions, or citation frequency. Qualitative grades
are internal prioritization aids. Public documents were read for their actual
scope; no confidential company fact was inferred from adjacent evidence.

## Conclusion

Three Thai already has a useful answer-first foundation. The next GEO gain is
not more generic pages or an experimental crawler file; it is tighter truth
governance. Resolve contradictory availability, attach product and application
claims to scoped evidence, normalize the entity model, add accountable technical
review, and decide which languages genuinely own translated answers. Until then,
the site is often easy to quote but not consistently safe to cite.
