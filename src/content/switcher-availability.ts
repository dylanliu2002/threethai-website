import type { Locale } from "./company";
import { localizedLocalesFor } from "./availability";
import { applications } from "./applications";
import { buyerAnswers } from "./answers";
import { articles } from "./articles";
import { products } from "./products";

/**
 * Server-resolved availability for client surfaces — the serialization boundary.
 *
 * INTL-DEES-003A made ES/DE ownership an evidence decision, and INTL-DEES-002B
 * made that decision answerable by one call, `localizedLocalesFor`. The language
 * switcher needs that answer to decide whether a link may carry `hreflang`/`lang`
 * (GSC-INDEX-002), and until now it asked the policy directly from a `"use
 * client"` component. The consequence was measured, not assumed: the whole
 * evidence gate — `TRANSLATED_PAGES`, `approvedPromotions()`,
 * `evidenceDecisionFor()` and every reason literal it carries — was reachable
 * from the browser and shipped there (+1,684 B raw / +586 B gzip of a chunk
 * loaded by 220 of 222 documents), doing work a browser has no business doing
 * and no authority to redo.
 *
 * This module is the only bridge. It runs **on the server**, asks the policy for
 * every path the header can appear on, and hands the client plain data. The
 * browser receives answers and never the rule that produced them, so ownership
 * stays decided in exactly one place while the switcher keeps gating `hreflang`
 * exactly as GSC-INDEX-002 requires.
 *
 * The encoding is `common` + `exceptions`, measured into existence. The first
 * version shipped the complete `path → locales` map and cost **+3,210 B raw /
 * +800 B gzip per document** (222 documents, +4.5 % of total HTML) to save 586 B
 * gzip once on a chunk browsers cache across the visit — the wrong side of the
 * trade. `common` is the policy's own modal answer, computed here rather than
 * written down, so nothing in the client states which locales a page defaults to:
 * a new promotion moves one path into `exceptions`, a change to the content
 * model moves `common`, and the header re-renders with no edit. `common` is also
 * the fallback for a path this inventory does not list, which is what the policy
 * itself answered for such a path before the boundary existed.
 *
 * `tests/intl-dees-003b-server-client-boundary.mjs` pins both halves: no
 * ownership string reaches `.next/static/chunks`, and every `common`/`exceptions`
 * entry equals the policy's answer for its path.
 */

/**
 * Every prefix-free path whose document renders the header, and therefore the
 * switcher. Derived from the same content modules the routes and the sitemap
 * enumerate, not restated as a literal, so a new product, application, article
 * or buyer answer is covered the moment it exists in the content model.
 */
export const SWITCHER_PATHS: readonly string[] = [
  "/",
  "/products",
  ...products.map(({ slug }) => `/products/${slug}`),
  "/applications",
  ...applications.map(({ slug }) => `/applications/${slug}`),
  "/knowledge",
  ...articles.map(({ slug }) => `/knowledge/${slug}`),
  "/answers",
  ...buyerAnswers.map(({ slug }) => `/answers/${slug}`),
  "/manufacturing",
  "/quality",
  "/about",
  "/contact",
  "/request-quote",
  "/request-sample",
  "/product-finder",
];

/**
 * What the browser is allowed to know about ownership: the policy's most common
 * answer, plus the paths the policy answers differently. Strings and arrays of
 * strings only — no functions, no live reference to the policy.
 */
export type SwitcherAvailability = {
  readonly common: readonly Locale[];
  readonly exceptions: Readonly<Record<string, readonly Locale[]>>;
};

/** The answer for one path, straight from the availability policy. */
const answerFor = (path: string): readonly Locale[] => [...localizedLocalesFor(path)];

/**
 * The modal answer across the inventory — chosen by frequency, ties broken by
 * first appearance in `SWITCHER_PATHS` so the value is deterministic. This is
 * data derived from the policy, never a locale list written into this file.
 */
const modalAnswer = (answers: ReadonlyMap<string, readonly Locale[]>): readonly Locale[] => {
  const counts = new Map<string, { locales: readonly Locale[]; seen: number; hits: number }>();
  let seen = 0;
  for (const locales of answers.values()) {
    const key = locales.join(",");
    const entry = counts.get(key);
    if (entry) entry.hits++;
    else counts.set(key, { locales, seen: seen, hits: 1 });
    seen++;
  }
  return [...counts.values()]
    .sort((a, b) => b.hits - a.hits || a.seen - b.seen)[0]!
    .locales;
};

const answers = new Map(SWITCHER_PATHS.map((path) => [path, answerFor(path)]));
const common = modalAnswer(answers);
const commonKey = common.join(",");

const exceptions = Object.fromEntries(
  SWITCHER_PATHS.filter((path) => answerFor(path).join(",") !== commonKey).map((path) => [
    path,
    answers.get(path)!,
  ]),
);

export const SWITCHER_AVAILABILITY: SwitcherAvailability = { common, exceptions };
