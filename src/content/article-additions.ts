import type { ContentLocale } from "./company";
import type { ArticleBody } from "./article-blocks";
import { en as whatIsPvaEn } from "./article-what-is-pva-en";
import { zh as whatIsPvaZh } from "./article-what-is-pva-zh";
import { en as towelEn } from "./article-towel-manufacturing-en";
import { zh as towelZh } from "./article-towel-manufacturing-zh";
import { en as pvaKnittingEn } from "./article-water-soluble-pva-yarn-knitting-en";
import { zh as pvaKnittingZh } from "./article-water-soluble-pva-yarn-knitting-zh";
import { en as sewingThreadEn } from "./article-water-soluble-sewing-thread-guide-en";
import { zh as sewingThreadZh } from "./article-water-soluble-sewing-thread-guide-zh";
import { en as pvaDissolutionEn } from "./article-pva-dissolution-in-textile-processing-en";
import { zh as pvaDissolutionZh } from "./article-pva-dissolution-in-textile-processing-zh";
import { en as pvaSampleEn } from "./article-pva-sample-to-production-testing-en";
import { zh as pvaSampleZh } from "./article-pva-sample-to-production-testing-zh";
import { en as pvaSupplierEn } from "./article-how-to-evaluate-water-soluble-pva-supplier-en";
import { zh as pvaSupplierZh } from "./article-how-to-evaluate-water-soluble-pva-supplier-zh";

/**
 * Knowledge articles written for this site, as opposed to migrated from the legacy one.
 *
 * `legacy-source.ts` stays frozen as what it says it is — copy carried over from the
 * previous site — so new articles live here, and a reviewer can see at a glance which copy
 * is inherited and which is authored now. Bodies sit in one file per locale so that a single
 * edit never has to carry two long locales at once, and so the two can be read side by side
 * when checking block alignment (which `assertAlignedBody` enforces at build time).
 *
 * Fields are `{ en, zh }` only, matching what `articles.ts` builds for legacy entries.
 * Spanish and German are deliberately absent: article bodies are not promoted, `/es` and
 * `/de` resolve the English body through the seam, and supplying those would claim a review
 * that has not happened. The four-locale *card* strings for these slugs live in
 * `card-copy.ts`, which is a different mechanism with a different rule.
 *
 * The copy follows `docs/audits/resources-editorial-voice.md`. Figures used:
 *   four product forms and their selection variables ... legacy-source.ts products[]
 *   seven dissolution process targets ................. products[0].technicalOverview
 *   knitting routes in and the variables a knitwear trial settles ...... applications.ts knitting
 *   sewing-thread uses, selection variables, break-cause and OEM notes ... legacy-source.ts sewing-thread product
 *   where a sewing thread sits, why it is temporary, what to test ..... applications.ts embroidery-sewing
 *   40S/2 thread in the 20 °C group and PVA sewing thread in the 60 °C group ... catalog.ts
 *   OEKO-TEX Standard 100 Class I, raw white, 2027-01-31 ... quality.ts certificates[2]
 *   ISO 9001 scope, yarn production and fibre sales ....... quality.ts certificates[0]
 *   openwork single-jersey production device ......... patents.ts CN 218520715 U
 *   the dissolution variables, the read-more-than-disappearance sequence and the
 *     laboratory-to-production move .............. legacy-source.ts dissolution-guide article
 *   the trial record, the four observation endpoints and the sample-to-production
 *     validation move ........ legacy-source.ts products[0].processGuide + the answer
 *                              sample-order-process-pva-water-soluble-yarn
 *   the supplier-evaluation framework, its ten comparison areas and the
 *     no-public-price position ... quality.ts certificates[0][2][3], patents.ts granted
 *                                   devices and foreign registrations, /quality,
 *                                   /manufacturing and /request-sample
 */
export type NewArticleSpec = {
  category: Record<ContentLocale, string>;
  title: Record<ContentLocale, string>;
  metaDescription: Record<ContentLocale, string>;
  intro: Record<ContentLocale, string>;
  datePublished: string;
  dateModified: string;
  sections: Record<ContentLocale, ArticleBody>;
};

export const newKnowledgeArticles: Record<string, NewArticleSpec> = {
  "what-is-water-soluble-pva-yarn": {
    // Reuses an approved four-locale category label on purpose: it keeps the card strings
    // approved rather than newly authored, and it needs no new entry in either version of
    // the Resources grouping, because both key a shelf off the article's own category.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "What Is Water-Soluble PVA Yarn? A Practical Guide for Textile Buyers",
      zh: "什么是水溶性 PVA 纱线：面向纺织采购的实用指南",
    },
    metaDescription: {
      en: "What water-soluble PVA yarn is, why a mill puts a yarn in only to remove it later, the four forms it is supplied in, and the five answers to settle before requesting a sample.",
      zh: "水溶性 PVA 纱线是什么，工厂为什么要把一种纱放进去再去除，它供应的四种形态，以及索取样品前应当定下的五项信息。",
    },
    intro: {
      en: "Water-soluble PVA yarn is bought to do a job and then leave. This guide covers what it is, where mills use it, the four forms it is supplied in, and what to decide before asking for a sample.",
      zh: "水溶性 PVA 纱线是为了完成任务之后离开而采购的。本文说明它是什么、工厂在哪些环节使用、供应的四种形态，以及索取样品前需要先定下的内容。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: whatIsPvaEn, zh: whatIsPvaZh },
  },
  "water-soluble-pva-yarn-towel-manufacturing": {
    // Same approved category as the other two guides, so no grouping registry changes and the
    // two sit together under one heading on the hub.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "Water-Soluble PVA Yarn in Towel Manufacturing: How and Why It Is Used",
      zh: "水溶性 PVA 纱线在毛巾制造中的用法与原因",
    },
    metaDescription: {
      en: "Why a towel mill weaves in a water-soluble support yarn and then removes it: where it sits in the process, what to settle before a trial, how to judge removal on the towel, and the four mistakes that waste one.",
      zh: "毛巾厂为什么要在织造中加入水溶支撑纱再把它去除：它处在流程的哪个位置、试验前要定下什么、如何在毛巾上判断去除，以及四种会浪费掉一次试验的失误。",
    },
    intro: {
      en: "A zero-twist towel cannot hold its pile without support, and a permanent support yarn would ruin it. This is where a water-soluble yarn sits in the towel process, and how to run the trial that decides whether it works.",
      zh: "无捻毛巾没有支撑就拢不住绒头，而永久性支撑纱又会毁掉它。本文说明水溶纱在毛巾流程中的位置，以及如何做那一次决定成败的试验。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: towelEn, zh: towelZh },
  },
  "water-soluble-pva-yarn-knitting": {
    // Same approved category as the other guides, for the same reason: it is already approved
    // in all four locales and it needs no new entry in either version of the Resources grouping.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "Water-Soluble PVA Yarn in Knitting and Knitwear: How and Why It Is Used",
      zh: "水溶性 PVA 纱线在针织与针织成衣中的用法与原因",
    },
    metaDescription: {
      en: "Why a knit needs a yarn that leaves: the three routes a water-soluble PVA takes into a knitted fabric, where the support sits in a knitwear route, what to settle before a knitting trial, and what a failed trial is telling you.",
      zh: "针织物为什么需要一根会离开的纱：水溶性 PVA 进入针织物的三条路径、支撑在针织流程各段的位置、打样前要定下的内容，以及一次失败的打样说明了什么。",
    },
    intro: {
      en: "A knitted fabric or a plated structure can need support while it is being made, and that support has to be gone before the garment is worn. This is where a water-soluble PVA yarn sits in a knitwear route, the three ways it can enter a knit, and how to run the trial that decides whether it works.",
      zh: "针织面料或添纱结构在成形过程中可能需要支撑，而这份支撑必须在成衣被穿着之前消失。本文说明水溶性 PVA 纱线在针织流程中的位置、它进入针织物的三条路径，以及如何做那次决定成败的打样。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: pvaKnittingEn, zh: pvaKnittingZh },
  },
  "water-soluble-sewing-thread-guide": {
    // Same approved category as the other guides, for the same reason: already approved in all
    // four locales, and no new entry is needed in either version of the Resources grouping.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "Water-Soluble Sewing Thread: What It Is, How It Works and Where It Is Used",
      zh: "水溶性 PVA 缝纫线：是什么、怎么起作用、用在哪里",
    },
    metaDescription: {
      en: "What a water-soluble PVA sewing thread is, the three positions it holds in a sewing or embroidery line, why it can break while its tensile result looks fine, and what to settle before a first trial.",
      zh: "水溶性 PVA 缝纫线是什么、它在缝纫或刺绣工序中承担的三种位置、为什么拉伸结果合格它仍会断线，以及首次打样前要定下的内容。",
    },
    intro: {
      en: "A water-soluble sewing thread holds a seam through stitching and handling and then leaves in the finishing bath. This guide covers the three positions it holds, why a bench tensile result does not predict a break on the machine, and what to write down so the second trial costs less than the first.",
      zh: "水溶性 PVA 缝纫线在缝制与搬运中固定住一道缝线，随后在水洗工序里离开。本文说明它能承担的三种位置、为什么台面上的拉伸结果预测不了机器上的断线，以及该记下哪些内容才能让第二次打样比第一次更省事。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: sewingThreadEn, zh: sewingThreadZh },
  },
  "pva-dissolution-in-textile-processing": {
    // Same approved category as the other guides, for the same reason: already approved in all
    // four locales, and no new entry is needed in either version of the Resources grouping.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "What Determines How Water-Soluble PVA Dissolves in Real Textile Processing?",
      zh: "什么决定水溶性 PVA 在真实纺织加工中的溶解表现？",
    },
    metaDescription: {
      en: "The variables that decide a PVA removal result — temperature, time at temperature, water movement, access to the fibre, material quantity, construction, prior processing and grade — and a troubleshooting table of questions to investigate when a trial does not behave as expected.",
      zh: "决定 PVA 去除结果的各项变量——温度、在温时间、水的流动、纤维的可及性、材料用量、组织结构、前道加工与规格——以及试验不符合预期时值得逐一查证的排查表。",
    },
    intro: {
      en: "A removal result comes out of several variables acting at once, and temperature is only the first of them. This article works through each variable in turn, then gives a troubleshooting table of questions to investigate rather than asserted causes.",
      zh: "去除结果是几个变量同时作用的结果，温度只是其中第一个。本文依次说明各个变量，然后给出一张排查表——列的是值得查证的问题，而不是断言的成因。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: pvaDissolutionEn, zh: pvaDissolutionZh },
  },
  "pva-sample-to-production-testing": {
    // Same approved category as the other guides, for the same reason: already approved in all
    // four locales, and no new entry is needed in either version of the Resources grouping.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "From Sample to Production: How to Test Water-Soluble PVA in Your Textile Process",
      zh: "从样品到大货：如何在真实纺织工序中测试水溶性 PVA",
    },
    metaDescription: {
      en: "How to plan a PVA trial that survives scale-up: write the brief, pick a candidate grade, reproduce the process at a small scale, read the result through four observation endpoints rather than final disappearance, move one variable at a time, and validate on the production structure.",
      zh: "如何安排一次能经得起放大生产的 PVA 试做：写清需求、选定候选规格、在小规模上复现工序、按四个观察终点而不是只看是否消失来判断结果、每次只动一个变量，最后在大货结构上验证。",
    },
    intro: {
      en: "A sample that dissolves on the bench is a candidate, not an approval. This article sets out the trial that turns a sample into a production decision: the brief behind it, the two-candidate rule, the record that captures more than disappearance, and the single-variable move that makes the second trial cheaper than the first.",
      zh: "台面上能溶解的样品只是一个候选，不是批准。本文说明把样品变成生产决定的那次试做：它背后的需求说明、两选一的取规格方式、一份记的比“是否消失”更多的记录，以及那个让第二次试做比第一次更省的单一变量动作。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: pvaSampleEn, zh: pvaSampleZh },
  },
  "how-to-evaluate-water-soluble-pva-supplier": {
    // Same approved category as the other guides, for the same reason: already approved in all
    // four locales, and no new entry is needed in either version of the Resources grouping.
    category: { en: "Technical guide", zh: "技术指南" },
    title: {
      en: "How to Evaluate a Water-Soluble PVA Supplier Before Placing an Order",
      zh: "下订单前如何评估水溶性 PVA 供应商",
    },
    metaDescription: {
      en: "Ten areas to compare PVA suppliers on the same brief — specification clarity, batch consistency, product range, technical communication, sampling, quality documentation, manufacturing capability, commercial communication, packaging and repeat-order support — plus the questions to ask, and how Three Thai publishes its own answers.",
      zh: "用同一份需求说明比较 PVA 供应商的十个维度——规格清晰度、批次一致性、产品范围、技术沟通、打样、质量文件、制造能力、商务沟通、包装与物流、返单支持——以及应当提出的问题，和荣沣如何公开自己的回答。",
    },
    intro: {
      en: "A supplier is comparable only when every candidate was asked the same question. This guide sets out the ten areas to compare, the questions that separate a document from a claim, and how Three Thai answers each point from its own published record.",
      zh: "只有当每一家候选供应商都被问到同一个问题时，供应商之间才可比。本文给出应当比较的十个维度、能把一份文件与一个说法区分开的问题，以及荣沣如何用自己公开的记录回应每一点。",
    },
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    sections: { en: pvaSupplierEn, zh: pvaSupplierZh },
  },
};

/** Every body authored for this site, by slug — the set the content guards should walk. */
export const newArticleBodies: Record<string, Record<ContentLocale, ArticleBody>> =
  Object.fromEntries(
    Object.entries(newKnowledgeArticles).map(([slug, spec]) => [slug, spec.sections]),
  );
