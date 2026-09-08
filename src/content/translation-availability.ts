import { contentLocaleOf, type ContentLocale, type Locale } from "./company";

/**
 * Translation evidence — the path-aware source of truth for localized copy.
 *
 * This module answers one question — "does *this page* have copy in *this
 * language*?" — and answers it from the copy itself rather than from a claim:
 * the entry that makes a page available is the same object its renderer reads
 * body copy from (`pageCopyFor`). SEO ownership is therefore derived from
 * rendering instead of asserted beside it, which is the GSC-INDEX-002 defect
 * kept out page by page: a locale can only become an owner of a page by
 * carrying the text that page will show in that locale.
 *
 * `./availability` is the policy surface that turns these answers into
 * canonical, hreflang, content-language and sitemap decisions. Nothing else
 * reads this module.
 *
 * Nothing is promoted today. ES and DE deep pages still render the English
 * record, and ES/DE core and section pages render partially translated chrome
 * over English body copy (measured: 128 of 248 UI strings per locale), so
 * `TRANSLATED_PAGES` is empty and no ES or DE page owns a URL anywhere on the
 * site.
 */

/**
 * A locale the content model holds no body copy for. `en` and `zh` are absent
 * because `ContentLocale` already carries their copy on every entity.
 */
export type PromotionLocale = Exclude<Locale, ContentLocale>;

/**
 * One localized value. Nested on purpose: a product's `faqs` and `processGuide`
 * hold pairs inside lists, and an entry must mirror the field's own shape so the
 * renderer consumes it unchanged.
 */
export type TranslatedValue = string | readonly TranslatedValue[];

/**
 * One page, in one language.
 *
 * `source` is the English owner's field map verbatim and `content` is the
 * translated field map, both keyed by the entity's own field names (`name`,
 * `intro`, `faqs`, …). Keying by field rather than by position is what lets the
 * renderer consume the entry: the copy lands exactly where the page already
 * looks, and an entry that leaves out a field the entity carries fails at
 * render instead of shipping a half-translated page that claims ownership.
 *
 * `path` is the prefix-free English owner (`/products/pva-staple-fiber`), never
 * a locale-prefixed URL: the promotion describes the page, and `localePath()`
 * derives the prefixed form from it.
 */
export type TranslatedPage = {
  path: string;
  locale: PromotionLocale;
  source: Readonly<Record<string, TranslatedValue>>;
  content: Readonly<Record<string, TranslatedValue>>;
};

/**
 * Promoted pages. Empty by fact, not by policy: an ES or DE page becomes a
 * localized owner only through an entry here, and no ES or DE page has
 * translated copy yet (INTL-DEES-001 owns that content work).
 */
export const TRANSLATED_PAGES: readonly TranslatedPage[] = [];

/** Sections whose entity detail pages carry `Record<ContentLocale, …>` copy. */
export const DEEP_CONTENT_SECTIONS = [
  "answers",
  "knowledge",
  "products",
  "applications",
] as const;

export type DeepContentSection = (typeof DEEP_CONTENT_SECTIONS)[number];

const deepDetailPath = new RegExp(`^/(${DEEP_CONTENT_SECTIONS.join("|")})/[^/]+/?$`);

/** Which deep-content section (if any) a site path belongs to. */
export function deepContentSectionOf(path: string): DeepContentSection | null {
  const match = deepDetailPath.exec(path);
  return match ? (match[1] as DeepContentSection) : null;
}

/**
 * Is this an entity detail page — the only kind of page a promotion can
 * describe? Copy elsewhere on the site comes from the UI dictionary rather than
 * from an entity record, so an entry for a core or section path is a registry
 * mistake the policy refuses rather than a claim it honours. Widening
 * promotions to those routes is a separate change with its own evidence.
 */
export function isDeepContentDetail(path: string): boolean {
  return deepDetailPath.test(path);
}

const sameText = (a: TranslatedValue, b: TranslatedValue): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const textLeaves = (value: TranslatedValue): string[] =>
  typeof value === "string" ? [value] : value.flatMap((part) => textLeaves(part));

const nonEmpty = (value: TranslatedValue): boolean => {
  const leaves = textLeaves(value);
  return leaves.length > 0 && leaves.every((leaf) => leaf.trim().length > 0);
};

/**
 * Does this entry actually carry translated copy?
 *
 * Deliberately conservative: an unproven entry leaves the page an English
 * fallback copy, the safe direction. The field sets must match (no partial
 * page), every value must be present, and no value may be its own English text
 * again — a "translation" that pastes the source back is the fabrication this
 * module exists to refuse.
 */
export function isGenuineTranslation(page: TranslatedPage): boolean {
  const { path, source, content } = page;
  if (!isDeepContentDetail(path)) return false;
  const fields = Object.keys(content);
  if (fields.length === 0 || fields.length !== Object.keys(source).length) return false;
  return fields.every((field) => {
    if (!(field in source)) return false;
    const translated = content[field];
    const english = source[field];
    return nonEmpty(translated) && nonEmpty(english) && !sameText(translated, english);
  });
}

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
 * the entity whose body fields carry the entry's translated values, so SEO
 * ownership and localized body copy are the same registration read twice. A
 * promoted entity with a field the entry does not cover throws rather than
 * rendering part of the page in English under a localized label, and because
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
        `translation-availability: the ${locale} promotion of ${path} has no translated ` +
          `"${field}", which this page renders. Add the field to the entry or withdraw the ` +
          `promotion: a page may not own a localized URL while part of its copy is English.`,
      );
    }
    rendered[field] = { ...value, [locale]: page.content[field] };
  }
  return { entity: rendered as unknown as RenderedContent<T>, contentLocale };
}