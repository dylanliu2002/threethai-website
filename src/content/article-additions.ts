import type { ContentLocale } from "./company";
import type { ArticleBody } from "./article-blocks";
import { en as whatIsPvaEn } from "./article-what-is-pva-en";
import { zh as whatIsPvaZh } from "./article-what-is-pva-zh";
import { en as towelEn } from "./article-towel-manufacturing-en";
import { zh as towelZh } from "./article-towel-manufacturing-zh";

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
 *   OEKO-TEX Standard 100 Class I, raw white, 2027-01-31 ... quality.ts certificates[2]
 *   ISO 9001 scope, yarn production and fibre sales ....... quality.ts certificates[0]
 *   openwork single-jersey production device ......... patents.ts CN 218520715 U
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
};

/** Every body authored for this site, by slug — the set the content guards should walk. */
export const newArticleBodies: Record<string, Record<ContentLocale, ArticleBody>> =
  Object.fromEntries(
    Object.entries(newKnowledgeArticles).map(([slug, spec]) => [slug, spec.sections]),
  );
