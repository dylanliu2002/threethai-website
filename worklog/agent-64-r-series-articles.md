# Task 64 Worklog — R4–R9 written on repository-published evidence

---
Task ID: 64
Role: SEO_CONTENT
Task: Write the R4–R9 knowledge articles on evidence the repository already publishes
Branch: codex/62-knowledge-r1-r2-evidence
Commit: b32517f (head); R4 28f2024 · R5 58dec64 · R6 2bed364 · R7 ef541bd · R9 30d9322 · R8 b32517f

Work Log:
- Read the plan `tasks/64-r-series-plan.md` and `docs/audits/resources-editorial-voice.md`
  before writing, then the ledger sources `applications.ts`, `legacy-source.ts`,
  `quality.ts`, `patents.ts` and `article-additions.ts`. The plan's order — R4 → R5 →
  R6 → R7 → R9 → R8 — was followed so the technical pages land before the commercial
  one.
- Wrote each slug as three files so no single tool call carries a full bilingual
  article (that truncation had already left an invalid module twice): `article-<slug>-en.ts`,
  `article-<slug>-zh.ts`, then the `article-additions.ts` spec. Each slug also gained a
  four-locale `ARTICLE_TEASERS` entry in `card-copy.ts` (en/zh byte-equal to the entity or
  `articleCard()` throws; es/de drafted and marked PENDING TRANSLATOR REVIEW) and a
  `relatedFor` entry in `article-related.ts`. Category reused, so no grouping-registry edit.
- R4 `water-soluble-pva-yarn-knitting` (1,503 words) — applications.ts knitting entry for
  the problem, the three routes in and the selection variables; the seven process targets;
  `patents.ts` CN 218520715 U (2023-02-24) for the openwork single-jersey device.
- R5 `water-soluble-sewing-thread-guide` (1,416 words) — the legacy-source.ts sewing-thread
  entry and the applications.ts embroidery-sewing entry. The guard blocks the source
  answer's own sample/order framing, so the closing section distinguishes sample, pilot run
  and production order in this article's own words instead.
- R6 `pva-staple-fiber-vs-filament-yarn` extended in place, **no new slug** (1,459 words,
  +1,201 over the 258-word migrated copy) — the four-row form table, added through
  `article-body-patches.ts` + `article-title-patches.ts`, with `dateModified` advanced and
  `reAuthoredOn` gaining the slug.
- R7 `pva-dissolution-in-textile-processing` (1,817 words) — owns the variables; the
  troubleshooting section is a table of questions to investigate, never asserted causes.
- R9 `pva-sample-to-production-testing` (1,475 words) — the `processGuide` trial sequence
  and the two sample answers. The brief's downloadable worksheet is a separate asset task,
  so the article never links to it.
- R8 `how-to-evaluate-water-soluble-pva-supplier` (1,508 words) — the ten-area framework as
  a 10-row `rowHeader` table; the deep version of the answer that already refuses to
  self-rank; closing section on `/quality`, `/manufacturing`, `/request-sample` and the
  granted devices, named without digits.
- Every figure is a whole numeric token already in `quality.ts`, `patents.ts`, `factory.ts`,
  `legacy-source.ts`, `applications.ts` or `catalog.ts`; the traceability guard reported none
  untraceable on any landing. `href`s are invisible to both the figure and forbidden-claim
  guards (they read text leaves only), which is why article link text may name a slug the
  guards would otherwise flag.

Stage Summary:
- Three guards shaped the copy rather than being worked around. (1) `intl-dees-001`'s
  untouched-legacy floor pinned `>= 2`; R6 re-authors one of the two remaining migrated
  articles and may not open a slug, so it was changed to an exact assertion naming the one
  article task 64 forbids touching (`pva-yarn-buyer-specification-checklist`), commented with
  the reason and **authorized by the task owner** — a disclosure the reviewer should read,
  not a loosened threshold. (2) The related-footline check reads visible text between
  `</article>` and `<footer>` and fails on an undeclared product name; related-article cards
  render there, so R6's articles bucket was reverted to `NONE` (the reviewed pre-task state)
  and R7/R9/R8 declare only the yarn product and the two answers their reasoning rests on,
  carrying cross-article reading inside the body prose. (3) `intl-dees-003b`'s byte budget
  refused each new route until the baseline was regenerated with `UPDATE_DOCUMENT_BUDGET=1`.
- Bands, measured as EN body text leaves (headings, paragraphs, prose/list/definition spans,
  table caption/columns/cells): R4 1,503 · R5 1,416 · R6 1,459 (whole band 1,300–1,600;
  +1,201 increment) · R7 1,817 · R9 1,475 · R8 1,508. Without the section headings: 1,423 ·
  1,335 · 1,410 · 1,728 · 1,416 · 1,456. **R4 is flagged, not hidden:** 1,503 with headings
  is three words above the 1,200–1,500 ceiling and 1,423 without is inside it; left as
  authored and handed to the reviewer/owner to call.
- Gates on every landing: typecheck clean; build exit 0 (static pages 237 → 241 → 241 → 245
  → 249 → 253); `intl-dees-003b` baseline regenerated per landing (236 → 240 → 244 → 248
  documents) then 19 pass / 0 fail / 0 skip with 0 moved; `test:seo` 243 pass / 0 fail /
  0 skip; `test:first-wave` 5/5; lint clean; `git diff --stat` equals `--ignore-cr-at-eol`.
- Identity verified `dylanliu2002 <dylanliu2002@gmail.com>` on every commit. Branch pushed;
  card moved to `REVIEW`; the implementer does not self-approve.
- PR **#45** opened against `main` on the owner's instruction (ready for review, not draft).
  Because the plan put this task on Task 62's branch, the PR diff is the whole branch since
  `aa5c2bc` (32 files, +7,377 / −59) and carries Task 62's unmerged R1–R3 work, the block
  model and the `intl-dees-003b` budget infrastructure alongside R4–R9; the PR body and the
  card both say so, and `git diff --name-status c171213..1d8b237` scopes a reviewer to the
  R-series alone. Head `1d8b237`; **not merged.**
- Open and not to be reported as done: es/de listing-card drafts need translator review;
  the Chinese bodies need a native read; PR #43 must merge or be rebased against this branch;
  independent review; R4's band reading above.

## Deliberately not done

- No new technical or commercial claim and no figure absent from this repository. No
  dissolution time, strength, tenacity, elongation, twist, machine speed, bath ratio,
  tolerance, capacity, spindle count, headcount, MOQ, lead time, price, customer name,
  export market or out-of-scope certificate fact.
- No new slug for R6; no cashmere R4. No edit to the R1/R2/R3 bodies, no grouping-registry
  change, no promotion, no route/canonical/hreflang/sitemap change, no threshold raised and
  no content deleted.
- The brief's downloadable worksheet for R9 is left to a separate asset task and is not
  faked as a link.
