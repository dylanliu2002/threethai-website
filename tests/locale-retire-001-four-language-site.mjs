import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * LOCALE-RETIRE-001 — the site maintains four languages: EN, ZH, ES, DE.
 *
 * The owner retired Portuguese, Russian, Arabic, Turkish, Vietnamese and
 * Indonesian as a product decision, not an experiment. The SEO risk of retiring
 * a locale is not the missing translations, it is what happens to the URLs that
 * are already indexed: a bulk 404 would throw away every signal GSC-INDEX-002
 * consolidated onto the English owner, and leaving the pages live would keep
 * ten-locale duplicate canonicals in the index. Both are wrong here, so this
 * suite pins the third behaviour — one permanent hop from each retired URL onto
 * its existing prefix-free English owner — plus the four-language inventory that
 * makes the retired prefixes unreachable in the first place.
 *
 * Two halves matter. `src/content/company.ts` is the locale model, and every
 * SEO surface (availability, sitemap alternates, hreflang, og:locale, the
 * switcher) already reads it rather than keeping its own list, so shrinking that
 * one array retires the languages everywhere instead of only in the menu. The
 * other half is `routeFor` in src/content/locale-routing.ts, which stays pure
 * for exactly the reason GSC-LOCALE-003A made it pure: the precedence order is
 * assertable without a Next runtime. Geography remains not an input, so nothing
 * here reintroduces geo inference.
 *
 * Counts are derived, never re-litigated: the active fallback set is the
 * supported locales minus the genuinely translated ones, so this suite says
 * "2 × the deep-path inventory" rather than the obsolete 8 × 43 = 344.
 *
 * Runtime note: the policy lives in TypeScript and is imported directly, which
 * needs Node's built-in type stripping (Node >= 22.18 / 23.6 / 24.x).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const {
  LOCALE_COOKIE,
  LOCALE_PARAM,
  PERMANENT_REDIRECT_STATUS,
  englishAliasOf,
  englishOwnerOf,
  isLocale,
  isRetiredLocale,
  needsEnglishConsolidation,
  retiredLocaleOfPathname,
  retiredLocales,
  routeFor,
} = await importSource("src/content/locale-routing.ts");

const { dynamicLocales, htmlLang, localeLabels, localePath, locales } = await importSource(
  "src/content/company.ts",
);
const { siteUrl } = await importSource("src/content/company.ts");
const {
  TRANSLATED_CONTENT_LOCALES,
  canonicalUrlFor,
  hreflangForPath,
  hreflangForRoute,
  isSitemapEligible,
  localizedLocalesFor,
} = await importSource("src/content/availability.ts");

const { products, extendedFormats } = await importSource("src/content/products.ts");
const { applications } = await importSource("src/content/applications.ts");
const { articles } = await importSource("src/content/articles.ts");
const { buyerAnswers } = await importSource("src/content/answers.ts");
const { getDictionary } = await importSource("src/content/i18n/index.ts");

/**
 * The retired codes, spelled out independently of the implementation. Control A
 * in the task card re-adds `pt` to the active locale model; if this list were
 * derived from the source it would silently follow it. The four supported
 * languages are the owner decision, so they are pinned the same way.
 */
const EXPECTED_SUPPORTED = ["de", "en", "es", "zh"];
const EXPECTED_RETIRED = ["ar", "id", "pt", "ru", "tr", "vi"];
/** The ten-locale set the site had before retirement: the closed universe. */
const HISTORICAL_LOCALES = ["en", "zh", "es", "pt", "ru", "ar", "tr", "vi", "id", "de"];
/** The only hreflang keys the four-language site may advertise on any page. */
const ALLOWED_HREFLANG_UNIVERSE = ["en", "zh-CN", "es", "de", "x-default"];
/** Retired endonyms, so a switcher can be checked for what it must not show. */
const RETIRED_ENDONYMS = ["Português", "Русский", "العربية", "Türkçe", "Tiếng Việt", "Bahasa Indonesia"];

const DEEP_PATHS = [
  ...products.map(({ slug }) => `/products/${slug}`),
  ...applications.map(({ slug }) => `/applications/${slug}`),
  ...articles.map(({ slug }) => `/knowledge/${slug}`),
  ...buyerAnswers.map(({ slug }) => `/answers/${slug}`),
];

const CORE_PATHS = [
  "/",
  "/products",
  "/applications",
  "/manufacturing",
  "/quality",
  "/about",
  "/contact",
  "/request-quote",
  "/request-sample",
  "/product-finder",
  "/knowledge",
  "/answers",
];

const ALL_PATHS = [...DEEP_PATHS, ...CORE_PATHS];

/** Locales that render English deep content under their own prefix: ES and DE. */
const ACTIVE_FALLBACK_LOCALES = locales.filter((l) => !TRANSLATED_CONTENT_LOCALES.includes(l));

/** One representative retired URL per retired prefix, for the equivalence tests. */
const retiredSample = (locale) => [
  `/${locale}`,
  `/${locale}/answers`,
  `/${locale}/products/water-soluble-pva-yarn`,
  `/${locale}/knowledge/pva-yarn-vs-pva-film-which-fits-your-process`,
];

// ---------------------------------------------------------------------------
// REQ 1 · 2 · 3 (inventory) — the four supported locales and the six retired
// ones are a partition of the ten the site used to publish.
// ---------------------------------------------------------------------------
test("REQ 1: the public supported locale set is exactly en, zh, es, de", () => {
  assert.deepEqual([...locales].sort(), EXPECTED_SUPPORTED);
  assert.deepEqual([...dynamicLocales].sort(), ["de", "es", "zh"], "/[lang] must route exactly the non-English locales");
  assert.equal(new Set(locales).size, locales.length, "duplicate locale in the model");
});

test("REQ 2: exactly pt, ru, ar, tr, vi and id are retired", () => {
  assert.deepEqual([...retiredLocales].sort(), EXPECTED_RETIRED);
  for (const code of EXPECTED_RETIRED) {
    assert.equal(isRetiredLocale(code), true, `${code} must be recognised as retired`);
    assert.equal(isLocale(code), false, `${code} must not be a locale any more`);
  }
});

test("REQ 1-2: supported and retired are disjoint and cover the historical ten", () => {
  assert.deepEqual(
    locales.filter((l) => isRetiredLocale(l)),
    [],
    "a locale cannot be both active and retired — that would render a page a 308 is also promising",
  );
  assert.deepEqual(
    [...locales, ...retiredLocales].sort(),
    [...HISTORICAL_LOCALES].sort(),
    "the active and retired sets must partition the ten locales the site published",
  );
  // An unsupported code that was never published stays unknown, not retired.
  for (const code of ["fr", "it", "ja", "ko", "pt-BR", "zh-TW"]) {
    assert.equal(isRetiredLocale(code), false, `${code} was never a site locale`);
    assert.equal(isLocale(code), false, code);
  }
});

test("REQ 1-2: the locale metadata maps cover the four locales and nothing else", () => {
  assert.deepEqual(Object.keys(htmlLang).sort(), EXPECTED_SUPPORTED);
  assert.deepEqual(Object.keys(localeLabels).sort(), EXPECTED_SUPPORTED);
  assert.deepEqual(htmlLang, { en: "en", zh: "zh-CN", es: "es", de: "de" });
});

// ---------------------------------------------------------------------------
// REQ 3 · 4 · 5 · 6 — every retired prefix consolidates onto its prefix-free
// English owner, permanently, in one hop, for all six locales alike.
// ---------------------------------------------------------------------------
test("REQ 3: /pt is a permanent redirect to the site root", () => {
  const decision = routeFor({ pathname: "/pt" });
  assert.equal(decision.kind, "redirect");
  assert.equal(decision.target, "/");
  assert.equal(decision.permanent, true, "a retired locale move is permanent, not a 307");
  assert.equal(decision.permanent ? PERMANENT_REDIRECT_STATUS : null, 308);
});

test("REQ 4: /ru/answers permanently redirects to the English answers index", () => {
  const decision = routeFor({ pathname: "/ru/answers" });
  assert.equal(decision.kind, "redirect");
  assert.equal(decision.target, "/answers");
  assert.equal(decision.permanent, true);
  assert.equal(decision.locale, "en");
});

test("REQ 5: an unknown retired slug still redirects onto the English URL that 404s", () => {
  for (const pathname of ["/pt/products/not-real", "/ar/products/not-real", "/vi/answers/nope"]) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "redirect", `${pathname} must not be answered by the route table`);
    assert.equal(decision.target, pathname.slice(pathname.split("/")[1].length + 1) || "/");
    assert.equal(decision.permanent, true, pathname);
  }
});

test("REQ 6: all six retired prefixes behave identically", () => {
  for (const locale of EXPECTED_RETIRED) {
    for (const pathname of retiredSample(locale)) {
      const decision = routeFor({ pathname });
      const expected = pathname.slice(locale.length + 1) || "/";
      assert.equal(decision.kind, "redirect", `${pathname} must be routed away, not rendered`);
      assert.equal(decision.permanent, true, `${pathname} must be a 308`);
      assert.equal(decision.target, expected, `${pathname} → ${decision.target}`);
      assert.equal(
        decision.target,
        localePath(withoutPrefixOf(pathname), "en"),
        `${pathname} must land on the prefix-free English owner`,
      );
      assert.ok(!decision.target.includes(`/${locale}/`), `${pathname} kept its retired prefix`);
      // One hop only: the destination carries no locale prefix at all, so it can
      // never chain into /zh, /es, /de or another retired prefix.
      assert.equal(needsEnglishConsolidation(decision.target), false, `${pathname} chains a second hop`);
      assert.equal(retiredLocaleOfPathname(pathname), locale, pathname);
    }
  }
});
/** `/pt/answers` → `/answers`, `/answers` → `/answers`: the strip both halves need. */
function withoutPrefixOf(pathname) {
  const segments = pathname.split("/");
  return EXPECTED_RETIRED.includes(segments[1]) ? `/${segments.slice(2).join("/")}` || "/" : pathname;
}

test("REQ 6: a retired prefix never 404s and never renders a locale page", () => {
  for (const locale of EXPECTED_RETIRED) {
    for (const pathname of retiredSample(locale)) {
      const decision = routeFor({ pathname });
      assert.notEqual(decision.kind, "serve", `${pathname} must not be served as a live page`);
      assert.notEqual(decision.locale, locale, `${pathname} must not be served in ${locale}`);
      assert.ok(![...dynamicLocales].includes(decision.locale), "a consolidation must not pick a live locale");
    }
  }
});

test("REQ 6: nested and repeated retired forms still reach English in one hop", () => {
  for (const pathname of ["/pt/en/answers", "/en/pt/answers", "/pt/", "/ru//", "/tr/id"]) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "redirect", pathname);
    assert.ok(!isRetiredLocale(decision.target.split("/")[1]), `${pathname} → ${decision.target} is still retired`);
    assert.ok(!decision.target.includes("/en/"), `${pathname} → ${decision.target} keeps an /en segment`);
  }
  assert.equal(englishOwnerOf("/pt/answers"), "/answers");
  assert.equal(englishOwnerOf("/zh/answers"), "/zh/answers", "a live prefix is not the retirement path");
});

// ---------------------------------------------------------------------------
// REQ 7 — unrelated query parameters survive the retirement hop.
// ---------------------------------------------------------------------------
test("REQ 7: a retired URL keeps its query parameters and only loses a retired _locale", () => {
  // The proxy keeps the query string by cloning the request URL and rewriting
  // only the pathname; pin the two things that make that true, then work the
  // arithmetic out the same way so the Location is a real string, not a hope.
  const source = read("src/proxy.ts");
  assert.match(source, /const url = request\.nextUrl\.clone\(\);/, "proxy must carry the query string by cloning the request URL");
  assert.match(source, /url\.searchParams\.delete\(LOCALE_PARAM\)/, "proxy must drop only the locale selector");
  assert.match(source, /url\.pathname = decision\.target;/, "proxy must rewrite the pathname, not rebuild the URL");
  assert.equal((source.match(/searchParams\.delete/g) ?? []).length, 1, "only one query parameter may ever be removed");

  const locationFor = (pathname, search) => {
    const decision = routeFor({ pathname, selectedLocale: new URLSearchParams(search).get(LOCALE_PARAM) });
    const url = new URL(`${siteUrl}${pathname}${search}`);
    if (decision.stripLocaleParam) url.searchParams.delete(LOCALE_PARAM);
    url.pathname = decision.target;
    return `${url.pathname}${url.search}`;
  };

  assert.equal(locationFor("/id/products/pva-staple-fiber", "?thread=20c&unit=kg"), "/products/pva-staple-fiber?thread=20c&unit=kg");
  assert.equal(locationFor("/tr/request-quote", "?thread=20c"), "/request-quote?thread=20c");
  assert.equal(locationFor("/ru/answers", "?utm_source=newsletter"), "/answers?utm_source=newsletter");
  assert.equal(locationFor("/pt/answers", `?${LOCALE_PARAM}=pt`), "/answers", "a retired selector must be cleaned, not carried");
  assert.equal(locationFor("/vi/knowledge/foo", `?page=2&${LOCALE_PARAM}=vi`), "/knowledge/foo?page=2");
  assert.equal(locationFor("/ar/products/x", "?thread=20c"), "/products/x?thread=20c", "a retired selector must not drop unrelated params");
});

// ---------------------------------------------------------------------------
// REQ 8 · 9 — a stale preference for a retired language cannot recreate one.
// ---------------------------------------------------------------------------
test("REQ 8: a stale retired-locale cookie serves English in place and is replaced", () => {
  for (const locale of EXPECTED_RETIRED) {
    for (const pathname of ["/answers", "/products/water-soluble-pva-yarn", "/quality"]) {
      const decision = routeFor({ pathname, savedLocale: locale });
      assert.equal(decision.kind, "serve", `${locale} cookie must not redirect ${pathname} anywhere`);
      assert.equal(decision.locale, "en", `${locale} cookie must not select ${locale}`);
      assert.equal(decision.target, pathname, `${locale} cookie relocated ${pathname} off its own URL`);
      assert.equal(decision.persist, "en", `${pathname} must re-store the locale actually served, overwriting ${locale}`);
      assert.equal(decision.permanent, undefined, "a normalised visit must not look like a permanent move");
    }
    assert.ok(isRetiredLocale(locale) && !isLocale(locale), `${locale} is retired, not selectable`);
  }
  // The stored key is the same one the site has always used, so an old cookie
  // really is read and replaced rather than orphaned beside a new one.
  assert.equal(LOCALE_COOKIE, "threethai_locale");
  assert.match(read("src/proxy.ts"), /cookies\.set\(LOCALE_COOKIE, locale/, "the replacement must be written as a cookie");
});

test("REQ 8: a stale retired cookie on a retired URL still lands on English once", () => {
  for (const locale of EXPECTED_RETIRED) {
    const decision = routeFor({ pathname: `/${locale}/answers`, savedLocale: locale });
    assert.equal(decision.kind, "redirect", locale);
    assert.equal(decision.target, "/answers", locale);
    assert.equal(decision.persist, "en", `${locale} must be overwritten, not preserved`);
    assert.ok(!decision.target.startsWith(`/${locale}`), `${locale} cookie re-created its own route`);
  }
});

test("REQ 9: a stale ?_locale=<retired> cannot select a retired locale", () => {
  for (const locale of EXPECTED_RETIRED) {
    const decision = routeFor({ pathname: "/answers", selectedLocale: locale });
    assert.equal(decision.locale, "en", `${locale} selector must not select ${locale}`);
    assert.ok(!decision.target.startsWith(`/${locale}/`), `${locale} selector created a retired route`);
    assert.equal(decision.stripLocaleParam, true, `${locale} selector must be cleaned off the URL`);
    assert.equal(decision.permanent, false, "a preference cleanup is not a permanent move");
    assert.ok(isLocale(decision.persist), `${locale}: only a supported locale may be persisted`);

    // Underneath the bad selector the normal precedence still applies.
    assert.equal(routeFor({ pathname: "/answers", selectedLocale: locale, savedLocale: "zh" }).target, "/zh/answers");
    const onPrefixed = routeFor({ pathname: `/es/answers`, selectedLocale: locale });
    assert.equal(onPrefixed.target, "/es/answers", "a live prefix still wins over a dead selector");
    assert.equal(onPrefixed.locale, "es");
  }
});

test("REQ 9: a retired prefix plus a live selector switches once, onto the live locale", () => {
  for (const locale of EXPECTED_RETIRED) {
    const decision = routeFor({ pathname: `/${locale}/answers`, selectedLocale: "es" });
    assert.equal(decision.kind, "redirect", locale);
    assert.equal(decision.target, "/es/answers", `${locale} → es must not double-prefix`);
    assert.equal(decision.permanent, false, "an explicit user switch stays temporary");
    assert.equal(decision.persist, "es");
  }
});

// ---------------------------------------------------------------------------
// REQ 10 — the switcher offers four languages and no retired vocabulary.
// ---------------------------------------------------------------------------
test("REQ 10: the language switcher exposes exactly the four languages", () => {
  assert.deepEqual(
    [...locales].map((l) => localeLabels[l]),
    ["English", "简体中文", "Español", "Deutsch"],
  );
  const source = read("src/components/layout/site-header.tsx");
  // Both switchers must enumerate the model, so no second list of ten can exist.
  assert.equal((source.match(/locales\.map\(\(l\) =>/g) ?? []).length, 2, "desktop and mobile switcher must both read `locales`");
  assert.doesNotMatch(source, /"(pt|ru|tr|vi)"|Portugu/, "the switcher keeps its own retired entry");
  assert.equal(/const UI_PREFIXES = locales\.filter/.test(source), true, "prefix detection must follow the locale model");
});

test("REQ 10: no retired language string survives anywhere in src", () => {
  const offenders = [];
  for (const file of sourceFilesUnder("src")) {
    const source = readFileSync(file, "utf8");
    const relative = path.relative(repoRoot, file);
    for (const endonym of RETIRED_ENDONYMS) {
      if (source.includes(endonym)) offenders.push(`${relative} (${endonym})`);
    }
    // The og:locale map is the other place a retired language can hide.
    for (const tag of ["pt_BR", "ru_RU", "ar_AR", "tr_TR", "vi_VN", "id_ID"]) {
      if (source.includes(tag)) offenders.push(`${relative} (${tag})`);
    }
    if (/\bisRtl\b/.test(source)) offenders.push(`${relative} (isRtl — the site has no RTL locale any more)`);
  }
  assert.deepEqual(offenders, [], "retired-locale vocabulary is still in the application");
});

test("REQ 10: the retired UI dictionaries are gone and nothing imports them", () => {
  for (const locale of EXPECTED_RETIRED) {
    assert.equal(
      existsSync(path.join(repoRoot, "src", "content", "i18n", `${locale}.ts`)),
      false,
      `src/content/i18n/${locale}.ts is unreachable and must be deleted, not kept`,
    );
  }
  const index = read("src/content/i18n/index.ts");
  for (const locale of EXPECTED_RETIRED) {
    assert.ok(!new RegExp(`from "\\.\\/${locale}"`).test(index), `i18n still imports ${locale}`);
    assert.ok(!new RegExp(`from "\\.\\/${locale}\\.ts"`).test(index), `i18n still imports ${locale}`);
  }
  for (const live of ["es", "de", "en", "zh"]) {
    assert.ok(new RegExp(`from "\\.\\/${live}"`).test(index), `i18n lost ${live}`);
  }
});

// ---------------------------------------------------------------------------
// REQ 11 · 12 — no current surface advertises a retired locale.
// ---------------------------------------------------------------------------
test("REQ 11: no retired-locale URL can appear in the sitemap", () => {
  // The sitemap declares its alternates through hreflangForPath and its owner
  // URLs through localePath(path, "en"), so those two are the whole surface.
  const source = read("src/app/sitemap.ts");
  assert.match(source, /hreflangForPath\(path\)/, "sitemap must keep consuming the shared availability policy");
  assert.match(source, /localePath\(path, "en"\)/, "sitemap entries must stay prefix-free English");
  assert.doesNotMatch(source, /"(pt|ru|ar|tr|vi|id)"/, "sitemap must not enumerate a retired locale");
  assert.doesNotMatch(source, /retiredLocales/, "the sitemap has no business naming retired locales");

  for (const p of ALL_PATHS) {
    assert.equal(localePath(p, "en"), p === "/" ? "/" : p, `${p} English owner moved`);
    for (const locale of EXPECTED_RETIRED) {
      assert.equal(isSitemapEligible(p, locale), false, `${locale}${p} must not be a sitemap entry`);
    }
  }
});

test("REQ 12: hreflang advertises no retired locale on any page", () => {
  for (const p of ALL_PATHS) {
    const map = hreflangForPath(p);
    const keys = Object.keys(map).sort();
    assert.ok(
      keys.every((k) => ALLOWED_HREFLANG_UNIVERSE.includes(k)),
      `${p} advertises ${keys.filter((k) => !ALLOWED_HREFLANG_UNIVERSE.includes(k)).join(",")}`,
    );
    for (const [tag, url] of Object.entries(map)) {
      assert.ok(url.startsWith(siteUrl), `${p} ${tag} hreflang is not an absolute URL`);
      for (const locale of EXPECTED_RETIRED) {
        assert.ok(!url.includes(`${siteUrl}/${locale}/`), `${p} advertises ${tag} at the retired ${url}`);
        assert.ok(!url.endsWith(`${siteUrl}/${locale}`), `${p} advertises retired ${url}`);
      }
    }
    assert.ok("x-default" in map, `${p} lost x-default`);
  }
  // Nothing retired may be advertised anywhere. What *is* advertised shrank
  // again under INTL-DEES-002B: ES and DE are no longer claimed on paths whose
  // copy they do not carry, so even the most localized core page advertises
  // EN + ZH + x-default until a page-level promotion proves otherwise.
  assert.deepEqual(Object.keys(hreflangForPath("/quality")).sort(), ["en", "x-default", "zh-CN"]);
  for (const tag of [htmlLang.es, htmlLang.de]) {
    for (const p of ALL_PATHS) {
      assert.equal(tag in hreflangForPath(p), false, `${p} advertises ${tag} without registered copy`);
    }
  }
});

test("REQ 12: a retired locale can never be an alternate key anywhere in the policy", () => {
  for (const p of ALL_PATHS) {
    for (const locale of EXPECTED_RETIRED) {
      assert.equal(localizedLocalesFor(p).includes(locale), false, `${locale} is still advertised as localized on ${p}`);
    }
  }
});

// ---------------------------------------------------------------------------
// REQ 13 · 14 · 15 · 16 — ES and DE keep the GSC-INDEX-002 fallback posture,
// and the copy inventory is derived from it rather than re-stated.
// ---------------------------------------------------------------------------
test("REQ 13-14: an untranslated ES/DE deep page still canonicalises to English", () => {
  assert.deepEqual(ACTIVE_FALLBACK_LOCALES, ["es", "de"], "ES and DE must stay the untranslated fallback pair");
  for (const p of DEEP_PATHS) {
    for (const locale of ACTIVE_FALLBACK_LOCALES) {
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale}${p} no longer consolidates onto English`);
      assert.ok(!canonicalUrlFor(p, locale).includes(`/${locale}/`), `${locale}${p} became self-canonical`);
      assert.equal(isSitemapEligible(p, locale), false, `${locale}${p} must stay out of the sitemap`);
    }
  }
});

test("REQ 15: an untranslated ES/DE deep page advertises no false language graph", () => {
  for (const p of DEEP_PATHS) {
    for (const locale of ACTIVE_FALLBACK_LOCALES) {
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale}${p} claims alternates it does not have`);
    }
    assert.deepEqual(Object.keys(hreflangForPath(p)).sort(), ["en", "x-default", "zh-CN"], p);
  }
});

test("REQ 16: the fallback-copy inventory derives from the active locale set", () => {
  const copies = DEEP_PATHS.flatMap((p) => ACTIVE_FALLBACK_LOCALES.map((locale) => `${locale}${p}`));
  assert.equal(copies.length, DEEP_PATHS.length * ACTIVE_FALLBACK_LOCALES.length);
  // 43 deep paths × 2 fallback locales was 86 after retirement (was 344 with
  // eight). The relational form above is the invariant; this only catches a
  // vacuous loop if the deep inventory or the fallback pair ever empties.
  assert.ok(DEEP_PATHS.length >= 43, `deep inventory shrank below the 43 paths GSC-INDEX-002 consolidated: ${DEEP_PATHS.length}`);
  assert.ok(ACTIVE_FALLBACK_LOCALES.length >= 1, "no fallback locale means REQ 13-15 test nothing");
  assert.ok(copies.length >= DEEP_PATHS.length, "every deep path must have at least one fallback copy");
  assert.ok(!read("tests/gsc-index-002-fallback-indexation.mjs").includes("FALLBACK_LOCALES.length, 8"));
});

test("REQ 13-16: ES and DE core pages consolidate onto the English owner", async () => {
  // LOCALE-RETIRE-001 kept four site languages and this suite pinned their
  // routing, not their indexation. The indexation posture for paths without
  // ES/DE copy belongs to the availability policy, and INTL-DEES-002B made it
  // path-aware: a page owns itself only where its translated copy is
  // registered. ES/DE chrome is partial over English body copy, so these pages
  // now consolidate exactly as the deep copies above do — routing unaffected.
  const { contentHtmlLangOf } = await importSource("src/content/availability.ts");
  for (const p of CORE_PATHS) {
    for (const locale of ["es", "de"]) {
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale}${p} claims its own canonical`);
      assert.equal(isSitemapEligible(p, locale), false, `${locale}${p} must not be a sitemap owner`);
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale}${p} claims a language graph`);
      assert.equal(contentHtmlLangOf(p, locale), htmlLang.en, `${locale}${p} claims translated body copy`);
      // Still routed, still served, still reachable from the switcher.
      const decision = routeFor({ pathname: localePath(p, locale) });
      assert.equal(decision.kind, "serve", `${locale}${p} stopped being served`);
      assert.equal(decision.locale, locale, `${locale}${p} no longer routes to its own locale`);
      assert.equal(localeLabels[locale] !== undefined, true, `${locale} left the language model`);
    }
  }
});

// ---------------------------------------------------------------------------
// REQ 17 · 18 · 19 · 20 — the GSC-LOCALE-003A invariants survive the change.
// ---------------------------------------------------------------------------
test("REQ 17: /en remains a permanent alias onto the prefix-free English owner", () => {
  for (const [pathname, target] of [
    ["/en", "/"],
    ["/en/answers", "/answers"],
    ["/en/products/water-soluble-pva-yarn", "/products/water-soluble-pva-yarn"],
    ["/en/quality", "/quality"],
  ]) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "redirect", pathname);
    assert.equal(decision.target, target, pathname);
    assert.equal(decision.permanent, true, `${pathname} alias must stay permanent`);
    assert.equal(decision.locale, "en", pathname);
    assert.equal(englishAliasOf(pathname), target, pathname);
    assert.equal(routeFor({ pathname }).stripLocaleParam, false, `${pathname} must preserve unrelated query parameters`);
  }
  // `/en` must never become an owner, whatever the retirement work touches.
  assert.ok(!dynamicLocales.includes("en"), "an /en route must never render");
});

test("REQ 18: a cookieless request still gets English in place at its owner URL", () => {
  for (const pathname of ["/", "/answers", "/quality", "/products/water-soluble-pva-yarn", ...CORE_PATHS.slice(1)]) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "serve", pathname);
    assert.equal(decision.locale, "en", pathname);
    assert.equal(decision.target, pathname, `${pathname} must be served as itself`);
  }
  // Geography is still not an input, so retirement cannot have re-opened it.
  assert.equal(routeFor.length, 1, "routeFor must accept exactly one input object");
  assert.deepEqual(routeFor({ pathname: "/answers", country: "CN" }), routeFor({ pathname: "/answers" }), "CN leaked in");
});

test("REQ 19: Chinese stays a fully supported locale", () => {
  assert.ok(locales.includes("zh") && dynamicLocales.includes("zh"));
  assert.equal(htmlLang.zh, "zh-CN");
  assert.equal(routeFor({ pathname: "/zh/answers" }).kind, "serve");
  assert.equal(routeFor({ pathname: "/zh/answers" }).locale, "zh");
  assert.equal(routeFor({ pathname: "/answers", savedLocale: "zh" }).target, "/zh/answers");
  for (const p of DEEP_PATHS) {
    assert.equal(canonicalUrlFor(p, "zh"), `${siteUrl}/zh${p}`, `${p} zh owner changed`);
    assert.equal(isSitemapEligible(p, "zh"), true, `${p} zh must stay in the sitemap`);
  }
  assert.notEqual(getDictionary("zh"), getDictionary("en"), "zh must keep its own dictionary");
  for (const live of ["en", "zh", "es", "de"]) {
    assert.ok(JSON.stringify(getDictionary(live)).length > 200, `the ${live} dictionary must survive`);
  }
});

test("REQ 20: an unsupported locale that was never published keeps its normal 404", () => {
  for (const pathname of ["/fr", "/fr/answers", "/it/products/x", "/ja", "/xx/quality"]) {
    const decision = routeFor({ pathname });
    assert.equal(decision.kind, "serve", `${pathname} must not be redirected — it was never a site locale`);
    assert.equal(decision.target, pathname, `${pathname} must not be rewritten`);
    assert.equal(needsEnglishConsolidation(pathname), false, pathname);
    assert.equal(decision.locale, "en", pathname);
  }
  // The route guard under /[lang] still rejects anything not in the model, so
  // both a retired and an unknown prefix are unreachable even if the proxy is
  // bypassed (a direct asset-like match, or a stale prerender).
  assert.match(read("src/app/[lang]/_lang.ts"), /if \(!\(dynamicLocales[\s\S]*?\)\) notFound\(\);/);
});

// ---------------------------------------------------------------------------
// REQ 21 · 22 — the two merged invariants this task must not disturb.
// ---------------------------------------------------------------------------
test("REQ 21: GSC-SCHEMA-001 holds — no commercial structured data returns", () => {
  const offenders = [];
  for (const file of sourceFilesUnder("src")) {
    const source = readFileSync(file, "utf8");
    const relative = path.relative(repoRoot, file);
    if (/"@type"\s*:\s*"(Product|Offer|AggregateOffer|AggregateRating|Review)"/.test(source)) offenders.push(relative);
    if (/\bproductSchema\b/.test(source)) offenders.push(`${relative} (productSchema)`);
  }
  assert.deepEqual(offenders, [], "retiring locales must not re-introduce fabricated commercial markup");
});

test("REQ 22: BUSINESS-FACT-D2 holds — concrete PVA fibre is still not offered", () => {
  // Retiring six locale copies of this page must not disturb the owner-confirmed
  // fact that sits underneath them. The fix only ever *removed* a claim, so the
  // denial staying present and no affirmative claim coming back are both required.
  const offered = [
    ...extendedFormats.en.items,
    ...extendedFormats.zh.items,
    extendedFormats.en.body,
    extendedFormats.zh.body,
  ].join(" ");
  assert.doesNotMatch(offered, /concrete/i, "concrete PVA fibre is back in the offered formats");

  const staple = products.find((p) => p.slug === "pva-staple-fiber");
  assert.ok(staple, "the staple-fibre product page must still exist");
  const copy = JSON.stringify(staple);
  assert.match(
    copy,
    /not part of our current product offering|不在我们当前的产品范围内/,
    "the truthful negative disappeared from the staple-fibre page",
  );
  assert.match(
    read("src/content/legacy-source.ts"),
    /Concrete PVA fiber is not part of our current product offering/,
    "the legacy-source negative disappeared",
  );
  // No retired dictionary file can be holding a resurrected copy of the claim.
  assert.deepEqual(
    sourceFilesUnder("src/content/i18n").filter((file) => EXPECTED_RETIRED.includes(path.basename(file, ".ts"))),
    [],
    "a retired locale dictionary came back",
  );
});

// ---------------------------------------------------------------------------
// Legacy separation: the old-site redirect families are not the retirement path.
// ---------------------------------------------------------------------------
test("the legacy redirect map is untouched and cannot collide with a retired prefix", () => {
  const source = read("next.config.ts");
  const ruleCount = (source.match(/source: "/g) ?? []).length;
  assert.ok(ruleCount >= 58, `expected the full legacy map of 58 rules, found ${ruleCount}`);
  // A collision would need a legacy source that starts with a retired prefix.
  // Every legacy URL is `.html`-era (and bypasses the proxy matcher), so none
  // may be rewritten by the retirement rule; assert that structurally.
  for (const match of source.matchAll(/source: "([^"]+)"/g)) {
    const segment = match[1].split("/")[1] ?? "";
    assert.ok(
      !EXPECTED_RETIRED.includes(segment),
      `legacy rule ${match[1]} collides with a retired locale prefix`,
    );
  }
  assert.doesNotMatch(source, /retiredLocales|locale-routing/, "locale retirement must not leak into next.config");
});

// ---------------------------------------------------------------------------
// Plumbing: proxy.ts carries out the policy and decides nothing itself.
// ---------------------------------------------------------------------------
test("plumbing: the proxy delegates the retirement decision", () => {
  const source = read("src/proxy.ts");
  assert.match(source, /routeFor\(\{/, "proxy must delegate the decision");
  assert.match(source, /decision\.persist/, "proxy must honour the persist instruction");
  assert.doesNotMatch(source, /"(pt|ru|ar|tr|vi|id)"/, "proxy must not name a retired locale itself");
  assert.doesNotMatch(source, /\bretiredLocales\b/, "the retirement rule belongs to locale-routing.ts");
  assert.doesNotMatch(source, /canonical/i, "no page ownership may be expressed as a redirect here");
  assert.doesNotMatch(source, /next\/config|redirects\(\)/, "the retirement hop belongs to the proxy, not the build config");
  assert.match(read("src/content/locale-routing.ts"), /retiredLocales = \[[^\]]*\]/, "the retired inventory must live in the routing policy");
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

test("build: no retired-locale route is prerendered", buildOptions, () => {
  for (const locale of EXPECTED_RETIRED) {
    assert.equal(
      existsSync(path.join(prerenderRoot, locale)),
      false,
      `.next/server/app/${locale} exists — a retired locale is still being built`,
    );
  }
  for (const locale of ["es", "de", "zh"]) {
    assert.ok(existsSync(path.join(prerenderRoot, locale)), `${locale} must still be prerendered`);
  }
});

test("build: rendered documents advertise no retired locale", buildOptions, () => {
  const offenders = [];
  let docs = 0;
  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) {
        if (!EXPECTED_RETIRED.includes(entry)) walk(absolute);
        continue;
      }
      if (!entry.endsWith(".html")) continue;
      docs += 1;
      const html = readFileSync(absolute, "utf8");
      for (const locale of EXPECTED_RETIRED) {
        if (new RegExp(`hreflang="${locale}"|hreflang="[^"]*?/${locale}/`).test(html)) {
          offenders.push(`${path.relative(prerenderRoot, absolute)} (${locale})`);
        }
        if (new RegExp(`rel="canonical"[^>]*href="[^"]*/${locale}/`).test(html)) {
          offenders.push(`${path.relative(prerenderRoot, absolute)} (canonical ${locale})`);
        }
      }
      if (/Português|Русский|العربية|Türkçe|Tiếng Việt|Bahasa Indonesia/.test(html)) {
        offenders.push(`${path.relative(prerenderRoot, absolute)} (retired endonym in the switcher)`);
      }
    }
  };
  walk(prerenderRoot);
  assert.deepEqual(offenders, [], "a rendered page still advertises or offers a retired language");
  assert.ok(docs > 100, `expected the full prerendered document set, saw ${docs}`);
});

test("build: the generated sitemap advertises no retired locale", buildOptions, () => {
  // Ground truth rather than a re-derivation of the policy: this is the exact
  // bytes a crawler receives at /sitemap.xml.
  const body = readFileSync(path.join(prerenderRoot, "sitemap.xml.body"), "utf8");
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const alternates = [...body.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ tag: m[1], href: m[2] }));
  assert.ok(locs.length > 50, `expected the full declared owner set, saw ${locs.length} <loc> entries`);

  for (const locale of EXPECTED_RETIRED) {
    assert.ok(
      !locs.some((url) => new RegExp(`^${siteUrl}/${locale}(/|$)`).test(url)),
      `sitemap still declares a /${locale} owner`,
    );
    assert.ok(
      !alternates.some((a) => a.tag === locale || new RegExp(`/${locale}(/|$)`).test(a.href)),
      `sitemap still advertises a /${locale} alternate`,
    );
  }
  // Every advertised tag must still be one of the four site languages, and the
  // set itself shrank under INTL-DEES-002B: a language is declared only where a
  // page really carries its copy, so ES and DE leave the sitemap's alternates
  // until a page-level promotion registers them. The retired six stay absent by
  // the loops above; the four remain the site's routing universe regardless.
  const advertised = [...new Set(alternates.map((a) => a.tag))];
  assert.ok(
    advertised.every((tag) => ALLOWED_HREFLANG_UNIVERSE.includes(tag)),
    `the sitemap advertises an hreflang tag outside the four-language universe: ${advertised.join(",")}`,
  );
  for (const tag of [htmlLang.es, htmlLang.de]) {
    assert.equal(
      advertised.includes(tag),
      false,
      `the sitemap declares ${tag} as a localized owner while no page carries ${tag} copy`,
    );
  }
  assert.deepEqual(advertised.sort(), ["en", "x-default", "zh-CN"]);
  // A deep page keeps only the genuinely translated pair plus x-default; ES and
  // DE stay untranslated copies and must not be promoted back by this change.
  const deep = body.slice(body.indexOf("/products/water-soluble-pva-yarn"));
  const deepTags = [...deep.slice(0, deep.indexOf("</url>")).matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(deepTags.sort(), ["en", "x-default", "zh-CN"]);
});

test("build: ES/DE deep copies keep canonicalising to English after retirement", buildOptions, () => {
  for (const locale of ACTIVE_FALLBACK_LOCALES) {
    const absolute = path.join(prerenderRoot, `${locale}/products/water-soluble-pva-yarn.html`);
    assert.ok(existsSync(absolute), `expected ${path.relative(repoRoot, absolute)}`);
    const html = readFileSync(absolute, "utf8");
    const canonical = (html.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1];
    assert.equal(canonical, `${siteUrl}/products/water-soluble-pva-yarn`, `${locale} deep copy drifted off English`);
    assert.equal((html.match(/rel="alternate"/g) ?? []).length, 0, `${locale} deep copy claims alternates`);
  }
});

// ---------------------------------------------------------------------------
function sourceFilesUnder(relativeRoot) {
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
}
