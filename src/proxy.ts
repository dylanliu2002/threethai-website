import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Locale } from "@/content/company";
import {
  LOCALE_COOKIE,
  LOCALE_PARAM,
  PERMANENT_REDIRECT_STATUS,
  routeFor,
} from "@/content/locale-routing";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function persistLocale(response: NextResponse, locale: Locale | null): NextResponse {
  // `null` is the decision "this request may not record a language choice", so the
  // stored preference keeps whatever the visitor last chose for themselves.
  if (locale === null) return response;
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
 * Did a person ask for this document, or did the page ask for something itself?
 *
 * The router does not only fetch pages the visitor navigated to: everything on
 * screen is prefetched, and every one of those background requests used to run
 * the same preference write as a page load, on behalf of a visitor who had
 * clicked nothing. Since the stored preference decides which locale serves the
 * next *unprefixed* URL, that is how a visitor who had just switched to English
 * was sent back to German by clicking an in-site link.
 *
 * Fetch Metadata is the only signal that survives far enough to be asked. On the
 * Node.js runtime this app is served from, Next deletes its own router markers
 * from the request *before* the proxy runs: the five `FLIGHT_HEADERS` — `RSC`,
 * `Next-Router-Prefetch`, `Next-Router-State-Tree`, `Next-HMR-Refresh` and
 * `Next-Router-Segment-Prefetch` — out of the headers ("Headers should only be
 * stripped for middleware", `next/dist/server/web/adapter.js`), and `_rsc` out of
 * the query string (`server/internal-utils.js`). A guard written against any of
 * them can never fire, however the request was made: measured against the
 * standalone server, `RSC: 1`, `Next-Router-Prefetch: 1` and `?_rsc=…` each
 * arrive looking exactly like a page load, while `Sec-Fetch-Dest` is still there
 * to answer — which is why this asks Fetch Metadata and nothing else.
 *
 * `empty` is what a browser reports for a request the page made for itself, and
 * every request the client router makes is one, so that single value withholds
 * the write. Everything else — a navigation, and a client too old to send Fetch
 * Metadata at all — is a document the visitor asked for, and keeps the behaviour
 * it already had.
 */
function isDocumentNavigation(request: NextRequest): boolean {
  return request.headers.get("sec-fetch-dest") !== "empty";
}

/**
 * Applies the locale routing policy in `src/content/locale-routing.ts` and
 * carries out its decision: serve in place, or redirect. Which locale wins, at
 * which path, and whether the answer may record a choice is decided there —
 * never here — so the precedence order stays assertable without a Next runtime.
 * All this file adds is the one thing the policy cannot see for itself: whether
 * the request came from a person or from the visitor's own prefetcher.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const decision = routeFor({
    pathname: url.pathname,
    selectedLocale: url.searchParams.get(LOCALE_PARAM),
    savedLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    documentRequest: isDocumentNavigation(request),
  });

  if (decision.kind === "serve") {
    const response = NextResponse.next();
    return persistLocale(response, decision.persist);
  }

  if (decision.stripLocaleParam) url.searchParams.delete(LOCALE_PARAM);
  url.pathname = decision.target;
  const response = NextResponse.redirect(
    url,
    decision.permanent ? PERMANENT_REDIRECT_STATUS : undefined
  );
  return persistLocale(response, decision.persist);
}

export const config = {
  // Static assets, API endpoints and legacy .html URLs bypass the proxy.
  // The latter continue to use the permanent redirects in next.config.ts.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
