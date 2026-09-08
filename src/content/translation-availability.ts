import { contentLocaleOf, type ContentLocale, type Locale } from "./company";
import {
  approvedPromotions,
  DEEP_CONTENT_SECTIONS,
  deepContentSectionOf,
  isDeepContentDetail,
  isGenuineTranslation,
  type DeepContentSection,
  type PromotionLocale,
  type TranslatedPage,
  type TranslatedValue,
} from "./translation-evidence";

/**
 * Translation availability — resolving promoted copy for pages and policies.
 *
 * This module answers one question — "does *this page* have copy in *this
 * language*, and what does its renderer read?" — from the copy itself rather
 * than from a claim: the promotion that makes a page available is the same
 * object its renderer reads body copy from (`pageCopyFor`). SEO ownership is
 * therefore derived from rendering instead of asserted beside it, which is the
 * GSC-INDEX-002 defect kept out page by page: a locale can only become an owner
 * of a page by carrying the text that page will show in that locale.
 *
 * What a promotion *is* belongs to `./translation-evidence`: the record, its
 * reviewed field list, its provenance and its approval status. This module is
 * the consumer of that answer, not a second place to state it. Its only registry
 * is `TRANSLATED_PAGES`, and `TRANSLATED_PAGES` is `approvedPromotions()` over
 * the shipped evidence — so a page that nobody approved has no entry here to
 * find, in the policy and in the renderer alike.
 *
 * `./availability` is the policy surface that turns these answers into
 * canonical, hreflang, content-language and sitemap decisions. Nothing else
 * reads this module.
 *
 * Nothing is promoted today. ES and DE deep pages still render the English
 * record, and ES/DE core and section pages render partially translated chrome
 * over English body copy (measured: 128 of 248 UI strings per locale), so the
 * evidence registry is empty, `TRANSLATED_PAGES` is empty with it, and no ES or
 * DE page owns a URL anywhere on the site.
 */

/* The evidence layer owns these; they stay reachable here so the INTL-DEES-002B
   surface and its suite keep resolving without a rename. New callers should
   import them from `./translation-evidence`. */
export { DEEP_CONTENT_SECTIONS, deepContentSectionOf, isDeepContentDetail, isGenuineTranslation };
export type { DeepContentSection, PromotionLocale, TranslatedPage, TranslatedValue };

/**
 * Promoted pages: every promotion the shipped evidence grants, and nothing else.
 *
 * Empty by fact, not by policy — an ES or DE page becomes a localized owner only
 * through an approved `TranslationEvidence` record, and no ES or DE page has
 * translated copy yet (INTL-DEES-001 owns that content work).
 */
export const TRANSLATED_PAGES: readonly TranslatedPage[] = approvedPromotions();

function honouredPages(registry: readonly TranslatedPage[]): readonly TranslatedPage[] {
  return registry.filter(isGenuineTranslation);
}

/** Registered pages that claim a translation without carrying one. */
export function rejectedTranslations(
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): readonly TranslatedPage[] {
  return registry.filter((page) => !isGenuineTranslation(page));
}

/**
 * The proven entry for one exact path and locale; `undefined` when unproven.
 * Exact match only: `/products/x` never answers for `/products/x/`, for
 * `/products/xy`, or for a slug in another section.
 */
export function translatedPageFor(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): TranslatedPage | undefined {
  return honouredPages(registry).find((page) => page.path === path && page.locale === locale);
}

/** Which promotion locales have genuine copy for this exact path. */
export function translatedLocalesFor(
  path: string,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): readonly PromotionLocale[] {
  return honouredPages(registry)
    .filter((page) => page.path === path)
    .map((page) => page.locale);
}

/** Has this exact page been translated into `locale` with real copy? */
export function isTranslationAvailable(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): boolean {
  return translatedPageFor(path, locale, registry) !== undefined;
}

/**
 * The language an entity's body copy is rendered in for (path, locale).
 *
 * The one answer both halves of the site read: `./availability` calls a locale
 * the page's owner only when this returns that locale, and a renderer indexes
 * its own body fields with it. EN and ZH return themselves, as the content
 * model already guarantees; ES and DE return English unless this exact page is
 * promoted, in which case they return themselves *because* the promoted copy
 * exists to render.
 */
export function resolvedContentLocaleOf(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): Locale {
  const modelled = contentLocaleOf(locale);
  if (modelled === locale) return locale;
  return translatedPageFor(path, locale, registry) ? locale : modelled;
}

/**
 * An entity as its renderer sees it: every `Record<ContentLocale, V>` body
 * field widened so the promoted locale can be indexed, everything else exactly
 * as the model declares it.
 */
export type RenderedContent<T> = {
  [K in keyof T]: T[K] extends Record<ContentLocale, infer V> ? Record<Locale, V> : T[K];
};

/** Does this entity value hold one body-copy block per content locale? */
function isContentField(value: unknown): value is Record<ContentLocale, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "en" in value &&
    "zh" in value &&
    Object.keys(value).length === 2
  );
}

/**
 * The copy a route renders for (path, locale), and the key to index it with.
 *
 * Unpromoted — every EN and ZH page, and every ES/DE page today — this returns
 * the entity untouched with the same key `contentLocaleOf` always gave, so
 * rendering is unchanged. For a promoted page it returns a per-request copy of
 * the entity whose body fields carry the record's translated values, so SEO
 * ownership and localized body copy are the same approved evidence record read
 * twice. A promoted entity with a field that record does not cover throws rather
 * than rendering part of the page in English under a localized label, and because
 * detail pages are prerendered, that failure stops the build.
 *
 * Fields belonging to *other* entities (related-product teasers, cross-linked
 * articles) keep resolving through `contentLocaleOf`: they are not this page's
 * copy, and a promotion never claims to have translated them.
 */
export function pageCopyFor<T extends object>(
  path: string,
  locale: Locale,
  entity: T,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
): { entity: RenderedContent<T>; contentLocale: Locale } {
  const modelled = contentLocaleOf(locale);
  const contentLocale = resolvedContentLocaleOf(path, locale, registry);
  const untranslated = { entity: entity as unknown as RenderedContent<T>, contentLocale };
  if (contentLocale === modelled) return untranslated;

  const page = translatedPageFor(path, locale, registry)!;
  const rendered: Record<string, unknown> = { ...(entity as Record<string, unknown>) };
  for (const [field, value] of Object.entries(entity)) {
    if (!isContentField(value)) continue;
    if (!(field in page.content)) {
      throw new Error(
        `translation-evidence: the ${locale} promotion of ${path} has no translated ` +
          `"${field}", which this page renders. Add the field to that record's requiredFields ` +
          `and content, or withdraw the evidence: a page may not own a localized URL while ` +
          `part of its copy is English.`,
      );
    }
    rendered[field] = { ...value, [locale]: page.content[field] };
  }
  return { entity: rendered as unknown as RenderedContent<T>, contentLocale };
}