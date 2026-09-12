import type { ContentLocale } from "./company";
import type { ArticleBody } from "./article-blocks";
import { en as whatIsPvaEn } from "./article-what-is-pva-en";
import { zh as whatIsPvaZh } from "./article-what-is-pva-zh";

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
};

/** Every body authored for this site, by slug — the set the content guards should walk. */
export const newArticleBodies: Record<string, Record<ContentLocale, ArticleBody>> =
  Object.fromEntries(
    Object.entries(newKnowledgeArticles).map(([slug, spec]) => [slug, spec.sections]),
  );
