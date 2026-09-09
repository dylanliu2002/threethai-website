# Worklog — INTL-DEES-001 Spanish and German Content Implementation

## 2026-09-09 — Content implementation and validation

Branch `qwen/intl-dees-001-es-de-localization`, PR **#34**, base `9c38f43`. Seven
commits. Not merged, not deployed, and not approved: the implementer of this copy
cannot be its reviewer, so every evidence record ships as `draft`.

### What was built

- `src/content/i18n/es.ts` and `de.ts` went from 126/266 and 125/266 translated
  leaves to **263/266 and 262/266**. The four remaining identical leaves are
  identical on purpose: the brand inside the `%s | …` title template, the site
  name, the year `2006`, and `optional`, which is spelled the same in German.
- ES/DE body copy for the four product pages and the five application pages
  (**376 translated leaves**, 216 product and 160 application) in
  `src/content/translation-copy.ts`, and 18 `draft` records in
  `TRANSLATION_EVIDENCE`, assembled by `src/content/translation-records.ts` from
  the live entity (`requiredFields`, `source`) plus that store (`content`).
- Page titles, descriptions and 26 labels that were literals inside
  `app/[lang]/**` and inside components moved into the content model
  (`src/content/site-copy.ts`, `src/content/i18n/*`).
- Embedded entities in server renderers (`ProductCard`, related applications,
  next product, article and answer teasers) now resolve through `pageCopyFor`
  instead of `contentLocaleOf`, so a promotion of that other page reaches the
  card carrying it.
- One clause of the evidence grammar widened: `TranslatedValue` accepts a nested
  object, because four application fields are `{ heading, body }` and the old
  list-or-string union would have thrown at module scope on them.
- `tests/intl-dees-001-es-de-localization.mjs` added (13 tests, registered in
  `test:seo`); pins in `intl-dees-003a`, `intl-dees-004b` and the
  `intl-dees-003b` byte budget updated with the reason inline;
  `business-fact-d2` term patterns extended to Spanish and German, the follow-up
  that card recorded for this one.

### Validation

`npm run lint`, `npx tsc --noEmit`, `npm run build` (225 pages),
`REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **203 tests, 203 pass, 0 fail**.

Field-by-field comparison of all 222 prerendered documents against the pre-task
build — visible text, title, description, canonical, hreflang pairs and targets,
robots, `<html lang>`/`dir`, `og:locale`, `og:url`, JSON-LD `@type`,
`inLanguage`:

```
EN  57 documents,  0 changed
ZH  55 documents,  0 changed
ES  55 documents, 55 changed — text, title on 50, description on 11
DE  55 documents, 55 changed — same
documents whose SEO fields moved: 0
```

Per-language average document size: EN and ZH **0 B** change; ES +2,204 B and DE
+1,644 B, which is the localized text those pages now carry. The first attempt at
this change put server-only copy in `Dictionary` and cost English and Chinese
pages 4,805 B and 4,726 B each; `intl-dees-003b`'s budget caught it, and
`site-copy.ts` is the fix.

### Localization coverage report

Prose blocks still verbatim-English in the page's own prefix-free English owner.
ES figures; DE within 1–2 points. "On approval" is what the same page measures
with its record signed off, measured on a throwaway build that was then reverted.

| Route | Locale | Before | Now (draft shipped) | On approval | SEO status today |
|---|---|---|---|---|---|
| `/` | es / de | 57% / 57% | **40% / 39%** | n/a | English-owner fallback |
| `/products` | es / de | 69% / 69% | **49% / 48%** | n/a | fallback |
| `/quality` | es / de | 90% / 90% | **78% / 78%** | n/a | fallback |
| `/request-quote` | es / de | 29% / 29% | **17% / 18%** | n/a | fallback |
| `/about` | es / de | 67% / 67% | **21% / 21%** | n/a | fallback |
| `/contact` | es / de | 45% / 45% | **20% / 20%** | n/a | fallback |
| `/manufacturing` | es / de | 69% / 69% | **52% / 52%** | n/a | fallback |
| `/applications` | es / de | 42% / 42% | **33% / 33%** | n/a | fallback |
| `/product-finder` | es / de | 56% / 56% | **35% / 35%** | n/a | fallback |
| `/products/water-soluble-pva-yarn` | es / de | 80% / 80% | **60% / 60%** | **32% / 32%** | fallback → self-owned |
| `/products/water-soluble-pva-sewing-thread` | es / de | 79% / 79% | **59% / 59%** | **33% / 33%** | fallback → self-owned |
| `/products/pva-staple-fiber` | es / de | 80% / 80% | **60% / 60%** | **32% / 32%** | fallback → self-owned |
| `/products/pva-filament-yarn` | es / de | 79% / 79% | **58% / 58%** | **31% / 31%** | fallback → self-owned |
| `/applications/towel-weaving` | es / de | 61% / 61% | **46% / 46%** | **11% / 11%** | fallback → self-owned |
| `/applications/embroidery-sewing` | es / de | 61% / 61% | **46% / 46%** | **11% / 11%** | fallback → self-owned |
| `/applications/knitting` | es / de | 61% / 61% | **46% / 46%** | **11% / 11%** | fallback → self-owned |
| `/applications/papermaking` | es / de | 60% / 60% | **44% / 44%** | **12% / 12%** | fallback → self-owned |
| `/applications/technical-textiles` | es / de | 63% / 63% | **48% / 48%** | **11% / 11%** | fallback → self-owned |
| `/answers` + 30 detail pages | es / de | 78% / 58% | **70% / 38%** | deferred | fallback |
| `/knowledge` + 4 detail pages | es / de | 55% / 61% | **38% / 52%** | deferred | fallback |

`/es/request-quote` residual, in full: the email address, the `Deutsch` switcher
endonym, the registered location string, and `THREE THAI ™`. The residual on
technical identifiers (`20°C`, `40S/2 · 1.50 dtex × 38 mm`, `ISO 9001:2015`,
`SS-8`) is deliberate and documented in `src/content/catalog.ts`.

### Remaining English, and what it would take

1. **Core routes are not promotable.** `SECTION_SURFACES` still ships empty. A
   `section` record must cover every slot the page shows as body, CTA **or form
   copy**, so `/`, `/products`, `/request-quote` and `/quality` each need their
   prose — including the inquiry form's labels — gathered into a bundle rendered
   through `pageCopyFor`. Declaring a surface the renderer does not read would be
   a completeness claim with nothing enforcing it, which is the fail-open this
   line was built to close. Needs its own card.
2. **32% / 11% English survives on the nine promoted pages** even after approval:
   `relatedArticles` and `relatedAnswers` belong to `/knowledge/*` and
   `/answers/*`, deferred behind commercial pages by this task's own priority
   list. The teaser plumbing is already in place, so those routes localise
   themselves as soon as they get records.
3. **`/es/quality` at 78%** — certificate scopes, patent titles, factory records.
4. **Form option labels stay English on ES/DE.** `inquiry-form` and
   `product-finder` are `"use client"`; routing their product picks through
   `pageCopyFor` would put the policy back in the browser, which is what
   INTL-DEES-003B removed. Needs a server component to resolve and pass down.
5. **`/zh/answers/<slug>` keeps an English `| Buyer Answer` title suffix**, and
   four `zh` index routes have no translated metadata at all. Preserved rather
   than invented: those pages own their canonical and hreflang entry, so changing
   them is a Chinese-content decision outside this card.
6. One legacy wording left as found: `legacy-source.ts` carries a singular
   `Specification and acceptance method` heading. The translation pass reported
   it as inconsistent against plural siblings and **also** reported a mangled
   `1.67mm` figure in the 90°C FAQ; the `1.67mm` claim is false — the token
   appears nowhere in `legacy-source.ts`, in the JSON stores, or in the shipped
   copy — so the sibling-comparison half of the observation is likewise left
   unverified rather than repeated. Nothing was changed either way; copy is
   translated from the source as it stands.

### Handoff for review

Approval is three fields on one record — `status: "approved"`, `reviewedBy`,
`reviewedOn` — and nothing else. **Flip the nine entity pages first**, then the
core routes if and when they get a declared surface: a promoted product page
that still points at draft applications is showing English in its own cards.
Sign-off was verified end-to-end on a disposable build (18/18 qualify,
`next build` completes 225 pages with no `pageCopyFor` throw, and the promoted
pages carry self-canonicals, the four-locale hreflang graph, `inLanguage` and
`og:locale` in the target language); that build was reverted and is not what this
branch ships.

`origin/main` moved to `1274146` (PR #33) during this task. It touches `workflow/`,
one `tasks/` card and one worklog only — no overlap with any file here, and
`git merge-tree --write-tree origin/main HEAD` is clean, so the branch stayed on
its assigned base rather than rebasing mid-review.

## 2026-09-09 — Owner terminology decisions, applied and re-verified

The owner paused evidence approval, kept every record `draft`, and settled the
two translation decisions raised by this card.

**`count` — the split is kept and now written down.** A textile numbering and a
filament quantity are different concepts and must not be normalised to one term:
`título` / `Feinnummer` for a yarn or thread count, `número de filamentos` /
`Filamentenzahl` for the number of filaments. Recorded in the glossary header of
both `src/content/i18n/es.ts` and `de.ts`, which is where the next translation
pass looks, rather than only in a code comment.

**`finish` — narrowed to what the source actually claims.** In the sewing-thread
commercial-specification list the English reads `finish` and the Chinese reads
上油, so the generic `el acabado` / `Ausrüstung` widened the statement. Now
`la lubricación` / `Ölung`. The same note records the general rule: where the
English word is broader than the process the Chinese names, translate the
process; do not widen a claim about what the company does.

Applied to `src/content/translation-copy.ts` and to the `products-copy.json` it is
generated from, so the parity between the reviewed store and the shipped store
still holds (376 leaves cross-checked, no drift).

Re-verification at this state: `npm run lint` clean, `npx tsc --noEmit` clean,
`npm run build` 225 pages, `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **203 tests,
203 pass, 0 fail, 0 skipped**. Prerender comparison against the pre-task build:
EN 57/57 unchanged, ZH 55/55 unchanged, ES/DE 55 each changed in visible text
with title on 50 and description on 11, and **0 documents with an SEO field
moved**. The two edited routes carry neither the old nor the new term today,
because the record is a draft — verified, then checked again on a throwaway
approved build where `/es/products/water-soluble-pva-sewing-thread` renders
`la lubricación` and `/de/…` renders `Ölung`, with no trace of the broad terms,
self-canonical and `og:locale` in the target language; that build was reverted.

Evidence approval remains paused: 18 records, 18 drafts, 0 promotions,
`reviewedBy` still the pending marker and `reviewedOn` still empty.
