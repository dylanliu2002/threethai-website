# Task 61 — Knowledge article foundation (typed blocks, Resources hub, related content)

- **Task Key:** `content-quality-001b-knowledge-article-foundation-codex-61`
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `61`
- **Title:** Lift the one-paragraph ceiling on knowledge articles
- **Mode:** `IMPLEMENT`
- **Role:** `SEO_CONTENT` (content model) with `HIGH_RISK_CODE` adjacent surfaces
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** `Qwen Code`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** Yes — this card is the record
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `codex/61-knowledge-article-foundation`
- **Worktree:** `worktrees/agent-61-knowledge-article-foundation`
- **Owner:** Implemented in this branch; not self-approved
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** CONTENT-QUALITY-001A (audit, delivered in chat; no report file was allowed)
- **blocks:** R1–R8 article writing batch

## Goal

CONTENT-QUALITY-001A measured that the `/knowledge` section reads like outlines
because of a template limit, not weak writing: an article was
`(heading, body)[]` and both renderers printed one `<h2>` plus one `<p>` per
tuple. Mean article: 290 body words, 8–9 sections of 29–35 words, **2 digits in
the whole corpus of four bodies, 0 inline links, 0 lists, 0 tables**.

This task builds the foundation only, so the next article can be genuinely useful
rather than longer:

1. a typed block model (paragraph, ordered/unordered list, definition list,
   parameter table, callout, sub-heading, inline internal links);
2. one server-only renderer shared by the English and localized routes, replacing
   two near-verbatim copies of the body loop;
3. per-article related content, replacing "all four products plus the other three
   articles";
4. the six-category Resources grouping on `/knowledge`, and one public name for
   the section in all four locales;
5. correction of two stale source claims found by the audit.

No article copy is written here. R1–R8 stay blocked behind this card.

## Success Criteria

- An article can carry a table, a procedure list, a definition list, a callout and
  an inline internal link, and renders them semantically with no client JS.
- The four existing articles render **byte-comparable prose**: same headings, same
  paragraphs, same order, in all four locales — verified against the build.
- `sections` remains a field-level `{ en, zh }` record, so the ES/DE promotion seam
  still recognises it (proved by mutation, not by assertion alone).
- `/knowledge` and `/knowledge/<slug>` keep their URLs, canonicals, hreflang,
  sitemap membership and 55-`<loc>` count unchanged.
- `npm run lint`, `npm run typecheck`, `npm run build`,
  `REQUIRE_BUILD_OUTPUT=1 npm run test:seo`, `npm run test:first-wave` all green.

## In Scope

- The article content model, its validators, and the legacy-to-block fold.
- `src/components/knowledge/**` (new, server-only) and the two knowledge detail
  routes plus the two knowledge index routes.
- `src/components/product/product-view.tsx` — only the related-article selection
  (authorised by card §4; see Coordination Items).
- The Resources section name in the four dictionaries, and one duplicated `<title>`
  literal collapsed onto `site-copy.pageMeta`.
- Tests appended to `tests/intl-dees-001-es-de-localization.mjs`.
- Two factual corrections to stale comments (`answers.ts`, `tasks/03-…md`).

## Out of Scope

- Writing or rewriting any article body; R1–R8; new articles.
- Any new technical claim: test values, dissolution times, strength data, process
  setpoints, customer cases, production claims.
- ES/DE/ZH translation of article copy, and any ES/DE promotion.
- Canonical, hreflang, sitemap, robots, locale routing, `SECTION_SURFACES`,
  translation evidence records.
- `/knowledge` → `/resources` URL migration and redirects.
- Extended-format content (`products.ts` availability contradiction remains the
  owner gate from Task 11 / TSEO-10-05).
- Merging.

## File Allowlist

```text
src/content/article-blocks.ts                     (new)
src/content/article-related.ts                    (new)
src/content/resources-groups.ts                   (new)
src/content/articles.ts
src/content/answers.ts                            (comment correction only)
src/content/i18n/en.ts                            (knowledgeIndex.title)
src/content/i18n/zh.ts                            (knowledgeIndex.title)
src/content/i18n/es.ts                            (knowledgeIndex.title)
src/content/i18n/de.ts                            (knowledgeIndex.title)
src/components/knowledge/article-body.tsx         (new)
src/components/knowledge/article-related.tsx      (new)
src/components/product/product-view.tsx           (related-article selection only)
src/app/(site)/knowledge/page.tsx
src/app/(site)/knowledge/[slug]/page.tsx
src/app/[lang]/knowledge/page.tsx
src/app/[lang]/knowledge/[slug]/page.tsx
tests/intl-dees-001-es-de-localization.mjs        (appended section)
tasks/03-knowledge-expansion.md                   (status note + count correction)
tasks/61-knowledge-article-foundation.md          (this card)
worklog/agent-61-knowledge-article-foundation.md  (append-only)
```

## Task-Owned Administrative Files

- **Task card:** `tasks/61-knowledge-article-foundation.md`
- **Worklog:** `worklog/agent-61-knowledge-article-foundation.md`

## Forbidden / Shared Files

- `package.json` — deliberately **not** edited. Adding a test file would require
  naming it in `test:seo`, which is why the Task 61 assertions were appended to
  `intl-dees-001-es-de-localization.mjs` instead.
- `src/content/page-surfaces.ts`, `src/content/translation-availability.ts`,
  `src/content/translation-evidence.ts`, `src/content/translation-records.ts`,
  `src/content/translation-copy.ts`, `src/content/availability.ts` — the promotion
  gate is read, never modified. `SECTION_SURFACES` must stay `{}`
  (`intl-dees-004b:146,347,611`).
- `src/app/sitemap.ts`, `src/proxy.ts`, `next.config.ts`, `src/app/globals.css`,
  `src/content/company.ts`, `src/content/card-copy.ts`, `src/content/legacy-source.ts`.
- `src/app/zh/**` — `seo-route-parity.mjs:96-99` pins this route set by exact
  equality, so no zh override may be added.
- `src/lib/seo.tsx` — no new structured data; the `"@type":"Product|Offer|…"` scan
  reads `src/**` source text.

## Inputs / Evidence

- Base commit: `origin/main` = `3d01f21`. The stale main checkout at `defc693` was
  **not** used; its `[lang]/knowledge/**` predates INTL-DEES-001.
- Measurement scripts and before/after JSON dumps live outside the repository under
  `.qwen/tmp/` (`cqa001b-measure.js`, `cqa001b-body.js`, `cqa001b-mutant.js`,
  `cqa001b-baseline.json`, `cqa001b-after1.json`) and are not deliverables.
- Preflight baseline (pristine build of `3d01f21`): 222 HTML documents, 112
  untouched; `averageUntouched` **75,369 B** against the suite's 76,800 B ceiling.
  Measured after the change: **75,230 B**, i.e. the ceiling has more headroom than
  before, not less.
- The mutation check ran against a throwaway copy under `.qwen/tmp/mutant61`, which
  was deleted afterwards; the reviewed tree was never edited. It planted a third
  locale key on `sections` — a body that still validates internally but that
  `translation-availability.ts` stops recognising — and the seam guard failed.
- Two agent-supplied claims were disproved against the ref and are **not** true
  here: there is no `tests/support/html.mjs` (`parseHtml`/`visit`), and
  `scripts/assert-no-generated.mjs` does not exist. The 416 B figure in
  `intl-dees-003b`'s comment is stale; the measured headroom was 1,431 B.
- Runtime behaviour beyond the local prerendered build is **unverified**: no
  deployment, no crawler, no Search Console.

## Acceptance Criteria

- [x] Four shipped articles render identical headings and paragraphs, in order, in
      `en/zh/es/de` (verified against the prerendered documents).
- [x] `sections` still has exactly the keys `en` and `zh`; guard proved by mutation.
- [x] No new route; no change to sitemap, canonical, hreflang or `SECTION_SURFACES`.
- [x] Related content is declared per article and every edge resolves in four
      locales; the fibre comparison page no longer advertises the yarn line.
- [x] Section answers to one name per locale: H1 == nav == breadcrumb in all four.
- [x] No new business or technical claim; no number introduced into any article body.
- [x] No translation invented for the six category headings — headings render only
      where an already-approved four-locale label exists (see Coordination Item 1).
- [ ] Independent review by a different role/reviewer.

## Validation

```bash
git -C worktrees/agent-61-knowledge-article-foundation status --short   # scoped to allowlist
npm ci                                  # real install; a node_modules junction breaks Turbopack
npm run build                           # 225 static pages, same as baseline
npm run typecheck                       # tsc --noEmit
npm run lint                            # eslint .
REQUIRE_BUILD_OUTPUT=1 npm run test:seo # 231 tests, 0 skipped, 0 fail
npm run test:first-wave                 # 5 tests
```

- [x] Diff scope reviewed — 13 modified + 5 new files, all inside the allowlist
- [x] Validation recorded below

Results at the delivered commit: typecheck clean; lint clean (exit 0); build clean,
225 static pages / 222 HTML documents (unchanged); `test:seo` **231 pass / 0 fail /
0 skipped** (221 before this task, +10 Task 61 guards); `test:first-wave` 5 pass.
Body-integrity script: all 16 article documents (4 slugs × 4 locales) render every
heading and paragraph from `legacy-source.ts` / `zhPatches` in order, with no list,
table or figure markup appearing where the model declares none.

## Coordination Items

1. **The six-category model is shipped as structure, not as visible headings — this is
   a deliberate deviation from card §3 and needs a decision.** Card §7 forbids
   manufacturing ES/DE/ZH translations, and the dictionary-completeness test
   (`intl-dees-001` REQ 3) refuses any ES/DE leaf that merely equals its English.
   Only one of the six proposed names has an approved four-locale string today
   ("Applications"). Inventing the other five would ship unreviewed Spanish and
   German; leaving them English would put English chrome on `/zh`, which is a fully
   translated, indexed surface. So `resources-groups.ts` claims each group through
   the article categories that already exist in four locales, and a group renders a
   heading only when its members agree on one label and there is more than one.
   With four articles in four distinct categories, **`/knowledge` therefore still
   renders no group headings**. The classifier, the ordering and the "unclassified
   article fails the build" guard are live and tested; the second article in any
   category turns its heading on with no code change. If the owner prefers headings
   now, the honest route is to supply reviewed translations for the six names.
2. **`product-view.tsx` is a shared component** (`CARD_RENDERERS` member, four product
   pages × four locales). Card §4 authorises replacing the global related-article
   selection, which is what changed here, and no other part of the file was touched.
   Recorded rather than assumed to be free.
3. **`pageMeta.zh.knowledge` is English verbatim** (`site-copy.ts:148`), so `/zh/knowledge`
   still carries an English `<title>` and description. Pre-existing, and fixing it
   means authoring Chinese metadata — out of scope under §7. Flagged for a zh parity task.
4. **`actions.allArticles` still reads "All technical articles"** in all four locales.
   It is a link label, not the section name, so it was left alone; renaming it needs
   four new short strings.
5. **`tasks/03-knowledge-expansion.md` is marked superseded, not executed.** Its goal
   (volume for long-tail terms) would reproduce the audited defect on the new model.
6. **Deferred:** `home-knowledge.tsx` still uses `articles.slice(0, 3)` and
   `resourcesGroups` is not yet wired into the product page's answer links. Both are
   related-content work with visible-text consequences and need their own sign-off.
7. Unrelated to this task, found incidentally: the `test:seo` list omits
   `first-wave-correctness.mjs`, which asserts a live cap of 4 knowledge articles.
   Adding a fifth article requires editing that shared file (`package.json`-adjacent
   scope), so the R-series batch must plan for it.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence:

## Completion Record

- Commit: see `git log -1` on `codex/61-knowledge-article-foundation`
- Base / rebase commit: `3d01f21` (`origin/main` at branch creation)
- Changed files: 13 modified, 5 new — listed in the File Allowlist above
- Validation results: typecheck clean · lint clean · build clean (225 pages) ·
  `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` 231/231 pass, 0 skipped ·
  `test:first-wave` 5/5 · body integrity 16/16 documents · seam guard killed by mutation
- Worklog: `worklog/agent-61-knowledge-article-foundation.md`
- Remaining risks:
  1. Category headings are invisible today (Coordination Item 1) — a reviewer may
     judge this as not meeting §3; the alternative was unreviewed translation.
  2. Related content now genuinely differs per article, so **product pages and article
     pages show fewer links than before**. That is the requested behaviour, but it is
     a navigation change and internal-link count changes on 16 product documents.
  3. Table, list, callout and inline-link rendering is exercised by tests on a
     synthetic fixture and by source assertions, not by shipped content — no article
     uses them yet. The first R-series article is the real test.
  4. Verified against a local prerender, not against a deployed environment.

## Rollback

`git revert` the task commits; nothing else is required. The three new content
modules and two new components are inert until imported, and the fold leaves
`sections` a `{ en, zh }` record, so reverting the route and index commits restores
the previous rendering with no data migration. No database, no route, no canonical,
no redirect, no sitemap and no dependency changed — `git diff --stat` confirms the
absence of `src/app/sitemap.ts`, `next.config.ts`, `src/proxy.ts` and `package.json`.
