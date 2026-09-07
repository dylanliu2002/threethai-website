---
Task Key: GSC-INDEX-002
Role: TECHNICAL_SEO
Task: Fix Fallback Locale Duplicate Indexation
Branch: qwen/gsc-index-002-fallback-indexation
Commit: pending
Date: 2026-09-07

Work Log:
- Read workspace `AGENTS.md`, repository `AGENTS.md`, and the user-supplied
  GSC-INDEX-002 assignment. Implementation-only role; no merge, deploy, DNS or
  automation authority claimed.
- Fetched origin. `origin/main` is
  `3aefe3cc0002819d5b0bf7b4cb3fcf257bbbdf72`. Created this task's branch and
  isolated worktree from that commit. No other worktree, branch or dirty legacy
  tree was touched; `SYS-AUTO-*` and `workflow/` are untouched.
- Branch naming deviates from the `codex/NN-short-task-name` convention because
  the assignment explicitly specified `qwen/gsc-index-002-fallback-indexation`.
  Per `AGENTS.md` the prefix is a repository namespace, not an executor
  binding; recorded rather than silently ignored.
- Card is keyed `gsc-index-002-fallback-indexation` and claims no numeric ID:
  `tasks/README.md` states "There is no Task 53", so no number was invented and
  the shared board file was not edited.
- Set and verified Git identity `dylanliu2002 <dylanliu2002@gmail.com>` in this
  worktree before any commit.
- Reproduced the defect from `origin/main` source rather than assuming it:
  `buildMetadata` self-canonicalised the requested locale, looped all ten
  locales into hreflang, `sitemap.ts` kept its own ten-locale loop, the language
  switcher asserted `hreflang` for every locale, and `app/layout.tsx` hard-codes
  `<html lang="en">`. All five confirmed programmatically.
- Established the content fact behind the policy from source: `ContentLocale`
  is `en | zh`, `contentLocaleOf()` returns `en` for all eight UI locales, the
  eight dictionaries are `partial` deep-merged over English, and the product and
  application detail templates hard-code English headings for every non-`zh`
  locale. Chinese deep content verified genuinely translated (real CJK body
  copy in articles, answers, products and applications).

Stage Summary:
- Inventory: 43 entity detail paths (30 answers, 4 knowledge, 4 products,
  5 applications) x 8 fallback locales = 344 English-fallback copies. GSC
  reported 75 of them (66 answers, 9 knowledge); both classes are fully
  explained by this pattern.
- Next: implement `src/content/availability.ts` as the single policy and point
  metadata, sitemap, switcher and structured data at it.

---
Task Key: GSC-INDEX-002
Role: TECHNICAL_SEO
Task: Fix Fallback Locale Duplicate Indexation — implementation and validation
Branch: qwen/gsc-index-002-fallback-indexation
Commit: pending
Date: 2026-09-07

Work Log:
- Added `src/content/availability.ts` as the only authority for "does this
  locale genuinely have this page?". It derives canonical owner, hreflang set,
  indexability, sitemap eligibility and body-copy language from one rule that
  mirrors `ContentLocale`. Canonical resolution is idempotent, so no canonical
  chain can form a loop.
- Rewired `buildMetadata` to consume the policy for canonical, hreflang, robots
  and `og:locale`; removed its private ten-locale loop and the dead
  `alternates` input field. Made `articleSchema`/`productSchema` locale-aware
  and added `webPageSchema` so structured data reports the canonical owner and
  the true body-copy language.
- Removed 25 per-route `alternates` literals across `src/app`. Every one was
  already ignored by `buildMetadata`, and several were wrong
  (`/request-sample` pointed its Chinese alternate at `/zh/request-quote`;
  `/knowledge` pointed its at `/zh`), so leaving them would have recreated the
  metadata/sitemap divergence this task exists to close.
- Sitemap now takes its hreflang graph from `hreflangForPath(path)` instead of
  enumerating locales, so it cannot advertise a copy the page itself refuses to
  claim. English entries and the 54 genuine Chinese alternates are preserved.
- Language switcher keeps every locale link for user navigation but emits
  `hreflang`/`lang` only where the target genuinely exists (desktop and mobile).
- Indexability decision: fallback copies stay `index, follow`. The canonical tag
  does the consolidation; `noindex` would block signal consolidation and move
  the URLs to a different exclusion bucket without removing the duplicate
  signal. Documented at the policy function.
- Added `tests/gsc-index-002-fallback-indexation.mjs` (18 tests) covering all
  ten regression requirements, and `tests/support/ts-extension-hooks.mjs` so the
  behavioural tests import the real TypeScript policy instead of restyling
  production imports for the test runner. `test:seo` now runs both files.
- Validation: lint PASS; typecheck PASS; build PASS (555/555 pages);
  `test:seo` PASS 23/23; `git diff --check` clean.
- Full-build crawl of 550 prerendered pages: 206 self-canonical, 344 fallback
  copies consolidated (43 per fallback locale), zero violations.
- Production runtime crawl on `127.0.0.1:3123`: 210 URLs across ten locales,
  all 200, 0 redirects, 0 loops; unknown slugs 404 in all ten locales; served
  `/sitemap.xml` free of fallback deep URLs; `/robots.txt` unchanged.
- Stopped the task-local server. No deployment, no merge, no DNS change.

Stage Summary:
- Status READY_FOR_REVIEW. The implementer has not approved this work.
- Deferred by design: document-level `lang`/`dir` (needs a root-layout /
  route-group restructure; 495 non-English pages still render
  `<html lang="en">`). Flagged separately: the four crawled-not-indexed URLs,
  which this task leaves unchanged.

---
