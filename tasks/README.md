# Agent Task Board

## Operating model

The program uses one orchestrator and six specialist agents. Work is organized
around deliverables and dependencies, not broad page ownership.

The first phase is a read-only parallel audit:

| Task | Specialist | Model | Reasoning | Deliverable |
| --- | --- | --- | --- | --- |
| 10 | Technical SEO | `gpt-5.6-sol` | high | `docs/audits/10-technical-seo.md` |
| 11 | SEO Content | `gpt-5.6-luna` | high | `docs/audits/11-keyword-strategy.md` |
| 12 | GEO / AI Search | `gpt-5.6-terra` | high | `docs/audits/12-geo-ai-search.md` |
| 13 | CRO / Lead Generation | `gpt-5.6-luna` | high | `docs/audits/13-cro.md` |
| 14 | Brand / UX | `gpt-5.6-terra` | high | `docs/audits/14-brand-ux.md` |
| 15 | QA / Performance | `gpt-5.6-luna` | high | `docs/audits/15-qa-performance.md` |

The orchestrator writes the deliverable files from the agents' returned reports.
Audit agents must not edit the repository.

## Status

- `10-technical-seo-audit.md`: COMPLETE
- `11-keyword-strategy.md`: COMPLETE
- `12-geo-audit.md`: COMPLETE
- `13-cro-audit.md`: COMPLETE
- `14-brand-audit.md`: COMPLETE
- `15-performance-audit.md`: COMPLETE

The reports are stored in `docs/audits/`. The orchestrator synthesis is in
`docs/agent-team/MASTER-OPTIMIZATION-PLAN.md`; the implementation DAG and model
allocation are in `IMPLEMENTATION-BACKLOG.md`.
