import type { ContentLocale } from "./company";

/**
 * Declared title changes for legacy-migrated articles.
 *
 * `legacy-source.ts` holds copy migrated verbatim from the previous site, and the content
 * guards freeze a migrated article's `title`, `intro`, `category` and `metaDescription` so a
 * rewrite cannot quietly move the strings that `card-copy.ts` mirrors in four locales.
 *
 * This file is the one way through that freeze, and it is deliberately explicit: a slug has
 * to be named here, with a reason, so the exception is visible in review rather than being an
 * edit to the legacy copy. Adding a slug is the change; nothing else reads this map.
 */
export const articleTitlePatches: Record<string, { title: Record<ContentLocale, string>; why: string }> = {
  "pva-yarn-dissolution-temperature-guide": {
    title: {
      en: "How to Choose the Right Dissolution Temperature for Water-Soluble PVA Yarn",
      zh: "如何为水溶性 PVA 纱线选择合适的溶解温度",
    },
    why:
      "The migrated headline named three of the seven process targets the repository publishes " +
      "(20°C, 40°C and 90°C) and read like a reference table rather than a guide, while the body " +
      "this branch wrote is a selection guide: seven targets, the five variables that move the " +
      "result, the removal-stage table and the four terms to fix before ordering. The headline " +
      "now says what the article is. The former title is preserved in the body's own copy, which " +
      "still explains why 20°C, 40°C and 90°C are the three labels buyers ask about.",
  },
};
