# AGENTS.md — threethai-website 多 Agent 并行开发纪律

本仓库支持多个 AI agent（Codex / Claude / GLM 等）并行开发。
**main 是唯一真相源，受保护：只有合并管理员能推 main。** 所有并行 agent 只在自己的分支上工作。
开工前先读完本文件，再读你的任务卡 `tasks/<NN>-<slug>.md`。违反任何一条铁律，你的分支将被拒绝合并。

---

## 1. 分支模型

```
main（管理员独占，每次合并触发 Vercel 生产部署）
 ├── agent/meta-zh              ← Agent A（任务卡 tasks/01-meta-zh.md）
 ├── agent/inquiry-admin        ← Agent B（任务卡 tasks/02-inquiry-admin.md）
 └── agent/knowledge-expansion  ← Agent C（任务卡 tasks/03-knowledge-expansion.md）
```

- 每个 agent **只 push 自己的 `agent/<名字>` 分支**。
- 管理员按合并窗口串行合并：merge → 构建门禁 → push main → 通知全员 rebase。

## 2. 铁律（禁止事项）

1. **禁止 push / merge main**；禁止合并、rebase、push 别人的分支；禁止改动别人的任务卡和别人的 worklog。
2. **只允许修改任务卡「文件白名单」内列出的文件。** 白名单外一律不碰——多 agent 并行不冲突的第一道防线就是文件所有权分区。
3. **公共文件黑名单（任何任务都禁改）：**
   - `src/content/company.ts` —— localePath / siteUrl / htmlLang 等全站工具
   - `src/components/layout/site-header.tsx`、`site-footer.tsx` —— 全站导航（10 语言链接图）
   - `next.config.ts` —— 内含 60+ 条旧站 308 跳转图，动错一条 = SEO 事故
   - `middleware.ts`、`prisma/schema*.prisma`、`src/lib/inquiry.ts`（询盘主链路）
   - `package.json` / lock 文件 —— 依赖变更走任务卡「协调事项」，由管理员统一落 main
   - `.github/`、`vercel.json`、`.env*`、`.gitignore`、`AGENTS.md` 本身
4. 黑名单文件若必须变更：在任务卡「协调事项」段落写清楚（改什么、为什么、影响面），**停手等管理员处理**，不要自己动手。
5. 禁止在代码中硬编码任何密钥 / PAT / 密码；环境变量由管理员在 Vercel 后台配置。

## 3. 开工仪式（每次会话开始必做）

```bash
git fetch origin
git rebase origin/main          # 从最新 main 出发，杜绝旧起点
```

worktree 环境下若还没有 node_modules（节省磁盘与安装时间）：

```bash
# 把 node_modules 软链到主 checkout（兄弟目录示例）：
ln -s ../threethai-website/node_modules node_modules
# ⚠️ 需要新增/升级依赖时：先解除软链（rm node_modules && npm install）独立验证，
#    并把依赖变更写进任务卡「协调事项」。
```

## 4. 提交纪律

- 小步提交：一个逻辑单元一个 commit；前缀 `feat:` / `fix:` / `content:` / `chore:` / `seo:`。
- 每完成一个单元就 push 自己的分支：`git push origin agent/<名字>`（分支被 Vercel 自动 preview 部署，可在线验证）。
- 提交信息用英文或中文均可，但必须能看懂改了什么。
- **push 只推自己的分支** —— 这从物理上杜绝了「agent1 提交时发现 agent2 刚推了新版本导致 push 被拒」的问题：你的分支只有你一个人在推，永远不会和别人撞车。

## 5. 完成门禁（缺一不可，门禁不过禁止报告"完成"）

```bash
pkill -f "next start"; pkill -f "next-server"   # 清残留进程（否则构建产物污染）
rm -rf .next                                     # 必须干净重建
npm run lint && npm run build
npx next start -p <任务卡指定端口> &              # 端口见任务卡，禁用 3000/3001
# 按任务卡「验收清单」逐条 curl 验证（状态码 + 内容 rg 检查）
rg -l "__next_error__" .next/server/app 2>/dev/null   # 必须无输出（有输出 = 预渲染错误页，禁止交付）
```

## 6. 完成流程（防止版本不匹配的关键三步）

1. **同步最新 main：**
   ```bash
   git fetch origin && git rebase origin/main
   ```
   - 冲突落在**你白名单内**的文件 → 你自己解决，继续 rebase。
   - 冲突落在**白名单外**（别人动了你要依赖的文件）→ 停手：`git rebase --abort`，在任务卡「协调事项」记录冲突详情，报告管理员裁决。
2. **重跑第 5 节完整门禁**（rebase 之后代码变了，必须重新验证）。
3. **交付：**
   - `git push origin agent/<名字>`
   - 任务卡状态改为 `REVIEW`（tasks/README.md 看板同步更新）
   - 在 `worklog/agent-<名字>.md` 追加本次工作记录（格式见 `worklog/README.md`）

## 7. 工作日志

- 每个 agent 一个文件：`worklog/agent-<名字>.md`，**append-only**，禁止改别人已写入的内容。
- 仓库根的 `worklog.md` 是主会话（管理员）的历史归档，**agent 禁止写入**。

## 8. 环境约定

- 本地验证端口按任务卡分配（从 3101 起递增）；3000/3001 留给主 checkout 与 dev。
- 数据库：本地验证使用 worktree 内独立的 db 文件（已 gitignore），禁止触碰生产数据库连接串。
- 生产站点 https://www.threethai.com 由 main 分支驱动，agent 的一切验证都在本地端口或 Vercel preview URL 上进行。
