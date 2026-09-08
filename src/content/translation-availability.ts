import type { ContentLocale, Locale } from "./company";

/**
 * Translation evidence — the path-aware record of which localised copy exists.
 *
 * `./availability` is the policy every SEO surface reads; this module is the
 * only input that policy consults when it has to answer "does *this page*
 * exist in *this language*?". Before it, the question was answered per language
 * (`TRANSLATED_CONTENT_LOCALES`), so the only way to give one genuinely
 * translated Spanish product page its own canonical was to declare Spanish
 * translated site-wide — which is how a site acquires dozens of false owners.
 *
 * The unit of evidence is a rendered block list, not a flag. Registering a page
 * means supplying the translated copy next to the English original it replaces,
 * so availability can never be asserted independently of content: an entry with
 * nothing in it, an entry shorter than its English source, or an entry whose
 * "translation" is the English text pasted again is rejected by
 * `isGenuineTranslation` and is never honoured.
 *
 * Nothing is promoted here today. Every ES and DE deep page on this site still
 * renders English body copy, so `TRANSLATED_PAGES` is empty and the posture of
 * every route is exactly what GSC-INDEX-002 fixed: prefix-free English
 * canonical, no hreflang graph, not a sitemap owner.
 */

/**
 * A locale the content model holds no deep body copy for. `en` and `zh` are
 * absent because `ContentLocale` already carries their copy for every page;
 * a page-level promotion is the only route the remaining site languages have.
 */
export type PromotionLocale = Exclude<Locale, ContentLocale>;

/**
 * One page, in one language, with the copy that makes the claim true.
 *
 * `path` is the prefix-free English owner (`/products/pva-staple-fiber`), never
 * a locale-prefixed URL: the promotion is about the page, and `localePath()`
 * derives the prefixed form from it.
 *
 * `source`/`translated` list the page's prose blocks in render order. Blocks
 * that legitimately stay in every language (a specification such as
 * `1.50 dtex × 38 mm`) are not listed at all, because listing them would force
 * a translator to invent a difference that does not exist.
 */
export type TranslatedPage = {
  path: string;
  locale: PromotionLocale;
  /** The English owner blocks, verbatim, in render order. */
  source: readonly string[];
  /** The translated blocks, same order and same count as `source`. */
  translated: readonly string[];
};

/**
 * Promoted pages. Empty by fact, not by policy: a locale enters the sitemap as
 * a localized owner only through an entry here, and no ES or DE deep page has
 * reviewed translated copy yet (INTL-DEES-001 owns that content work).
 */
export const TRANSLATED_PAGES: readonly TranslatedPage[] = [];

const nonEmpty = (value: string): boolean => value.trim().length > 0;

/**
 * Does this entry actually carry translated copy for its page?
 *
 * Deliberately conservative — an unproven entry leaves the page an English
 * fallback copy, which is the safe answer. The alternative (honour a weak claim)
 * is the defect GSC-INDEX-002 removed, re-introduced one page at a time.
 */
export function isGenuineTranslation(page: TranslatedPage): boolean {
  const { path, source, translated } = page;
  if (!path.startsWith("/")) return false;
  if (translated.length === 0 || translated.length !== source.length) return false;
  if (!translated.every(nonEmpty)) return false;
  return translated.every((block, index) => block.trim() !== source[index].trim());
}

/** Registered pages that claim a translation without carrying one. */
export function rejectedTranslations(
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): readonly TranslatedPage[] {
  return registry.filter((page) => !isGenuineTranslation(page));
}

function provenPageFor(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[],
): TranslatedPage | undefined {
  // Exact path match only: `/products/x` never answers for `/products/x/`,
  // `/products/xy` or another section's slug.
  return registry.find(
    (page) => page.path === path && page.locale === locale && isGenuineTranslation(page),
  );
}

/** Which promotion locales have genuine copy for this exact path. */
export function translatedLocalesFor(
  path: string,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): readonly PromotionLocale[] {
  return registry
    .filter((page) => page.path === path && isGenuineTranslation(page))
    .map((page) => page.locale);
}

/** Has this exact page been translated into `locale` with real copy? */
export function isTranslationAvailable(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): boolean {
  return provenPageFor(path, locale, registry) !== undefined;
}

/**
 * The copy a route must render to keep a promotion honest.
 *
 * Availability and body copy come out of the same entry, so a page cannot be
 * declared localized in one place while being rendered from English somewhere
 * else: a route that promotes a locale has to render what this returns.
 */
export function translatedCopyFor(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): readonly string[] | undefined {
  return provenPageFor(path, locale, registry)?.translated;
}
