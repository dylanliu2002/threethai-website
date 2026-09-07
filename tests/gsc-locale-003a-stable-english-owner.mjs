import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * GSC-LOCALE-003A — prefix-free English owners must be stable for every
 * requester.
 *
 * The defect was not the English URL strings (correct, and unchanged here) but
 * the fact that the unprefixed owner was the one URL form the locale proxy was
 * allowed to relocate: a cookieless request whose CDN country header read CN or
 * HK got `307 → /zh/…`. Because `localePath(path, "en")` is prefix-free, that
 * same relocating URL is what every `hreflang=en`, every `x-default`, every
 * sitemap owner and all 344 GSC-INDEX-002 fallback targets point at.
 *
 * `routeFor` in src/content/locale-routing.ts is the whole policy, and it takes
 * exactly three inputs: the explicit `?_locale` hint, the URL's own prefix, and
 * a valid saved preference. Geography and user agent are not inputs at all,
 * which is what makes "stable regardless of geography" a structural property
 * rather than a hoped-for one. Each test names the requirement it pins.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

/**
 * Strip comments so a prose mention of a removed rule cannot look like code.
 * Block comments plus comment-only lines: this repository keeps every comment on
 * its own line, so no trailing-comment handling is needed.
 */
const codeOnly = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const {
  PERMANENT_REDIRECT_STATUS,
  englishAliasOf,
  isLocale,
  localeFromPathname,
  routeFor,
  withoutLocalePrefix,
} = await importSource("src/content/locale-routing.ts");

const { dynamicLocales, htmlLang, localePath, locales, siteUrl } = await importSource("src/content/company.ts");
const {
  canonicalUrlFor,
  hreflangForPath,
  hreflangForRoute,
  isSitemapEligible,
} = await importSource("src/content/availability.ts");

const { products } = await importSource("src/content/products.ts");
const { applications } = await importSource("src/content/applications.ts");
const { articles } = await importSource("src/content/articles.ts");
const { buyerAnswers } = await importSource("src/content/answers.ts");

const FALLBACK_LOCALES = ["es", "pt", "ru", "ar", "tr", "vi", "id", "de"];

const DEEP_PATHS = [
  ...products.map(({ slug }) => `/products/${slug}`),
  ...applications.map(({ slug }) => `/applications/${slug}`),
  ...articles.map(({ slug }) => `/knowledge/${slug}`),
  ...buyerAnswers.map(({ slug }) => `/answers/${slug}`),
];

const CORE_PATHS = [
  "/",
  "/products",
  "/answers",
  "/quality",
  "/about",
  "/contact",
  "/request-quote",
  "/request-sample",
  "/product-finder",
  "/knowledge",
  "/applications",
  "/manufacturing",
];

/** Representative prefix-free English owners used across the requirements. */
const EN_OWNERS = ["/", "/products/water-soluble-pva-yarn", "/answers", "/quality", ...CORE_PATHS.slice(1)];

/** The removed signal. If any of these ever reappears, geo is back. */
const GEO_MARKERS = ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country", "geoCountry"];

assert.equal(FALLBACK_LOCALES.length, 8);
// Relational, not literal: the deep-content inventory grows with content work
// (GSC-LOCALE-003A's own base gained a business-fact correction to
// src/content/products.ts). What must stay pinned is that this suite covers
// every deep path the site actually renders, with the consolidated count as a
// floor rather than a hair trigger.
assert.equal(
  DEEP_PATHS.length,
  products.length + applications.length + articles.length + buyerAnswers.length,
  "deep-content inventory must cover every entity detail path"
);
assert.ok(
  DEEP_PATHS.length >= 43,
  `expected at least the 43 paths GSC-INDEX-002 consolidated, got ${DEEP_PATHS.length}`
);

// ---------------------------------------------------------------------------
// REQ 1 · 2 · 3 — a cookieless unprefixed request serves the English owner,
// whatever the request geography claims.
// ---------------------------------------------------------------------------
test("REQ 1-3: cookieless unprefixed requests serve English in place", () => {
  for (const pathname of EN_OWNERS) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "serve", `${pathname} must not redirect`);
    assert.equal(decision.locale, "en", pathname);
    assert.equal(decision.target, pathname, `${pathname} must be served as itself`);
  }
});

test("REQ 1-3: geography cannot be supplied to the routing decision at all", () => {
  assert.equal(routeFor.length, 1, "routeFor must accept exactly one input object");
  for (const pathname of EN_OWNERS) {
    // Extra properties are inert: a caller cannot reintroduce a geo override
    // by passing a country through the existing seam.
    assert.deepEqual(routeFor({ pathname, country: "CN" }), routeFor({ pathname }), "CN leaked in");
    assert.deepEqual(routeFor({ pathname, country: "HK" }), routeFor({ pathname }), "HK leaked in");
    assert.deepEqual(routeFor({ pathname, country: "US" }), routeFor({ pathname }), "US leaked in");
  }
});

test("REQ 1-3: no CDN country header or geo lookup survives in the routing layer", () => {
  for (const file of ["src/proxy.ts", "src/content/locale-routing.ts"]) {
    // Comments are allowed to name the removed rule (this file explains why it
    // was removed); only executable code must be free of it.
    const code = codeOnly(read(file));
    for (const marker of GEO_MARKERS) {
      assert.ok(!code.includes(marker), `${file} still reads ${marker}`);
    }
    assert.doesNotMatch(code, /\bCN\b/, `${file} still keys off CN`);
    assert.doesNotMatch(code, /\bHK\b/, `${file} still keys off HK`);
    assert.doesNotMatch(code, /defaultLocale/, `${file} reinstates a geo default`);
    assert.doesNotMatch(code, /x-forwarded-for/i, `${file} derives locale from the client IP`);
  }
});

// ---------------------------------------------------------------------------
// REQ 4 · 5 — crawlers are not special-cased, and cannot be relocated either.
// ---------------------------------------------------------------------------
test("REQ 4-5: user agent is not an input to locale routing", () => {
  for (const file of ["src/proxy.ts", "src/content/locale-routing.ts"]) {
    const source = read(file);
    assert.doesNotMatch(source, /user-agent/i, `${file} inspects the user agent`);
    assert.doesNotMatch(source, /\buserAgent\b/, `${file} inspects the user agent`);
    assert.doesNotMatch(source, /Googlebot|Bingbot|bot\b/i, `${file} branches on crawler identity`);
  }
  // Consequence: the English owner decision is byte-identical to a browser's.
  const browser = routeFor({ pathname: "/products/water-soluble-pva-yarn" });
  const spider = routeFor({ pathname: "/products/water-soluble-pva-yarn" });
  assert.deepEqual(spider, browser);
});

test("REQ 4-5: the English owner is never relocated to a Chinese prefix", () => {
  for (const pathname of EN_OWNERS) {
    const decision = routeFor({ pathname });
    assert.ok(
      !(decision.target ?? "").startsWith("/zh"),
      `${pathname} → ${decision.target}: crawler-visible English owner moved to Chinese`
    );
    assert.ok(!Object.values(decision).some((v) => typeof v === "string" && v.startsWith("/zh/")));
  }
});

// ---------------------------------------------------------------------------
// REQ 6 · 7 — an explicit saved preference still wins. The defect removed here
// is geo-inferred redirection, never a user's own choice.
// ---------------------------------------------------------------------------
test("REQ 6: an explicit zh preference still relocates an unprefixed request", () => {
  const decision = routeFor({ pathname: "/products/water-soluble-pva-yarn", savedLocale: "zh" });
  assert.equal(decision.kind, "redirect");
  assert.equal(decision.target, "/zh/products/water-soluble-pva-yarn");
  assert.equal(decision.locale, "zh");
  assert.equal(decision.permanent, false, "a locale move must stay temporary, never a 308");
  assert.equal(decision.persist, "zh");
});

test("REQ 7: every other explicit saved preference is honoured", () => {
  for (const locale of ["es", "de", "pt", "ru", "ar", "tr", "vi", "id"]) {
    const decision = routeFor({ pathname: "/answers", savedLocale: locale });
    assert.equal(decision.kind, "redirect", locale);
    assert.equal(decision.target, `/${locale}/answers`, locale);
    assert.equal(decision.permanent, false, `${locale} relocation must not be permanent`);
  }
  const english = routeFor({ pathname: "/answers", savedLocale: "en" });
  assert.equal(english.kind, "serve");
  assert.equal(english.target, "/answers");
  assert.equal(english.persist, null, "an already-correct English preference needs no re-write");
});

test("REQ 7: an unusable cookie value is not a preference and must not force a locale", () => {
  for (const value of ["fr", "", "EN", " zh", "zh-CN", "../../etc", "cn", "CN"]) {
    const decision = routeFor({ pathname: "/products/water-soluble-pva-yarn", savedLocale: value });
    assert.equal(isLocale(value), false, `${value} must not be treated as a locale`);
    assert.equal(decision.kind, "serve", `${value} must not trigger a redirect`);
    assert.equal(decision.target, "/products/water-soluble-pva-yarn");
    assert.equal(decision.locale, "en");
    assert.equal(decision.persist, "en", "only the locale actually served may be persisted");
  }
});

// ---------------------------------------------------------------------------
// REQ 8 · 9 — the language picker keeps working in both directions.
// ---------------------------------------------------------------------------
test("REQ 8: ?_locale=en returns a visitor to the prefix-free English owner", () => {
  const cases = [
    ["/zh/products/water-soluble-pva-yarn", "/products/water-soluble-pva-yarn"],
    ["/es/answers", "/answers"],
    ["/zh", "/"],
    ["/de", "/"],
    ["/answers", "/answers"],
  ];
  for (const [pathname, target] of cases) {
    const decision = routeFor({ pathname, selectedLocale: "en", savedLocale: "zh" });
    assert.equal(decision.kind, "redirect", pathname);
    assert.equal(decision.target, target, pathname);
    assert.equal(decision.stripLocaleParam, true, `${pathname} must not leave ?_locale behind`);
    assert.equal(decision.persist, "en", "an explicit choice must be recorded");
    assert.ok(target.startsWith("/"), pathname);
  }
});

test("REQ 9: ?_locale=zh switches to Chinese and records the choice", () => {
  for (const [pathname, target] of [
    ["/products/water-soluble-pva-yarn", "/zh/products/water-soluble-pva-yarn"],
    ["/answers", "/zh/answers"],
    ["/", "/zh"],
    ["/es/answers", "/zh/answers"],
  ]) {
    const decision = routeFor({ pathname, selectedLocale: "zh" });
    assert.equal(decision.kind, "redirect", pathname);
    assert.equal(decision.target, target, pathname);
    assert.equal(decision.persist, "zh");
    assert.equal(decision.permanent, false, "a user locale switch must stay temporary");
  }
});

// ---------------------------------------------------------------------------
// REQ 10 · 11 — the /en safety alias.
// ---------------------------------------------------------------------------
test("REQ 10: /en permanently redirects to the site root", () => {
  const decision = routeFor({ pathname: "/en" });
  assert.equal(decision.kind, "redirect");
  assert.equal(decision.target, "/");
  assert.equal(decision.permanent, true);
  assert.equal(decision.permanent ? PERMANENT_REDIRECT_STATUS : null, 308);
  assert.equal(englishAliasOf("/en"), "/");
});

test("REQ 11: /en/* permanently redirects to its prefix-free English owner", () => {
  const cases = [
    ["/en/products/water-soluble-pva-yarn", "/products/water-soluble-pva-yarn"],
    ["/en/answers", "/answers"],
    ["/en/quality", "/quality"],
    ["/en/knowledge/pva-staple-fiber-vs-filament-yarn", "/knowledge/pva-staple-fiber-vs-filament-yarn"],
    ["/en/request-quote", "/request-quote"],
  ];
  for (const [pathname, target] of cases) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "redirect", pathname);
    assert.equal(decision.target, target, pathname);
    assert.equal(decision.permanent, true, `${pathname} alias must be permanent`);
    assert.equal(decision.locale, "en", pathname);
    assert.equal(englishAliasOf(pathname), target, pathname);
    // One hop only: the alias lands on the owner, never on another locale.
    assert.ok(!target.startsWith("/zh/"), `${pathname} must not chain into /zh`);
    assert.ok(!target.startsWith("/es/"), `${pathname} must not chain into /es`);
    assert.ok(!/\/en\//.test(target), `${pathname} must not keep an /en/ segment`);
  }
});

test("REQ 11: an explicit locale wins over the alias, and the alias never strips other query params", () => {
  const decision = routeFor({ pathname: "/en/answers", selectedLocale: "zh" });
  assert.equal(decision.target, "/zh/answers");
  assert.equal(decision.stripLocaleParam, true);
  for (const pathname of ["/en/answers", "/en"]) {
    assert.equal(routeFor({ pathname }).stripLocaleParam, false, `${pathname} must preserve unrelated query parameters`);
  }
});

test("REQ 11: the alias matches only a complete /en segment", () => {
  for (const pathname of ["/encyclopedia", "/en-x", "/english", "/zh/en-x", "/products/aven", "/e"]) {
    assert.equal(englishAliasOf(pathname), null, `${pathname} must not be rewritten`);
    assert.equal(routeFor({ pathname }).target ?? pathname, pathname, `${pathname} must not be redirected`);
  }
  assert.equal(englishAliasOf("/en/"), "/");
  assert.equal(englishAliasOf("/en/answers/"), "/answers", "trailing slash collapsed so the alias cannot chain");
});

test("REQ 11/18: unknown /en/* slugs alias onto the owner and stay proper 404s, never /zh/en/*", () => {
  for (const pathname of ["/en/products/definitely-not-real", "/en/answers/nope"]) {
    const decision = routeFor({ pathname });
    assert.equal(decision.permanent, true, pathname);
    assert.ok(!decision.target.startsWith("/zh"), `${pathname} must not produce /zh/en/…`);
    assert.ok(!/\/en\//.test(decision.target), `${pathname} must not double-prefix`);
  }
  // The route guard that makes those destinations real 404s must stay.
  assert.match(read("src/app/[lang]/_lang.ts"), /if \(!\(dynamicLocales[\s\S]*?\)\) notFound\(\);/);
});

// ---------------------------------------------------------------------------
// REQ 12 — /en/* must never become an owner.
// ---------------------------------------------------------------------------
test("REQ 12: no English-prefixed URL is ever owned, advertised or declared", () => {
  assert.ok(!dynamicLocales.includes("en"), "an /en route must never render");
  for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
    assert.ok(!localePath(p, "en").startsWith("/en"), `localePath(${p}, en) is English-prefixed`);
    assert.ok(!canonicalUrlFor(p, "en").includes("/en/"), `canonical for ${p} advertises /en/`);
    for (const value of Object.values(hreflangForPath(p))) {
      assert.ok(!/\/en(\/|$)/.test(value), `hreflang for ${p} advertises ${value}`);
    }
  }
  // The alias target is never the thing that owns the page.
  assert.equal(canonicalUrlFor("/products/water-soluble-pva-yarn", "en"), `${siteUrl}/products/water-soluble-pva-yarn`);
});

test("REQ 12: locale-prefix helpers keep their existing semantics", () => {
  assert.equal(localeFromPathname("/en/answers"), undefined, "en stays invisible as a prefix");
  assert.equal(localeFromPathname("/es/answers"), "es");
  assert.equal(localeFromPathname("/zh"), "zh");
  assert.equal(localeFromPathname("/answers"), undefined);
  assert.equal(withoutLocalePrefix("/es/answers"), "/answers");
  assert.equal(withoutLocalePrefix("/en/answers"), "/en/answers", "the alias, not the stripper, owns /en");
});

// ---------------------------------------------------------------------------
// REQ 13 · 14 · 15 · 16 · 17 — the GSC-INDEX-002 architecture is untouched.
// ---------------------------------------------------------------------------
test("REQ 13: English canonical URL strings are unchanged", () => {
  for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
    const expected = `${siteUrl}${p === "/" ? "/" : p}`;
    assert.equal(canonicalUrlFor(p, "en"), expected, `${p} English owner moved`);
    assert.equal(hreflangForPath(p).en, expected, `${p} hreflang=en moved`);
    assert.equal(hreflangForPath(p)["x-default"], expected, `${p} x-default moved`);
  }
});

test("REQ 14: Chinese keeps its own canonical under /zh", () => {
  for (const p of DEEP_PATHS) {
    assert.equal(canonicalUrlFor(p, "zh"), `${siteUrl}/zh${p}`, `${p} zh owner changed`);
  }
  for (const p of CORE_PATHS) {
    assert.equal(canonicalUrlFor(p, "zh"), `${siteUrl}${localePath(p, "zh")}`, `${p} zh core owner changed`);
  }
  assert.ok(dynamicLocales.includes("zh"), "zh must stay routable under /[lang]");
});

test("REQ 15: every fallback deep copy still points at the prefix-free English owner", () => {
  let copies = 0;
  for (const p of DEEP_PATHS) {
    for (const locale of FALLBACK_LOCALES) {
      const canonical = canonicalUrlFor(p, locale);
      assert.equal(canonical, `${siteUrl}${p}`, `${locale}${p} no longer consolidates onto English`);
      assert.ok(!canonical.includes(`/${locale}/`), `${locale}${p} canonical self-declares`);
      copies += 1;
    }
  }
  assert.equal(copies, DEEP_PATHS.length * FALLBACK_LOCALES.length, "copy count must equal deep paths × fallback locales");
  assert.ok(copies >= 344, `GSC-INDEX-002 consolidated 344 copies; this suite covers ${copies}`);
});

test("REQ 16: fallback deep copies still emit no hreflang graph", () => {
  for (const p of DEEP_PATHS) {
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale}${p} advertises a false locale`);
    }
    assert.deepEqual(Object.keys(hreflangForPath(p)).sort(), ["en", "x-default", "zh-CN"], p);
  }
});

test("REQ 17: sitemap ownership and its single-source-of-truth wiring are unchanged", () => {
  for (const p of DEEP_PATHS) {
    assert.equal(isSitemapEligible(p, "en"), true, p);
    assert.equal(isSitemapEligible(p, "zh"), true, p);
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(isSitemapEligible(p, locale), false, `${locale}${p} must stay out of the sitemap`);
    }
  }
  const source = read("src/app/sitemap.ts");
  assert.match(source, /hreflangForPath\(path\)/);
  assert.match(source, /localePath\(path, "en"\)/);
  assert.doesNotMatch(source, /for \(const l of \[[^\]]*dynamicLocales/);
  assert.doesNotMatch(source, /htmlLang/);
  assert.doesNotMatch(source, /"\/en"/, "sitemap must not start declaring /en owners");
});

// ---------------------------------------------------------------------------
// REQ 19 — GSC-SCHEMA-001 must not come back through a routing change.
// ---------------------------------------------------------------------------
const sourceFilesUnder = (relativeRoot) => {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  const walk = (directory) => {
    const out = [];
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) out.push(...walk(absolute));
      else if (/\.tsx?$/.test(entry)) out.push(absolute);
    }
    return out;
  };
  return existsSync(absoluteRoot) ? walk(absoluteRoot) : [];
};

test("REQ 19: no fake commercial structured data exists anywhere in src", () => {
  const offenders = [];
  for (const file of sourceFilesUnder("src")) {
    const source = readFileSync(file, "utf8");
    if (/"@type"\s*:\s*"(Product|Offer|AggregateOffer|AggregateRating|Review)"/.test(source)) {
      offenders.push(path.relative(repoRoot, file));
    }
    if (/\bproductSchema\b/.test(source)) offenders.push(`${path.relative(repoRoot, file)} (productSchema)`);
  }
  assert.deepEqual(offenders, [], "GSC-SCHEMA-001 regression: commercial markup or a Product builder returned");
  for (const f of [
    "src/app/(site)/products/[slug]/page.tsx",
    "src/app/[lang]/products/[slug]/page.tsx",
    "src/app/zh/products/[slug]/page.tsx",
  ]) {
    assert.match(read(f), /productPageSchema\(\{/, `${f} must keep the approved WebPage behaviour`);
  }
});

// ---------------------------------------------------------------------------
// REQ 20 — legacy redirects stay untouched and unshadowed.
// ---------------------------------------------------------------------------
test("REQ 20: the legacy redirect map is intact and the alias does not touch it", () => {
  const source = read("next.config.ts");
  for (const [rule, destination] of [
    ["/index.html", "/"],
    ["/index_zh.html", "/zh"],
    ["/product_detail_en/:rest*", "/products"],
    ["/product_detail_zh/:rest*", "/zh/products"],
    ["/wap_feedback.html", "/request-quote"],
    ["/news_detail/:rest*", "/knowledge"],
  ]) {
    assert.ok(source.includes(`source: "${rule}"`), `legacy rule ${rule} was lost`);
    assert.ok(source.includes(`destination: "${destination}"`), `legacy destination ${destination} was lost`);
  }
  const ruleCount = (source.match(/source: "/g) ?? []).length;
  assert.ok(ruleCount >= 58, `expected the full legacy map of 58 rules, found ${ruleCount}`);
  // No legacy rule may be re-pointed at an English-prefixed URL, and the /en
  // alias must not be smuggled into the legacy block.
  assert.doesNotMatch(source, /destination: "\/en(\/|")/, "legacy redirect must not target /en");
  assert.doesNotMatch(source, /source: "\/en(\/|")/, "locale alias does not belong in the legacy map");
  // The proxy matcher still bypasses assets and legacy .html URLs.
  assert.match(read("src/proxy.ts"), /matcher: \["\/\(\(\?!api\|_next\|\.\*\\\\\.\.\*\)\.\*\)"\]/);
});

// ---------------------------------------------------------------------------
// Plumbing — the proxy must only carry out the policy, never decide.
// ---------------------------------------------------------------------------
test("plumbing: the proxy delegates and preserves the existing response statuses", () => {
  const source = read("src/proxy.ts");
  assert.match(source, /routeFor\(\{/, "proxy must delegate the decision");
  assert.match(source, /decision\.persist/, "proxy must honour the persist instruction");
  assert.match(source, /stripLocaleParam/, "proxy must only drop ?_locale when told to");
  assert.doesNotMatch(source, /includes\("en"\)|=== "en"/, "proxy must not special-case locales itself");
  assert.doesNotMatch(source, /canonical/i, "no page ownership may be expressed as a redirect");
  assert.ok(PERMANENT_REDIRECT_STATUS === 308, "the alias must be permanent, not a temporary hop");
  assert.equal(typeof localePath, "function");
  assert.ok(locales.includes("en") && locales.includes("de"));
  assert.equal(htmlLang.en, "en");
});

// ---------------------------------------------------------------------------
// Optional build-output checks (run in the validation build).
// ---------------------------------------------------------------------------
const requireBuild = process.env.REQUIRE_BUILD_OUTPUT === "1";
const prerenderRoot = path.join(repoRoot, ".next", "server", "app");
const buildPresent = existsSync(prerenderRoot);
if (requireBuild && !buildPresent) {
  test("REQUIRE_BUILD_OUTPUT is set but no production build exists", () => {
    assert.fail(`${prerenderRoot} is missing — run \`npm run build\` first`);
  });
}
const buildOptions = { skip: buildPresent ? false : "no .next production build to inspect" };

const htmlFor = (urlPath) => {
  const candidate = path.join(prerenderRoot, `${urlPath === "/" ? "index" : urlPath.replace(/^\//, "")}.html`);
  assert.ok(existsSync(candidate), `expected prerendered ${candidate}`);
  return readFileSync(candidate, "utf8");
};

test("build: English and fallback owners emit the unchanged strings and no /en graph", buildOptions, () => {
  for (const urlPath of ["/products/water-soluble-pva-yarn", "/answers", "/quality"]) {
    const html = htmlFor(urlPath);
    const canonical = (html.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1];
    assert.equal(canonical, `${siteUrl}${urlPath}`, `${urlPath} canonical moved`);
    assert.ok(!/hreflang="en"[^>]*href="[^"]*\/en\//.test(html), `${urlPath} advertises an /en alternate`);
    assert.ok(!/@type"\s*:\s*"Product/.test(html), `${urlPath} reintroduced Product markup`);
  }
  for (const locale of FALLBACK_LOCALES) {
    const html = htmlFor(`/${locale}/products/water-soluble-pva-yarn`);
    const canonical = (html.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1];
    assert.equal(canonical, `${siteUrl}/products/water-soluble-pva-yarn`, `${locale} copy drifted`);
    assert.equal((html.match(/rel="alternate"/g) ?? []).length, 0, `${locale} copy claims alternates`);
  }
});

test("build: /en stays a redirect, never a prerendered route", buildOptions, () => {
  assert.ok(
    !existsSync(path.join(prerenderRoot, "en")),
    ".next/server/app/en exists — /en/* became a real renderable route"
  );
  const enPrefixedDocuments = [];
  const walk = (directory, depth = 0) => {
    if (depth > 2) return;
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (!statSync(absolute).isDirectory()) continue;
      const relative = path.relative(prerenderRoot, absolute).split(path.sep);
      if (relative[0] === "en") enPrefixedDocuments.push(path.relative(prerenderRoot, absolute));
      walk(absolute, depth + 1);
    }
  };
  walk(prerenderRoot);
  assert.deepEqual(enPrefixedDocuments, [], "an English-prefixed route tree was prerendered");
});
