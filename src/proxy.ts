import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Browser preference persisted after a visitor chooses a site language. */
const LOCALE_COOKIE = "threethai_locale";
/** One-time language-switch hint, removed before the destination page renders. */
const LOCALE_PARAM = "_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const locales = ["en", "zh", "es", "pt", "ru", "ar", "tr", "vi", "id", "de"] as const;
type Locale = (typeof locales)[number];

const geoCountryHeaders = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
] as const;

function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

function localeFromPathname(pathname: string): Locale | undefined {
  const segment = pathname.split("/")[1];
  return segment === "en" ? undefined : isLocale(segment) ? segment : undefined;
}

function localePath(pathname: string, locale: Locale): string {
  if (locale === "en") return pathname;
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

function withoutLocalePrefix(pathname: string): string {
  const locale = localeFromPathname(pathname);
  if (!locale) return pathname;
  const pathWithoutPrefix = pathname.slice(locale.length + 1);
  return pathWithoutPrefix || "/";
}

function defaultLocale(request: NextRequest): Locale {
  const country = geoCountryHeaders
    .map((header) => request.headers.get(header)?.toUpperCase())
    .find(Boolean);

  // CN = mainland China; HK = Hong Kong. Other locations keep English as the
  // first-visit default until the visitor explicitly selects another language.
  return country === "CN" || country === "HK" ? "zh" : "en";
}

function persistLocale(response: NextResponse, locale: Locale): NextResponse {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

/**
 * Sets the initial language from the visitor's country and keeps an explicit
 * language choice across unprefixed links, legacy redirects and future visits.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const selectedLocale = url.searchParams.get(LOCALE_PARAM);

  // The language picker uses this one-time marker so switching from a
  // prefixed locale back to English can override an existing locale cookie.
  if (isLocale(selectedLocale)) {
    url.searchParams.delete(LOCALE_PARAM);
    url.pathname = localePath(withoutLocalePrefix(url.pathname), selectedLocale);
    return persistLocale(NextResponse.redirect(url), selectedLocale);
  }

  const pathLocale = localeFromPathname(url.pathname);
  if (pathLocale) {
    const response = NextResponse.next();
    return request.cookies.get(LOCALE_COOKIE)?.value === pathLocale
      ? response
      : persistLocale(response, pathLocale);
  }

  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(savedLocale) ? savedLocale : defaultLocale(request);

  if (locale !== "en") {
    url.pathname = localePath(url.pathname, locale);
    return persistLocale(NextResponse.redirect(url), locale);
  }

  const response = NextResponse.next();
  return savedLocale === "en" ? response : persistLocale(response, "en");
}

export const config = {
  // Static assets, API endpoints and legacy .html URLs bypass the proxy.
  // The latter continue to use the permanent redirects in next.config.ts.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
