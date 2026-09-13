# Task 62 — R1 and R2: evidence-led knowledge articles on the new block model

- **Task Key:** `content-quality-001b2-r1-r2-evidence-codex-62`
- **Machine Contract:** None
- **Task ID:** `62`
- **Title:** Rewrite the dissolution guide and the batch-consistency article on real evidence
- **Mode:** `IMPLEMENT`
- **Role:** `SEO_CONTENT`
- **Execution Profile:** `STANDARD`
- **Executor Platform:** `Qwen Code`
- **Priority:** `P1`
- **Status:** `REVIEW` — the byte-guard blocker was cleared by the owner on 2026-09-11 (see Coordination Item 1)
- **Risk:** `MEDIUM`
- **Branch:** `codex/62-knowledge-r1-r2-evidence`
- **Worktree:** `worktrees/agent-62-knowledge-r1-r2-evidence`
- **Owner:** implementer, not self-approving
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** Task 61 (block model, merged via PR #42)
- **blocks:** R3–R8

## Goal

CONTENT-QUALITY-001A measured the cause of weak articles: the company's verifiable
evidence is siloed. `quality.ts` and `patents.ts` carry **96** references to
certificate numbers, report numbers, parameters and registered devices; the file
holding all four articles, thirty answers and four product pages carries **1**. The
four article bodies contained **2 digits in total**, no lists, no tables, no links.

Task 61 removed the template ceiling. This task uses it: R1 (dissolution-temperature
selection) and R2 (batch consistency) are rewritten so the buyer gets specifics and
the credibility comes from documents the company already publishes.

## Success Criteria

- Article bodies carry real structure: a parameter table, an ordered procedure, a
  definition list, callouts and inline internal links. Measured on the render:
  R1 394 → 1,207 words and R2 342 → 1,401 words, tables 1 each, `scope="col"` 3,
  `scope="row"` 5/6, captions 1 each, zero `<script>` in the article region.
- Every published figure traces to a source already in the repository — enforced by
  a test, and that test is itself proved able to fail by a planted invented figure.
- The other two articles are byte-for-byte untouched.
- No route, URL, canonical, hreflang or sitemap change.

## In Scope

- `src/content/article-body-patches.ts` (new): block bodies for the two articles, EN and ZH.
- `src/content/articles.ts`: use a re-authored body when present; advance
  `dateModified` only for re-authored articles, and refuse a body without a
  revision date or a date without a body.
- `tests/intl-dees-001-es-de-localization.mjs`: replace Batch 0's
  "no copy changed" guard (this task intentionally breaks it) with the two guards
  above plus headline-freeze and structure assertions.

## Out of Scope

- R3–R8; the two articles not rewritten; `NEEDS_COMPANY_INPUT` facts (dissolution
  times, strength values, tolerances, setpoints, MOQ, lead time, capacity, markets).
- Titles, intros, categories and meta descriptions — see the constraint below.
- ES/DE promotion; `SECTION_SURFACES`; any localization.

## Why headlines were not rewritten

`card-copy.ts` `ARTICLE_TEASERS` mirrors `category`, `title` and `intro` in
`{ en, zh, es, de }` and throws when the English or Chinese side drifts from the
entity. Changing an English headline would leave the Spanish and German listing
cards quoting the old one, and updating those would mean authoring unreviewed
translation. The body is `{ en, zh }` only, so depth was added there.

## File Allowlist

```text
src/content/article-body-patches.ts                     (new)
src/content/articles.ts
tests/intl-dees-001-es-de-localization.mjs
tests/intl-dees-003b-server-client-boundary.mjs        (added by owner approval,
                                                        2026-09-11 — see item 1)
tasks/62-r1-r2-evidence-articles.md                     (this card)
worklog/agent-62-r1-r2-evidence-articles.md
```

## Forbidden / Shared Files

`package.json`; all of `src/content/i18n/**`; `src/content/card-copy.ts`;
`src/content/legacy-source.ts`; `src/app/**`; `src/components/**`;
`src/content/page-surfaces.ts`; sitemap, proxy, `next.config.ts`.
`tests/intl-dees-003b-server-client-boundary.mjs` was added to the allowlist by the
owner's approval of the request below; its INTL-DEES-003B author owns the file, so
the independent reviewer should read that diff specifically.

## Validation

```bash
npm ci                                  # real install; a node_modules junction breaks Turbopack
npm run typecheck
npm run lint
npm run build
REQUIRE_BUILD_OUTPUT=1 npm run test:seo
```

Measured on the delivered tree (2026-09-11):

- typecheck clean · `eslint .` exit 0 · build clean, 225 pages / 222 documents,
  route set unchanged from `origin/main`.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **238 pass / 0 fail / 0 skipped**.
  Sequence: 234 pass / 1 fail (byte guard) → guard changed under owner approval →
  236 → +2 Chinese-language guards → 238. `intl-dees-003b` alone: 14 pass / 0 fail,
  so the bundle-size bound and the policy-string scan this task did not touch are
  intact.
- **The Chinese bodies are guarded, not assumed.** `assertAlignedBody` compares block
  *shapes* and the figure filter scans both locales, so pasting the English text into
  `zh` would have passed every earlier guard while `/zh` — a fully translated,
  indexed surface — rendered English. Two guards added: every reconstructed zh prose
  unit must contain Chinese characters and must not equal its English counterpart at
  the same position; and the built `/zh/knowledge/<slug>.html` must carry every zh
  heading and **none** of the English ones. Table cells are exempt from the
  CJK requirement because they legitimately hold identifiers like `SH005 149658`;
  captions and column headers are not exempt, since they are the table's prose.
  A first draft of this guard failed on the string `"。"` — a prose span severed by
  an inline link — which is why units are rejoined before being tested rather than
  checked span by span.
- Rendered growth, per article: R1 394 → 1,207 words, R2 342 → 1,401 words; tables
  1 each (caption present, `scope="col"` 3, `scope="row"` 5 and 6); ordered lists 1
  and 2; definition lists 4 and 5 terms; inline links 4 and 3; **zero `<script>`
  elements in the article region**.
- The two articles outside this task differ by 0 bytes in all four locales.
- Byte growth is concentrated: 8 of 222 documents changed size (2 slugs × 4 locales),
  214 changed by 0 bytes, and the largest document in the build is unchanged.
  Inline flight is ~70 pct of bytes on grown and untouched documents alike
  (`about.html` 70 pct, a product page 69 pct), so the increase is content, not a
  serialization defect introduced here.
- Line endings and encoding sweep clean: `git diff --stat` equals
  `git diff --stat --ignore-cr-at-eol`; no replacement characters; the Chinese body
  copy renders CJK in `/zh`.

## Two defects found by my own tests during this task

Recorded because both would have shipped silently if the tests had been weaker.

1. The first figure-traceability check compared **substrings**, and the planted fake
   strength `42.7 cN/tex` **passed** — because `42.7` is the tail of the unrelated
   patent application number `ZL 2020 1 0227142.7`. Fixed by extracting whole numeric
   tokens from prose and source alike, and the negative control now proves the
   invented value is rejected.
2. The fabricated-claim filter used a bare `/guarantee/i` and flagged the sentence
   *"not a guarantee that removal completes…"* — copy that **denies** a guarantee
   failed the ban on claiming one. Narrowed to affirmative promises.

A third item belongs to Task 61's reporting rather than this code: the "1,431 B of
headroom" figure given earlier was computed over 112 documents while the guard walks
110, and the honest headroom on `origin/main` was **345 B**.


## Coordination Items

1. **RESOLVED — the byte-budget guard was changed, with the owner's approval.**
   The ceiling is an average over 110 untranslated documents:
   `averageUntouched < 76_800`, cited against a "76,384 B before" baseline.
   Measured with that test's own walk, `origin/main` already sat at **76,455 B**
   before this task, leaving **345 B**; the two rewrites moved the mean to
   **77,152 B** while 214 of 222 documents changed by 0 bytes. An average cannot
   separate a systemic leak (every document grows) from content (four documents
   grow), so it blocked the task's own purpose.
   Owner chose: accept the change request and fix the guard. Implemented as a
   change of statistic, not a deletion — the leak it was written for is still
   caught, and more tightly:
   - both ceilings now use the **median** of the same populations, pinned at
     measured values with real headroom — EN/ZH median `< 70_200` (measured 69,641
     before / 69,655 after), all-document median `< 71_500` (70,951 / 70,971);
   - the means are reported in failure text, not asserted;
   - a new test asserts the properties the substitution depends on: a uniform
     +1,684 B leak moves the median by exactly 1,684 B, four documents gaining
     20 KB move it by far less, and the mean still moves 727 B — which is the
     recorded reason the mean could not stay the ceiling;
   - every other assertion in the file is untouched: client-chunk policy-string
     scan, INTL-DEES-002B bundle size, switcher path coverage, head alternates.
   Residual risk for the reviewer: the median is insensitive to a leak confined to
   a minority of documents. That is a narrower blind spot than the mean had, and it
   is covered by the untouched bundle-size and policy-string guards; if the owner
   wants it closed, the per-route "content-free routes must not grow" assertion
   from the request is the follow-up.

   Original request, kept as the record of what was approved:

```text
SHARED FILE CHANGE REQUEST
File: tests/intl-dees-003b-server-client-boundary.mjs
Task: 62 (R1/R2 evidence-led article rewrite)
Reason: The document-size guard averages 110 untranslated documents to detect a
  systemic dictionary or policy leak, so it cannot distinguish a leak from four
  documents legitimately gaining content. On origin/main its headroom is already
  down to 345 B (measured 76,455 B against the 76,800 B ceiling, vs a recorded
  76,384 B baseline), which any real article rewrite exhausts.
Exact proposed change: Keep the leak it detects and make it measure that leak.
  Assert (1) that documents on routes this task does not edit do not grow — the
  per-route average or the maximum per-document delta over a pinned route set —
  and (2) that the serialized dictionary in each untouched document does not grow,
  which is the actual mechanism of the INTL-DEES-003B failure. The aggregate
  average may remain an informational figure rather than a hard ceiling, or be
  re-derived per content task from a walk that excludes content routes.
Evidence: Before/after walks using the test's own filter: untouched EN/ZH 76,455 B
  -> 77,152 B, all 78,700 B -> 79,407 B; "documents changed at all: 12 of 222";
  the 4 EN/ZH article documents are 100 pct of EN/ZH growth; untouched routes
  including about.html and product pages differ by 0 B; inline flight share is
  ~70 pct on grown and untouched documents alike.
Tasks affected: 62 now; every future article rewrite (R3–R8) and any content
  addition under 11-B/11-C; INTL-DEES-003B owns the file and its intent.
Risk: Loosening a guard that caught a real leak. Mitigated by keeping the
  mechanism-specific assertions instead of deleting the check, and by requiring
  the before/after per-route walk to be attached to any content task that grows
  a document.
Validation: REQUIRE_BUILD_OUTPUT=1 npm run test:seo; the two new assertions must be
  shown to fail on a planted dictionary growth and to pass on this task's content
  growth.
```

## Review Status

- Outcome: Pending
- Independent reviewer evidence:

## Completion Record

- Commits pushed to `origin/codex/62-knowledge-r1-r2-evidence` — `a6b5ab9` plus the
  follow-up commit that adds the Chinese-language guards.
  **Not merged, and no pull request opened by this task.**
- Base: `origin/main` @ `aa5c2bc` (verified current at branch creation and again
  before push)
- Changed files: `src/content/article-body-patches.ts` (new), `src/content/articles.ts`,
  `tests/intl-dees-001-es-de-localization.mjs`,
  `tests/intl-dees-003b-server-client-boundary.mjs` (by owner approval), this card,
  the worklog
- Remaining risks:
  1. Shelf headings are the site's existing category labels, not the audit's six
     names, and three shelves are empty so they render nothing.
  2. Related content genuinely differs per article, so product and article pages show
     fewer links than before — intended by card §4, but it is a navigation change.
  3. Table / list / definition-list / callout / inline-link rendering is now exercised
     by shipped content, closing that Batch 0 caveat; `type: "heading"` (the `<h3>`
     block) is still covered only by the synthetic fixture, because neither rewrite
     needed a sub-heading.
  4. **The Chinese copy is authored by this task.** It is now *guarded* — every zh
     prose unit must contain Chinese and must not equal its English counterpart, and
     the built `/zh` page must carry the zh headings and none of the English ones —
     but no test can say whether it reads like a native technical writer wrote it.
     Terminology follows the existing zh dictionaries (浴比, 调湿, 条干均匀度, 回潮率,
     捻向, 卷装, 终点); a native read-through is still required before merge.
  5. The byte-guard change touches a file INTL-DEES-003B owns. The reviewer should
     read that diff specifically and decide whether the median's remaining blind spot
     — a leak confined to a minority of documents — is acceptable, or should be
     closed by the per-route assertion named in the change request.
  6. Verified against a local prerender, not a deployed environment.

## Rollback

`git revert` the task commits, or delete the branch — nothing is deployed. Removing
`article-body-patches.ts` and the `articles.ts` lookup returns both articles to the
legacy tuple fold, so the pages render their previous text with no other change.
