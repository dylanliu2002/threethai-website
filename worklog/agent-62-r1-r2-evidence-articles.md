# Task 62 Worklog — R1 and R2 rewritten on repository-published evidence

## 2026-09-11 — Assignment and base

- Executor Platform: `Qwen Code`. Provider and model family not pinned. Role
  `SEO_CONTENT`, mode `IMPLEMENT`.
- Branch `codex/62-knowledge-r1-r2-evidence`, worktree
  `worktrees/agent-62-knowledge-r1-r2-evidence`, base `origin/main` = `aa5c2bc`,
  re-fetched at creation. Task 61's block model and four-locale naming were already
  merged through PR #42; PR #43's visible-grouping commit was not, and is not needed
  here.
- Identity set and verified as `dylanliu2002 <dylanliu2002@gmail.com>`. Real
  `npm ci` in the worktree (exit 0); the `node_modules` junction that repository
  `AGENTS.md` suggests breaks Turbopack on this host and was not used.
- The implementer is not the reviewer; the card moves to `REVIEW`, not `APPROVED`.

## 2026-09-11 — A scope limit found before writing any copy

`card-copy.ts` `ARTICLE_TEASERS` mirrors each article's `category`, `title` and
`intro` in `{ en, zh, es, de }` and throws when the English or Chinese side drifts
from the entity. Rewriting an English headline would therefore leave the Spanish and
German listing cards quoting a headline that no longer exists — and refreshing those
would mean authoring translation no reviewer has signed, which §7 forbids.

Decision: deepen `sections` only. It is `Record<ContentLocale, …>`, i.e. `{ en, zh }`,
so ES/DE article pages keep resolving English bodies through the promotion seam
exactly as before. No card string goes stale, no translation is invented. The four
mirrored fields are asserted unchanged in the new test set.

## 2026-09-11 — What was written

- **R1, dissolution-temperature selection.** The repository publishes **seven**
  process targets (20/40/55/60/70/80/90 °C); the article named three. It now names
  all seven and states plainly that the headline carries three because those are what
  buyers search. Adds a five-stage removal table with the situation each stage is a
  defensible endpoint for, a seven-step ordered test method, a four-term definition
  list (process target, endpoint, liquor ratio, residual condition), two callouts and
  four inline links.
- **R2, batch consistency.** This is the evidence-placement fix: a table of the
  documents that actually exist — ISO 9001 `23226Q00380R101` with its scope and both
  issue dates, OEKO-TEX `SH005 149658` Class I Annex 6 for raw-white 100 pct PVA
  yarn valid to 31 Jan 2027, TESTEX `SH005 275198.1` with pH 6.2 and the parameter
  classes, SGS `SL22002263585101TX` on a 7.5 tex sample with its four test items —
  plus batch release records and shipping documents, and a third column stating what
  each **does not** prove, including that the SGS report is a 2020 single-sample
  point-in-time record rather than a typical value. Five registered sampling,
  steaming and conditioning devices are cited as registered records, with an explicit
  note that a patent number is not a performance claim. It closes with the figures
  deliberately absent and why.
- Both locales authored block-for-block; `assertAlignedBody` enforces the shape match
  instead of trusting the author.
- `dateModified` advances to 2026-09-11 for exactly these two slugs. `articles.ts`
  now refuses a re-authored body with no revision date, and a revision date with no
  re-authored body, so provenance metadata cannot drift in either direction.
- The two articles outside this task: 0 bytes changed, all four locales.

## 2026-09-11 — Two defects my own tests caught

1. The first figure-traceability check compared **substrings**. The planted fake
   strength `42.7 cN/tex` **passed**, because `42.7` is the tail of the unrelated
   patent application number `ZL 2020 1 0227142.7`. Fixed by extracting whole numeric
   tokens from prose and source alike; a negative control now asserts the invented
   value is rejected. Without that control the check would have looked green while
   accepting any number embedded in some identifier.
2. The fabricated-claim filter used a bare `/guarantee/i` and flagged the sentence
   *"not a guarantee that removal completes…"* — copy **denying** a guarantee failed
   the ban on claiming one. Narrowed to affirmative promises.

Also corrected from Task 61 reporting: the "1,431 B of headroom" figure was computed
over 112 documents while the guard walks 110. Honest headroom on `origin/main` was
**345 B**.

## 2026-09-11 — Byte-budget conflict: escalated, then fixed at the owner's direction

`intl-dees-003b`'s document guard failed (mean of 110 untranslated documents
76,455 B before, 77,152 B after, ceiling 76,800 B). Investigated before concluding,
because a growth signal is also a leak signal: only 8 of 222 documents changed size,
214 changed by exactly 0 bytes, and inline flight is ~70 pct of document bytes on
untouched pages as well — so the increase is content, not a serialization defect
introduced here.

The ceiling was **not** raised, the 76,384 B baseline was **not** re-baselined, and
the copy was **not** trimmed. A `SHARED FILE CHANGE REQUEST` was written into the card
with the measurement that an average cannot separate a systemic leak from content, and
that only 345 B of headroom remained, so no article could improve under it.

The owner approved changing the guard. Implemented as a change of statistic, not a
removal:

- both ceilings compare the **median** of the same populations, pinned at measured
  values — EN/ZH `< 70_200` (69,641 before / 69,655 after), all-document
  `< 71_500` (70,951 / 70,971);
- means are reported in the failure text, not asserted;
- a new test asserts the properties the substitution depends on: a uniform +1,684 B
  leak moves the median by exactly 1,684 B, four documents gaining 20 KB move it far
  less both above and below the middle (the latter being the rank-shift worst case),
  and the mean still moves 727 B, which is the recorded reason it could not stay the
  ceiling;
- every other assertion in that file is untouched, including the client-chunk
  policy-string scan and the INTL-DEES-002B bundle-size bound.

Residual, for the reviewer: a leak confined to a minority of documents would not move
the median. The per-route "content-free routes must not grow" assertion in the change
request would close that and is left as the follow-up.

## 2026-09-11 — Final gates

- typecheck clean · `eslint .` exit 0 · build clean, 225 pages / 222 documents.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **236 pass / 0 fail / 0 skipped**
  (was 234 pass / 1 fail before the approved guard change).
- `intl-dees-003b` alone: 14 pass / 0 fail.
- Render: R1 394 → 1,207 words, R2 342 → 1,401 words; tables with captions and
  `scope` attributes; ordered lists; definition lists; inline links; **zero
  `<script>` inside the article region**.
- Line-ending and encoding sweep clean; the Chinese copy renders CJK in `/zh`.
- Committed and pushed to `codex/62-knowledge-r1-r2-evidence`. Not merged.

## 2026-09-11 — Deliberately not done

- No new technical or commercial claim; no figure absent from this repository. No
  dissolution time, strength, tolerance, setpoint, capacity, MOQ, lead time, export
  market or customer.
- No change to titles, intros, categories or meta descriptions, hence no new ES/DE
  translation.
- No route, canonical, hreflang, sitemap, `SECTION_SURFACES` or evidence-record
  change. No promotion.
- R3–R8 and the two articles outside this task.
- The Chinese bodies were authored here to match the English structure and need a
  native read-through before merge.
