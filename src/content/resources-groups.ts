import { articles } from "./articles";

/**
 * The Resources taxonomy.
 *
 * 001A proposed six categories for the section. Two hard constraints apply that
 * the proposal did not have to reckon with:
 *
 * - `tests/seo-route-parity.mjs:75` and `:88-93` require the `(site)` and
 *   `[lang]` route trees to stay equal and pin `src/app/zh` to an exact list, so a
 *   category cannot become a URL here. Grouping happens on `/knowledge`, which is
 *   also what the task card prefers over empty category pages.
 * - A heading needs text in four locales, and card §7 forbids manufacturing
 *   ES/DE/ZH translation. Of the six proposed names, only "Applications" has an
 *   approved four-locale string today; `intl-dees-001` REQ 3 rejects any ES/DE
 *   dictionary leaf that merely equals its English, so the others cannot be added
 *   without a translator, and leaving them English would put English chrome on the
 *   fully translated, indexed `/zh` surface.
 *
 * The resolution splits the two jobs apart:
 *
 *   - the **six buckets** are the classification: they decide which shelf an
 *     article sits on and the order those shelves appear in, and they are where a
 *     future article is filed;
 *   - the **rendered heading** is the article's own `category`, which
 *     `card-copy.ts` already carries in `{ en, zh, es, de }` and already asserts
 *     against the entity. So every heading on the page is a string the site has
 *     been shipping in four locales since that article was written.
 *
 * Two consequences, both deliberate: a bucket is only as visible as the labels
 * inside it, so `Product Selection` may read as `Material selection` /
 * `Technical guide` until an owner supplies reviewed names for the buckets
 * themselves; and an empty bucket renders nothing at all, which is why there are
 * no placeholder pages. Filing an article under a category nobody declared fails
 * the build instead of vanishing from the hub.
 */

export type ResourcesCategoryId =
  | "product-selection"
  | "applications"
  | "testing-evidence"
  | "manufacturing-capability"
  | "troubleshooting"
  | "buyer-guides";

/** Shelf order on `/knowledge`, per the taxonomy in 001A §3. */
export const RESOURCES_CATEGORY_ORDER: readonly ResourcesCategoryId[] = [
  "product-selection",
  "applications",
  "testing-evidence",
  "manufacturing-capability",
  "troubleshooting",
  "buyer-guides",
];

/**
 * Which shelf each already-approved `article.category.en` sits on.
 *
 * Keys are the labels themselves because a label is what a heading must be, and
 * one shelf may hold several labels until an owner reviews single names for the
 * shelves. `applications`, `manufacturing-capability` and `troubleshooting` are
 * absent because no shipped article belongs there yet — declaring them above keeps
 * them first-class in the taxonomy, and the absence is the honest statement that
 * the section has no such content, rather than a page built to look populated.
 */
const CATEGORY_TO_SHELF: Record<string, ResourcesCategoryId> = {
  "Material selection": "product-selection",
  "Technical guide": "product-selection",
  "Quality control": "testing-evidence",
  "Buyer checklist": "buyer-guides",
};

/**
 * A rendered shelf: one already-approved heading, and the articles under it.
 *
 * `heading` is never optional. A block whose members disagreed on their label
 * would need a heading invented for it, so grouping is keyed on the label and
 * disagreement is structurally impossible.
 */
export type ResourcesGroup = {
  /** The taxonomy shelf this group sits on. */
  readonly shelf: ResourcesCategoryId;
  /** The approved four-locale heading, taken from the articles' own category. */
  readonly heading: string;
  readonly slugs: readonly string[];
};

/**
 * Groups the live article set into shelves, in taxonomy order.
 *
 * Throws on an unclassifiable article: `articles.ts` grows by hand, and an article
 * filed under a label nobody declared would otherwise disappear from `/knowledge`
 * while staying in the sitemap.
 */
export function resourcesGroups(
  source: readonly { slug: string; category: { en: string } }[] = articles,
): readonly ResourcesGroup[] {
  const shelves = new Map<string, { shelf: ResourcesCategoryId; slugs: string[] }>();

  for (const article of source) {
    const shelf = CATEGORY_TO_SHELF[article.category.en];
    if (!shelf) {
      throw new Error(
        `resources-groups: article "${article.slug}" has category "${article.category.en}", which no ` +
          `Resources shelf claims. Add it to CATEGORY_TO_SHELF in resources-groups.ts. An article ` +
          `that files nowhere disappears from the /knowledge hub while remaining in the sitemap.`,
      );
    }
    const existing = shelves.get(article.category.en);
    if (existing) existing.slugs.push(article.slug);
    else shelves.set(article.category.en, { shelf, slugs: [article.slug] });
  }

  const position = (id: ResourcesCategoryId) => RESOURCES_CATEGORY_ORDER.indexOf(id);
  return [...shelves.entries()]
    .map(([heading, group]) => ({ shelf: group.shelf, heading, slugs: group.slugs }))
    .sort(
      (a, b) => position(a.shelf) - position(b.shelf) || a.heading.localeCompare(b.heading),
    );
}
