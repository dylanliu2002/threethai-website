import { localePath, locales, type Locale } from "./company";

/**
 * Locale routing policy — the single place that answers "which locale serves
 * this request, and at which path?".
 *
 * `src/proxy.ts` is the only consumer and keeps just the Next-facing plumbing
 * (redirect responses, the preference cookie). Keeping the decision pure means
 * the precedence order below is assertable without a Next runtime, which is how
 * the GSC-LOCALE-003A regressions stay pinned.
 *
 * English owners are prefix-free by design (`localePath(path, "en")` from
 * ./company), so `hreflang=en`, `x-default`, every sitemap owner and every
 * fallback-copy target all resolve to the unprefixed URL. GSC-LOCALE-003
 * measured that this is also the only URL form the proxy was allowed to
 * relocate, so those declared URLs resolved differently per requester.
 */

/** Browser preference persisted after a visitor chooses a site language. */
export const LOCALE_COOKIE = "threethai_locale";
/** One-time language-switch hint, removed before the destination renders. */
export const LOCALE_PARAM = "_locale";
/** Status for the `/en` safety alias; locale moves stay temporary. */
export const PERMANENT_REDIRECT_STATUS = 308;

/**
 * Visitor locale is chosen from explicit signals ONLY, in this order:
 *   1. `?_locale=` (the language picker's one-time hint)
 *   2. the URL's own locale prefix
 *   3. a valid saved preference cookie
 *   4. otherwise English, served directly at its prefix-free owner
 *
 * Request geography is deliberately not an input: no CDN country header and no
 * client IP may relocate a declared owner URL. `GSC-LOCALE-003A` removed the
 * former CN/HK → `zh` first-visit default for that reason. A future
 * "prefer the Chinese version?" affordance must stay user-visible and
 * non-blocking, and must not become a forced redirect here.
 */
export type RoutingDecision =
  | {
      kind: "serve";
      locale: Locale;
      target: string;
      /** `null` means leave the stored preference untouched. */
      persist: Locale | null;
    }
  | {
      kind: "redirect";
      locale: Locale;
      target: string;
      persist: Locale;
      permanent: boolean;
      stripLocaleParam: boolean;
    };

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

/**
 * Locale carried by the URL itself. English is intentionally invisible as a
 * prefix, so a leading `en` is NOT a page locale — see `englishAliasOf`.
 */
export function localeFromPathname(pathname: string): Locale | undefined {
  const segment = pathname.split("/")[1];
  return segment === "en" ? undefined : isLocale(segment) ? segment : undefined;
}

/** `/es/answers` → `/answers`; anything unprefixed or unknown is unchanged. */
export function withoutLocalePrefix(pathname: string): string {
  const locale = localeFromPathname(pathname);
  if (!locale) return pathname;
  const pathWithoutPrefix = pathname.slice(locale.length + 1);
  return pathWithoutPrefix || "/";
}

/**
 * The `/en` safety alias: `en` names no route, so any request whose first path
 * segment is exactly `en` belongs to the prefix-free English owner.
 *
 * Returns the English destination, or `null` when the path is not an alias.
 * The segment must match exactly, so an ordinary route that merely starts with
 * the letters (`/encyclopedia`) is never rewritten; trailing slashes are
 * collapsed here so the alias cannot chain into Next's own normalisation.
 */
export function englishAliasOf(pathname: string): string | null {
  const segments = pathname.split("/");
  if (segments[1] !== "en") return null;
  const remainder = `/${segments.slice(2).join("/")}`;
  return remainder.length > 1 ? remainder.replace(/\/+$/, "") : "/";
}

/**
 * Decide how to answer a request. Pure: same input always yields the same
 * output, independent of geography, user agent or cookie support.
 */
export function routeFor(input: {
  pathname: string;
  selectedLocale?: string | null;
  savedLocale?: string | null;
}): RoutingDecision {
  const { pathname, savedLocale } = input;
  const alias = englishAliasOf(pathname);

  // 1 · Explicit language picker. The prefix is swapped for the chosen locale,
  // so `/zh/answers?_locale=en` lands on the English owner and nothing else.
  if (isLocale(input.selectedLocale)) {
    const chosen = input.selectedLocale;
    return {
      kind: "redirect",
      locale: chosen,
      target: localePath(withoutLocalePrefix(alias ?? pathname), chosen),
      persist: chosen,
      permanent: false,
      stripLocaleParam: true,
    };
  }

  // 2 · `/en` safety alias. Permanent, and its destination is always the
  // existing prefix-free English owner: this never creates an English-prefixed
  // page, and no such URL is ever advertised or entered in the sitemap.
  if (alias !== null) {
    return {
      kind: "redirect",
      locale: "en",
      target: alias,
      persist: "en",
      permanent: true,
      stripLocaleParam: false,
    };
  }

  // 3 · A prefixed URL already states its locale, so it is never relocated.
  // The cookie only records what the URL already proves.
  const pathLocale = localeFromPathname(pathname);
  if (pathLocale) {
    return {
      kind: "serve",
      locale: pathLocale,
      target: pathname,
      persist: savedLocale === pathLocale ? null : pathLocale,
    };
  }

  // 4 · An unprefixed URL with a valid saved preference follows that choice —
  // a real selection, which is what distinguishes it from the removed geo rule.
  if (isLocale(savedLocale)) {
    if (savedLocale === "en") {
      return { kind: "serve", locale: "en", target: pathname, persist: null };
    }
    return {
      kind: "redirect",
      locale: savedLocale,
      target: localePath(pathname, savedLocale),
      persist: savedLocale,
      permanent: false,
      stripLocaleParam: false,
    };
  }

  // 5 · No explicit signal: English, in place. Persisting `en` only records the
  // locale actually served; no geography-derived preference is ever written.
  return { kind: "serve", locale: "en", target: pathname, persist: "en" };
}
