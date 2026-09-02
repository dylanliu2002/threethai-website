# Implementation Backlog and Model Allocation

Each row is a task-card summary. Before activation, Agent 0 copies the row into a
standalone card with the exact final allowlist and confirms it does not overlap
another active implementation task.

Statuses: `READY`, `COMPLETE`, `BLOCKED-D1`, `BLOCKED-D2`, `BLOCKED-D3`,
`BLOCKED-D4`, `DEPENDS`, `REVIEW`.

| ID | Priority | Task | Status | Model | Depends on | Initial ownership / acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | P1 | Fix field-level error messages and error-state semantics | COMPLETE | Luna high | — | `inquiry-form.tsx`; real messages are announced and persistence errors are distinct |
| 21 | P1 | Preserve Finder locale and all qualification context | COMPLETE | Luna high | 20 | `product-finder.tsx`, then coordinated form query parsing; locale-safe encoded handoff |
| 22 | P1 | Make quote-page Finder panel actionable | COMPLETE | Luna medium | — | quote route templates only; correct locale-safe Finder link |
| 23 | P2 | Normalize localized navigation active state | COMPLETE | Luna medium | — | header shared file via Agent 0; correct `aria-current` on all prefixes |
| 24 | P2 | Fix missing schema image and metadata parity | COMPLETE | Luna high | — | SEO helper plus answer metadata, serialized; all referenced assets exist |
| 25 | P1 | Restore accessible light-surface accent contrast | COMPLETE | Luna high | — | global CSS via Agent 0; normal text reaches WCAG AA without breaking dark surfaces |
| 26 | P2 | Add mobile-menu focus and modal behavior | COMPLETE | Terra high | 23 | header shared file; focus transfer/return, Escape, background isolation |
| 27 | P1 | Audit and remove `ignoreBuildErrors` safely | COMPLETE | Sol high | — | Next config via Agent 0; explicit typecheck and production build pass |
| 28 | P2 | Add route/metadata parity test scaffold | COMPLETE | Luna high | — | new test files/scripts; no source overlap; covers three route trees |
| 29 | P1 | Model translated-content availability | BLOCKED-D1 | Sol high | D1 | company/locale model via Agent 0; one source of truth for UI vs content availability |
| 30 | P1 | Make document `<html lang>` and RTL route-aware | BLOCKED-D1 | Sol high | 29 | root/locale layouts; correct document element across 10 locales |
| 31 | P1 | Refactor canonical and hreflang generation | BLOCKED-D1 | Sol high | 29 | SEO helper; reciprocal equivalents only, caller mistakes removed |
| 32 | P1 | Rebuild multilingual sitemap policy | DEPENDS | Sol high | 31 | sitemap only; every indexable URL represented consistently |
| 33 | P2 | Consolidate localized schema entity URLs and `@id` links | DEPENDS | Sol high | 31 | SEO helper/page schema; locale-aware URL, `inLanguage`, entity consolidation |
| 34 | P2 | Normalize locale-safe internal links site-wide | BLOCKED-D1 | Luna high | 29 | bounded components assigned in non-overlapping batches; no locale leakage |
| 35 | P1 | Build claim inventory and evidence status map | BLOCKED-D2 | Luna high | D2 | new docs/content registry; every high-visibility claim classified |
| 36 | P1 | Create versioned evidence registry and scope guards | DEPENDS | Terra high | 35 | new content model plus Quality integration; issuer/scope/date/approval tracked |
| 37 | P1 | Resolve product-range contradictions | BLOCKED-D2 | Terra high | D2, 35 | product/legacy content; one verified offering statement and schema outcome |
| 38 | P1 | Define keyword and page-intent ownership | COMPLETE | Luna high | audits | new strategy data/doc; one primary URL per cluster, no invented volume |
| 39 | P2 | Implement contextual related-content matrix | DEPENDS | Luna high | 38 | product/application/answer mappings; relevance replaces generic first-items logic |
| 40 | P1 | Add author/reviewer/evidence metadata to content model | DEPENDS | Terra high | 36 | answer/article models and views; visible scope, reviewer, review date, sources |
| 41 | P2 | Expand ten priority buyer answers | DEPENDS | Luna high | 36, 38, 40 | assigned answer subsets; distinct intent, evidence, CTA, no new unsupported claims |
| 42 | P2 | Add product-specific specifications and catalog applicability | BLOCKED-D2 | Terra high | D2, 36 | product/catalog content and product view; only verified rows per product |
| 43 | P1 | Approve and apply brand/entity taxonomy | BLOCKED-D3 | Terra high | D3 | company/shared copy then bounded page batches; consistent identity and proof language |
| 44 | P2 | Refine CTA hierarchy and navigation IA | BLOCKED-D3/D4 | Terra high | D3, D4, 43 | header/home/page CTAs serialized; sample/quote paths match buyer risk |
| 45 | P1 | Improve inquiry notification reliability and operational alerts | BLOCKED-D4 | Sol high | D4 | inquiry backend/shared config; no silent notification skip without an owned fallback |
| 46 | P2 | Add privacy-approved conversion analytics | BLOCKED-D4 | Terra high | D4 | new analytics module plus Agent 0 bootstrap; no PII events |
| 47 | P1 | Integrated browser, a11y, performance, and release gate | REVIEW | Luna high + Sol final | 20–46 applicable | independent test evidence; 390/768/1440/1920, locales, forms, CWV, build, author gate |

## Parallel-safe first wave

After Agent 0 creates isolated worktrees/cards, these can run concurrently because
their initial file ownership is separate:

- Task 20 — form error semantics (Luna).
- Task 22 — quote-page Finder action (Luna).
- Task 25 — contrast token analysis/patch through Agent 0 (Luna reviewer).
- Task 27 — build/type gate diagnosis (Sol; config integration by Agent 0).
- Task 28 — new parity tests (Luna).
- Task 38 — intent ownership data/document (Luna).

Tasks 23 and 26 share the header and must be serialized or combined. Tasks 24,
31, and 33 share the SEO helper and must be serialized. Tasks 20 and 21 touch the
form and should be ordered unless Task 21 is restricted to Finder-only output.

## User-decision gate

The safest next authorization is to confirm D1–D4, then let Agent 0 activate only
the unblocked first wave while preserving the current working site.
