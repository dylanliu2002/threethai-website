# Task 52 — Sogou Site Verification

- **Task ID:** `52`
- **Title:** Sogou Site Verification
- **Status:** `REVIEW`
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Priority:** `P1`
- **Risk:** `LOW`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Current Model Family:** GPT
- **Execution Assignment Recorded:** Yes
- **Owner:** `TECHNICAL_SEO`
- **Reviewer:** `QA_PERFORMANCE` (independent)
- **Branch:** `codex/52-sogou-verification`
- **Worktree:** `C:\Users\dylan\Documents\ChatGPT\荣沣网站\worktrees\agent-52-sogou-verification`
- **Authorization:** ORCHESTRATOR — AUTHORIZED
- **Authorization recorded:** 2026-09-03, before application implementation
- **Authorized main at approval:** `2eada40d52e027aa47bbee6cd353227929b41510`
- **Actual base:** `9360d46bc8baf5a2d76666edfd166145ce5dc271`
- **depends_on:** None
- **blocks:** None

## Goal and Acceptance Criteria

Verified site: `https://www.threethai.com`.
Required environment variable: `SOGOU_SITE_VERIFICATION`.
Expected production meta (public ownership-verification value):

```html
<meta name="sogou_site_verification" content="Bkr0mB0f4m">
```

- Add conditional environment-backed support in the existing
  `metadata.verification.other` object.
- With `SOGOU_SITE_VERIFICATION=Bkr0mB0f4m`, a fresh production build must
  return HTTP 200 for `/` and render exactly one tag with the exact name/content.
- With the variable unset, a separate fresh production build must return
  HTTP 200 for `/` and omit that tag.
- Preserve UTF-8, the single head, all unrelated metadata, and existing
  Google/Bing/Yandex/Baidu verification behavior.

## Exact File Allowlist and Shared-File Authorization

```text
src/app/layout.tsx
tasks/52-sogou-verification.md
worklog/agent-52-sogou-verification.md
tasks/README.md
```

ORCHESTRATOR explicitly authorizes `src/app/layout.tsx` only for conditional
Sogou support inside its existing `verification.other` object and the adjacent
verification comment. `tasks/README.md` is authorized only for the Task 52 row;
Task 51 and every other entry must remain unchanged. This task's worklog is
append-only.

## Out of Scope

No hard-coded permanent verification value in application metadata, extra head,
gb2312 declaration, or UTF-8 change. No changes to the Baidu verification file,
Task 51 artifacts, canonical/www policy, sitemap, robots, hreflang, locales,
proxy/middleware, content, dependencies/package files, Next.js or deployment
configuration, production environment, `.env.example`, or other unlisted files.
Do not touch the Task 48 legacy worktree. Do not create or merge a PR, push main,
configure production, or click Sogou's completion control.

## Validation Plan

1. `git diff --check`, then `npm run lint` (PASS required).
2. Use independent local dependencies and process-local environment settings;
   no production environment files or database connections.
3. Unset Sogou, run `npm run build` from a clean task-local `.next`, then run
   the generated standalone server on `127.0.0.1:3152` using Node on Windows.
4. Check HTTP 200, absent Sogou tag, UTF-8, one head, existing verification
   metadata, and pre-render error markers.
5. Stop only this task's server, remove only this task's generated `.next`,
   set Sogou, and repeat `npm run build` and runtime checks. Require exactly
   one Sogou tag and compare all other head metadata across both builds.
6. Fetch/rebase this task branch against latest `origin/main` before review;
   rerun relevant gates if the validated code changes.
7. Check diff scope, whitespace and exact Git identity; set status `REVIEW`,
   commit and push only `codex/52-sogou-verification`.

## Coordination Items

- Preflight fetch advanced main from the approval SHA to
  `9360d46bc8baf5a2d76666edfd166145ce5dc271`. The difference contains only
  Task 11's audit report, task card and worklog (PR #11), with no overlap with
  Task 52's implementation or allowlist. Starting at the new main is safe
  without changing scope. No existing worktree was reset or reused.
- Independent `QA_PERFORMANCE` review is required; the implementer does not
  approve this task. Production setup and Sogou completion remain deferred.

## Validation Results

- Authorization recorded before application implementation: PASS.
- `git diff --check`: PASS. `npm run lint`: PASS (exit 0).
- Independent locked dependencies installed with `npm ci --no-audit --no-fund`;
  package files unchanged. Generated the existing SQLite Prisma client locally.
- Two clean `npm run build` runs: PASS, including TypeScript, all 555 generated
  pages, and the normal standalone preparation script.

| Local production check | Sogou unset | Sogou set to `Bkr0mB0f4m` |
| --- | --- | --- |
| Build ID | `e2edhtxDeP9FkDRIZA5Oo` | `D1mhP-jql6943oV0DHdaE` |
| Homepage `http://127.0.0.1:3152/` | HTTP 200 | HTTP 200 |
| Sogou meta count in HTML | 0 (name absent from entire HTML) | 1, inside head |
| Exact name/content | Omitted as required | PASS |
| Head count | 1 | 1 |
| HTML meta + HTTP charset | UTF-8 | UTF-8 |
| `gb2312` in response | Absent | Absent |
| Google/Bing/Yandex/Baidu tags | Each once, exact test value | Each once, exact test value |
| Other metadata count | 47 | 47 |

Actual Next.js serialization:

```html
<meta name="sogou_site_verification" content="Bkr0mB0f4m"/>
```

The trailing self-closing slash is equivalent to the required HTML void tag.
For both builds, SHA-256 of the ordered title/meta/canonical/alternate/icon
elements after excluding only the Sogou meta was:
`0e48d2565ef5d1f5d5deb3fb15de21f8fe7d5b0abf219b424d31c5ac3e595852`.
Build-specific script/style/preload resources were not included in this metadata
comparison. All unrelated source metadata remains unchanged.

No `__next_error__` marker was present in the homepage or application-route
artifacts. An initial unfiltered scan also matched the framework's generated
`_global-error` HTML/RSC template; the application-route scan excludes that
intentional error template. No application failure was found.

Initial sandbox npm-cache access and Google Fonts download attempts failed;
approved reruns completed successfully without dependency or code workarounds.
Final origin fetch confirmed the same base SHA. Runtime servers were stopped
after each check. All verification values were process-local; no production
environment or `.env` file was changed.

## Review Status

- Outcome: Pending independent `QA_PERFORMANCE` review.
- Independent reviewer evidence: Not yet provided.

## Completion Record

- Commit: Pending.
- Base / rebase commit: `9360d46bc8baf5a2d76666edfd166145ce5dc271`.
- Changed files: The four allowlisted files above.
- Validation results: All required implementation, lint, fresh-build and runtime
  checks passed; see the evidence above and append-only worklog.
- Worklog: `worklog/agent-52-sogou-verification.md`.
- Remaining risks: Production environment setup and verification are deferred.

## Rollback

Before merge, withhold this task branch. After an independently approved merge,
an authorized integrator can revert the Task 52 implementation commit. An
authorized production operator can also unset `SOGOU_SITE_VERIFICATION` and
rebuild/redeploy to omit the tag. Neither production action is part of this task.
