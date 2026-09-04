# Execution Policy

## Purpose

This policy separates durable repository governance from replaceable execution
technology. Tasks and Roles remain stable while execution platforms, providers,
and model families may change as capability, cost, and availability change.

## Architecture

```text
Task
  -> Role
  -> Execution Profile
  -> Executor Platform
  -> Provider
  -> Model Family
```

- A **Task** is the durable work unit. It owns a Task Card, branch, worktree,
  output allowlist, worklog, review, and delivery record.
- A **Role** is a durable professional responsibility. It is never an alias for
  a platform, provider, or model.
- An **Execution Profile** describes the durable capability a task requires.
- An **Executor Platform** is the runtime selected for the task.
- A **Provider** and **Model Family** are replaceable task execution metadata.

The repository branch prefix `codex/NN-*` is a historical repository namespace,
not a statement that Codex must execute the task.

## Execution Profiles

### HIGH_RISK_CODE

Use for routing, canonical and hreflang systems, redirects, middleware, forms,
databases, authentication, deployment, high-risk runtime changes, and complex
regression analysis.

### STRATEGIC_REASONING

Use for cross-domain strategy, GEO, CRO, brand architecture, integration
decisions, conflict resolution, and other work requiring judgment across scopes.

### RESEARCH

Use for SEO content, keyword architecture, competitor or market research,
backlink research, evidence gathering, and large report synthesis.

### BULK_EXTRACTION

Use for large inventories, classification, URL or metadata extraction, and
structured repetitive analysis. It does not weaken evidence or review rules.

An Execution Profile is not a model name and does not grant scope.

## Supported Executors

Current approved Executor Platforms are:

- **Codex**
- **Hermes**

Hermes is a model-agnostic execution runtime, not a "Qwen Agent." It may use an
approved provider and model family selected for a Task. Codex and Hermes workers
are independent sibling Specialists; neither platform is subordinate to the
other. Future executors may be added without changing Role, Task, branch, or
worktree governance.

The ORCHESTRATOR coordinates Tasks and durable repository artifacts. The user
launches long-lived Specialist workers independently.

## Provider Independence

Provider selection is task execution metadata. A Role may be executed through
different approved providers over time. Changing Provider does not change the
Task Card, Role, scope, allowlist, branch, worktree, ownership, or review rules.

## Model Independence

Model Family selection is task execution metadata. Exact model versions are not
permanent Role governance unless a Task documents a concrete compatibility
requirement. A model change never grants permission to expand scope.

## Credential Handling

Provider credentials, API keys, tokens, passwords, and compatible-endpoint
secrets must never be stored in the repository, Task Cards, reports, worklogs,
prompts committed to Git, commits, or Git history. Use only approved platform
secret storage or local ignored environment configuration.

## Provider / Model Switching

Do not silently switch Provider or Model Family during an active Task. A
material switch must be authorized when required and recorded in the task-owned
append-only worklog with the reason and effective point. Add a Coordination Item
when the switch affects reproducibility, review, cost, risk, or another task.

## Fallback Policy

Automatic cross-provider fallback is disabled for repository-governed Audit,
Implementation, and Review Tasks unless the user explicitly authorizes it for
the specific Task. A fallback must not bypass scope, evidence, credential,
validation, or review requirements.

## Cross-Platform Handoff

Private Codex, Hermes, provider, or model-session context is not shared state.
Handoffs and coordination must use durable repository artifacts:

- Task Card and Coordination Items;
- report or other allowlisted output;
- task-owned append-only worklog;
- task branch, commit, and pull request;
- review record and Master Plan.

Every executor follows the same workspace `AGENTS.md`, repository `AGENTS.md`,
Task Card, Git identity, file ownership, factual integrity, validation, and
independent review requirements.

## Audit Wave Assignment

This is the current execution assignment, not a permanent Role mapping:

| Task | Role | Execution Profile | Executor Platform | Current Provider | Current Model Family | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | `TECHNICAL_SEO` | `HIGH_RISK_CODE` | Codex | Not pinned | Not pinned | See Task Card |
| 11 | `SEO_CONTENT` | `RESEARCH` | Hermes | Alibaba Token Plan | Qwen | See Task Card |
| 12 | `GEO_AI_SEARCH` | `STRATEGIC_REASONING` | Codex | Not pinned | Not pinned | See Task Card |
| 13 | `CRO` | `STRATEGIC_REASONING` | Codex | Not pinned | Not pinned | See Task Card |
| 14 | `BRAND_UX` | `STRATEGIC_REASONING` | Hermes | Alibaba Token Plan | Qwen | See Task Card |
| 15 | `QA_PERFORMANCE` | `HIGH_RISK_CODE` | Codex | Not pinned | Not pinned | See Task Card |
| 16 | `BACKLINK` | `RESEARCH` | Hermes | Alibaba Token Plan | Qwen | `ON_HOLD` pending legacy Task 48 resolution |

Task 48 remains legacy implementation-specific Qwen tooling. Its implementation
history does not bind the `BACKLINK` Role, Hermes, or future Backlink Tasks to
Qwen. Do not touch its dirty worktree during this migration.

## Historical Model Assignments

Earlier Luna, Terra, Sol, or exact-version assignments are historical execution
recommendations or records. They may be retained where they describe completed
work, but they are not current governance and do not select executors for future
Tasks. Pending work is classified by Execution Profile before activation.

## Future Extension

An approved executor, provider, or model family may be added without redefining
Roles or changing the One Task = One Branch = One Worktree model. Record the
task-specific assignment and apply the same governance, credential, validation,
handoff, and review requirements.

## Machine Routing v1 (Inactive Bootstrap)

Machine routing is task execution metadata evaluated from an authorized
contract, never a permanent Role binding:

| Work classification | Approved Codex model |
| --- | --- |
| Codex-native work | GPT-5.6 Sol |
| Legacy Hermes complex reasoning/strategy/synthesis migrated to Codex | GPT-5.6 Terra |
| Legacy Hermes bounded bulk/extraction/repetitive work migrated to Codex | GPT-5.6 Luna |
| Explicitly authorized escalation | GPT-5.6 Sol |

An unavailable or out-of-policy model yields `BLOCKED`. There is no silent
cross-provider/model fallback. Historical executor metadata is immutable and a
migration must not make Hermes work appear to have been Codex work.

SYS-AUTO-001 is a manually supervised bootstrap only. Its strict Task Contract
records requested configuration but grants no authority. A controller-owned
Authorization Grant outside the worker worktree binds the complete contract
digest plus routing, model, sandbox, scope, permissions, activation and
publishing policy. A controller capability and current durable lease/fencing
token are required for privileged use of the selected route. Changing a bound
field requires a new Grant revision and invalidates incompatible review or
approval evidence. Live dispatch remains disabled until separate activation.
