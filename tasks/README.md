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
# 任务看板（管理员维护，agent 只改自己的行）

状态流：`READY → IN_PROGRESS → REVIEW → MERGED`

| 任务卡 | 分支 | 状态 | Owner | 本地端口 |
|---|---|---|---|---|
| tasks/01-meta-zh.md | agent/meta-zh | ON_HOLD（分支已撤，方案验证完毕待重启） | 待分配 | 3101 |
| tasks/02-inquiry-admin.md | agent/inquiry-admin | ON_HOLD（分支已撤，方案验证完毕待重启） | 待分配 | 3102 |
| tasks/03-knowledge-expansion.md | agent/knowledge-expansion | ON_HOLD（分支已撤，方案验证完毕待重启） | 待分配 | 3103 |

> 2026-09-02：owner 完成方案验证后暂停，agent/* 分支与 worktree 已全部撤除。
> 重启流程：按 README「新增任务流程」从最新 main 重建分支即可，任务卡无需改动。

## 管理员合并窗口记录（append-only）

| 日期 | 合并 | 结果 |
|---|---|---|
| （暂无） | | |

## 新增任务流程

1. 复制 `TEMPLATE.md` 为 `tasks/NN-<slug>.md`，填全目标 / 白名单 / 验收清单 / 端口。
2. 检查新任务卡的白名单与现有任务卡**互不重叠**（重叠 = 并行冲突源）。
3. 从最新 main 建分支并推送：
   ```bash
   git fetch origin
   git branch agent/<slug> origin/main
   git push origin agent/<slug>
   ```
4. 在本看板登记一行。
