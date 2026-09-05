# Infrastructure Task SYS-AUTO-001 — Codex Autonomous Workflow Bootstrap

- **Task Key:** `sys-auto-001-codex-autonomous-workflow-bootstrap`
- **Display Task ID:** `SYS-AUTO-001`
- **Title:** Codex Autonomous Workflow Bootstrap
- **Mode:** `CORRECTIVE / IMPLEMENT`
- **Role / Owner:** `ORCHESTRATOR`
- **Execution Profile:** `STRATEGIC_REASONING`
- **Executor Platform:** Codex
- **Current Provider:** OpenAI
- **Requested Model:** GPT-5.6 Sol
- **Reasoning Effort:** `high`
- **Execution Assignment Recorded:** Yes
- **Priority:** `P1`
- **Status:** `REVIEW`
- **Machine Phase:** `INDEPENDENT_REVIEW`
- **Risk:** `HIGH`
- **Branch:** `codex/sys-auto-001-bootstrap`
- **Worktree:** `worktrees/sys-auto-001-bootstrap`
- **Reviewer:** `QA_PERFORMANCE` (fresh independent Codex thread/run required)
- **Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **depends_on:** None
- **blocks:** Live autonomous activation until separate approval and activation authorization

Exact model selection is task execution metadata, not a permanent Role binding.
No provider/model switch or automatic fallback is authorized during this task.

## Authorization and Goal

The user explicitly authorized SYS-AUTO-001 on 2026-09-04 before implementation.
It replaces the former proposal label "Task 53"; no numeric Task 53 may be
created or used as machine identity.

Build the minimum Codex-native controller that can deterministically admit
authorized machine contracts, schedule isolated workers, validate structured
results, enforce independent review and bounded correction cycles, prepare
administrative closeout/PR actions behind permissions, and recover from durable
runtime events. This bootstrap produces a live-capable design but does not
activate unattended execution.

## Success Criteria

- Strict, versioned Zod contracts reject unknown fields and unsupported versions.
- Machine identity uses full `task_key`; run identity is controller-generated.
- State, routing, dependency, scheduler, lock, review, correction, closeout,
  publishing and recovery rules fail closed.
- Two disjoint tasks may run concurrently; overlapping scopes serialize.
- `codex exec` adapter uses explicit cwd/model/sandbox, JSONL events, a structured
  output schema, timeout/cancellation and run/thread binding.
- Dry-run CLI commands have no GitHub, task, Git, worker or automation mutations.
- All required tests and repository validation pass with no package changes.

## File Allowlist

```text
AGENTS.md
docs/agent-team/EXECUTION-POLICY.md
docs/agent-team/TEAM-OPERATING-MODEL.md
docs/agent-team/UNIFIED-AGENT-PROMPT.md
docs/agent-team/AUTONOMOUS-WORKFLOW.md
docs/agent-team/AUTONOMOUS-MIGRATION-REGISTER.json
tasks/TEMPLATE.md
tasks/README.md
worklog/README.md
tasks/sys-auto-001-codex-autonomous-workflow-bootstrap.md
tasks/machine/sys-auto-001-codex-autonomous-workflow-bootstrap.json
worklog/sys-auto-001-codex-autonomous-workflow-bootstrap.md
workflow/**
.agents/skills/task-worker/**
.agents/skills/task-review/**
.agents/skills/task-closeout/**
.github/workflows/autonomous-validation.yml
```

The shared governance files above are explicitly granted to the ORCHESTRATOR for
this infrastructure task. No other shared file is granted.

## Forbidden and Activation Boundary

Do not modify application source, public assets, Prisma, environment files,
package/lock files, deployment configuration, historical reports, existing Task
Cards/worklogs, or any existing task worktree. Do not reset, stash, delete or
rewrite history. Do not push main, merge, create a PR before independent
approval, change production, send external messages or perform webmaster work.

Implementation completion is not activation. This task must not create a live
Automation/heartbeat, dispatch a live Codex worker, enable controller GitHub
writes, adopt existing tasks or run unattended. Those actions need separate
explicit authorization after independent approval.

## Existing Task Preservation

- Tasks 13 and 14: provenance only; do not continue automatically.
- Task 15: provenance only; do not start automatically.
- Task 16: retain `ON_HOLD`; never dispatch automatically.
- Task 48: untouched, including its legacy worktree.
- Task 52: merged before this base; provenance only.
- Tasks 10–16, 48, 51 and 52 retain their historical IDs and executor facts.

No existing unfinished task is adopted by SYS-AUTO-001.

## Validation

```bash
git diff --check
node workflow/cli.mjs validate --all
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
npm run lint
npm run typecheck
```

- [x] Diff scope reviewed
- [x] Machine contract and authorization-card blob binding validated
- [x] Required test matrix passed: 65/65
- [x] Dry-run mutation boundary verified
- [x] Git identity verified exactly for authored commits; repeat after handoff

## Coordination Items

- Preflight fetched origin and found the exact expected base
  `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`, which merged Task 52 PR #12.
  Task 52 shared-board ownership was released before this task began.
- Installed Codex CLI `0.153.0-alpha.5` exposes the required MVP primitives:
  explicit `--cd`, `--model`, `--sandbox`, `--json`, `--output-schema`, timeout
  supervision by the controller, and session events. App Server remains a later
  option; it is not needed for this bootstrap.
- Official OpenAI documentation describes `codex exec` as the non-interactive
  pipeline interface, JSONL events for machine consumption, JSON Schema final
  output, least-privilege sandbox selection, repository `AGENTS.md` layering and
  repository Skills. The implementation keeps deterministic policy outside the
  model and uses those native primitives only behind an activation gate.
- Symphony-aligned concepts retained: task-centered control, isolated workspace,
  bounded concurrency, durable policy, reconciliation and human review. The
  ThreeThai controller adds exact task contracts, reviewed-head binding,
  independent reviewer identity, path/write locks, Git identity and external
  action gates. No external framework is copied.
- Final pre-review fetch confirmed `origin/main` remains the exact task base.
  `git rebase origin/main` reported up to date; no conflict or rewrite occurred.
- Task 13/14 were not continued, Task 15 was not started, Task 16 remains on
  hold, Task 48 was untouched, and Task 52 is preserved as merged provenance.
  No existing Task was adopted, dispatched or modified.

## Review Status

- Outcome: Pending independent `QA_PERFORMANCE` review.
- Required review: fresh Codex execution, fresh thread/run, no implementation
  contribution, exact reviewed base/head and contract revision binding.

## Independent Review Record — Blocked Head

- **Review Outcome:** `BLOCKED`
- **Reviewed Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **Reviewed Head:** `38e5e74ee70539145756ee22fa52bd8ee578771a`
- **Reviewer Role:** `QA_PERFORMANCE`
- **Corrective authorization:** The user authorized this same Task, branch and
  worktree to move to `IN_PROGRESS / CORRECT`. This historical BLOCKED outcome
  remains unchanged and cannot approve any corrected head.

BLOCKER findings recorded by the independent review:

1. Authorization was self-manufacturable from the worker-writable contract,
   including activation, permissions and scope.
2. `runCodexExec` lacked an unavoidable controller activation/permission gate
   and accepted caller-selected model, sandbox and working directory.
3. Actual Git/filesystem changes were not independently derived and compared
   with authorized scope; worker-reported `changed_files` was trusted.
4. Approval could be manufactured without authoritative independent-review,
   run, contract and evidence binding.

MAJOR findings recorded by the independent review:

1. Locks, active runs and wakeup deduplication were process-local.
2. Recovery did not reconstruct authoritative task/run/lease/lock state.
3. Publishing lacked live lease/fencing, authoritative approval, current SHA,
   exact branch and independently verified Git identity gates.
4. Controller, worktree/path, shared governance, resource/build and Git locks
   were not acquired as durable authoritative reservations.
5. Correction count and fresh-review requirements relied on caller input.
6. Secret detection/redaction did not cover structured worker output,
   stdout/stderr/errors/logs/journal payloads or broad credential classes.

## Corrective Pass Evidence

- **Corrected implementation head:**
  `fec98b557876be6488f8bde7983cd228033b5dda`
- **Prior blocked reviewed head:**
  `38e5e74ee70539145756ee22fa52bd8ee578771a`
- **Contract revision:** `3` (final independent-review handoff)
- **Authorization revision:** `3`, stored in controller-owned Git common/admin
  state outside the worker worktree; global activation remains disabled.
- **Fresh review required:** `QA_PERFORMANCE`, fresh Codex run/thread. The prior
  blocked reviewer run and evidence cannot be reused as approval.

BLOCKER closure evidence:

1. PASS — tracked Task Contract is declared/requested configuration only.
   Strict schema rejects self-declared authorization; the external Grant binds
   the complete contract/card digest and every scope/activation/publishing field.
2. PASS — `runCodexExec` rejects caller model/sandbox/cwd and validates the
   external Grant, signed capability, activation, run, lease/fence, derived
   route/sandbox and exact worktree before spawn. `danger-full-access` is
   forbidden. Inactive non-dry-run tick started zero workers.
3. PASS — controller independently derives committed/staged/unstaged/untracked
   Git changes plus rename source/destination and reparse-safe canonical paths.
   Worker `changed_files` remains advisory telemetry.
4. PASS — approval requires authoritative completed implementation/reviewer
   runs, exact Role/run/thread/worker/base/head/contract/authorization binding,
   validation digest and non-empty review evidence digest. Only the controller
   can issue the Approval Record.

MAJOR closure evidence:

1. PASS — cross-process atomic controller state, leases, path/shared/resource/
   Git reservations, persistent wakeup dedupe and monotonic fencing replace
   process-local operational Maps.
2. PASS — append-only sanitized journal snapshots reconstruct task phase,
   current run/attempt, leases/locks, review/approval, correction, closeout and
   publishing state; repeated reconcile is idempotent.
3. PASS — publishing requires Grant, action capability, live lease/fence,
   exact branch/current SHA, task-specific approval where configured, scope
   evidence and exact Git config/HEAD author. Main/force/merge remain rejected.
4. PASS — controller, task/worktree, path, shared governance, resource/build and
   Git-operation reservations are acquired in the same atomic admission.
5. PASS — correction count and used reviewer run IDs are controller-owned
   durable state; caller counts are ignored and every corrected head needs a
   fresh reviewer run. Maximum remains three.
6. PASS — structured results, stdout/stderr/errors, controller journal/log data,
   worklog candidates and tracked artifacts use expanded secret detection and
   redaction without classifying public ownership-verification values as secrets.

Manual security reproduction (focused adversarial run):

- A self-manufactured authorization: REJECTED (`AUTH-01`).
- B activation unset/disabled: spawn not invoked (`EXEC-01`).
- C worker omits unauthorized change: independent Git evidence detected it
  (`SCOPE-01`).
- D manufactured/empty/mismatched review evidence: REJECTED (`REVIEW-01`,
  `REVIEW-02`, `REVIEW-04`).
- E two independent Node controller processes: exactly one authoritative
  dispatch (`LOCK-01`).
- F stale lease/fence publishing attempt: REJECTED (`LEASE-01`).

Corrective validation:

- `node workflow/cli.mjs validate --all`: PASS; one external Grant verified,
  activation disabled and tracked secret scan passed.
- `node --test workflow/tests/*.test.mjs`: PASS, 48/48 including every required
  AUTH/EXEC/SCOPE/PATH/REVIEW/APPROVAL/LOCK/LEASE/RECOVERY/CORRECT/CLOSEOUT/
  PUBLISH/SECRET regression ID and real two-process contention.
- `node workflow/cli.mjs reconcile --dry-run`: PASS; zero mutations/workers.
- `node workflow/cli.mjs tick --dry-run`: PASS; zero mutations/workers/
  Automations/GitHub/publishing actions.
- inactive `node workflow/cli.mjs tick`: PASS; zero live workers, GitHub
  mutations and publishing actions.
- `npm run lint`: PASS. `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Independent controller-derived scope evidence: PASS; only SYS-AUTO-001
  allowlisted paths. No application/public/Prisma/environment/package/lock/
  deployment or existing Task artifact changed.
- Task 16 remains `ON_HOLD`; dirty legacy Task 48 worktree was inspected
  read-only and untouched; Tasks 13/14/15 were not adopted or started.
- Autonomous workflow active: NO. Existing Tasks adopted: NO. PR: NO.

## Completion Record

- Authorization/provenance commit:
  `4f82f9f6c097c8f1b9476f1eb987fb5ccd4f939a`.
- Implementation commit:
  `d343d314f476f148138407fc6a210a7bcc98a71b`.
- Final handoff head: recorded in the delivery report after the administrative
  REVIEW commit; that commit changes only SYS-AUTO-001 state/evidence artifacts.
- Base / rebase commit: `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`.
- Changed files: 43, all within the explicit allowlist; no `src/`, `public/`,
  Prisma, environment, package/lock, deployment or existing Task artifact change.
- Machine contract/schema/Role/state/routing/dependency/scheduler/locks/Codex
  adapter/review/correction/closeout/publishing/recovery/CLI/Skills: PASS.
- `node workflow/cli.mjs validate --all`: PASS; strict contract and secret scan.
- `node --test workflow/tests/*.test.mjs`: PASS, 41/41.
- `node workflow/cli.mjs reconcile --dry-run`: PASS, zero mutations/workers.
- `node workflow/cli.mjs tick --dry-run`: PASS, activation disabled, zero
  mutations/workers/automations.
- `npm run lint`: PASS. `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Worklog: `worklog/sys-auto-001-codex-autonomous-workflow-bootstrap.md`.
- Remaining risks: bootstrap is HIGH risk and remains manually supervised;
  activation, publishing, task adoption and production actions remain disabled.

## Rollback

Before merge, withhold the branch. After a separately approved merge, revert the
SYS-AUTO-001 implementation commits to remove controller code and additive
governance. No live automation or production rollback is needed because this
task does not activate either.

## Independent Review Record — Second Blocked Head

- **Review Outcome:** `BLOCKED`
- **Reviewed Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **Reviewed Head:** `efe26f4b51214ab576b51927f504a0bbc39180a2`
- **Reviewer Role:** `QA_PERFORMANCE`
- **Correction cycle:** `#2`, explicitly authorized by the user on the existing
  Task, branch and worktree only. This historical review remains unchanged and
  cannot approve a later corrected head.

BLOCKER findings recorded by the second independent review:

1. The trusted authority root remained caller-manufacturable because production
   privileged APIs accepted caller-selected state, Grant, activation, signing
   key, lease and capability material.
2. Authoritative run state was forgeable: a worker-reported `FAILED` outcome
   could be recorded as completed and a nonexistent worker-selected head could
   replace the actual Git HEAD.
3. `finalizeCloseout` accepted a caller-supplied plan and could complete without
   independently loading a valid current approval record.

MAJOR findings recorded by the second independent review:

1. Lease/fencing validation and privileged state mutation were separate,
   leaving a TOCTOU race.
2. Structured secret detection/redaction missed sensitive field names such as
   `password`.
3. The configured durable `max_workers` limit was not enforced.
4. Fresh controller state could not admit a `REVIEW / INDEPENDENT_REVIEW` task
   under its authorized reviewer Role.
5. Validation-only CI `tick --dry-run` required external live authority and
   failed on a clean checkout.

Second corrective authorization:

- Status is `IN_PROGRESS / CORRECT`; activation, worker dispatch, existing-task
  adoption, PR creation, merge, GitHub writes and production remain disabled.
- The correction must establish a canonical controller authority root, pinned
  trust anchor, separate administration boundary, controller-derived completion
  evidence, atomic fencing, authoritative closeout and all required second-pass
  regressions before returning to a fresh independent review.

## Corrective Pass #2 Evidence

- **Corrected implementation commit:**
  `c66872a057a6625016389a84b5f2028dfa56f640`
- **Prior blocked reviewed head:**
  `efe26f4b51214ab576b51927f504a0bbc39180a2`
- **Contract revision:** `5` (second-correction independent-review handoff).
- **Fresh review required:** `QA_PERFORMANCE`, new Codex run/thread with no
  implementation contribution. Neither historical blocked review is reusable.

Second-review BLOCKER closure:

1. PASS — production authority is fixed by the reviewed controller
   installation's Git common repository identity, kept outside task worktrees,
   and verified against a pinned Ed25519 identity. Caller-selected stores,
   Grants, keys, activation, leases and capabilities cannot redirect trust.
2. PASS — process exit, actual Git head/scope and deterministic validation are
   controller-derived. `FAILED`, invalid, stale, scope-violating or
   validation-failing runs cannot advance to review; reported head is telemetry.
3. PASS — production closeout takes only Task key/capability data and, inside
   the authoritative transaction, reloads the current Approval, Grant,
   lease/fence, reviewed head, Git state and administrative scope.

Second-review MAJOR closure:

1. PASS — each privileged continuation validates capability, lease, run, phase
   and fence and performs its mutation inside one locked state transaction.
2. PASS — secret handling recursively detects/redacts normalized sensitive
   field names and value patterns across structured data and event/log paths.
3. PASS — expired leases are removed and effective `max_workers` is durably
   counted/enforced inside admission; two of three test workers were admitted.
4. PASS — fresh `REVIEW / INDEPENDENT_REVIEW` admission derives the signed
   Reviewer Role and requires signed implementation/head/Git-scope evidence.
5. PASS — clean static validation and dry-run reconciliation/tick require no
   live authority, manufacture no Grant and perform zero mutation.

Manual A–H reproduction evidence:

- A `TRUST-01/02/03`: caller-owned trust root/key/Grant and root replacement
  rejected; production spawn count remained zero.
- B `RUN-01`: worker `FAILED` did not advance the Task to review.
- C `RUN-02`: nonexistent reported head was ignored; actual Git HEAD stored.
- D `CLOSEOUT-01/02`: missing stored Approval and forged reviewed head rejected.
- E `WORKERS-01`: `max_workers=2` admitted two and deferred the third.
- F `REVIEW-ADMISSION-01/02`: authorized fresh Reviewer admitted; Owner rejected.
- G `CI-01`: clean-authority dry-run passed with zero mutation/workers/Grants.
- H `SECRET-01/02`: structured password and nested credential fields detected
  and redacted.

Final second-correction validation:

- `node --test workflow/tests/*.test.mjs`: PASS, 65/65, including all required
  second-review regressions and prior cross-process/recovery/path/Git evidence.
- `node workflow/cli.mjs validate --all`: PASS; static validation works with
  canonical authority unavailable and creates no Grant.
- `node workflow/cli.mjs reconcile --dry-run`: PASS; zero mutations/workers.
- `node workflow/cli.mjs tick --dry-run`: PASS; zero workers, GitHub mutations,
  publishing actions or Grants.
- Inactive `node workflow/cli.mjs tick`: PASS; zero live workers, GitHub
  mutations and publishing actions.
- `npm run lint`, `npm run typecheck`, `git diff --check`: PASS.
- Scope: PASS. Only SYS-AUTO-001 allowlisted governance/workflow paths changed;
  no application, public, Prisma, environment, package/lock, deployment,
  production or existing Task artifact changed.
- Task 16 remains `ON_HOLD`; Task 48 is untouched; no existing Task was adopted
  or launched. Autonomous workflow active: NO. PR/merge: NO.

Final handoff head is the administrative REVIEW commit that records this
evidence and will be reported after push. The implementation author does not
self-approve it.

## Independent Review Record — Third Blocked Head

Review #3:
BLOCKED

Reviewed Head:
0801971513ece65f16c71e638dfe37eea5ccd959

- **Reviewed Base:** `b18e5630909e73c3fc6b4884a51d0b6daa89d20c`
- **Reviewer Role:** `QA_PERFORMANCE`
- **Correction cycle:** `#3`, the final corrective cycle permitted by the
  current SYS-AUTO-001 policy. Reviews #1 and #2 remain unchanged; no correction
  counter is reset and no fourth cycle is implied or authorized.

BLOCKER findings recorded by Review #3:

1. Reviewer authority remained forgeable because a submitted Review Record
   could name a reviewer run different from the current reviewer capability and
   could claim `APPROVED` despite an authoritative reviewer result of `BLOCKED`.
2. Production mutation facades accepted caller-supplied time, allowing
   backdated validation attempts against expired Grant/capability/lease data.

MAJOR findings recorded by Review #3:

1. The filesystem mutex evicted a lock by age alone, so a live holder older than
   30 seconds could lose its critical section to another process.
2. String/file secret scanning did not recursively inspect parseable structured
   content, and stringified JSON secrets could remain unsanitized.

Final corrective authorization:

- Status is `IN_PROGRESS / CORRECT`; this is corrective pass #3 and the final
  governed corrective cycle.
- The correction is limited to exact reviewer-run/outcome/evidence/approval
  binding, trusted production time, ownership-aware non-evicting mutex behavior,
  structured string/artifact secret handling and their minimal regressions.
- Activation, worker dispatch, task adoption, PR creation, merge, GitHub writes,
  production changes and a fourth corrective cycle remain unauthorized.

## Corrective Pass #3 Evidence

- **Corrected implementation commit:**
  `4bfcae4600f3c39a9d2b7e19d9e8465d2015b03c`
- **Prior blocked reviewed head:**
  `0801971513ece65f16c71e638dfe37eea5ccd959`
- **Contract revision:** `7` (final-correction independent-review handoff).
- **Fresh review required:** `QA_PERFORMANCE`, new Codex run/thread with no
  implementation contribution. Reviews #1, #2 and #3 remain historical
  `BLOCKED` evidence and cannot authorize this corrected head.

Review #3 BLOCKER closure:

1. PASS — review acceptance is bound to the current reviewer capability and
   exact controller-stored reviewer run, worker, thread, attempt, target,
   outcome and canonical evidence. Approval is created from that same accepted
   result in the authoritative transaction and cannot substitute caller data.
2. PASS — production privileged facades use controller time and reject caller
   clock/timestamp injection. Backdating cannot revive an expired Grant,
   capability or lease.

Review #3 MAJOR closure:

1. PASS — the filesystem mutex records owner PID, process-start identity and a
   random owner token. Age never evicts a live or uncertain holder; non-owner
   release fails closed, including with a copied token. More than 31 seconds of
   live ownership remained exclusive, and fencing advanced only after release.
2. PASS — parseable JSON strings and tracked artifact content are inspected
   recursively for normalized sensitive field names. Structured log strings
   are recursively redacted while public site-verification metadata remains
   allowed.

Final third-correction validation:

- `node --test workflow/tests/*.test.mjs`: PASS, 86/86, including exact review/
  approval binding, trusted time, live long-holder, owner-only release,
  atomic-fence, cross-process dispatch/worker-limit and structured-secret
  regressions.
- `node workflow/cli.mjs validate --all`: PASS; one contract statically
  validated, authority unavailable, zero Grants and 73 tracked files scanned.
- `node workflow/cli.mjs reconcile --dry-run`: PASS; zero mutations/workers.
- `node workflow/cli.mjs tick --dry-run`: PASS; zero workers, automations,
  GitHub mutations, publishing actions or Grants.
- Inactive `node workflow/cli.mjs tick`: PASS; zero live workers, automations,
  GitHub mutations, publishing actions or Grants.
- `npm run lint`, `npm run typecheck`, `git diff --check`: PASS.
- Scope: PASS. Only SYS-AUTO-001 allowlisted governance/workflow paths changed;
  no application, public, Prisma, environment, package/lock, deployment,
  production or existing Task artifact changed.
- Task 16 remains `ON_HOLD`; Task 48 is untouched; no existing Task was adopted
  or launched. Autonomous workflow active: NO. PR/merge: NO.

Status is `REVIEW / INDEPENDENT_REVIEW`. A fresh QA_PERFORMANCE Reviewer #4
must review the final administrative handoff head. No fourth corrective cycle
is authorized automatically if that review is not approved.

## Human Risk Acceptance — Inactive Merge Only

- **Decision Type:** `HUMAN RISK ACCEPTANCE`
- **Technical Reviewed Head:**
  `62d99d18f858fde6eee97559b8a9edec81d2a776`
- **Reviewer #4 Outcome:** `BLOCKED`
- **Reviewer #4 residual finding:** Controller-to-worker OS/security isolation
  is not proven to activation-grade standards.
- **Human decision:** `ACCEPTED FOR INACTIVE MERGE ONLY`
- **Rationale:** The remaining finding is treated as an activation prerequisite
  rather than a blocker for storing inactive controller infrastructure in main.

Accepted residual risk includes:

- worker OS isolation not yet independently proven;
- controller credential/read isolation not yet activation-grade;
- future worker security profile requires additional hardening before live use.

Risk explicitly NOT accepted for:

- unattended worker execution;
- production credentials;
- GitHub write authority in workers;
- deployment;
- DNS;
- production systems;
- external autonomous actions.

Activation prerequisite:

A separate human-authorized lightweight activation-hardening and pilot review
must occur before any live worker dispatch.

- **Autonomous workflow active:** `NO`
- **Existing tasks adopted:** `NO`
- **SYS-AUTO-002:** `DEFERRED HARDENING / NOT REQUIRED FOR CURRENT INACTIVE MERGE`.
  Its evidence and implementation remain preserved for possible future use; it
  is not part of this merge preparation.
- **Merge boundary:** This decision does not relabel Reviewer #4 as approved,
  close the isolation finding, authorize automatic merge, or make the workflow
  activation-ready, unattended-execution-ready, or production-credential-ready.
  Human merge is required, and any later activation requires separate explicit
  human authorization.
