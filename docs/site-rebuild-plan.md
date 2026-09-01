# Site Rebuild Plan — 山东荣沣纺织有限公司 / Rongfeng Textile

Status: implementation plan for the multi-page rebuild of the current one-page-heavy website.

## 1. Current architecture

- vinext (Cloudflare Vite–Next) starter, Next.js-style App Router, TypeScript, Tailwind CSS 4, RSC.
- Routes: `/` (623-line client component containing the entire site), `/products/[slug]`, `/knowledge/[slug]`, `/answers`, `/answers/[slug]`, sitemap, robots.
- Content lives in `app/content.ts` (products, articles, 30 buyer answers), `app/answer-expanded-content.ts` (long-form answers), plus huge inline copy dictionaries in `page.tsx` (EN + ZH) and client-side locale overrides for 18 more languages.
- Internal LC workspace is promoted on the homepage (must be demoted).
- Homepage concentrates products, temperature catalog, applications, factory, certificates, knowledge, answers, FAQ, CTA → information overload, weak hierarchy.

## 2. Current problems

1. Homepage is the entire website; primary navigation is partly anchor-based.
2. No dedicated Products index, Applications, Manufacturing, Quality, About, Contact, or conversion pages.
3. Product detail pages are client-rendered duplicates of a shared template with limited structure.
4. Company identity strings scattered across files (荣沣 / Three Thai).
5. Temperature-selection experience is buried mid-homepage.
6. 18 client-side machine-partial translations add JS weight without SEO value.

## 3. Target information architecture

Main nav (real routes): Home · Products · Applications · Manufacturing · Quality · Resources · About · Contact
Primary CTA: Request a quote → `/request-quote`. Secondary: Request a sample → `/request-sample`.

### Route map (English, canonical at root — preserves every currently indexed URL)

| Route | Purpose |
|---|---|
| `/` | 8-section summary homepage |
| `/products` | Product index + temperature-based selection entry |
| `/products/{water-soluble-pva-yarn,water-soluble-pva-sewing-thread,pva-staple-fiber,pva-filament-yarn}` | Product detail (shared template) |
| `/applications` + `/applications/{towel-weaving,embroidery-sewing,knitting,papermaking,technical-textiles}` | Application discovery (names verified from existing content) |
| `/manufacturing` | Production base, process flow, equipment, capability |
| `/quality` | QC process, certificates (ISO 9001, OEKO-TEX, SGS, patents), verification guidance |
| `/knowledge` + `/knowledge/[slug]` (4) | Technical articles (URLs preserved) |
| `/answers` + `/answers/[slug]` (30) | Buyer answers (URLs preserved) |
| `/about` | Company profile, positioning, timeline |
| `/contact` | Contact + company information |
| `/request-quote`, `/request-sample` | Standalone conversion forms |
| `/product-finder` | Guided selection by form → application → dissolution temperature |

### Simplified Chinese

`/zh` + localized equivalents of: home, products index + 4 product pages, applications index + 5 pages, manufacturing, quality, about, contact, request-quote. Knowledge/answers remain English (existing English-market GEO content); their pages note English-only. hreflang pairs en↔zh where a zh equivalent exists.

## 4. Framework decision

Keep the Next.js App Router architecture; rebuild on standard Next.js 16 (drop `vinext`/`wrangler` deploy glue, which is hosting infrastructure, not site architecture). All existing route paths and content are migrated 1:1, so no indexed URL changes. TypeScript strict, Server Components by default, Client Components only for nav toggle, temperature finder, forms, gallery.

## 5. Component strategy

```
src/content/    company.ts, products.ts, applications.ts, articles.ts, answers.ts,
                factory.ts, quality.ts, catalog.ts, i18n/{en,zh}.ts   ← single source of truth
src/components/ layout/{site-header,site-footer,mobile-nav,breadcrumbs,language-switch}.tsx
                sections/* (homepage sections)
                product/*, application/*, forms/inquiry-form.tsx, quality/*, manufacturing/*
src/lib/        seo.ts (metadata + JSON-LD builders), inquiry.ts (validation + delivery boundary)
```

Page files compose sections; all business copy lives in typed content modules. Product/application pages are generated from one template each.

## 6. Branding decisions

- `content/company.ts` is the only place that names the company:
  - `nameLegalZh`: 山东荣沣纺织有限公司
  - `nameExportEn`: Shandong Three Thai Textile Co., Ltd. (overseas brand used by 荣沣 — verified from existing site)
  - `shortBrand`: Rongfeng Textile / Three Thai
- The public site primarily represents 山东荣沣纺织有限公司. **RESOLVED (Aug 2026 dossier)**: ISO 9001 cert 23226Q00380R101 and OEKO-TEX cert SH005 149658 are both issued to the same entity printed as 山东荣沣纺织有限公司 / SHANDONG THREE THAI TEXTILE CO., LTD. — the English name is the official legal name on certificates, not just a trading brand. Note: 山东惠民三泰纺织有限公司 (Shandong Huimin Santai Textile Co., Ltd., same address) is a separate related entity that co-owns several patents.
- Design tokens from logo: ink navy `#1a2151` (primary), amber `#f0a437` (accent), warm off-white surfaces, restrained radii, industrial typography.

## 7. Content migration plan

| Source (old) | Destination (new) |
|---|---|
| content.ts products (intro, applications, selection, technicalOverview, processGuide, FAQs) | content/products.ts → shared product template |
| Temperature catalog + 63 specs | content/catalog.ts → /products + /product-finder |
| Articles ×4 | content/articles.ts → /knowledge/[slug] (unchanged URLs) |
| Buyer answers ×30 + expanded long-form ×3 | content/answers.ts → /answers/[slug] (unchanged URLs) |
| Homepage EN/ZH copy (hero, products, applications, factory, trust, FAQ, contact) | content/i18n dictionaries + page sections |
| Factory stats & equipment | content/factory.ts → /manufacturing + homepage preview |
| Certificate images ×8 + labels | content/quality.ts → /quality gallery — **superseded Aug 2026**: legacy scans of ISO/OEKO were outdated (OEKO expired 2022) and replaced with current certificate previews + PDF originals |
| Product/factory/extended imagery | public/images (reused, optimized variants kept) |
| LC workspace | footer utility link only |

## 8. Known factual uncertainties (require owner confirmation — never invented)

1. ~~Official English legal name to pair with 山东荣沣纺织有限公司.~~ **RESOLVED**: certificates confirm Shandong Three Thai Textile Co., Ltd. (same entity, USCC 91371621MA3CH7D83K).
2. ~~Current validity of ISO 9001 / OEKO-TEX / SGS documents.~~ **RESOLVED (Aug 2026 dossier)**: ISO 9001:2015 cert 23226Q00380R101 by CFC, first issued 2023-08-09, reissued 2026-08-07, valid to 2029-08-06; OEKO-TEX Standard 100 cert SH005 149658, Class I (baby articles) Annex 6, scope "100% PVA water soluble yarn in raw white", valid to 2027-01-31, TESTEX report SH005 275198.1 all parameters passed; SGS report SL22002263585101TX dated 2020-06-19 (point-in-time report, unchanged).
3. Current production capacity/spindles/employees (figures reproduced from the existing site, dated).
4. MOQ, lead times, prices — intentionally not stated; handled via inquiry.
5. Exact export-market list (existing claim "15+ markets" reused verbatim).

## 8a. Verified patent portfolio (Aug 2026 dossier)

- 9 granted Chinese invention patents where 荣沣 is owner or co-owner (3 granted directly to 荣沣; 6 solely/jointly co-owned with 山东惠民三泰纺织有限公司, 5 of them acquired by recorded CNIPA transfers published May–Jun 2025).
- 25 granted utility models, all registered solely to 山东荣沣纺织有限公司 (full list in content/patents.ts, rendered on /quality).
- 2 foreign patents: Nigeria RP: F/PT/C/O/2026/21316 (broken-end detection / automatic feed stopping, priority CN 20251132549.7) and Malta No. 5964 (dust purification for water-soluble yarn processing, priority CN 2025109190368).
- Pending application 202411066795.6 (antibacterial composite fabric) exists but is NOT counted — only granted patents are claimed.
- ⚠️ Audit note: the dossier also contained certificates for patents granted to OTHER entities (深圳腾悦 / 安徽恒硕 / 李程、杨俊) — these were later transferred to 荣沣+三泰 per CNIPA records; the grant-time certificates alone must never be presented without the transfer records.

## 9. Implementation phases

1. ✅ Audit + this plan
2. Design tokens, fonts, layout, header/footer, images
3. Homepage (8 sections)
4. Products index + 4 detail pages
5. Applications index + 5 pages
6. Manufacturing / Quality / About
7. Knowledge + Answers
8. Contact / quote / sample forms (+ Prisma inquiry store, honeypot, server validation)
9. Product finder
10. /zh localized routes + hreflang
11. SEO: metadata, JSON-LD, sitemap, robots
12. Validation: lint, tsc, browser QA (desktop + mobile), fixes

## 11. Brand & language updates (Sept 2026 owner directives)

- **Naming (owner-confirmed)**: all English-facing references use **Three Thai / Shandong Three Thai Textile Co., Ltd.** — no "Rongfeng" in English copy. Chinese legal name 山东荣沣纺织有限公司 retained for legal contexts. Product brand: **threethai™**.
- **Trademark**: uploaded THREE THAI logo (white→transparent PNG) replaces the text wordmark in the header; footer uses THREE THAI™ text mark + legal name. Hero image replaced with the owner-supplied brand banner (1200×630, also used as og.jpg).
- **Languages**: site now serves 10 UI locales — en (root), zh (/zh), es, pt, ru, ar (RTL), tr, vi, id, de (each under /{lang}).
  - UI chrome (nav, homepage, forms, footers, page titles) is translated for all ten.
  - Deep content (product details, articles, 30 buyer answers) renders in English on the eight fallback locales — standard B2B partial-localization pattern; zh mirrors deep content fully.
  - Architecture: `ContentLocale (en|zh)` for content records vs `Locale (10)` for UI; `getDictionary()` deep-merges EN base with per-locale partials (`src/content/i18n/{es,pt,ru,ar,tr,vi,id,de}.ts`).
  - Routing: dynamic `app/[lang]/*` tree (generateStaticParams over 8 locales) mirrors the full EN route set; hreflang graph auto-generated for all 10 + x-default in buildMetadata and sitemap alternates.
