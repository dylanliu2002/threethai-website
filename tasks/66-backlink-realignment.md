# Task 66 — Backlink Task Realignment

- **Task Key:** None
- **Machine Contract:** None
- **Machine Phase:** None
- **Task ID:** `66`
- **Title:** Backlink Task Realignment
- **Mode:** `IMPLEMENT`
- **Role:** `ORCHESTRATOR`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** Hermes
- **Current Provider:** Alibaba Token Plan
- **Current Model Family:** Qwen
- **Execution Assignment Recorded:** Yes — 2026-09-14
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Risk:** `LOW`
- **Branch:** `codex/66-backlink-realignment`
- **Worktree:** `worktrees/agent-66-backlink-realignment`
- **Owner:** `ORCHESTRATOR`
- **Reviewer:** Unassigned (must be independent)
- **depends_on:** None
- **blocks:** Task 67 activation and all follow-up backlink authority work

## Goal

Realign the backlink task records so the backlink audit scope can be executed on
a task that depends on no unresolved legacy hold, without touching `main`, any
other task's branch, worklog, or worktree, and without changing website behavior.
`tasks/16-backlink-audit.md` is the one deliberate exception, and it is bounded:
repository `AGENTS.md` §7.1 forbids modifying another task's card, so this task
does so only on the owner/user instruction recorded under Inputs / Evidence, only
to note the reassignment, and without lifting or reinterpreting Task 16's hold —
the decision to lift it stays with Task 16's owner/user.

## Success Criteria

- A successor backlink audit card exists with its own branch, worktree, Role,
  Execution Profile, and dedicated report path.
- `tasks/README.md`, `docs/audits/README.md`, `docs/agent-team/EXECUTION-POLICY.md`,
  and `tasks/16-backlink-audit.md` agree on Task 16's disposition and on which
  task now owns the backlink audit scope.
- Legacy Task 48's branch and worktree are untouched by this task.

## In Scope

- The allowlisted governance, board, and coordination documents.
- Recording the disposition of the Task 48 / Task 16 overlap.

## Out of Scope

- Website business code, content, dependencies, configuration, or production.
- Executing or reviewing the backlink audit itself.
- Modifying the legacy Task 48 branch or its dirty worktree.
- Committing the workspace-level `../AGENTS.md` into this repository.
- Editing `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json`.

## File Allowlist

```text
tasks/README.md
tasks/16-backlink-audit.md
tasks/66-backlink-realignment.md
tasks/67-backlink-authority-audit.md
docs/audits/README.md
docs/agent-team/EXECUTION-POLICY.md
worklog/agent-66-backlink-realignment.md
```

## Forbidden / Shared Files

All website source, public assets, dependencies, lock files, runtime and
deployment configuration, Prisma files, SEO copy, and production settings.

## Inputs / Evidence

- **Owner/user authorization for this reassignment**, 2026-09-14, verbatim:
  「要不帮我重新开一个task解决这个问题呢」 and 「你现在是ORCHESTRATOR，能改了吗」,
  given after this worker reported that Task 16's hold blocked the backlink audit.
  That instruction is the §7.1 basis for editing `tasks/16-backlink-audit.md` and
  for naming Task 67 the scope owner. It does not carry authority to lift Task 16's
  hold, to retire Task 48, to merge any pull request, or to push `main`.
- `origin/main` at task creation:
  `ab85e1d47e38a1ca3dee4fa782ec831320f29496`.
- `tasks/16-backlink-audit.md` on `origin/main` — `ON_HOLD`, resume condition
  requiring Task 48 to be merged or explicitly retired.
- `tasks/01-execution-policy-migration.md` on `origin/main` — the precedent for an
  ORCHESTRATOR task owning board and execution-policy files.
- Pull request #47 (`codex/48-backlink-agent-reland-main`, head `f6c7ab5`) — the
  relanded legacy Task 48 work, open, `MERGEABLE`, awaiting independent review.
- Measured provenance of PR #47, re-run on 2026-09-27: `git ls-tree -l` gives
  `docs/backlink-outreach-agent.md` 3,714 · `scripts/backlink-agent.mjs` 15,033 ·
  `tests/backlink-agent.test.mjs` 4,134 bytes at `f6c7ab5`, and 3,390 · 14,311 ·
  4,019 at the legacy commit `8365d63`, which
  `git merge-base --is-ancestor 8365d63 origin/codex/48-backlink-agent-reland-main`
  reports is **not** an ancestor of it. The files still on disk in
  `backlink-agent-worktree/` measure 3,714 · 15,033 · 4,134. PR #47 therefore
  preserves the *uncommitted* working state, not the committed legacy state; byte
  length is not a content hash, and PR #47's own review must confirm equivalence.
- `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json` entry for Task 48 is
  historical provenance and is deliberately not edited.

## Acceptance Criteria

- Task 16 is not left silent: its card names its disposition and its successor.
- No Role is permanently bound to an Executor Platform, Provider, or Model
  Family by this change.
- No secret, credential, exact model version, or fabricated evidence is introduced.
- Task 67's report path does not overlap Task 16's, and nothing here authorizes
  performing an audit.

## Validation

```bash
git diff --check
git status --short
git diff --name-only origin/main...HEAD
```

- [x] Diff is limited to the allowlist.
- [x] Legacy Task 48 branch and worktree untouched.
- [x] No website business code or production configuration changed.
- [x] No secret, credential, or exact model version introduced.

## Coordination Items

- PR #47 is open and awaits independent review. This task neither reviews nor
  merges it, and the implementer of PR #47 cannot approve it. PR #47 also changes
  `scripts/`, `tests/` and the protected `.env.example`, so it needs the §12
  validation gates and §11 high-risk review that this documentation-only change
  does not.
- Task 16 is retained on hold rather than un-held. Its resume condition is **not
  met**, which is not the claim that it *cannot be met*: the second disjunct — the
  owner/user explicitly and safely retiring Task 48 — needs no filesystem action at
  all and stays open to them. This task reassigns the scope so the audit is not
  waiting on a decision it cannot make, and leaves the hold itself where it
  belongs.
- `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json` is not edited: Task 16 does
  remain on hold and Task 48's worktree is untouched, so both policy strings are
  still literally accurate, and the register is additive provenance owned by
  `sys-auto-001`. A reader of the register alone cannot see that the scope moved —
  which is why `tasks/README.md`, `docs/audits/README.md` and
  `tasks/16-backlink-audit.md` each carry it.
- Task 67's execution assignment is left unassigned; the user launches Specialist
  workers independently.
- Repository `AGENTS.md` §9 asks for a rebase onto `origin/main` before review. This
  worktree carries a pre-existing unstaged deletion of
  `download/threethai-website-deploy.zip` that this task neither made nor may
  discard — §2 requires preserving pre-existing user changes, and `git rebase`
  refuses an unstaged tree while stashing is excluded. `origin/main` was therefore
  merged into the task branch instead: non-destructive, no published history
  rewritten, and `git diff --name-only` confirms `origin/main` does not touch that
  path. Recorded as the §9 deviation.

## Review Status

- Outcome: `CHANGES_REQUESTED` (2026-09-27). A reviewer worker that did not author
  this change audited commits `f8dd81c`..`bd2ad7a` and returned three blocking
  findings — an overstated "resume condition cannot be met" claim, no recorded
  §7.1 authorization for editing Task 16's card, and `docs/audits/README.md` still
  naming `16-backlink.md` a READY path — plus nine non-blocking notes. All three
  blockers and six of the notes are corrected in the follow-up commit.
- Independent reviewer evidence: the reviewer worker read the committed diff, the
  rules on `origin/main`, `gh pr view` for #47/#48, and the owner-provided CSV. It
  made no edit and no GitHub write.
- This outcome was produced by a reviewer that the implementing ORCHESTRATOR
  commissioned, so it is input to the owner's decision, not the §13 approval.
  Approval and merge still require a reviewer and integrator outside this task.

## Completion Record

- Commit: `f8dd81c875b24124769245ed2beeb4d8e5954182` (first), corrected after review
  in the follow-up commit named in the worklog
- Base commit: `ab85e1d47e38a1ca3dee4fa782ec831320f29496` at creation;
  `origin/main` advanced 22 commits to `02f7eeaa33be1779badc16765b20688353a52185`
  while PR #48 waited unreviewed, and was merged into this branch on 2026-09-27
  (see the §9 deviation in Coordination Items)
- Changed files: `tasks/README.md`, `tasks/16-backlink-audit.md`,
  `tasks/66-backlink-realignment.md`, `tasks/67-backlink-authority-audit.md`,
  `docs/audits/README.md`, `docs/agent-team/EXECUTION-POLICY.md`,
  `worklog/agent-66-backlink-realignment.md`
- Validation results: `git diff --check` reports no whitespace errors, before and
  after the review corrections. `git diff --name-only origin/main...HEAD` lists
  exactly the seven allowlist paths and nothing else. No website, dependency, or
  deployment file appears in the diff, and no binary artifact is committed. Git
  identity confirmed as `dylanliu2002 <dylanliu2002@gmail.com>` on every commit.
  `git status --short` was clean at the first commit; it now reports one
  pre-existing, unrelated unstaged deletion,
  ` D download/threethai-website-deploy.zip`, which predates this session's work in
  this worktree, is outside the allowlist, and is deliberately neither staged nor
  restored (§2).
- Worklog: `worklog/agent-66-backlink-realignment.md`
- Pull request: #48 against `main`, opened 2026-09-14, corrected after review on
  2026-09-27. The implementer does not merge it.
- Remaining risks: PR #47 is still open and unreviewed, so legacy Task 48 is
  preserved but not resolved, and Task 16's hold therefore stands; Task 67 has no
  assigned executor and its two owner exports have not arrived thirteen days on, so
  its evidence gate will route it to `BLOCKED` if they are still missing when it
  starts; the §7.1 card edit rests on a chat instruction transcribed here, and a
  reviewer who judges that insufficient should ask the owner to confirm rather than
  assume it.

## Rollback

Revert the governance-only commit. No website runtime or production behavior is
changed by this task.
