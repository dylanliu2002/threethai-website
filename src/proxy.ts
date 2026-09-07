import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_PARAM,
  PERMANENT_REDIRECT_STATUS,
  routeFor,
} from "@/content/locale-routing";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function persistLocale(response: NextResponse, locale: string): NextResponse {
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
 * Applies the locale routing policy in `src/content/locale-routing.ts` and
 * carries out its decision: serve in place, or redirect. Which locale wins, and
 * at which path, is decided there — never here — so the precedence order stays
 * assertable without a Next runtime.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const decision = routeFor({
    pathname: url.pathname,
    selectedLocale: url.searchParams.get(LOCALE_PARAM),
    savedLocale: request.cookies.get(LOCALE_COOKIE)?.value,
  });

  if (decision.kind === "serve") {
    const response = NextResponse.next();
    return decision.persist === null ? response : persistLocale(response, decision.persist);
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
