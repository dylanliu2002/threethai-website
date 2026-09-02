# Worklogs

Worklogs are durable, append-only task handoffs. A task may write a worklog only
when its card includes that path in the allowlist; do not create or edit another
task's log. The repository-root `worklog.md` is historical ORCHESTRATOR context
and must not be edited by Specialists.

Use one file per role/task stream, for example:

```text
worklog/agent-10-technical-seo.md
worklog/agent-11-seo-content.md
worklog/agent-12-geo-ai-search.md
worklog/agent-13-cro.md
worklog/agent-14-brand-ux.md
worklog/agent-15-qa-performance.md
worklog/agent-16-backlink.md
```

New entries are appended in this form:

```markdown
---
Task ID: <NN>
Role: <ROLE>
Task: <title>
Branch: <codex/NN-short-task-name>
Commit: <hash or not committed>

Work Log:
- <action and evidence>

Stage Summary:
- <result, decision, blocker, or handoff>
```
