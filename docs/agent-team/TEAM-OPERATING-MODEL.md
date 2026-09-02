# Three Thai Optimization Agent Team

## Team

| Agent | Responsibility | Default model | Escalate when |
| --- | --- | --- | --- |
| 0 — Orchestrator | Scope, dependencies, ownership, review, shared files, integration | Current primary model | Cross-cutting architecture or risky integration needs deeper review |
| 1 — Technical SEO | Crawl, index, metadata, canonical, hreflang, schema | `gpt-5.6-sol` high | Route generation, redirects, or schema changes can affect indexing broadly |
| 2 — SEO Content | Keyword map, page intent, content gaps, internal-link plan | `gpt-5.6-luna` high | A decision changes information architecture or factual positioning |
| 3 — GEO / AI Search | Answer extractability, evidence, entity consistency, citation readiness | `gpt-5.6-terra` high | Evidence conflicts or cross-content architecture must be resolved |
| 4 — CRO | CTA hierarchy, journeys, forms, qualification, measurement plan | `gpt-5.6-luna` high | Form/backend changes or analytics/privacy decisions are required |
| 5 — Brand / UX | Positioning, information architecture, design consistency, copy quality | `gpt-5.6-terra` high | Global theme/navigation or major redesign decisions are required |
| 6 — QA / Performance | Static QA, a11y, regressions, runtime test plan, performance risks | `gpt-5.6-luna` high | A production-only failure, complex profiling, or framework defect appears |

## Model allocation policy

Use Luna by default for bounded, mechanically verifiable work:

- inventory and classification;
- copy consistency checks;
- route, link, metadata, and test-matrix enumeration;
- localized-content comparison;
- narrow component edits with explicit acceptance criteria;
- lint/build/test follow-up and regression verification.

Use Terra when the task mixes code and product judgment:

- UX and information architecture;
- answer architecture and GEO patterns;
- multi-component feature work;
- ambiguous requirements with several viable implementations.

Use Sol for high-risk or deeply technical work:

- routing, canonical, hreflang, redirects, and indexing behavior;
- schema or metadata systems with site-wide consequences;
- shared architecture, data flow, forms, persistence, and integration review;
- final conflict resolution and release gating.

Do not keep a stronger model on a task once the remaining work is mechanical.
Split the task and hand the bounded remainder to Luna.

## Execution phases

1. Parallel read-only audits (tasks 10–15).
2. Orchestrator synthesis and evidence review.
3. Dependency DAG and non-overlapping implementation task cards.
4. Parallel implementation in isolated branches/worktrees.
5. Independent QA and regression review.
6. Orchestrator integration, final build, user-approved publish or push.

## Concurrency policy

- Run only tasks with satisfied dependencies in parallel.
- Audit tasks may overlap because they are read-only.
- Implementation tasks must have non-overlapping file allowlists.
- Shared-file changes are serialized through Agent 0.
- QA reviews completed outputs and does not own product pages by default.

## Handoff contract

Every agent reports:

- outcome and scope;
- evidence or changed files;
- checks completed;
- unresolved risks and assumptions;
- shared-file coordination items;
- recommended dependent tasks;
- commit hash and verified author for implementation work.
