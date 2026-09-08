# Task INTL-DEES-003A — Translation Evidence Model

- **Task Key:** `intl-dees-003a-translation-evidence-model`
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `INTL-DEES-003A`
- **Title:** Translation evidence model gating ES/DE SEO ownership
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Hermes
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** No
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `HIGH`
- **Branch:** `qwen/intl-dees-003a-translation-evidence-model`
- **Worktree:** `worktrees/qwen-intl-dees-003a-translation-evidence-model`
- **Owner:** `TECHNICAL_SEO` (implementing agent)
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** `INTL-DEES-002B` (PR #26, merged as `d34cd95`)
- **blocks:** `INTL-DEES-001` (ES/DE copy production)

## Goal

INTL-DEES-002B made ES/DE SEO ownership path-aware: a page may own a localized
URL only if the translated copy it renders exists. It did not answer *who says
that copy exists*. Until now, any structurally honest entry in the registry
became a canonical, hreflang, sitemap and `inLanguage` claim the moment it was
written down — there was no approval step and no record of the English source it
was checked against.

This task adds that missing half: one evidence record per path + locale, carrying
the translated fields, the field list it was reviewed against, its provenance and
its approval status — and makes approval the only door to ownership, for the SEO
resolver and the renderer alike.

## Success Criteria

- `src/content/translation-evidence.ts` is the single source of truth for
  translation evidence, keyed by path + locale.
- Only evidence that is `approved`, complete against its declared required
  fields, genuinely translated, independently reviewed and unambiguous becomes a
  promotion.
- A promotion is the only input to self canonical, hreflang membership, sitemap
  alternates and localized `inLanguage`/`og:locale`, and all four move together.
- Without approved evidence a page stays an English-owner fallback on all four
  surfaces.
- Zero pages are translated and zero are promoted: shipped answers are
  byte-identical to `origin/main`.

## In Scope

- The evidence record type, its status, provenance and decision rules.
- The page-shape model (`DEEP_CONTENT_SECTIONS`, `isDeepContentDetail`,
  `deepContentSectionOf`) and `isGenuineTranslation`, relocated to the module
  that decides about them.
- Deriving `TRANSLATED_PAGES` from approved evidence, so `./availability` (the
  SEO policy) and `pageCopyFor` (the renderer) read one derivation.
- Focused tests for the five behaviours the card names, plus the structure pins.
- One appended filename in `package.json` → `test:seo` (shared file; request
  below).

## Out of Scope

- Translating any page, or recording any real evidence entry (INTL-DEES-001).
- Promoting any ES/DE page, or any ES/DE core/section page.
- EN/ZH ownership, locale routing, serving, the four-language switcher, document
  `<html lang>`, schema types, GSC-LOCALE-003A, LOCALE-RETIRE-001.
- `Vary`/cache-variance work and the two `src/proxy.ts`-adjacent defects still
  open from GSC-LOCALE-003.
- Any `docs/` update: the ten-locale architecture text is already historical.

## File Allowlist

```text
src/content/translation-evidence.ts            (new)
src/content/translation-availability.ts
src/content/availability.ts
tests/intl-dees-003a-translation-evidence-model.mjs  (new)
package.json                                   (test:seo filename only — shared file, see request)
```

## Task-Owned Administrative Files

- **Task card:** `tasks/intl-dees-003a-translation-evidence-model.md`
- **Worklog:** `worklog/intl-dees-003a-translation-evidence-model.md`

## Forbidden / Shared Files

No other shared surface is touched. `src/proxy.ts`, `src/content/company.ts`,
`src/lib/seo.tsx`, `src/app/sitemap.ts`, the layout components, every other
task's card/worklog/suite and all dependencies are unchanged. `package.json` is
shared and is changed only by the single appended test filename below.

## Inputs / Evidence

- `INTL-DEES-002B` (PR #26, merged `d34cd95`): path-aware availability,
  `resolvedContentLocaleOf` as the one resolution both sides read, and the
  owner-approved strict posture (evidence only, no coverage threshold).
- Owner decision recorded in PR #26: ES/DE hold 128 of 248 UI strings per locale
  (51.6%) and **0** deep body fields, so 24 core URLs consolidate onto English.
- `origin/main` measured at the base gate: `d34cd95`.
- Baseline before the first edit: `REQUIRE_BUILD_OUTPUT` unset → 132 tests,
  111 pass, 0 fail, 21 build-gated skips.
- Unverified from here and left as such: what a *real* approval workflow looks
  like operationally. This task defines the record the workflow must produce,
  not the workflow.

## Acceptance Criteria

- [x] One evidence registry, path + locale keyed, is the only route to ownership.
- [x] Approved evidence promotes; missing, incomplete and draft evidence do not;
      each refusal reports a machine-checkable reason.
- [x] Resolver and renderer provably read the same derivation (agreement matrix).
- [x] Nothing translated, nothing promoted, `TRANSLATION_EVIDENCE` ships empty.
- [x] EN/ZH ownership, GSC-LOCALE-003A, LOCALE-RETIRE-001 and the schema policy
      suites pass unmodified.
- [x] No secret, artifact or unlisted file in the diff.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
REQUIRE_BUILD_OUTPUT=1 npm run test:seo
git diff --check
```

Measured at the base, before any edit, for comparison:
`npm run test:seo` → 132 tests / 111 pass / 0 fail / 21 skipped (no build yet).

- [x] Diff scope reviewed — `git status --porcelain` lists only the five
      allowlist files plus this card and the worklog; no build output, no
      dependency tree, no secret.
- [x] Validation recorded (see Completion Record).
- [x] Suite proved capable of failing: 11 injected regressions each reddened at
      least one test, 2 controls stayed green, in a scratch copy outside this
      worktree (details in the worklog and the PR body).

## Coordination Items

- **For `ORCHESTRATOR` / `BRAND_UX` (proposed, not started):** `src/components/layout/site-header.tsx`
  is `"use client"` and imports `localizedLocalesFor` from `@/content/availability`,
  which transitively forces this task's evidence gate into a browser chunk
  (+1,684 B raw / +586 B gzip, loaded by 220 of 222 documents) to answer a
  question that is fixed at build time. Suggested card: have a server component
  resolve the localized locale list and pass it to the header as a prop, leaving
  the client bundle with no route into the SEO policy. Out of scope here (shared
  component, different file ownership) and not a blocker for this change.
- **For `ORCHESTRATOR` (shared file):** `package.json` is shared under
  `AGENTS.md` §8. The change is one appended filename in `test:seo`, required so
  this card's suite actually runs in the gate the card specifies. Same shape as
  INTL-DEES-002B's accepted change to the same line.

```text
SHARED FILE CHANGE REQUEST
File: package.json
Task: INTL-DEES-003A
Reason: The card's validation gate is `npm run test:seo`; a suite that is not in
  that list is not run by the gate.
Exact proposed change: append " tests/intl-dees-003a-translation-evidence-model.mjs"
  to the existing test:seo command string. No other key changes.
Evidence: The line already carries eight suites, including
  tests/intl-dees-002b-page-aware-translation-availability.mjs added by INTL-DEES-002B.
Tasks affected: none other; the appended file is self-contained.
Risk: LOW — test manifest only, no dependency, no runtime path.
Validation: `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` must report the new suite
  among the executed files and 0 fail.
```

- **For `SEO_CONTENT` / INTL-DEES-001:** when real ES/DE copy exists, promoting a
  page is one record in `TRANSLATION_EVIDENCE` — path (prefix-free English
  owner), locale, `status: "approved"`, `requiredFields` (the entity's body
  fields), `source` (English verbatim), `content` (the translation), and
  provenance with a reviewer who is not the translator. No code change is needed
  to promote, and `tests/intl-dees-002b-*` and `tests/locale-retire-001-*` loop
  every fallback locale over every path: **they are expected to fail on the first
  real promotion** until that page's inventory is updated. Failing there is the
  signal, not a regression (inherited from INTL-DEES-002B).
- **For whoever owns ES/DE chrome:** promotion remains admissible only for entity
  detail paths. Core/section pages still cannot be promoted because their copy
  comes from the partial UI dictionary; that stays a separate change with its own
  evidence.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence: to be recorded by the reviewer against the
  pushed head.

## Completion Record

- Commit: `a0995cc` (implementation) + this record's follow-up commit.
  PR head is authoritative.
- Base / rebase commit: `d34cd95` (`origin/main` at the base gate and re-checked
  before opening the PR; it had not moved, so no rebase was performed).
- Changed files: `src/content/translation-evidence.ts` (new),
  `src/content/translation-availability.ts`, `src/content/availability.ts`,
  `tests/intl-dees-003a-translation-evidence-model.mjs` (new), `package.json`
  (test filename only), plus this card and the worklog. 7 files,
  1,386 insertions / 123 deletions at `a0995cc`.
- Validation results, all at the committed state:
  - `npm run lint` → PASS (0 errors).
  - `npm run typecheck` → PASS.
  - `npm run build` → PASS, 225/225 static pages generated (three times: the
    pre-edit tree and twice at the final commit, all exit 0).
  - `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **156 tests, 156 pass, 0 fail,
    0 skipped**. Baseline at `d34cd95` before any edit: 132 tests, 111 pass,
    0 fail, 21 skipped.
  - `git diff --check` and `git show --check` → clean.
  - Built sitemap bytes (`.next/server/app/sitemap.xml.body`): 55 `<loc>`
    entries, all prefix-free, 0 with an `/es` or `/de` path segment, hreflang
    tag set exactly `en, x-default, zh-CN`.
- No-behaviour-change proof, measured against a build of the base commit rather
  than argued: a semantic fingerprint of every prerendered document (page set,
  `<html lang>`/`dir`, canonical, every `rel=alternate` hreflang pair, title,
  description, robots, `og:locale`, `og:url`, JSON-LD `@type` set, every
  `inLanguage` value, and the full rendered text) was taken from a production
  build of `d34cd95` and from this head — **222 documents both sides, 0 pages
  added or removed, 0 field differences**. `sitemap.xml.body`,
  `robots.txt.body`, and every `.json`/`.meta`/`.map` output file are also
  hash-identical. Byte hashing of `.html`/`.rsc` is **not** a usable method on
  this host: two builds of the same source differ by ~14 bytes in every
  document, and the shift oscillates between builds, so it was replaced by the
  semantic comparison above. An initial delegated byte-identity report was
  checked, does not reproduce against these manifests, and is not cited — but
  the client-bundle half of its later full report **does** reproduce, and is
  measured here directly.
- **What did move: the client bundle.** Measured against a second production
  build of `d34cd95`: `.next/static/chunks` totals **822,743 → 824,427 bytes raw
  (+1,684 B, +0.205 %)** and **260,950 → 261,536 bytes gzip (+586 B,
  +0.225 %)**. The added code is this module's decision machinery — chunk
  `128996572d69177c.js` (34,654 B raw / 12,052 B gz) contains every reason
  literal (`status-not-approved`, `provenance-missing`, `copy-not-translated`,
  …) and is referenced by **220 of 222** prerendered documents. At base, no
  client chunk contained any `translation-availability` string at all, so this
  is new weight rather than a rename. Mechanism: `TRANSLATED_PAGES` is an
  eagerly-evaluated module-scope `const`, `availability.ts` imports it, and
  `site-header.tsx` (`"use client"`) imports `localizedLocalesFor` — so
  `approvedPromotions() → approvedEvidence() → evidenceDecisionFor()` is live
  code on the browser path and cannot be tree-shaken. No document, canonical,
  hreflang, sitemap or robots byte changed; the cost is 586 gzip bytes of
  validation logic shipped to browsers that never run it, recorded as remaining
  risk 4 with the change that would actually remove it.
- Worklog: `worklog/intl-dees-003a-translation-evidence-model.md`
- Remaining risks:
  1. The gate trusts the record's `requiredFields` as the reviewer's statement of
     what the page renders. It cannot measure the live entity: this module is a
     leaf importing only `./company`, because `site-header.tsx` is `"use client"`
     and reaches it through `@/content/availability`, so importing the entity
     corpus would put the whole product/answer text in a browser chunk. (That
     keeps the client cost at kilobytes rather than hundreds of kilobytes; it
     does not make it zero — see risk 4.) The second net is `pageCopyFor`, which
     resolves against the real record at prerender and throws, so a record that
     under-declares fails the **build**, not production. Pinned by
     `REQ 3 · a partially translated page stays a fallback…`.
  2. `sourceRevision` is recorded but never re-verified: nothing compares it to
     Git, so a stale approval does not self-expire. Stated, not assumed away.
  3. A high-risk surface (canonical, hreflang, sitemap, schema language) is
     touched; behaviour is unchanged because the registry ships empty, but the
     surface is why this card is `Risk: HIGH`.
  4. **The gate's code now runs in the browser, where it has no job.** +1,684 B
     raw / +586 B gzip on a chunk loaded by 220 of 222 documents, because
     `TRANSLATED_PAGES` is an eager module-scope `const` that the client header
     depends on transitively. It is inert — the registry is empty and the result
     is only used to answer `localizedLocalesFor` — but it is real weight, and it
     will grow with every rule added here. Removing it needs a different seam,
     not a tweak: the header should be handed its locale list by a server
     component (or the shipped promotion set resolved server-side and passed
     down), which is a `site-header.tsx` / layout change owned by a separate
     card. Deliberately not done here: it is outside this allowlist and would
     widen a governance diff for 0.2 % of JS.

## Rollback

Revert the merge commit. The change is a model plus one derivation
(`TRANSLATED_PAGES = approvedPromotions()`), and the shipped registry is empty,
so `git revert` restores INTL-DEES-002B's behaviour with no data, route, or
content migration and no cached-URL consequence: every ES/DE answer is identical
before and after. Confirm with `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` and by
re-reading the built sitemap's `<loc>` count (55) and hreflang tag set
(`en, x-default, zh-CN`).
