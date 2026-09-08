---
Task Key: INTL-DEES-003B
Role: TECHNICAL_SEO
Task: Server/Client Boundary Cleanup for translation availability
Branch: qwen/intl-dees-003b-server-client-boundary
Commit: see pushed head
Date: 2026-09-08

Work Log:
- Read workspace `AGENTS.md`, repository `AGENTS.md` §1-§15, `tasks/TEMPLATE.md`
  and the user-supplied INTL-DEES-003B assignment. Implementation-only role: no
  merge, deploy, Search Console or Vercel authority claimed, and `main` untouched.
- Resolved the assignment's base by measurement before assuming it. The card said
  "current main after PR #27 merge candidate"; `git fetch` + `gh pr view 27`
  showed `origin/main == d34cd95` and **PR #27 still OPEN** (`mergedAt: null`,
  head `e99937e`) — so the named base does not exist, and `d34cd95` contains no
  evidence layer to fix. Surfaced the conflict to the requester rather than
  silently picking one, and the chosen resolution is recorded in the card: branch
  from `e99937e`, PR targets `qwen/intl-dees-003a-translation-evidence-model`,
  retarget to `main` after #27 merges, and never merge this one first.
- Created branch + isolated worktree
  `worktrees/qwen-intl-dees-003b-server-client-boundary` from `e99937e`. Touched
  no other branch, worktree or the legacy `backlink-agent-worktree/`. Recorded
  the same two governance deviations INTL-DEES-003A recorded: the branch keeps the
  `qwen/` namespace of this task line (the INTL-DEES keys are not numeric, and
  `tasks/README.md` says there is no Task 53), and a real `npm ci` was installed
  rather than the `node_modules` junction repository `AGENTS.md` §3 suggests
  (a junction makes Turbopack abort with "Symlink node_modules is invalid").
- Set and verified Git identity `dylanliu2002 <dylanliu2002@gmail.com>` in this
  worktree before editing, and re-verified it on the created commits with
  `git log -1 --pretty=fuller` before pushing (`--format='%an <%ae>'` cannot be
  used here: the shell guard rejects `%`).
- Established the actual coupling before designing it away. `site-header.tsx`
  imports `localizedLocalesFor` from `@/content/availability` and uses it in
  exactly one expression, `localizedTargets`, consumed only by two attribute
  pairs (`hrefLang`/`lang`) on the desktop and mobile switchers. Nothing else in
  the browser reads the policy — which is why one prop closes the whole leak.
- Found, before writing anything, that two **merged** suites pin the header's
  source text: GSC-INDEX-002 asserts `/localizedLocalesFor\(currentPath\)/` and
  the two gated `hrefLang={localizedTargets.includes(l) …}` expressions, and
  LOCALE-RETIRE-001 asserts `locales.map((l) =>` twice plus
  `const UI_PREFIXES = locales.filter`. The first of those forbids the fix this
  card requires, so the boundary could not be made without touching another
  task's suite. Preserved every behavioural assertion (both gated expressions,
  both `locales.map`, `switchHref`, `UI_PREFIXES`, the focus-management pins in
  `first-wave-correctness.mjs`) and changed only the one assertion that encoded
  the coupling, with the reason inline and a new assertion that forbids the
  import from coming back. Recorded as a Coordination Item, following
  INTL-DEES-002B's precedent for updating other cards' pins.
- Derived the path inventory from ground truth rather than from the sitemap's
  own list. Enumerated every prerendered document that actually renders a
  switcher and compared its prefix-free path against the inventory a
  content-derived map would produce: 55 built paths, 55 candidate paths, **0
  missing and 0 extra**. (The script's first run also emitted a bogus `/index`,
  traced to its own normalization of the root `index.html`, and fixed — recorded
  so the number is not misread.)
- Implemented the seam: new server-only `src/content/switcher-availability.ts`
  asks the policy once per inventoried path; the three root layouts pass the
  result as one prop; the header's `localizedTargets` now reads that prop.
  `src/content/availability.ts`, the evidence layer and every route are
  untouched, so no SEO decision moved location.
- Caught my own first design in measurement, and changed it. The initial bridge
  shipped the complete `path → locales` map — chosen deliberately so the client
  would hold no ownership statement at all, with a fail-closed `?? []` for
  unmapped paths. Measured after a full build: `.next/static/chunks` fell as
  hoped, but **every document grew +3,210 B raw / +800 B gzip** (+712,580 B and
  +177,489 B gzip across 222 documents, +4.5 % of total HTML), because the props
  are serialized into each page's flight payload. That trades 586 gzip bytes once
  (cached, shared) for 800 gzip bytes on every page view. Re-encoded to
  `common` + `exceptions`, where `common` is the policy's **modal answer
  computed over the inventory** — not a literal — and `exceptions` holds only the
  paths the policy answers differently. Re-measured: **+67 B raw / +23 B gzip per
  document**, with the chunk still clean.
- Verified the re-encoding did not quietly move a rule into the browser: the
  header names no locale list (asserted: no `["en", "zh"]` literal), the bridge
  computes `common` from `localizedLocalesFor` rather than writing it down, and
  both branches the client reads are server-supplied data. Also confirmed the
  serialized prop really reaches the browser state by reading the built payload:
  `"common":["en","zh"]` is present in the flight data, and the server-rendered
  switcher emits the same 5 `hrefLang=` attributes as `e99937e`.
- Chose `common` as the fallback for an un-inventoried path rather than the
  earlier `?? []` after checking which is faithful: before this change such a
  path was answered by the policy itself and returned the modelled pair, so
  `common` preserves prior behaviour while `[]` would have been a silent change
  for any future route class. Stated as remaining risk 1, not smoothed over.
- Two of my own test bugs, both caught by measurement rather than review:
  (1) I wrote `availableLocales[currentPath] \?\| \[\]` into three assertions —
  `\|` matches a literal pipe, so a correct implementation failed; (2) a scan for
  files referencing the bridge matched the header's *prose* mention and missed
  the bridge itself, so the importer set was wrong. Fixed by narrowing to import
  specifiers. A third, in the probe rather than the product: I asserted the built
  switcher's `hreflang` attributes with a lowercase regex and reported a
  regression on `/about`. Measured both builds before believing it — Next renders
  `hrefLang` with the camel case intact, and the mobile panel is portal-rendered
  so it never appears in prerendered HTML. Both builds emit identical anchors;
  the fix was to the test. (This is the same case-sensitivity trap a previous
  task recorded for `hreflang` counting.)
- Deliberately not done: no mutation harness (the assignment says none), no new
  page or route, no translation, no promotion, no header redesign, no unrelated
  bundle work, no other task's card, and no edit to the evidence model.
- Validation at the committed state: lint PASS; typecheck PASS; `next build` PASS
  225/225; `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` 167 tests / 167 pass / 0
  fail / 0 skipped; `node --test tests/first-wave-correctness.mjs` PASS;
  `git diff --check` clean.
- Equivalence proof, measured not argued: a semantic fingerprint of all 222
  prerendered documents (page set, `<html lang>`/`dir`, canonical, every
  `rel=alternate` hreflang pair, title, description, robots, `og:locale`,
  `og:url`, JSON-LD `@type` set, every `"inLanguage"`, and the rendered text),
  compared against the INTL-DEES-003A build → **222 documents both sides, 0
  pages added or removed, 0 field differences**. Byte hashing of `.html`/`.rsc`
  was deliberately not used as evidence: on this host two builds of identical
  source differ by ~14 bytes in every document (see that note in project memory).

Stage Summary:
- Deliverable: the browser no longer imports or executes the SEO ownership
  policy; it receives the answer as ~90 bytes of data. The shared client bundle
  is 1,486 B raw / 582 B gzip **below** the INTL-DEES-002B baseline, and no
  rendered SEO surface changed.
- Evidence: the measurement table in the card, the 11-test boundary suite, and a
  full-suite gate at 167/167 with build output required.
- Next: independent review of the pushed head; implementer cannot approve.
  Delivery note: this PR is stacked on PR #27 and must be retargeted to `main`
  after #27 merges.
- Open after this task: the switcher query-string defect and the
  cookie-overwrites-preference defect (both untouched, still open elsewhere);
  INTL-DEES-001 still owns producing ES/DE copy; a future large `exceptions` set
  should revisit the prop encoding or move the switcher server-side per page.
