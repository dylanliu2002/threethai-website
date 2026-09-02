# worklog/ — 多 Agent 工作日志目录

每个 agent 一个文件：`worklog/agent-<分支名 slug>.md`，**append-only**。

- 禁止写入别人已追加的内容；禁止改历史段落。
- 仓库根的 `worklog.md` 是管理员（主会话）的历史归档，agent 禁止写。

## 文件格式（沿用仓库既有 worklog 格式）

```markdown
---
Task ID: <任务卡编号，如 01 / 02>
Agent: <你的名字，如 codex-agent-1>
Task: <任务卡标题>

Work Log:
- <具体步骤 1>
- <具体步骤 2>

Stage Summary:
- <关键结果 / 重要决策 / 产出物>
- <遇到的问题与解决方式>
```

## 现有文件

- `agent-meta-zh.md` —— Task 01（meta-zh）日志
- `agent-inquiry-admin.md` —— Task 02（inquiry-admin）日志
- `agent-knowledge-expansion.md` —— Task 03（knowledge-expansion）日志
