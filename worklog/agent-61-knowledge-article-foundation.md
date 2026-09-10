# Task 61 Worklog — Knowledge Article Foundation

## 2026-09-11 — Execution assignment

- Executor Platform: `Qwen Code`. Provider and model family are not pinned and were
  not selected by this task.
- Role: `SEO_CONTENT` responsibilities applied to a content-model change; the work
  touched code, so the card records Execution Profile `HIGH_RISK_CODE`.
- This card and this worklog are the assignment record. Implementation was performed
  by the same worker, so it is **not** self-approved: the card sits at `REVIEW`.

## 2026-09-11 — Base, worktree and preflight

- `origin/main` moved twice during preparation: `1edc89e` → `3d01f21`. The branch is
  based on `3d01f21` after a fresh `git fetch`.
- The main checkout sits at `defc693` on `codex/50-fix-merge-deploy`, roughly at the
  PR #1/#2 era. It was read only through `git show <ref>:<path>` and never used as an
  editing base: its `[lang]/knowledge/**` predates INTL-DEES-001, so editing there
  would have silently reverted the promotion seam and three pinned suites.
- Created `codex/61-knowledge-article-foundation` and
  `worktrees/agent-61-knowledge-article-foundation`; identity set and verified.
- A real `npm ci` was run in the worktree (exit 0). The `node_modules` junction
  suggested by repository `AGENTS.md` breaks Turbopack on this host, so it was not used.
- Preflight baseline was captured from a **pristine build of `3d01f21`** before any
  edit, by stashing the work-in-progress, building, measuring, and restoring:
  222 HTML documents (112 untouched), `averageUntouched` **75,369 B** against the
  suite's 76,800 B ceiling, `averageAll` 78,201 B against 79,200 B.

## 2026-09-11 — Corrections to inherited claims (verified against the ref)

Three constraints carried into planning were wrong and were disproved before any
code depended on them. Recording them so a later task does not re-inherit them:

- There is **no** `tests/support/html.mjs`; `parseHtml()` / `visit()` do not exist.
  `tests/support/` holds only `chrome-cdp.mjs` and `ts-extension-hooks.mjs`. The real
  in-repo idiom is the file-local `visibleText()` in `intl-dees-001`.
- There is **no** `scripts/assert-no-generated.mjs` and no `prebuild`/`postbuild`
  hook; `npm run build` is `next build && node scripts/prepare-standalone.mjs`. The
  ">800 .html files" budget quoted in planning does not exist.
- `tests/first-wave-correctness.mjs` contains no article-count assertion and is not
  in `test:seo`; the live floor is `gsc-index-002:90` (`articles.length >= 4`).
- The "416 B of headroom" figure in the `intl-dees-003b:447-451` comment is stale
  relative to current `origin/main`: measured headroom was 1,431 B.
- `origin/main` is four-language (EN/ZH/ES/DE) since LOCALE-RETIRE-001; the ten
  locales and the "43 English deep routes per fallback locale" figures in the Task 11
  audit report are superseded.

## 2026-09-11 — Implementation

- `src/content/article-blocks.ts` (new): the typed block union, the legacy
  `[heading, body] → { heading, blocks: [paragraph] }` fold, `assertArticleBodyShape`,
  `bodySignature` and `assertAlignedBody`.
  Two deliberate design decisions, both forced by the promotion seam:
  - **No optional properties anywhere in the model.** `TranslatedValue`'s object
    branch is `{ [key: string]: TranslatedValue }`, so an optional `caption` would
    not typecheck against a real approval record. Every table therefore carries a
    required caption, which is also the accessibility-correct default.
  - **`paragraph` (string) and `prose` (inline spans) are two variants**, not one
    variant with a single-text special case, so migrating the shipped bodies is
    provably markup-neutral rather than identical-if-you-trust-the-renderer.
- `src/content/article-related.ts` (new): per-article related sets plus
  `articlesForProduct`, both resolving through `card-copy` and throwing on unknown or
  self edges. Every edge is traceable to a relation already recorded in the
  repository — `docs/agent-team/PAGE-INTENT-OWNERSHIP.md:38-44`,
  `answer-expanded.ts:97-100`, and each answer's own `relatedProduct`. No invented
  links. `applications` is empty for all four articles because no article-to-application
  edge exists anywhere in the model, and asserting one would be a new claim.
- `src/content/resources-groups.ts` (new): the six-category taxonomy as data.
- `src/components/knowledge/article-body.tsx` / `article-related.tsx` (new):
  server-only, no `"use client"`, no hooks, and they never call `pageCopyFor` — the
  route resolves copy and passes the widened entity plus resolved strings down.
- Both `knowledge/[slug]` routes and both `knowledge` index routes updated; the two
  duplicated body loops and the duplicated related blocks are gone.
- Section name unified in all four dictionaries by copying each dictionary's **own**
  already-approved `nav.knowledge` value; the duplicated English `<title>` literal in
  the EN index route was collapsed onto `site-copy.pageMeta`.
- `product-view.tsx`: only the `articles.slice(0, 2)` selection changed.
- `answers.ts` header corrected (one expanded answer, not three) and
  `tasks/03-knowledge-expansion.md` corrected (30 answers, not 31) and marked
  superseded rather than executed.
- Task 61 assertions appended to `tests/intl-dees-001-es-de-localization.mjs`;
  `package.json` untouched so the new tests run inside the existing `test:seo` set.

## 2026-09-11 — Deviation recorded during implementation

- Card §3 asks for the six-category model to be implemented; card §7 forbids
  manufacturing ES/DE/ZH translations. Only "Applications" has an exact approved
  four-locale string, and `intl-dees-001` REQ 3 rejects any ES/DE dictionary leaf that
  merely equals its English. Rather than invent five translations or print English
  chrome on the fully translated `/zh` surface, groups render a heading only when their
  members agree on a label that already exists in four locales and there is more than
  one member. With four articles in four distinct categories, **`/knowledge` renders
  no group headings today**; the classifier, ordering and fail-closed guard are live
  and tested. Raised as Coordination Item 1 for the reviewer and owner to accept or
  overrule with supplied translations.
- `zh.ts` and `es.ts` were missed in the first rename pass and caught only by
  `git status`, not by the type system — `zh` is dictionary-typed but `es`/`de` merge
  toward English silently. The new "one name per locale" test now covers all four.

## 2026-09-11 — Validation and two real defects found by the new tests

- First run of the appended guards failed twice, both genuine:
  1. `sharedLabel` compared `categories.length` instead of distinct values, so a
     legitimate two-article group earned no heading. Fixed to deduplicate via a `Set`.
  2. The explanatory code comment written into both article routes quoted the banned
     literals (`PVA knowledge`, `answersIndex.aboutHeading`), so the source-text
     guards failed on the comment rather than the code. Comments reworded and the
     strict guards kept, matching this repository's existing convention of banning
     forbidden text in source including comments.
- Final gates at the delivered state:
  - `npm run typecheck` — clean.
  - `npm run lint` — clean, exit 0.
  - `npm run build` — clean, 225 static pages / 222 HTML documents, unchanged from baseline.
  - `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` — **231 pass, 0 fail, 0 skipped**
    (221 before this task; +10 Task 61 guards).
  - `npm run test:first-wave` — 5 pass.
  - Document comparison: article `<article>` prose identical in all 16 documents
    (4 slugs × `en`/`zh`/`es`/`de`); section headings and paragraphs present in order;
    no list/table/figure markup appears anywhere the model declares no such block.
  - Byte guard moved the right way: `averageUntouched` 75,369 B → **75,230 B**;
    `averageAll` 78,201 B → 78,065 B. The decrease is the intended narrowing of
    related links, and both ceilings are met with more margin than at baseline.
- Guard strength was checked by mutation against a disposable copy under
  `.qwen/tmp/mutant61` (created, run, deleted; the reviewed tree was never edited and
  `git status` stayed scoped to the allowlist). Planting a third locale key on
  `sections` — a body that still validates internally but that the seam stops
  recognising — failed exactly the intended guard and left the other eight passing,
  which is the expected signature for a silent-failure class that only that guard sees.

## 2026-09-11 — Two mistakes this task made and repaired before delivery

Recorded because a reviewer should not have to rediscover them from a diff.

1. **Line endings destroyed in two dictionary files.** `src/content/i18n/de.ts` and
   `src/content/i18n/es.ts` are the only two edited files stored with CRLF in the
   base blob (`3d01f21`: 392 and 391 CRLF lines). The file-editing tool wrote them
   back as LF, so a three-line change appeared as a 786-line and 783-line rewrite —
   unreviewable, and guaranteed to conflict with anyone else touching those files.
   Detected only because `git log --stat` looked wrong, not by any gate: typecheck,
   lint, build and all 231 tests passed happily on the corrupted diff.
   Detection rule that worked: compare `git diff --stat` against
   `git diff --stat --ignore-cr-at-eol`; a file whose raw count greatly exceeds its
   CR-insensitive count has had its endings rewritten. `en.ts` and `zh.ts` were
   already LF and were unaffected.
2. **Character corruption while fixing it.** The first repair script read the base
   blob as UTF-8 and wrote it back with `"binary"`, which re-encoded every accented
   character in those two files as replacement glyphs (`selección` → `selecci\uFFFDn`).
   Caught by reading the staged diff before committing it. Repaired by restoring
   both files from `3d01f21` with `git restore --source --staged --worktree`, then
   re-applying the change as UTF-8 with CRLF restored.

Post-repair verification, all on the delivered tree:

- `git diff --stat` vs `--ignore-cr-at-eol` agree for **every** changed file, and a
  byte sweep reports 0 replacement characters, 0 mixed-ending files.
  `de.ts` is now a 4-line diff and `es.ts` a 3-line diff.
- Re-run of all gates after the repair: typecheck clean, `eslint .` exit 0,
  build clean at 225 pages, `REQUIRE_BUILD_OUTPUT=1 npm run test:seo`
  **231 pass / 0 fail / 0 skipped**, body integrity PASS on all 16 article documents.
- Final byte measurements: `averageUntouched` **75,230 B** (baseline 75,369 B,
  ceiling 76,800 B) and `averageAll` **78,061 B** (ceiling 79,200 B).

Lesson carried forward: on this repository a green test suite does not prove the
diff is clean. Line endings and encoding must be checked against the base blob
separately, and any whole-file diff on a file this task changed three lines of is a
defect until proven otherwise.

## 2026-09-11 — Deliberately not done

- No article copy written; no R1–R8. No number, test value, setpoint or case added.
- No ES/DE/ZH translation of article bodies; no evidence record; `SECTION_SURFACES`
  left empty, so no reviewer name or date was ever required or fabricated.
- No route, sitemap, canonical, hreflang, redirect or `globals.css` change.
- No merge, and no push beyond the task branch.
- `home-knowledge.tsx` (`slice(0, 3)`) and the product page's answer links were left
  alone: both change visible text on pages outside this card's goal.
