# Three Thai Website — Master Optimization Plan

## Current state

Six specialist agents completed independent source-only audits on September 2,
2026. No P0 site-wide blocker was confirmed. The first implementation program
should prioritize international indexing correctness, conversion-context
continuity, accessibility/build gates, and evidence governance before expanding
content or redesigning navigation.

## What the audits agree on

1. **Locale architecture is the highest technical risk.** UI locale availability,
   translated-content availability, canonical, hreflang, sitemap, document
   language, internal links, and schema URLs do not share one source of truth.
2. **The site needs better evidence attachment, not more generic pages.** Existing
   answers are easy to extract, but claims lack reviewer, scope, method, and
   document relationships.
3. **Conversion paths lose useful context.** Product pages work well; Finder,
   localized routes, knowledge, and answers often discard locale or buyer inputs.
4. **Quality gates are too permissive.** Type errors may ship, form errors are not
   announced correctly, small gold text has insufficient contrast, and the mobile
   menu lacks complete focus management.
5. **Brand direction is sound but needs one naming and proof hierarchy.** The most
   defensible promise is process-matched, traceable PVA materials supported by
   scoped evidence and sample validation.

## Decisions required before affected implementation

### D1 — Locale indexing policy

Recommended default:

- English and Chinese: index translated routes with self-canonical URLs and
  reciprocal hreflang.
- Spanish, Portuguese, Russian, Arabic, Turkish, Vietnamese, Indonesian, German:
  index only routes with genuinely localized substantive content; do not present
  English deep-content fallback as translated content.
- Keep fallback routes usable for visitors, but exclude them from hreflang and
  choose either English canonical or `noindex` based on route purpose.

This decision affects metadata, sitemap, schema, navigation, and translations.

### D2 — Product and claim truth

Owner must confirm:

- whether concrete PVA fiber is currently offered;
- status of PVA cotton, PVA top, PPVA fiber, and Gracell yarn;
- which temperature/catalog rows apply to each product family;
- current factory area, spindles, capacity, employees, specification count;
- export markets, R&D/recognition claims, SLA, and sample-process promises.

### D3 — Brand/entity taxonomy

Approve exact usage for:

- Three Thai Textile — customer-facing brand;
- `threethai™` — product/brand mark;
- 山东荣沣纺织有限公司 / Shandong Three Thai Textile Co., Ltd. — certified legal entity.

### D4 — Conversion and privacy policy

Choose required fields by inquiry type, response-time promise, attachment policy,
contact-form qualification level, privacy/retention language, analytics vendor,
and consent model.

## Program DAG

```text
Audits 10–15 (complete)
          |
          +--> D1 Locale policy ------> metadata/lang model --> sitemap/schema --> locale QA
          |
          +--> D2 Claims truth -------> evidence registry ----> product/content expansion
          |
          +--> D3 Brand taxonomy -----> home/about/proof copy -> navigation IA
          |
          +--> D4 Conversion policy --> forms/analytics/ops ----> CRO experiments
          |
          +--> Unblocked quality fixes -> build + accessibility baseline
                                                |
                                                v
                                      integrated browser QA
                                                |
                                                v
                                      orchestrator release gate
```

## Delivery waves

### Wave A — Unblocked correctness

- Form validation/error announcements.
- Finder locale/context continuity and Finder action on quote pages.
- Localized active navigation and internal-link normalization.
- Broken schema image reference and obvious metadata-route mismatch.
- Accessible contrast and mobile-menu focus behavior.
- Typecheck/build gate audit and parity-test scaffold.

### Wave B — Locale and semantic architecture

Starts after D1. Build one availability model, then update document language,
metadata/hreflang, sitemap, schema URLs/entity IDs, locale switches, and parity tests.

### Wave C — Evidence and content

Starts after D2 and reviewer assignment. Create claim/evidence registry, scope
guards, author/reviewer metadata, intent ownership, product-specific related
content, and priority answer expansions.

### Wave D — Brand and conversion

Starts after D3/D4. Apply naming rules, qualify claims, refine CTA hierarchy and
navigation, add privacy-approved analytics, and improve notification operations.

### Wave E — Independent QA and release

Run build/type/lint, route and schema checks, keyboard/screen-reader tests, and
responsive verification at 390, 768, 1440, and 1920 px across representative
English, Chinese, Arabic, and German routes. Measure LCP, CLS, and INP only here.

## Historical execution recommendation

The original plan recommended Luna for bounded fixes and inventories, Terra for
UX/IA and work combining product judgment with code, and Sol for locale/indexing
architecture, shared metadata, inquiry reliability, and release gating. That
guidance is retained as historical context; it is not current Role governance
and does not bind future Tasks to a model family or executor platform.

Current Tasks use the platform- and model-agnostic policy in
`docs/agent-team/EXECUTION-POLICY.md`. The implementation DAG, dependencies,
Execution Profiles, historical execution records, and initial file ownership are
recorded in `tasks/IMPLEMENTATION-BACKLOG.md`.

## Release gates

- No implementation task edits outside its allowlist.
- Shared files are serialized through the orchestrator.
- All factual claims are supported, conditional, or removed.
- `npm run lint`, an explicit typecheck, and production build pass.
- Latest commit author is exactly `dylanliu2002 <dylanliu2002@gmail.com>`.
- No push, deploy, analytics activation, or privacy-policy publication without
  the applicable user decision and authorization.
