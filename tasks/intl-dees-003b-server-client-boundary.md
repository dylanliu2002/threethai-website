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

| Measurement | base `d34cd95` | `e99937e` (003A) | this head (post-review) |
| --- | --- | --- | --- |
| `.next/static/chunks` raw | 822,743 B | 824,427 B | **821,259 B** |
| `.next/static/chunks` gzip | 260,950 B | 261,536 B | **260,369 B** |
| client chunks holding ownership strings | 0 | 1 | **0** |
| 222 documents, raw | not measured | 17,038,829 B | 17,054,229 B |
| 222 documents, gzip | not measured | 3,918,288 B | 3,923,988 B |
| SEO-field + text differences vs 003A | — | — | **0** |

The two document rows compare the shipped head against the PR #27 build, which is
the pair that isolates this task's cost (+15,400 B raw / +5,700 B gzip across 222
documents, i.e. +69 B raw and +26 B gzip per page). The `d34cd95` document total
was never measured — the temporary base worktree was removed after the bundle
comparison — so it is left blank rather than copied from the 003A column.

- [x] Diff scope reviewed
- [x] Validation recorded (Completion Record)

## Review Correction (REQUEST_CHANGES → this commit)

Independent review of `34c7fa8` raised four bounded issues. The server/client
architecture was accepted and is unchanged; all four are encoding, guard and
record fixes.

| | Issue | Resolution |
| --- | --- | --- |
| **B1** | `PAYLOAD_CEILING = 400` fails legitimate content work. Measured by replaying the bridge's derivation over synthetic registries: 4 promoted deep paths → 263 B, 11 → 673 B, so around the **7th** promotion `test:seo` would go red blaming the encoding, while the design it was protecting against (a complete `path → locales` map, ~1.9-2.4 KB) is strictly worse. | The ceiling is gone. The guard is now structural and inventory-relative: every exception must **add** at least one locale the content model does not already guarantee, and every exception key must be a path the evidence registry actually promotes. A serialized path map is rejected in full (its entries restate the baseline); maximum legitimate adoption passes, at any byte size. The per-document byte budget stays where it measures real cost — the built HTML assertion. |
| **B2** | Unresolved paths inherited the **modal** answer. If a majority of pages ever gain ES/DE, `common` becomes `en+zh+es+de`, so an un-inventoried page would advertise ES on copy no evidence covers — a fail-open direction, the exact defect class GSC-INDEX-002 and 002B exist to refuse. | `common` is replaced by `baseline` = `TRANSLATED_CONTENT_LOCALES`, the locales the content model carries on **every** page by construction. An unlisted path now resolves to `baseline`, provably a correct (never over-claiming) answer, and a promotion can only ever be *added* by a server-resolved entry for that specific path. Pinned by a test that replays a 54-of-55-promoted landscape and checks `baseline` does not move. |
| **B3** | The card claimed "the build test that walks every prerendered switcher document is the guard", but the suite only asserted exception-keys ⊆ inventory; `answerFor()` cannot fail for an unknown path, so the guard did not exist. And `pageOf` hardcoded `["zh","es","de"]`, duplicating the locale model LOCALE-RETIRE-001 established as the single lever. | Both fixed. The build test now asserts **both directions**: no rendered switcher document may sit on an un-inventoried path, and no inventoried path may lack a rendered document (it passes with 55 ↔ 55). Prefix handling derives from `locales` filtered by what `localePath` actually does, and a self-scan forbids the literal three-locale array in the suite and any locale name in the bridge. |
| **B4** | Risk 2 as written ("`common` would shift and `exceptions` would shrink") is wrong about the middle of the curve. | Rewritten below with the measured, non-monotonic shape and the reason the shipped encoding is monotonic instead. |

Gate after the correction: lint PASS · typecheck PASS · build PASS 225/225 ·
`REQUIRE_BUILD_OUTPUT=1 npm run test:seo` **169 / 169 pass, 0 fail, 0 skipped**
(003B suite 11 → 13 tests) · first-wave PASS · `git diff --check` clean ·
222-document SEO fingerprint still **0** differences vs `e99937e`, and the bundle
is unchanged by the correction (821,257 → 821,259 B raw).

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

- `34c7fa8`: **REQUEST_CHANGES** — B1 payload ceiling punishes legitimate
  translations; B2 fail-open modal fallback; B3 claimed guard absent + hardcoded
  locale prefixes; B4 inaccurate risk write-up. All four addressed in the
  correction commit; architecture unchanged.
- Current outcome: Pending re-review (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- **Independence caveat, stated because §13 depends on it:** the review above was
  written in the same session and by the same agent that implemented the branch.
  It is rigorous self-criticism, not the independent review this workflow
  requires. Neither that REQUEST_CHANGES nor this record may be cited as
  §13 sign-off; a different role/worker/thread must review the corrected head.

## Completion Record

- Commit: `34c7fa8` (boundary) + the correction commit on this branch; pushed
  head is authoritative.
- Base / rebase commit: `e99937e3348bb40e2b7bdee3dd1c8bde4d59b211` (INTL-DEES-003A
  head, PR #27). No rebase performed; `origin/main` (`d34cd95`) is an ancestor.
- Changed files: the 8 in the allowlist plus this card and the worklog.
- Validation results, at the corrected head: lint PASS · typecheck PASS ·
  `next build` PASS 225/225 · `REQUIRE_BUILD_OUTPUT=1 npm run test:seo`
  **169 tests / 169 pass / 0 fail / 0 skipped** (156 inherited from #27 + 13 in
  this suite) · `node --test tests/first-wave-correctness.mjs` PASS (it pins the
  same header) · `git diff --check` clean · 222-document SEO fingerprint **0**
  differences vs `e99937e`.
- Design decisions that changed under measurement, in order:
  1. The **complete** `path → locales` map was built first and rejected: it fell
     the bundle as intended but cost **+3,210 B raw / +800 B gzip on every one of
     222 documents** (+4.5 % of total HTML) to save 586 B gzip once on a cached
     chunk.
  2. It was re-encoded as a **modal** `common` + `exceptions` (+67 B raw / +23 B
     gzip per document). Review then showed the modal default is fail-open: once a
     majority of pages carry ES/DE evidence, an un-inventoried page would
     advertise a locale no evidence covers.
  3. The shipped shape is `baseline` + `exceptions`, where `baseline` is
     `TRANSLATED_CONTENT_LOCALES` — the locales the content model carries on every
     page — so an unresolved path gets a *provably true* answer instead of a
     statistical one, and no locale list is written into either the bridge or the
     header. Same per-document cost as step 2, without the failure mode.
- Remaining risks:
  1. **Payload growth with adoption is real and linear.** One entry per promoted
     path: measured by replaying the derivation, 4 promoted deep pages ≈ 263 B
     serialized, 11 ≈ 673 B, 22 ≈ 1,476 B, all-promoted ≈ 2 KB — against ~1.9 KB
     for the rejected complete map, i.e. this encoding is never worse and is
     better until adoption approaches total. The earlier modal shape was
     **non-monotonic** at exactly these points (1,476 B at 22 promoted, falling to
     1,079 B at 32 once the mode flipped); the shipped one is monotonic, which is
     the property that makes it budgetable. If ES/DE translation reaches most of
     the catalogue, revisit the encoding or move the switcher into a server
     component that knows its own path.
  2. The inventory is derived from the content model, so a **new route class**
     that renders the header without being an entity/core path would resolve to
     `baseline`. That is now explicitly tested rather than assumed — the build test
     fails if any rendered switcher sits on an un-inventoried path, or if an
     inventoried path renders none (55 ↔ 55 today) — but the test can only see
     routes that exist when it runs; adding such a route requires adding it here.
  3. The prop is serialized per document (~90 B today).
  4. Two assertions in another task's merged suite were edited (documented
     above); the re-reviewer should confirm the protection they exist for is
     still enforced rather than merely re-pointed.

## Rollback

Revert the merge commit for this branch. It removes one file, restores one
import and three prop passes, and touches no data, route, policy or content;
rendered output is byte-equivalent with and without it, so there is no SEO or
cached-URL consequence either direction. Rollback ordering matters only in that
this branch must be reverted **before** #27 if both are already merged, since it
depends on #27's files. Verify with `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` and
by re-reading `.next/static/chunks` totals.
