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
- **blocks:** Task 67 activation, which requires this card's content to be merged
  to `main` before `tasks/67-backlink-authority-audit.md` exists there

## Goal

Realign the backlink task records so the backlink audit scope can be executed on
a task that depends on no unresolved legacy hold, without touching `main`, any
other task's branch, worklog, or worktree, and without changing website behavior.

`tasks/16-backlink-audit.md` is the one file outside this task's own ownership
that this change edits. Repository `AGENTS.md` §7.1 bars that unconditionally —
"No one may modify another task's card" — and §8's ORCHESTRATOR exception names
only `tasks/README.md` and `tasks/TEMPLATE.md`. **There is no rule that permits
this edit.** The owner/user instruction is recorded below as the reason it was
attempted, and §7.1's §14 route is used to submit it for ratification rather than
to assert authority for it. If the owner declines, revert `tasks/16-backlink-audit.md`
alone; nothing else in this change depends on it.

## Success Criteria

- A successor backlink audit card exists that **names** its own branch, worktree,
  Role, Execution Profile, and dedicated report path. The branch and worktree are
  created when Task 67 is started, not by this task; asserting they already exist
  would be false — `git ls-remote --heads origin codex/67-backlink-authority-audit`
  returns empty as measured on 2026-09-28.
- `tasks/README.md`, `docs/audits/README.md`, `docs/agent-team/EXECUTION-POLICY.md`,
  and `tasks/16-backlink-audit.md` agree on Task 16's disposition and on which
  task now owns the backlink audit scope. This is checked by the grep commands in
  Validation, not by a test — no CI path and no test under `tests/` reads these
  seven files, so the agreement claim has no automated enforcement and a future
  edit can silently break it.
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
- Editing `.gitignore` — §8-protected, submitted as a change request below.

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

`tasks/16-backlink-audit.md` and `tasks/67-backlink-authority-audit.md` are other
tasks' cards listed here for one reason: to record this reassignment. **The grant
lapses when PR #48 merges.** After that, `tasks/16-*` belongs to Task 16 and
`tasks/67-*` to whoever is assigned Task 67, and this card confers no continuing
write access over either.

## Forbidden / Shared Files

All website source, public assets, dependencies, lock files, runtime and
deployment configuration, Prisma files, SEO copy, and production settings.

## Inputs / Evidence

- **Owner/user instruction for this reassignment**, 2026-09-14, verbatim:
  「要不帮我重新开一个task解决这个问题呢」 and 「你现在是ORCHESTRATOR，能改了吗」,
  given after this worker reported that Task 16's hold blocked the backlink audit.
  This is recorded as the *reason* the edit was attempted. It is **not** a §7.1
  exemption, because §7.1 states none; the §14 request below asks the owner to
  ratify or revert. The instruction cannot be checked against any chat or ticket
  record by a later reader, so treat it as unverifiable, not as established.
- It does not carry authority to lift Task 16's hold, to retire Task 48, to merge
  any pull request, or to push `main`.
- `origin/main` at task creation:
  `ab85e1d47e38a1ca3dee4fa782ec831320f29496`.
- `tasks/16-backlink-audit.md` on `origin/main` — `ON_HOLD`, resume condition
  requiring Task 48 to be merged or explicitly retired.
- `tasks/01-execution-policy-migration.md` on `origin/main` — cited as the
  precedent for an ORCHESTRATOR task owning board and execution-policy files. It
  is a **narrower** precedent: Task 01 records a user-authorized migration brief,
  its Task 16 edit was hold metadata only, and it states the Task 16 card remains
  authoritative. It does not establish that an ORCHESTRATOR may write a scope
  directive into another task's card.
- Pull request #47 (`codex/48-backlink-agent-reland-main`, head `f6c7ab5`) — the
  relanded legacy Task 48 work: open, `MERGEABLE`, no review decision, not merged.
- **Measured payload of PR #47**, all six files, blob hashes and byte lengths from
  `git ls-tree -l <ref> -- <paths>` run on 2026-09-28 in `threethai-website/`:

  | File | at `f6c7ab5` (PR #47) | at `8365d63` (legacy commit) | Same blob? |
  | --- | --- | --- | --- |
  | `docs/backlink-outreach-agent.md` | `ce6f9083` 3,714 | `92a7fd0e` 3,390 | No |
  | `scripts/backlink-agent.mjs` | `647e46f9` 15,033 | `6096af2a` 14,311 | No |
  | `tests/backlink-agent.test.mjs` | `b41f136e` 4,134 | `17dd215f` 4,019 | No |
  | `.env.example` | `0118a5ea` 1,102 | `0118a5ea` 1,102 | **Yes** |
  | `scripts/backlink-agent.example.json` | `a12c136f` 1,330 | `a12c136f` 1,330 | **Yes** |
  | `tasks/48-backlink-outreach-agent.md` | `4deb4ea9` 1,621 | `4deb4ea9` 1,621 | **Yes** |

  **What this means, and the earlier overstatement corrected:** PR #47 is not a
  snapshot of the uncommitted state. It is a mixture — three files carry revisions
  that exist nowhere in the committed history, and three files are byte-identical
  to the legacy commit. An earlier version of this card, and `0ff733b`, asserted
  "PR #47 therefore preserves the *uncommitted* working state, not the committed
  legacy state" for the whole PR on the strength of three files. That was stated
  wider than it was measured and is withdrawn here.
  Two consequences for whoever reviews #47: merging it lands a change to
  `.env.example`, which §8 protects and which came from the *committed* legacy
  state, and it lands `tasks/48-backlink-outreach-agent.md`, a task card that no
  board lists — `git grep -n "48-backlink-outreach-agent" HEAD -- tasks/README.md`
  returns nothing, so it would enter `main` unboarded.
- **Limits of that measurement.** Only the three differing files were compared to
  the dirty worktree, and only by on-disk byte length (`dir` listing: 3,714 ·
  15,033 · 4,134). Length is not a content hash, and no hash comparison was
  possible: the workspace bars entering or running git inside
  `backlink-agent-worktree/`. Content equivalence is therefore **unverified**.
- **`8365d63` is local-only.** `git branch -a --contains 8365d63` returns just
  `codex/48-backlink-agent`, a branch checked out in the legacy worktree with no
  `origin/` counterpart, and `git ls-remote --heads origin "codex/48*"` returns
  only `codex/48-backlink-agent-reland-main`. A reader who clones `origin` cannot
  resolve `8365d63` at all, so the table above is reproducible only on this
  machine or from the legacy worktree's ref.
- `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json` entry for Task 48 is
  historical provenance and is deliberately not edited.

## Acceptance Criteria

- Task 16 is not left silent: its card names its disposition and its successor.
- No Role is permanently bound to an Executor Platform, Provider, or Model
  Family by this change.
- No secret, credential, exact model version, or fabricated evidence is introduced.
- Task 67's report path does not overlap Task 16's, and nothing here authorizes
  performing an audit.
- No claim in this change is stated wider than the command that produced it.

## Validation

```bash
git diff --check
git status --short
git diff --name-status origin/main...HEAD
git diff --name-status 02f7eea...HEAD
git grep -n "cannot be met" HEAD -- tasks docs worklog
git grep -n "relanded onto" HEAD -- tasks docs worklog
git grep -n "READY task paths" HEAD -- docs/audits/README.md
```

Measured on 2026-09-28 at the head recorded in the worklog:

- `git diff --check` — no whitespace errors.
- `git diff --name-status origin/main...HEAD` — exactly the seven allowlist paths,
  nothing else. The three-dot form compares against the merge base; because this
  branch carries a merge of `origin/main`, the two-dot-range form is listed too so
  a reviewer can confirm the same seven paths against the current base explicitly.
- `git grep "cannot be met" HEAD -- tasks docs worklog` — 9 matches measured at
  `1ab8148`, every one either retraction text, a grep command recorded in this card,
  or the Rollback citation. **None asserts the claim.** The count is not stable: it
  moves whenever this card is edited, because the commands and their descriptions
  live in the file being grepped. Read each match; do not count it.
- `git grep "relanded onto" HEAD -- tasks docs worklog` — 3 matches at `1ab8148`:
  this card's own command line, this card's description of it, and the worklog entry
  recording the withdrawn wording. An earlier version of this bullet claimed the
  worklog was the only match, which the command itself disproved; corrected to the
  measured output.
- `git grep "READY task paths" HEAD -- docs/audits/README.md` — empty, measured at
  the working tree after `1ab8148`. This check had no teeth when first written: the
  rewrite still contained the phrase inside the sentence describing the correction,
  so the grep matched it and this bullet claimed "empty" against its own output. The
  wording was changed to "a startable path alongside the live ones" so the old
  sentence form is genuinely gone and the grep can prove it.
- These greps are the whole enforcement of the cross-document agreement criterion.
  No CI path and no test under `tests/` reads these seven files, so the agreement
  is checked by re-running the commands above, not automatically.
- No secret, credential, binary artifact, or website file is in the diff.
- Git identity verified on every commit as `dylanliu2002 <dylanliu2002@gmail.com>`.

- [x] Diff is limited to the allowlist.
- [x] Legacy Task 48 branch and worktree untouched.
- [x] No website business code or production configuration changed.
- [x] No secret, credential, or exact model version introduced.
- [ ] Owner ratifies or reverts the `tasks/16-backlink-audit.md` edit — open, this
      task cannot close it.

## Coordination Items

- **The claim this change had to correct twice.** `f8dd81c`'s commit message says
  Task 16's "resume condition cannot be met" and that Task 48's "uncommitted work
  is preserved on origin/main". Both are false: the owner-retirement disjunct needs
  no filesystem action, and `git ls-tree -r --name-only origin/main --
  docs/backlink-outreach-agent.md scripts/backlink-agent.mjs
  tests/backlink-agent.test.mjs` returns empty. AGENTS.md names Git history durable
  coordination truth, and history is published. Those two sentences are **not
  amended**; they are retracted here and in the worklog, and `git log` readers must
  be pointed at this record rather than at rewritten history.
- PR #47 is open and awaits independent review. This task neither reviews nor
  merges it, and the implementer of PR #47 cannot approve it. Per the measured
  payload above it also changes the §8-protected `.env.example` and adds an
  unboarded task card, so it needs §12 gates and §11 high-risk review — a
  different class of review than this documentation-only change.
- Task 16 is retained on hold rather than un-held. Its resume condition is **not
  met**, which is not the claim that it *cannot be met*: the second disjunct — the
  owner/user explicitly and safely retiring Task 48 — needs no filesystem action at
  all and stays open to them. Lifting the hold requires Task 48 to be completed,
  independently reviewed **and** merged, or explicitly retired; merging PR #47
  alone satisfies neither half of the first disjunct unless the review is done.
  Task 16's own card stays authoritative for its condition; this bullet only
  summarises it.
- `docs/audits/README.md` was rewritten to stop listing `16-backlink.md` among
  READY paths. That makes the description at `tasks/intl-dees-004b-core-page-evidence.md:45-47`
  stale — it quotes the directory as restricted to "the numbered role reports named
  on a card (`10` … `16`)". That card belongs to INTL-DEES-004B and §7.1 bars this
  task from touching it, so its owner is asked to update the sentence. Recorded,
  not fixed.
- `docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json` is not edited: Task 16 does
  remain on hold and Task 48's worktree is untouched, so both policy strings are
  still literally accurate, and the register is additive provenance owned by
  `sys-auto-001`. A reader of the register alone cannot see that the scope moved —
  which is why `tasks/README.md`, `docs/audits/README.md` and
  `tasks/16-backlink-audit.md` each carry it.
- Task 67's execution assignment is left unassigned; the user launches Specialist
  workers independently. Task 67 cannot start from `main` until PR #48 merges,
  because its card does not exist there yet.
- Repository `AGENTS.md` §9 asks for a rebase onto `origin/main` before review. This
  worktree carries a pre-existing unstaged deletion of
  `download/threethai-website-deploy.zip` that this task neither made nor may
  discard — §2 requires preserving pre-existing user changes, and `git rebase`
  refuses an unstaged tree while stashing is excluded. `origin/main` was therefore
  merged into the task branch instead: non-destructive, no published history
  rewritten. The deletion is repo-wide and not caused by this task:
  `git status --short` in `threethai-website/` reports the same ` D` line, so it
  predates and exceeds this worktree.
- **`.qwen/` is not ignored by this repository.** `git check-ignore -v .qwen` exits
  1 and `git status --short` in `threethai-website/` shows `?? .qwen/`, which is
  where review findings artifacts land. §8 protects `.gitignore`, so this is filed
  as the change request below rather than fixed here.

### SHARED FILE CHANGE REQUEST
File: `tasks/16-backlink-audit.md`
Task: 66
Reason: The backlink audit scope was reassigned to Task 67. Task 16's card must say
so, or a future BACKLINK worker reads it as the live assignment and starts a held
task, or reads the hold as unexplained.
Exact proposed change: Two Coordination Items added at the top of the section
("Scope reassigned 2026-09-14", the hold-lifting clarification, and the PR #47
status bullet). A third change — narrowing the `blocks:` field to name Task 67 as
the live blocker — **was applied in `0ff733b` and withdrawn in this round**: §7.1
limits the assigned Owner to `Status`, `Coordination Items`, `Validation results`
and `Completion Record`, and `blocks:` is not among them, so this task had no claim
on it even with the owner's instruction. The field is back to its `origin/main`
text. If the owner wants it narrowed, that is a decision for Task 16's owner, not
for this task.
Evidence: `tasks/README.md`, `docs/audits/README.md` and
`docs/agent-team/EXECUTION-POLICY.md` all state the same reassignment; leaving the
card silent contradicts them.
Tasks affected: Task 16 (the edited card), Task 67 (its successor), and any
follow-up outreach or authority task that reads Task 16 for its dependency.
Risk: A held card is edited by a task that does not own it, and §7.1 provides no
exception. If the owner declines ratification, revert this file alone; the rest of
the change stands without it.
Validation: `git diff --name-status origin/main...HEAD` still lists seven paths;
the re-runnable greps in this card's Validation confirm the four governance
documents agree with or without this file.

### SHARED FILE CHANGE REQUEST
File: `.gitignore`
Task: 66
Reason: Review and tool artifacts are written under `.qwen/` inside the repository
and are untracked, so every `git status` in every worktree shows `?? .qwen/`. That
makes a dirty tree the normal state and hides real stray files from the §2 status
check agents are required to run.
Exact proposed change: Add one line: `.qwen/`
Evidence: `git check-ignore -v .qwen` exits 1; `git status --short` in
`threethai-website/` reports `?? .qwen/`.
Tasks affected: Every task that runs a status gate.
Risk: Low. Ignoring a tool directory does not hide source; `.qwen/` holds session
state, review outputs, and scratch files that must not be committed anyway.
Validation: `git check-ignore -v .qwen` exits 0 and `git status --short` no longer
lists it.

## Review Status

- Outcome: `CHANGES_REQUESTED` twice, on two different rounds. Not approved.
- **Round 1 (2026-09-27)** — a reviewer worker commissioned by this task audited
  the three then-pushed commits (`f8dd81c`, `58554af`, `bd2ad7a`; the range form
  `f8dd81c..bd2ad7a` written in an earlier version of this card excluded `f8dd81c`,
  which was the only content commit) and returned `CHANGES_REQUESTED` with 3
  blocking findings and **7** non-blocking notes — an earlier version of this card
  said "nine", a figure that was never counted and is corrected here. All three
  blockers were fixed in `0ff733b`. Disposition of the seven notes: relanded-onto-
  main wording (fixed), provenance citation (fixed, then found to be over-wide —
  see round 2), Task 16 `blocks:` field (fixed, then reverted — see below), Task 67
  wave labelling (fixed), evidence-gate ambiguity (fixed, then found contradictory
  — see round 2), stale base (fixed by merging `origin/main`), unclean worktree
  (recorded, deliberately not cleaned).
- **Round 2 (2026-09-28)** — a full high-effort review of head `0ff733b` returned
  `CHANGES_REQUESTED` with 3 Criticals (R1-1 the retracted claims still live in
  `f8dd81c`'s message; R1-2 the PR #47 conclusion stated wider than measured; R1-3
  the Rollback field names a commit that does not exist and points at the wrong
  revert), 16 Suggestions and 9 Needs-Human-Review items. The corrections in this
  card and in the current commit address R1-1 through R1-3 and the Suggestions
  listed as fixed in the worklog.
- **Not cleared.** Round 2's reverse audit did not converge and stopped at a round
  cap, and its own verdict notes that a re-review of the corrected code is the only
  way deeper. Nothing in this card should be read as "all findings closed".
- Both reviewers were commissioned by the implementing ORCHESTRATOR, so neither
  outcome is the §13 approval. Approval and merge require a reviewer and an
  integrator outside this task.

## Completion Record

- Commits: `f8dd81c875b24124769245ed2beeb4d8e5954182` (content, message since
  retracted), `58554af`, `bd2ad7a` (records), a merge of `origin/main`,
  `0ff733b21530060178cb2d8db25baad97dd5da48` (round-1 corrections, partly
  over-stated), and the round-2 correction commit and its record-only follow-up,
  both named in `worklog/agent-66-backlink-realignment.md`.
- Base commit: `ab85e1d47e38a1ca3dee4fa782ec831320f29496` at creation; `origin/main`
  advanced 22 commits to `02f7eeaa33be1779badc16765b20688353a52185` while PR #48
  waited unreviewed, and was merged into this branch on 2026-09-27 (see the §9
  deviation in Coordination Items).
- Changed files: the seven allowlist paths, unchanged across all rounds —
  `tasks/README.md`, `tasks/16-backlink-audit.md`, `tasks/66-backlink-realignment.md`,
  `tasks/67-backlink-authority-audit.md`, `docs/audits/README.md`,
  `docs/agent-team/EXECUTION-POLICY.md`, `worklog/agent-66-backlink-realignment.md`.
- Validation results: as recorded in Validation above, measured 2026-09-28. No
  website, dependency, or deployment file appears in the diff and no binary
  artifact is committed. `git status --short` reports one pre-existing, unrelated,
  repo-wide unstaged deletion, ` D download/threethai-website-deploy.zip`, left
  neither staged nor restored (§2).
- Worklog: `worklog/agent-66-backlink-realignment.md`. **Disclosed against §7.2:**
  the first entry of that worklog was rewritten in place after being committed
  (its `Commit:` header, its final "Next" bullet, and a deleted bullet), which §7.2
  forbids. It is disclosed in a later appended entry and not repeated; the rewrite
  cannot be undone without rewriting published history.
- Pull request: #48 against `main`, opened 2026-09-14, corrected after round 1 on
  2026-09-27 and after round 2 on 2026-09-28. The implementer does not merge it.
- Remaining risks: PR #47 is open, unreviewed, and its true payload is broader than
  this task first recorded, so legacy Task 48 is preserved but not resolved and
  Task 16's hold stands; Task 67 has no executor, cannot start until PR #48 merges,
  and its two owner exports have not arrived; the `tasks/16-backlink-audit.md` edit
  is unratified and possibly void; round 2's review did not converge.

## Rollback

Revert **the PR #48 merge commit** on `main`. No single commit on this branch
reverts this change, and the obvious-looking reverts are the wrong ones, measured
2026-09-28: reverting `0ff733b` — the only content commit that reverts cleanly —
restores the pre-correction tree, which still asserts "resume condition cannot be
met" at `docs/agent-team/EXECUTION-POLICY.md:140` and `tasks/README.md:48`
(`git grep -n "cannot be met" bd2ad7a` confirms both) and still calls
`16-backlink.md` a READY path. Reverting `f8dd81c`, `58554af` or `bd2ad7a`
conflicts against the later commits. To revert instead:
`git revert -m 1 <merge-commit-sha>` on `main`, or
`git apply -R` of the net PR diff, which checks clean. No website runtime or
production behavior is changed by this task, in either direction.
