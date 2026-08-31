import { buyerAnswers as legacyAnswers } from "./legacy-source";
import { expandedEnglishAnswers, type ExpandedAnswerContent } from "./answer-expanded";

/**
 * Buyer answers — migrated verbatim from the legacy site (30 Q&As plus the
 * three expanded long-form answers). URLs (/answers/[slug]) preserved.
 */
export const buyerAnswers = legacyAnswers;

export type { ExpandedAnswerContent };
export { expandedEnglishAnswers };

export const answerBySlug = (slug: string) => buyerAnswers.find((a) => a.slug === slug);

/** Editorial picks for the homepage (3–4 only, per IA decision). */
export const featuredAnswerSlugs = [
  "20c-vs-90c-pva-yarn-difference",
  "sample-order-process-pva-water-soluble-yarn",
  "verify-chinese-pva-yarn-factory",
] as const;
