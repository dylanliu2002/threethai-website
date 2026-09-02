# 02-inquiry-admin：询单管理后台（只读列表 + 认证保护）

- **分支**：`agent/inquiry-admin`
- **状态**：READY
- **本地端口**：3102
- **预计规模**：中

## 1. 目标（What & Why）

询盘数据目前只落在本地 db（`db/*.db`，SQLite，已 gitignore）里，业务方没有查看入口，
只能等邮件通知。本任务新增一个**受保护的管理页** `/admin/inquiries`：

- 列表展示：时间、参考号（RF-YYMMDD-XXXX 格式）、公司名、联系人、邮箱、国家、产品/页面来源、留言摘要；支持按时间倒序、简单分页（每页 50 条）。
- 认证：HTTP Basic Auth，凭据读环境变量 `ADMIN_USER` / `ADMIN_PASSWORD`（代码只读 `process.env`，**未配置时必须整体 404/401，绝不裸奔**）。
- 只读：本期不做删除/编辑/导出，降低风险。

## 2. 背景与上下文

- 表单主链路：`src/lib/inquiry.ts`（deliverInquiry，Task 22 已改 after() 异步发信）+ 询盘 API 路由（在 `src/app/api/` 下，先自行定位阅读，**只读不改**）。
- ORM：Prisma（`prisma/schema.postgres.prisma` 为 Vercel 生产用；本地 dev 用 SQLite schema）。
  **禁止改任何 schema 文件**——用现有模型写查询。若发现现有模型字段不满足列表需求，写进「协调事项」而不是自己改。
- 管理页不应被搜索引擎收录：用 robots meta + 不进 sitemap（`src/app/sitemap.ts` 禁改，新路由天然不在即可）。
- Vercel 生产环境没有 SQLite 文件——若生产 db 是 Postgres，查询代码必须兼容现有 Prisma client 的实际 datasource；不确定时在「协调事项」提问，不要猜测性重构。

## 3. 文件白名单（只能改这些）

```
src/app/admin/**                  （全新目录，含 layout.tsx / inquiries/page.tsx）
src/app/api/admin/**              （全新 API 路由，如需服务端分页查询）
src/components/admin/**           （全新组件目录）
src/lib/admin-auth.ts             （新建：Basic Auth 校验助手）
```

## 4. 本任务特别禁碰

- `src/lib/inquiry.ts`、`src/app/api/` 下既有询盘路由、`prisma/**`、`middleware.ts`
- `src/components/layout/**`（不要把 /admin 链接加进全站导航——管理页不暴露入口）
- `package.json`：预计不需要新依赖（Basic Auth 用 Node 原生 crypto/buffer 实现即可）；确需新依赖先写「协调事项」

## 5. 验收清单

```bash
npx next start -p 3102 &
# 未带凭据 → 拒绝（401 或 404，按你的实现，但绝不能 200）
curl -s -o /dev/null -w "%{http_code}" http://localhost:3102/admin/inquiries
# 带凭据 → 200 且出现列表关键字
curl -s -u "$ADMIN_USER:$ADMIN_PASSWORD" http://localhost:3102/admin/inquiries | rg -i "inquiries|RF-"
# API 直接访问同样受保护
curl -s -o /dev/null -w "%{http_code}" http://localhost:3102/api/admin/inquiries
# 管理页不被收录
curl -s http://localhost:3102/admin/inquiries | rg 'noindex'
curl -s http://localhost:3102/sitemap.xml | rg -c "admin"    # 期望 0
# 全站回归：表单提交链路不受影响（EN 首页/询盘页 200）
curl -s -o /dev/null -w "%{http_code}" http://localhost:3102/request-quote
```

- [ ] 未带凭据访问页面与 API 均被拒绝
- [ ] 带凭据可见询单列表（本地造 1-2 条测试数据验证）
- [ ] 管理页 noindex 且不在 sitemap
- [ ] 未配置 ADMIN_USER/ADMIN_PASSWORD 时整页 404/401（不抛异常堆栈）
- [ ] /request-quote 正常 200（主链路零回归）

## 6. 协调事项（跨任务变更在此登记，等管理员处理）

- （暂无）

## 7. 完成记录（REVIEW 时由 agent 填写）

- rebase 到的 main commit：
- 门禁结果（lint / build / __next_error__ 扫描）：
- worklog 记录：worklog/agent-inquiry-admin.md
