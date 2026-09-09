import { contentLocaleOf, type ContentLocale, type Locale } from "./company";
import {
  SECTION_SURFACES,
  isSectionEvidencePath,
  sectionSurfaceFor,
  type SectionSurface,
} from "./page-surfaces";
import {
  approvedPromotions,
  DEEP_CONTENT_SECTIONS,
  deepContentSectionOf,
  displayPromotions,
  isDeepContentDetail,
  isGenuineTranslation,
  promotableClassFor,
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
   import them from `./translation-evidence`. The INTL-DEES-004B names are
   re-exported for the same reason: they belong to the gate and the registry, and
   this module is only their consumer. */
export {
  DEEP_CONTENT_SECTIONS,
  deepContentSectionOf,
  isDeepContentDetail,
  isGenuineTranslation,
  promotableClassFor,
  isSectionEvidencePath,
  sectionSurfaceFor,
  SECTION_SURFACES,
};
export type {
  DeepContentSection,
  PromotionLocale,
  TranslatedPage,
  TranslatedValue,
  SectionSurface,
};

/**
 * Promoted pages: every promotion the shipped evidence grants, and nothing else.
 *
 * Empty by fact, not by policy — an ES or DE page becomes a localized owner only
 * through an approved `TranslationEvidence` record, and no ES or DE page has
 * translated copy yet (INTL-DEES-001 owns that content work).
 */
export const TRANSLATED_PAGES: readonly TranslatedPage[] = approvedPromotions();

/**
 * The registry a route reads to decide what text to *show*.
 *
 * `TRANSLATED_PAGES` above is the registry that decides what a page may *claim*,
 * and `./availability` — canonical, hreflang, sitemap, `inLanguage` — reads only
 * that one. This second list is the same evidence with the signature requirement
 * dropped: a record whose copy is complete, genuine and non-duplicated, but which
 * nobody has reviewed yet.
 *
 * Pages pass it to `pageCopyFor` explicitly, at the call site, so a reader of any
 * route can see which tier that string belongs to. Passing it cannot promote
 * anything: no policy function takes this list, and an unapproved record still
 * has no entry in `TRANSLATED_PAGES` for the policy to find. The completeness net
 * is identical on both tiers, so a page cannot display half a translation either
 * — `pageCopyFor` throws, and these pages are prerendered, so the build stops.
 */
export const DISPLAY_PAGES: readonly TranslatedPage[] = displayPromotions();

function honouredPages(
  registry: readonly TranslatedPage[],
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): readonly TranslatedPage[] {
  // Explicit arrow, not `registry.filter(isGenuineTranslation)`: `filter` passes
  // (page, index, array), and since INTL-DEES-004B the second parameter is the
  // surface registry — a number there would read as "no surface registered".
  return registry.filter((page) => isGenuineTranslation(page, surfaces));
}

/** Registered pages that claim a translation without carrying one. */
export function rejectedTranslations(
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): readonly TranslatedPage[] {
  return registry.filter((page) => !isGenuineTranslation(page, surfaces));
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
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): TranslatedPage | undefined {
  return honouredPages(registry, surfaces).find((page) => page.path === path && page.locale === locale);
}

/** Which promotion locales have genuine copy for this exact path. */
export function translatedLocalesFor(
  path: string,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): readonly PromotionLocale[] {
  return honouredPages(registry, surfaces)
    .filter((page) => page.path === path)
    .map((page) => page.locale);
}

/** Has this exact page been translated into `locale` with real copy? */
export function isTranslationAvailable(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): boolean {
  return translatedPageFor(path, locale, registry, surfaces) !== undefined;
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
 *
 * INTL-DEES-004B did not touch this function's logic. It resolves for any path
 * whose promotion survives the evidence gate, which now includes a registered
 * core/section path as well as an entity detail path — and with `SECTION_SURFACES`
 * empty and `TRANSLATION_EVIDENCE` empty, nothing new can reach it.
 */
export function resolvedContentLocaleOf(
  path: string,
  locale: Locale,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): Locale {
  const modelled = contentLocaleOf(locale);
  if (modelled === locale) return locale;
  return translatedPageFor(path, locale, registry, surfaces) ? locale : modelled;
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
 *
 * INTL-DEES-004B: `pageCopyFor` is also the render entry point for a core or
 * section page, which passes its own copy bundle instead of an entity. The
 * detection is structural, not class-based — a bundle slot looks exactly like an
 * entity's body field, a `{ en, zh }` pair — so one function, and one net, covers
 * both page kinds. For a path that declares a surface, the bundle handed to this
 * function must carry **exactly** the declared slots, each one as a `{ en, zh }`
 * pair this loop can widen, and it is checked on every locale rather than only on
 * a promoted one: a page whose rendered copy drifts from what its surface claims
 * is a page whose evidence no longer describes, and discovering that at approval
 * time instead of prerender time is how a partial localization would get through.
 */
export function pageCopyFor<T extends object>(
  path: string,
  locale: Locale,
  entity: T,
  registry: readonly TranslatedPage[] = TRANSLATED_PAGES,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): { entity: RenderedContent<T>; contentLocale: Locale } {
  const surface = sectionSurfaceFor(path, surfaces);
  if (surface !== null) {
    const bundle = entity as Record<string, unknown>;
    const bundleKeys = Object.keys(entity);
    const missing = surface.filter((slot) => !bundleKeys.includes(slot));
    const extra = bundleKeys.filter((key) => !surface.includes(key));
    // A declared slot that the widening loop below cannot read as a `{ en, zh }`
    // pair would keep its English text while the promotion still moved the
    // canonical, hreflang, sitemap and `inLanguage` — so a surface may only name
    // slots the renderer can actually output reviewed copy into. The test is on
    // the slot's shape, never on its leaf type: `TranslatedValue` allows a list,
    // so `{ en: [...], zh: [...] }` is legitimate reviewed copy and must pass.
    const notWidenable = surface.filter(
      (slot) => bundleKeys.includes(slot) && !isContentField(bundle[slot]),
    );
    if (missing.length > 0 || extra.length > 0 || notWidenable.length > 0) {
      throw new Error(
        `translation-evidence: ${path} declares a copy surface that does not match what it ` +
          `renders — missing [${missing.join(", ")}], not-in-surface [${extra.join(", ")}], ` +
          `not-widenable [${notWidenable.join(", ")}]. Each slot must be a { en, zh } pair the ` +
          `page renders, like an entity body field: a slot the renderer skips is English copy ` +
          `under a localized canonical. Either render those slots through the surface, or ` +
          `narrow the surface to the copy the page actually shows. A promotion may only be ` +
          `reviewed against the page's real copy.`,
      );
    }
  }

  const modelled = contentLocaleOf(locale);
  const contentLocale = resolvedContentLocaleOf(path, locale, registry, surfaces);
  const untranslated = { entity: entity as unknown as RenderedContent<T>, contentLocale };
  if (contentLocale === modelled) return untranslated;

  const page = translatedPageFor(path, locale, registry, surfaces)!;
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