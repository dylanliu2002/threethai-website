# [NN]-<slug>：<一句话标题>

- **分支**：`agent/<slug>`
- **状态**：READY
- **本地端口**：310N
- **预计规模**：小 / 中 / 大

## 1. 目标（What & Why）

<描述要做什么、解决什么问题、对站点有什么价值。3-6 句。>

## 2. 背景与上下文

<相关历史任务、涉及文件现状、旧站参照（local-old-site-mirror/）等。agent 开工前必读。>

## 3. 文件白名单（只能改这些）

```
src/...
```

## 4. 禁碰文件（黑名单见根目录 AGENTS.md 第 2 节，此外本任务特别禁碰）

<列出与本任务相邻但禁止修改的文件，防止 agent "顺手优化" 引发并行冲突。>

## 5. 验收清单（完成门禁之外，逐条 curl/rg 验证并在方框打钩）

```bash
npx next start -p 310N &
curl -s -o /dev/null -w "%{http_code}" http://localhost:310N/<path>   # 期望 200
curl -s http://localhost:310N/<path> | rg "<期望内容>"                 # 期望命中
```

- [ ]
- [ ]

## 6. 协调事项（跨任务变更在此登记，等管理员处理）

- （暂无）

## 7. 完成记录（REVIEW 时由 agent 填写）

- rebase 到的 main commit：
- 门禁结果（lint / build / __next_error__ 扫描）：
- worklog 记录：worklog/agent-<slug>.md
