import { buyerAnswers as legacyAnswers } from "./legacy-source";
import { zhAnswerPatches } from "./answers-zh";
import { expandedEnglishAnswers, expandedAnswerFor, type ExpandedAnswerContent } from "./answer-expanded";
import type { ContentLocale } from "./company";

/**
 * Buyer answers — English copy migrated verbatim from the legacy site
 * (30 Q&As; URLs preserved), Simplified Chinese layered on top so the /zh
 * routes render fully localized. The three long-form expanded answers live
 * in answer-expanded.ts (EN + zh maps).
 */

export type BuyerAnswerPatch = {
  question: string;
  shortAnswer: string;
  details: readonly (readonly [string, string])[];
  askFor: readonly string[];
};

export type LocalizedBuyerAnswer = {
  slug: string;
  question: Record<ContentLocale, string>;
  shortAnswer: Record<ContentLocale, string>;
  details: Record<ContentLocale, readonly (readonly [string, string])[]>;
  askFor: Record<ContentLocale, readonly string[]>;
  relatedProduct?: string;
};

function build(src: (typeof legacyAnswers)[number]): LocalizedBuyerAnswer {
  const zh = zhAnswerPatches[src.slug];
  if (!zh) throw new Error(`Missing zh patch for answer: ${src.slug}`);
  return {
    slug: src.slug,
    question: { en: src.question, zh: zh.question },
    shortAnswer: { en: src.shortAnswer, zh: zh.shortAnswer },
    details: { en: src.details, zh: zh.details },
    askFor: { en: src.askFor, zh: zh.askFor },
    relatedProduct: src.relatedProduct,
  };
}

export const buyerAnswers: readonly LocalizedBuyerAnswer[] = legacyAnswers.map(build);

export type { ExpandedAnswerContent };
export { expandedEnglishAnswers, expandedAnswerFor };

export const answerBySlug = (slug: string) => buyerAnswers.find((a) => a.slug === slug);

/** Editorial picks for the homepage (3–4 only, per IA decision). */
export const featuredAnswerSlugs = [
  "20c-vs-90c-pva-yarn-difference",
  "sample-order-process-pva-water-soluble-yarn",
  "verify-chinese-pva-yarn-factory",
] as const;
