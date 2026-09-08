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
  DEEP_CONTENT_SECTIONS,
  deepContentSectionOf,
  isDeepContentDetail,
  resolvedContentLocaleOf,
  TRANSLATED_PAGES,
  type DeepContentSection,
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
 * The answer is one call: `resolvedContentLocaleOf(path, locale) === locale`.
 * That is the same resolution a route uses to pick the body copy it renders, so
 * a URL can only own itself in a language whose copy the page actually shows.
 * Ownership and rendering cannot be pulled apart by registering a claim in one
 * place while the other keeps serving English.
 *
 * For EN and ZH that resolution is the content model's own guarantee:
 * `ContentLocale` carries their copy on every entity, so `contentLocaleOf`
 * returns the locale itself. For ES and DE it is a per-page fact with no
 * exemptions. Entity detail pages render English body copy, and core and
 * section routes render partially translated chrome over English body copy, so
 * neither kind of page is an ES or DE owner today. Nothing here may treat a
 * locale, or a class of paths, as translated by default: assuming it for deep
 * pages produced 86 duplicate copies, and assuming it for core pages would do
 * the same to the rest of the site.
 */

/** The page-shape model lives with the evidence, beside the copy it describes. */
export { DEEP_CONTENT_SECTIONS, deepContentSectionOf, isDeepContentDetail };
export type { DeepContentSection };

const isModelledContentLocale = (locale: Locale): locale is ContentLocale =>
  contentLocaleOf(locale) === locale;

/**
 * Locales whose body copy the model itself carries, on every page.
 *
 * Derived from `contentLocaleOf` — the function that picks which
 * `Record<ContentLocale>` key a route renders — rather than restated as a
 * literal, so this list cannot claim a language the content model has no copy
 * for. A locale promoted page by page through ./translation-availability is
 * deliberately absent: it gains ownership of one path, not of the site.
 */
export const TRANSLATED_CONTENT_LOCALES: readonly ContentLocale[] =
  locales.filter(isModelledContentLocale);

/**
 * The policy, built over one evidence registry.
 *
 * Production always uses the shipped registry (`TRANSLATED_PAGES`) through the
 * exported functions below; the factory exists so a caller can evaluate the
 * same code against a different set of promoted pages, which is how
 * `tests/intl-dees-002b-page-aware-translation-availability.mjs` proves one page
 * can be promoted without touching any other path or locale.
 */
export function createAvailabilityPolicy(registry: readonly TranslatedPage[] = TRANSLATED_PAGES) {
  /**
   * Locales that may be advertised as real language equivalents of `path`:
   * every locale whose copy this route actually renders, in `locales` order.
   */
  const localizedLocalesFor = (path: string): readonly Locale[] =>
    locales.filter((locale) => resolvedContentLocaleOf(path, locale, registry) === locale);

  /** Does this exact route render genuinely localised content in `locale`? */
  const isLocalizedAt = (path: string, locale: Locale): boolean =>
    resolvedContentLocaleOf(path, locale, registry) === locale;

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
