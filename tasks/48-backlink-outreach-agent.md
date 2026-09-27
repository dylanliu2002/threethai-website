# Task 48 — Qwen-backed backlink outreach research assistant

## Goal

Add a local, human-in-the-loop assistant that researches relevant backlink
opportunities and prepares outreach drafts for Three Thai Textile. It must
never publish links, submit forms, or send email.

## Mode

Implementation in an isolated worktree. Use Qwen's OpenAI-compatible Responses
API via native `fetch`; do not add packages and do not commit credentials.

## Allowed files

- `.env.example`
- `scripts/backlink-agent.mjs`
- `scripts/backlink-agent.example.json`
- `tests/backlink-agent.test.mjs`
- `docs/backlink-outreach-agent.md`
- `tasks/48-backlink-outreach-agent.md`

## Forbidden files

- `.env*` other than `.env.example`
- `package.json`, lockfiles, application routes, Prisma files, and all shared
  site components

## Acceptance criteria

1. Reads a local JSON brief and calls `qwen3.8-flash` through a server-side
   compatible-mode endpoint supplied by environment variables.
2. Produces validated JSON containing only prospect research and draft outreach
   messages; no send, post, form-submission, browser automation, or purchase
   action exists.
3. Scores prospects using evidence, relevance, legitimacy, and outreach fit;
   excludes paid links, link farms, low-quality directories, and unrelated
   sites.
4. Treats web content as untrusted and does not follow instructions embedded in
   pages or search snippets.
5. Has a dry-run path and automated tests that make no network or model calls.
6. Documents safe local credential setup, commands, input/output schema, and
   required human approval before any outreach.
