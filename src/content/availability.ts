import {
  contentLocaleOf,
  htmlLang,
  localePath,
  locales,
  siteUrl,
  type ContentLocale,
  type Locale,
} from "./company";
import {
  isTranslationAvailable,
  TRANSLATED_PAGES,
  type TranslatedPage,
} from "./translation-availability";

/**
 * Content availability policy — the single SEO source of truth.
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
 * content exists in genuinely translated form for EN and ZH only. The two
 * remaining locales get translated chrome (nav, breadcrumbs, CTAs, index
 * headings) over English body copy, so their entity detail pages are copies of
 * the English original rather than localised documents.
 *
 * Scope is deliberately narrow: only entity DETAIL pages are treated as
 * fallback copies. Section index pages (/answers, /knowledge, /products,
 * /applications), the homepage and the core buyer-journey pages lead with
 * translated chrome and are not flagged by Search Console, so they keep their
 * existing self-canonical + full hreflang behaviour.
 *
 * A fallback copy is a per-page state, not a per-language one: an ES or DE
 * detail page stops being one the moment ./translation-availability carries
 * reviewed translated copy for that exact path. Every answer below is therefore
 * path-aware, and a promoted page becomes self-canonical, a symmetric hreflang
 * alternate and a sitemap owner through this module alone.
 */

/** Sections whose detail pages render body copy from `Record<ContentLocale>` data. */
export const DEEP_CONTENT_SECTIONS = [
  "answers",
  "knowledge",
  "products",
  "applications",
] as const;

export type DeepContentSection = (typeof DEEP_CONTENT_SECTIONS)[number];

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

const isModelledContentLocale = (locale: Locale): locale is ContentLocale =>
  contentLocaleOf(locale) === locale;

/**
 * Locales whose deep content the model itself can hold, on every page.
 *
 * Derived from `contentLocaleOf` — the function that picks which
 * `Record<ContentLocale>` key a route renders — rather than restated as a
 * literal, so this list can never claim a language the content model has no
 * copy for. A locale promoted page by page through ./translation-availability
 * is deliberately absent: it gains ownership of one path, not of the site.
 */
export const TRANSLATED_CONTENT_LOCALES: readonly ContentLocale[] =
  locales.filter(isModelledContentLocale);

/**
 * The policy, built over one evidence registry.
 *
 * Production always uses the shipped registry (`TRANSLATED_PAGES`) via the
 * exported functions below; the factory exists so a caller can evaluate the
 * same code against a different set of promoted pages, which is how
 * `tests/intl-dees-002b-page-aware-translation-availability.mjs` proves a
 * single page can be promoted without touching any other path.
 */
export function createAvailabilityPolicy(registry: readonly TranslatedPage[] = TRANSLATED_PAGES) {
  /**
   * Locales that may be advertised as real language equivalents of `path`:
   * every locale the model carries, plus the promotion locales whose copy has
   * been proven for this exact page.
   */
  const localizedLocalesFor = (path: string): readonly Locale[] =>
    locales.filter((locale) => {
      if (isModelledContentLocale(locale)) return true;
      // Chrome-localised routes keep their existing full graph (GSC-INDEX-002).
      if (!isDeepContentDetail(path)) return true;
      return isTranslationAvailable(path, locale, registry);
    });

  /** Does this exact route render genuinely localised content in `locale`? */
  const isLocalizedAt = (path: string, locale: Locale): boolean =>
    localizedLocalesFor(path).includes(locale);

  /**
   * The locale whose URL owns the canonical for (path, locale). Fallback copies
   * are owned by their English original; genuine pages own themselves.
   */
  const canonicalLocaleFor = (path: string, locale: Locale): Locale =>
    isLocalizedAt(path, locale) ? locale : "en";

  /** Is this route a fallback copy rather than the canonical owner? */
  const isEnglishFallbackCopy = (path: string, locale: Locale): boolean =>
    !isLocalizedAt(path, locale);

  /** Absolute canonical URL for (path, locale). */
  const canonicalUrlFor = (path: string, locale: Locale): string =>
    `${siteUrl}${localePath(path, canonicalLocaleFor(path, locale))}`;

  /**
   * Language of the rendered body copy, as a BCP-47 tag. Used for `og:locale`
   * and JSON-LD `inLanguage`, which describe content and therefore follow the
   * canonical owner, not the URL prefix.
   */
  const contentHtmlLangOf = (path: string, locale: Locale): string =>
    htmlLang[canonicalLocaleFor(path, locale)];

  /**
   * hreflang map for a path, containing only real equivalents plus x-default.
   * Fallback copies declare no language graph at all: their canonical tag
   * already points Google at the English original, and repeating the false
   * `es`/`de` alternates would re-create the defect this module removes.
   */
  const hreflangForPath = (path: string): Record<string, string> => {
    const languages: Record<string, string> = {};
    for (const l of localizedLocalesFor(path)) {
      languages[htmlLang[l]] = `${siteUrl}${localePath(path, l)}`;
    }
    languages["x-default"] = canonicalUrlFor(path, "en");
    return languages;
  };

  /** hreflang map to emit for (path, locale); undefined for fallback copies. */
  const hreflangForRoute = (
    path: string,
    locale: Locale,
  ): Record<string, string> | undefined =>
    isEnglishFallbackCopy(path, locale) ? undefined : hreflangForPath(path);

  /**
   * Indexation posture for (path, locale).
   *
   * Fallback copies stay `index, follow`: the canonical tag is what consolidates
   * them onto the English original, and `noindex` would block that consolidation
   * while moving the URLs into a different exclusion bucket without removing the
   * duplicate signal. They are simply never the *declared* document — enforced by
   * `ownsOwnCanonical`.
   */
  const indexabilityForRoute = (
    path: string,
    locale: Locale,
  ): { index: boolean; follow: boolean; ownsOwnCanonical: boolean } => ({
    index: true,
    follow: true,
    ownsOwnCanonical: !isEnglishFallbackCopy(path, locale),
  });

  /**
   * May this (path, locale) appear in the sitemap as its own entry or as a
   * declared hreflang alternate? Only canonical owners may, so the sitemap can
   * never again advertise an untranslated fallback copy as a localised page.
   */
  const isSitemapEligible = (path: string, locale: Locale): boolean =>
    isLocalizedAt(path, locale);

  return {
    localizedLocalesFor,
    isLocalizedAt,
    canonicalLocaleFor,
    isEnglishFallbackCopy,
    canonicalUrlFor,
    contentHtmlLangOf,
    hreflangForPath,
    hreflangForRoute,
    indexabilityForRoute,
    isSitemapEligible,
  };
}

/**
 * The shipped policy. SEO consumers import these names; none of them may be
 * re-decided locally, and none of them may be called with another registry.
 */
export const {
  canonicalLocaleFor,
  canonicalUrlFor,
  contentHtmlLangOf,
  hreflangForPath,
  hreflangForRoute,
  indexabilityForRoute,
  isEnglishFallbackCopy,
  isLocalizedAt,
  isSitemapEligible,
  localizedLocalesFor,
} = createAvailabilityPolicy();
