# Implementation Backlog and Execution Profiles

Each row is a task-card summary. Before activation, the ORCHESTRATOR creates a
standalone card with the exact final allowlist and confirms it does not overlap
another active implementation task.

Execution Profile is durable, platform-agnostic task metadata. Historical
Executor / Model values are retained only for completed work where the earlier
plan recorded them; they do not bind future Tasks, Roles, or executors. Pending
Tasks receive task-specific Executor Platform, Provider, and Model Family
metadata in their cards before activation.

Statuses: `READY`, `COMPLETE`, `BLOCKED-D1`, `BLOCKED-D2`, `BLOCKED-D3`,
`BLOCKED-D4`, `DEPENDS`, `REVIEW`.

| ID | Priority | Task | Status | Execution Profile | Historical Executor / Model | Depends on | Initial ownership / acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | P1 | Fix field-level error messages and error-state semantics | COMPLETE | HIGH_RISK_CODE | Luna high | — | `inquiry-form.tsx`; real messages are announced and persistence errors are distinct |
| 21 | P1 | Preserve Finder locale and all qualification context | COMPLETE | HIGH_RISK_CODE | Luna high | 20 | `product-finder.tsx`, then coordinated form query parsing; locale-safe encoded handoff |
| 22 | P1 | Make quote-page Finder panel actionable | COMPLETE | HIGH_RISK_CODE | Luna medium | — | quote route templates only; correct locale-safe Finder link |
| 23 | P2 | Normalize localized navigation active state | COMPLETE | HIGH_RISK_CODE | Luna medium | — | header shared file via ORCHESTRATOR; correct `aria-current` on all prefixes |
| 24 | P2 | Fix missing schema image and metadata parity | COMPLETE | HIGH_RISK_CODE | Luna high | — | SEO helper plus answer metadata, serialized; all referenced assets exist |
| 25 | P1 | Restore accessible light-surface accent contrast | COMPLETE | HIGH_RISK_CODE | Luna high | — | global CSS via ORCHESTRATOR; normal text reaches WCAG AA without breaking dark surfaces |
| 26 | P2 | Add mobile-menu focus and modal behavior | COMPLETE | HIGH_RISK_CODE | Terra high | 23 | header shared file; focus transfer/return, Escape, background isolation |
| 27 | P1 | Audit and remove `ignoreBuildErrors` safely | COMPLETE | HIGH_RISK_CODE | Sol high | — | Next config via ORCHESTRATOR; explicit typecheck and production build pass |
| 28 | P2 | Add route/metadata parity test scaffold | COMPLETE | HIGH_RISK_CODE | Luna high | — | new test files/scripts; no source overlap; covers three route trees |
| 29 | P1 | Model translated-content availability | BLOCKED-D1 | HIGH_RISK_CODE | — | D1 | company/locale model via ORCHESTRATOR; one source of truth for UI vs content availability |
| 30 | P1 | Make document `<html lang>` and RTL route-aware | BLOCKED-D1 | HIGH_RISK_CODE | — | 29 | root/locale layouts; correct document element across 10 locales |
| 31 | P1 | Refactor canonical and hreflang generation | BLOCKED-D1 | HIGH_RISK_CODE | — | 29 | SEO helper; reciprocal equivalents only, caller mistakes removed |
| 32 | P1 | Rebuild multilingual sitemap policy | DEPENDS | HIGH_RISK_CODE | — | 31 | sitemap only; every indexable URL represented consistently |
| 33 | P2 | Consolidate localized schema entity URLs and `@id` links | DEPENDS | HIGH_RISK_CODE | — | 31 | SEO helper/page schema; locale-aware URL, `inLanguage`, entity consolidation |
| 34 | P2 | Normalize locale-safe internal links site-wide | BLOCKED-D1 | HIGH_RISK_CODE | — | 29 | bounded components assigned in non-overlapping batches; no locale leakage |
| 35 | P1 | Build claim inventory and evidence status map | BLOCKED-D2 | RESEARCH | — | D2 | new docs/content registry; every high-visibility claim classified |
| 36 | P1 | Create versioned evidence registry and scope guards | DEPENDS | STRATEGIC_REASONING | — | 35 | new content model plus Quality integration; issuer/scope/date/approval tracked |
| 37 | P1 | Resolve product-range contradictions | BLOCKED-D2 | STRATEGIC_REASONING | — | D2, 35 | product/legacy content; one verified offering statement and schema outcome |
| 38 | P1 | Define keyword and page-intent ownership | COMPLETE | RESEARCH | Luna high | audits | new strategy data/doc; one primary URL per cluster, no invented volume |
| 39 | P2 | Implement contextual related-content matrix | DEPENDS | STRATEGIC_REASONING | — | 38 | product/application/answer mappings; relevance replaces generic first-items logic |
| 40 | P1 | Add author/reviewer/evidence metadata to content model | DEPENDS | STRATEGIC_REASONING | — | 36 | answer/article models and views; visible scope, reviewer, review date, sources |
| 41 | P2 | Expand ten priority buyer answers | DEPENDS | RESEARCH | — | 36, 38, 40 | assigned answer subsets; distinct intent, evidence, CTA, no new unsupported claims |
| 42 | P2 | Add product-specific specifications and catalog applicability | BLOCKED-D2 | RESEARCH | — | D2, 36 | product/catalog content and product view; only verified rows per product |
| 43 | P1 | Approve and apply brand/entity taxonomy | BLOCKED-D3 | STRATEGIC_REASONING | — | D3 | company/shared copy then bounded page batches; consistent identity and proof language |
| 44 | P2 | Refine CTA hierarchy and navigation IA | BLOCKED-D3/D4 | STRATEGIC_REASONING | — | D3, D4, 43 | header/home/page CTAs serialized; sample/quote paths match buyer risk |
| 45 | P1 | Improve inquiry notification reliability and operational alerts | BLOCKED-D4 | HIGH_RISK_CODE | — | D4 | inquiry backend/shared config; no silent notification skip without an owned fallback |
| 46 | P2 | Add privacy-approved conversion analytics | BLOCKED-D4 | HIGH_RISK_CODE | — | D4 | new analytics module plus ORCHESTRATOR bootstrap; no PII events |
| 47 | P1 | Integrated browser, a11y, performance, and release gate | REVIEW | HIGH_RISK_CODE | — | 20–46 applicable | independent test evidence; 390/768/1440/1920, locales, forms, CWV, build, author gate |

## Historical parallel-safe first wave

The first-wave execution notes below are historical and do not select models for
future work:

- Task 20 — form error semantics (Luna).
- Task 22 — quote-page Finder action (Luna).
- Task 25 — contrast token analysis/patch through the ORCHESTRATOR (Luna reviewer).
- Task 27 — build/type gate diagnosis (Sol; shared-file integration by ORCHESTRATOR).
- Task 28 — new parity tests (Luna).
- Task 38 — intent ownership data/document (Luna).

Tasks 23 and 26 share the header and must be serialized or combined. Tasks 24,
31, and 33 share the SEO helper and must be serialized. Tasks 20 and 21 touch the
form and should be ordered unless Task 21 is restricted to Finder-only output.

## User-decision gate

The safest next authorization is to confirm D1–D4, then let the ORCHESTRATOR
activate only the unblocked work while preserving the current working site.
