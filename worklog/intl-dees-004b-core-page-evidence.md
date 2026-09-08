# Worklog — INTL-DEES-004B Core Page Translation Evidence Support

Append-only. Historical entries are never rewritten (`AGENTS.md` §7).

Naming note: this file follows the `INTL-DEES-00x` line's convention
(`worklog/intl-dees-004b-core-page-evidence.md`) rather than §4's
`worktrees/agent-NN` / `worklog/agent-NN-task-name` form, matching 002B, 003A and
003B so the four sibling records sort together. Raised as a coordination item on
the card.

---

## 2026-09-08 · Task opened, card premise checked before any edit

`git fetch origin --prune` → `origin/main` = `f27bfcae83d0d7b6a758246ea8c72e65739c0015`.

The card's Context asserts 003A and 003B are complete, and its Review section
asks me to check assumptions from **INTL-DEES-004A**. Both needed measurement
rather than trust:

- PR #30 (the 003B re-land): `gh pr view 30` → `state: MERGED`,
  `mergedAt: 2026-09-08T13:43:52Z`, `mergeCommit: f27bfca`.
  `git cat-file -e origin/main:src/content/switcher-availability.ts` → exists. So
  the assertion holds **now**; it did not hold an hour earlier, when the approved
  boundary was still off `main`. Recorded because the next worker will not see the
  gap.
- INTL-DEES-004A: no match for `004A`/`DEES-004` anywhere in the workspace;
  `git branch -a --list "*004*"` → only `codex/sys-auto-004-pilot-activation-bootstrap`;
  `git log --all --grep="004"` → SYS-AUTO-004 only; `tasks/README.md` registers
  none of the `intl-dees-*` keys.

Surfaced both to the requester instead of designing against a document that does
not exist here (§6: private chats are not shared state). Two decisions came back:
this task performs the audit itself and lands it in its own card; branch/worktree
follow the line's `qwen/intl-dees-004b-*` form despite §4's `codex/NN-*` rule.

Created `worktrees/qwen-intl-dees-004b-core-page-evidence` on a new branch from
`origin/main`, set and verified the §3 identity before touching anything:

```text
git config user.name  → dylanliu2002
git config user.email → dylanliu2002@gmail.com
```

## 2026-09-08 · Baseline captured before the first edit

Deliberately measured the pristine tree first, because a claim of "nothing moved"
is worthless without a pre-change number taken the same way as the post-change one.

- `npm ci` → 844 packages, exit 0 (real install, not the §3 symlink shortcut: a
  junctioned `node_modules` aborts Turbopack on this host).
- `npm run build` → exit 0, 225/225 prerendered.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **169 / 169 pass, 0 fail, 0 skipped**.
- `.next/static/chunks` → 15 `.js`, **821,280 B raw / 260,382 B gzip**, 0 chunks
  carrying an ownership string (003B's fix is live on `main`).
- 222 prerendered `.html` (220 route documents plus Next's two error shells).

Instrumentation rule learned the hard way earlier today and applied here: document
sizes come from `statSync().size`, never `readFileSync(…, "utf8").length`, which
counts UTF-16 units and understates every CJK page by ~2 bytes per character.

## 2026-09-08 · Audit A1/A2 — the limitation is three lines, and the door is load-bearing

Read `translation-evidence.ts`, `translation-availability.ts`, `availability.ts`
and `company.ts` in full at `f27bfca`; grepped every consumer of
`isDeepContentDetail` / `pageCopyFor` / `resolvedContentLocaleOf` in `src/`.

Findings that shaped the design:

1. `availability.ts` contains **no path-shape test at all** — every SEO surface is
   `resolvedContentLocaleOf(path, locale) === locale`. So the policy layer was
   never the blocker and does not need to learn about page kinds.
2. The blocker is three lines in the gate (`:204`, `:244`, `:292`) plus one regex.
   Relaxing them would be a one-line "fix" for a defect-class change.
3. The reason it is safe for entity pages and unsafe elsewhere: `pageCopyFor`
   derives the page's own field list from the entity and **throws** at prerender
   when a record under-covers it. Seven call sites, all entity detail. Core pages
   have no equivalent, so nothing could falsify a core claim.

Conclusion carried into the design: ship a core analogue of the enumerable
surface, not an exemption.

## 2026-09-08 · Audit A3/A4 — measured English retention, corroborated live

Built a block-level comparison of each ES/DE document against its English owner
on the baseline build. Per-path retention (share of prose blocks still verbatim
English), with `/zh/` as the control: homepage ES 16 pct, request-quote ES 17 pct,
contact 20 pct, manufacturing 44 pct, answers index 56 pct, product-finder 58 pct,
about 65 pct, products index 74 pct, **quality 77 pct**; aggregate ES 52 pct /
DE 57 pct / ZH control 9 pct. Full table on the card.

That split is the finding: `/es` and `/es/request-quote` are genuinely localized
and blocked by page *class*, while `/es/quality` is not translated and is correctly
blocked by *content*. A path-level boolean cannot tell those two cases apart, which
is the argument for slot-level evidence rather than a wider door.

Cross-checked against production rather than trusting the local build alone:
`curl https://www.threethai.com/es/quality` → `<html lang="es">`, canonical
`https://www.threethai.com/quality`, `og:locale en_US`, English title and body
sections, Spanish nav/hero/CTA. Two consequences: 002B's consolidation is deployed
and live, and the mixed state is what a crawler sees today.

Limits written into the card rather than buried: block equality over-counts
legitimately identical phrases and under-counts English inside translated blocks,
so it is a screen for where to look, not a substitute for a slot-level read. The
three non-zero `/zh/` rows were filed as a separate coordination item, since `zh`
owns those URLs by the model's guarantee and 004B changes nothing for them.

## 2026-09-08 · Implementation, and three self-corrections before the gate

Wrote `src/content/page-surfaces.ts` (registry), extended
`translation-evidence.ts` (`promotableClassFor`, class-aware `isGenuineTranslation`
and `evidenceDecisionFor`, two new reason codes), and threaded `surfaces` through
`translation-availability.ts` with `pageCopyFor` as the shared render net.

Three mistakes caught during the work, each fixed here rather than shipped:

1. **A dependency cycle I designed in.** `page-surfaces.ts` first imported
   `isDeepContentDetail` from the very module that had to import it. Rewritten as
   a leaf importing nothing, with the class decision moved into the gate; a test
   now fails if an `import` statement reappears in the registry file.
2. **`registry.filter(isGenuineTranslation)` became a latent bug** the moment the
   function gained a second parameter — `filter` passes `(page, index, array)`, so
   the index would have arrived as the surfaces registry and every registered
   surface would have looked empty. Rewritten as an explicit arrow with the reason
   in a comment.
3. **A fixture of mine caught a real defect in my own detector.** The
   non-translatable block filter used `/^[\d.,\s°A-Z()/·—–%-]+$/i`; with `i`,
   `A-Z` matches lowercase too, so ordinary English prose was classified as a
   non-translatable token and skipped — the promotion-time completeness check
   would have passed a page that was entirely untranslated. Case flag removed,
   comment added, and the fixture now asserts the surviving-English case fires.

`npm run typecheck` passed before any test was written.

## 2026-09-08 · The full gate refused my `availability.ts` change

First full run of `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` after the change:
**184 pass / 2 fail**. Both failures were INTL-DEES-002B's *structural* assertions
on `src/content/availability.ts`:

```text
✖ the SEO surfaces and the deep renderers share one source of the answer
  expected: /locales\.filter\(\(locale\) => resolvedContentLocaleOf\(path, locale, registry\) === locale\)/
✖ nothing beside the evidence layer may grant ownership (structure pins)
  expected: /export function createAvailabilityPolicy\(registry: readonly TranslatedPage\[\] = TRANSLATED_PAGES\)/
```

Cause: I had threaded a `surfaces` parameter through `createAvailabilityPolicy`
purely so a synthetic section promotion could be pushed through the shipped
factory in a test.

Options were (a) edit another task's merged suite the way 003B did — with a
Coordination Item and the behavioural intent preserved — or (b) not need the
change. Chose (b): `git checkout -- src/content/availability.ts`, both pins
confirmed intact by regex afterwards, and the end-to-end proof moved to
`resolvedContentLocaleOf(…, promotions, surfaces)` plus a **new** test asserting
the shipped policy is still derived from exactly that predicate for all 55 owner
paths. Rationale: 002B's two pins exist to stop the four SEO surfaces drifting
apart, and the audit's own conclusion was that the policy layer needed no change —
a task that must modify the guard on one layer in order to change another is
telling on itself. Editing their suite to suit my convenience is the trade to
avoid while there is a proof that does not need it.

The cost is real and recorded as R1 rather than glossed: a synthetic-surface
promotion is proven through the single predicate, not through the factory call
itself.

## 2026-09-08 · Re-run at the final state

Rebuilt (the previous build carried the reverted file), then re-ran every gate on
the committed tree — not on an intermediate one:

- lint PASS (no findings) · typecheck PASS · build PASS 225/225.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **187 / 187 pass, 0 fail, 0 skipped**
  (169 baseline + 18 new). first-wave → 5/5. `git diff --check` clean.
- `.next/static/chunks` **821,280 B raw / 260,382 B gzip — byte-identical to the
  baseline**, same 15 files, 0 chunks carrying any ownership string including the
  new `surface-slot-undeclared` / `surface-slot-extra` / render-net literals.
  So the new gate rules cost the browser nothing, which is 003B's payoff measured
  a second time.
- 222-document fingerprint vs the pristine base build: **0 field differences**,
  same document set, sitemap and robots bodies identical, raw document byte total
  identical (17,054,062 both). ES/DE promotions 0; every ES/DE document still
  canonicalises to the English owner with no alternates and no localized
  `inLanguage`.
- Two successive builds of the *same* tree put the document gzip total +225 B and
  then −626 B against base while raw was identical to the byte, so gzip is quoted
  as noise and raw as evidence. Nothing here leans on a gzip improvement.

## 2026-09-08 · Provider/model note

The card pinned neither Provider nor Model Family for this task, and none was
switched mid-task. Executor platform is Qwen Code per the requester's assignment;
platform choice changed no scope, no allowlist and no review obligation (§6).

## 2026-09-08 · Delivered

Commit `4eae62f2cc1706976242243d40e44e7baa7c249d` — "feat: make core and section
pages promotable by evidence, not by path class" — one commit on
`qwen/intl-dees-004b-core-page-evidence`, based on `f27bfcae83d0d7b6a758246ea8c72e65739c0015`,
pushed to `origin` (task branch only; `main` untouched, per §9/§13).

§3 identity gate verified on **this** commit, not a historical one:

```text
Author:  dylanliu2002 <dylanliu2002@gmail.com>
Commit:  dylanliu2002 <dylanliu2002@gmail.com>
```

Staged set was checked against the allowlist before committing: 7 files —
`src/content/page-surfaces.ts` (new), `src/content/translation-evidence.ts`,
`src/content/translation-availability.ts`,
`tests/intl-dees-004b-core-page-evidence.mjs` (new), `package.json`
(`test:seo` filename only), this card and this worklog.
`src/content/availability.ts` is **absent from the diff**, which is R1's outcome
visible in Git rather than only asserted in prose.

Working tree clean afterwards; all measurement artifacts (fingerprint JSONs,
commit-message scratch file, gate logs) removed, `git diff --check f27bfca..HEAD`
clean. Validation numbers in the card were taken from the same tree this commit
records — the build was regenerated after the `availability.ts` revert, so no
figure describes a state that was never shipped.

No pull request has been opened: the card asks for an audit, the five design
sections and implementation, and integration is the merge owner's action (§1). The
branch is pushed so an independent reviewer can diff it.

## 2026-09-08 · CORRECTION: A3's retention table was wrong; the fix is a src comment too

The delegated render-map report landed after delivery. It did not challenge the
mechanism — it reported per-page copy counts that would not reconcile with my
retention table. Re-measuring rather than defending it found the cause: the audit
script's non-translatable class was `/^[\d.,%\s°A-Z()/·—–-]+$/i`. With `i`, `A-Z`
matches `a-z`, so **ordinary English prose was classified as a non-translatable
token and removed from the denominator**. What survived was mostly CJK and numeric
blocks, which flattered every ES/DE ratio and made the `/zh/` control look clean.

Corrected figures (same build, case sensitivity restored, only whole-string contact
details excluded — brand and certificate names deliberately kept in, because an
English `<title>` containing "ISO 9001" is the finding, not the noise):

| path | A3 claimed | corrected |
| --- | --- | --- |
| `/es` | 5 of 31 (16 pct) | **55 of 103 (53 pct)** |
| `/es/request-quote` | 2 of 12 (17 pct) | **9 of 26 (35 pct)** |
| `/es/quality` | 24 of 31 (77 pct) | **121 of 135 (90 pct)** |
| aggregate ES | 52 pct | **71 pct** |
| `/zh/` control | 9 pct | **21 pct** |

The framing that dies with them: "two pages are genuinely localized and blocked by
a technicality." No core page is close enough for an honest record — the best keeps
a third of its prose in English — and the real pattern is bimodal *within* each
page: chrome, nav, CTAs and all 34 `form` strings are Spanish, while module-backed
body copy, inline literals and metadata are English. Measured directly to confirm
the dictionary half of that: `en` has 266 leaves (247 distinct values); `es` and
`de` each define 128 with 138 absent and 2-3 unchanged, so after the merge toward
English **140 of 266 — 53 pct — of the effective ES/DE dictionary is still
English**; `qualityPage` 2 of 22, `finder` 2 of 32, `manufacturingPage` 2 of 9,
`about` 2 of 33, `home` 28 of 40, `form` 34 of 34, `nav` and `actions` complete.
`zh` is complete (1 leaf identical). Note this also means the "128 of 248" figure
quoted in 002B/003A's comments and in a GSC-INDEX-002 test comment has a
denominator that is not reproducible from the tree — filed as a coordination item
for those owners rather than edited here.

Worse than the arithmetic: **I had already found and fixed this exact bug** in the
suite's fixture helper, and never carried the fix back into the tool that produced
the headline claim. A bug caught in one place does not stop being a bug in the
other copy of it.

Two of the report's structural claims were verified before use rather than
inherited, and both are now A6 / R9 with a migration step 0 in front of everything:
`home-applications.tsx:21,31` builds `` `/${locale === "zh" ? "zh/" : ""}applications` ``,
so `/es` links to the English tree and a promoted homepage would point away from
its own localization; and seven core routes exist as two independent JSX trees that
have already drifted — `(site)/request-quote` continues past "Incoterm." with a
link to the price-comparison guide while `[lang]/request-quote` stops. A surface
keyed to `/request-quote` would describe only one of the two renderers. Also
confirmed `tests/intl-dees-003a-…mjs:346-347` pins `/quality` → `path-not-entity-detail`,
which holds today only because the registry is empty.

Materiality, stated so this is not read as bigger or smaller than it is: no
mechanism, gate, test or byte-level guarantee depended on those ratios; nothing was
promoted; the empty registry is better supported by the corrected data. What was
wrong was the audit's framing and the sequencing built on it. A3 is marked
superseded in place rather than deleted, A3b carries the corrected table, and
`src/content/page-surfaces.ts`'s doc comment — which had quoted the bad numbers
into source — was corrected, which is why the gates below were re-run rather than
reused.

Re-gated at the corrected state: `next build` 225/225 · `REQUIRE_BUILD_OUTPUT=1
npm run test:seo` **187/187 pass, 0 fail, 0 skipped** · first-wave 5/5 ·
`.next/static/chunks` 821,280 B raw / 260,382 B gzip, 0 ownership-string chunks ·
222-document fingerprint 0 field differences. Measurement artifacts
(`.qwen-dict-count.mjs`, fingerprint JSONs, gate logs) removed after use.

## Open at hand-off

- Independent review not started (§13). Points worth attacking first are on the
  card's Review Status: whether R1's resolution is sufficient, whether an empty
  registry plus four synthetic nets counts as implemented support, and whether any
  row of A3 was mis-read.
- R2 is the honest residual: nothing in the architecture can prove a declared
  surface is *complete*; the per-page review at migration time carries that, with
  the built-document retention check as the backstop.
- A PR has not been opened; the branch is pushed for review.
- INTL-DEES-004A still has no repository artifact. If it exists in another
  worker's chat, publishing it would let someone diff its assumptions against
  A1-A5 instead of trusting this re-derivation.
