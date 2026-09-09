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

## 2026-09-09 — The owner read the pages; the rest of the English is fixed at source

The owner pasted the rendered `/es` pages. The residual was not the identity strings
I had reported: it was four content modules that only carried `en`/`zh`, so the
routes that read them had no localized answer to exist. Attribution, not guessing —
a script matched every English block on each page back to the file and line holding
that exact string (`attribute.mjs`), which split the causes into three kinds.

**Fixed at source (was invisible in a source diff because the strings were already
translated-looking in the dictionary):**
- `src/content/factory.ts` — stats labels, equipment names and machine brands, the
  six-step process flow, and the manufacturing intro: `Record<ContentLocale,…>` →
  `Record<Locale,…>` with Spanish and German. The manufacturing page was the worst
  offender and is now nearly clean.
- `src/content/quality.ts` — every certificate label, note and fact (including the
  quality pillars and the intro). Certificate and report numbers, standard
  designations and issuing-body names are kept verbatim on purpose: a translated
  certificate number is not a number a buyer can check against the document.
- `src/content/patents.ts` — the section intro, the disclaimer, the foreign
  certificates' country, date label and date value. The 34 `titleEn` patent titles
  are left as registered document names; the file states that English titles are
  working translations and the Chinese titles are authoritative, and inventing a
  second working translation of a legal title is the kind of claim this workspace
  does not make. That disclaimer is now in the reader's language, so the reader is
  told rather than left guessing.
- `src/components/sections/home-quality.tsx` — the four certification marks.
- `manufacturing-view.tsx` — three more `locale === "zh" ? … : …` literals, one of
  them an array of four traceability bullets, now four labelled entries in
  `server-copy.ts` because a ternary over a list cannot grow a language.
- The products index's invisible `Product families` heading.
- Every one of those readers now indexes by the **route** locale. Widening the
  records alone changed nothing, because `contentLocaleOf("es")` answers `"en"`:
  that indirection was the actual bug, and it is why the fix is in two halves.

**English share of rendered prose on the Spanish pages, before → after:**

| Route | Earlier today | Now |
|---|---|---|
| `/es/manufacturing` | 69% → 52% | **11%** |
| `/es/about` | 67% → 21% | **12%** |
| `/es/quality` | 90% → 78% | **52%** |
| `/es` (home) | 57% → 40% | **34%** |
| `/es/contact` | 45% → 20% | **20%** |
| `/es/knowledge` | 55% → 38% | **38%** |
| `/es/products` | 69% → 49% | **48%** |
| `/es/request-quote` | 29% → 17% | **17%** |

The remaining English is now three honest categories, not an oversight: entity body
copy on product and application pages and their cards, which the 18 `draft` records
already translate and which move when the owner signs them off; registered
identifiers (patent titles, certificate and report numbers, `20S/1–80S/1`, `ISO
9001:2015`, emails, the registered address); and the `answers`/`knowledge` article
bodies, which this card defers behind commercial pages and which still need
records of their own.

Verification: `npm run lint` clean, `tsc --noEmit` clean, `next build` 225 pages,
`REQUIRE_BUILD_OUTPUT=1 npm run test:seo` **203 tests / 203 pass / 0 fail / 0
skipped**. Field-by-field against the pre-task build over all 222 documents: **EN
57/57 unchanged and ZH 55/55 unchanged** — this pass added no text to a language it
does not translate — ES and DE changed only in visible text, title and description,
and **no document moved an SEO field**.

## 2026-09-09 — Second read of the pages: a slug masquerading as a product name

The owner pasted `/es`, `/es/products`, `/es/knowledge` and `/es/applications` again.
Three findings, all fixed:

- `→ Productos: water soluble pva yarn` — the application card rendered
  `slug.replaceAll("-", " ")`. A URL identifier is not a product name, and the bug was
  not a localisation bug at all: the English page said `→ Products: pva staple fiber`
  too. It now renders the product's own name through `pageCopyFor`.
- The application cards (index + home) still used `contentLocaleOf`, so approving an
  application record would have localised the page and not its cards. Now through the
  gate — this removes the one gap the previous section listed as knowingly open.
- `34 + 2 patents` was the last English word in the home certification marks; the
  mark titles are per-locale, with the three standard names identical across
  languages because those are the names of the documents.

A number in the commit message for this pass was wrong and is corrected here rather
than rewritten in history: it claimed `/es/applications` went 16 → 11 English blocks.
Those two figures came from two different measurements — the attributed count of
*distinct* blocks, and the shared-with-the-English-owner count of *occurrences* that
every table in this worklog uses. Re-run on the same build, the index page is still
16 blocks / 33%, unchanged.

The fix to the application cards was real but it is not a percentage win yet, and for
an exact reason worth stating: the old line rendered `slug.replaceAll("-", " ")`, and
the English owner renders the same mangled slug, so the two pages agreed and the
residual metric never counted it. Replacing it with the product's real name keeps the
count identical because that name is still English until a record is approved — what
changed is that the page no longer shows a URL fragment as a label, and that the cards
now follow the approval instead of being stuck in English forever.

Measured on the shared-with-owner basis used throughout: `/es/quality` 52% (132/252,
36 of them registered patent titles and numbers), `/es/products` 48% (38/80, 16 of
them technical spec chips), `/es/applications` 33% (16/48), `/es` 33% (39/117).
What is left is entity copy the 18 draft records already translate, plus identifiers
that must not be translated.

EN 57/57 and ZH 55/55 documents still byte-unchanged; no SEO field moved; 203/203
SEO tests pass; records still drafts.

## 2026-09-09 — Cards, not only pages: the third read of the same URLs

The owner's third paste asked for the home product cards, the application cards and the
article summaries to change with the language as well. They did not, and the cause is the
same distinction this task keeps having to draw: all of those surfaces read the *entity*
through `contentLocaleOf` / `pageCopyFor`, which is the promotion seam.

This partly reverses the decision recorded in the section above. That pass routed the
application and product cards through the gate because a card quotes another page's text,
and it reasoned that the card should therefore follow that page's approval. The consequence
was the bug the owner just reported: `/es` has no evidence record and can never have one
under the current card set, so a card that waits on approval waits forever, and the listing
pages stayed English no matter what was translated. The two duties are different, so they
now have two seams: a card is prose owned by the page it sits on; a page body is the claim
that earns URL ownership.

New module `src/content/card-copy.ts` (`productCard`, `applicationCard`, `articleCard`):

- English and Chinese come out of the entity, so a card cannot drift from the page it
  points at.
- Spanish and German come from `translation-copy.ts` — the same store the 18 draft records
  were assembled from — so approving a page cannot leave its own cards saying something
  different. Asserted field by field.
- It imports neither `translation-availability` nor `translation-evidence` and never calls
  `pageCopyFor`. Structurally a card has no route to a canonical, an hreflang entry, a
  sitemap slot or `inLanguage`.
- Article teasers are the honest exception. Only the three fields a card shows
  (`category`, `title`, `intro`) were translated, in a table that re-reads its own en/zh
  against `articles.ts` and throws on a mismatch. The article *bodies* are still
  untranslated, so `/es/knowledge/<slug>` stays an English-owner fallback while its
  listing card is Spanish.

Wired: `product-card.tsx` (one path now serves `/`, `/es`, `/es/products` and `/zh`),
`home-applications.tsx`, `home-knowledge.tsx`, `app/[lang]/applications/page.tsx`,
`app/[lang]/knowledge/page.tsx` — including the `CollectionPage.hasPart` headlines, which
now describe the entries a reader actually sees.

English leaves per document, on the shared-with-the-English-owner basis used above:

| Route | Locale | Before | After |
| --- | --- | --- | --- |
| `/es` | es | 39/117 · 33% | 12/117 · **10%** |
| `/de` | de | not recorded | 11/117 · 9% |
| `/es/products` | es | 38/80 · 48% | 30/80 · **38%** |
| `/de/products` | de | not recorded | 29/80 · 36% |
| `/es/applications` | es | 16/48 · 33% | 6/48 · **13%** |
| `/de/applications` | de | not recorded | 6/48 · 13% |
| `/es/knowledge` | es | not recorded | 6/48 · 13% |
| `/de/knowledge` | de | not recorded | 6/48 · 13% |

Two things looked like failures during verification and are not, recorded because both
would mislead a later reader:

- `productCard("water-soluble-pva-yarn", "es").name` is present in *every* Spanish
  document. It is a substring of the header strip and the footer tagline — localised
  chrome repeating a short product label, not a promoted page. This is why the build
  assertions use a tagline; the earlier REQ 4 test already refused to assert on a name.
- The German card name appeared to be *missing* from `/de/applications.html` to
  `String.includes`. It is there, as `Handtuchweberei &amp; Zero-Twist`. The new build
  test therefore compares **visible text** (tags and the flight payload removed, entities
  decoded) instead of raw HTML — otherwise it measures escaping, not localisation.

Suite went from 13 to 18 tests in this file (203 → 208 overall): every card surface
imports the module and none prints a slug as a label; card text equals store text for
es/de and entity text for en/zh; the teaser guard is exercised by making `articles.ts`
disagree with the table and expecting the throw, since a guard nobody pokes is
indistinguishable from one that is absent; `card-copy` reaches no promotion machinery; and
in the built output a card's localised tagline is present on `/es/products.html` and
absent from `/es/products/<slug>.html`, with canonical, sitemap and hreflang unmoved.

EN 57/57 and ZH 55/55 documents still byte-unchanged; no SEO field moved; 208/208 SEO
tests pass; all 18 records are still `draft` with `reviewedOn` unset.

## 2026-09-09 — The two seams have to be two everywhere

Checking the new rule against the whole tree found that `product-view.tsx` and
`application-view.tsx` still read *other* pages' text through the gate: a related
application's name and summary, a related article's title, the previous/next product
name. So the same application would have rendered `Fabricación de toallas y tejido sin
torsión` on the home card and `Towel weaving & zero-twist` on a product page — same
reader, same language, two labels. That is the defect the owner has now reported twice,
reached by following the principle rather than the page they pasted.

Both views now take those four surfaces from `card-copy`; page bodies are unchanged and
still resolve through `pageCopyFor`. `CARD_RENDERERS` in the suite grew from five files
to seven so the rule cannot be half-applied again.

One surface is deliberately left on the gate: the related **answers** on a product page.
`/answers/*` has no translated store at all (this task defers answers and article
bodies), so there is no reviewed text to put in a teaser table, and a question is a
headline rather than a summary — inventing one would be content work outside the
agreed scope. It localises when those routes get records.

| Route | Before | After |
| --- | --- | --- |
| `/es/products/<4 slugs>` | 58–60% | **51–53%** |
| `/es/applications/<5 slugs>` | 38–48% | **38–40%** |
| `/es/applications/towel-weaving` | 46% (25/54) | 39% (21/54) |
| `/es/applications/technical-textiles` | 48% (27/56) | 38% (21/56) |
| `/es/products/water-soluble-pva-yarn` | 60% (67/111) | 51% (57/111) |

Rebuilt (225/225) and re-measured against the pre-task snapshot: EN 57/57 and ZH 55/55
documents unchanged, ES/DE text changed on 55 documents each, **0 documents moved an SEO
field**. `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` 208/208; lint and `tsc --noEmit` clean;
all 18 records still `draft`.

The comparison needed `%TEMP%\base-app`, which the earlier passes used; a run against a
relative `base-app` silently reports `before 0 documents` and "0 changed" for everything,
which reads as a clean result and proves nothing. Re-ran with the absolute path.

## 2026-09-09/10 — The owner's ruling: a four-language base site, and two tiers

The target was restated: not ES/DE awaiting SEO promotion, but the site being a
four-language base site the way it was a Chinese-and-English one. That splits the one
gate in two, and the split is the durable outcome of this whole card:

- **rendering ← completeness.** `DISPLAY_PAGES = displayPromotions()` is
  `approvedPromotions()` minus only the three signature-shaped reasons. Pages pass it
  to `pageCopyFor` at the call site. Every other rule still applies, including
  `self-approved` and `copy-not-translated`, so half a translation still cannot show.
- **the four SEO signals ← approval.** canonical, hreflang, sitemap, `inLanguage`
  still resolve from `TRANSLATED_PAGES = approvedPromotions()`, and no policy function
  accepts the display list.
- Cost stated rather than discovered: a draft page's visible prose and its
  machine-readable language disagree until signed. Approving changes no text.

What that made visible next was the class of English no metric had been reading:

| What | Where it hid | Now |
| --- | --- | --- |
| spec chips (`PVA yarn`, `sewing thread`, `fiber`, `filament`) | plain strings in `catalog.ts` | `Record<Locale, string>` per chip, codes and figures identical in all four languages; `/es/products` 38 → 16% |
| 36 patent titles | `titleEn` in `patents.ts` | `titleEs`/`titleDe` + `patentTitle()`; registered Chinese title kept on the line beneath; `/es/quality` 52 → 38% |
| form option labels, logo `alt`, `Main`/`Mobile`/`Breadcrumb` landmarks | attributes, and the inquiry form prerenders as a Suspense skeleton | `clientLabels`/`serverLabels`; attribute residue per page 4–9 → 1 |

Two errors worth keeping, both mine:

- I told the translation pass a machine "is an oiling/applying machine"; its registered
  title says 整理机, and it obediently wrote `lubricación` / `Garnölungsmaschine`. That
  narrows what the patent claims. Reverted to `acabado` / `Garn-Ausrüstungsmaschine` in
  `eb20c77`. The generator then corrupted the single-line patent objects by inserting at
  line start — reverted, re-run against "does `titleEn` own its line", verified 36/36
  digit-for-digit. The agent's own report claimed 38 titles; the module has 36.
- A language-switch bug was reported (pick English, land in German). The decision layer
  was correct in all 320 combinations; the cause is that English owns the prefix-free
  URL, so its picker entry could only travel as `?_locale=en`, which is stripped on
  arrival — a bookmark or back navigation then follows the `threethai_locale` cookie.
  Fixed by routing the English entry through `/en/<path>` (`e9b604e`), which persists
  `en` before the cookie is consulted. `tests/language-switcher-roundtrip.mjs` pins it,
  including "no cookie-driven relocation may be a cacheable 308" — the shape that would
  make this symptom permanent. Its first harness had a vacuous loop check (comparing a
  decision's target against the state already advanced to it) and failed loudly; fixed to
  track visited paths.

The owner then asked for the big-site behaviour and chose the non-blocking form: a
dismissible "also available in …" notice, browser-only, `useSyncExternalStore` with a
null server snapshot, dismissal in localStorage, standing down when the picker's cookie
exists. Measured price: **8,424 B** in the shared shell, **29 KB** when mounted only in
the English layout (a 63 KB chunk duplicated per route tree) — narrower placement is not
cheaper. Accepted and recorded as named allowances in 003B's ceiling, whose real teeth
are the POLICY_STRINGS chunk scan. An effect-based first draft was rejected by the
repo's own `react-hooks/set-state-in-effect` rule; the store version costs 318 B more
and is correct.

After each pass: build 225/225 static, 0 dynamic routes, 220/220 SEO tests, lint and
tsc clean, EN 57/57 and ZH 55/55 documents byte-unchanged, **0 documents moved an SEO
field**, all 18 records still `draft` with `reviewedOn` unset.

