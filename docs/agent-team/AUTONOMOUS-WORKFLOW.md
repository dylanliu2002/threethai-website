# Autonomous Workflow (Corrected Bootstrap v2)

## Activation status

**DISABLED.** SYS-AUTO-001 implements a manually supervised, fail-closed local
controller. It creates no heartbeat, Automation, live worker, GitHub mutation,
PR, task adoption, deployment or production action. Independent approval and a
separate explicit activation authorization remain mandatory.

The installed Codex CLI remains the replaceable execution adapter. The design
uses its explicit cwd/model/sandbox, JSONL and JSON Schema output primitives,
while keeping Task, Role, authorization, review and publishing policy outside
the model. Private model/session context is never controller state.

## Trust boundary

The worker worktree is untrusted for authority. The tracked machine Task
Contract under `tasks/machine/` contains requested/declared configuration only.
It cannot grant its own scope, permissions, activation, route or publishing
rights. An `authorization: true` field is rejected by the strict schema.

Machine admission requires a separate Controller Authorization Grant stored in
controller-owned durable state outside the worker worktree. The local default
is:

```text
<git-common-dir>/threethai-workflow/
```

The Grant binds its own envelope digest and all authority-bearing data:

- authorization ID/revision, Task key, complete contract digest/revision and
  current card blob;
- Owner/Reviewer Roles, mode, risk, dependencies, exact branch/worktree and
  worktree realpath;
- write files/prefixes, administrative paths and shared-file grants;
- validation profile, permissions, routing/model/fallback and limits;
- activation and publishing permissions, allowed branch, force prohibition,
  provenance, issue time and expiry/non-expiring policy.

Any Task Contract or card change without a matching new trusted Grant is
rejected. A recomputed digest inside worker-writable content has no authority.

## Controller capabilities and sandbox

Every privileged continuation after admission requires an expiring,
controller-signed capability. It binds Task/run/attempt, lease ID, monotonic
fencing token, contract digest, authorization revision, branch/worktree, Role,
model, sandbox, action, current head and expiry. The signing key and active
capability state never enter tracked content.

The controller derives execution values; callers cannot select model, cwd,
sandbox or escalation:

```text
independent REVIEW -> read-only
bounded IMPLEMENT/CORRECT -> workspace-write
danger-full-access -> forbidden in this MVP
```

`runCodexExec` verifies the external Grant, signed capability, controller
activation state, task dispatch permission, authoritative run, current
lease/fence, route and exact worktree before invoking `spawn`. An environment
variable may only disable execution as an emergency kill switch; it never
enables execution.

## Durable state, leases and recovery

Controller state and its append-only event journal are outside the worker
worktree. State records Task phase, current run/attempt, run/worker/thread/Role,
executor/provider/requested and reported model, configuration/contract digests,
authorization revision, base/head, lease/fence, reviews, approvals, correction
count, closeout and publishing facts.

Admission uses an OS/filesystem atomic mutex plus atomic state replacement.
Durable reservations cover controller Task identity, task/worktree, case-folded
paths, shared governance, resource/build and Git-operation classes. Lease expiry
advances a monotonic fencing generation; a stale worker cannot validate,
review, approve, close out or publish. Duplicate wakeups and simultaneous
processes cannot create a second authoritative run. Disjoint scopes may still
proceed concurrently.

Each journal event includes a sanitized reconstructable snapshot. Restart
replay restores active Task/run/lease/reservation/review/approval/correction/
closeout/publishing state. Repeated reconciliation is idempotent and creates no
duplicate run.

## Actual change and path authority

`worker_result.changed_files` is advisory telemetry only. After a run, the
controller independently derives committed, staged, unstaged and untracked
changes from Git. Rename/copy source and destination are both checked. Every
actual path is NFC-normalized, slash-normalized and compared case-insensitively
for Windows against the Grant.

Absolute, drive, UNC, empty-segment and traversal paths are rejected. Existing
ancestors are realpath-checked; symlink/junction/reparse paths and escapes are
rejected. A hidden untracked file or an allowed-to-forbidden rename blocks the
run before validation or publishing.

## Review, approval and correction

An `APPROVED` string in model output is not approval. Independent review
requires authoritative completed implementation and reviewer runs with:

- different Owner/Reviewer Roles, run IDs, worker IDs and thread IDs;
- exact Task, contract digest/revision and authorization revision;
- exact reviewed base/head and implementation validation digest;
- non-empty review evidence and a recomputed evidence digest.

Only after that record validates may the controller issue an Approval Record.
The Approval binds reviewed base/head, contract and authorization revisions,
reviewer run, validation/evidence digests and approval revision. A later
substantive head or authorization change invalidates it.

`CHANGES_REQUESTED` increments the durable controller correction counter. The
same Owner Role/branch/worktree receives the corrective run; caller-supplied
counts are ignored. Each return to review requires a new reviewer run. Three
completed cycles are the maximum; the next request becomes `BLOCKED`.

## Closeout and publishing

Closeout requires a current controller Approval, closeout capability, live
lease/fence and the unchanged reviewed head. It derives the diff again from the
Reviewed Head and permits administrative paths only. Any implementation path
change is rejected. A committed closeout must preserve distinct Reviewed and
Closeout Heads.

Commit, push and PR are independently gated by Grant permission, matching
capability/action/head, current lease/fence, exact non-main branch, task-specific
approval where configured, independent scope evidence and exact Git config/
HEAD author identity:

```text
dylanliu2002 <dylanliu2002@gmail.com>
```

Force push and push-to-main are forbidden. Task-specific `pr=false` wins over
any generic policy. Merge remains not implemented and not authorized.

## Secret boundary

Contracts, structured worker results, stdout, stderr, exceptions, controller
event/log payloads and worklog candidates are scanned/sanitized. Detection
covers private keys, common API/GitHub/cloud token shapes, credentialed URLs,
JWT-like credentials and password/secret assignments. Detected values are
redacted from logs and blocked from tracked publication. Public ownership-
verification values are not treated as credentials merely because they are
short verification tokens. Full environment maps are never logged.

## Validation-only operation

Local full validation requires the external Grant. Hosted CI intentionally has
no controller authority and uses `--contracts-only`; this can validate schemas
and adversarial tests but cannot dispatch or publish.

```bash
node workflow/cli.mjs validate --all
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
node workflow/cli.mjs tick
```

With activation disabled, both tick forms produce zero live workers, GitHub
mutations and publishing actions. No existing Task is adopted by SYS-AUTO-001.
