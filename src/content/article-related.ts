import { applications } from "./applications";
import { buyerAnswers } from "./answers";
import { products } from "./products";

/**
 * Which other pages a knowledge article belongs to.
 *
 * The article template used to show every visitor the same block: all four
 * products, whatever the article was about, plus the other three articles
 * wherever they happened to sit in the array. A buyer reading about batch
 * dissolution was offered staple fibre and filament as "explore products", which
 * is not a recommendation, it is noise — and noise in a related block teaches a
 * reader that the site's links mean nothing.
 *
 * So each article declares its own set, and every edge below is traceable to a
 * relation the repository already records rather than to a keyword match:
 *
 * - `docs/agent-team/PAGE-INTENT-OWNERSHIP.md:38-44` names each article's
 *   supporting URLs — "20°C-vs-90°C, testing, and 20°C procurement answers" for
 *   the dissolution guide, "Factory-audit and Quality pages" for batch
 *   consistency, "Buyer-decision answer, product pages" for staple vs filament.
 * - `src/content/answer-expanded.ts:97-100` (and its Chinese twin at 176-179)
 *   already links the manufacturer-comparison answer to the dissolution guide and
 *   the specification checklist, so those two reciprocals close a loop that was
 *   open on one side.
 * - Each answer's own `relatedProduct` field supplies its product edge; nothing
 *   here assigns an answer to a product it does not already claim.
 *
 * Two buckets are deliberately empty across the shipped set. `applications` has
 * no article↔application edge anywhere in the model to inherit, and inventing one
 * would be a claim about which processes this guidance covers — out of scope for
 * an infrastructure change. `articles` carries only the guide/batch-consistency
 * pair, which share the endpoint vocabulary the ownership map already groups.
 */

/**
 * Slugs, not copy: four keys, so `isContentField` never mistakes a relationship
 * for body text and a promotion is never asked to translate one. Labels come from
 * `card-copy.ts` at render time, which is what keeps a localised card localised
 * without smuggling a second copy of the headline into this file.
 */
export type ArticleRelated = {
  readonly products: readonly string[];
  readonly applications: readonly string[];
  readonly answers: readonly string[];
  readonly articles: readonly string[];
};

const NONE: readonly string[] = [];

const ARTICLE_RELATED: Record<string, ArticleRelated> = {
  "pva-yarn-dissolution-temperature-guide": {
    products: ["water-soluble-pva-yarn"],
    applications: NONE,
    // Ownership map row 40: "20°C-vs-90°C, testing, and 20°C procurement answers".
    answers: [
      "20c-vs-90c-pva-yarn-difference",
      "test-pva-yarn-dissolution-temperature",
      "20c-cold-water-soluble-pva-yarn-bulk-supplier",
      "best-pva-water-soluble-yarn-manufacturers-china",
    ],
    articles: ["pva-batch-dissolution-consistency"],
  },
  "pva-batch-dissolution-consistency": {
    products: ["water-soluble-pva-yarn"],
    applications: NONE,
    // Ownership map row 42: "Factory-audit and Quality pages". `/quality` is
    // already in the site nav and footer, so only the answer edge is declared here.
    answers: ["factory-audit-checklist-water-soluble-yarn-mill", "test-pva-yarn-dissolution-temperature"],
    articles: ["pva-yarn-dissolution-temperature-guide"],
  },
  "pva-yarn-buyer-specification-checklist": {
    products: ["water-soluble-pva-yarn"],
    applications: NONE,
    // Reciprocal of answer-expanded.ts:99, which already links here.
    answers: ["best-pva-water-soluble-yarn-manufacturers-china"],
    articles: NONE,
    // Ownership map row 44 lists only transactional pages (quote, sample, Finder),
    // which the article's own CTA aside already provides.
  },
  "pva-staple-fiber-vs-filament-yarn": {
    // Ownership map row 43: "Buyer-decision answer, product pages".
    products: ["pva-staple-fiber", "pva-filament-yarn"],
    applications: NONE,
    answers: ["pva-staple-fiber-vs-filament-yarn-difference"],
    articles: NONE,
  },
};

/**
 * Which articles a product page recommends.
 *
 * `src/components/product/product-view.tsx:52` takes `articles.slice(0, 2)`, so
 * all four product pages currently advertise the dissolution guide and the
 * specification checklist regardless of format. The yarn page is right by
 * accident; the two fibre pages are not.
 */
const PRODUCT_ARTICLES: Record<string, readonly string[]> = {
  "water-soluble-pva-yarn": ["pva-yarn-dissolution-temperature-guide", "pva-yarn-buyer-specification-checklist"],
  // The comparison names both forms, so it is the reading that belongs on each.
  "pva-staple-fiber": ["pva-staple-fiber-vs-filament-yarn"],
  "pva-filament-yarn": ["pva-staple-fiber-vs-filament-yarn"],
  // Sewing thread has no article written about it yet. Showing the yarn guide
  // there was the old fallback; an empty list is the honest current state.
  "water-soluble-pva-sewing-thread": NONE,
};

const knownProducts = new Set(products.map((product) => product.slug));
const knownApplications = new Set(applications.map((application) => application.slug));
const knownAnswers = new Set(buyerAnswers.map((answer) => answer.slug));

/**
 * Throws rather than defaulting. An article with no declared set is a page that
 * silently loses its navigation, which is the failure this file exists to fix —
 * the same bet `card-copy.ts:182` makes with `no article teaser for "<slug>"`.
 */
export function relatedFor(slug: string): ArticleRelated {
  const related = ARTICLE_RELATED[slug];
  if (!related) {
    throw new Error(
      `article-related: "${slug}" has no related set. Every article must declare one, even an ` +
        `explicitly empty one: the article template renders this instead of "all four products plus ` +
        `the other three articles", so an absent entry means a page loses its navigation without a ` +
        `build failure to notice it by.`,
    );
  }
  return related;
}

/** Articles for a product page. An unlisted product shows none, on purpose. */
export function articlesForProduct(slug: string): readonly string[] {
  return PRODUCT_ARTICLES[slug] ?? NONE;
}

/**
 * Cross-checks every declared edge against the live content arrays, once, at
 * module load. A renamed or retired slug therefore stops the prerender with the
 * offending pair named, instead of rendering a card that resolves to nothing.
 */
export function assertArticleRelated(knownArticleSlugs: readonly string[]): void {
  const articles = new Set(knownArticleSlugs);
  const checked = [
    ["product", knownProducts],
    ["application", knownApplications],
    ["answer", knownAnswers],
  ] as const;

  for (const slug of knownArticleSlugs) {
    const related = relatedFor(slug);
    if (related.articles.includes(slug)) {
      throw new Error(`article-related: ${slug} lists itself as related reading.`);
    }
    for (const [kind, known] of checked) {
      const slugs = kind === "product" ? related.products : kind === "application" ? related.applications : related.answers;
      for (const target of slugs) {
        if (!known.has(target)) {
          throw new Error(
            `article-related: ${slug} points at ${kind} "${target}", which no longer exists. ` +
              `Fix the edge or drop it; do not leave a link that resolves to a 404.`,
          );
        }
      }
    }
    for (const target of related.articles) {
      if (!articles.has(target)) {
        throw new Error(`article-related: ${slug} points at article "${target}", which no longer exists.`);
      }
    }
  }

  for (const [product, articleSlugs] of Object.entries(PRODUCT_ARTICLES)) {
    if (!knownProducts.has(product)) {
      throw new Error(`article-related: product "${product}" no longer exists.`);
    }
    for (const target of articleSlugs) {
      if (!articles.has(target)) {
        throw new Error(`article-related: ${product} recommends article "${target}", which no longer exists.`);
      }
    }
  }
}
