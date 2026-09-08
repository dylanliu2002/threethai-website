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

### A3 · Measured state of the four example pages — **SUPERSEDED, figures wrong; read A3b**

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

Aggregate over these twelve: **ES 52 pct, DE 57 pct, ZH control 9 pct.** — **WRONG:
every number in A3 understates English because the exclusion regex also ate
English prose. A3b is the corrected measurement; do not cite this row.**

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

### A3b · Corrected retention measurement (this is the one to cite)

A3 was produced by a script whose non-translatable block class was written
`/^[\d.,%\s°A-Z()/·—–-]+$/i`. With the `i` flag, `A-Z` matches `a-z` as well, so
**ordinary English prose was classified as a non-translatable token and dropped
from the denominator** — leaving mostly CJK and numeric blocks, which flattered
every ES/DE ratio and made the `/zh/` control look cleaner than it is. The same
bug existed in the suite's fixture helper (caught there by a fixture asserting
that surviving English *is* reported) but was not fixed in the tool that produced
A3, so A3 shipped wrong while its replacement looked plausible.

Re-measured on the same build, case sensitivity restored, only whole-string
contact details excluded — brand and certificate names deliberately **not**
excluded, because an English `<title>` containing "ISO 9001" is precisely the
finding this table exists to show. "Retention" = share of rendered prose blocks
(longer than 12 characters) that are verbatim identical to the English owner's.

| owner path | ES prose | ES verbatim English | ES retention | DE retention | `/zh/` control |
| --- | --- | --- | --- | --- | --- |
| `/request-quote` | 26 | 9 | **35 pct** | 39 pct | 23 pct |
| `/request-sample` | 21 | 8 | **38 pct** | 40 pct | 36 pct |
| `/` (homepage) | 103 | 55 | **53 pct** | 56 pct | 10 pct |
| `/contact` | 28 | 15 | 54 pct | 56 pct | 27 pct |
| `/product-finder` | 32 | 20 | 63 pct | 67 pct | 53 pct |
| `/answers` (index) | 110 | 70 | 64 pct | 64 pct | 4 pct |
| `/knowledge` (index) | 40 | 27 | 68 pct | 69 pct | 14 pct |
| `/about` | 52 | 39 | 75 pct | 76 pct | 7 pct |
| `/products` (index) | 63 | 47 | 75 pct | 77 pct | 56 pct |
| `/knowledge/<slug>` | 51 | 38 | 75 pct | 76 pct | 7 pct |
| `/manufacturing` | 48 | 38 | 79 pct | 81 pct | 8 pct |
| `/products/<slug>` | 104 | 87 | **84 pct** | 84 pct | 36 pct |
| `/quality` | 135 | 121 | **90 pct** | 90 pct | 23 pct |

Aggregate over these thirteen: **ES 71 pct, DE 72 pct, ZH control 21 pct.**

**What changed in the conclusion, not just the numbers.** A3 implied that `/es` and
`/es/request-quote` were essentially finished pages blocked by a technicality.
They are not: the best page in the set keeps 35 pct of its prose in English, and
the homepage 53 pct. **No core page is close enough to translate today that a
record could be approved honestly.** What is true, and what the corrected
distribution actually shows, is that the gap is *bimodal per page*: chrome, nav,
CTAs and the whole quote form are Spanish, while module-backed body copy, inline
literals and page metadata are English. Confirmed by the residue samples — on
`/es/request-quote` the 9 English blocks are its `<title>`, the header tagline,
three contact strings, `company.locationEn`, the "Trades internationally as…"
identity line and one footnote; on `/quality` they are 121 of 135 blocks
including the title and every body section.

That is a stronger argument for slot-level evidence than A3's framing was, and a
weaker argument for promoting anything soon. Both matter: the mechanism this task
ships is now unambiguously the right shape, and its registry is right to ship
empty.

**Dictionary coverage, measured directly** (`src/content/i18n`, leaf counts over
the runtime objects): EN **266** leaves / 247 distinct values; `es.ts` and `de.ts`
each define **128**, leave **138** absent, and hold 2-3 that are present but
unchanged — so after `getDictionary` merges toward English, **140 of 266 (53 pct)
of the effective ES and DE dictionary is still English**. `zh` is complete: 1 leaf
identical to EN. Per section, ES differing leaves out of EN:

```text
form   34/34   nav 8/8   actions 19/19   breadcrumbs 12/12   meta 2/4
home   28/40 (12 untranslated: home.why.points.*.title/.body)
finder  2/32   about 2/33   qualityPage 2/22   manufacturingPage 2/9
contact 2/7    productsPage 2/4    answersIndex 0/9    productsIndex 0/12
```

Two structural consequences for any future surface, both verified by reading the
code rather than inferred:

1. **`es`/`de` are typed `PartialDictionary`, so a missing key is a runtime
   fallback, not a compile error** — `zh` is typed `Dictionary` and *would* fail
   `tsc`. Adding a string to `en.ts` therefore silently becomes an English hole on
   `/es` and `/de`, invisible to the type system and to any key count. A surface
   declaration is the first place that hole becomes a build-visible problem, which
   is part of why it must be exhaustive.
2. **`getDictionary` merges toward English** (`src/content/i18n/index.ts`), so the
   dictionary can never itself answer "is this page translated?" — only an
   enumerated surface plus approved evidence can. This is the same reason 002B's
   owner rejected a chrome-coverage threshold.

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

### A6 · Two verified defects that must be cleared before any surface is declared

Both found by investigation and then verified directly in this worktree. Neither
is caused by this task, and neither is fixed here (both touch files outside the
allowlist), but a migration that ignores them would produce a promoted page that
is wrong in a way evidence cannot detect.

1. **`/es` links to the English tree for applications.**
   `src/components/sections/home-applications.tsx:21` and `:31` build
   `` href={`/${locale === "zh" ? "zh/" : ""}applications`} `` — hardcoding the
   assumption that only `zh` is prefixed. On `/es` and `/de` those links resolve to
   `/applications` and `/applications/<slug>`, bypassing the localized route that
   `localePath()` (`src/content/company.ts:95-98`) exists to build and that every
   other link on the same page uses. Today this is a minor navigation inconsistency
   on a fallback page; **if the homepage were ever promoted to an ES owner, its own
   internal links would point away from the localized tree**, which is a crawlable,
   indexable contradiction. Any homepage surface must fix these two lines first.
   The wider pattern is real — roughly 30 `locale === "zh" ? <zh> : <en>` string
   ternaries across `src/components/**` treat "not zh" as English, so chrome that
   sits outside the dictionary is invisible to both dictionary measurement and to
   any evidence record.
2. **The English twin of a core route is a second source of copy, and the two have
   already drifted.** `/` , `/applications`, `/knowledge`, `/answers`,
   `/request-quote`, `/request-sample` and `/product-finder` are **not** shared
   components between `src/app/(site)/…` and `src/app/[lang]/…` — they are two
   independent JSX trees (only `quality`, `manufacturing`, `about`, `contact` and
   the four detail routes delegate to a shared view). Verified concretely: the
   footnote in `(site)/request-quote/page.tsx` continues
   *"…Incoterm. This makes supplier offers comparable (see our price-comparison
   guide)"* while `[lang]/request-quote/page.tsx` stops at *"…Incoterm."*
   `tests/seo-route-parity.mjs:59-62` pins only that the two route **sets** match,
   never that their copy agrees. So a surface keyed to `/request-quote` describes
   **one** of the two renderers: the English owner URL can show text the reviewed
   bundle never declared. A surface for a duplicated route is only honest after
   its twins share one component, or the surface covers both literal sets.

## Design

### 1 · Current limitation (one sentence)

Evidence can describe only an entity detail page, because only an entity carries
an enumerable field list for the render net to check — so a core page with real
translated copy in its chrome and forms (`/es/request-quote` renders 34 of 34
Spanish `form` strings) still cannot own its URL, and no core page is fully
translated either (the least English-heavy keeps 35 pct of its prose blocks
verbatim English, A3b), so a boolean door would be both unusable and unfalsifiable.

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
| **R6** | `/zh/products` (56 pct), `/zh/product-finder` (53 pct), `/zh/request-sample` (36 pct), `/zh/products/<slug>` (36 pct) and `/zh/quality` (23 pct) retain verbatim English prose blocks while `zh` owns those URLs by the content model's guarantee. | Out of scope here (zh needs no evidence) but a genuine SEO finding surfaced by the corrected measurement. Filed as a coordination item for ORCHESTRATOR/TECHNICAL_SEO rather than silently widened into this diff. |
| **R7** | Metadata slots (title/description) live behind shared `src/lib/seo.tsx`. | Not touched. A future surface for a page whose title is English must include title/description as slots, and that migration will need a §8 request. Documented in A5 so nobody discovers it mid-promotion. |
| **R8** | High-risk surfaces per §11 (canonical, hreflang, sitemap). | All shipped answers are byte-identical: 222-document fingerprint shows **0 field differences** and **0 total byte delta** versus the pristine base build. Rollback is one `git revert`. |
| **R9** | Two verified defects sit upstream of any surface declaration: `home-applications.tsx:21,31` builds `/${locale === "zh" ? "zh/" : ""}applications` so `/es` links to the English tree, and seven core routes exist as **two** independent JSX trees that have already drifted (`(site)` vs `[lang]` request-quote footnotes differ). | Documented in A6 with file:line; migration step 0 makes clearing them a precondition. Not fixed here — both are outside this allowlist, and fixing the duplicated trees is a page refactor this card did not ask for. Evidence cannot see either one, which is why they are recorded rather than assumed away. |
| **R10** | `tests/intl-dees-003a-…mjs:346-347` pins that `/quality` and `/products` records are refused with `path-not-entity-detail`. Passes today only because `SECTION_SURFACES` is empty. | Correct behaviour, and it means the first real surface declaration will fail that suite until its inventory is updated — recorded as migration step 7 rather than weakened now. Also note `es`/`de` are `PartialDictionary`, so a missing Spanish string is a runtime fallback and never a `tsc` error: the type system cannot help here, only the surface can. |

### 5 · Migration strategy

Landing order, each step independently reviewable, and **none of it required to
merge this task** — the registry ships empty so this change is inert by design:

0. **Clear A6 first, per page.** For a homepage surface, fix
   `home-applications.tsx:21,31` to use `localePath()`; for any duplicated route
   (`/`, `/request-quote`, `/request-sample`, `/product-finder`, the section
   indexes), unify `(site)` and `[lang]` onto one component or account for both
   literal sets. Evidence cannot detect either defect, so the surface must not be
   declared until they are gone.
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
7. **Expect neighbouring suites to complain on the first core promotion**, and
   read them as inventories rather than regressions. Verified pins that will fail
   the moment a core path is promoted:
   `tests/intl-dees-003a-translation-evidence-model.mjs:346-347` asserts that a
   record for `/products` and for `/quality` is refused with
   `path-not-entity-detail` (true today, because nothing is declared — and false
   for a path whose surface exists and whose record is approved);
   `tests/intl-dees-002b-…mjs:139-152` and `:168-170` assert every core path is an
   English fallback with `[en, zh]` only;
   `tests/intl-dees-003b-…mjs:272-273` asserts a `/quality` promotion must not
   leak to other paths through the bridge;
   `tests/gsc-index-002-…mjs:268-282` and `tests/locale-retire-001-…mjs:475-492`
   loop core paths for the same absence. Each needs its inventory updated with the
   reason inline — 002B set that precedent for exactly this situation.

Suggested sequencing, on the corrected numbers: `/request-quote` and
`/request-sample` first (35 pct / 38 pct English residue and a fully translated
34-leaf `form` — the least content work, though both are duplicated route trees
and both currently carry an English `<title>`), then the homepage (53 pct, needing
12 `home.why.points` strings plus the `localePath()` fix in A6), and treat
`/manufacturing` (79 pct), `/about` (75 pct) and `/quality` (90 pct) as
translation work, not architecture work: a record for them today would be refused
by `copy-not-translated` and by the exact-coverage rule, correctly.
`/products` and `/answers` indexes sit behind `finder` (2/32) and
`answersIndex`/`productsIndex` (0 leaves), so they are the longest path.

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
  after correction, several `zh` routes still carry verbatim English prose blocks
  while `zh` owns those URLs by the content model's guarantee — `/zh/products`
  56 pct, `/zh/product-finder` 53 pct, `/zh/request-sample` 36 pct,
  `/zh/products/<slug>` 36 pct, `/zh/quality` 23 pct (aggregate `zh` control
  21 pct, against 71-72 pct for ES/DE). Chinese needs no evidence and 004B changes
  nothing for them, so if any of that residue is body copy rather than legitimately
  identical tokens it is a live hreflang-claiming page with partial Chinese —
  GSC-INDEX-002's defect class on a path the model assumes is safe. Recommend a
  small follow-up audit before more ES/DE work is sequenced.

- **For the INTL-DEES-002B / 003A owners (stale measured figure in merged code):**
  four places assert the UI dictionary is "128 of 248" strings per locale
  (`src/content/translation-availability.ts` header, `src/content/translation-evidence.ts`
  header, `tests/gsc-index-002-fallback-indexation.mjs`, and
  `tasks/intl-dees-003a-translation-evidence-model.md`). Measured directly on
  `f27bfca`: **EN has 266 dictionary leaves / 247 distinct values**, `es.ts` and
  `de.ts` each define 128 leaving 138 absent, of which 2-3 are present but
  unchanged — so 140 of 266 (53 pct) of the *effective* merged ES/DE dictionary is
  still English. The numerator is right; **the denominator 248 is not
  reproducible from the shipped tree.** These are other tasks' files and this task
  did not edit them; the corrected figures belong in their records, and any future
  coverage threshold should be defined against a measured denominator.

- **For `INTL-DEES-001` (content sequencing, from A3b/A6):** no core page is
  promotable today — the least English-heavy keeps 35 pct of its prose blocks in
  English. Cheapest real wins: `/request-quote` and `/request-sample` need only
  their `<title>`/description, `company.locationEn`, the identity footnote and a
  handful of inline strings; the homepage needs the 12 `home.why.points.*`
  strings plus the `localePath()` fix; `/quality`, `/about` and `/manufacturing`
  need body-copy translation work (`qualityPage` 2 of 22, `about` 2 of 33,
  `manufacturingPage` 2 of 9 dictionary leaves). Sequencing and preconditions are
  in Migration step 0-7.

- **For the INTL-DEES-004A owner:** if that audit exists outside this repository,
  publish it as an artifact (card, report or worklog) so a later worker can review
  against it rather than re-derive it. This task re-derived its premise from
  measurement; a diff between the two documents would be worth recording.

## Review Status

- Independent review: **not started**. The implementer is not a reviewer
  (`AGENTS.md` §13). Highest-value review targets, in order: (1) **A3b's corrected
  measurement** — re-derive it independently, because the first pass of the same
  tool was wrong in a way this implementer did not catch until a delegated report
  disagreed with it, and a second bad table here would misdirect the whole content
  line; (2) R1's resolution — whether proving section promotion through
  `resolvedContentLocaleOf` plus a derivation-equality test is sufficient, given
  the alternative was editing 002B's suite; (3) whether an empty registry with four
  synthetic-fixture nets counts as "support implemented", now that A3b shows no
  core page is near enough to translation to be promoted anyway; (4) whether A6's
  two verified defects should gate this merge at all, given nothing is activated by
  it and the registry ships empty.

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
  4. A read-only subagent was launched to map per-page copy provenance, dictionary
     coverage and test pins. Its report arrived **after** the first delivery, and it
     did not contradict the mechanism — it contradicted A3's numbers, which is how
     the regex defect was found. Every claim taken from it was then re-verified in
     this worktree before use: `home-applications.tsx:21,31` (confirmed by grep),
     the `(site)` / `[lang]` request-quote footnote drift (confirmed by diffing the
     two files), `tests/intl-dees-003a-…mjs:346-347` (confirmed by grep), and the
     dictionary leaf counts (re-measured independently, `en` 266 / `es` `de` 128
     each / `zh` complete). Its one figure I could not verify is left uncited.
     Recorded plainly because the sequencing matters for review: a delegated
     summary corrected this task's own headline finding only after that finding had
     been committed.
- **Audit correction issued after the first delivery pass.** A3's retention table
  was wrong and overstated how translated the core pages are — `/es` was reported
  at 16 pct English and is **53 pct**; `/es/request-quote` 17 pct → **35 pct**;
  `/es/quality` 77 pct → **90 pct**; aggregate ES 52 pct → **71 pct**. Cause: the
  measuring script's non-translatable class carried an `i` flag, so `A-Z` matched
  lowercase and ordinary English prose was excluded from the denominator. The same
  defect had already been caught and fixed inside this task's own test helper by a
  fixture — but the fix was not carried back into the tool that produced the
  headline claim, so the wrong table survived review by me and reached the card and
  a source-file comment. Corrected measurement is A3b; A3 is marked superseded in
  place rather than deleted, and `src/content/page-surfaces.ts`'s comment now
  carries the right numbers. Discovered because a delegated fact-finder reported
  counts that would not reconcile with my table; I re-measured instead of
  defending it. **Materiality:** the shipped mechanism, the gates, the tests and
  every byte-level guarantee are unaffected — no promotion, surface or claim
  depended on those ratios, and the empty registry is if anything better supported
  by the corrected data. What was wrong was the framing ("two pages are finished
  but blocked") and the migration sequencing built on it.
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
- Validated code head: `a9b7a514b185b1bff4c77ed0ab1761e270e06848` — every gate in
  the Validation table was measured at this tree. Commits after it are records-only;
  `git diff --name-only a9b7a51 HEAD` returns just this card and the worklog, so the
  gated code and the delivered code are the same tree. The pushed branch head is
  authoritative.
- Pushed: task branch only. `main` untouched, per §9 and §13.
- Pull request: **#32**, `https://github.com/dylanliu2002/threethai-website/pull/32`,
  opened 2026-09-08 against `main` @ `f27bfca` at head `a9b7a51`; `state: OPEN`,
  `mergeable: MERGEABLE`, `reviewDecision` empty. Not merged, and the merge owner
  is the only party who may integrate it (§1, §13) — this task asked explicitly not
  to be merged on its own description.
- Post-deploy note for whoever merges: nothing observable changes on
  `threethai.com`. The change is inert until a surface and an approved record
  exist, so the verification that matters after merge is that ES/DE output is
  *unchanged* — re-read the live `/es/quality` canonical and `og:locale` exactly
  as A4 did, and expect the same values.
