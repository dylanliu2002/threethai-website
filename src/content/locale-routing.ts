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
 * Locales retired by owner decision (`LOCALE-RETIRE-001`): the site maintains
 * EN/ZH/ES/DE and nothing else. These codes are not locales — `isLocale`
 * rejects them, so they render no page, are advertised by no SEO surface, and
 * can never be persisted as a preference.
 *
 * They are still named here because a retired code has to be *recognised* to be
 * consolidated in one hop. Treating `/pt/products/x` as an unknown path would
 * return 404 and throw away every ranking signal GSC-INDEX-002 consolidated
 * onto the English owner, while an unsupported code that was never published
 * (`/fr/...`) must keep its normal 404.
 */
export const retiredLocales = ["pt", "ru", "ar", "tr", "vi", "id"] as const;

export type RetiredLocale = (typeof retiredLocales)[number];

/**
 * Visitor locale is chosen from explicit signals ONLY, in this order:
 *   1. `?_locale=` (the language picker's one-time hint), if it names a
 *      supported locale
 *   2. a retired locale prefix or the `/en` alias, permanently consolidated
 *      onto the prefix-free English owner
 *   3. a retired `?_locale=` hint, stripped rather than honoured
 *   4. the URL's own locale prefix
 *   5. a valid saved preference cookie
 *   6. otherwise English, served directly at its prefix-free owner
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
 * Is this value one of the six retired locale codes? Retired codes are not
 * locales and must never be coerced into one: this is what stops a stale
 * `?_locale=pt` or `threethai_locale=pt` from selecting a retired route.
 */
export function isRetiredLocale(value: string | null | undefined): value is RetiredLocale {
  return value != null && (retiredLocales as readonly string[]).includes(value);
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
 *
 * Resolution is shared with `englishOwnerOf`, so a nested form (`/en/pt/x`)
 * reports the owner it actually reaches rather than a half-resolved path.
 */
export function englishAliasOf(pathname: string): string | null {
  if (pathname.split("/")[1] !== "en") return null;
  return englishOwnerOf(pathname);
}

/**
 * Retired locale carried by a URL prefix, for the single segment that `LOCALE-
 * RETIRE-001` took out of service (`/pt/answers` → `pt`). Returns `undefined`
 * for supported, English-prefixed and unknown paths alike.
 */
export function retiredLocaleOfPathname(pathname: string): RetiredLocale | undefined {
  const segment = pathname.split("/")[1];
  return isRetiredLocale(segment) ? segment : undefined;
}

/**
 * `true` when the path's leading segment names a locale that owns no page any
 * more — the `/en` safety alias or one of the six retired prefixes. Both are
 * answered with a single permanent hop onto `englishOwnerOf`.
 *
 * The test is on the leading segment rather than on a string compare with the
 * owner, because normalising and consolidating are different things: `/answers/`
 * also differs from its owner string, but it is the English owner and must keep
 * the trailing-slash behaviour it had before this task.
 */
export function needsEnglishConsolidation(pathname: string): boolean {
  const segment = pathname.split("/")[1];
  return segment === "en" || isRetiredLocale(segment);
}

/**
 * The prefix-free English owner of any path. `/en` and retired prefixes resolve
 * in one pass, so a nested or repeated form (`/pt/en/answers`,
 * `/en/pt/answers`) reaches `/answers` in a single hop instead of chaining a
 * second redirect through an intermediate that is itself retired.
 */
export function englishOwnerOf(pathname: string): string {
  let rest = pathname.split("/").slice(1);
  while (rest.length > 0 && (rest[0] === "en" || isRetiredLocale(rest[0]))) {
    rest = rest.slice(1);
  }
  const remainder = `/${rest.join("/")}`;
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
  const consolidates = needsEnglishConsolidation(pathname);
  const owner = englishOwnerOf(pathname);

  // 1 · Explicit language picker. The prefix is swapped for the chosen locale,
  // so `/zh/answers?_locale=en` lands on the English owner and nothing else. A
  // retired prefix is resolved first, so `/pt/answers?_locale=es` becomes
  // `/es/answers` rather than the nonsense path `/es/pt/answers`.
  if (isLocale(input.selectedLocale)) {
    const chosen = input.selectedLocale;
    return {
      kind: "redirect",
      locale: chosen,
      target: localePath(withoutLocalePrefix(consolidates ? owner : pathname), chosen),
      persist: chosen,
      permanent: false,
      stripLocaleParam: true,
    };
  }

  // 2 · The `/en` safety alias and the six retired locale prefixes. Permanent,
  // one hop, and their destination is always the existing prefix-free English
  // owner: this never creates a page at `/en/…` or `/pt/…`, and no such URL is
  // ever advertised or entered in the sitemap. Retiring a locale must not
  // 404 a URL that GSC-INDEX-002 spent its consolidation pointing at English.
  //
  // `persist` records the locale actually served, which is also what replaces a
  // stale `threethai_locale=pt`; leaving the cookie alone would let a retired
  // preference resurface on the visitor's next unprefixed request.
  if (consolidates) {
    return {
      kind: "redirect",
      locale: "en",
      target: owner,
      persist: "en",
      permanent: true,
      // Unrelated query parameters survive the hop untouched. Only a retired
      // `?_locale` hint is dropped here, so a bookmark like
      // `/pt/answers?_locale=pt` cannot arrive at a URL that redirects again.
      stripLocaleParam: isRetiredLocale(input.selectedLocale),
    };
  }

  // 3 · A retired `?_locale` hint cannot select a retired locale. The misleading
  // selector is stripped and the signals underneath it decide: the URL's own
  // prefix, then a still-valid saved preference, then English in place. Because
  // the destination carries no `_locale`, the stale cookie is rewritten with a
  // supported locale on the following request.
  if (isRetiredLocale(input.selectedLocale)) {
    const locale = localeFromPathname(pathname) ?? (isLocale(savedLocale) ? savedLocale : "en");
    return {
      kind: "redirect",
      locale,
      target: localePath(withoutLocalePrefix(pathname), locale),
      persist: locale,
      permanent: false,
      stripLocaleParam: true,
    };
  }

  // 4 · A prefixed URL already states its locale, so it is never relocated.
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

  // 5 · An unprefixed URL with a valid saved preference follows that choice —
  // a real selection, which is what distinguishes it from the removed geo rule.
  // A retired value is not a locale at all (`isLocale` rejects it), so a stale
  // `threethai_locale=pt` never relocates the visit; it falls through to English
  // below, where the served locale overwrites it.
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

  // 6 · No usable signal: English, in place. Persisting `en` only records the
  // locale actually served; no geography-derived preference is ever written.
  return { kind: "serve", locale: "en", target: pathname, persist: "en" };
}
