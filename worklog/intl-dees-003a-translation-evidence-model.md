---
Task Key: INTL-DEES-003A
Role: TECHNICAL_SEO
Task: Translation Evidence Model
Branch: qwen/intl-dees-003a-translation-evidence-model
Commit: a0995cc0b083ed0d2f76efce79a534c9c369948a (implementation); this record
  is completed by the following docs commit on the same branch.
Date: 2026-09-08

Work Log:
- Read workspace `AGENTS.md`, repository `AGENTS.md` §1-§15, `tasks/TEMPLATE.md`,
  and the user-supplied INTL-DEES-003A assignment. Implementation-only role: no
  merge, deploy, Search Console, Vercel or GitHub-settings authority claimed.
  Nothing was merged and `main` was not touched.
- Fetched origin and resolved the assignment's `main@<current-main-sha>`
  placeholder by measurement rather than assumption: at the base gate
  `origin/main == d34cd9560870c15da922a84f4dab7808201dd89d`, which is the merge
  of PR #26 (`INTL-DEES-002B`). The dependency the card names as established
  fact ("INTL-DEES-002B established …") is therefore in fact on `main`, so this
  task could build on it directly instead of stacking on an unmerged branch.
  Re-checked immediately before opening the PR: still `d34cd95`, no rebase
  needed.
- Created branch `qwen/intl-dees-003a-translation-evidence-model` and an
  isolated worktree at
  `worktrees/qwen-intl-dees-003a-translation-evidence-model` from that commit.
  No other branch, worktree or dirty legacy tree was touched;
  `backlink-agent-worktree/`, `workflow/` and `SYS-AUTO-*` are untouched.
- Branch naming deviates from `codex/NN-short-task-name`: the INTL-DEES line has
  no numeric ID, and its merged predecessor is
  `qwen/intl-dees-002b-translation-availability` (PR #26). Per `AGENTS.md` §4 the
  prefix is a repository namespace rather than an executor binding, and
  `tasks/README.md` states there is no Task 53 — so no number was invented and
  the shared board file was not edited. Recorded, not silently ignored.
- Card and worklog are keyed `intl-dees-003a-translation-evidence-model`,
  matching the `gsc-*` precedent in this directory rather than `agent-NN-*`.
- Set and verified Git identity `dylanliu2002 <dylanliu2002@gmail.com>` in this
  worktree before any edit, and re-verified it on the created commit with
  `git log -1 --pretty=fuller` before pushing (`--format='%an <%ae>'` is
  unusable in this shell: the command guard rejects `%`).
- Installed a real `npm ci` in the worktree rather than the `node_modules`
  symlink repository `AGENTS.md` §3 suggests: a junction to the main checkout
  makes Turbopack abort with "Symlink node_modules is invalid". `package.json`
  and `package-lock.json` were not modified by the install.
- Baseline measured before the first edit, not assumed:
  `npm run test:seo` → 132 tests, 111 pass, 0 fail, 21 skipped (the 21 are
  build-output tests skipped because no `.next` existed yet).
- Read the INTL-DEES-002B result on `origin/main` before designing, because 002B
  already calls its own registry "translation evidence". It is not: it is the
  *promotion*. It answers "does this page carry this copy" structurally
  (non-empty, field maps of equal size, not the English pasted back) and
  nothing answered "has anyone approved it, against which English, and did they
  check every field the page renders". That gap is what this task closes, so the
  new module is named for what it actually stores and 002B's layer stays the
  consumer.
- Design decision: `src/content/translation-evidence.ts` is a **leaf**. It
  imports only `./company`. The deliberate alternative was to have it import
  `products.ts`/`answers.ts`/`articles.ts`/`applications.ts` and derive each
  page's required fields — and its English source values — from the live entity,
  which would make `requiredFields` unforgable and detect a stale approval by
  digest. Rejected on a measured constraint: `src/components/layout/site-header.tsx`
  is `"use client"` and imports `@/content/availability` →
  `./translation-availability` → this module, so importing the entity corpus
  would place the entire product/answer text in a browser chunk it currently
  does not occupy. Node built-ins are likewise excluded for the same reason. The
  consequence is stated in the module, the card and the PR rather than buried:
  the field list is the reviewer's declaration, and the unforgable check stays
  `pageCopyFor` at prerender, which throws and fails the build. Two independent
  nets, and the second one is build-enforced.
- Moved the page-shape model (`DEEP_CONTENT_SECTIONS`,
  `deepContentSectionOf`, `isDeepContentDetail`), `TranslatedPage`,
  `PromotionLocale`, `TranslatedValue` and `isGenuineTranslation` into the
  evidence module rather than duplicating them, because the decision function
  needs them and a cycle would otherwise form (the availability layer must
  import the evidence layer to derive its registry). They remain reachable from
  `./translation-availability`, so INTL-DEES-002B's surface, its suite and the
  seven deep renderers needed no edit.
- `TRANSLATED_PAGES` is now `approvedPromotions()`, i.e. derived. That single
  line is what makes requirement "renderer and SEO resolver use the same
  evidence source" true by construction rather than by convention:
  `createAvailabilityPolicy()` and `pageCopyFor()` both default to the same
  array, which only the evidence gate can populate.
- The gate reports machine-checkable reason codes instead of a boolean, because
  an audit layer that answers only yes/no cannot be acted on. Every rule fails
  closed, including unrecognised statuses (`"pending"`, `"APPROVED"`, absent)
  and a `(path, locale)` pair recorded twice — two records that disagree are not
  a stronger claim, they are an ambiguous registry.
- Independence rule: `reviewedBy` may not equal `translatedBy`, mirroring
  `AGENTS.md` §13 ("The implementer never approves their own task") into the
  content layer. Comparison is trimmed so padded duplicates cannot slip past.
- `sourceRevision` is stored and required but **not** re-verified against Git.
  Nothing here expires an approval when the English moves. Labelled as
  unverified behaviour in the card's Remaining risks rather than implied safe.
- `package.json` is a shared file under §8 and was changed by exactly one
  appended filename in `test:seo`, so the card's own gate actually runs this
  suite. The full SHARED FILE CHANGE REQUEST is in the card; the same line was
  changed the same way by INTL-DEES-002B (PR #26, merged).
- Validation (first pass, before the final rebuild listed below): lint PASS,
  typecheck PASS, `next build` PASS at 225/225 static pages,
  `REQUIRE_BUILD_OUTPUT=1 npm run test:seo` → 156 tests, 156 pass, 0 fail, 0
  skipped (132 baseline + 24 new), `git diff --check` clean.
- Proved the new suite can fail, without touching this worktree: 13 cases run in
  a scratch tree copied file-by-file outside the repository
  (`%USERPROFILE%\.qwen\tmp\003a-mutation\`, harness
  `003a-mutate.mjs`, report `report.txt`). `fs.cpSync({recursive:true})` aborts
  the process on this machine (0xC0000409, no output), so the copy is an
  explicit walk. Eleven injected regressions were each caught: status ignored
  (4 tests red), a declared field untranslated (1), copy-is-English checks
  removed (3), self-approval allowed (2), duplicate pair allowed (1), whole gate
  removed (16), promotions no longer derived from evidence (1), `en`/`zh` locale
  guard removed (1), renderer stopped honouring a promotion (2), the 002B
  path-class exemption returning for core routes (1), and one real ES record
  added to the shipped registry (3). Two controls passed: an unrelated added
  export, and the untouched copy. `git status --porcelain` in this worktree was
  unchanged by the exercise.
- One honest weakness in that matrix, recorded because it is the reviewer's
  business: the "promotions no longer derived" case is caught only by the
  source-text pin, and the "core-route exemption returns" case only by the
  EN/ZH ownership test. Both are behaviourally invisible to the shipped-output
  assertions while the registry is empty — there is literally nothing for them
  to change — so a textual pin is the only detector available.
- Deliberately not done: no page translated, no evidence recorded, no promotion,
  no ES/DE core-page change, no change to locale routing, serving, the
  four-language switcher, document `lang`, schema types, or any other task's
  card, worklog or suite.
- Re-measured the gates at the committed state (`a0995cc`) rather than reusing
  the pre-commit numbers, because two source edits landed after the first build
  (a `provenance-review-date-not-iso` reason split and test text): lint PASS,
  typecheck PASS, `next build` PASS 225/225, `REQUIRE_BUILD_OUTPUT=1
  npm run test:seo` → 156 tests / 156 pass / 0 fail / 0 skipped,
  `git show --check` clean.
- Found out that byte-hashing the build is not a valid no-change proof on this
  machine, and corrected the method instead of the claim: a hash manifest of
  `.next/server/app` (buildId normalised) showed all 222 `.html` and 1,941
  `.rsc` files differing by ~14 bytes between the pre-edit and post-edit builds,
  which would have looked like my edit changing rendered output. Rebuilding the
  same source a third time reproduced the difference and the size shifted back
  (`_global-error.html` 5,725 → 5,711), so the shift is Turbopack build
  nondeterminism, not a behaviour change. `.json`, `.meta`, `.map`,
  `sitemap.xml.body` and `robots.txt.body` were hash-identical in all three.
- Replaced the invalidated comparison with a semantic one measured directly:
  fingerprinted every prerendered document (page set, `<html lang>`/`dir`,
  canonical, all hreflang `rel=alternate` pairs, title, description, robots,
  `og:locale`, `og:url`, JSON-LD `@type` set, all `inLanguage` values, and the
  full rendered text) from a production build of the base commit `d34cd95`
  (temporary detached worktree, own `npm ci` + build) and from this head →
  222 documents both sides, 0 pages added or removed, **0 field differences**.
  The temp worktree was removed through `git worktree remove` afterwards.
- One delegation handled honestly: a subagent reported the two builds
  "byte-identical, 1,532 HTML documents" — a count that does not match this
  tree's 222 `.html` documents under `.next/server/app`, and a claim my own
  manifest contradicted. It was treated as a lead, not as evidence, and the
  conclusion above rests only on measurements taken here. Future build
  comparisons in this repo should fingerprint content, not hash files.
- Directly measured the crawler-facing inventory at the final commit:
  `sitemap.xml.body` holds 55 `<loc>` entries, none carrying an `/es` or `/de`
  path segment, and the advertised hreflang tag set is exactly
  `en, x-default, zh-CN`.

Stage Summary:
- Deliverable: ES/DE SEO ownership now has exactly one precondition — an
  approved, complete, independently reviewed evidence record for that path and
  locale — and the shipped registry is empty, so every current answer is
  unchanged.
- Evidence: full validation matrix plus an eleven-regression mutation report
  and two positive controls.
- Next: independent review of the pushed head. The implementer cannot approve.
- Open after this task: INTL-DEES-001 must produce the copy; the first real
  promotion is expected to redden `tests/intl-dees-002b-*` and
  `tests/locale-retire-001-*` inventory pins, which is the designed signal;
  `isSitemapEligible` still has no production consumer (the sitemap's alternates
  come from `hreflangForPath`); `TERM_PATTERNS` in the BUSINESS-FACT-D2 suite is
  still English/Chinese only and must gain ES/DE patterns with the first real
  translation; approval freshness against `sourceRevision` is unverified by
  design; the two GSC-LOCALE-003 defects and `TSEO-10-10`'s `Vary` half remain
  open elsewhere.
