# Task 65 — A background request may no longer choose the visitor's language

- **Task Key:** `locale-switch-english-return-codex-65`
- **Machine Contract:** None
- **Task ID:** `65` — provisional; `tasks/README.md` does not yet carry a row
  for this task (see Coordination Item 6)
- **Title:** Stop the client router's own requests from overwriting the stored language preference
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE` (locale routing / proxy — `AGENTS.md` §11)
- **Executor Platform:** `Qwen Code`
- **Current Provider:** Not pinned
- **Current Model Family:** Not pinned
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/65-locale-switch-english-return`
- **Pull request:** [#46](https://github.com/dylanliu2002/threethai-website/pull/46)
  — head `codex/65-locale-switch-english-return` → base `main`, 3 commits, OPEN
- **Worktree:** `worktrees/qwen-locale-switch-002-english-return` (directory name
  predates the branch rename and does not follow the `agent-NN-…` convention —
  see Coordination Item 2)
- **Owner:** implementer, not self-approving
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** `GSC-LOCALE-003A` (merged) — the preference cookie, the `/en`
  alias and the precedence order this task narrows; `INTL-DEES-003B`, `INTL-DEES-004B`
  and `LOCALE-RETIRE-001`, whose suites must stay green
- **blocks:** None

## Reported defect

Owner report, verbatim: switching the site language to German and then back to
English, then moving from one page to another (the example given: from an
`applications` page to `manufacturing`) shows German again.

Reproduced on a real browser against the standalone production build, not
inferred: after clicking English on a German page and landing correctly on the
prefix-free English page, clicking the in-site `Manufacturing` link arrives at
`/de/manufacturing` and the document declares German.

## Goal

The stored preference `threethai_locale` is the only input that can relocate an
unprefixed URL (precedence rule 5). It must be written only by a request the
visitor actually made. Today every response that reaches the persist step writes
it — including the client router's prefetches — so a background request issued
on behalf of a link nobody clicked can silently re-point every subsequent
unprefixed visit.

## Root cause

Measured, then confirmed against the framework source rather than guessed:

1. `/de/*` page loads and `/de/*` prefetches both hit rule 4 (`a prefixed URL is
   served as-is and records the locale it proves`) and write `de`.
2. The language notice's offer is a cross-locale link (`/en/<path>` on a German
   page). It is `next/link`, so the moment the notice renders, the client router
   prefetches it; that request also runs the full policy and writes the language
   being *offered*, not the one chosen.
3. After the visitor clicks English, the 307 to the prefix-free owner correctly
   writes `en` — but already-in-flight German prefetch responses land afterwards
   and write `de` back. Which of two concurrent responses answers last is the
   browser's decision, which is why the symptom reads as "sometimes".
4. The English page's `Manufacturing` link is a router transition. Its request
   carries `de`, rule 5 relocates it, and the visitor is served `/de/manufacturing`.

The mechanism is one missing distinction: **nothing in the policy asked whether
the request came from a person or from the page itself.**

## What was changed

**Fix A — gate the preference write on the request kind (`src/proxy.ts`,
`src/content/locale-routing.ts`).** `routeFor()` gains an optional
`documentRequest`. Omitting it means "an ordinary page load" and is
byte-identical to the previous behaviour, so `curl`, crawlers and browsers that
send no Fetch Metadata are untouched. `false` strips the write from the decision
(`persist: null`) and changes nothing else: the routing decision a prefetch
receives is unchanged, only the `Set-Cookie` is withheld. `persistLocale()` in the
proxy returns the response untouched when `persist` is `null`, and **both** the
serve and the redirect branch now persist through that one writer, so "this
request may not record a choice" has exactly one meaning.

The gate itself is `isDocumentNavigation()`: `Sec-Fetch-Dest !== "empty"`.

**Fix C — the notice's offer is a real anchor (`src/components/layout/locale-suggestion.tsx`).**
`<Link>` became `<a href={href}>`, matching what the header picker already does
and for the same measured reason: a prefetch of a cross-locale offer must not
pass through the client router's fetcher. The component's no-navigation posture
is unchanged — it still holds no `location`, no router and no `fetch`.

Fix A is the general fix; Fix C removes the specific prefetch that made the race
visible on every German page carrying the notice.

## Why the gate could not be written the obvious way

The natural guard is `RSC` / `Next-Router-Prefetch` / `?_rsc=…`. On the runtime
this app is served from, those markers **cannot** reach the proxy. Next strips
its own router headers and query parameter before middleware runs:
`next/dist/server/web/adapter.js` deletes the five `FLIGHT_HEADERS` for the
non-edge-rendering path, and `NextRequestHint` normalizes `_rsc` out of the URL.
Measured against the standalone server: a request carrying `RSC: 1`,
`Next-Router-Prefetch: 1` and `?_rsc=…` is answered **exactly** like a page load.
A guard written against any of them compiles, reads correctly, and never fires.

Fetch Metadata survives, and a browser reports a page's own fetch as
`Sec-Fetch-Dest: empty`. That is the only signal the gate asks.

## Success Criteria

- After switching to English on a German page, an in-site client-router click
  stays English (`/manufacturing`, and the document declares `en`).
- A request shaped like the router's own (`sec-fetch-dest: empty`) receives
  **no** `Set-Cookie` on every URL that would otherwise persist.
- Removing the write moves no routing decision: for every path × `_locale` ×
  cookie combination, the gated decision equals the page-load decision except for
  `persist`.
- The gate is source-pinned against Next's stripped markers, because no
  end-to-end test can distinguish a working gate from a dead one.
- No canonical, hreflang, sitemap, route, redirect status or content change.

## In Scope

- `src/proxy.ts`, `src/content/locale-routing.ts`,
  `src/components/layout/locale-suggestion.tsx`.
- `tests/language-switcher-roundtrip.mjs`, `tests/browser-language-switching.mjs`.

## Out of Scope

- **Fix B (read-side):** rule 5 still relocates a non-document request for an
  unprefixed URL. Two tabs sharing one cookie, or a stale `de` written before
  this deploy, can still send a prefetch to another locale. Deliberately not
  changed here — it is a second policy decision and it changes what existing SEO
  assertions measured. Recorded, not hidden.
- The `document.cookie` branch in `readSuggestion` — provably dead, because
  `threethai_locale` is `httpOnly` and no JS writes it. Reported, not touched.
- The already-registered adjacent defects in `GSC-LOCALE-003A`'s Coordination
  Items (a prefixed *document* visit still overwrites an explicit preference;
  the switcher drops query strings).
- Any route, canonical, hreflang, schema, sitemap, content or translation change.

## File Allowlist

```text
src/proxy.ts
src/content/locale-routing.ts
src/components/layout/locale-suggestion.tsx
tests/language-switcher-roundtrip.mjs
tests/browser-language-switching.mjs
```

## Task-Owned Administrative Files

- **Task card:** `tasks/65-locale-switch-english-return.md`
- **Worklog:** `worklog/agent-65-locale-switch-english-return.md`

## Forbidden / Shared Files

`package.json` and `package-lock.json`; `next.config.ts`; `middleware.ts`;
`src/app/**` including all three layouts and `globals.css`;
`src/components/layout/site-header.tsx` and `site-footer.tsx`;
`src/content/company.ts`; `src/lib/**`; `prisma/**`; `.github/**`;
`vercel.json`; `.env*`; `AGENTS.md`; `tasks/README.md`; `tasks/TEMPLATE.md`;
every other task's card, branch, worktree and worklog.

This task needed **no** shared-file change. No `package.json` edit was
required: both edited test files are already registered in `test:seo` and
`test:browser`.

## Inputs / Evidence

- Owner report (2026-09-14, this session).
- Reproduced on the standalone production build (`NODE_ENV=production`,
  `node .next/standalone/server.js`) with a real Chrome profile:
  - `a language chosen once survives an in-site click, not just the landing`
    → `AssertionError: Manufacturing landed on /de/manufacturing` (pre-fix).
  - `only a request the visitor made may rewrite the stored language`
    → `/de/products` with `sec-fetch-dest: empty` answered
    `set-cookie: threethai_locale=de; Path=/; Expires=…; Max-Age=31536000;
    Secure; HttpOnly; SameSite=lax` where `null` was required (pre-fix).
- Framework source: `node_modules/next/dist/server/web/adapter.js` (header
  stripping for the non-edge-rendering path) and
  `node_modules/next/dist/esm/server/web/adapter.js` / `internal-utils.js`
  (`_rsc` normalization).
- Pre-existing suites this change must not disturb: `GSC-LOCALE-003A`,
  `LOCALE-RETIRE-001`, `INTL-DEES-003B`, `INTL-DEES-004B`,
  `GSC-I18N-001`.

## Validation

Runs under `cmd.exe`, which is this host's shell.

```bash
npm run typecheck
npm run lint
npm run build
set REQUIRE_BUILD_OUTPUT=1 && npm run test:seo
set REQUIRE_BROWSER=1 && set REQUIRE_BUILD_OUTPUT=1 && npm run test:browser
```

The `VAR=1 command` form does not work here: `cmd.exe` answers
`'REQUIRE_BUILD_OUTPUT' is not recognized as an internal or external command`
and the suite never runs. Use `set VAR=1 &&` instead.

Both `node --test` invocations need the repository's TS resolution hook
(`--import ./tests/support/ts-extension-hooks.mjs`, which the scripts already
carry); run without it and `locale-routing.ts` fails to resolve `./company`.

Measured on the delivered tree, 2026-09-14:

- `npm run build` → `Compiled successfully in 6.7s`, **253/253** static pages,
  `ƒ Proxy (Middleware)` present, exit 0.
- `npm run typecheck` → exit 0 · `npm run lint` → exit 0.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **245 pass / 0 fail / 0 skipped**
  (14 files; `language-switcher-roundtrip.mjs` contributes 15 of them).
- `REQUIRE_BROWSER=1 REQUIRE_BUILD_OUTPUT=1 npm run test:browser` →
  **10 pass / 0 fail / 0 skipped**.
- `git diff --numstat` → 5 files, +345 / −18, no whole-file EOL churn
  (`proxy.ts` +44/−5, `locale-routing.ts` +31/−3, `locale-suggestion.tsx`
  +11/−4, roundtrip +134/−5, browser +125/−1).

### Pre-fix baseline, same worktree, same test net

The pre-fix sources were restored from `HEAD` while the post-fix tests stayed in
place, so every failure below is attributable to the code, not to the
environment. The pre-fix build was also clean (`253/253`).

| Suite | Pre-fix | Failure |
| --- | --- | --- |
| browser | 8 pass / **2 fail** | `Manufacturing landed on /de/manufacturing`; `/de/products` wrote `threethai_locale=de` to a `sec-fetch-dest: empty` request |
| roundtrip | 11 pass / **4 fail** | `the request-kind gate asks a signal the router cannot take away`; `the stored preference may only be written by a document navigation` (~1,200 leaked combinations); `REQ 5 · the proxy executes the decision without adding a rule of its own`; `REQ 6 · the notice can only ever be a link, never a navigation` |

Recorded honestly: `a prefetch nobody clicked may not move where the next URL
resolves` **passed pre-fix**. It is timing-dependent — the German prefetch has to
win the race against the English 307 — so it does not reliably detect this
regression on its own. The shape assertion (`set-cookie === null` for
`sec-fetch-dest: empty`) is what catches it deterministically.

### Negative controls

- **Four-marker mutation.** `isDocumentNavigation()` was rewritten to consult
  `RSC` / `Next-Router-Prefetch` / `?_rsc=…` instead of Fetch Metadata. Result:
  roundtrip 15 tests, **14 pass / 1 fail** — the single failure being
  `the request-kind gate asks a signal the router cannot take away`, i.e. the new
  source-level test is the only layer that catches a dead gate. The mutation was
  then reverted **from the byte backup**, and `src/proxy.ts` was re-verified at
  sha256 `73767a070b2c32754c00cd9fa4aba90a13421631d56ce7ca05758e6f6aa201c5`,
  4,227 bytes, 94 CRLF, 0 lone LF.
- **Revert control.** The same revert was performed a second time after the
  pre-fix baseline run above, byte-for-byte, with `git diff --numstat` returning
  to exactly the five files and five line counts listed above.
- A first browser-layer "reverse control" was written, then **deleted**: it could
  not distinguish a working gate from a dead one, because Next strips the marks
  first. The rule was moved to the source layer, which is why that test exists.

## Acceptance Criteria

- [x] The reported symptom is reproduced pre-fix and fixed post-fix, in a real
      browser against the production build.
- [x] Router-shaped requests receive no preference write, asserted per URL.
- [x] The write gate changes zero routing decisions across the full combination
      sweep, including the omitted-field case.
- [x] The gate's signal is source-pinned against the markers Next removes.
- [x] No canonical, hreflang, sitemap, route, status or content string changed
      — confirmed by the untouched pre-existing suites.
- [x] No shared file changed; no new test file needed registering.
- [x] The implementer did not approve this card.

## Coordination Items

1. **Fix B (the read side of rule 5) is a known, unfixed residual.** `/de/*` page
   loads still record `de`, by design; a visitor carrying a stale `de` from a
   pre-deploy session will still have their first unprefixed navigation
   relocated once. Two tabs on one profile share the cookie, so a prefetch in one
   tab can still move the other. Closing it means deciding that rule 5 may not
   act on a non-document request either, which changes measured behaviour of
   `GSC-LOCALE-003A`'s suite. Needs its own card and its own review.
2. **Worktree directory deviates from `AGENTS.md` naming.**
   `worktrees/qwen-locale-switch-002-english-return` does not match
   `worktrees/agent-NN-short-name`; the branch itself was renamed to the
   conforming `codex/65-locale-switch-english-return`. The worktree was **not**
   moved or recreated — it was verified clean and registered before this task
   started, and moving a registered worktree is itself a risky operation.
3. **The branch's upstream was `origin/main` and was unset.** `git branch
   --unset-upstream` was run before any push was contemplated, so a bare
   `git push` cannot write to `main`. Any push for this task must be explicit:
   `git push origin HEAD:refs/heads/codex/65-locale-switch-english-return`.
   That explicit form was the one used; the push created the remote branch and
   left `refs/heads/main` at `14a658961855f8e0b5cdce6a3c63867ff95dc51b`.
4. **`readSuggestion`'s `document.cookie` branch is dead code.** It tests
   `CHOSEN_LOCALE_COOKIE`, whose value is `"threethai_locale"` — the same
   `httpOnly` cookie the proxy writes. A repository-wide grep found **no** JS
   assignment to it, so the branch can never be true in a browser. It is
   harmless (it only suppresses a notice), no test pins it, and removing it is
   outside this task.
5. **A test in this set is timing-dependent and is not relied on.** See the
   pre-fix baseline: `a prefetch nobody clicked may not move where the next URL
   resolves` passed against the broken code. It is kept as a real-browser
   regression net, not as the detector.
6. **Board registration is requested, not performed.**
   `tasks/README.md` is a shared file and an ORCHESTRATOR-owned board. Its
   *Current Implementation Tasks* table lists only tasks 51 and 52 while cards
   through 64 exist, so this is a pre-existing gap, not a new one.

```text
SHARED FILE CHANGE REQUEST
File: tasks/README.md
Task: 65 (locale-switch-english-return-codex-65)
Reason: The implementation-task board has no row for this task, so the card and
  branch are not discoverable from the board. The table currently lists only
  tasks 51 and 52 while cards 60-64 are also absent.
Exact proposed change: add one row to the Current Implementation Tasks table:
  | 65 | `65-locale-switch-english-return.md` | TECHNICAL_SEO | `codex/65-locale-switch-english-return` | REVIEW |
Evidence: this card; branch `codex/65-locale-switch-english-return`; worktree
  `worktrees/qwen-locale-switch-002-english-return`.
Tasks affected: none. No allowlist overlap: `src/proxy.ts`,
`src/content/locale-routing.ts` and `src/components/layout/locale-suggestion.tsx`
are claimed by no other active card.
Risk: low, additive row and discoverability only.
Validation: board text only; no code path reads `tasks/README.md`.
```

7. **Pre-existing defect, adjacent, not fixed here.** `site-header.tsx` builds a
   locale path for the current path; on a retired-prefix URL such as
   `/pt/products` it can emit a nonsense href. Retired prefixes are 308-merged
   before a header ever renders, so the practical exposure is low. Reported for
   a future card.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Pull request: [#46](https://github.com/dylanliu2002/threethai-website/pull/46)
  is open against `main` and is the review surface.
- Independent reviewer evidence: none yet — the implementer cannot approve.
  The reviewer should specifically read: (a) whether gating only the *write*
  leaves a path where a prefetch still changes what is served; (b) the claim that
  `Sec-Fetch-Dest` is the only surviving signal, against
  `node_modules/next/dist/server/web/adapter.js`; (c) the new source-level test,
  which is the only guard against a silently dead gate; (d) Coordination Item 1.

## Completion Record

- Commit: `5319ab41d3b6611ae357f4d93c9f87fa6282fca1` — "fix(locale): only a
  document navigation may record the visitor's language" on
  `codex/65-locale-switch-english-return`, 5 files changed, +345 / −18. Author
  and committer verified as `dylanliu2002 <dylanliu2002@gmail.com>` (via
  `git log -1 --pretty=fuller`; the `AGENTS.md` `%an <%ae>` form is rejected by
  this host's shell guard).
- Pushed: `git push origin HEAD:refs/heads/codex/65-locale-switch-english-return`
  (explicit form; the branch has no upstream). Remote head
  `c45165775f17d2a208f11491ef8e100fafb25ddc`. **`main` was not touched** —
  `git ls-remote` confirms `refs/heads/main` is still
  `14a658961855f8e0b5cdce6a3c63867ff95dc51b`.
- Pull request: [#46](https://github.com/dylanliu2002/threethai-website/pull/46)
  — OPEN, base `main`, head `codex/65-locale-switch-english-return`, 3 commits.
  **Not merged. The implementer may not merge, and this card is not
  `APPROVED`** — `AGENTS.md` forbids a specialist from merging or otherwise
  modifying `main`, and the required flow is
  `IMPLEMENT -> REVIEW -> independent reviewer -> APPROVED -> merge`.
- Base: `origin/main` @ `14a658961855f8e0b5cdce6a3c63867ff95dc51b`
  (merge of PR #45), verified current at branch creation.
- Changed files: `src/proxy.ts`, `src/content/locale-routing.ts`,
  `src/components/layout/locale-suggestion.tsx`,
  `tests/language-switcher-roundtrip.mjs`, `tests/browser-language-switching.mjs`,
  this card, this task's worklog.
- Validation results: build 253/253, typecheck 0, lint 0,
  `test:seo` 245/245 (0 skipped), `test:browser` 10/10 (0 skipped); pre-fix
  baseline and mutation controls above.
- Worklog: `worklog/agent-65-locale-switch-english-return.md`
- Remaining risks: Coordination Items 1, 4, 5 and 7; verified against a local
  standalone prerender, **not** a deployed environment.

## Rollback

`git revert` the task commit, or delete the branch — nothing is deployed. The
change is three source files; reverting restores the previous policy exactly:
`persist` becomes a non-nullable locale again, `persistLocale` loses its `null`
branch, and the notice goes back to `<Link>`. No route, canonical, hreflang,
sitemap or content string moved in either direction, so no re-indexing action is
needed for the rollback. Rolling back re-introduces the reported defect.
