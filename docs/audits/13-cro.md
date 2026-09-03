# Task 13 — CRO Audit

## Executive Summary

Three Thai has a credible B2B conversion foundation. Its strongest journey is
product detail → technical validation → sample or quote: product and application
pages explain the temporary function, selection variables, test expectations,
manufacturing/quality evidence, and carry product or application context into
the relevant inquiry form. The quality page provides concrete document numbers,
scopes, dates, downloads, and verification instructions; the contact page exposes
the legal entity and multiple direct channels.

Five material risks prevent the full international journey from being reliable:

1. the site simultaneously says concrete PVA fiber is manufactured and is not
   currently offered;
2. eight locale trees mix localized navigation/forms with English deep content,
   and some homepage application links leave the chosen locale;
3. Product Finder asks four questions but its recommendation uses only material
   form and application, not temperature or specification status;
4. a stored inquiry can show buyer-visible success while sales notification is
   skipped or fails asynchronously; and
5. every non-Chinese localized inquiry is stored and emailed with locale `en`,
   removing the actual language context from operations and measurement.

No P0 failure and no root-English funnel blocker were confirmed. No form was
submitted, no message/email was sent, no production data was changed, and no
conversion rate or buyer-behavior metric is asserted.

**Finding count:** P0 0 · P1 5 · P2 7 · P3 1.

## Scope

Included: homepage; product, application, knowledge, Buyer Answer, About,
Manufacturing, Quality, Product Finder, Contact, quote, and sample routes; English
plus representative German runtime journeys; source review of Chinese and the
eight fallback locales; CTA hierarchy, message continuity, qualification,
non-submitting form behavior, trust, failure-state source logic, localization,
and funnel observability. Task 10 was used only for CRO implications.

Excluded: form submission, external messages, email/CRM/database mutation,
production error injection, cookie/storage inspection, implementation, legal
conclusions, a full SEO/GEO/content audit, and full responsive/accessibility or
performance testing.

## Methodology

1. Read workspace and repository governance, Task 13, execution policy, operating
   model, existing audit baseline, and the committed Task 10 report.
2. Mapped route families and CTA destinations from current source at base
   `9ff03a94fdc0bfb39557953beb76d06c6adfca9d`.
3. Inspected the inquiry form, Product Finder, server action, dictionaries,
   locale helper/proxy, and trust content without changing them.
4. Observed production read-only. The browser session resolved the unprefixed
   homepage to `/de`; explicit German homepage, product, application, Buyer
   Answer, Product Finder, and quote routes were inspected. No form data was
   entered. Read-only HTTP/public search evidence supplemented browser evidence.
5. Compared current source with the historical report so resolved defects were
   not reported as current.

Representative public URLs included `https://www.threethai.com/de`,
`/de/products/water-soluble-pva-yarn`, `/de/applications/towel-weaving`,
`/de/answers/20c-vs-90c-pva-yarn-difference`, `/de/product-finder`,
`/de/request-quote`, `/quality`, and `/products/pva-staple-fiber`.

## Evidence Model

| Label | Meaning |
| --- | --- |
| `SOURCE_CONFIRMED` | Directly observable in current repository source. |
| `RUNTIME_CONFIRMED` | Directly observed in rendered production. |
| `PUBLIC_SOURCE_CONFIRMED` | Confirmed by public content or a committed specialist report with reproducible evidence. |
| `INFERRED` | CRO implication of confirmed behavior, not measured behavior. |
| `HYPOTHESIS` | Testable explanation/opportunity requiring data. |
| `UNKNOWN` | Evidence unavailable. |
| `UNVERIFIED_RUNTIME_RISK` | Source permits a failure not deliberately triggered in production. |

Business-fact labels used below are `VERIFIED_IN_CURRENT_EVIDENCE`,
`CONTRADICTORY`, `UNSUPPORTED`, and `NEEDS_OWNER_CONFIRMATION`.

## Limitations

- No analytics, CRM report, sales inbox, inquiry records, session replay,
  interview, or experiment result was available.
- Finder entry state was runtime-observed; later states were source-verified after
  browser interaction timed out. No external action occurred.
- Browser locale state was not inspected or cleared. The observed redirect to
  `/de` proves request-state adaptation, not a universal first-visit result.
- Mobile consequences are source-based. Full viewport, keyboard, screen-reader,
  and performance validation belongs to `QA_PERFORMANCE`.
- Competitor research was not needed to establish the site-specific findings.

## Current Conversion Architecture

```text
Discovery / homepage
  ├─ Products ──> product detail ──> sample | quote
  ├─ Applications ──> application detail ──> product | sample | quote | contact
  ├─ Knowledge / Buyer Answers ──> product ──> sample | contact
  ├─ About / Manufacturing / Quality ──> trust ──> quote | sample | contact
  ├─ Product Finder ──> suggested family ──> quote | sample | product
  └─ Direct quote / sample / contact forms
```

Healthy foundations:

- product/application templates carry `product` or `application` into forms;
- Finder now carries locale, product, application, temperature, and
  specification-status tokens into localized quote/sample routes;
- forms use distinct `quote`, `sample`, and `contact` kinds;
- success returns a reference, and persistence failure provides email fallback;
- header/footer keep commercial paths and direct contact discoverable.

Material gaps: educational routes discard topic context; Finder questions and
decision logic are misaligned; origin/Finder/campaign attribution is absent;
eight inquiry locales collapse to `en`; notification delivery is outside the
buyer-visible success contract.

## Buyer Personas / Intent Context

| Persona | Primary question | Needed support | Best current path |
| --- | --- | --- | --- |
| Product-aware technical buyer | Is this form/count/dissolution profile suitable? | product detail, variables, evidence, sample | Product → Sample |
| Process/application engineer | How can PVA support then leave my process? | problem/function explanation, mapping, trial method | Application → Sample |
| Procurement qualification | Is this supplier legitimate and documentable? | entity, scope, certificates, factory, controls | Quality/Manufacturing → Contact/Quote |
| Question-led buyer | What conditions matter before I ask? | direct answer, product relevance, evidence | Answer/Knowledge → Product → Sample |
| Unsure buyer | Which product family should I discuss? | guided triage, uncertainty, expert handoff | Finder → Technical inquiry |
| Commercial buyer | What produces a comparable quote? | count/construction, quantity, packing, destination, Incoterm | Quote form |

## Buyer Journey Maps

| Journey | Entry / intent | Key pages and trust checkpoints | Decision / primary CTA | Observed friction | Missing information | Future action |
| --- | --- | --- | --- | --- | --- | --- |
| A. Known PVA yarn | search/product; validate known family | product → quality/manufacturing | profile/application; Sample | “Need this grade sampled?” links to quote | current grade/TDS/tolerances | fix CTA semantics; publish approved evidence |
| B. Application problem | application; solve process need | application → product → test framing | form/acceptance; Sample | fallback locales switch to English | trial evidence/approved ranges | preserve locale; add verified evidence |
| C. Technical question | answer/knowledge; reduce uncertainty | article/answer → product | relevance; Sample | topic/product context is lost | source/topic attribution | controlled contextual handoff |
| D. Supplier credibility | company/quality; qualify supplier | About → Quality/Manufacturing | evidence sufficient? Contact/Quote | product claim contradiction | claim registry/refresh dates | resolve owner facts |
| E. Unsure product | Finder; receive direction | four questions → family/result | answer choices; Technical inquiry | temperature/spec do not shape result | validated decision model | technical review of logic/uncertainty |
| F. Ready to quote | quote; submit usable brief | quote form → reference | required detail; Submit Quote | “complete spec” versus optional fields | minimum usable lead | approve qualification contract |
| G. Ready to sample | product/application/sample | sample form → reference | eligibility/logistics; Submit Sample | localized page lacks English process explanation | cost/quantity/timing/shipping | publish approved sample policy/parity |

## Entry-Point Assessment

| Entry point | Audience / message | Primary / secondary CTA | Trust/technical support | Continuity risk |
| --- | --- | --- | --- | --- |
| Homepage | broad discovery; specialist PVA manufacturer | Quote / Products; lower Quote / Sample | factory, quality, knowledge summaries | early quote for some stages; locale-losing application cards |
| Products index | category-aware; select by family/temperature | Product / quote by temperature | catalog and caveat | extended forms go generic; claim contradiction |
| Product detail | technical evaluation | Sample / Quote | strongest decision/evidence path | one misleading mid-page CTA |
| Application detail | process engineer | Sample / Quote; lower Sample / Contact | problem, role, variables, testing | fallback language; generic contact loses context |
| Knowledge/Answers | technical education | Sample / Contact; related products | cautious guidance/source panel | direct CTA discards topic/product |
| About/Manufacturing | supplier qualification | Quote/Contact; Contact/Quality | entity, history, process, scale | high-value claims need owner evidence governance |
| Quality | evidence validation | Sample / Contact | strongest trust surface | generic final CTA; scope may not cover all products |
| Product Finder | uncertain selection | Technical inquiry / Sample / Product | explicit sample-confirmation caveat | only two answers affect result |
| Contact | general/low friction | form / email/phone/WhatsApp | legal identity/address/response claim | light qualification is policy-dependent |
| Quote | commercial conversion | Submit / Finder/direct contact | guidance and fallback | qualification/observability incomplete |
| Sample | technical validation | Submit / direct contact | English process steps | policy and localized explanation incomplete |

## CTA Hierarchy

Overall: **ADEQUATE**; core product detail: **STRONG**.

- Product detail correctly makes Sample primary and Quote secondary while
  preserving product context.
- Application detail correctly prioritizes sample validation and preserves
  application context.
- Homepage Quote is aggressive for discovery-stage visitors, but Products and a
  lower Sample path prevent a single hard-conversion funnel. Performance is
  `UNKNOWN`; adding more CTAs is not recommended.
- Knowledge/Answers use plausible actions but weak contextual handoff.
- Finder's “technical inquiry” intent is appropriate, but the result must not
  overstate how its answers shaped the recommendation.

## CTA Matrix

| Page/template | Stage / intent | Primary | Secondary | Destination | Fit | Message continuity / risk | Future recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home hero | discovery/relevance | Request Quote | Explore Products | quote/products | PARTIAL | generic early conversion | measure before hierarchy change |
| Home lower CTA | consideration | Quote | Sample | quote/sample | GOOD | generic, no origin context | add attribution only after policy |
| Products index | consideration/select | Product detail | temperature quote/contact | product/quote/contact | GOOD | extended forms generic | confirm product truth first |
| Product hero/footer | evaluation | Sample | Quote | contextual forms | GOOD | product preserved | retain |
| Product selection aside | evaluation | “Need this grade sampled?” | — | contextual quote | CONFLICTING | sample label, quote outcome | align label/destination |
| Application hero | problem solution | Sample | Quote | contextual forms | GOOD | application preserved | retain; fix locale separately |
| Application lower | evaluation | Sample | Contact | sample/contact | GOOD | context only on sample | contextualize alternate action |
| Knowledge/Answer | education | Sample | Contact/product | generic forms/product | PARTIAL | topic lost | controlled topic/product handoff |
| About/Manufacturing | qualification | Quote/Contact | Contact/Quality | generic conversion/evidence | GOOD | appropriate stage | gate claims, not CTA quantity |
| Quality | qualification | Sample | Contact | generic conversion | PARTIAL | evidence → action logical; scope lost | optional scope/product context |
| Finder result | uncertain selection | Technical inquiry | Sample/Product | contextual paths | PARTIAL | four tokens pass; two shape result | validate model |
| Quote | conversion | Submit Quote | Finder/email/phone | server/direct | GOOD | policy and monitoring unresolved | qualification + delivery monitoring |
| Sample | conversion | Submit Sample | email/phone | server/direct | GOOD | localized expectations differ | parity + approved policy |
| Contact | fallback | Send Message | direct channels/Quote | server/direct | GOOD | intentionally low-friction | preserve unless owner changes policy |

## Message Continuity Findings

Strong: product → sample/quote preserves product; application → sample/quote
preserves application; Finder → sample/quote now preserves locale and all four
answer tokens; form submit labels and hidden kinds match destinations.

Weak/conflicting: educational CTAs drop context; the sampled-grade label points
to quote; fallback locales mix languages; homepage application cards leave the
locale; localized quote includes an English specification note; localized sample
omits the English page's four-step process; success does not mean notification
delivery.

## Product Page CRO

Core product pages are **STRONG**: relevance/use cases precede CTAs; sample and
quote carry product context (`src/components/product/product-view.tsx:57-63`);
selection variables, temperature caveats, application links, process guide,
quality/manufacturing evidence, resources, and FAQs support technical confidence;
the footer repeats contextual actions (`:248-257`).

Risks: the mid-page selection CTA uses sample language but links to quote
(`:102-105`); product-level TDS/tolerances remain unavailable in current evidence;
the staple-fiber FAQ contradicts the extended concrete-PVA offer claim.

## Application Page CRO

Structure is **STRONG**, evidence/localization **PARTIAL**. Each template explains
the production problem, PVA role, temporary-material rationale, relevant product
forms, variables, testing, and next step. Hero sample/quote links and the lower
sample link preserve application context
(`src/components/application/application-view.tsx:44-48,142-146`).

Gaps are not CTA quantity: owner-approved trial evidence is absent, eight locale
trees fall back to English, and generic Contact drops application context.

## Knowledge / Buyer Answer CRO

Educational contribution is **ADEQUATE**; direct handoff is **WEAK**. Content
generally follows answer → variables → product relevance → sample validation,
and Buyer Answers add a useful related-product link and suitability limitation.

Direct CTAs use generic sample/contact routes without article slug, answer slug,
related product, or temperature (`src/components/answers/answer-article.tsx:107-118`;
`src/app/[lang]/knowledge/[slug]/page.tsx:88-101`). The buyer must reconstruct
context. This is observed friction, not evidence of abandonment.

## Product Finder CRO

Entry clarity is good: it states that the result is a product family for
discussion and final suitability requires a sample. The four-step sequence is
understandable and offers “not sure” options. Current source generates localized
links and carries product, application, temperature, and spec-status
(`src/components/forms/product-finder.tsx:140-148`), resolving the historical
locale/context defect.

The remaining P1 issue is decision-model continuity. `recommend()` uses only
material form and application (`:37-51`). Temperature and spec status do not
change the family or explanation, although the result says it is based on the
answers. They help only in the downstream brief. Recommendation accuracy is
`UNKNOWN` without a technical-owner decision table. A fallback always returns
water-soluble PVA yarn, so there is no “cannot recommend” state. Specification
status is inserted into the specification field as a status sentence, not an
actual count/dtex/construction.

## Sample / Quote / Inquiry Flows

The shared form validates incoming context and rejects unknown tokens. Quote and
sample show 11 visible fields; Contact shows six. Only name, email, and a
20-character message are required. This is a defensible low-friction baseline,
but the commercial policy is unresolved.

Quote copy says a complete specification includes count, construction,
dissolution method, quantity, packing, and Incoterm; most are optional and
Incoterm has no dedicated control. This may be an intentional “accept then
qualify” model, but the owner must decide it explicitly.

Success is tied to database persistence and returns a reference. Email delivery
then runs asynchronously; missing credentials or SMTP failure are logged and do
not change success (`src/lib/inquiry.ts:88-119,157-190`). That improves response
speed but creates an operational monitoring dependency. No failure was induced.

## Form Friction Register

| Flow | Field/step | Required? | Buyer/business value | Observed friction | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| All | Full name | Yes | correspondence/ownership | required marker implicit, unlike message `*` | `inquiry-form.tsx:169-174` | make convention explicit in future design |
| All | Email | Yes | response/core routing | appropriate | source | retain |
| All | Message (20 chars) | Yes | technical brief/qualification | must restate lost context | `:230-255` | carry controlled non-PII context; do not shorten blindly |
| All | Company | No | B2B identity/account | low burden | `:171` | retain unless use evidence says otherwise |
| All | Country/region | No | regional response/routing | may overlap destination | `:172` | define distinction |
| All | Phone/WhatsApp | No | alternate channel/follow-up | clear purpose | `:174` | retain |
| Quote/sample | Destination | No | logistics/export | example emphasizes country, label says port | `:175-177` | owner defines semantics |
| Quote/sample | Product | No | relevance/lead routing | bilingual options in every locale; extended generic | `:183-197` | confirm taxonomy first |
| Quote/sample | Application | No | technical context/routing | useful and prefillable | `:199-214` | retain |
| Quote/sample | Specification | No | closer sample/quote | Finder status may appear to be a spec | `:123-124,216` | separate status from actual value |
| Quote/sample | Temperature | No | key suitability variable | free text allows nuance; no method/time fields | `:217` | keep flexible; request method context |
| Quote/sample | Quantity | No | scale/pricing | placeholder combines sample/pilot/annual | `:218` | decide by inquiry kind |
| All | Submit | — | durable receipt/reference | outcome does not prove notification | `:259-263`; `inquiry.ts:184-190` | operational observability |
| All | Privacy statement | — | purpose/trust | no linked retention/controller detail | `inquiry-form.tsx:263` | owner/legal review; no legal conclusion here |

Necessary qualification and avoidable friction cannot be decided from field
count alone. “Fewer fields” is not the recommendation.

## Qualification Assessment

Current balance: **low mandatory burden, broad optional technical capture**.
Sales can receive kind, locale, identity/contact, product, application,
specification, temperature, quantity, destination, and message.

Missing/ambiguous: source route/CTA/Finder/campaign; correct locale for eight
languages; quote packing/Incoterm/timing structure; sample eligibility/quantity/
shipping/decision date; and an owner definition of minimum usable lead. The
owner should define Contact, Quote, and Sample separately before any progressive
disclosure, required-field, or attachment implementation.

## Trust Architecture

| Requirement | Class | Evidence / CRO implication |
| --- | --- | --- |
| Company/legal identity | STRONG | legal name, USCC, address, certificate-name explanation |
| Contact legitimacy | STRONG | domain email, phone, WhatsApp, address |
| Core product specificity | STRONG | four detailed families, variables, catalog |
| Extended product truth | CONTRADICTORY | concrete PVA offered vs not offered |
| Application competence | PARTIAL | strong narratives/variables; no published approved trial result |
| Quality evidence | STRONG | numbered documents, dates, scope, downloads, verification steps |
| Certification applicability | EVIDENCE_REQUIRED | document scope must not imply every family/use |
| Technical detail | PARTIAL | ranges/guides; no versioned TDS/tolerances |
| Sample/testing process | PARTIAL | sample-first language; localized and commercial policy incomplete |
| Manufacturing/capacity | EVIDENCE_REQUIRED | statistics/narrative need owner evidence dates |
| Response/SLA | EVIDENCE_REQUIRED | one-business-day statement, operational evidence unknown |
| Privacy/retention | EVIDENCE_REQUIRED | purpose-only sentence |

## Claim / Trust Risks

- `src/content/products.ts:255-262` says concrete PVA is manufactured;
  `src/content/legacy-source.ts:76` and the staple-fiber FAQ say it is not in the
  current offering. State: `CONTRADICTORY`.
- Quality carefully scopes documents. Broad impressions must not turn raw-white
  PVA-yarn evidence into proof for every product. Out-of-scope use is `UNSUPPORTED`.
- Factory/export/R&D/response assertions require owner-controlled evidence and
  refresh dates. State: `NEEDS_OWNER_CONFIRMATION`.
- Sample-first validation is coherent, but operational execution across every
  locale is `UNKNOWN`.

## Localization CRO

German runtime shows the shared fallback pattern: German navigation, forms, and
primary CTAs wrap English product/application/knowledge/answer/Finder/About/
Quality content. Root HTML reports `lang="en"`; German homepage application
cards link to unprefixed English routes; localized quote contains English
commercial guidance; localized sample omits the English process explanation;
and non-Chinese inquiries become locale `en` server-side.

This is a P1 comprehension/trust and operational-continuity issue, not evidence
that German buyers convert worse. Technical routing/indexing belongs to
`TECHNICAL_SEO`; translation to `SEO_CONTENT`; language/visual continuity to
`BRAND_UX`; inquiry locale to the backend owner.

## Failure / Error-State Risks

Confirmed: browser/server validation covers name/email/message; field errors are
associated with fields; persistence errors show email fallback; pending disables
submit; success shows a reference; honeypot returns synthetic success without
storage; Finder always returns a fallback; notification skip/error is logged
after response and does not alter success.

`UNVERIFIED_RUNTIME_RISK`: network/database/SMTP failures were not induced;
field retention/retry was not transactionally tested; alerting, retry, queue
durability, inbox monitoring, and stored-vs-notified reconciliation are unknown.

## Mobile / Responsive CRO Observations

Source stacks controls below `sm`, wraps CTA groups, and horizontally scrolls
technical tables. No source-confirmed obscured CTA or mobile-only blocker was
found. The 11-field form and four-step Finder create a long small-screen journey,
but harm is only a `HYPOTHESIS`. Full 390/768/1440/1920 testing, focus/error
behavior, and readability belong to `QA_PERFORMANCE`.

## Analytics / Measurement Requirements

No analytics vendor, client event layer, or CRO instrumentation was found. Current
behavior is `UNKNOWN`. After privacy/vendor/consent decisions, implement non-PII:

| Event | Decision supported | Non-PII properties |
| --- | --- | --- |
| `cta_click` | which route/placement starts a path | route family, locale, placement, intent, destination, product/application slug |
| `finder_start` / `finder_answer` | adoption/step friction | locale, entry, controlled step/option token |
| `finder_complete` / `finder_result_cta` | result behavior | family, controlled answer tokens, destination |
| `inquiry_view` | form starts | kind, locale, source, context-presence flags |
| `inquiry_validation_error` | usability | kind, locale, field key only |
| `inquiry_attempt` / `inquiry_persisted` | intent/durable receipt | kind, locale, controlled source; non-PII reference |
| `inquiry_notification_result` | operational reliability | channel, success/skipped/error, latency band |
| `direct_contact_click` | alternate channel use | page, locale, channel |
| `content_to_product` | education contribution | content slug, product slug, locale |

Never log message text, contact details, company, phone, free-text specification,
or other personal/commercial data into analytics.

## Prioritized Findings Register

### CRO13-01

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Claim continuity / trust
- **Affected Page / Flow:** Home, Products, PVA staple fiber, FAQ/schema → inquiry
- **Buyer Persona / Stage:** technical buyer / supplier validation
- **Evidence:** concrete PVA is both manufactured and not currently offered;
  Task 10 runtime-confirmed both and negative FAQ JSON-LD.
- **Evidence Label:** `SOURCE_CONFIRMED`, `PUBLIC_SOURCE_CONFIRMED`, `CONTRADICTORY`
- **Observed Behavior:** mutually exclusive offer states are presented.
- **Friction / Trust Impact:** buyer cannot know whether to inquire; sales may
  receive expectations the site disputes.
- **Why It Matters:** availability is a purchase-qualification fact.
- **Recommended Future Action:** obtain written owner decision; align content,
  forms, schema, and locales.
- **Measurement Needed:** affected inquiry/search paths after truth is fixed.
- **Owner Decision Required:** Yes.
- **Suggested Owner:** OWNER + `SEO_CONTENT` + `GEO_AI_SEARCH`
- **Suggested Follow-Up Task:** Resolve and propagate concrete-PVA offer truth.
- **Cross-Functional Dependency:** schema/localization.
- **Risk / Caveat:** do not infer truth from code.

### CRO13-02

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Localization / message continuity
- **Affected Page / Flow:** eight fallback locale trees; Home → Applications;
  deep content → forms
- **Buyer Persona / Stage:** non-English buyer / all stages
- **Evidence:** German runtime mixed shell/forms with English deep content; source
  maps eight locales to English; Task 10 confirmed wrong root `lang` and
  locale-losing homepage application links.
- **Evidence Label:** `SOURCE_CONFIRMED`, `RUNTIME_CONFIRMED`
- **Observed Behavior:** selected-language promise is not maintained.
- **Friction / Trust Impact:** comprehension and professionalism can be questioned
  during technical validation.
- **Why It Matters:** precise technical language is central to B2B selection.
- **Recommended Future Action:** approve per-locale content policy; preserve
  locale links; align document language and real translated coverage.
- **Measurement Needed:** locale transitions, form starts, post-fix exits.
- **Owner Decision Required:** Yes — supported languages/indexing promise.
- **Suggested Owner:** `TECHNICAL_SEO` + `SEO_CONTENT` + `BRAND_UX`
- **Suggested Follow-Up Task:** Implement approved locale/content continuity.
- **Cross-Functional Dependency:** proxy/header/routes/metadata/content.
- **Risk / Caveat:** high-risk shared routing; do not use unverified machine
  translation for technical claims.

### CRO13-03

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Product Finder / decision support
- **Affected Page / Flow:** Finder → result → inquiry/sample
- **Buyer Persona / Stage:** uncertain buyer / selection
- **Evidence:** four answers collected; recommendation uses form/application only;
  temperature/spec only reach destination.
- **Evidence Label:** `SOURCE_CONFIRMED`
- **Observed Behavior:** result implies full answer-based suggestion, but two
  answers cannot change it.
- **Friction / Trust Impact:** tool appears more discriminating than its logic.
- **Why It Matters:** dissolution conditions are central elsewhere on the site.
- **Recommended Future Action:** technical owner validates decision table and
  explains recommendation-input versus briefing-input.
- **Measurement Needed:** steps, result choices, sales reclassification.
- **Owner Decision Required:** Yes.
- **Suggested Owner:** `CRO` + technical product owner
- **Suggested Follow-Up Task:** Validate/redesign Finder decision model.
- **Cross-Functional Dependency:** QA and inquiry context.
- **Risk / Caveat:** accuracy is `UNKNOWN`; do not invent rules.

### CRO13-04

- **Severity:** P1
- **Confidence:** HIGH source / UNKNOWN operations
- **Category:** Inquiry reliability / failure state
- **Affected Page / Flow:** all forms → success → sales follow-up
- **Buyer Persona / Stage:** converted lead / response expectation
- **Evidence:** persistence precedes success; email runs after response; missing
  credentials/errors only log.
- **Evidence Label:** `SOURCE_CONFIRMED`, `UNVERIFIED_RUNTIME_RISK`
- **Observed Behavior:** success confirms storage, not notification delivery.
- **Friction / Trust Impact:** buyer can expect follow-up while notification is
  absent/delayed.
- **Why It Matters:** silent lead handling failure is material.
- **Recommended Future Action:** define durable retry/alert/reconciliation owner.
- **Measurement Needed:** persisted vs notified, latency, skipped/error/retry.
- **Owner Decision Required:** Yes — operational source of truth.
- **Suggested Owner:** ORCHESTRATOR / inquiry backend owner
- **Suggested Follow-Up Task:** Inquiry delivery health/reconciliation.
- **Cross-Functional Dependency:** shared inquiry/email/privacy.
- **Risk / Caveat:** no failure induced; external monitoring may exist (`UNKNOWN`).

### CRO13-05

- **Severity:** P1
- **Confidence:** HIGH
- **Category:** Localization / lead operations / observability
- **Affected Page / Flow:** `es`, `pt`, `ru`, `ar`, `tr`, `vi`, `id`, `de` forms
- **Buyer Persona / Stage:** non-English buyer / submitted inquiry
- **Evidence:** form sends actual locale; server maps only `zh` to `zh` and all
  other values to `en` (`src/lib/inquiry.ts:129-146`).
- **Evidence Label:** `SOURCE_CONFIRMED`
- **Observed Behavior:** stored/email locale loses eight valid values.
- **Friction / Trust Impact:** sales cannot reliably route response language or
  measure localized outcomes.
- **Why It Matters:** locale is qualification on a ten-locale site.
- **Recommended Future Action:** preserve validated enum through schema/email.
- **Measurement Needed:** inquiries/responses by actual locale.
- **Owner Decision Required:** Yes — response languages/retention.
- **Suggested Owner:** inquiry backend owner + `CRO`
- **Suggested Follow-Up Task:** Preserve inquiry locale and response routing.
- **Cross-Functional Dependency:** database/email/shared inquiry.
- **Risk / Caveat:** migration/high-risk; define historical-value treatment.

### CRO13-06

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Context handoff
- **Affected Page / Flow:** Knowledge/Buyer Answer → sample/contact
- **Buyer Persona / Stage:** question-led buyer / evaluation
- **Evidence:** direct CTAs contain no article/answer/product context.
- **Evidence Label:** `SOURCE_CONFIRMED`
- **Observed Behavior:** destination cannot identify initiating topic.
- **Friction / Trust Impact:** buyer must restate information.
- **Why It Matters:** content should reduce briefing work.
- **Recommended Future Action:** approve controlled non-PII source/topic/product
  taxonomy and display it in the form.
- **Measurement Needed:** content transitions/context presence.
- **Owner Decision Required:** taxonomy/CRM use.
- **Suggested Owner:** `CRO` + `SEO_CONTENT`
- **Suggested Follow-Up Task:** Contextualize educational handoffs.
- **Cross-Functional Dependency:** inquiry/analytics.
- **Risk / Caveat:** no free-text/PII in URLs.

### CRO13-07

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** CTA semantics
- **Affected Page / Flow:** product selection panel → quote
- **Buyer Persona / Stage:** technical buyer / sample validation
- **Evidence:** “Need this grade sampled?” links to request-quote.
- **Evidence Label:** `SOURCE_CONFIRMED`, `RUNTIME_CONFIRMED`
- **Observed Behavior:** label and outcome disagree.
- **Friction / Trust Impact:** unexpected commercial flow.
- **Why It Matters:** sample and quote express different intent.
- **Recommended Future Action:** align label/destination in bounded future task.
- **Measurement Needed:** click and downstream completion after fix.
- **Owner Decision Required:** placement intent.
- **Suggested Owner:** `CRO` + `BRAND_UX`
- **Suggested Follow-Up Task:** Correct product-selection CTA semantics.
- **Cross-Functional Dependency:** template/dictionaries.
- **Risk / Caveat:** check every reused locale/placement.

### CRO13-08

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Form qualification
- **Affected Page / Flow:** quote/sample forms
- **Buyer Persona / Stage:** commercial/technical buyer / conversion
- **Evidence:** 11 fields; only name/email/message required; copy asks for a
  complete specification not structurally required.
- **Evidence Label:** `SOURCE_CONFIRMED`
- **Observed Behavior:** low-detail briefs accepted under high-detail guidance.
- **Friction / Trust Impact:** unclear what is needed now versus later.
- **Why It Matters:** under-qualification and over-requiring can both harm B2B.
- **Recommended Future Action:** define minimum usable brief per kind, then test
  conditional/progressive fields.
- **Measurement Needed:** validation/completeness/sales re-contact flags.
- **Owner Decision Required:** Yes.
- **Suggested Owner:** OWNER + `CRO`
- **Suggested Follow-Up Task:** Quote/sample qualification contract.
- **Cross-Functional Dependency:** inquiry/database/privacy.
- **Risk / Caveat:** do not remove fields without use data.

### CRO13-09

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Localization / sample continuity
- **Affected Page / Flow:** localized quote/sample pages
- **Buyer Persona / Stage:** non-English buyer / conversion
- **Evidence:** localized quote has an English specification note; localized
  sample omits the English page's four-step explanation.
- **Evidence Label:** `SOURCE_CONFIRMED`
- **Observed Behavior:** expectations differ by locale.
- **Friction / Trust Impact:** less certainty immediately before submitting.
- **Why It Matters:** sample validation is the main risk-reduction promise.
- **Recommended Future Action:** parity-controlled template with approved claims.
- **Measurement Needed:** sample start/completion by locale after parity.
- **Owner Decision Required:** process wording/languages.
- **Suggested Owner:** `SEO_CONTENT` + `BRAND_UX` + `CRO`
- **Suggested Follow-Up Task:** Equalize localized quote/sample expectations.
- **Cross-Functional Dependency:** locale policy/templates.
- **Risk / Caveat:** do not translate unconfirmed promises.

### CRO13-10

- **Severity:** P2
- **Confidence:** MEDIUM
- **Category:** Sample/commercial expectation
- **Affected Page / Flow:** sample page/form
- **Buyer Persona / Stage:** evaluation / sample request
- **Evidence:** process exists, but cost, quantity, eligibility, shipping,
  timing, destination limits, and no-match handling are absent.
- **Evidence Label:** `SOURCE_CONFIRMED`, `UNKNOWN`
- **Observed Behavior:** commercial/process boundaries cannot be known pre-submit.
- **Friction / Trust Impact:** uncertain/unqualified expectations.
- **Why It Matters:** Sample is the primary product CTA.
- **Recommended Future Action:** approve bounded sample policy/conditions.
- **Measurement Needed:** qualification, response, shipment and reason codes.
- **Owner Decision Required:** Yes.
- **Suggested Owner:** OWNER / sales operations + `CRO`
- **Suggested Follow-Up Task:** Approved sample-request policy.
- **Cross-Functional Dependency:** operations/content/privacy.
- **Risk / Caveat:** do not invent policy.

### CRO13-11

- **Severity:** P2
- **Confidence:** HIGH
- **Category:** Measurement / attribution
- **Affected Page / Flow:** all conversion paths
- **Buyer Persona / Stage:** internal decision support
- **Evidence:** no analytics event layer; inquiry schema lacks origin, CTA,
  Finder, and campaign attribution.
- **Evidence Label:** `SOURCE_CONFIRMED`
- **Observed Behavior:** architecture cannot answer most funnel questions.
- **Friction / Trust Impact:** indirect; optimization would rely on anecdotes.
- **Why It Matters:** changes need evidence.
- **Recommended Future Action:** after privacy/vendor decisions, non-PII client
  and server events plus durable source taxonomy.
- **Measurement Needed:** defined above.
- **Owner Decision Required:** Yes.
- **Suggested Owner:** OWNER + `CRO` + ORCHESTRATOR
- **Suggested Follow-Up Task:** Privacy-approved funnel observability.
- **Cross-Functional Dependency:** analytics/inquiry/legal.
- **Risk / Caveat:** high-risk shared work; never send PII/raw values.

### CRO13-12

- **Severity:** P2
- **Confidence:** HIGH presentation / UNKNOWN policy
- **Category:** Privacy / response trust
- **Affected Page / Flow:** contact/quote/sample
- **Buyer Persona / Stage:** any buyer / pre-submit
- **Evidence:** purpose-only privacy sentence; Contact says email is typically
  answered within one business day.
- **Evidence Label:** `SOURCE_CONFIRMED`, `NEEDS_OWNER_CONFIRMATION`
- **Observed Behavior:** expectations stated without in-scope retention/controller
  detail or operational SLA evidence.
- **Friction / Trust Impact:** concise copy helps, but unsupported expectations
  become trust risk.
- **Why It Matters:** it accompanies business/contact data transmission.
- **Recommended Future Action:** owner/legal/operations approve privacy/SLA.
- **Measurement Needed:** response-time distribution and breach reasons.
- **Owner Decision Required:** Yes.
- **Suggested Owner:** OWNER / legal / sales operations
- **Suggested Follow-Up Task:** Inquiry privacy, retention, response policy.
- **Cross-Functional Dependency:** forms/policy/operations.
- **Risk / Caveat:** not a legal compliance conclusion.

### CRO13-13

- **Severity:** P3
- **Confidence:** HIGH
- **Category:** Error recovery / localization
- **Affected Page / Flow:** localized missing route → recovery
- **Buyer Persona / Stage:** localized visitor / error
- **Evidence:** Task 10 confirmed true 404/noindex but English copy/root links.
- **Evidence Label:** `PUBLIC_SOURCE_CONFIRMED`
- **Observed Behavior:** locale is lost during recovery.
- **Friction / Trust Impact:** minor extra navigation/language disruption.
- **Why It Matters:** recovery should preserve context.
- **Recommended Future Action:** localize while retaining 404/noindex.
- **Measurement Needed:** 404 source counts.
- **Owner Decision Required:** No, after locale policy.
- **Suggested Owner:** `BRAND_UX` + `TECHNICAL_SEO`
- **Suggested Follow-Up Task:** Localize 404 recovery.
- **Cross-Functional Dependency:** locale routing.
- **Risk / Caveat:** do not create a soft 404.

## Quick-Win Candidates for Future Tasks

`QUICK_WIN` means bounded future work, not permission now.

| Candidate | Category | Dependency |
| --- | --- | --- |
| Align sampled-grade CTA with destination | QUICK_WIN | placement intent/reuse check |
| Carry controlled article/answer/product context | MEDIUM_SCOPE | taxonomy and PII guard |
| Equalize approved localized sample explanation | MEDIUM_SCOPE | locale/content policy |
| Preserve actual inquiry locale | HIGH_RISK | database/email and language policy |
| Align Finder logic/explanation | OWNER_DECISION | technical decision table |
| Notification health/reconciliation | HIGH_RISK | operations/provider ownership |
| Funnel events | MEASUREMENT_FIRST / HIGH_RISK | privacy/vendor/consent |

## Owner Decisions Required

1. Concrete-PVA offer truth and approved wording.
2. Which locales promise substantive translation versus fallback.
3. Minimum usable Contact, Quote, and Sample brief.
4. Sample eligibility, cost, quantity, shipping, timing, testing, and no-match policy.
5. Ownership/evidence for the one-business-day response statement.
6. Privacy, retention, analytics vendor, consent, and attribution policy.
7. Source of truth and escalation for successfully received inquiries.
8. Technically validated Finder rules and uncertainty states.

## Proposed Follow-Up Tasks

Proposals only; no Task Card/backlog was created.

| Outcome | Suggested role | Dependencies / scope | Measurement | Owner decision | Risk | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| One verified concrete-PVA statement | SEO_CONTENT + GEO_AI_SEARCH | written truth; content/schema/locales | monitor affected paths | required | HIGH factual | P1 |
| Locale/content continuity | TECHNICAL_SEO + SEO_CONTENT + BRAND_UX | language policy; routing/content | locale transitions/forms | required | HIGH | P1 |
| Valid Finder model | CRO + product owner | decision table; logic/copy/tests | completion/reclassification | required | HIGH factual | P1 |
| Inquiry delivery monitoring | backend/ORCHESTRATOR | retry/alerts/reconciliation | persisted/notified/latency | required | HIGH | P1 |
| Actual locale end to end | backend + CRO | validation/schema/email | inquiry/response locale | required | HIGH | P1 |
| Educational context handoff | CRO + SEO_CONTENT | controlled taxonomy/form display | context/completion | required | MEDIUM | P2 |
| Qualification contract | CRO + OWNER | conditional fields/attachments | completeness/outcome | required | HIGH | P2 |
| Sample policy/locale parity | CRO + sales ops + BRAND_UX | approved policy/pages | qualification/shipment | required | MEDIUM | P2 |
| Funnel observability | CRO + ORCHESTRATOR | privacy/analytics/server events | event QA/data dictionary | required | HIGH | P2 |
| Localized 404 recovery | BRAND_UX + TECHNICAL_SEO | not-found UI/links | 404 sources | not material | LOW | P3 |

## Cross-Functional Coordination

- **TECHNICAL_SEO:** document language/direction, redirects, locale-preserving
  links, 404 behavior, and indexation consequences.
- **SEO_CONTENT:** translation depth, terminology, content-context taxonomy, and
  factual alignment after owner decisions.
- **GEO_AI_SEARCH:** claim/evidence registry, certificate scope, entity/schema,
  and concrete-PVA fact propagation.
- **BRAND_UX:** independent review of mixed-language journeys, CTA semantics,
  required-field conventions, error recovery, and visual hierarchy.
- **QA_PERFORMANCE:** 390/768/1440/1920 layouts, Finder transitions, keyboard/
  error behavior, localized form parity, and regression tests.
- **ORCHESTRATOR/OWNER:** serialize shared inquiry, analytics, proxy, header/footer,
  schema, and database work; decide policy before implementation.

## Unknowns / Data Requirements

- CTA/form/Finder behavior data and sales lead-quality/outcome data;
- response time, re-contact, quote/sample outcome, and field-use evidence;
- database/inbox monitoring and reconciliation process;
- supported response languages and sample/commercial policy;
- approved claim registry and current factory/capacity/export/R&D/SLA evidence;
- representative buyer research and regional/mobile runtime QA.

## Conclusion

Three Thai does not need indiscriminate CTA growth. It needs factual consistency,
language continuity, an honest technically owned Finder model, reliable lead
operations, and privacy-aware measurement. Product/application pages already
provide a strong path to context-prefilled sample or quote. The next CRO program
should protect that strength and resolve the five P1 risks before experimenting
with field counts or adding conversion UI.

This audit ends at recommendation and handoff. No implementation is included.
