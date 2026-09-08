# Task INTL-DEES-003B — Server/Client Boundary Cleanup

- **Task Key:** `intl-dees-003b-server-client-boundary`
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `INTL-DEES-003B`
- **Title:** Keep translation availability resolution on the server
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Hermes
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Execution Assignment Recorded:** No
- **Priority:** `HIGH`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `qwen/intl-dees-003b-server-client-boundary`
- **Worktree:** `worktrees/qwen-intl-dees-003b-server-client-boundary`
- **Owner:** `TECHNICAL_SEO` (implementing agent)
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** `INTL-DEES-003A` (PR #27, **still OPEN** at `e99937e`)
- **blocks:** None

## Goal

INTL-DEES-003A shipped a correct evidence model, and its own review measured the
architectural cost it exposed: `site-header.tsx` is `"use client"` and called the
availability policy directly, so the SEO ownership machinery — `TRANSLATED_PAGES`,
`approvedPromotions()`, `evidenceDecisionFor()` and every reason literal — was
reachable from the browser and shipped there, to decide whether a language link
may carry `hreflang`.

Move that resolution entirely to the server. The browser receives the answer as
serializable props and never the rule that produced it.

## Success Criteria

- `src/components/layout/site-header.tsx` imports no `@/content/availability`,
  evidence registry, evidence decision or promotion derivation.
- No ownership string exists anywhere under `.next/static/chunks`.
- The client bundle returns to (here: slightly below) its INTL-DEES-002B size.
- Canonical, hreflang, sitemap, `og:locale`, JSON-LD `inLanguage` and
  `<html lang>` are unchanged, measured document by document.
- Zero ES/DE promotions, and no page is translated, re-designed or re-routed.

## In Scope

- `src/content/switcher-availability.ts` (new): the server-side bridge that asks
  the policy once per path and emits plain data.
- The three root layouts passing that data as a prop.
- The header's source of `localizedTargets` — and nothing else about the header.
- Two assertions in `tests/gsc-index-002-fallback-indexation.mjs` that pin the
  header's source text and therefore encode the old boundary (see Coordination).
- One appended filename in `package.json` → `test:seo`.

## Out of Scope

- Any change to canonical, hreflang, sitemap, schema or routing logic.
- The evidence model, its gate, or its registry (INTL-DEES-003A).
- Header UI, markup, navigation order, styling, accessibility behaviour.
- The switcher dropping query strings, and the cookie-overwrites-preference
  defect — both remain open elsewhere and are untouched here.
- Any other bundle-size work (explicitly excluded by the assignment).

## File Allowlist

```text
src/content/switcher-availability.ts                     (new)
src/components/layout/site-header.tsx
src/app/(site)/layout.tsx
src/app/[lang]/layout.tsx
src/app/zh/layout.tsx
tests/intl-dees-003b-server-client-boundary.mjs          (new)
tests/gsc-index-002-fallback-indexation.mjs              (two assertions — see Coordination)
package.json                                             (test:seo filename only)
```

## Task-Owned Administrative Files

- **Task card:** `tasks/intl-dees-003b-server-client-boundary.md`
- **Worklog:** `worklog/intl-dees-003b-server-client-boundary.md`

## Forbidden / Shared Files

`src/content/availability.ts`, `translation-evidence.ts`,
`translation-availability.ts`, `company.ts`, `src/proxy.ts`, `src/lib/seo.tsx`,
`src/app/sitemap.ts`, every page and detail route, `next.config.ts`,
`src/app/globals.css`, the Prisma schemas and `.github/` are unmodified. No
dependency changed. `site-header.tsx` and `site-footer.tsx` are listed as shared
in repository `AGENTS.md` §8; the header edit here is the boundary itself, which
the assignment mandates, and is recorded as a change request below rather than
assumed.

## Inputs / Evidence

- INTL-DEES-003A (PR #27) card remaining risk 4 and its Coordination Item, which
  proposed exactly this seam.
- Measured leak at `e99937e`: `.next/static/chunks` 824,427 B raw / 261,536 B
  gzip; carrier chunk `128996572d69177c.js` 34,654 B / 12,052 B gz; loaded by
  220 of 222 prerendered documents; no base chunk contained any
  `translation-availability` string.
- Baseline for comparison, measured on a build of `d34cd95`: 822,743 B raw /
  260,950 B gzip; documents 17,038,829 B raw / 3,918,288 B gzip.
- Ground truth for the path inventory, derived from the prerendered build rather
  than assumed: 55 prefix-free paths render a switcher, and the content-derived
  inventory matched it exactly with no gap and no extra.
- Assumption labelled: the serialized prop is assumed to be the only per-document
  cost of the boundary; it is measured (+67 B raw / +23 B gzip per document), not
  inferred.

## Acceptance Criteria

- [x] The header imports nothing from the SEO policy or the evidence layers.
- [x] No client chunk contains any ownership string (`status-not-approved`,
      `copy-not-translated`, `has no translated`, …).
- [x] Client bundle at or below the INTL-DEES-002B baseline.
- [x] Rendered output equivalent, verified two ways (semantic fingerprint of all
      222 documents, and per-document switcher `hrefLang` sets vs the policy).
- [x] Zero promotions; EN/ZH ownership, GSC-LOCALE-003A, LOCALE-RETIRE-001,
      GSC-I18N-001 and the schema policy all green.
- [x] No secret, artifact, generated output or unlisted file in the diff.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
REQUIRE_BUILD_OUTPUT=1 npm run test:seo
node --test tests/first-wave-correctness.mjs
git diff --check
```

| Measurement | base `d34cd95` | `e99937e` (003A) | this head |
| --- | --- | --- | --- |
| `.next/static/chunks` raw | 822,743 B | 824,427 B | **821,257 B** |
| `.next/static/chunks` gzip | 260,950 B | 261,536 B | **260,368 B** |
| client chunks holding ownership strings | 0 | 1 | **0** |
| 222 documents, raw | 17,038,829 B | 17,038,829 B | 17,053,789 B |
| 222 documents, gzip | 3,918,288 B | 3,918,288 B | 3,923,452 B |
| SEO-field + text differences vs 003A | — | — | **0** |

- [x] Diff scope reviewed (6 modified, 2 new, all in the allowlist)
- [x] Validation recorded (Completion Record)

## Coordination Items

- **For `ORCHESTRATOR` (shared file, `AGENTS.md` §8):**

```text
SHARED FILE CHANGE REQUEST
File: package.json
Task: INTL-DEES-003B
Reason: the card's validation gate is `npm run test:seo`; a suite not listed there is not run by the gate.
Exact proposed change: append " tests/intl-dees-003b-server-client-boundary.mjs" to the existing test:seo command string. No other key changes.
Evidence: the same line was extended the same way by GSC-LOCALE-003A, INTL-DEES-002B and INTL-DEES-003A, all merged.
Tasks affected: none other; the new file is self-contained.
Risk: LOW — test manifest only.
Validation: `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` reports 167 tests, 0 fail, 0 skipped.
```

- **For `ORCHESTRATOR` (shared file):** `src/components/layout/site-header.tsx` is
  listed shared in §8. It is the subject of this assignment, so the file was
  edited; the change is confined to one prop, its type, and where
  `localizedTargets` comes from. No markup, class, label, link order, focus
  behaviour or ARIA attribute changed, and the built HTML's switcher anchors are
  attribute-for-attribute identical to `e99937e`'s.

- **For the GSC-INDEX-002 owner (another task's suite, changed deliberately):**
  `tests/gsc-index-002-fallback-indexation.mjs` "language switcher keeps
  navigation but stops claiming false hreflang" asserted
  `assert.match(source, /localizedLocalesFor\(currentPath\)/)` — i.e. it pinned
  the *browser* calling the policy, which is the exact coupling this task removes.
  The assertion now pins the server-resolved equivalent
  (`availableLocales.exceptions[currentPath] ?? availableLocales.common`), plus a
  new `doesNotMatch` that forbids the policy import from ever returning. The
  protection the test exists for — the two gated `hrefLang={localizedTargets…}`
  expressions, `locales.map`, and `switchHref` — is untouched and still asserted
  with the same counts. Precedent: INTL-DEES-002B updated three pins in other
  cards' suites the same way, each with the reason recorded beside it.

- **Stacked delivery (from the assignment's base instruction):** the card named
  "current main after PR #27 merge candidate" as base. PR #27 is still OPEN and
  this task may not merge it, so `main` (`d34cd95`) does not contain the code
  being fixed. Confirmed with the requester: this branch is cut from `e99937e`
  and its pull request targets `qwen/intl-dees-003a-translation-evidence-model`.
  **Retarget to `main` after #27 merges**; do not merge this one first.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence: to be recorded against the pushed head by a
  reviewer who is not this implementer.

## Completion Record

- Commit: see pushed head on `qwen/intl-dees-003b-server-client-boundary`.
- Base / rebase commit: `e99937e3348bb40e2b7bdee3dd1c8bde4d59b211` (INTL-DEES-003A
  head, PR #27). No rebase performed; `origin/main` (`d34cd95`) is an ancestor.
- Changed files: the 8 in the allowlist plus this card and the worklog.
- Validation results: lint PASS · typecheck PASS · `next build` PASS 225/225 ·
  `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` **167 tests / 167 pass / 0 fail /
  0 skipped** (156 inherited + 11 new) · `node --test
  tests/first-wave-correctness.mjs` PASS (it pins the same header) · `git diff
  --check` clean.
- Design decision that changed under measurement: the first implementation
  shipped the **complete** `path → locales` map and cost **+3,210 B raw / +800 B
  gzip on every one of 222 documents** (+4.5 % of total HTML) to save 586 B gzip
  once on a cached chunk. Rejected and re-encoded as `common` + `exceptions`,
  both derived from the policy on the server, which brought the per-document cost
  to **+67 B raw / +23 B gzip**. The invariant that made the re-encoding safe:
  `common` is computed as the policy's modal answer over the inventory, so no
  locale list is written into either the bridge or the header — pinned by test.
- Remaining risks:
  1. The bridge enumerates paths from the content model. A future route that
     renders the header **without** being one of those entity/core paths (for
     example a new standalone section) would fall back to `common`. That is the
     same answer the policy gave such a path before the boundary existed, so it
     is not a new failure mode, but it is now the only fallback and it is
     unverified for path classes that do not exist yet. The build test that walks
     every prerendered switcher document is the guard.
  2. `common` is chosen by frequency across the inventory. If a future registry
     promoted a majority of paths in one locale, `common` would shift and
     `exceptions` would shrink — behaviour stays correct either way, but the
     payload composition changes with content rather than with code.
  3. The prop is serialized per document. It is ~90 B today; if a promotion
     landscape ever made `exceptions` large, revisit the encoding (or move the
     switcher into a server component with the path resolved per page).
  4. Two assertions in another task's merged suite were edited (documented above).
     An independent reviewer should confirm the protection they exist for is
     still enforced, not merely re-pointed.

## Rollback

Revert the merge commit for this branch. It removes one file, restores one
import and three prop passes, and touches no data, route, policy or content;
rendered output is byte-equivalent with and without it, so there is no SEO or
cached-URL consequence either direction. Rollback ordering matters only in that
this branch must be reverted **before** #27 if both are already merged, since it
depends on #27's files. Verify with `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` and
by re-reading `.next/static/chunks` totals.
