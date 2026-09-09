import { locales, type Locale } from "./company";

/**
 * Which site language a browser's preferences point at — a suggestion only.
 *
 * This answers "would this visitor probably rather read another of our four
 * languages?", and nothing else. It is deliberately not part of ./locale-routing:
 * that module decides which locale *serves a URL*, and GSC LOCALE-003A removed its
 * last browser-signal rule because a declared owner URL that answered differently
 * per requester produced 75 "Duplicate, Google chose different canonical" entries.
 * A visitor's own `navigator.languages` exists only in the browser, so it can
 * inform a dismissible notice and can never move a URL Google is told something
 * about.
 *
 * The second reason this file stands alone is the bundle. Its consumer is a
 * `"use client"` component, so anything it imports becomes live browser code —
 * importing `isLocale` from ./locale-routing would drag the translation gate, with
 * its reason strings and promotion registry, into every chunk, which is the leak
 * INTL-DEES-003B measured and removed. A two-line predicate is the price of that
 * boundary and is paid here on purpose.
 *
 * Kept as a pure function of a string list so the mapping is assertable without a
 * DOM: `["de-AT", "en"]` → `de`, `["fr-FR"]` → null, and never the locale the
 * reader is already on.
 */
const supported: readonly string[] = locales;

const isSupportedLocale = (value: string): value is Locale => supported.includes(value);

export function suggestedLocaleFor(
  preferred: readonly string[],
  current: Locale,
): Locale | null {
  for (const entry of preferred) {
    const code = entry.trim().split("-")[0].toLowerCase();
    if (code === current) continue;
    if (isSupportedLocale(code)) return code;
  }
  return null;
}

/**
 * `/de/products/x` → `/products/x`, `/` → `/`.
 *
 * The same strip ./locale-routing performs for its own decisions, restated rather
 * than imported for the bundle reason above. A retired code is not a locale, so
 * `/pt/products` is left alone: the notice has nothing to offer for a retired
 * language and must not invent a route for one.
 */
export function pathWithoutLocale(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (!isSupportedLocale(segment) || segment === "en") return pathname || "/";
  const rest = pathname.slice(segment.length + 1);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/**
 * The cookie the language picker writes (see ./locale-routing). A visitor who has
 * already chosen a language has told us what they want, so the notice must not
 * argue with that choice on every page.
 */
export const CHOSEN_LOCALE_COOKIE = "threethai_locale";

/** Where the dismissal is remembered. localStorage, so no request carries it. */
export const DISMISSAL_STORAGE_KEY = "threethai.localeNotice.dismissed";
