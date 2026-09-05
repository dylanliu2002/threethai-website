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

Machine admission requires a separately signed Controller Authorization Grant
stored in controller-owned durable state outside the worker worktree. Production
derives one canonical root from the reviewed controller installation's Git
common repository identity and startup context; callers cannot supply or replace
it. A target worktree must belong to that same Git common repository, then the
signed Grant additionally binds its exact realpath. The local layout is:

```text
<workspace>/.threethai-controller/<repository-identity>/
  admin/controller-private-key.pem
  grants/<task-key>.json
  runtime/
```

Reviewed controller code pins the Ed25519 public-key identity. Grant and
capability signatures must verify against that key and fingerprint; a key found
in a caller-selected directory is never trusted. The matching private key is an
external administration credential and is not provisioned by this task. The
ordinary runtime cannot initialize or rotate the key, install its own authority,
or enable activation. A separate `workflow/admin/` surface can bootstrap only an
inactive canonical store with the already pinned identity; activation remains
unimplemented. Temporary stores and keys are accepted only by modules under
`workflow/testing/` and `workflow/internal/`, never by production facades.

The local security assumption is that controller startup and the canonical
authority root are protected by the host account, while an execution worker's
writable sandbox is limited to its exact task worktree. The controller rejects
an authority root inside that worktree and rejects a linked canonical root. A
host process with permission to rewrite reviewed controller code or the
controller-owned directory is an administrator, not an untrusted worker.

Production API classification is explicit:

| Caller value | Classification | Treatment |
| --- | --- | --- |
| Task key, signed capability, prompt, review/result record | DATA | Parsed and checked against canonical authority; never trusted by itself |
| Target worktree/repository path | DATA | Must share the controller installation's Git common repository and match the signed Grant realpath |
| State/authority directory, Grant store, trust/signing key | AUTHORITY | Resolved internally; caller override rejected |
| Activation, lease/fence, Approval/closeout plan, route/model/sandbox/spawn | AUTHORITY | Reloaded or derived internally; caller override rejected |
| Administration private key | AUTHORITY | Accepted only by the separate inactive bootstrap surface and must match the pinned public identity |

The signed Grant binds its envelope digest and all authority-bearing data:

- authorization ID/revision, Task key, complete contract digest/revision and
  current card blob;
- Owner/Reviewer Roles, mode, risk, dependencies, exact branch/worktree and
  worktree realpath;
- write files/prefixes, administrative paths and shared-file grants;
- validation profile, permissions, routing/model/fallback and limits;
- activation and publishing permissions, allowed branch, force prohibition,
  provenance, issue time and expiry/non-expiring policy.

Any Task Contract or card change without a matching newly signed Grant is
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

`runCodexExec` accepts only the task key/capability and non-authoritative run
input. It resolves the canonical Grant, state and route itself, then verifies the
signed capability, controller activation, dispatch permission, authoritative
run, current lease/fence and exact worktree before invoking its controller-owned
`spawn`. Production APIs reject caller-supplied state directories, Grants,
keys, activation, leases, fences, approval plans, route, sandbox and spawn
implementations. Authority checks use controller-resolved wall-clock time;
production facades reject caller-supplied `now`, clock or timestamp values, so
expired Grants, capabilities and leases cannot be revived by backdating. An
environment variable may only disable execution as an emergency kill switch;
it never enables execution.

## Durable state, leases and recovery

Controller state and its append-only event journal are outside the worker
worktree. State records Task phase, current run/attempt, run/worker/thread/Role,
executor/provider/requested and reported model, configuration/contract digests,
authorization revision, base/head, lease/fence, reviews, approvals, correction
count, closeout and publishing facts.

Admission uses an ownership-aware OS/filesystem atomic mutex plus atomic state
replacement. Each lock records a unique lock/owner token, PID, process-start
identity and creation time; release requires the exact owner token. Lock age is
never evidence of abandonment, so a live holder cannot be evicted merely for
crossing a timeout. If owner death cannot be proven portably, contenders wait
and then fail closed; orphan reclamation requires a separately authorized
administrative recovery path.
Durable reservations cover controller Task identity, task/worktree, case-folded
paths, shared governance, resource/build and Git-operation classes. Lease expiry
advances a monotonic fencing generation; a stale worker cannot validate,
review, approve, close out or publish. Capability, live lease, run, phase and
fencing checks are reloaded inside the same locked transaction as every
privileged mutation. Duplicate wakeups and simultaneous processes cannot create
a second authoritative run. The configured effective `max_workers` is counted
and enforced under that admission lock; administrative locks are not workers.
Disjoint scopes may still proceed concurrently within the limit.

Each journal event includes a sanitized reconstructable snapshot. Restart
replay restores active Task/run/lease/reservation/review/approval/correction/
closeout/publishing state. Repeated reconciliation is idempotent and creates no
duplicate run.

Worker completion is reporting data, not authority. The controller records the
process exit, re-runs `git rev-parse HEAD`, re-derives the actual Git scope and
runs the configured deterministic validation commands. Validation evidence
binds command exit codes, actual head, configuration digest, timestamps and an
evidence digest. `FAILED`, invalid output, scope failure, validation failure or
stale evidence cannot advance an implementation to review. A worker-reported
head mismatch is retained only as telemetry; the observed Git head wins.

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

An `APPROVED` string in model output is not approval. Reviewer completion stores
one controller-derived Review Record on the authoritative reviewer run. Review
acceptance requires the submitted record to equal that stored result and the
current signed capability exactly; a caller cannot mix run, outcome or evidence
from different reviewers. Independent review requires authoritative completed
implementation and reviewer runs with:

- different Owner/Reviewer Roles, run IDs, worker IDs and thread IDs;
- exact current reviewer capability run, Role, attempt, worker and thread;
- exact Task, contract digest/revision and authorization revision;
- exact reviewed base/head and implementation validation digest;
- non-empty controller-stored review evidence, recomputed evidence digest,
  completion time and authoritative reviewer outcome.

A fresh controller may admit a Task already at `REVIEW /
INDEPENDENT_REVIEW` only from signed implementation evidence whose reviewed
head and Git-scope digest match the current repository. Admission derives the
Reviewer Role from the phase; the Owner cannot take that review lease. The
review capability binds the exact reviewer run plus reviewed base/head.

Only after that record validates may the controller issue an Approval Record.
Approval creation reloads the accepted Review Record and reviewer run in the
same privileged transaction; no caller selects outcome, reviewer, evidence,
head or approval revision. The Approval binds reviewed base/head, contract and
authorization revisions, reviewer run/worker/thread/attempt,
validation/evidence digests and approval revision. A later
substantive head or authorization change invalidates it.

`CHANGES_REQUESTED` increments the durable controller correction counter. The
same Owner Role/branch/worktree receives the corrective run; caller-supplied
counts are ignored. Each return to review requires a new reviewer run. Three
completed cycles are the maximum; the next request becomes `BLOCKED`.

## Closeout and publishing

The production closeout API accepts only a task key and signed capability. Under
one controller-state transaction it reloads the canonical Grant, current stored
Approval, lease/fence and reviewed-head binding. It reads the actual Git head
and derives the diff from the Reviewed Head, permitting administrative paths
only. Caller-supplied approval revisions, reviewed heads, plans and allowed
paths are rejected. Missing or stale approval is fatal. A committed closeout
must preserve distinct Reviewed and Closeout Heads.

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
event/log payloads and worklog candidates are scanned/sanitized recursively.
Detection uses both value patterns and normalized field names, including
password/passwd/pwd, secret, client_secret, api_key/apikey, access_token,
refresh_token, private_key, authorization, credential(s) and token_secret.
Parseable JSON strings and artifacts are recursively inspected; stringified
structured logs are recursively sanitized before serialization. Sensitive
values become `[REDACTED]` in logs and are blocked from tracked publication. Public
ownership-verification values are not treated as credentials merely because
they are short verification tokens. Full environment maps are never logged.

## Validation-only operation

A clean checkout needs no live controller authority for static validation or
dry-run simulation. These commands validate contracts and adversarial tests,
report unavailable authority as non-dispatchable, perform zero state mutation
and never manufacture a Grant:

```bash
node workflow/cli.mjs validate --all
node --test workflow/tests/*.test.mjs
node workflow/cli.mjs reconcile --dry-run
node workflow/cli.mjs tick --dry-run
node workflow/cli.mjs tick
```

With activation disabled, both tick forms produce zero live workers, GitHub
mutations and publishing actions. No existing Task is adopted by SYS-AUTO-001.
