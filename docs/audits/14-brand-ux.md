# Task 14 — Brand, UX, and Information Architecture Audit

## Executive diagnosis

The site has a credible differentiated core: an in-house, evidence-led specialist
matching traceable water-soluble PVA materials to the buyer's actual removal
process. This is stronger than generic exporter positioning.

The clearest unifying idea is:

> Process-matched, traceable PVA materials—not generic temperature labels.

The story is currently spread across the legal entity, customer-facing brand,
and product mark. Their relationship is accurate in the central content model but
repeated inconsistently across home, About, header/footer, and proof surfaces.

## Recommended message hierarchy

1. What: PVA yarn, sewing thread, staple fiber, and filament for industrial use.
2. Why: temporary production function matched to removal conditions.
3. Proof: in-house process, written specification, traceable sample, scoped evidence.
4. Next step: buyer supplies application, material form/spec, removal conditions,
   and acceptance criteria for a matched sample path.
5. Identity: Three Thai Textile as the buyer-facing identity of the certified
   legal entity, with evidence on Quality.

## What works

- Coherent navy, amber, and warm-paper industrial design tokens.
- Logical home flow from products through applications, proof, guidance, and CTA.
- Product/application templates frame the buyer's process and test decisions.
- Quality content is unusually disciplined about certificate scope and dates.
- Manufacturing uses a specific process sequence and factory imagery.
- Strong language patterns include “traceable samples,” “written specification,”
  “actual process,” and “temperature label is a starting point.”

## Priority findings

### P1

1. Home application links and Finder result links leak non-English users back to
   English-root routes.
2. Brand/entity/product-mark usage needs one approved taxonomy.
3. Dated factory statistics, export footprint, R&D/recognition claims, and service
   promises need owner reconfirmation, date/source attribution, or narrower copy.
4. OEKO-TEX scope must remain explicit wherever the badge or claim is reused.

### P2

- Navigation has seven peer destinations plus a quote action. A buyer-first
  grouping may improve information scent, but requires rendered validation.
- Desktop emphasizes quote while mobile also exposes sample, conflicting with
  the site's sample-first risk-reduction story.
- The hero is category-first while the differentiated process-matching value is
  buried in supporting copy.
- Long product pages lack a local jump-to-specs/applications/sample utility.
- Application indexes derive visible product names from slugs.
- Finder recommendation reasons remain English in localized UI.
- Quote-page Finder panel is not linked.
- Quality evidence should be grouped by current certification/test, historical
  evidence, and patent evidence.
- Non-English deep-content fallback should be disclosed explicitly if retained.
- Privacy and retention promises require an approved operational policy.

### P3

- Knowledge and Buyer Answers could form one clearer technical-resource hub.
- Repeated product-template reassurance may overshadow product-specific content.
- RTL arrows, spacing, hero crop, contrast, focus, and motion require browser QA.

## Page-type summary

| Surface | Direction |
| --- | --- |
| Home | Bring process-matched/controlled-removal value closer to the main proposition |
| Products | Emphasize product-specific variables and promote the temperature caveat |
| Applications | Retain problem → material role → removal/testing structure |
| Finder | Keep the honest qualification-tool positioning; preserve locale and context |
| About/Manufacturing | Attach proof/date/scope or narrow current-looking legacy claims |
| Quality | Make it the canonical proof destination; group evidence clearly |
| Knowledge/Answers | Present as technical buyer guidance with evidence and review ownership |
| Quote/Sample | Make Finder actionable and align sample-first message hierarchy |

## Copy guidance

Retain operationally credible phrases. Revise broad lines such as “right format
for every process” and avoid unqualified “every claim is backed by a document.”
Use “in-house PVA production and sample validation for your process” as a more
positive alternative to “not a trading catalog.”

Substantiate or narrow factory scale, capacity, employee count, specification
count, export markets, research relationships, R&D headcount, honors, standard
drafting, response SLA, sample logistics, and batch-control promises.

## Prioritized work

1. Fix locale leakage in application and finder paths.
2. Approve and implement a brand/entity naming taxonomy.
3. Reconfirm or qualify high-visibility claims.
4. Centralize certificate-scope language.
5. Test a buyer-first navigation and desktop sample action.
6. Add product-detail jump links and contextual CTAs.
7. Link Finder from quote pages and use buyer-facing product labels.
8. Group Quality evidence and disclose fallback-language behavior.
9. Run responsive, focus, contrast, motion, crop, and RTL visual validation.

Shared-file requests cover `src/content/company.ts`, header, footer, and global
theme primitives. All appearance conclusions remain source-only until browser QA.
