# Task 65 Worklog — A background request may no longer choose the visitor's language

## 2026-09-14 — Assignment, base, and the two governance actions it needed

Owner report, verbatim: switching to German and back to English, then moving from
one page to another (the example given: `applications` → `manufacturing`) shows
German again. Plus a request to look for other problems in the language-switching
path and fix them.

- Executor Platform `Qwen Code`; Role `TECHNICAL_SEO`; mode `IMPLEMENT`; profile
  `HIGH_RISK_CODE` (locale routing / proxy is HIGH-RISK under `AGENTS.md` §11).
  Provider and model family not pinned.
- Base `origin/main` = `14a658961855f8e0b5cdce6a3c63867ff95dc51b` (merge of PR #45),
  verified current at branch creation. Worktree
  `worktrees/qwen-locale-switch-002-english-return`.
- Real `npm ci` in the worktree (exit 0). The `node_modules` junction that the
  repository `AGENTS.md` suggests breaks Turbopack on this host and was not used.
- **Two governance actions taken before any code was written, both recorded on the
  card as Coordination Items 2 and 3:**
  1. The branch was created with `origin/main` as its upstream, so a bare
     `git push` would have targeted `main`. `git branch --unset-upstream` was run
     first. Any push for this task must be explicit:
     `git push origin HEAD:refs/heads/codex/65-locale-switch-english-return`.
  2. The branch was renamed to `codex/65-locale-switch-english-return` to satisfy
     the `codex/NN-short-task-name` namespace. The worktree **directory** still
     reads `qwen-locale-switch-002-english-return`; it was verified clean and
     registered and was deliberately neither moved nor recreated, because moving a
     registered worktree is itself a risky operation.
- Git identity set and verified as `dylanliu2002 <dylanliu2002@gmail.com>`. The
  `AGENTS.md` verification command (`git log -1 --format='%an <%ae>'`) cannot be
  run on this host: the shell guard rejects a command containing `%`. Verified
  instead with `git log -1 --pretty=fuller`, which prints
  `Author: dylanliu2002 <dylanliu2002@gmail.com>` on the task commit.
- No shared file was touched. No `package.json` edit was needed: both edited test
  files are already registered in `test:seo` and `test:browser`.
- The implementer is not the reviewer; the card moves to `REVIEW`, not `APPROVED`.

## 2026-09-14 — The mechanism, measured before anything was changed

Reproduced on the standalone production build with a real Chrome profile, not
inferred from the source:

- Switch a German page to English, then click the in-site `Manufacturing` link.
  Pre-fix this lands on `/de/manufacturing` and the document declares German.
- `set-cookie` on the routing responses was the layer nobody had measured. The
  three rules that persist — 4 (a prefixed URL records itself), 2 (the `/en` alias
  records English), 5 (the prefix-free owner records English) — each ran for
  **every** request that reached them, including the client router's prefetches.

The chain, in order:

1. `/de/*` page loads *and* `/de/*` prefetches both hit rule 4 and write `de`.
2. The language notice's offer is a cross-locale `next/link`, so the moment the
   notice rendered on a German page the router prefetched `/en/<path>` — a request
   nobody clicked, which wrote the language being *offered* as the visitor's own
   choice.
3. The visitor clicks English; the 307 to the prefix-free owner correctly writes
   `en`; the German prefetch responses already in flight land afterwards and write
   `de` back. Which of two concurrent responses arrives last is the browser's
   decision, which is why the owner's report reads as "sometimes".
4. On the English page, the `Manufacturing` link is a router transition carrying
   `de`, so rule 5 relocates it and the visitor gets `/de/manufacturing`.

One missing distinction: nothing in the policy asked whether the request came from
a person or from the page itself.

## 2026-09-14 — Why the obvious gate cannot work on this runtime

The natural guard is `RSC` / `Next-Router-Prefetch` / `?_rsc=…`. It cannot fire
here. Next removes its own router markers **before** the proxy runs:

- `node_modules/next/dist/server/web/adapter.js` deletes the five `FLIGHT_HEADERS`
  (`RSC`, `Next-Router-Prefetch`, `Next-Router-State-Tree`, `Next-HMR-Refresh`,
  `Next-Router-Segment-Prefetch`) on the non-edge-rendering path, and its
  `NextRequestHint` normalizes `_rsc` out of the URL.
- Measured against the standalone server: a request carrying `RSC: 1`,
  `Next-Router-Prefetch: 1` and `?_rsc=…` is answered **exactly** like a page load.

So a guard written against any of those compiles, reads correctly, and never
withholds anything. Fetch Metadata survives, and a browser reports a page's own
fetch as `Sec-Fetch-Dest: empty`. That is the only signal the gate asks, and the
reason is written into the code rather than left to be rediscovered.

## 2026-09-14 — What was changed

- **Fix A — `src/proxy.ts` + `src/content/locale-routing.ts`.** `routeFor()` gains
  an optional `documentRequest`. Omitting it is "an ordinary page load" and is
  byte-identical to the previous behaviour, so `curl`, crawlers and any browser
  sending no Fetch Metadata keep exactly what every earlier assertion measured.
  `false` strips the write from the decision (`persist: Locale | null` →
  `null`) and changes nothing else. The public `routeFor` wraps a private
  `decideRoute`; the six precedence rules are untouched, line for line.
  `persistLocale()` returns the response untouched when `persist` is `null`, and
  **both** the serve and the redirect branch now write through that one call — the
  serve branch previously guarded the write inline, which made "who may write"
  a property of the branch rather than of the decision.
- **Fix C — `src/components/layout/locale-suggestion.tsx`.** The notice's offer
  changed from `<Link>` to `<a href={href}>`, the same shape the header picker
  already uses and for the same measured reason. The component's no-navigation
  posture is unchanged: still no `location`, no router, no `fetch`.

Fix A is the general fix. Fix C removes the specific prefetch that made the race
visible on every German page carrying the notice.

## 2026-09-14 — The two tests, and one I deleted

- `tests/language-switcher-roundtrip.mjs`, `the stored preference may only be
  written by a document navigation`: sweeps every path × `_locale` × cookie
  combination and asserts (a) no router-shaped request writes anything, (b) the
  gated decision equals the page-load decision except for `persist`, and (c) the
  *omitted* field still means "document", so existing SEO assertions keep the
  meaning they had. Plus three spelled-out shapes for a reader.
- `tests/language-switcher-roundtrip.mjs`, `the request-kind gate asks a signal the
  router cannot take away`: source-pins `isDocumentNavigation()` to Fetch Metadata
  and forbids Next's own router markers inside it.
- `tests/browser-language-switching.mjs`, `only a request the visitor made may
  rewrite the stored language`: per URL, a page load writes the language it serves
  and the same URL with `sec-fetch-dest: empty` writes **nothing**.
- `tests/browser-language-switching.mjs`, `a language chosen once survives an
  in-site click, not just the landing`: the owner's report end to end.
- **Deleted before delivery:** a first browser-layer "reverse control" that sent
  `RSC: 1` / `Next-Router-Prefetch: 1` and asserted no write. It cannot
  distinguish a working gate from a dead one, because Next strips those marks
  first — it would have passed against the broken code, which is the opposite of a
  control. The rule moved to the source layer, where a stripped marker and an
  ignored marker are visibly different things.

## 2026-09-14 — Pre-fix baseline on this same worktree

The pre-fix sources were restored from `HEAD` while the post-fix tests stayed in
place, so every failure below is attributable to the code rather than to the
environment. The pre-fix build was clean too (253/253), so nothing here is a build
artifact. Both suites were run with the repository's TS resolution hook
(`--import ./tests/support/ts-extension-hooks.mjs`); without it,
`locale-routing.ts` fails to resolve `./company` and the run dies with
`ERR_MODULE_NOT_FOUND`, which is a harness mistake and not a defect.

| Suite | Pre-fix result | Failures |
| --- | --- | --- |
| `test:browser` | 8 pass / **2 fail** | `Manufacturing landed on /de/manufacturing`; `/de/products` with `sec-fetch-dest: empty` answered `set-cookie: threethai_locale=de; Path=/; Expires=Mon, 13 Sep 2027 16:29:37 GMT; Max-Age=31536000; Secure; HttpOnly; SameSite=lax` where `null` was required |
| `test:seo` (roundtrip file) | 11 pass / **4 fail** | `the request-kind gate asks a signal the router cannot take away` (`actual: ''`); `the stored preference may only be written by a document navigation` (~1,200 leaked `'/zh ?_locale=pt cookie=pt wrote zh'`-shaped combinations, `expected: []`); `REQ 5 · the proxy executes the decision without adding a rule of its own`; `REQ 6 · the notice can only ever be a link, never a navigation` |

**Recorded because it weakens the net, not strengthens it:**
`a prefetch nobody clicked may not move where the next URL resolves` **passed
pre-fix**. It depends on the German prefetch winning a race against the English
307. It is kept as a real-browser regression net; it is not the detector. The
detector is the shape assertion — `set-cookie === null` for
`sec-fetch-dest: empty` — which is deterministic.

## 2026-09-14 — Negative control

`isDocumentNavigation()` was mutated to consult `RSC` /
`Next-Router-Prefetch` / `?_rsc=…` instead of Fetch Metadata. Result: roundtrip
**15 tests, 14 pass / 1 fail** — the single failure being
`the request-kind gate asks a signal the router cannot take away`. That is the
proof the new source-level test is the only layer that catches a dead gate, and
the reason it exists.

The mutation was reverted **from a byte backup kept outside the repository**
(`%TEMP%\qwen-65-prefix-backup-20260914\`, five files) and `src/proxy.ts` was
re-verified at sha256
`73767a070b2c32754c00cd9fa4aba90a13421631d56ce7ca05758e6f6aa201c5`,
4,227 bytes, 94 CRLF, 0 lone LF. The same byte-for-byte revert was performed a
second time after the pre-fix baseline run, and `git diff --numstat` returned to
exactly the five files and five line counts listed below.

## 2026-09-14 — Final gates on the delivered tree

- `npm run build` → `Compiled successfully in 6.7s`, **253/253** static pages,
  `ƒ Proxy (Middleware)` present, exit 0.
- `npm run typecheck` → exit 0. `npm run lint` → exit 0.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → **245 pass / 0 fail / 0 skipped**
  (14 files; the roundtrip file contributes 15).
- `REQUIRE_BROWSER=1 REQUIRE_BUILD_OUTPUT=1 npm run test:browser` →
  **10 pass / 0 fail / 0 skipped**.
- `git diff --numstat` → 5 files, +345 / −18, no whole-file EOL churn:
  `proxy.ts` +44/−5, `locale-routing.ts` +31/−3, `locale-suggestion.tsx` +11/−4,
  `language-switcher-roundtrip.mjs` +134/−5,
  `browser-language-switching.mjs` +125/−1.
- Commit `5319ab41d3b6611ae357f4d93c9f87fa6282fca1` — "fix(locale): only a
  document navigation may record the visitor's language", 5 files changed,
  345 insertions, 18 deletions. Author and committer both verified as
  `dylanliu2002 <dylanliu2002@gmail.com>`. **Not pushed, not merged, no pull
  request opened.**

## 2026-09-14 — Deliberately not done

- **Fix B, the read side of rule 5.** Rule 5 still relocates a *non-document*
  request for an unprefixed URL. Two tabs on one profile share the cookie, so a
  prefetch in one can still move the other, and a visitor carrying a stale `de`
  from before this deploy still gets one relocated visit. Closing it changes
  what `GSC-LOCALE-003A`'s suite measured, so it is a second policy decision and
  needs its own card and its own review. Recorded as Coordination Item 1.
- **`readSuggestion`'s `document.cookie` branch.** Its constant resolves to
  `threethai_locale`, the `httpOnly` cookie the proxy writes, and a
  repository-wide grep found no JS assignment to it, so the branch can never be
  true in a browser. Harmless — it only suppresses a notice — and unpinned by any
  test. Reported, not touched.
- **The already-registered adjacent defects in `GSC-LOCALE-003A`:** a prefixed
  *document* visit still overwrites an explicit preference, and the switcher drops
  query strings.
- **`site-header.tsx` on a retired-prefix URL** can build a nonsense locale href;
  retired prefixes are 308-merged before a header renders, so exposure is low.
- No route, canonical, hreflang, sitemap, schema, content, translation, status or
  configuration change. No new claim of any kind, commercial or technical.

## 2026-09-14 — Operational notes for the next session

- Ports 3000/3001/3002/3131/3178 were confirmed closed before the build. A
  running standalone preview server makes the next `build` hang with no output on
  this host; stop it and re-probe the port rather than waiting.
- `node --test` in this repository needs
  `--import ./tests/support/ts-extension-hooks.mjs`, which `test:seo` and
  `test:browser` already carry. Running `node --test <file>` directly dies with
  `ERR_MODULE_NOT_FOUND` on `./company`.
- The shell guard on this host rejects a command containing `%`, which is why the
  `AGENTS.md` identity check was run as `git log -1 --pretty=fuller`.
- A byte backup of the five edited files lives outside the repository at
  `%TEMP%\qwen-65-prefix-backup-20260914\`. It is not committed and must not be.

## 2026-09-14 — Environment variables, and the gates re-run on the reinstalled tree

Two corrections/additions to the notes above.

- **The `VAR=1 command` form does not work on this host.** `REQUIRE_BUILD_OUTPUT=1
  npm run test:seo` is answered with
  `'REQUIRE_BUILD_OUTPUT' is not recognized as an internal or external command`
  and the suite never runs — the shell is `cmd.exe`, so the variable must be set
  first. The working forms are `set REQUIRE_BUILD_OUTPUT=1 && npm run test:seo`
  and `set REQUIRE_BROWSER=1 && set REQUIRE_BUILD_OUTPUT=1 && npm run
  test:browser`. The card's Validation block was corrected to the working form.
  Every number previously recorded on this page was measured with the variable
  actually set, so no result above is affected; only the transcribed command
  form was wrong.
- **A stray background `npm ci` (exit 0, 844 packages) and a background
  `npm run build` landed after the delivery commit**, replacing `node_modules`
  from the same lockfile. `git status --short` stayed empty and no lockfile or
  manifest moved, so nothing durable changed. Because the dependency tree was
  rebuilt, every gate was re-run on the reinstalled tree rather than assuming
  equivalence:

  | Gate | Result on the reinstalled tree |
  | --- | --- |
  | `npm run build` | `Compiled successfully in 7.3s`, **253/253**, `ƒ Proxy (Middleware)`, exit 0 |
  | `npm run typecheck` | exit 0 |
  | `npm run lint` | exit 0 |
  | `test:seo` | **245 pass / 0 fail / 0 skipped**, 3.0s |
  | `test:browser` | **10 pass / 0 fail / 0 skipped**, 17.0s |

  This is a re-measurement, not a new claim: it reproduces the delivery numbers
  exactly. The two commits `5319ab4` (fix) and `10a62e3` (card + worklog) are
  unchanged and the tree is clean.

## 2026-09-14 — Push, pull request, and the record corrected

The owner reviewed the fix locally and authorized the push and the pull request.

- Push, explicit form because the branch has no upstream (Coordination Item 3):
  `git push origin HEAD:refs/heads/codex/65-locale-switch-english-return`.
  Remote head `c45165775f17d2a208f11491ef8e100fafb25ddc`.
- `git ls-remote origin refs/heads/main` → `14a658961855f8e0b5cdce6a3c63867ff95dc51b`,
  unchanged. The merge of PR #45 is still the tip of `main`; this task did not
  write to it.
- Pull request **#46** — https://github.com/dylanliu2002/threethai-website/pull/46,
  base `main`, head `codex/65-locale-switch-english-return`, 3 commits, OPEN, not
  a draft. Its body follows the convention set by PR #45: intro paragraph,
  execution-card and worklog references, a `Delivered` table, `What to review
  first`, `Validation` with exact counts, and `Open, and not claimed as done`.
- **Two statements written earlier on this page are now historical and must be
  read against this section:** the delivery section ends "Not pushed, not merged,
  no pull request opened", and Coordination Item 3 ended "Nothing has been
  pushed." Both were true when written. This page is append-only, so the record
  is corrected here rather than rewritten; the card's Completion Record and
  Coordination Item 3 were updated in place because a card is a living document.
- **Not merged, and the implementer may not merge.** `AGENTS.md`: a specialist
  must never commit, push, merge, force-push or otherwise modify `main` or
  another task's branch. The card is at `REVIEW`, not `APPROVED`, and the
  required flow is `IMPLEMENT -> REVIEW -> independent reviewer -> APPROVED ->
  merge`. PR #46 is the review surface.
- The card gained a `Pull request` field, and `Review Status` now names #46 as
  that surface. Nothing in the fix, the tests or the measured numbers changed.
