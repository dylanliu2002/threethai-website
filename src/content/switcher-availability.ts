import type { Locale } from "./company";
import { localizedLocalesFor, TRANSLATED_CONTENT_LOCALES } from "./availability";
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
 * ## The shape: `baseline` plus per-path answers
 *
 * `baseline` is `TRANSLATED_CONTENT_LOCALES` — the locales whose body copy the
 * content model itself carries, so they own *every* page by construction rather
 * than by evidence. `exceptions` lists the paths the policy answers with more
 * than that, and each entry is a complete answer, not an increment. A path with
 * no entry therefore resolves to `baseline`, which is the model-guaranteed
 * answer for every page, so an unlisted path cannot be over-claimed; it simply
 * cannot gain a promotion it has no evidence for. That replaces an earlier
 * encoding whose default was the *modal* answer across the inventory, which
 * would have let a future majority of promoted ES/DE pages advertise `es` on a
 * page no evidence covers — the fail-open direction this whole line of work
 * exists to refuse (GSC-INDEX-002: 75 "Duplicate, Google chose different
 * canonical" entries from advertising a locale the copy does not carry).
 *
 * ## Encoding history, measured rather than assumed
 *
 * Two alternatives were built and rejected on numbers, not taste:
 *
 * - **Complete `path → locales` map** (55 entries): fell the bundle by the same
 *   amount but grew **every** document by +3,210 B raw / +800 B gzip (+4.5 % of
 *   total HTML), because RSC serializes props into each page's own payload. That
 *   spends ~800 gzip bytes on every page view to save 586 once on a cached
 *   chunk, so it is the wrong side of the trade.
 * - **Modal `common` plus exceptions**: smallest today, but its default is
 *   content-dependent (fail-open, above) and its payload is **non-monotonic** in
 *   adoption — measured by replaying the derivation over synthetic registries,
 *   22 of 43 deep pages promoted cost 1,476 B and peaked near the tipping point,
 *   then *fell* to 1,079 B at 32 of 43 once the mode flipped. A size that goes
 *   down as translations increase is not a property anyone can budget against.
 *
 * This shape is monotonic: one entry per promoted path, nothing else. It starts
 * at 38 bytes with zero promotions and reaches roughly the complete map's size
 * only when nearly every page is promoted — at which point the complete map is
 * no longer a worse choice and the comparison is moot. Nothing here is a
 * constant the content team has to stay under; `tests/intl-dees-003b-*` guards
 * the *structure* (an exception that adds nothing is a path-map regression)
 * rather than a byte ceiling that legitimate translations would trip.
 *
 * `tests/intl-dees-003b-server-client-boundary.mjs` pins the contract: every
 * value equals the policy's own answer, no ownership string reaches
 * `.next/static/chunks`, and every prerendered switcher document resolves to an
 * inventoried path.
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
 * What the browser is allowed to know about ownership: the locales the content
 * model guarantees on every page, plus the complete answer for each path the
 * policy resolves beyond it. Strings and arrays of strings only — no functions,
 * no live reference to the policy, nothing this component can extend on its own.
 */
export type SwitcherAvailability = {
  readonly baseline: readonly Locale[];
  readonly exceptions: Readonly<Record<string, readonly Locale[]>>;
};

/** The policy's own answer for one path, as a plain array. */
const answerFor = (path: string): readonly Locale[] => [...localizedLocalesFor(path)];

/**
 * The locales that own every page without evidence, because the content model
 * carries their copy (`ContentLocale`). Taken from the policy module's derived
 * export rather than written here, so a change to the content model — not a
 * literal in this file — is what moves it.
 */
const baseline: readonly Locale[] = [...TRANSLATED_CONTENT_LOCALES];

const baselineKey = baseline.join(",");

export const SWITCHER_AVAILABILITY: SwitcherAvailability = {
  baseline,
  exceptions: Object.fromEntries(
    SWITCHER_PATHS
      .map((path): [string, readonly Locale[]] => [path, answerFor(path)])
      .filter(([, list]) => list.join(",") !== baselineKey),
  ),
};
