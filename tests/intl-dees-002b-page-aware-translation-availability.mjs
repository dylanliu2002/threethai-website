import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * INTL-DEES-002B — page-aware ES/DE translation availability.
 *
 * The architecture under test has two layers: `src/content/translation-availability.ts`
 * carries the evidence (which page, in which language, with what copy) and
 * `src/content/availability.ts` turns that evidence into the SEO answers
 * (canonical ownership, hreflang membership, sitemap eligibility). The card for
 * this task forbids translating anything, so the shipped registry must be empty
 * and every current ES/DE deep page must still behave exactly as GSC-INDEX-002
 * left it. Promotion is proven with a synthetic registry passed to
 * `createAvailabilityPolicy` — no shipped page is ever promoted here.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const {
  TRANSLATED_CONTENT_LOCALES,
  canonicalLocaleFor,
  canonicalUrlFor,
  contentHtmlLangOf,
  createAvailabilityPolicy,
  hreflangForPath,
  hreflangForRoute,
  isDeepContentDetail,
  isEnglishFallbackCopy,
  isSitemapEligible,
  localizedLocalesFor,
} = await importSource("src/content/availability.ts");

const {
  TRANSLATED_PAGES,
  isGenuineTranslation,
  isTranslationAvailable,
  rejectedTranslations,
  translatedCopyFor,
  translatedLocalesFor,
} = await importSource("src/content/translation-availability.ts");

const { htmlLang, localePath, locales, siteUrl } = await importSource("src/content/company.ts");
const { products } = await importSource("src/content/products.ts");
const { applications } = await importSource("src/content/applications.ts");
const { articles } = await importSource("src/content/articles.ts");
const { buyerAnswers } = await importSource("src/content/answers.ts");

/** Locales that need page-level evidence before they can own anything. */
const PROMOTION_LOCALES = locales.filter((l) => !TRANSLATED_CONTENT_LOCALES.includes(l));

const DEEP_PATHS = [
  ...products.map((p) => `/products/${p.slug}`),
  ...applications.map((a) => `/applications/${a.slug}`),
  ...articles.map((a) => `/knowledge/${a.slug}`),
  ...buyerAnswers.map((a) => `/answers/${a.slug}`),
];

const CORE_PATHS = [
  "/",
  "/products",
  "/applications",
  "/knowledge",
  "/answers",
  "/manufacturing",
  "/quality",
  "/about",
  "/contact",
  "/request-quote",
  "/request-sample",
  "/product-finder",
];

/** The page and section the promotion fixtures are built around. */
const PROMOTED = products[0];
const PROMOTED_PATH = `/products/${PROMOTED.slug}`;
const SIBLING_PATH = `/products/${products[1].slug}`;

/**
 * Test-only evidence: one page, one language, real Spanish copy that does not
 * exist in the shipped registry. Nothing here reaches `src/content/`, and no
 * shipped URL is promoted by this file.
 */
const SYNTHETIC_ES_PAGE = {
  path: PROMOTED_PATH,
  locale: "es",
  source: [PROMOTED.name.en, PROMOTED.metaDescription.en, PROMOTED.intro.en],
  translated: [
    "Fabricante de fibra corta de PVA",
    "Proveedor de fibra soluble en agua para procesos textiles y de papel.",
    "Explique su proceso y revisamos la especificación antes de confirmar muestras.",
  ],
};

assert.ok(
  PROMOTION_LOCALES.length === 2 && PROMOTION_LOCALES.every((l) => ["es", "de"].includes(l)),
  `expected ES and DE to be the promotion pair, got ${PROMOTION_LOCALES.join(",")}`,
);
assert.ok(DEEP_PATHS.length > 40, `deep-content inventory looks too small: ${DEEP_PATHS.length}`);
assert.notEqual(PROMOTED_PATH, SIBLING_PATH, "promotion fixture needs two distinct product pages");

// ---------------------------------------------------------------------------
// 1 · The genuine content locales are untouched by this change.
// ---------------------------------------------------------------------------
test("EN and ZH deep pages keep owning themselves", () => {
  for (const p of DEEP_PATHS) {
    assert.deepEqual([...localizedLocalesFor(p)], ["en", "zh"], p);
    assert.equal(canonicalLocaleFor(p, "en"), "en", p);
    assert.equal(canonicalLocaleFor(p, "zh"), "zh", p);
    assert.equal(canonicalUrlFor(p, "en"), `${siteUrl}${p}`, p);
    assert.equal(canonicalUrlFor(p, "zh"), `${siteUrl}/zh${p}`, p);
    assert.equal(isEnglishFallbackCopy(p, "en"), false, p);
    assert.equal(isEnglishFallbackCopy(p, "zh"), false, p);
    assert.deepEqual(Object.keys(hreflangForPath(p)).sort(), ["en", "x-default", "zh-CN"], p);
  }
});

// ---------------------------------------------------------------------------
// 2 & 3 · Every current ES and DE deep page is still an English fallback copy.
// ---------------------------------------------------------------------------
for (const locale of PROMOTION_LOCALES) {
  test(`every current ${locale.toUpperCase()} deep page is still an English fallback copy`, () => {
    for (const p of DEEP_PATHS) {
      assert.equal(isEnglishFallbackCopy(p, locale), true, `${locale} ${p} was promoted`);
      assert.equal(canonicalLocaleFor(p, locale), "en", `${locale} ${p} no longer consolidates`);
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale} ${p} moved off its owner`);
      assert.ok(!canonicalUrlFor(p, locale).includes(`/${locale}/`), `${locale} ${p} went self-canonical`);
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale} ${p} claims a language graph`);
      assert.equal(contentHtmlLangOf(p, locale), htmlLang.en, `${locale} ${p} claims translated body copy`);
      assert.equal(isTranslationAvailable(p, locale), false, `${locale} ${p} has no evidence yet`);
    }
  });
}

// ---------------------------------------------------------------------------
// 4 · The shipped registry promotes nothing, so nothing is a sitemap owner.
// ---------------------------------------------------------------------------
test("untranslated ES and DE pages are not sitemap owners and not alternates", () => {
  // Delivery-state pins for this card: no page may be promoted here, and a
  // page registered without its copy is a registry error the suite must catch.
  assert.deepEqual([...TRANSLATED_PAGES], [], "INTL-DEES-002B must ship an empty evidence registry");
  assert.deepEqual([...rejectedTranslations()], [], "a registered page must carry its translated copy");
  for (const p of DEEP_PATHS) {
    assert.deepEqual([...translatedLocalesFor(p)], [], p);
    for (const locale of PROMOTION_LOCALES) {
      assert.equal(isSitemapEligible(p, locale), false, `${locale} ${p} is a sitemap owner`);
    }
    // The sitemap declares alternates from this same map, so an absent locale
    // here is absent from the sitemap too.
    for (const url of Object.values(hreflangForPath(p))) {
      for (const locale of PROMOTION_LOCALES) {
        assert.ok(!url.includes(`${siteUrl}/${locale}/`), `${locale} advertised on ${p}`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// 5 · The helper answers per path, not per language.
// ---------------------------------------------------------------------------
test("the availability helper is path-aware", () => {
  for (const p of CORE_PATHS) {
    assert.equal(isDeepContentDetail(p), false, `${p} is not a chrome-localised route`);
    assert.deepEqual([...localizedLocalesFor(p)].sort(), [...locales].sort(), `${p} lost a locale`);
  }
  // Evidence for one path must not leak to another spelling, page or section.
  const policy = createAvailabilityPolicy([SYNTHETIC_ES_PAGE]);
  const cases = [
    ["the promoted page", PROMOTED_PATH, true],
    ["another page in the same section", SIBLING_PATH, false],
    ["a trailing-slash form", `${PROMOTED_PATH}/`, false],
    ["a prefix of the promoted slug", PROMOTED_PATH.slice(0, -1), false],
    ["a page in another deep section", `/knowledge/${articles[0].slug}`, false],
  ];
  for (const [label, path, expected] of cases) {
    assert.equal(policy.isSitemapEligible(path, "es"), expected, `${label} answered ${expected ? "no" : "yes"}`);
    assert.equal(isTranslationAvailable(path, "es", [SYNTHETIC_ES_PAGE]), expected, `${label} bypassed the policy`);
  }
});

// ---------------------------------------------------------------------------
// 6 · A page with real translated copy can become a localized SEO owner.
// ---------------------------------------------------------------------------
test("a proven translation makes that one page self-canonical, reciprocal and sitemap-eligible", () => {
  const promoted = createAvailabilityPolicy([SYNTHETIC_ES_PAGE]);

  assert.equal(promoted.isSitemapEligible(PROMOTED_PATH, "es"), true);
  assert.equal(promoted.isEnglishFallbackCopy(PROMOTED_PATH, "es"), false);
  assert.equal(promoted.canonicalLocaleFor(PROMOTED_PATH, "es"), "es");
  assert.equal(promoted.canonicalUrlFor(PROMOTED_PATH, "es"), `${siteUrl}/es${PROMOTED_PATH}`);
  assert.equal(promoted.contentHtmlLangOf(PROMOTED_PATH, "es"), htmlLang.es);
  assert.deepEqual([...promoted.localizedLocalesFor(PROMOTED_PATH)], ["en", "zh", "es"]);

  // Symmetric: the English owner and the promoted page declare the same graph.
  const fromEn = promoted.hreflangForRoute(PROMOTED_PATH, "en");
  const fromEs = promoted.hreflangForRoute(PROMOTED_PATH, "es");
  assert.deepEqual(fromEn, fromEs);
  assert.equal(fromEn[htmlLang.es], `${siteUrl}/es${PROMOTED_PATH}`);
  assert.equal(fromEn["x-default"], `${siteUrl}${PROMOTED_PATH}`);

  // The promotion stays on its page and its language.
  assert.deepEqual([...promoted.localizedLocalesFor(SIBLING_PATH)], ["en", "zh"]);
  assert.equal(promoted.canonicalUrlFor(PROMOTED_PATH, "de"), `${siteUrl}${PROMOTED_PATH}`);
  assert.equal(promoted.isSitemapEligible(PROMOTED_PATH, "de"), false);
  assert.equal(
    promoted.canonicalUrlFor(SIBLING_PATH, "es"),
    canonicalUrlFor(SIBLING_PATH, "es"),
    "the shipped policy must keep answering an unrelated path the same way",
  );
  // A promoted page never rewrites the site-wide content-locale baseline.
  assert.deepEqual([...TRANSLATED_CONTENT_LOCALES], ["en", "zh"]);
  assert.deepEqual([...PROMOTION_LOCALES], ["es", "de"]);

  // The copy that justifies the promotion is the copy the route must render.
  assert.deepEqual([...translatedCopyFor(PROMOTED_PATH, "es", [SYNTHETIC_ES_PAGE])], SYNTHETIC_ES_PAGE.translated);
  assert.equal(translatedCopyFor(PROMOTED_PATH, "de", [SYNTHETIC_ES_PAGE]), undefined);
  assert.equal(translatedCopyFor(PROMOTED_PATH, "es"), undefined, "shipped registry must stay empty");

  // DE gets the same treatment through the same mechanism, without touching ES.
  const promotedDe = createAvailabilityPolicy([{ ...SYNTHETIC_ES_PAGE, locale: "de" }]);
  assert.equal(promotedDe.isSitemapEligible(PROMOTED_PATH, "de"), true);
  assert.equal(promotedDe.isSitemapEligible(PROMOTED_PATH, "es"), false);
});

// ---------------------------------------------------------------------------
// 7 · A claim without copy is refused.
// ---------------------------------------------------------------------------
test("a page marked available without real translated copy is never promoted", () => {
  const claims = [
    { label: "no copy at all", page: { ...SYNTHETIC_ES_PAGE, translated: [] } },
    {
      label: "a partial page",
      page: { ...SYNTHETIC_ES_PAGE, translated: SYNTHETIC_ES_PAGE.translated.slice(0, 2) },
    },
    { label: "an empty block", page: { ...SYNTHETIC_ES_PAGE, translated: ["", "  ", SYNTHETIC_ES_PAGE.translated[2]] } },
    {
      label: "the English copy pasted back",
      page: { ...SYNTHETIC_ES_PAGE, translated: [...SYNTHETIC_ES_PAGE.source] },
    },
    {
      label: "one translated block over an English page",
      page: {
        ...SYNTHETIC_ES_PAGE,
        translated: [SYNTHETIC_ES_PAGE.translated[0], SYNTHETIC_ES_PAGE.source[1], SYNTHETIC_ES_PAGE.source[2]],
      },
    },
  ];

  for (const { label, page } of claims) {
    assert.equal(isGenuineTranslation(page), false, `${label} must not count as a translation`);
    assert.equal(isTranslationAvailable(PROMOTED_PATH, "es", [page]), false, label);
    const claimed = createAvailabilityPolicy([page]);
    assert.equal(claimed.canonicalUrlFor(PROMOTED_PATH, "es"), `${siteUrl}${PROMOTED_PATH}`, label);
    assert.equal(claimed.hreflangForRoute(PROMOTED_PATH, "es"), undefined, label);
    assert.equal(claimed.isSitemapEligible(PROMOTED_PATH, "es"), false, label);
  }

  assert.equal(rejectedTranslations(claims.map((c) => c.page)).length, claims.length);
  // The honest entry next to the dishonest ones still promotes only its page.
  const mixed = createAvailabilityPolicy([...claims.map((c) => c.page), SYNTHETIC_ES_PAGE]);
  assert.equal(mixed.isSitemapEligible(PROMOTED_PATH, "es"), true);
  assert.equal(mixed.isSitemapEligible(SIBLING_PATH, "es"), false);
});

// ---------------------------------------------------------------------------
// Wiring: the SEO surfaces must keep deriving from the one policy.
// ---------------------------------------------------------------------------
test("no SEO surface keeps a private answer about translation availability", () => {
  const sitemap = read("src/app/sitemap.ts");
  assert.match(sitemap, /hreflangForPath\(path\)/, "sitemap must declare alternates through the policy");
  assert.match(sitemap, /localePath\(path, "en"\)/, "sitemap owners must stay prefix-free English");
  for (const locale of PROMOTION_LOCALES) {
    assert.doesNotMatch(sitemap, new RegExp(`"${locale}"`), `sitemap enumerates ${locale}`);
  }

  const seo = read("src/lib/seo.tsx");
  assert.match(seo, /canonicalUrlFor\(path, locale\)/);
  assert.match(seo, /hreflangForRoute\(path, locale\)/);
  assert.match(seo, /indexabilityForRoute\(path, locale\)/);

  // The promotion API must not be re-implemented beside the policy.
  const policySource = read("src/content/availability.ts");
  assert.match(policySource, /isTranslationAvailable\(path, locale, registry\)/);
  assert.doesNotMatch(policySource, /=== "es"|"es" ===/, "the policy may not special-case a locale");
  assert.doesNotMatch(sitemap, /translation-availability/, "only the policy may read the evidence");
  for (const file of ["src/lib/seo.tsx", "src/components/layout/site-header.tsx", "src/app/[lang]/products/[slug]/page.tsx"]) {
    assert.doesNotMatch(read(file), /translation-availability/, `${file} bypasses the policy`);
  }
});
