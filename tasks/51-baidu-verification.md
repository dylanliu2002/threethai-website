# Task 51 — Publish Baidu ownership verification file

- **Task ID:** `51`
- **Title:** Publish Baidu ownership verification file
- **Mode:** `IMPLEMENT`
- **Role:** `TECHNICAL_SEO`
- **Execution Profile:** `HIGH_RISK_CODE`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Current Model Family:** GPT-5
- **Execution Assignment Recorded:** Yes
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `LOW`
- **Branch:** `codex/51-baidu-verification`
- **Worktree:** `worktrees/agent-51-baidu-verification`
- **Owner:** Codex Agent 51
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** None
- **blocks:** Baidu site ownership verification

## Goal

Serve Baidu's ownership verification file from the production site's root URL
so Baidu Webmaster Tools can verify `https://www.threethai.com`.

## Success Criteria

- The verification file is stored in Next.js `public/` with its filename and
  contents unchanged.
- The repository-root copy is removed.
- The production verification URL returns HTTP 200 and the expected token after
  merge and deployment.

## In Scope

- Relocate `baidu_verify_codeva-R66rDyn2Kt.html` into `public/`.
- Validate the tracked file path and byte-for-byte content.
- Run lint and build validation before delivery.

## Out of Scope

- Clicking the authenticated Baidu "Complete verification" button.
- Changing routing, middleware, redirects, dependencies, or site content.

## File Allowlist

```text
baidu_verify_codeva-R66rDyn2Kt.html
public/baidu_verify_codeva-R66rDyn2Kt.html
tasks/README.md
```

## Task-Owned Administrative Files

- **Task card:** `tasks/51-baidu-verification.md`
- **Worklog:** `worklog/agent-51-baidu-verification.md`

## Forbidden / Shared Files

- No application source, routing, middleware, dependency, environment, or
  deployment configuration files may change.
- `tasks/README.md` is explicitly authorized for this task's single board row.

## Inputs / Evidence

- Baidu-issued filename: `baidu_verify_codeva-R66rDyn2Kt.html`.
- Expected token: `f9e5f7f4ed81e18a351ec1355bdea757`.
- Production check on 2026-09-03 returned HTTP 404 while the file was at the
  repository root.

## Acceptance Criteria

- `git ls-files` reports only `public/baidu_verify_codeva-R66rDyn2Kt.html`.
- The file content is exactly `f9e5f7f4ed81e18a351ec1355bdea757`
  with no markup or extra data.
- `npm run lint` and `npm run build` pass.
- Diff contains only the task allowlist and task-owned administrative files.

## Validation

```bash
git ls-files '*baidu_verify_codeva-R66rDyn2Kt.html'
npm run lint
npm run build
git diff --check
```

- [x] Diff scope reviewed
- [x] Validation recorded

## Coordination Items

- None

## Review Status

- Outcome: Pending
- Independent reviewer evidence:

## Completion Record

- Commit: `69cdc83` (`seo: publish Baidu verification file`)
- Base / rebase commit: `b5a2525`
- Changed files: moved the verification file into `public/`; added this task
  card and task worklog; added the Task 51 row to `tasks/README.md`.
- Validation results: `npm run lint` passed; clean `npm run build` passed with
  555 static pages; local production request returned HTTP 200,
  `Content-Length: 32`, and the expected token; `git diff --check` passed; only
  the public verification path is tracked.
- Worklog: `worklog/agent-51-baidu-verification.md`
- Remaining risks: Production HTTP 200 can only be confirmed after independent
  review, merge, and Vercel deployment.

## Rollback

Revert the task commit to remove the verification file from `public/`.
