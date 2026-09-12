# Task 64 — R-series knowledge articles (R4–R9) on the repository's own evidence

- **Task Key:** `content-quality-001b2-r-series-codex-64`
- **Machine Contract:** None
- **Task ID:** `64`
- **Title:** Write the R4–R9 knowledge articles on evidence the repository already publishes
- **Mode:** `IMPLEMENT`
- **Role:** `SEO_CONTENT`
- **Execution Profile:** `STANDARD`
- **Executor Platform:** `Qwen Code`
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `codex/62-knowledge-r1-r2-evidence`
- **Worktree:** `worktrees/agent-62-knowledge-r1-r2-evidence`
- **Owner:** implementer, not self-approving
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** Task 62 (block model; R1/R2/R3 delivered on this branch), `tasks/64-r-series-plan.md` (the authorization plan)
- **blocks:** nothing

This card is the execution record for the plan in `tasks/64-r-series-plan.md`. The
plan holds the article-by-article rationale and is not duplicated here; this card
records what was built, on which evidence, and what the guards did.

## Why the branch is 62's and not a new one

The plan states its base plainly: **continue on `codex/62-knowledge-r1-r2-evidence`**.
Task 62 already owns that branch and worktree, the block model and the R1–R3 bodies
live there, and `codex/NN-*` is a repository namespace rather than an executor
assignment, so one branch owning the whole R-series keeps the article set in one
reviewable range. The consequence is deliberate and goes to the reviewer: this
task's artifacts (`tasks/64-*`, `worklog/agent-64-*`) are committed on Task 62's
branch, and Task 62's own card/worklog are unchanged by this task.

## Goal

CONTENT-QUALITY-001A found the company's verifiable evidence siloed: `quality.ts`
and `patents.ts` carry 96 references to certificate numbers, report numbers,
parameters and registered devices, while the file holding every article, answer and
product page carried 1. Task 61 removed the template ceiling; Task 62 re-authored R1
and R2. This task writes the remaining six pages on the same terms: a parameter
table, a list, a definition list where the content is a definition, callouts, and
inline internal links — with **every figure traceable to a source already in the
repository** and no invented fact.

## Delivered

| # | Slug | Words (EN body) | Commit |
| --- | --- | --- | --- |
| R4 | `water-soluble-pva-yarn-knitting` | 1,503 | `28f2024` |
| R5 | `water-soluble-sewing-thread-guide` | 1,416 | `58dec64` |
| R6 | `pva-staple-fiber-vs-filament-yarn` (extended, no new slug) | 1,459 (+1,201 over the 258-word legacy copy) | `2bed364` |
| R7 | `pva-dissolution-in-textile-processing` | 1,817 | `ef541bd` |
| R9 | `pva-sample-to-production-testing` | 1,475 | `30d9322` |
| R8 | `how-to-evaluate-water-soluble-pva-supplier` | 1,508 | `b32517f` |

Written in the plan's order — R4 → R5 → R6 → R7 → R9 → R8 — so the technical
credibility lands before the commercial piece. Each new slug is three files
(`article-<slug>-en.ts`, `article-<slug>-zh.ts`, the `article-additions.ts` spec) plus
its `card-copy.ts` teaser and `article-related.ts` edge, all reusing the approved
`Technical guide` / `技术指南` category so no grouping registry changed. R6 opens no
slug: `/knowledge/pva-staple-fiber-vs-filament-yarn` and its answer already own the
question, the one cannibalisation 001A confirmed.

Measured on the delivered tree (head `b32517f`, worktree clean): English body word
counts above are the EN `sections` text leaves (headings, paragraphs, prose/list/
definition spans, table caption, columns and cells). Excluding the section headings
the same bodies measure R4 1,423 · R5 1,335 · R6 1,410 · R7 1,728 · R9 1,416 ·
R8 1,456.

**One band reading is reported rather than silently resolved.** R4 measures 1,503
with its ten section headings counted and 1,423 without; the brief's band is
1,200–1,500. It therefore sits inside the band on the body measure and three words
above the ceiling on the widest measure. It is left as authored — the ceiling is a
measure question, not a content defect, the body was verified and pushed as-is, and
the implementer does not self-approve — and it is handed to the reviewer and the
owner to call. Every other article is inside its band on both measures.

## Evidence (what each article rests on)

- **R4.** `applications.ts` knitting entry (production problem, the three routes in,
  why the support is temporary, selection variables, testing guidance);
  `legacy-source.ts products[0].technicalOverview` for the seven process targets;
  `patents.ts` `CN 218520715 U`, granted 2023-02-24, for the openwork single-jersey
  device.
- **R5.** `legacy-source.ts` sewing-thread product entry and the `applications.ts`
  embroidery-sewing entry; the seven process targets; the two catalogue pairings the
  20 °C and 60 °C groups carry. The closing section distinguishes a sample, a pilot
  run and a production order in this article's own words, because the source answer's
  own framing is blocked by the forbidden-claim guard.
- **R6.** `applications.ts` five processing positions; `catalog.ts` four material
  forms; `legacy-source.ts` the migrated page; `patents.ts` the granted device
  patents; `quality.ts` certificate scope, cited as scope and never as a performance
  claim.
- **R7.** `legacy-source.ts` dissolution-guide article (the variable set and the
  compare-samples protocol); `products[0].technicalOverview` seven process targets;
  `catalog.ts` temperature groups and co-variables; `factory.ts` the low-to-high
  temperature range. The troubleshooting section is a table of questions to
  investigate, never asserted causes.
- **R9.** `products[0].processGuide` (the trial sequence); the answer
  `sample-order-process-pva-water-soluble-yarn` (five-step sample process); the answer
  `test-pva-yarn-dissolution-temperature`; the seven process targets; `catalog.ts` bath
  vocabulary. The brief's downloadable worksheet is a separate asset task, so the
  article never links to it.
- **R8.** `quality.ts certificates[0]` (ISO 9001 system certificate), `[2]`
  (OEKO-TEX Standard 100 Class I, raw white), `[3]` (TESTEX report);
  `products[0].technicalOverview` seven process targets; `patents.ts`
  `inventionPatents` + `utilityPatents` (the granted devices, named without digits) and
  `foreignPatents` (Malta, Nigeria); the answers
  `best-pva-water-soluble-yarn-manufacturers-china` (which already refuses
  self-ranking — the piece R8 deepens) and `verify-chinese-pva-yarn-factory`; the
  routes `/quality`, `/manufacturing`, `/request-sample`.

Every figure in every body is a whole numeric token already present in `quality.ts`,
`patents.ts`, `factory.ts`, `legacy-source.ts`, `applications.ts` or `catalog.ts`; the
figure-traceability guard reports none untraceable. Nothing states a dissolution time,
a mechanical value, a twist figure, a machine speed, a bath ratio, a residue limit,
capacity, headcount, order quantity, lead time or price, and the never-use list from
§9 of the brief is honoured throughout.

## Guard friction, and why each fix is what it is

1. **`intl-dees-001` untouched-legacy floor (R6).** The guard pinned
   `untouchedLegacy.length >= 2` — "no article left that is still migrated copy".
   `articles.ts` offers exactly two body paths for a published slug and R6 may not open
   a new slug, so re-authoring the page necessarily drops it out of that set, leaving
   exactly the one migrated article task 64 forbids touching
   (`pva-yarn-buyer-specification-checklist`). The floor was changed to an exact
   assertion naming that slug, commented with the reason. Not a loosening: the legacy
   fold still runs over the article that remains, and a further re-author fails loudly
   instead of quietly reducing the fold's coverage to nothing. **Authorized by the task
   owner; the reviewer should read that diff specifically.**
2. **`intl-dees-001` related-footline guard (R6, carried forward by R7/R9/R8).** The
   footline check reads the visible text between `</article>` and `<footer>` and fails
   on any undeclared product name; related-article cards render in that footline and
   their titles name a PVA yarn R6–R8 never offer. R6's articles bucket was reverted to
   `NONE` (restoring the reviewed pre-task state), and R7, R9 and R8 declare only the
   yarn product and the two answers their own reasoning rests on, carrying the
   cross-article reading inside the body prose where the link text belongs to the
   article rather than to a card.
3. **`intl-dees-003b` byte budget (R4, R5, R7, R9, R8).** The guard refuses a
   document that is not budgeted, so each new slug's first landing regenerates the
   baseline of `tests/intl-dees-003b.document-baseline.json` with
   `set UPDATE_DOCUMENT_BUDGET=1&&` (never chained with a further `&&`). The diff each
   time shows the added document pins and the grown `/knowledge` index pages; the
   passing run then reports 0 moved documents.
4. **R6 needed no rebuild growth**: it edits an existing route, so the static page
   count was unchanged at 241 and only the baseline content changed.

## Validation (per article, on the delivered tree)

- `npm run typecheck` — clean; `npm run lint` — clean.
- `npm run build` — exit 0; static pages 237 (R4) → 241 (R5) → 241 (R6, no new route)
  → 245 (R7) → 249 (R9) → **253** (R8). Each new slug adds four prerendered documents
  (en/zh/es/de).
- `set UPDATE_DOCUMENT_BUDGET=1&& node --test --import ./tests/support/ts-extension-hooks.mjs
  tests/intl-dees-003b-server-client-boundary.mjs` — baseline regenerated per landing
  (236 documents after R6, 240 after R7, 244 after R9, **248** after R8); each plain
  run then reports **19 pass / 0 fail / 0 skip** with 0 moved documents.
- `set REQUIRE_BUILD_OUTPUT=1&& npm run test:seo` — **243 pass / 0 fail / 0 skip** on
  every landing (includes the TASK 62 figure-traceability, forbidden-claim, structure
  and shipped-`/zh` tests).
- `npm run test:first-wave` — **5 pass**.
- `git diff --stat` equals `git diff --stat --ignore-cr-at-eol` at each commit.
- The R1/R2/R3 bodies are byte-unchanged; no threshold was raised and no content
  deleted; `CONTENT_GROWTH` in `intl-dees-003b` is still `[]`.

## Scope

**In scope / changed** (the whole `c171213..b32517f` range):

```text
A  src/content/article-water-soluble-pva-yarn-knitting-{en,zh}.ts          R4
A  src/content/article-water-soluble-sewing-thread-guide-{en,zh}.ts        R5
A  src/content/article-pva-dissolution-in-textile-processing-{en,zh}.ts    R7
A  src/content/article-pva-sample-to-production-testing-{en,zh}.ts         R9
A  src/content/article-how-to-evaluate-water-soluble-pva-supplier-{en,zh}.ts R8
M  src/content/article-body-patches.ts            R6 body (only 2bed364 in this range;
                                                  the R1/R2 entries in this file predate c171213)
M  src/content/article-title-patches.ts           R6 title
M  src/content/article-additions.ts               spec + registrations, R4–R9
M  src/content/article-related.ts                 related edge, R4–R9
M  src/content/card-copy.ts                       four-locale teaser, R4–R9
M  src/content/articles.ts                        R6 revision date
M  tests/intl-dees-001-es-de-localization.mjs     R6 untouched-legacy floor, owner-authorized
M  tests/intl-dees-003b.document-baseline.json    regenerated per landing
```

   plus this card and its worklog.

**Out of scope / untouched:** the R1/R2/R3 bodies; any new slug for R6; the grouping
registry; `main` and every other task's branch; ES/DE promotion; any `NEEDS_COMPANY_INPUT`
fact (dissolution times, strength, tolerances, setpoints, capacity, MOQ, lead time,
markets, customer names).

## Open human-side items (must not be reported as done)

1. **es/de listing-card drafts need translator review.** Each `ARTICLE_TEASERS` entry
   carries `es`/`de` drafted against the file's glossary under a
   `PENDING TRANSLATOR REVIEW` marker; `en`/`zh` are byte-equal to the entity or
   `articleCard()` throws, but no reviewer has signed the es/de copy.
2. **The Chinese bodies are authored here and need a native read.** They are guarded
   for structure, for "is Chinese", and for positional divergence from English, plus a
   shipped-`/zh` heading check — but no test says whether a native technical writer
   would write them the same way.
3. **PR #43 must merge or be rebased against this branch** (both touch
   `resources-groups.ts` and the 001 hub test).
4. **Independent review.** The implementer cannot approve the implementer's work; this
   card stays `REVIEW`.
5. **R4's band reading** — see Delivered above.

## Review Status

- Outcome: Pending
- Independent reviewer evidence:

## Completion Record

- Commits pushed to `origin/codex/62-knowledge-r1-r2-evidence`: `28f2024` (R4),
  `58dec64` (R5), `2bed364` (R6), `ef541bd` (R7), `30d9322` (R9), `b32517f` (R8).
  **Not merged, and no pull request opened by this task.** Head `b32517f`.
- Base: `origin/main` @ `aa5c2bc` (Task 62's base), plan commit `c171213`.
- Git identity verified `dylanliu2002 <dylanliu2002@gmail.com>` on every commit.
- Remaining risks: the es/de drafts, the native-zh read, and the untouched
  `products.ts:254` vs `:260-266` extended-formats contradiction are all still open.
  Verification is against a local prerender, not a deployed environment.

## Rollback

Delete the branch, or `git revert` the R-series commits; nothing is deployed. Removing
the `newKnowledgeArticles` entries and the two body files per slug returns the hub to
the R1–R3 set, and reverting `2bed364` restores the R6 page to its migrated copy.
