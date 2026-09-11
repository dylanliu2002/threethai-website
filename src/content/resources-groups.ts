import { articles } from "./articles";

/**
 * The Resources taxonomy.
 *
 * 001A proposed six categories for the section. Two hard constraints apply here
 * that the proposal did not have to reckon with:
 *
 * - `tests/seo-route-parity.mjs:75` and `:88-93` require the `(site)` and
 *   `[lang]` route trees to stay equal and pin `src/app/zh` to an exact list, so
 *   a category cannot become a URL in this task. Grouping happens on
 *   `/knowledge`, which is also what the task card prefers over empty category
 *   pages.
 * - A heading needs text in four locales, and card §7 forbids manufacturing
 *   ES/DE/ZH translations. Only one of the six names ("Applications") has an
 *   exact approved string today; the others exist in the dictionaries as
 *   *navigation* labels (`nav.products`, `nav.quality`), which would be a poor
 *   and confusing heading for an article group — "Buyer answers" as a section
 *   title on `/knowledge`, directly competing with the real `/answers` section.
 *
 * So the taxonomy is declared and enforced here, and a group is only allowed to
 * render a heading when its members already agree on a label that is approved in
 * all four locales. That label is the group's own `category` value, which
 * `card-copy.ts` carries in `{ en, zh, es, de }` and asserts against the entity —
 * so no string is invented, none can drift, and no English heading lands on a
 * Chinese page.
 *
 * The visible consequence today is honest to state: with four articles spread
 * over four distinct categories, every group holds a single article, so
 * `/knowledge` renders no group headings yet. The structure, the ordering and the
 * classifier are live and tested; a second article filed into `product-selection`
 * turns its heading on with no further code. Filing an article into a category
 * that does not exist here fails the build instead of vanishing from the hub.
 */

export type ResourcesCategoryId =
  | "product-selection"
  | "applications"
  | "testing-evidence"
  | "manufacturing-capability"
  | "troubleshooting"
  | "buyer-guides";

/** Display order, per the taxonomy in 001A §3. */
export const RESOURCES_CATEGORY_ORDER: readonly ResourcesCategoryId[] = [
  "product-selection",
  "applications",
  "testing-evidence",
  "manufacturing-capability",
  "troubleshooting",
  "buyer-guides",
];

/**
 * Which already-approved `article.category.en` values belong to each category.
 *
 * A group is keyed by these values rather than carrying its own name, so the
 * heading a reader sees is a string the site has been shipping in four locales
 * since the article was written. `technical guide` joins `material selection`
 * under product-selection because both answer "which grade or form do I buy";
 * their labels differ, which is exactly why neither group renders a heading yet.
 */
const CATEGORY_MEMBERS: Record<ResourcesCategoryId, readonly string[]> = {
  "product-selection": ["Material selection", "Technical guide"],
  applications: [],
  "testing-evidence": ["Quality control"],
  "manufacturing-capability": [],
  troubleshooting: [],
  "buyer-guides": ["Buyer checklist"],
};

/** A group of one is not yet a category — it adds a heading and no information. */
export const MIN_GROUP_SIZE = 2;

export type ResourcesGroup = {
  readonly id: ResourcesCategoryId;
  /** The shared, already-approved heading text. Present only when it is safe to show. */
  readonly label: string | null;
  readonly slugs: readonly string[];
};

/**
 * The single place that decides a group may show a heading. A category whose
 * members disagree on their own label would otherwise need a heading invented for
 * it, so it stays unlabelled and unrendered rather than guessing.
 */
function sharedLabel(categories: readonly string[]): string | null {
  const distinct = new Set(categories);
  return distinct.size === 1 ? [...distinct][0] : null;
}

/**
 * Groups the live article set, in taxonomy order.
 *
 * Throws on an unclassifiable article. `articles.ts` grows by hand, and an
 * article filed under a category nobody declared would otherwise be silently
 * absent from `/knowledge` while still sitting in the sitemap.
 */
export function resourcesGroups(source: readonly { slug: string; category: { en: string } }[] = articles): readonly ResourcesGroup[] {
  const buckets = new Map<ResourcesCategoryId, { slug: string; category: string }[]>();

  for (const article of source) {
    const owner = RESOURCES_CATEGORY_ORDER.find((id) => CATEGORY_MEMBERS[id].includes(article.category.en));
    if (!owner) {
      throw new Error(
        `resources-groups: article "${article.slug}" has category "${article.category.en}", which no ` +
          `Resources category claims. Add it to CATEGORY_MEMBERS in resources-groups.ts. An article ` +
          `that files nowhere disappears from the /knowledge hub while remaining in the sitemap.`,
      );
    }
    buckets.set(owner, [...(buckets.get(owner) ?? []), { slug: article.slug, category: article.category.en }]);
  }

  return RESOURCES_CATEGORY_ORDER.map((id) => {
    const members = buckets.get(id) ?? [];
    return {
      id,
      label: members.length >= MIN_GROUP_SIZE ? sharedLabel(members.map((member) => member.category)) : null,
      slugs: members.map((member) => member.slug),
    };
  }).filter((group) => group.slugs.length > 0);
}

/** A rendered run of cards: one labelled group, or an unlabelled stretch. */
export type KnowledgeBlock = {
  readonly label: string | null;
  readonly slugs: readonly string[];
};

/**
 * Turns groups into the list a hub page renders.
 *
 * Groups without a safe label are merged into one unlabelled run, so a page shows
 * a single grid of cards rather than four grids of one with no headings — the
 * layout `/knowledge` has today. Merging only adjacent groups keeps the taxonomy
 * order intact.
 */
export function knowledgeBlocks(source?: Parameters<typeof resourcesGroups>[0]): readonly KnowledgeBlock[] {
  const blocks: { label: string | null; slugs: string[] }[] = [];
  for (const group of resourcesGroups(source)) {
    const last = blocks[blocks.length - 1];
    if (group.label === null && last && last.label === null) {
      last.slugs.push(...group.slugs);
      continue;
    }
    blocks.push({ label: group.label, slugs: [...group.slugs] });
  }
  return blocks;
}
