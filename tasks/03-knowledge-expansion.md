# 03-knowledge-expansion：技术内容扩容（新增 2 篇技术文章 + 6 条买家解答，中英双语）

- **分支**：`codex/03-knowledge-expansion`（重启前须重新确认状态与 allowlist）
- **状态**：READY
- **本地端口**：3103
- **预计规模**：大（内容型）

## 1. 目标（What & Why）

Task 22 已把存量深度内容 100% 双语化（4 篇文章 / 31 条解答）。本任务在此基础上**扩容**：
新增 2 篇 knowledge 技术文章 + 6 条 answers 买家解答，全部**中英双语同步撰写**（zh 不是机器腔直译，
按 zh.ts / answers-zh.ts 的既有行文风格）。目标：为长尾搜索词铺量（如 water soluble yarn temperature、
PVA sizing 等选词参考旧站镜像与现有文章的关键词布局），同时保持站内内容质量一致性。

## 2. 背景与上下文

- 内容数据模型：`src/content/articles.ts`（Task 22 后为双语结构，zhPatches 模式）、
  `src/content/answers.ts` + `src/content/answers-zh.ts`（30 条双语 patch）、`src/content/answer-expanded.ts`。
  **开工先精读这四个文件，严格沿用现有类型签名与双语结构，不要发明新结构。**
- 渲染端（knowledge/answers 的 index、[slug]、answer-article）在 Task 22 已全部支持 per-locale，
  **本任务理论上不需要改任何渲染代码**；若发现渲染缺口，写「协调事项」，不要顺手改渲染层。
- 题材参照：`local-old-site-mirror/` 有旧站全部文章与产品页可挖选题；
  优先覆盖旧站有而新站没有的主题（补内容空洞 = 补 SEO）。
- 事实红线：技术参数（溶解温度、规格、纱支）必须与 `src/content/products.ts` 现有数据一致，禁止编造参数。

## 3. 文件白名单（只能改这些）

```
src/content/articles.ts           （新增 2 篇，双语）
src/content/answers.ts            （新增 6 条 slug 与 build 逻辑条目）
src/content/answers-zh.ts         （新增 6 条对应 zh patch）
src/content/answer-expanded.ts    （仅当新解答需要长文版时）
```

## 4. 本任务特别禁碰

- `src/content/i18n/**` —— Task 01（重启时为 `codex/01-meta-zh`）可能拥有词典文件
- `src/app/**` 全部渲染与路由文件（渲染缺口走「协调事项」）
- `src/content/products.ts`、`company.ts`

## 5. 验收清单

```bash
npx next start -p 3103 &
# 新文章 EN + zh 双语 200 且 zh 是中文
curl -s -o /dev/null -w "%{http_code}" http://localhost:3103/knowledge/<new-slug-1>          # 200
curl -s http://localhost:3103/zh/knowledge/<new-slug-1> | rg "<zh 文章标题片段>"              # 命中
curl -s http://localhost:3103/knowledge/<new-slug-2> -o /dev/null -w "%{http_code}"          # 200
# 新解答 EN + zh 双语 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3103/answers/<new-answer-slug-1>     # 200
curl -s http://localhost:3103/zh/answers/<new-answer-slug-1> | rg "<zh 解答片段>"            # 命中
# 索引页计数与列表包含新条目
curl -s http://localhost:3103/knowledge | rg "<new-slug-1>"
curl -s http://localhost:3103/answers | rg "<new-answer-slug-1>"
# sitemap 收录新 slug（hreflang 图诚实性）
curl -s http://localhost:3103/sitemap.xml | rg -c "<new-slug-1>"                             # ≥2（en+zh alternate）
# 全站回归：存量文章仍 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3103/knowledge/pva-yarn-dissolution-temperature-guide
```

- [ ] 2 篇新文章 EN/zh 全 200，zh 页为中文
- [ ] 6 条新解答 EN/zh 全 200，zh 页为中文
- [ ] 新 slug 全部进入 sitemap（en + zh alternate）
- [ ] 存量内容零回归（旧文章/旧解答抽查 200）
- [ ] 技术参数与 products.ts 一致（自查后在本框打钩）

## 6. 协调事项（跨任务变更在此登记，等管理员处理）

- （暂无）

## 7. 完成记录（REVIEW 时由 agent 填写）

- rebase 到的 main commit：
- 门禁结果（lint / build / __next_error__ 扫描）：
- worklog 记录：worklog/agent-knowledge-expansion.md
