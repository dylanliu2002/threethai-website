import {
  htmlLang,
  localePath,
  locales,
  siteUrl,
  type ContentLocale,
  type Locale,
} from "./company";

/**
 * Content availability policy — the single source of truth.
 *
 * Every SEO surface (rendered content language, `<link rel=canonical>`,
 * robots indexability, hreflang, sitemap, internal locale links) MUST answer
 * "does this locale genuinely have this page?" from this module and nothing
 * else. Before this module each surface decided for itself, which is how the
 * site ended up self-canonicalising English-fallback URLs while declaring a
 * full ten-locale hreflang graph for them (GSC: 75 × "Duplicate, Google chose
 * different canonical than user", all of them /answers/* and /knowledge/*
 * under es, pt, ru, ar, tr, vi, id, de).
 *
 * The rule is the one already encoded by `ContentLocale` in ./company: deep
 * content exists in genuinely translated form for EN and ZH only. The eight
 * remaining locales get translated chrome (nav, breadcrumbs, CTAs, index
 * headings) over English body copy, so their entity detail pages are copies
 * of the English original rather than localised documents.
 *
 * Scope is deliberately narrow: only entity DETAIL pages are treated as
 * fallback copies. Section index pages (/answers, /knowledge, /products,
 * /applications), the homepage and the core buyer-journey pages lead with
 * translated chrome and are not flagged by Search Console, so they keep their
 * existing self-canonical + full hreflang behaviour.
 */

/** Sections whose detail pages render body copy from `Record<ContentLocale>` data. */
export const DEEP_CONTENT_SECTIONS = [
  "answers",
  "knowledge",
  "products",
  "applications",
] as const;

export type DeepContentSection = (typeof DEEP_CONTENT_SECTIONS)[number];

/** Locales with genuinely translated deep content. Mirrors `ContentLocale`. */
export const TRANSLATED_CONTENT_LOCALES: readonly ContentLocale[] = ["en", "zh"];

const deepDetailPath = new RegExp(
  `^/(${DEEP_CONTENT_SECTIONS.join("|")})/[^/]+/?$`,
);

/** Which deep-content section (if any) a site path belongs to. */
export function deepContentSectionOf(path: string): DeepContentSection | null {
  const match = deepDetailPath.exec(path);
  return match ? (match[1] as DeepContentSection) : null;
}

/** Is this path an entity detail page whose copy comes from ContentLocale data? */
export function isDeepContentDetail(path: string): boolean {
  return deepContentSectionOf(path) !== null;
}

/**
 * Locales that may be advertised as real language equivalents of `path`.
 * Deep-content details are limited to the translated content locales; every
 * other route keeps the full site locale set.
 */
export function localizedLocalesFor(path: string): readonly Locale[] {
  return isDeepContentDetail(path) ? TRANSLATED_CONTENT_LOCALES : locales;
}

/** Does this exact route render genuinely localised content in `locale`? */
export function isLocalizedAt(path: string, locale: Locale): boolean {
  return localizedLocalesFor(path).includes(locale);
}

/**
 * The locale whose URL owns the canonical for (path, locale). Fallback copies
 * are owned by their English original; genuine pages own themselves.
 */
export function canonicalLocaleFor(path: string, locale: Locale): Locale {
  return isLocalizedAt(path, locale) ? locale : "en";
}

/** Is this route a fallback copy rather than the canonical owner? */
export function isEnglishFallbackCopy(path: string, locale: Locale): boolean {
  return !isLocalizedAt(path, locale);
}

/** Absolute canonical URL for (path, locale). */
export function canonicalUrlFor(path: string, locale: Locale): string {
  return `${siteUrl}${localePath(path, canonicalLocaleFor(path, locale))}`;
}

/**
 * Language of the rendered body copy, as a BCP-47 tag. Used for `og:locale`
 * and JSON-LD `inLanguage`, which describe content and therefore follow the
 * canonical owner, not the URL prefix.
 */
export function contentHtmlLangOf(path: string, locale: Locale): string {
  return htmlLang[canonicalLocaleFor(path, locale)];
}

/**
 * hreflang map for a path, containing only real equivalents plus x-default.
 * Fallback copies declare no language graph at all: their canonical tag
 * already points Google at the English original, and repeating the false
 * `es`/`pt`/… alternates would re-create the defect this module removes.
 */
export function hreflangForPath(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of localizedLocalesFor(path)) {
    languages[htmlLang[l]] = `${siteUrl}${localePath(path, l)}`;
  }
  languages["x-default"] = canonicalUrlFor(path, "en");
  return languages;
}

/** hreflang map to emit for (path, locale); undefined for fallback copies. */
export function hreflangForRoute(
  path: string,
  locale: Locale,
): Record<string, string> | undefined {
  return isEnglishFallbackCopy(path, locale) ? undefined : hreflangForPath(path);
}

/**
 * Indexation posture for (path, locale).
 *
 * Fallback copies stay `index, follow`: the canonical tag is what consolidates
 * them onto the English original, and `noindex` would block that consolidation
 * while moving the URLs into a different exclusion bucket without removing the
 * duplicate signal. They are simply never the *declared* document — enforced by
 * `ownsOwnCanonical`.
 */
export function indexabilityForRoute(
  path: string,
  locale: Locale,
): { index: boolean; follow: boolean; ownsOwnCanonical: boolean } {
  return {
    index: true,
    follow: true,
    ownsOwnCanonical: !isEnglishFallbackCopy(path, locale),
  };
}

/**
 * May this (path, locale) appear in the sitemap as its own entry or as a
 * declared hreflang alternate? Only canonical owners may, so the sitemap can
 * never again advertise an untranslated fallback copy as a localised page.
 */
export function isSitemapEligible(path: string, locale: Locale): boolean {
  return isLocalizedAt(path, locale);
}
