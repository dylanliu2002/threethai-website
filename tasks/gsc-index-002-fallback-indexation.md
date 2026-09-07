# Task GSC-INDEX-002 — Fix Fallback Locale Duplicate Indexation

- **Task Key:** `GSC-INDEX-002`
- **Machine Contract:** None
- **Task ID:** Not assigned — `tasks/README.md` reserves the numeric namespace
  and currently states "There is no Task 53". This card is identified by its
  canonical task key only, pending ORCHESTRATOR board registration.
- **Title:** Stop English-fallback deep-content URLs from claiming independent localized identity
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Qwen Code
- **Priority:** `P0`
- **Status:** `READY_FOR_REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `qwen/gsc-index-002-fallback-indexation`
- **Worktree:** `worktrees/qwen-gsc-index-002-fallback-indexation`
- **Owner:** Implementation worker (Qwen Code)
- **Reviewer:** Unassigned (must be independent — TECHNICAL_SEO review required)
- **depends_on:** None
- **blocks:** None

## Goal

Google Search Console reports 75 URLs in "Duplicate, Google chose different
canonical than user". All 75 are in the eight UI fallback locales
(es, pt, ru, ar, tr, vi, id, de); 66 are `/answers/*`, 9 are `/knowledge/*`.
Zero English and zero Chinese URLs are affected.

Root cause (reproduced against `origin/main`): `buildMetadata()` in
`src/lib/seo.tsx` self-canonicalised every rendered locale and emitted a
ten-locale `hreflang` graph, while `contentLocaleOf()` in
`src/content/company.ts` returns English body copy for every locale except
`zh`. The eight fallback locales therefore published English-content copies
that claimed to be independent localized documents. The sitemap and the
language switcher kept their own copies of the same (wrong) rule.

## Single Source Of Truth

`src/content/availability.ts` is now the only place that answers "does this
locale genuinely have this page?". Canonical, `robots` indexability, hreflang,
`og:locale`, structured-data language, sitemap membership and the language
switcher's `hreflang`/`lang` claims all read from it. No surface may enumerate
locales locally again.

The rule mirrors the existing `ContentLocale` type: genuinely translated deep
content exists in `en` and `zh` only.

| Surface | Genuinely translated page | English-fallback copy |
| --- | --- | --- |
| canonical | self | the English original |
| hreflang | real equivalents + `x-default` | not emitted at all |
| robots | `index, follow` | `index, follow` (canonical consolidates) |
| sitemap entry / alternate | yes | never advertised |
| `og:locale`, JSON-LD `inLanguage` | locale of body copy | English |
| switcher `hreflang`/`lang` claim | yes | link kept, claim removed |

Scope is entity **detail** pages only — `/answers/{slug}`, `/knowledge/{slug}`,
`/products/{slug}`, `/applications/{slug}` (43 paths × 8 fallback locales =
344 copies; 272 of them in the two classes Search Console flagged). Section
index pages, the homepage and the core buyer-journey pages lead with
translated chrome and are not flagged, so they keep self-canonical plus the
full ten-locale graph.

## Success Criteria

- `/es/answers/foo` declares `https://www.threethai.com/answers/foo`.
- No fallback deep URL is advertised as `hreflang=es|pt|ru|ar|tr|vi|id|de`.
- English canonicals and genuine Chinese pages keep self-canonical.
- Sitemap, metadata and switcher agree by construction, not by duplication.
- `tests/gsc-index-002-fallback-indexation.mjs` fails if any rule regresses.

## In Scope

- The shared availability policy and its consumers.
- Removing the dead per-route `alternates` literals (25 files).
- Making deep-content structured data report the canonical owner.

## Out of Scope

- Translating any content (no invented translations).
- Redirecting or deleting fallback URLs; user-facing locale navigation stays.
- `SYS-AUTO-*` automation work, `workflow/canonical.mjs` (unrelated JSON
  canonicalisation helper), dirty legacy worktrees, deployment, DNS.

## Deferred — separate coordinated change

**Document-level `lang`/`dir` (html-lang defect).** `src/app/layout.tsx`
hardcodes `<html lang="en">` for every locale; `src/app/[lang]/layout.tsx`
only sets `lang`/`dir` on an inner `<div>`. Arabic therefore renders
`<html lang="en">` with an RTL `<div>`. A correct fix needs one root layout
per locale (route-group restructure of `app/(site)`, `app/[lang]`, `app/zh`,
with `globals.css`, fonts, verification metadata, `not-found` and toaster
duplicated or re-homed). Root layouts cannot read the `[lang]` segment, so no
narrow patch exists that does not risk 404/redirect regressions in the same
change that must clear 75 duplicates. Not attempted here.

## Separate Review — not explained by this defect

These four "Crawled — currently not indexed" URLs are not fallback duplicates
and need their own content/indexability review:

- `/quality`
- `/products/water-soluble-pva-yarn`
- `/answers/pva-water-soluble-fiber-nonwoven-production`
- `/zh/knowledge/pva-staple-fiber-vs-filament-yarn`

Measured in the validation build — all four are canonical owners, so this task
changes none of their indexation signals:

| URL | canonical | robots | rendered words |
| --- | --- | --- | --- |
| `/quality` | self | index, follow | ~1633 |
| `/products/water-soluble-pva-yarn` | self | index, follow | ~943 |
| `/answers/pva-water-soluble-fiber-nonwoven-production` | self | index, follow | ~349 |
| `/zh/knowledge/pva-staple-fiber-vs-filament-yarn` | self | index, follow | ~153 |

The last two are markedly thinner than the first two, which is a plausible but
unproven factor; no cause is claimed here. Their indexation depends on content
quality/uniqueness rather than locale duplication, so they need their own
review. The fourth is genuine Chinese content and keeps its self-canonical
under this policy.

## Validation

```bash
npm run lint          # PASS
npm run typecheck     # PASS
npm run build         # PASS — 555/555 static pages
npm run test:seo      # PASS — 23 tests (18 added for this task)
git diff --check      # PASS
```

Verification beyond the suite (production build with
`NEXT_PUBLIC_SITE_URL=https://www.threethai.com`):

- 550 prerendered application pages scanned: 206 self-canonical, 344
  English-fallback copies consolidated (43 per fallback locale × 8 locales;
  answers 240, knowledge 32, products 32, applications 40). Zero canonical /
  `og:url` / `og:locale` / hreflang / `inLanguage` violations.
- Standalone server on `127.0.0.1:3123`: 210 representative URLs across all ten
  locales returned 200, with 0 redirects and 0 redirect loops; unknown slugs
  still return 404 in all ten locales; `/sitemap.xml` and `/robots.txt` 200.
- Served sitemap contains no `/es|pt|ru|ar|tr|vi|id|de/` deep-content URL and
  still advertises 54 genuine Chinese URLs.

## Coordination Items

- **Board registration:** this card is deliberately not added to
  `tasks/README.md`. Registering a task row and assigning a numeric ID is an
  ORCHESTRATOR action against a shared file, so it is requested here rather
  than performed.
- **Deployment:** none required beyond the normal build. Google must recrawl
  before Search Console reflects the change; do not expect the 75 duplicates to
  disappear immediately. The expected terminal state for those URLs is
  "Alternate page with proper canonical tag".
- **Reviewer decision required:** the `/products/*` and `/applications/*`
  fallback copies (72 URLs) fall inside this policy but were **not** among the
  75 reported duplicates. They are the same defect class — both detail templates
  hard-code English section headings for every non-`zh` locale — so they are
  included. To exclude them, narrow `DEEP_CONTENT_SECTIONS` in
  `src/content/availability.ts`; no other file needs to change.
- **Residual, out of scope:** core section pages such as `/es/quality` and
  `/es/answers` keep self-canonical and the full ten-locale graph. Their views
  do render some `Record<ContentLocale>` blocks in English, but they lead with
  translated chrome and Search Console flags none of them.
- **html-lang:** document-level `lang`/`dir` is still wrong (see Deferred).

## Review Status

- Outcome: Pending

## Rollback

Revert the task commit. The change is metadata/serialization only: no route,
URL, redirect or content file is added, removed or renamed, so rollback simply
restores the previous self-canonical + ten-locale behaviour.
