/**
 * Core/section copy surfaces — the INTL-DEES-004B extension point.
 *
 * INTL-DEES-002B made availability path-aware and INTL-DEES-003A made it
 * evidence-based, but both left the *shape* of a promotable page fixed to one
 * kind: an entity detail route. `isDeepContentDetail` was the only door, and
 * `pageCopyFor` was the net behind it, because an entity is the one page whose
 * body copy can be enumerated from data — every `Record<ContentLocale, V>` field
 * on the record is a slot the renderer reads, so a promotion that omits one
 * fails the build instead of shipping a self-canonical ES page over English
 * prose.
 *
 * Core and section routes (`/`, `/manufacturing`, `/quality`, `/request-quote`,
 * `/about`, `/contact`, the section indexes, `/product-finder`,
 * `/request-sample`) do not have that property, and every one of them is
 * **partly** translated — which is exactly why a path-level flag is unusable.
 * Measured on the shipped build, as a share of rendered prose blocks still
 * verbatim English: `/es` 55 of 103 (53 pct), `/es/request-quote` 9 of 26
 * (35 pct, the best in the set), `/es/quality` 121 of 135 (90 pct, and its
 * `<title>` is English too). The dictionary half of that story is the reason the
 * numbers vary per page: `es` and `de` each define 128 of the 266 English leaves,
 * so after `getDictionary` merges toward English **53 pct of the dictionary is
 * still English** — but the distribution is bimodal, `form` 34/34 and `nav` and
 * `actions` complete, while `qualityPage` carries 2 of 22, `finder` 2 of 32,
 * `manufacturingPage` 2 of 9 and `about` 2 of 33. A conversion page can therefore
 * be nearly done while a section page is nearly untouched, and the body prose
 * that is not dictionary-backed at all — inline literals in each page's own
 * components and `Record<ContentLocale>` module records — is English on both.
 *
 * A page in that state cannot be promoted by declaring "this path is translated":
 * that is a boolean where the site needs a field-level answer, which is the
 * defect GSC-INDEX-002 recorded 75 times as "Duplicate, Google chose different
 * canonical".
 *
 * So the missing piece is not permission for core paths, it is the property an
 * entity already has: an enumerable copy surface that the renderer must agree
 * with. That is what this registry declares. One entry per path, listing
 * **every** slot whose text the page shows as body, CTA or form copy — the
 * page's bundle, not a summary of it. Presence here is what makes a path
 * promotable at all; the slot list is what an evidence record must cover
 * exactly; and a page whose rendered bundle disagrees with its declared surface
 * fails at prerender rather than shipping a partial localization.
 *
 * ## Why it ships empty
 *
 * `SECTION_SURFACES` is empty, so today no core path is promotable and every
 * shipped SEO answer stays byte-identical to INTL-DEES-003B. That is a fact
 * about the content, not a disabled flag: a surface may only be declared once
 * the page's prose has actually been gathered into a bundle the page renders
 * through `pageCopyFor`, and no core page has been through that yet. Declaring a
 * partial surface would be worse than declaring none, because the surface *is*
 * the completeness claim — a thin entry would let a record cover three strings
 * and promote a page whose other forty are still English.
 *
 * Empty also holds this task to its own non-negotiables: nothing is translated,
 * no ES/DE promotion is enabled, no page's canonical or hreflang output moves,
 * and the zero-promotion state stays pinned by tests rather than by a switch
 * someone could flip.
 *
 * This module is deliberately a leaf: it imports nothing, so the evidence gate
 * can import it without a cycle and a page bundle can import it without pulling
 * policy along. The class decision that needs both the entity-door and this
 * registry (`promotableClassFor`) lives in `./translation-evidence`.
 */

/**
 * The declared copy slots of one core/section page.
 *
 * Keys are slot names of the page's own bundle, and each must be a key the page
 * actually renders through — `pageCopyFor` throws on a bundle that carries a
 * slot the surface does not declare, misses one it does, or carries a declared
 * slot as anything other than a `{ en, zh }` pair, which is the shape the
 * renderer widens. A slot it cannot read is refused at prerender rather than
 * quietly keeping its English text under a promoted canonical. Values are never
 * copy: the copy lives in the page bundle and in the evidence record, which is
 * the whole point of keeping this list structural.
 */
export type SectionSurface = readonly string[];

/**
 * Path → its complete copy surface. Keys are prefix-free English owners
 * (`/quality`, never `/es/quality`), matching how evidence records and the
 * availability policy already key a page.
 *
 * Empty by fact: no core page has had its prose assembled into a single rendered
 * bundle yet. Adding an entry is the migration step, and it stays inert until an
 * approved `TranslationEvidence` record covers it.
 */
export const SECTION_SURFACES: Readonly<Record<string, SectionSurface>> = {};

/**
 * Is this path registered as a core/section page at all?
 *
 * Key presence only, and deliberately: this answers "did somebody declare this
 * path", never "is the declaration usable". Everything that consumes slots calls
 * `sectionSurfaceFor`, and `promotableClassFor` refuses a path that is registered
 * with an unusable value, so the two can never disagree.
 */
export function isSectionEvidencePath(
  path: string,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): boolean {
  return Object.prototype.hasOwnProperty.call(surfaces, path);
}

/**
 * The declared slots for a registered path, or `null` when there is no usable
 * declaration: the path is unregistered, or it is registered with something that
 * is not an array of slot names (`null`, `undefined`, a string, an object).
 *
 * The runtime check is not decoration. `SECTION_SURFACES` is typed, but every
 * function in this layer also accepts a registry as an argument, and
 * `tsconfig.json` sets `strict` without `noUncheckedIndexedAccess` — so a map
 * assembled by index lookup (`{ ...base, [path]: base[path] }`, or
 * `withSurface(path, SLOTS[path])` for a page that has not been migrated)
 * compiles clean while handing a non-array here. Reading the value instead of
 * answering `null` would either crash at module scope through
 * `TRANSLATED_PAGES = approvedPromotions()` or, for `null`, silently skip every
 * section rule and judge a core page by the looser entity obligation.
 */
export function sectionSurfaceFor(
  path: string,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): SectionSurface | null {
  if (!Object.prototype.hasOwnProperty.call(surfaces, path)) return null;
  const declared = surfaces[path];
  return Array.isArray(declared) ? declared : null;
}
