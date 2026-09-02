# Page and Search-Intent Ownership

This map assigns one primary URL to each major buyer intent. Supporting pages
must add a distinct decision, evidence, procedure, or conversion role rather than
repeat the primary page with different keyword wording.

No search volume, ranking, traffic, or competitor data is asserted here.

## Product and category intent

| Intent cluster | Primary URL | Supporting URLs | Boundary |
| --- | --- | --- | --- |
| Water-soluble PVA product category | `/products` | Product details, Finder | Category selection only; details own material-form terms |
| Water-soluble PVA yarn | `/products/water-soluble-pva-yarn` | Manufacturing, Quality, temperature guide, supplier-comparison answer | Product capability and specification, not supplier rankings |
| PVA sewing thread | `/products/water-soluble-pva-sewing-thread` | Embroidery/sewing application, OEM answer | Thread format and stitched-process fit |
| PVA staple fiber | `/products/pva-staple-fiber` | Papermaking and nonwoven answers | Short-cut fiber specification and dispersion routes |
| PVA filament yarn | `/products/pva-filament-yarn` | Technical-textiles application, export answer | Continuous-filament specification and process fit |

Extended formats remain inquiry-only until the owner confirms current offering,
specifications, and evidence. Concrete PVA fiber is specifically blocked by a
current content contradiction.

## Application intent

| Intent cluster | Primary URL | Supporting role |
| --- | --- | --- |
| Zero-twist towel/weaving | `/applications/towel-weaving` | Product and answer pages explain grade/sample decisions |
| Embroidery and sewing | `/applications/embroidery-sewing` | Thread/yarn products and OEM answer support procurement |
| Knitting | `/applications/knitting` | Yarn/fiber pages support form selection |
| Papermaking | `/applications/papermaking` | Staple-fiber product and supplier answer support specification |
| Technical textiles | `/applications/technical-textiles` | Filament/fiber products support material-form decisions |

Application pages own the process category. Buyer answers must address one
specific qualification, validation, or purchasing question.

## Technical education intent

| Intent cluster | Primary URL | Supporting URLs | Differentiation |
| --- | --- | --- | --- |
| Dissolution-temperature selection | `/knowledge/pva-yarn-dissolution-temperature-guide` | 20°C-vs-90°C, testing, and 20°C procurement answers | Guide owns the broad model; answers own choice, method, or procurement |
| Dissolution test procedure | `/answers/test-pva-yarn-dissolution-temperature` | Temperature guide, Quality | Step-by-step validation, not broad selection |
| Batch consistency | `/knowledge/pva-batch-dissolution-consistency` | Factory-audit and Quality pages | Sampling, comparison, acceptance, and records |
| Staple fiber vs filament | `/knowledge/pva-staple-fiber-vs-filament-yarn` | Buyer-decision answer, product pages | Comprehensive comparison; answer must be scenario-specific |
| Buyer specification checklist | `/knowledge/pva-yarn-buyer-specification-checklist` | Quote, sample, Finder | Pre-inquiry requirements and acceptance criteria |
| Solubility vs biodegradability | `/answers/biodegradable-water-soluble-thread-fashion` | Future reviewed glossary/content | Evidence-led boundary; no unsupported environmental claim |

## Supplier, evidence, and commercial intent

| Intent cluster | Primary URL | Supporting URLs | Boundary |
| --- | --- | --- | --- |
| Manufacturer comparison | `/answers/best-pva-water-soluble-yarn-manufacturers-china` | Manufacturing, Quality, audit and document answers | Evidence-based comparison method, not “best supplier” self-ranking |
| Factory verification | `/answers/verify-chinese-pva-yarn-factory` | Manufacturing, Contact | Legal/factory verification steps |
| Factory audit | `/answers/factory-audit-checklist-water-soluble-yarn-mill` | Manufacturing, Quality | Operational checklist |
| Documents to request | `/answers/documents-request-pva-yarn-supplier` | Quality, Quote | Document/evidence checklist |
| Certification proof | `/quality` | OEKO-TEX and ISO answers | Quality owns current document facts and scope |
| Price variables | `/answers/40s-pva-water-soluble-yarn-price-per-kg` | Quote | Inputs and quote qualification; no invented public price |
| MOQ | `/answers/minimum-order-quantity-pva-water-soluble-thread` | Sample, Quote | Sample/pilot/production stages; no invented fixed MOQ |
| Sample process | `/request-sample` | Product/application/resource CTAs | Sample conversion and expectation setting |
| Quote process | `/request-quote` | Finder, product/application CTAs | Commercial conversion and technical brief |
| Product selection | `/product-finder` | Products, applications | Guided qualification, never an engineering calculator |

## Conversion and trust routes

| Route | Primary job |
| --- | --- |
| `/` | Introduce category, process-matched value, proof, and next action |
| `/manufacturing` | Demonstrate in-house process and auditable factory evidence |
| `/quality` | Canonical source for certificate, test, patent, scope, and date evidence |
| `/about` | Explain brand/legal identity and verified operating context |
| `/contact` | Low-friction direct contact and factory-audit fallback |
| `/request-quote` | Capture qualified commercial/technical inquiry |
| `/request-sample` | Capture process-validation sample request |
| `/product-finder` | Preserve buyer context into sample/quote handoff |

## Consolidation rules

1. Product pages own material-form commercial terms.
2. Application pages own process/application category terms.
3. Knowledge pages own comprehensive technical explanations.
4. Buyer answers own a single explicit buyer question and link back to the
   relevant primary page.
5. Quality owns certificate facts; other pages cite its scoped evidence.
6. Price, MOQ, lead time, and availability remain qualified inquiry topics until
   the owner supplies current policy.
7. New URLs require distinct intent, approved evidence, and an internal-link role.

## Dependencies

- D1 locale-indexing decision controls which localized equivalents can claim the
  same intent and appear in hreflang.
- D2 product/evidence confirmation controls extended formats, catalog ranges, and
  high-visibility claims.
- Evidence registry and technical reviewer assignment are prerequisites for
  expanding the priority buyer answers.
