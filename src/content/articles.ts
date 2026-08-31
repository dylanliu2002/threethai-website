import { articles as legacyArticles } from "./legacy-source";

/**
 * Technical knowledge articles — migrated verbatim from the legacy site.
 * URLs (/knowledge/[slug]) are preserved for SEO.
 */
export const articles = legacyArticles;

export type Article = (typeof articles)[number];

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
