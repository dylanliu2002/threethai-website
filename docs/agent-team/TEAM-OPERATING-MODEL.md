# Three Thai Optimization Operating Model

## Roles

| Role | Responsibility | Default Execution Profile | Escalate when |
| --- | --- | --- | --- |
| `ORCHESTRATOR` | Scope, dependencies, ownership, review, shared files, integration | `STRATEGIC_REASONING` | Cross-cutting architecture or risky integration needs deeper review |
| `TECHNICAL_SEO` | Crawl, index, metadata, canonical, hreflang, schema | `HIGH_RISK_CODE` | Route generation, redirects, or schema changes can affect indexing broadly |
| `SEO_CONTENT` | Keyword map, page intent, content gaps, internal-link plan | `RESEARCH` | A decision changes information architecture or factual positioning |
| `GEO_AI_SEARCH` | Answer extractability, evidence, entity consistency, citation readiness | `STRATEGIC_REASONING` | Evidence conflicts or cross-content architecture must be resolved |
| `CRO` | CTA hierarchy, journeys, forms, qualification, measurement plan | `STRATEGIC_REASONING` | Form/backend changes or analytics/privacy decisions are required |
| `BRAND_UX` | Positioning, information architecture, design consistency, copy quality | `STRATEGIC_REASONING` | Global theme/navigation or major redesign decisions are required |
| `QA_PERFORMANCE` | Static QA, a11y, regressions, runtime test plan, performance risks | `HIGH_RISK_CODE` | A production-only failure, complex profiling, or framework defect appears |
| `BACKLINK` | Authority, link research, opportunity validation, outreach governance | `RESEARCH` | External contact, unsupported claims, paid placement, or reputation risk appears |

Roles and profiles are durable governance. Executor Platform, Provider, and
Model Family are replaceable Task metadata. See `EXECUTION-POLICY.md`.

## Execution selection

- Select the Execution Profile from task risk and capability needs.
- Select an approved Executor Platform, Provider, and Model Family for the Task,
  not permanently for its Role.
- Split work only when each resulting Task has its own card, branch, worktree,
  allowlist, owner, dependencies, and review path.
- A platform or model change never broadens scope or file ownership.

## Execution phases

1. Parallel read-only audits (tasks 10–15).
2. ORCHESTRATOR synthesis and evidence review.
3. Dependency DAG and non-overlapping implementation task cards.
4. Parallel implementation in isolated branches/worktrees.
5. Independent QA and regression review.
6. ORCHESTRATOR integration, final build, user-approved publish or push.

## Concurrency policy

- Run only tasks with satisfied dependencies in parallel.
- Audit tasks may overlap because they are read-only.
- Implementation tasks must have non-overlapping file allowlists.
- Shared-file changes are serialized through the ORCHESTRATOR Role.
- QA reviews completed outputs and does not own product pages by default.

## Handoff contract

Every sibling Specialist worker records:

- outcome and scope;
- evidence or changed files;
- checks completed;
- unresolved risks and assumptions;
- shared-file coordination items;
- recommended dependent tasks;
- commit hash and verified author for implementation work.

Private executor chats are not handoffs. The Task Card, report, worklog, branch,
pull request, review record, Coordination Items, and Master Plan are the shared
coordination layer.

## Historical model recommendations

Previous Luna, Terra, and Sol allocation guidance described an earlier execution
recommendation. It is retained in Git history and in completed-task records where
it reflects actual work, but it is not current governance. Future Tasks use an
Execution Profile and a task-specific, replaceable execution assignment.

## Controller Boundary (Inactive Bootstrap)

The optional SYS-AUTO-001 controller owns deterministic authorization,
admission, legal state transitions, dependency/concurrency scheduling, leases,
path/shared/resource/Git locks, validation eligibility, review independence and
publishing gates. Codex workers retain reasoning and implementation judgment
inside the exact contract. The controller must not turn reasoning into a rigid
step-by-step state machine.

The pilot default is two workers. Disjoint task scopes may run concurrently;
overlapping paths and shared governance serialize. `CHANGES_REQUESTED` returns
to the same owner Role/branch/worktree for up to three correction cycles, then
blocks. `ON_HOLD` never dispatches. `APPROVED` permits only the closeout actions
listed by the contract and never implies merge, production or external action.

This operating model remains inactive until independent approval and separate
activation authorization. Existing Tasks are not automatically enrolled.
