# 01-meta-zh：非英文页 meta title/description 中文化精修 + EN 认证名清理

- **分支**：`agent/meta-zh`
- **状态**：READY
- **本地端口**：3101
- **预计规模**：中

## 1. 目标（What & Why）

Task 21/22 之后，`/zh/*` 页面正文已是中文，但 `<title>` 与 `meta description` 仍是英文回退
（worklog Task 21 遗留项：「[lang] 页 meta title/description 仍为 EN 回退（含 zh knowledge），后续可用 zh 词典 meta 精修」）。
本任务让 zh（以及 es/ru 等其他 dynamicLocales 若词典有现成文案则顺带，无现成文案则保持 EN 回退不新造）
页面的 SERP 展示与页面语言一致——这直接影响中文搜索结果的点击率。

附带遗留项：EN 版「认证与荣誉」区块的认证名带中文括号后缀（如 `High-Tech Enterprise (国家高新技术企业)`），
这是 Task 22 之前中英混杂时代的残留，外贸站 EN 视图应展示纯英文认证名；
zh 视图保持纯中文（zh.ts 词典 recognition 段已是中文，无需动）。

## 2. 背景与上下文

- 路由架构：`src/app/(site)/` 服务 EN 根路径；`src/app/[lang]/` 用各语言词典渲染 dynamicLocales（zh/es/pt/ru/ar/tr/vi/id/de）；`src/app/zh/` 静态页优先级更高。
- UI 词典：`src/content/i18n/zh.ts` / `en.ts`（Task 22 已含 answersIndex 等键）。
- meta 生成：`src/lib/seo.tsx` 的 `buildMetadata`（内含 clampMetaDescription ≤158 钳制，勿破坏）；
  `(site)/answers/[slug]/page.tsx` 是唯一绕过 buildMetadata 的页面（Task 15 记录）。
- 验证姿势：`rm -rf .next` 干净重建（残留进程会产生 `__next_error__` 假象，见 AGENTS.md 第 5 节）。

## 3. 文件白名单（只能改这些）

```
src/content/i18n/zh.ts
src/content/i18n/en.ts            （仅当需要为 meta 增加对称键时）
src/app/[lang]/layout.tsx         （仅 metadata/generateMetadata 相关行）
src/app/[lang]/**/page.tsx        （仅 generateMetadata/metadata 相关行）
src/app/zh/**/page.tsx            （静态 zh 页的 metadata，仅中文文案）
src/lib/seo.tsx                   （仅当 meta 键取词逻辑需扩展时；clampMetaDescription 逻辑禁改）
```

## 4. 本任务特别禁碰

- `src/content/company.ts`、`src/app/(site)/**` 的正文渲染、`next.config.ts`
- `src/content/articles.ts`、`answers*.ts`、`products.ts` —— agent/knowledge-expansion 正在并行编辑这些文件

## 5. 验收清单

```bash
npx next start -p 3101 &
# zh 页面 title/description 为中文（抽查 8 条）
curl -s http://localhost:3101/zh | rg -o '<title>[^<]*</title>'            # 期望中文标题
curl -s http://localhost:3101/zh/knowledge | rg 'name="description"'       # 期望中文描述
curl -s http://localhost:3101/zh/products | rg -o '<title>[^<]*</title>'
curl -s http://localhost:3101/zh/products/water-soluble-pva-yarn | rg 'name="description"'
curl -s http://localhost:3101/zh/about | rg -o '<title>[^<]*</title>'
curl -s http://localhost:3101/zh/quality | rg 'name="description"'
curl -s http://localhost:3101/zh/answers | rg -o '<title>[^<]*</title>'
curl -s http://localhost:3101/zh/contact | rg 'name="description"'
# EN 回归：英文页 meta 必须与改前一致
curl -s http://localhost:3101/products | rg -o '<title>[^<]*</title>'
# EN 认证名：/quality 不再出现中文括号后缀
curl -s http://localhost:3101/quality | rg '国家高新技术企业' -c            # EN 页期望 0 次（zh 页除外）
# description 长度钳制未被破坏（≤160）
curl -s http://localhost:3101/zh/about | rg -o 'name="description" content="[^"]*"' | awk -F'content="' '{print length($2)}'
```

- [ ] zh 抽查 8 条 title/description 全中文
- [ ] EN 页 meta 零回归
- [ ] EN /quality 认证名纯英文；zh /quality 认证名纯中文
- [ ] 所有 description ≤160 字符
- [ ] sitemap.xml / hreflang 未受影响

## 6. 协调事项（跨任务变更在此登记，等管理员处理）

- （暂无）

## 7. 完成记录（REVIEW 时由 agent 填写）

- rebase 到的 main commit：
- 门禁结果（lint / build / __next_error__ 扫描）：
- worklog 记录：worklog/agent-meta-zh.md
