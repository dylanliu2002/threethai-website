# Task GSC-LOCALE-003A — Stabilize Prefix-Free English Canonical Owners

- **Task Key:** `GSC-LOCALE-003A`
- **Machine Contract:** None
- **Task ID:** Not assigned — `tasks/README.md` reserves the numeric namespace
  and states "There is no Task 53". This card is identified by its canonical
  task key only, pending ORCHESTRATOR board registration.
- **Title:** Stop request geography from relocating the declared English owner URLs
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Qwen Code
- **Priority:** `P1` (assignment priority: HIGH)
- **Status:** `READY_FOR_REVIEW`
- **Risk:** `MEDIUM`
- **Branch:** `qwen/gsc-locale-003a-stable-english-owner`
- **Worktree:** `worktrees/qwen-gsc-locale-003a-stable-english-owner`
- **Owner:** Implementation worker (Qwen Code)
- **Reviewer:** Unassigned (must be independent — TECHNICAL_SEO review required)
- **depends_on:** `GSC-INDEX-002` (merged, PR #19) — the fallback-copy canonicals
  this task must not disturb; `GSC-SCHEMA-001` (merged, PR #20) — the WebPage-only
  schema posture this task must not disturb; `GSC-LOCALE-003` (AUDIT, no card) —
  the investigation that produced this assignment.
- **blocks:** None

## Owner Decision

The site owner explicitly **approved Option A** of the GSC-LOCALE-003 audit and
accepted its business/UX trade-off: first-time cookieless visitors from CN/HK are
**no longer force-redirected** from the prefix-free English owner to `/zh/*`.

A future non-blocking language-suggestion UI is a **separate** task and is
deliberately **not** implemented here.

## Goal

Every prefix-free English canonical owner must be stable and directly reachable
regardless of request geography. A cookieless `GET /products/foo` must resolve
`200 English`, not `307 → /zh/products/foo` — including when the request carries
a CN or HK CDN country header, and including Googlebot and Bingbot.

The English **URL strings were already correct and are unchanged**. The defect
was that the prefix-free URL was the one form the locale proxy was allowed to
relocate, and that same URL is what every `hreflang="en"`, every `x-default`,
all 55 sitemap owners and all 344 GSC-INDEX-002 fallback targets point at.

## Single Source Of Truth

`src/content/locale-routing.ts` is now the only place that answers "which locale
serves this request, at which path?". `src/proxy.ts` keeps only the Next-facing
plumbing (building the redirect, writing the preference cookie) and carries out
the decision. This mirrors the `src/content/availability.ts` pattern established
by GSC-INDEX-002 and is what makes the precedence order assertable without a
Next runtime — `src/proxy.ts` cannot be imported under `node --test` because
Node's ESM resolver rejects its `next/server` specifier.

Precedence after this change — explicit signals only:

| Order | Signal | Effect |
| --- | --- | --- |
| 1 | `?_locale=<valid>` | redirect to that locale's owner, persist the choice, drop the param |
| 2 | `/en` or `/en/*` | **308 permanent** to the prefix-free English owner (new safety alias) |
| 3 | the URL's own locale prefix | served as-is, never relocated; cookie records what the URL proves |
| 4 | a valid saved preference cookie | unprefixed request relocates to it (temporary) |
| 5 | nothing explicit | **English, in place** |

Removed: `geoCountryHeaders` (`x-vercel-ip-country`, `cf-ipcountry`,
`cloudfront-viewer-country`) and `defaultLocale()`. No CDN country header,
client IP or user agent may influence the decision, and no geography-derived
preference is ever persisted.

This also collapses two duplicate locale declarations that `src/proxy.ts` kept
privately (its own `locales` literal and its own `localePath`) in favour of the
existing `src/content/company.ts` exports — one of the drift hazards the audit
named. Behaviour is unchanged in every case except the two intended ones.

## Success Criteria

- Cookieless unprefixed request + CN header → `200` English owner, self-canonical.
- Same for HK, for US, and for Googlebot / Bingbot user agents.
- Explicit `zh` / `es` / `de` cookie → still relocates (temporary, `307`).
- `?_locale=en` and `?_locale=zh` → still switch and persist.
- `/en` → `308 /`; `/en/<path>` → `308 /<path>`; single hop; unrelated query
  parameters preserved; never `/zh/en/…`.
- English canonical, `hreflang`, `x-default` and sitemap URL strings **byte-identical**
  to before; `/en/*` never owned, advertised, indexed or prerendered.
- GSC-INDEX-002 and GSC-SCHEMA-001 invariants hold; legacy redirects untouched.
- `tests/gsc-locale-003a-stable-english-owner.mjs` fails if any rule regresses.

## In Scope

- `src/content/locale-routing.ts` (new policy module) and its consumer
  `src/proxy.ts`.
- The `/en` safety alias, implemented in the proxy so locale handling has exactly
  one mechanism and one hop.
- One new test file, and registering it in `package.json` → `test:seo`.

## Out of Scope

- Any language-suggestion banner, popup, geolocation UI or client-side detection.
- Making `/en/*` a route, a canonical owner, a sitemap entry or an hreflang target.
- Changing `canonicalUrlFor()`, `hreflangForPath()`, `hreflangForRoute()`,
  `availability.ts`, `sitemap.ts` or any content file.
- Document-level `lang`/`dir` — tracked separately as **GSC-I18N-001**.
- The `Vary` / edge-caching half of `TSEO-10-10` (see Coordination Items).
- Old-site redirect families in `next.config.ts`.
- Merge, deploy, Search Console, Vercel settings.

## File Allowlist

```text
src/proxy.ts
src/content/locale-routing.ts
tests/gsc-locale-003a-stable-english-owner.mjs
package.json                 (test:seo file list only)
```

This task's card and worklog are additionally owned per `AGENTS.md`.

## Forbidden / Shared Files

`tasks/README.md` (board registration is an ORCHESTRATOR action — requested
below, not performed), `src/content/company.ts`, `src/content/availability.ts`,
`src/lib/seo.tsx`, `src/app/**`, `src/components/**`, `next.config.ts`,
`workflow/**`, `AGENTS.md`, any other task's branch or worktree.

## Inputs / Evidence

- Production measurements from the GSC-LOCALE-003 audit (2026-09-08, this
  machine's CN egress): 55/55 sitemap owners relocated `307 → /zh/…` without a
  cookie; with `threethai_locale=en` all 55 returned `200` self-canonical;
  `Accept-Language` had no effect across 10 values; Googlebot and Bingbot both
  received the same `307`; forged `x-vercel-ip-country` is ignored by Vercel.
- `docs/audits/10-technical-seo.md:383-405` — **TSEO-10-10**, HIGH, already
  registered for exactly this behaviour, with suggested task **31B** and a
  recommendation ("prefer stable URLs and a user-visible suggestion") that the
  owner's Option A decision now implements.
- `src/proxy.ts` at base `4c2c969f02e807e8172688246861406ac01f8395` for the
  removed geo rule.

## Validation

```bash
npm run lint          # PASS
npm run typecheck     # PASS
npm run build         # PASS — 555/555 static pages
npm run test:seo      # PASS — 61/61, 0 skipped (with REQUIRE_BUILD_OUTPUT=1)
git diff --check      # PASS
```

### Negative controls

Each mutation was applied in a scratch copy **outside** this worktree
(`.qwen/tmp/locale003a-mutation-20260907T182724/`), which was left byte-clean.
The same two suites ran in every tree; a baseline copy with no mutation was green
(45 tests, 0 fail), so a failure below is a real detection and not environment
noise.

| Control | Mutation | Result |
| --- | --- | --- |
| — | none (baseline) | 45 tests, **0 fail** ✔ expected green |
| A | restore `CN`/`HK` → `zh` geo default | 45 tests, **2 fail** ✔ — "geography cannot be supplied to the routing decision at all" (`CN leaked in`) and "no CDN country header or geo lookup survives in the routing layer" (`still keys off CN`) |
| B | make `/en/*` a renderable indexable route (`en` into `dynamicLocales`, alias disabled) | 45 tests, **6 fail** ✔ — REQ 10, REQ 11 ×3, REQ 11/18, REQ 12 (`an /en route must never render`) |
| C | point fallback deep canonicals at `/en/*` | 45 tests, **8 fail** ✔ — 5 pre-existing GSC-INDEX-002 tests plus REQ 12, REQ 13, REQ 15 |

### Production-like runtime validation

`node .next/standalone/server.js` with `NODE_ENV=production`,
`HOSTNAME=127.0.0.1`, `PORT=3131` (not `next start`, which is unsupported with
`output: "standalone"`). Locally the proxy reads request headers as sent, so
`x-vercel-ip-country` can be exercised here even though Vercel overwrites it in
production. All nine assertions passed:

| Request | Outcome |
| --- | --- |
| `/`, `/products/water-soluble-pva-yarn`, `/answers`, `/quality` — cookieless, `CN` | `200`, self-canonical, `index, follow`, `og:locale en_US`, `hreflang=en` == `x-default` == own canonical |
| owner — cookieless, `HK` | `200` English, `og:locale en_US` |
| owner — cookieless, `US` | `200` English |
| owner — Googlebot UA + `CN` | `200` English |
| owner — Bingbot UA + `CN` | `200` English |
| owner — `threethai_locale=zh` | `307 → /zh/…`, `Set-Cookie zh`, `og:locale zh_CN` |
| owner — `threethai_locale=es` | `307 → /es/…` → 200, canonical → prefix-free EN owner, 0 alternates |
| `/zh/…?_locale=en` | `307 → /products/…` (param dropped) → 200 English |
| `/products/…?_locale=zh` | `307 → /zh/products/…` → 200 Chinese |
| `/en` | `308 → /` → 200 |
| `/en/products/water-soluble-pva-yarn`, `/en/answers`, `/en/quality` | `308 →` owner → 200, single hop |
| `/en/answers?utm_source=x` | `308 → /answers?utm_source=x` (query preserved) |
| `/en/products/<unknown-slug>` | `308 →` prefix-free slug → **404**; no `/zh/en/…` chain |
| `/encyclopedia` | untouched by the alias (exact-segment match), 404 as before |
| `/es/products/water-soluble-pva-yarn` | 200, canonical → prefix-free EN owner, 0 alternates |
| `/sitemap.xml` | 55 `<loc>`, 0 containing `/en`, all prefix-free |

## Acceptance Criteria

- [x] English owner URLs resolve `200` for every geography, crawler or not.
- [x] No English canonical, hreflang, `x-default` or sitemap string changed.
- [x] GSC-INDEX-002 fallback policy and GSC-SCHEMA-001 schema posture intact
      (asserted by this task's suite and by the two pre-existing suites).
- [x] No suggestion UI, no `/en` ownership, no layout or content change.
- [x] Negative controls A/B/C each fail the suite; scratch tree not the worktree.
- [x] No invented facts: the one leg that cannot be measured from this machine is
      labelled below rather than asserted.

## Coordination Items

- **Unverified leg, stated honestly:** this machine's egress is CN, and Vercel
  overwrites client geo headers, so "a US Googlebot receives `200` on the
  unprefixed owner" is proven here by *removing the input entirely* (the
  decision function accepts no geography at all — enforced by REQ 1-3 and by
  mutation control A) and by the local standalone server, not by a real US-edge
  fetch. Post-deploy confirmation should re-crawl from a non-CN egress or read
  Vercel logs.
- **TSEO-10-10 is only partly closed.** This task removes the geo-inferred
  forced redirect. The finding's second half — responses that vary by
  cookie/geo with **no `Vary`**, plus `Set-Cookie` on 200s — is **not** addressed
  here and stays open. `TSEO-10-10` should not be marked resolved on the strength
  of this PR alone; suggested task **31B** should be scoped to the remainder.
- **Two adjacent defects found during the audit, deliberately NOT fixed here**
  (each needs its own task; both are in the same layer):
  1. A prefixed visit overwrites an explicit preference: with
     `threethai_locale=en`, a request to `/es/answers`, `/zh` or `/de` returns
     `200` **plus** `Set-Cookie: threethai_locale=<that locale>`, so one click
     silently re-points every future unprefixed visit (`src/proxy.ts` prefix
     branch, `persist`). Measured on production and on the local build.
  2. The language switcher drops query strings: `switchHref` is built from
     `usePathname()`, so switching language loses `?thread=…` style prefill —
     visible on the Product-Finder → quote hand-off.
- **Consequence for Baidu/Sogou (tasks 51/52):** CN-egress crawlers can now reach
  the prefix-free English owners directly instead of only `/zh/*`. Both Chinese
  sets remain advertised through hreflang and the sitemap's `xhtml:link`
  alternates; no re-submission was performed by this task.
- **Board registration:** this card is deliberately not added to
  `tasks/README.md`. Registering a row and assigning a numeric ID is an
  ORCHESTRATOR action against a shared file, so it is requested here:
  `SHARED FILE CHANGE REQUEST`
  File: `tasks/README.md`
  Task: `GSC-LOCALE-003A`
  Reason: implementation task needs a board row with a branch and status.
  Exact proposed change: add one row
  `| GSC-LOCALE-003A | qwen/gsc-locale-003a-stable-english-owner | IMPLEMENT/REVIEW | TECHNICAL_SEO | — |`
  to the Current Implementation Tasks table.
  Evidence: this card.
  Tasks affected: none; no allowlist overlap (`src/proxy.ts` and the new module
  are claimed by no active task).
  Risk: low, additive row.
  Validation: board text only.
- **Indexing expectation:** Google must recrawl before Search Console reflects
  anything. This change does not alter canonical strings, so it should not move
  consolidation behaviour — it removes a redirect from the crawler path on the
  55 declared owners.

## Review Status

- Outcome: Pending (`APPROVED` | `CHANGES_REQUESTED` | `BLOCKED`)
- Independent reviewer evidence: none yet — the implementer cannot approve.

## Completion Record

- Commit: recorded in `worklog/gsc-locale-003a-stable-english-owner.md` (one
  implementation commit plus this evidence commit; no rebase, no history
  rewrite).
- Base commit: `4c2c969f02e807e8172688246861406ac01f8395` (`origin/main`,
  verified equal to the assigned base before any edit).
- Changed files: `src/proxy.ts` (rewritten, −46/+18 lines),
  `src/content/locale-routing.ts` (new),
  `tests/gsc-locale-003a-stable-english-owner.mjs` (new, 26 tests),
  `package.json` (`test:seo` file list), this card, this task's worklog.
- Validation results: lint PASS, typecheck PASS, build PASS (555/555 pages),
  `test:seo` PASS 61/61 with `REQUIRE_BUILD_OUTPUT=1` and 0 skipped,
  `git diff --check` clean; runtime matrix and negative controls above.
- Pull request: to `main`. Not merged, not deployed.
- Worklog: `worklog/gsc-locale-003a-stable-english-owner.md`
- Remaining risks: see Coordination Items — `TSEO-10-10`'s `Vary`/caching half
  stays open, and the non-CN crawler leg needs post-deploy confirmation.

## Rollback

Revert this task's implementation commit. It adds one pure module and rewrites
`src/proxy.ts`; no route, content, schema or configuration file changes, and no
canonical, hreflang or sitemap string changes. Rolling back restores the previous
behaviour exactly: CN/HK cookieless visitors again receive `307 → /zh/…` and
`/en/*` again dead-ends. Because the URL strings never moved in either
direction, no re-indexing action is required to roll back.
