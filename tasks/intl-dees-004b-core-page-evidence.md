# Task INTL-DEES-004B — Core Page Translation Evidence Support

- **Task Key:** `intl-dees-004b-core-page-evidence`
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `INTL-DEES-004B`
- **Title:** Let core and section pages earn localized ownership through evidence
- **Mode:** `AUDIT + IMPLEMENT`
- **Role:** `TECHNICAL_SEO_ARCHITECT`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Qwen Code (CLI)
- **Current Provider:** Not pinned by the card
- **Current Model Family:** Not pinned by the card
- **Execution Assignment Recorded:** No
- **Priority:** `HIGH`
- **Status:** `REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `qwen/intl-dees-004b-core-page-evidence`
- **Worktree:** `worktrees/qwen-intl-dees-004b-core-page-evidence`
- **Base:** `f27bfcae83d0d7b6a758246ea8c72e65739c0015` (`origin/main`, the PR #30 merge)
- **Owner:** `TECHNICAL_SEO_ARCHITECT` (implementing agent)
- **Reviewer:** Unassigned (must be independent, per `AGENTS.md` §13)
- **depends_on:** `INTL-DEES-003A` (merged, PR #27) and `INTL-DEES-003B` (merged, PR #30)
- **blocks:** INTL-DEES-001's core-page translation, which needs this before a core page can be approved

## Card Input Conflict, Resolved Before Coding

The card's Context says "INTL-DEES-004A audit identified the next limitation" and
its Review section says to "check current assumptions from INTL-DEES-004A". That
artifact does not exist in this repository:

- `git ls-tree -r --name-only origin/main -- tasks worklog docs/audits` → no `004a`
- `grep` for `004A` / `DEES-004` across the whole workspace → no match
- `git branch -a --list "*004*"` → only `codex/sys-auto-004-pilot-activation-bootstrap`
- `git log --all --grep="004"` → only SYS-AUTO-004 commits
- `tasks/README.md` registers none of the `intl-dees-*` keys

`AGENTS.md` §6 states that private platform chats and session context are not
shared state, so an audit that exists only in another worker's chat cannot be
reviewed here. Raised with the requester, who chose to have **this task perform
the audit itself** and land it in this card rather than wait for the missing
input. Everything in the Audit section below is therefore measured in this task,
against `f27bfca`, and nothing is inherited from a document nobody can open.

`docs/audits/README.md` restricts that directory to the numbered role reports
named on a card (`10` … `16`) and this card names no report path, so the audit
lives here rather than in a new file that would imply a role audit.

Branch and worktree naming follow the `INTL-DEES-00x` line (`qwen/…`, per the
requester's explicit choice) and therefore **deviate from `AGENTS.md` §4**
(`codex/NN-short-task-name` / `worktrees/agent-NN-short-name`). Recorded here as
a deviation with a decision behind it, not as an oversight — see Coordination
Items.

## Goal

INTL-DEES-002B made availability path-aware and INTL-DEES-003A made it
evidence-based, but both left the promotable *page kind* fixed to one shape: an
entity detail route. Extend the architecture so a selected core or section page
(`/`, `/manufacturing`, `/quality`, `/request-quote`, …) can also become a valid
localized owner when real translated content exists for it — without translating
anything, without enabling any ES/DE promotion, and without moving one existing
canonical or hreflang output.

## Audit

### A1 · Where the limitation actually lives

The policy layer is **not** the limitation. `src/content/availability.ts` is
already path-agnostic: every SEO surface is built on one predicate,
`resolvedContentLocaleOf(path, locale) === locale`, and it will answer for any
path it is handed. Verified by reading the module in full at `f27bfca` — it
contains no path-shape test at all.

The limitation is exactly three lines in `src/content/translation-evidence.ts`:

| line (as read at `f27bfca`) | code |
| --- | --- |
| `:204` | `if (!isDeepContentDetail(path)) return false;` inside `isGenuineTranslation` |
| `:244` | `if (!isDeepContentDetail(path)) reasons.push("path-not-entity-detail");` |
| `:292` | `if (isPromotionLocale(locale) && isDeepContentDetail(path))` guarding the genuine-copy check |

with `deepDetailPath` (`:96`) `^/(answers|knowledge|products|applications)/[^/]+/?$`
as the single door. So relaxing those three lines alone would "fix" the symptom —
and that is precisely what must not be done, because of A2.

### A2 · Why the door is legitimately closed today

The door is not bureaucracy; it is the only thing standing between a claim and a
lie. An entity detail page has an enumerable copy surface, because the entity
record *is* that surface: `pageCopyFor`
(`src/content/translation-availability.ts:158`) walks the entity, structurally
detects every `{ en, zh }` body field (`isContentField`), and **throws at
prerender** if an approved record does not cover one. The build fails between the
declaration gate and the render gate, so an under-declared entity promotion cannot
ship. That net is the reason 002B's review accepted strict evidence at all.

A core page has no such object. `pageCopyFor` has seven call sites and all seven
are entity detail: `[lang]/{knowledge,applications,products,answers}/[slug]/page.tsx`
and `components/{product/product-view,application/application-view,answers/answer-article}.tsx`
(grep over `src/` at `f27bfca`). No core route reads it. So a boolean "this path
is translated" for `/es/quality` would advertise a self-canonical, hreflang- and
`inLanguage`-declaring Spanish page over copy nothing checks — the exact defect
GSC-INDEX-002 recorded 75 times as "Duplicate, Google chose different canonical".
This is 002B's blocker #1 in a different costume.

**Therefore the missing piece is a core-page analogue of the entity's enumerable
surface, not permission.** Supporting core evidence without it would ship the
defect this whole line exists to refuse.

### A3 · Measured state of the four example pages (and their neighbours)

Computed from a production build of `f27bfca` — 222 prerendered documents — by
comparing each ES/DE document's visible text blocks with its English owner's. A
block counts when it is longer than 12 characters and is not an
uppercase/numeric token (brand names, certificate numbers, dates and contact
strings are legitimately identical in any language and are excluded). Retention
is the share of a locale page's prose blocks that are **verbatim English**.

| owner path | ES prose blocks | ES still English | retention | DE retention | `/zh/` control |
| --- | --- | --- | --- | --- | --- |
| `/` (homepage) | 31 | 5 | **16 pct** | 21 pct | 2 pct |
| `/request-quote` | 12 | 2 | **17 pct** | 25 pct | 0 pct |
| `/contact` | 10 | 2 | 20 pct | 22 pct | 0 pct |
| `/request-sample` | 8 | 2 | 25 pct | 29 pct | 14 pct |
| `/manufacturing` | 9 | 4 | 44 pct | 57 pct | 0 pct |
| `/answers` (index) | 77 | 43 | 56 pct | 55 pct | 2 pct |
| `/knowledge/<slug>` | 11 | 6 | 55 pct | 60 pct | 0 pct |
| `/product-finder` | 12 | 7 | 58 pct | 64 pct | 42 pct |
| `/about` | 23 | 15 | 65 pct | 71 pct | 0 pct |
| `/products` (index) | 19 | 14 | 74 pct | 78 pct | 29 pct |
| `/products/<slug>` | 30 | 19 | 63 pct | 70 pct | 15 pct |
| `/quality` | 31 | 24 | **77 pct** | 80 pct | 13 pct |

Aggregate over these twelve: **ES 52 pct, DE 57 pct, ZH control 9 pct.**

Read this table as three different problems, not one:

1. **Genuinely localized, blocked by the path class.** `/` and
   `/request-quote` keep 5 of 31 and 2 of 12 blocks in English. Their nav, hero,
   CTAs and form labels are real Spanish — `src/content/company.ts`'s own locale
   comment claims "fully localized navigation, homepage, forms and CTAs", and the
   rendered output agrees. These are the card's real candidates, and today they
   consolidate onto the English owner with no hreflang.
2. **Not translated, correctly refused.** `/quality` keeps 77 pct, and the
   residue is body prose and the `<title>` itself: *"Quality Certification — ISO
   9001, OEKO-TEX Class I, Patents | Three Thai Textile"* and *"Quality evidence
   you can verify, not slogans"* render under `<html lang="es">`. No honest
   evidence rule should promote this page, and none will: the surface cannot be
   declared until the copy is gathered.
3. **Mixed in the way that makes a boolean fatal.** Every page above sits at some
   point on the gradient. A path-level flag cannot express "the hero is Spanish
   and the twelve card paragraphs are English" — which is the whole argument for a
   slot-level surface rather than a path-level switch.

**Method limits, stated plainly.** Exact-block equality overstates retention when
a phrase is legitimately identical in both languages, and understates it when a
translator kept English wording inside a larger translated block. It is an
upper-bound screen for *which* pages deserve a slot-level read, not a substitute
for one. The `/zh/` column is the calibration: Chinese is genuinely translated
under the model's own guarantee and scores 0-2 pct on nine of the twelve, so the
detector is not firing on structure alone. The three non-zero `/zh/` rows
(`/quality` 13 pct, `/products` 29 pct, `/product-finder` 42 pct) are themselves
findings worth a follow-up look — they are model-guaranteed owners today.

### A4 · Corroborated against production, not just the build

`curl -sS https://www.threethai.com/es/quality` (2026-09-08) returns
`<html lang="es">`, `<link rel="canonical" href="https://www.threethai.com/quality">`,
`og:locale en_US`, `og:url …/quality`, no alternates, an English title and
description, Spanish nav/breadcrumb/hero/CTA ("Calidad y certificación",
"Solicitar cotización"), and English body sections. So 002B's consolidation is
**deployed and live**, and the mixed-state finding is what a real crawler sees
today — not a local-build artifact.

### A5 · What each page's evidence would have to cover

The unit of evidence must be the copy slot the page renders, per page:

| page | what is already dictionary-driven (translatable today, ES/DE values exist) | what is not (must be gathered before a surface can be declared) |
| --- | --- | --- |
| `/` homepage | nav, hero title/lede, section headings, CTA labels, footer | stat labels and unit strings (`50+ documented specifications`, `34 + 2 patents`), any inline section prose |
| `/request-quote` | form labels, placeholders, helper text, submit CTA, privacy line | result/summary strings and inline microcopy in the form view |
| `/manufacturing` | page heading, breadcrumb, section titles | the process/capability prose that renders as English today |
| `/quality` | heading, breadcrumb, hero lede | the *entire* body: evidence intro, the four control cards, every certificate figcaption and `dl` label, and the metadata title/description |
| metadata (all four) | — | `title` / `description` are SEO output, not chrome: they must be slots in the surface, or the page keeps an English title under a localized canonical |
| forms/CTAs | labels, buttons, validation text | `src/lib/inquiry.ts` is a shared surface (§8) and is **not** in this allowlist; a form field whose text lives there cannot be evidenced by this task |

Two structural conclusions follow:

- **Body content for core pages is represented in three places at once** — the
  per-locale dictionary, inline literals inside each page's own components, and
  shared view components. A slot-level surface is only honest once a page renders
  its body from **one** addressable bundle; that is the migration, not this task.
- **Metadata validation cannot be separated from copy evidence.** `<title>` and
  `<meta description>` are produced from the same dictionary/entity layer
  (`src/lib/seo.tsx`, shared and out of allowlist), so a page whose title is
  English must not become an owner even if its body is fully translated. Slots
  for title/description belong in the surface.

## Design

### 1 · Current limitation (one sentence)

Evidence can describe only an entity detail page, because only an entity carries
an enumerable field list for the render net to check — so a core page with real
translated copy (`/es`, 84 pct non-English) still cannot own its URL, and a core
page that merely *declares* it is translated would be unverifiable by construction.

### 2 · Proposed architecture

Add a second promotable page class defined by a **declared copy surface**, and
give it the same kind of unforgable net an entity already has. Four pieces:

```text
src/content/page-surfaces.ts        (new, imports NOTHING)
  SECTION_SURFACES: { "/quality": ["heading", "lede", "cta", …] }   // empty at ship
        ↓ read by
src/content/translation-evidence.ts  (the gate)
  promotableClassFor(path) → "entity" | "section" | null   // both = null
  isGenuineTranslation(page, surfaces)   // section: must equal the surface exactly
  evidenceDecisionFor(…, surfaces)       // + surface-slot-undeclared / surface-slot-extra
        ↓ grants
src/content/translation-availability.ts  (the render net)
  pageCopyFor(path, locale, bundle, registry, surfaces)
     // promoted  → bundle widened with the reviewed copy
     // always    → bundle keys must equal the declared surface, or throw
        ↓ consumed by
src/content/availability.ts          (UNCHANGED — it was never the limitation)
```

Why this shape and not an exemption list:

- **Ownership stays evidence-only.** A registered surface grants *eligibility to
  be reviewed*, never ownership. Ownership still requires an approved record
  covering every slot, with provenance and a reviewer distinct from the
  translator. Two independent facts, exactly as 003A left them.
- **No prefix can create ownership.** Records key on the prefix-free owner
  (`/quality`); `/es/quality` is neither class and is refused. Pinned by test.
- **Missing evidence stays conservative.** Unregistered, incomplete, draft or
  self-approved all resolve to "English owner, no alternates", which is the state
  that cannot cost the site a duplicate-content penalty.
- **Entity rules are literally untouched.** `isDeepContentDetail` keeps its
  regex and its meaning; a path claiming both classes is promotable by **neither**
  (`if (entity === section) return null`), so a registry mistake fails closed
  into "refuse" rather than open into "apply the looser rule".
- **The policy layer is not asked to know about page kinds.** That is the
  architectural point: if support required a new branch in `availability.ts`,
  the four SEO surfaces could drift apart from each other again. It is therefore
  deliberately **not modified** — see Risk R1 for what that constrains.
- **Four independent nets**, each tested: gate refuses an incomplete/over-declared
  record; `isGenuineTranslation` refuses a partial page; `pageCopyFor` throws on
  bundle/surface drift *on every locale*, not only the promoted one; and the
  build suite checks a promoted document carries the reviewed copy and no longer
  the English blocks.
- **Nothing is a byte budget.** 003B's review lesson was that a fixed ceiling
  punishes legitimate content work, so no size limit appears anywhere here; the
  guards are structural (set equality), and the only byte assertions live in the
  built-output tests where they measure real per-request cost.

### 3 · Files affected

```text
src/content/page-surfaces.ts                          (new)  the registry; a leaf, imports nothing
src/content/translation-evidence.ts                   (mod)  promotableClassFor + class-aware gate + 2 reason codes
src/content/translation-availability.ts               (mod)  surfaces threaded; pageCopyFor = render net for both classes
tests/intl-dees-004b-core-page-evidence.mjs           (new)  18 tests
package.json                                          (mod)  test:seo filename appended ONLY — shared, §8, request below
tasks/intl-dees-004b-core-page-evidence.md            (new)  this card
worklog/intl-dees-004b-core-page-evidence.md          (new)  append-only record
```

Explicitly **not** changed: `src/content/availability.ts` (reverted mid-task —
see R1), `src/content/switcher-availability.ts` (its `SWITCHER_PATHS` already
covers every core owner path, so a future promotion reaches the switcher prop with
no edit), `src/content/translation-evidence`'s record/provenance types (a section
record needs no new field), `src/content/company.ts`, `src/lib/seo.tsx`,
`src/proxy.ts`, `src/app/sitemap.ts`, every page and layout, all content modules,
all dictionaries, `next.config.ts`, and every other task's suite.

### 4 · Risks

| | Risk | Mitigation / status |
| --- | --- | --- |
| **R1** | Threading a `surfaces` argument through `createAvailabilityPolicy` broke **two structural assertions in INTL-DEES-002B's own merged suite** ("the policy must ask the render resolution, not a class of paths"; "the policy must default to the evidence-derived promotions"), which pin `availability.ts` source text. | The right answer was not to edit another task's suite for a convenience. `availability.ts` is reverted to `f27bfca` byte-for-byte, both pins pass, and the end-to-end proof now runs on `resolvedContentLocaleOf(…, promotions, surfaces)` plus a new test asserting the shipped policy is still *derived from* exactly that predicate for all 55 owner paths. Consequence accepted and recorded: a synthetic-surface promotion cannot be pushed through the factory itself, only through the single predicate the factory is built on. |
| **R2** | A declared surface that omits prose the page still renders would promote a partial localization — the failure this design exists to prevent. | Real and residual. The registry cannot see JSX. Mitigated three ways: `pageCopyFor` throws if the bundle and the surface disagree **in either direction, on every locale**; the shipped `SECTION_SURFACES` is empty so no page is exposed yet; and the built-document retention check (`REQ 4 · the promotion-time completeness check`) fails any promoted path that still shares English blocks with its owner. Closing the last gap needs a per-page review at migration time — stated, not hidden. |
| **R3** | Zero promotions ship, so the mechanism has no production consumer yet. | Intentional (the card forbids enabling ES/DE). Every guard is exercised against synthetic fixtures inside the suite — the 003B pattern — because a mutation harness is not in this assignment. If a reviewer prefers a live consumer, the honest alternative is a reference migration of one page, which is content-adjacent work INTL-DEES-001 owns. |
| **R4** | New reason-code strings grow the server-side gate. | Measured, not assumed: `.next/static/chunks` is byte-identical to the pre-change baseline built in the same worktree (**821,280 B raw / 260,382 B gzip**, same 15 files, 0 chunks carrying any ownership string), because 003B removed the browser's route into this layer. The new literals are added to the suite's `POLICY_STRINGS` list so they cannot leak client-side unnoticed. |
| **R5** | `honouredPages` previously called `registry.filter(isGenuineTranslation)`; giving that function a second parameter would have silently passed the **array index** as the surfaces registry. | Would have made every registered surface look unregistered. Rewritten as an explicit arrow with a comment saying why; covered by the completeness tests. |
| **R6** | `/zh/quality`, `/zh/products`, `/zh/product-finder` show 13/29/42 pct English retention while being model-guaranteed owners. | Out of scope here (zh needs no evidence) but a genuine SEO finding surfaced by this audit. Filed as a coordination item for ORCHESTRATOR/TECHNICAL_SEO rather than silently widened into this diff. |
| **R7** | Metadata slots (title/description) live behind shared `src/lib/seo.tsx`. | Not touched. A future surface for a page whose title is English must include title/description as slots, and that migration will need a §8 request. Documented in A5 so nobody discovers it mid-promotion. |
| **R8** | High-risk surfaces per §11 (canonical, hreflang, sitemap). | All shipped answers are byte-identical: 222-document fingerprint shows **0 field differences** and **0 total byte delta** versus the pristine base build. Rollback is one `git revert`. |

### 5 · Migration strategy

Landing order, each step independently reviewable, and **none of it required to
merge this task** — the registry ships empty so this change is inert by design:

1. **Gather one page's body into a single bundle module** (e.g.
   `src/content/quality-copy.ts`) exporting one `{ en, zh }` object per slot,
   including title/description. Pure move of existing English plus the Chinese
   that already exists; no new translation.
2. **Render the page through `pageCopyFor(path, locale, bundle)`** and index with
   the returned `contentLocale`, the same contract the four detail routes already
   use. Drift fails the build, which is the point of doing step 1 and 2 together.
3. **Declare the surface**: `SECTION_SURFACES["/quality"] = [ …every slot… ]`.
   The bundle/surface equality check in `pageCopyFor` makes steps 2 and 3
   indivisible — a mismatch throws on any locale.
4. **Run the retention check** (the one in this suite) against the built
   document. Any surviving English block means step 1 missed prose; go back, do
   not shrink the surface to make the test pass.
5. **INTL-DEES-001 adds the record** with `status: "draft"`, carrying `source`
   (English verbatim) and `content` (the translation), `requiredFields` equal to
   the surface. A draft moves nothing.
6. **A second reviewer approves** (`reviewedBy !== translatedBy`, ISO date, real
   `sourceRevision`) and the page becomes an owner on the next build — canonical,
   hreflang, sitemap entry and `inLanguage` moving together, as 003A designed.
7. **Expect the neighbours' suites to complain on the first promotion.**
   `intl-dees-002b` pins `TRANSLATED_PAGES` empty and GSC-INDEX-002 /
   LOCALE-RETIRE-001 loop every fallback locale over every path; those failures
   are the inventory saying "update me", the same signal 002B's record describes —
   not a regression to code around.

Suggested sequencing: `/request-quote` and `/` first (83 pct and 84 pct
non-English today, so the least content work), `/manufacturing` next, and
`/quality` only after its body copy is actually translated — its 77 pct English
retention means a record today would be refused, correctly.

## In Scope

- The second promotable page class and its gate rules; the surface registry.
- `pageCopyFor` as the render net for both classes (bundle/surface equality).
- Synthetic-surface and synthetic-record tests proving each net fires.
- This audit, measured at `f27bfca`.

## Out of Scope

- Translating anything; enabling any ES/DE promotion; adding a real surface entry.
- Any change to canonical, hreflang, sitemap, schema or routing logic.
- Any page, layout, view, dictionary, `company.ts`, `seo.tsx`, `inquiry.ts` or
  `switcher-availability.ts` edit.
- Another task's suite (R1 resolved by reverting this task's file, not by editing
  theirs).
- The `/zh` retention findings (R6) and `TSEO-10-10`'s `Vary` half.

## File Allowlist

```text
src/content/page-surfaces.ts                      (new)
src/content/translation-evidence.ts
src/content/translation-availability.ts
src/content/availability.ts                       (in allowlist, ultimately UNCHANGED — see R1)
tests/intl-dees-004b-core-page-evidence.mjs       (new)
package.json                                      (test:seo filename only — shared, §8)
tasks/intl-dees-004b-core-page-evidence.md        (this card)
worklog/intl-dees-004b-core-page-evidence.md      (new)
```

## Inputs / Evidence

- `f27bfca` as base, verified by `git fetch` immediately before the first edit and
  re-verified at delivery: PR #30 merged 2026-09-08T13:43:52Z, so both 003A and
  003B are on `main` as the card's Context claims.
- Pristine baseline measured in this worktree before any edit: build 225/225,
  `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` **169/169 pass, 0 fail, 0 skipped**,
  chunks 821,280 B raw / 260,382 B gzip with 0 ownership-string chunks,
  222 documents, sitemap 55 prefix-free `<loc>` and 0 ES/DE locs.
- Retention table (A3) computed from that build; production corroboration (A4)
  fetched live.
- `AGENTS.md` §4 naming, §7 ownership, §8 shared files, §11 high-risk surfaces,
  §12 validation, §13 review, §14 delivery.

## Validation

Recorded at the committed state, not at an intermediate one.

| Gate | Result |
| --- | --- |
| `npm run lint` (`eslint .`) | PASS — no output, exit 0 |
| `npm run typecheck` (`tsc --noEmit`) | PASS — exit 0 |
| `npm run build` (`next build` + standalone prep) | PASS — 225/225 prerendered |
| `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` (11 suites) | **PASS — 187 tests / 187 pass / 0 fail / 0 skipped** (baseline 169 + 18 new) |
| `npm run test:first-wave` | PASS — 5 / 5, 0 skipped (it pins the same header and policy) |
| `git diff --check` | clean |

Every gate above was re-run at the final state, after the `availability.ts`
revert: the build was regenerated from the committed tree before the
build-grounded suites ran, so no number here is inherited from a stale build or
from another task's record.

| Measurement | base `f27bfca` | this head | delta |
| --- | --- | --- | --- |
| `.next/static/chunks` raw | 821,280 B | 821,280 B | **0** |
| `.next/static/chunks` gzip | 260,382 B | 260,382 B | **0** |
| client chunks carrying ownership strings | 0 | 0 | — |
| prerendered documents | 222 | 222 | 0 |
| document byte total | 17,054,062 B | 17,054,062 B | **0** |
| SEO-field + text differences | — | — | **0** |
| sitemap `<loc>` / ES-DE locs | 55 / 0 | 55 / 0 | — |
| sitemap body / robots body hash | `identical` | `identical` | — |
| ES/DE promotions | 0 | 0 | — |

On the gzip column: two successive builds of this *same* tree gave document gzip
totals of +225 B and −626 B against the base build while their **raw** totals
were byte-identical to the byte (17,054,062 both sides). Gzip output here is not
a stable signal across builds; raw is. Only the raw figures are quoted as
evidence, and the base/head raw equality — not a gzip improvement — is what
supports "no shipped output moved".

## Acceptance Criteria

- [x] A core/section page can become a valid localized owner through evidence.
- [x] Evidence is path-aware and slot-aware, not a path-level boolean.
- [x] Entity detail rules unchanged, including a record 003A would approve.
- [x] No URL prefix can create ownership; no unregistered path can be promoted.
- [x] Missing evidence stays conservative: English owner, no alternates.
- [x] Zero ES/DE promotions; nothing translated; no fake translations.
- [x] Existing EN/ZH and fallback behaviour byte-identical (222 documents).
- [x] No invented customers, certifications, factories, capacity, prices or claims.
- [x] No secret, artifact, generated output or unlisted application file in the diff.

## Coordination Items

- **For `ORCHESTRATOR` (shared file, `AGENTS.md` §8):**

```text
SHARED FILE CHANGE REQUEST
File: package.json
Task: INTL-DEES-004B
Reason: the card's validation gate is `npm run test:seo`; a suite not listed there is not run by the gate, so 004B's regression net would be decorative.
Exact proposed change: append " tests/intl-dees-004b-core-page-evidence.mjs" to the existing test:seo command string. No other key changes; no dependency changes.
Evidence: the same line was extended the same way by GSC-LOCALE-003A, INTL-DEES-002B, INTL-DEES-003A and INTL-DEES-003B, all merged.
Tasks affected: none other; the new file is self-contained and reads no fixture.
Risk: LOW — test manifest only.
Validation: `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` reports 187 tests, 0 fail, 0 skipped at the committed head.
```

- **For `ORCHESTRATOR` (board registration, shared file `tasks/README.md`):** the
  `intl-dees-002b / 003a / 003b / 004b` keys and their dependencies are still
  unregistered on the task board, and `AGENTS.md` §8 reserves
  `tasks/README.md` for ORCHESTRATOR. Registering them, and either ratifying the
  `qwen/intl-dees-*` branch/worktree naming used across this line or directing it
  back to §4's `codex/NN-*`, is a board decision this task cannot make for itself.

- **For `TECHNICAL_SEO` / `SEO_CONTENT` (new finding, not this task's scope):**
  `/zh/quality` (13 pct), `/zh/products` (29 pct) and `/zh/product-finder`
  (42 pct) retain verbatim English prose blocks while `zh` owns those URLs by the
  content model's guarantee — i.e. no evidence is required for them and 004B
  changes nothing about them. If any of that residue is body copy rather than
  legitimately identical tokens, it is a live hreflang-claiming page with partial
  Chinese, which is GSC-INDEX-002's defect class on a path the model assumes is
  safe. Recommend a small follow-up audit before more ES/DE work is sequenced.

- **For the INTL-DEES-004A owner:** if that audit exists outside this repository,
  publish it as an artifact (card, report or worklog) so a later worker can review
  against it rather than re-derive it. This task re-derived its premise from
  measurement; a diff between the two documents would be worth recording.

## Review Status

- Independent review: **not started**. The implementer is not a reviewer
  (`AGENTS.md` §13). Highest-value review targets, in order: (1) R1's resolution —
  whether proving section promotion through `resolvedContentLocaleOf` plus a
  derivation-equality test is sufficient, given the alternative was editing
  002B's suite; (2) whether an empty registry with four synthetic-fixture nets
  counts as "support implemented"; (3) A3's method limits and whether any page in
  the table was mis-read.

## Completion Record

- Commit: `4eae62f2cc1706976242243d40e44e7baa7c249d` (delivery record below; a
  follow-up commit amends only this card and the worklog with that SHA).
- Base: `f27bfcae83d0d7b6a758246ea8c72e65739c0015` (`origin/main` at branch
  creation and re-verified before delivery). No rebase needed.
- Changed files: the allowlist, with `src/content/availability.ts` ultimately
  untouched (R1).
- Validation at the committed head: lint PASS · typecheck PASS · `next build`
  PASS 225/225 · `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` **187 / 187 pass,
  0 fail, 0 skipped** (169 inherited + 18 in this suite) ·
  `npm run test:first-wave` PASS 5/5 · `git diff --check` clean · 222-document
  fingerprint **0 differences** and **0 raw byte delta** versus the pristine base
  build · `.next/static/chunks` byte-identical to the base build.
- Design decisions that changed under measurement, in order:
  1. First shape threaded a `surfaces` argument through
     `createAvailabilityPolicy(registry, surfaces)` so a synthetic promotion
     could be pushed through the shipped factory. The full gate caught it: two
     INTL-DEES-002B structural assertions pin that function's source text, and
     they failed. Reverted rather than editing another task's suite — the policy
     layer never needed the change, and a task that has to modify the suite
     guarding a layer to change a different layer is telling on itself.
  2. A fixture inside the new suite caught a real bug in the retention detector
     before it could become load-bearing: the non-translatable filter used
     `/^[\d.,\s°A-Z()/·—–%-]+$/i`, and the `i` flag made `A-Z` match lowercase,
     so ordinary English prose was classified as a non-translatable token and
     **silently skipped** — the check would have passed every promoted page,
     including a fully untranslated one. Case sensitivity restored, comment added.
  3. `page-surfaces.ts` was first written importing `isDeepContentDetail` from
     the gate that needs to import it back. Caught before compiling: a cycle
     where 003A's whole discipline is that the evidence layer is a leaf. The class
     decision moved into the gate (`promotableClassFor`) and the registry is now
     import-free, pinned by a test that fails if an `import` statement returns.
  4. A read-only subagent was launched to map per-page copy provenance and test
     pins. **Its report never arrived in this session's context**, so no claim in
     A1-A5 or in the design rests on it: every file:line cited here was read or
     grepped directly in this worktree at `f27bfca`, and every content claim was
     measured from the build or fetched from production. Recorded explicitly
     because a delegated summary that was never delivered must not read like a
     reviewed-and-rejected input, and because this workspace's own history
     (GSC-LOCALE-003) shows what an unverified confident `path:line` costs.
- Remaining risks: R2 is the one that matters — the architecture cannot itself
  prove a surface is complete, so the per-page review at migration time is load
  bearing, and the retention net is the backstop rather than the guarantee.
- Rollback: `git revert` the commit. It removes one leaf module, restores two
  modules to their `f27bfca` text, unregisters a test file and its manifest entry;
  no data, route, policy, content or dependency changes, and the rendered output
  is byte-identical with and without it (0 deltas in the Validation table), so
  there is no SEO or cached-URL consequence in either direction. Verify with
  `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` and by re-reading
  `.next/static/chunks` totals.

## Delivery

- Branch: `qwen/intl-dees-004b-core-page-evidence`
- Implementation commit: `4eae62f2cc1706976242243d40e44e7baa7c249d`
- Head commit: the documentation commit that records this SHA; the pushed branch
  head is authoritative.
- Pushed: task branch only. `main` untouched, per §9 and §13. No pull request
  opened — integration is the merge owner's action, and §13 requires a reviewer
  on another role/worker/thread before this is called approved.
- Post-deploy note for whoever merges: nothing observable changes on
  `threethai.com`. The change is inert until a surface and an approved record
  exist, so the verification that matters after merge is that ES/DE output is
  *unchanged* — re-read the live `/es/quality` canonical and `og:locale` exactly
  as A4 did, and expect the same values.
