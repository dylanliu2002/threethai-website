# Task 61 append-only worklog

## 2026-09-11 — LUNA implementation handoff

- Implemented the Task 61 persistent submission boundary, schema-versioned atomic runtime store, FIFO queue, claim lease/heartbeat recovery, passive service, `submit`/`status`/`serve` CLI, JSONL App Server client, and durable sibling-thread broker.
- Enforced explicit-submission traceability: idle runtime state creates no batches or workers; only the submission API creates a bounded batch; broker starts require a task belonging to that durable submitted batch.
- Enforced fixed policy: implementation `gpt-5.6-luna` with `max` and workspace-write; review `gpt-5.6-sol` with difficulty-derived effort defaulting to `medium` and read-only; OpenAI provider; Terra, fallback, fork, subagent, and exec paths rejected.
- Durable lifecycle evidence: `thread_id` is persisted before the first `turn/start`; `turn_id` is persisted immediately after a successful response; retry/recovery uses the stored thread ID.
- Deterministic tests cover bounded intake, idle behavior, FIFO/restart/stale-claim recovery, corrupt/unsupported state, model/list validation, policy enforcement, max parallel implementations, broker ordering, thread/turn crash recovery, read/resume recovery, JSONL correlation/notifications/handshake, secret rejection, and CLI surfaces.
- Validation completed: focused Node tests PASS (15/15), `npm run lint` PASS, and `npm run build` PASS. The exact Git scope checks and latest-commit identity check are delivery gates still to be recorded after commit.
- No secrets, production/deploy/DNS systems, package-file content, shared files, `workflow/**`, or SYS-AUTO-007 are included in Task 61 changes.

## 2026-09-11 — delivery gate

- Implementation commit: `db45f231afedf62059a0f454fdc40419c1fc1fa7`, based on `3d01f21df361b6dc72149c46740e5ce197f9f557`; commit author verified as `dylanliu2002 <dylanliu2002@gmail.com>`.
- The committed path set contains only the nine Task 61 `night-worker` files plus this task card and worklog. `workflow/**` is unchanged.
- Push to `origin` was attempted for `codex/61-night-worker-runtime` and stopped at SSH host-key verification because `C:\Users\dylan\.ssh\known_hosts` was unreadable (`Permission denied`). A direct HTTPS push then stopped with `SEC_E_NO_CREDENTIALS`; `gh auth status` reports the stored GitHub token invalid.
- No host-verification bypass, credential request, secret access, merge, approval, or PR creation was performed. A follow-up delivery-record commit is being preserved locally; remote push and PR remain pending the external credential/host-key fix.

## 2026-09-11 — correction cycle 1

- Addressed the independent SOL findings within the Task 61 allowlist: installed-runtime-compatible hyphenated thread sandbox values, object-valued turn sandbox policy, persisted thread/read reconciliation after the successful-turn crash window, durable same-worker reservations and serialization, non-overwriting thread identity mappings, typed-only lifecycle RPC access, exact model identifier matching across all model/list pages, canonical Git-worktree path confinement, internal-only CLI store paths, and atomic token-owned runtime locks.
- Added deterministic coverage for crash recovery without a duplicate turn, same-worker in-flight and cross-broker capacity races, mapping identity protection, raw lifecycle/ephemeral/missing-model rejection, model identifier mismatch and pagination, symlink/Git/store confinement, and lock contention/stale-owner/token-release behavior.
- Correction validation: `node --test night-worker/tests/*.test.mjs` PASS (22/22); `npm run lint` PASS.
- `npm run build` was attempted and is blocked by the restricted environment because Next.js could not fetch Google Geist and Geist Mono from Google Fonts (`Failed to fetch Geist from Google Fonts`). Shared layout/font files were not modified.
- Current rebase target is `origin/main` at `aa5c2bc7f3f52cb291e516b3ff1a473316c38aa`; the prior reviewed tip `d4d1178e4150de8c4f7c815eacdccd1e0f3c8e4b` is preserved and the correction will be rebuilt as a new linear tip on the current target without force-push.

## 2026-09-11 — correction rebase record

- Rebuilt the scoped correction as linear commit `1995092a797c3711c2a4e8cad7efb0867f0c3d9b`, with parent `aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4` (`origin/main`).
- The rebased commit author was verified as exactly `dylanliu2002 <dylanliu2002@gmail.com>` using the alternate Git object/index path after the shared worktree config lock failed with `Permission denied`.
- Hash-qualified scope checks pass for the rebased commit: `git diff --check`, allowlist-only `git diff --name-only`, and `git diff --exit-code ... -- workflow`.
- The task is now staged for independent SOL review. A delivery-record descendant will carry this card’s final push/PR outcome.
-

## 2026-09-11 — delivery attempt

- Non-force SSH push of `3f2e5a9bbddafcdac18113df54b9af6cb1870490` to `codex/61-night-worker-runtime` failed before repository authorization: `ssh: connect to host github.com port 22: Permission denied`.
- The same exact tip was retried over the repository’s HTTPS URL and failed before authentication: `Failed to connect to github.com port 443`.
- PR #44 could not be updated from this environment. No force-push, host-key bypass, credential inspection/expansion, approval, or merge was attempted. The exact final local delivery-record descendant is the tip reported in the handoff.
## 2026-09-11 — rebase branch topology note

- The local `origin/codex/61-night-worker-runtime` tracking ref remains `d4d1178e4150de8c4f7c815eacdccd1e0f3c8e4b`; required base `aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4` is not its ancestor. Once transport is available, a non-force push of the rebased Task 61 tip may therefore be rejected as non-fast-forward and requires repository-owner coordination; no force-push was attempted.
## 2026-09-12 — correction cycle 2

- Fixed the unresolved thread/start crash boundary: every reservation durably records THREAD_START_IN_FLIGHT before remote lifecycle work; a restart with no persisted thread mapping fails closed as ambiguous and never calls thread/start blindly. A successful mapping atomically advances the reservation to LIFECYCLE_ACTIVE.
- Fixed live reservation takeover: ownership is busy while the owner process is live even after lease expiry; the broker renews the reservation heartbeat throughout model/list, thread/read, thread/resume, thread/start, and turn/start work and verifies ownership before every mapping write.
- Restricted raw AppServerClient.request lifecycle namespaces thread/*, turn/*, and review/*; only validated typed methods reach private lifecycle dispatch. Rejected initialize now transitions to FAILED and requires a fresh client, preventing a false uninitialized reconnect.
- Removed unrelated-turn inference: recovery requires the persisted client_user_message_id exactly, rejects missing or duplicate correlations, and fails closed when thread/read returns only unrelated turns. Installed thread sandbox strings remain workspace-write/read-only and turn sandboxPolicy remains object-valued workspaceWrite/readOnly.
- Added deterministic tests for the pre-mapping thread crash/restart state, fake-clock lease renewal and capacity/deduplication, all lifecycle namespace bypasses, rejected initialize retry, and unrelated single-turn recovery. Focused tests PASS (26/26); npm run lint PASS.
- npm run build was attempted and remains blocked by the restricted environment because Next.js cannot fetch existing Google Geist and Geist Mono from Google Fonts (Failed to fetch Geist from Google Fonts). No shared layout/font file changed.
- Current origin/main is aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4. PR #44 currently exposes prior non-force delivery head 9e316a78106448293b013abe9ad531df2428a3ed; this correction will be committed on the current base and handed to the SOL orchestrator for safe non-force delivery. No push, force-push, approval, or merge is authorized for this correction cycle.
## 2026-09-12 — correction cycle 2 review handoff

- Correction implementation tip: 96b73da873086b0ea35cb0f39d51cdfa6839a151, with parent aa5c2bc7f3f52cb291e516b3ff1a473316c38aa4 (current origin/main). Scoped card delivery-record descendant: c87d9f0f87e50dd17f1085faf4d3f31c3933cb0b.
- Focused tests pass 26/26 and npm run lint passes. The production build remains blocked only by the environment’s Google Fonts fetch failure; no shared file was changed.
- Final status is REVIEW pending independent SOL review. The corrected tip is handed to the SOL orchestrator for safe non-force delivery of PR #44; this implementer will not push, force-push, approve, or merge.
## 2026-09-12 — correction cycle 2 ambiguity hardening

- Hardened the deterministic post-response persistence failure path: the broker now atomically marks the pre-call reservation THREAD_START_AMBIGUOUS when thread/start was attempted but the thread mapping write did not complete. A later start fails closed on that durable state even if the simulated original process is still live; the original pre-call THREAD_START_IN_FLIGHT state remains fail-closed after actual process loss.
- Focused tests remain PASS (26/26) after this hardening; the final lint/build/hash evidence will be recorded on the rebuilt tip.
