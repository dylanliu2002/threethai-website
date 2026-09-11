# Task 61 append-only worklog

## 2026-09-11 — LUNA implementation handoff

- Implemented the Task 61 persistent submission boundary, schema-versioned atomic runtime store, FIFO queue, claim lease/heartbeat recovery, passive service, `submit`/`status`/`serve` CLI, JSONL App Server client, and durable sibling-thread broker.
- Enforced explicit-submission traceability: idle runtime state creates no batches or workers; only the submission API creates a bounded batch; broker starts require a task belonging to that durable submitted batch.
- Enforced fixed policy: implementation `gpt-5.6-luna` with `max` and workspace-write; review `gpt-5.6-sol` with difficulty-derived effort defaulting to `medium` and read-only; OpenAI provider; Terra, fallback, fork, subagent, and exec paths rejected.
- Durable lifecycle evidence: `thread_id` is persisted before the first `turn/start`; `turn_id` is persisted immediately after a successful response; retry/recovery uses the stored thread ID.
- Deterministic tests cover bounded intake, idle behavior, FIFO/restart/stale-claim recovery, corrupt/unsupported state, model/list validation, policy enforcement, max parallel implementations, broker ordering, thread/turn crash recovery, read/resume recovery, JSONL correlation/notifications/handshake, secret rejection, and CLI surfaces.
- Validation completed: focused Node tests PASS (15/15), `npm run lint` PASS, and `npm run build` PASS. The exact Git scope checks and latest-commit identity check are delivery gates still to be recorded after commit.
- No secrets, production/deploy/DNS systems, package-file content, shared files, `workflow/**`, or SYS-AUTO-007 are included in Task 61 changes.
