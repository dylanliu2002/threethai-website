---
Task Key: GSC-LOCALE-003A
Role: TECHNICAL_SEO
Task: Stabilize Prefix-Free English Canonical Owners
Branch: qwen/gsc-locale-003a-stable-english-owner
Commit: 1e0734645e62b2bbf9bc8acf0c3a0618de69b5cf
Date: 2026-09-08

Work Log:
- Read workspace `AGENTS.md`, repository `AGENTS.md`, `tasks/README.md`, and the
  user-supplied GSC-LOCALE-003A assignment. Implementation-only role; no merge,
  deploy, Search Console or Vercel authority claimed.
- Fetched origin and verified the assigned base exactly: `origin/main ==
  4c2c969f02e807e8172688246861406ac01f8395`. It had not moved, so work
  proceeded against the specified base with no rebase.
- Created this task's branch and isolated worktree from that commit. No other
  branch, worktree or dirty legacy tree was touched; `workflow/`, `SYS-AUTO-*`
  and `backlink-agent-worktree/` are untouched.
- Branch naming deviates from `codex/NN-short-task-name` because the assignment
  explicitly specified `qwen/gsc-locale-003a-stable-english-owner`. Per
  `AGENTS.md` the prefix is a repository namespace, not an executor binding;
  recorded rather than silently ignored.
- Card is keyed `gsc-locale-003a-stable-english-owner` and claims no numeric ID:
  `tasks/README.md` states "There is no Task 53", so no number was invented and
  the shared board file was not edited (change requested as a Coordination Item).
- Set and verified Git identity `dylanliu2002 <dylanliu2002@gmail.com>` in this
  worktree before any edit.
- Installed a real `npm ci` in the worktree rather than the `node_modules`
  symlink that repository `AGENTS.md` §3 suggests: a junction to the main
  checkout makes Turbopack abort with "Symlink node_modules is invalid". The
  existing `qwen/*` worktrees already follow the real-install convention.
  `package.json` and `package-lock.json` were not modified by the install.
- Confirmed the defect against base source rather than assuming it:
  `src/proxy.ts` chose the first-visit locale from `x-vercel-ip-country` /
  `cf-ipcountry` / `cloudfront-viewer-country` with `CN`/`HK` → `zh`, and
  `localePath(path, "en")` in `src/content/company.ts` is prefix-free — so the
  relocated URL was exactly the URL that `hreflang=en`, `x-default`, the sitemap
  and the GSC-INDEX-002 fallback canonicals all point at.
- Design decision: extracted the routing policy into a new pure module,
  `src/content/locale-routing.ts`, instead of leaving the decision inside
  `src/proxy.ts`. Reason: `src/proxy.ts` cannot be imported by `node --test`
  (Node's ESM resolver rejects its extensionless `next/server` specifier), so
  without a pure seam requirements 1-11 could only be tested by source-regex
  assertions, which cannot fail on a behavioural regression. This follows the
  `availability.ts` precedent from GSC-INDEX-002: policy in one module, surfaces
  carry it out.
- While moving the code, collapsed two duplicate declarations that `src/proxy.ts`
  kept privately — its own `locales` literal and its own `localePath` — and
  pointed them at the existing `src/content/company.ts` exports. Verified the two
  `localePath` implementations agree on every input shape the proxy passes
  (`/`, `/answers`, `/answers/`, prefixed paths), so this is a de-duplication,
  not a behaviour change.
- Implemented the `/en` alias inside the proxy rather than in `next.config.ts`
  `redirects`, so there is exactly one mechanism for locale URLs and the alias
  resolves in a single hop. The legacy `.html` redirect map in `next.config.ts`
  was not touched, per the assignment's legacy/current-site separation.
- Kept the existing status semantics deliberately: locale moves stay temporary
  `307`, only the `/en` alias is permanent `308`. Making the removed geo rule
  permanent would have consolidated the English owners onto `/zh` globally,
  which is the opposite of the intent.
- Respected the standing GSC-INDEX-002 guard
  `tests/gsc-index-002-fallback-indexation.mjs:264-268`, which forbids the string
  `canonical` anywhere in `src/proxy.ts`: no page ownership is expressed as a
  redirect, and the explanatory prose that uses the term lives in the new module.
- Did not implement any language-suggestion UI, and did not touch document-level
  `lang`/`dir` (GSC-I18N-001), the cookie-overwrite defect, or the switcher
  query-string defect — all recorded as Coordination Items instead of quietly
  widened into this diff.
- Validation: lint PASS; typecheck PASS; `next build` PASS at 555/555 static
  pages (identical page count to the GSC-INDEX-002 baseline, so no route was
  added or removed); `test:seo` 61/61 PASS with 0 skipped under
  `REQUIRE_BUILD_OUTPUT=1`; `git diff --check` clean.
- Runtime validation on the supported entrypoint
  `node .next/standalone/server.js` (`NODE_ENV=production`, loopback, port 3131)
  — not `next start`, which warns as unsupported for this `standalone` build.
  Nine assertions PASS: cookieless CN and HK now get `200` English self-canonical
  on `/`, `/products/water-soluble-pva-yarn`, `/answers`, `/quality`;
  Googlebot and Bingbot with a CN header likewise; explicit `zh`/`es`/`de`
  cookies still relocate; `?_locale=` still switches both ways; `/en` and
  `/en/*` are single-hop `308`s preserving unrelated query parameters; unknown
  `/en/*` slugs land on a proper `404` with no `/zh/en/…` chain; `/sitemap.xml`
  still has 55 prefix-free `<loc>` entries and no `/en`.
- Negative controls run in a scratch copy outside this worktree
  (`.qwen/tmp/locale003a-mutation-20260907T182724/`), with an unmutated baseline
  green first (45 tests, 0 fail) so each failure is a detection: A restored geo
  default → 2 fail; B `/en/*` made indexable → 6 fail; C fallback canonicals
  moved to `/en/*` → 8 fail, including 5 pre-existing GSC-INDEX-002 tests. The
  first harness revision aborted on Windows (`cpSync`/`spawnSync` recursive copy,
  exit 0xC0000409), so copying was rewritten as an explicit per-file loop and the
  test runs were issued directly; the worktree itself was never mutated.
- Two of my own measurement bugs were caught and corrected during this task,
  both recorded so the numbers are not trusted blindly: a case-sensitive
  `hreflang="` count (Next renders `hrefLang`) and a hop-status comparison that
  ignored the annotation appended to the hop string.
- Committed the implementation as
  `1e0734645e62b2bbf9bc8acf0c3a0618de69b5cf` — 6 files, `src/proxy.ts` and the
  new `src/content/locale-routing.ts` plus the test, `package.json`, this card
  and this worklog. `git diff --check` clean; `git show --stat` confirmed no
  build output or dependency tree entered the commit.
- Pushed the branch and opened the pull request to `main`. Did not merge, did not
  deploy, did not touch Search Console or Vercel, did not force-push, stash,
  reset, or clean any unrelated worktree.

Stage Summary:
- Deliverable: geography is no longer an input to locale routing, so the 55
  declared English owners resolve `200` for every requester, and `/en/*` is a
  permanent alias onto the existing owner instead of a `307 → 404` dead end.
- Evidence: full validation matrix, runtime table and three negative controls in
  `tasks/gsc-locale-003a-stable-english-owner.md`.
- Next: independent TECHNICAL_SEO review. Implementer cannot approve.
- Open after this task: `TSEO-10-10`'s `Vary`/caching half; the
  prefixed-overwrites-preference defect; the switcher query-string defect;
  GSC-I18N-001 document `lang`/`dir`; board registration for this task key.
