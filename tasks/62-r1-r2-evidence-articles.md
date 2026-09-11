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
- **Status:** `BLOCKED` — on the byte-budget guard in Coordination Item 1
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
tasks/62-r1-r2-evidence-articles.md                     (this card)
worklog/agent-62-r1-r2-evidence-articles.md
```

## Forbidden / Shared Files

`package.json`; all of `src/content/i18n/**`; `src/content/card-copy.ts`;
`src/content/legacy-source.ts`; `src/app/**`; `src/components/**`;
`tests/intl-dees-003b-server-client-boundary.mjs` (owned by INTL-DEES-003B — see
the change request); `src/content/page-surfaces.ts`; sitemap, proxy, `next.config.ts`.

## Validation

```bash
npm ci
npm run typecheck        # clean
npm run lint             # exit 0
npm run build            # 225 pages / 222 documents, unchanged route set
REQUIRE_BUILD_OUTPUT=1 npm run test:seo
```

Measured results on the delivered tree:

- typecheck clean; lint clean; build clean, 225 pages, route set unchanged.
- `test:seo`: **235 tests, 234 pass, 1 fail**. The single failure is
  `intl-dees-003b:452` "documents did not grow to pay for the boundary" — see
  Coordination Item 1. Every Task 61 and Task 62 guard passes, including the
  negative control proving invented figures are rejected.
- Growth is **concentrated, not systemic**: only 8 documents changed size at all
  (2 slugs × 4 locales); the other 214 are byte-identical. The four EN/ZH article
  documents account for 100 pct of EN/ZH growth (+76,660 B, mean +697 B across the
  110 documents the guard averages).
- Inline flight is ~70 pct of every document, on untouched pages too
  (`about.html` 70 pct, product page 69 pct), so the increase is content, not a
  duplication defect.
- Line endings and encoding sweep clean: `git diff --stat` equals
  `git diff --stat --ignore-cr-at-eol`; no replacement characters.

## Coordination Items

1. **BLOCKER — the byte-budget guard cannot survive any article improvement, and
   the honest fix is to the guard, not to the content.**
   The ceiling is an average over 110 untranslated documents:
   `averageUntouched < 76_800`, cited against a "76,384 B before" baseline — i.e.
   416 B of design headroom. Measured on `origin/main` **before this task's
   content**, using that test's own walk, the average is already **76,455 B**, so
   only **345 B** of the ceiling remains, consumed by work merged after the
   baseline was recorded. This task needs 697 B of mean, for growth the guard was
   never written to allow: it exists to catch *the serialized dictionary or a
   policy reaching every document*, and it cannot distinguish that from four
   documents legitimately getting better.
   Deliberately not done: the ceiling was not raised, `76,384` was not re-baselined,
   and the content was not trimmed to slip under an average that is already 94 pct
   spent. Trimming would make this task pass by undoing its purpose, and every
   later article rewrite would hit the same wall.
   Options for the owner and the independent reviewer, in order of preference:
   (a) accept the change request below, so the guard measures leaks specifically;
   (b) shorten R1/R2 back toward the current size, which forfeits the improvement;
   (c) block R3–R8 permanently, since no article can grow under this metric.

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

- Commits: local on `codex/62-knowledge-r1-r2-evidence`; **not pushed**, because a
  validation gate is red and Coordination Item 1 is unresolved
- Base: `origin/main` @ `aa5c2bc` (verified current at branch creation)
- Changed files: `src/content/article-body-patches.ts` (new), `src/content/articles.ts`,
  `tests/intl-dees-001-es-de-localization.mjs`, this card, the worklog
- Remaining risks: see Coordination Item 1; ZH body copy is authored by this task and
  needs a native read-through before merge.

## Rollback

`git revert` the task commits, or delete the branch — nothing is deployed. Removing
`article-body-patches.ts` and the `articles.ts` lookup returns both articles to the
legacy tuple fold, so the pages render their previous text with no other change.
