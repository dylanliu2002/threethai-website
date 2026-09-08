import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * INTL-DEES-002B — page-aware ES/DE translation availability.
 *
 * Two blockers, two invariants:
 *
 * 1. A page may not become an SEO owner in a language its renderer does not
 *    serve. Ownership and body copy come from one resolution
 *    (`resolvedContentLocaleOf` / `pageCopyFor`) reading one registry, and a
 *    promotion whose entry leaves out a field the page renders fails at render.
 * 2. Availability is a per-path fact for ES and DE everywhere, including the
 *    core and section routes GSC-INDEX-002 used to exempt by path class.
 *
 * Nothing is translated or promoted here: the shipped registry stays empty, so
 * every ES/DE answer is the fallback posture, and promotion is proven only
 * through synthetic registries passed to `createAvailabilityPolicy`.
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
  isEnglishFallbackCopy,
  isLocalizedAt,
  isSitemapEligible,
  localizedLocalesFor,
} = await importSource("src/content/availability.ts");

const {
  TRANSLATED_PAGES,
  isGenuineTranslation,
  isTranslationAvailable,
  pageCopyFor,
  rejectedTranslations,
  resolvedContentLocaleOf,
  translatedLocalesFor,
  translatedPageFor,
} = await importSource("src/content/translation-availability.ts");

const { contentLocaleOf, htmlLang, locales, siteUrl } = await importSource("src/content/company.ts");
const { products } = await importSource("src/content/products.ts");
const { applications } = await importSource("src/content/applications.ts");
const { articles } = await importSource("src/content/articles.ts");
const { buyerAnswers } = await importSource("src/content/answers.ts");

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

/** The fields of an entity record that hold one value per content locale. */
function contentFieldsOf(record) {
  return Object.entries(record)
    .filter(([, value]) => value !== null && typeof value === "object" && !Array.isArray(value)
      && "en" in value && "zh" in value && Object.keys(value).length === 2)
    .map(([field]) => field);
}

/** A test-only "translation": marked, non-empty, same shape as the English. */
function synth(value) {
  if (Array.isArray(value)) return value.map(synth);
  return `traducido | ${value}`;
}

/** A complete honest entry covering every body field of one record. */
function entryFor(record, pagePath, locale, only) {
  const source = {};
  const content = {};
  for (const field of only ?? contentFieldsOf(record)) {
    source[field] = record[field].en;
    content[field] = synth(record[field].en);
  }
  return { path: pagePath, locale, source, content };
}

const PROMOTED = products[0];
const PROMOTED_PATH = `/products/${PROMOTED.slug}`;
const SIBLING_PATH = `/products/${products[1].slug}`;
const FIELDS = contentFieldsOf(PROMOTED);
const COMPLETE_ES_PAGE = entryFor(PROMOTED, PROMOTED_PATH, "es");

assert.ok(FIELDS.length >= 6, `expected a product record to carry its body fields, found ${FIELDS.length}`);
assert.ok(DEEP_PATHS.length > 40, `deep-content inventory looks too small: ${DEEP_PATHS.length}`);
assert.deepEqual(PROMOTION_LOCALES, ["es", "de"], "ES and DE must be the promotion pair");

// ---------------------------------------------------------------------------
// 1 · The locales the content model carries keep owning every page.
// ---------------------------------------------------------------------------
test("EN and ZH keep owning every page, deep and core", () => {
  for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
    for (const locale of TRANSLATED_CONTENT_LOCALES) {
      assert.equal(resolvedContentLocaleOf(p, locale), locale, `${locale} ${p}`);
      assert.equal(isLocalizedAt(p, locale), true, `${locale} ${p}`);
      assert.equal(canonicalLocaleFor(p, locale), locale, `${locale} ${p}`);
      assert.equal(isEnglishFallbackCopy(p, locale), false, `${locale} ${p}`);
      assert.notEqual(hreflangForRoute(p, locale), undefined, `${locale} ${p} lost its graph`);
    }
  }
  for (const p of DEEP_PATHS) {
    assert.deepEqual([...localizedLocalesFor(p)], ["en", "zh"], p);
    assert.deepEqual(Object.keys(hreflangForPath(p)).sort(), ["en", "x-default", "zh-CN"], p);
  }
});

// ---------------------------------------------------------------------------
// 2 & 3 · Every current ES and DE page — deep and core — is still a fallback.
// ---------------------------------------------------------------------------
for (const locale of PROMOTION_LOCALES) {
  test(`every current ${locale.toUpperCase()} page, deep and core, is an English fallback copy`, () => {
    for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
      assert.equal(resolvedContentLocaleOf(p, locale), "en", `${locale} ${p} resolved to its own copy`);
      assert.equal(isEnglishFallbackCopy(p, locale), true, `${locale} ${p} was promoted`);
      assert.equal(canonicalLocaleFor(p, locale), "en", `${locale} ${p} no longer consolidates`);
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale} ${p} moved off its owner`);
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale} ${p} claims a language graph`);
      assert.equal(isSitemapEligible(p, locale), false, `${locale} ${p} is a sitemap owner`);
      assert.equal(contentHtmlLangOf(p, locale), htmlLang.en, `${locale} ${p} claims translated body copy`);
      assert.equal(isTranslationAvailable(p, locale), false, `${locale} ${p} has no evidence yet`);
    }
  });
}

// ---------------------------------------------------------------------------
// 4 · The shipped registry promotes nothing, on any path.
// ---------------------------------------------------------------------------
test("the shipped registry promotes zero ES or DE pages", () => {
  assert.deepEqual([...TRANSLATED_PAGES], [], "INTL-DEES-002B must ship an empty evidence registry");
  assert.deepEqual([...rejectedTranslations()], [], "a registered page must carry its translated copy");
  assert.deepEqual([...TRANSLATED_CONTENT_LOCALES], ["en", "zh"], "the model baseline must not absorb a promotion");
  for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
    assert.deepEqual([...translatedLocalesFor(p)], [], p);
    for (const locale of PROMOTION_LOCALES) {
      assert.equal(translatedPageFor(p, locale), undefined, `${locale} ${p}`);
    }
  }
  for (const p of CORE_PATHS) {
    assert.deepEqual([...localizedLocalesFor(p)], ["en", "zh"], `${p} still claims a locale it cannot render`);
  }
});

// ---------------------------------------------------------------------------
// 5 · Ownership and rendering are the same resolution, on one page.
// ---------------------------------------------------------------------------
test("a promotion moves SEO ownership and rendered copy together, for that page only", () => {
  // Unpromoted: the renderer gets the model record and the key it always used.
  for (const locale of locales) {
    const plain = pageCopyFor(SIBLING_PATH, locale, PROMOTED);
    assert.equal(plain.entity, PROMOTED, `${locale} ${SIBLING_PATH} altered an unpromoted record`);
    assert.equal(plain.contentLocale, contentLocaleOf(locale), `${locale} changed the render key`);
  }

  const promoted = createAvailabilityPolicy([COMPLETE_ES_PAGE]);
  const policyPath = (fn) => fn(PROMOTED_PATH);

  assert.equal(policyPath((p) => promoted.isSitemapEligible(p, "es")), true);
  assert.equal(promoted.canonicalUrlFor(PROMOTED_PATH, "es"), `${siteUrl}/es${PROMOTED_PATH}`);
  assert.equal(promoted.contentHtmlLangOf(PROMOTED_PATH, "es"), htmlLang.es);
  assert.deepEqual([...promoted.localizedLocalesFor(PROMOTED_PATH)], ["en", "zh", "es"]);

  // The same registry entry is what the renderer resolves: it indexes every body
  // field in the promoted language, so ownership never precedes the copy.
  const rendered = pageCopyFor(PROMOTED_PATH, "es", PROMOTED, [COMPLETE_ES_PAGE]);
  assert.equal(rendered.contentLocale, "es");
  assert.notEqual(rendered.entity, PROMOTED, "the promoted page must not render the English record");
  for (const field of FIELDS) {
    assert.deepEqual(rendered.entity[field].es, synth(PROMOTED[field].en), field);
    assert.equal(rendered.entity[field].en, PROMOTED[field].en, `${field} overwrote the English owner`);
  }
  assert.equal(resolvedContentLocaleOf(PROMOTED_PATH, "es", [COMPLETE_ES_PAGE]), rendered.contentLocale,
    "policy and renderer disagreed about the language of this page");

  // Symmetric hreflang, and the English owner now declares the real equivalent.
  const fromEn = promoted.hreflangForRoute(PROMOTED_PATH, "en");
  const fromEs = promoted.hreflangForRoute(PROMOTED_PATH, "es");
  assert.deepEqual(fromEn, fromEs);
  assert.equal(fromEn[htmlLang.es], `${siteUrl}/es${PROMOTED_PATH}`);
  assert.equal(fromEn["x-default"], `${siteUrl}${PROMOTED_PATH}`);

  // The promotion stays on its page and its language.
  assert.equal(promoted.isSitemapEligible(SIBLING_PATH, "es"), false);
  assert.equal(promoted.canonicalUrlFor(PROMOTED_PATH, "de"), `${siteUrl}${PROMOTED_PATH}`);
  assert.equal(pageCopyFor(SIBLING_PATH, "es", products[1], [COMPLETE_ES_PAGE]).contentLocale, "en");
  assert.deepEqual([...promoted.localizedLocalesFor(SIBLING_PATH)], ["en", "zh"]);

  // DE reaches the same status through the same mechanism, without ES alongside it.
  const promotedDe = createAvailabilityPolicy([entryFor(PROMOTED, PROMOTED_PATH, "de")]);
  assert.equal(promotedDe.isSitemapEligible(PROMOTED_PATH, "de"), true);
  assert.equal(promotedDe.isSitemapEligible(PROMOTED_PATH, "es"), false);
});

// ---------------------------------------------------------------------------
// 6 · Evidence cannot outrun the renderer.
// ---------------------------------------------------------------------------
test("evidence alone cannot make an owner whose renderer still uses English", () => {
  // An entry that covers only some of the page's body fields proves less than
  // the page renders: it is honest about itself, so the policy would promote it,
  // and the renderer then refuses to ship rather than label English copy Spanish.
  const partial = entryFor(PROMOTED, PROMOTED_PATH, "es", FIELDS.slice(0, FIELDS.length - 1));
  assert.equal(isGenuineTranslation(partial), true, "the entry itself is internally honest");
  assert.equal(isTranslationAvailable(PROMOTED_PATH, "es", [partial]), true);
  assert.throws(
    () => pageCopyFor(PROMOTED_PATH, "es", PROMOTED, [partial]),
    /has no translated/,
    "a page may not be promoted while a field it renders is uncovered",
  );

  const claims = [
    ["no fields at all", { ...COMPLETE_ES_PAGE, content: {}, source: {} }],
    ["an empty block", { ...COMPLETE_ES_PAGE, content: { ...COMPLETE_ES_PAGE.content, name: "   " } }],
    ["a one-sided field map", { ...COMPLETE_ES_PAGE, content: { name: "Fabricante de fibra de PVA" } }],
    ["the English pasted back", { ...COMPLETE_ES_PAGE, content: { ...COMPLETE_ES_PAGE.source } }],
    ["one field left in English", {
      ...COMPLETE_ES_PAGE,
      content: { ...COMPLETE_ES_PAGE.content, intro: COMPLETE_ES_PAGE.source.intro },
    }],
    ["a path outside the entity routes", entryFor(PROMOTED, "/quality", "es")],
    ["the section index", entryFor(PROMOTED, "/products", "es")],
  ];
  for (const [label, page] of claims) {
    assert.equal(isGenuineTranslation(page), false, `${label} must not count as a translation`);
    assert.equal(isTranslationAvailable(PROMOTED_PATH, "es", [page]), false, label);
    const claimed = createAvailabilityPolicy([page]);
    assert.equal(claimed.canonicalUrlFor(PROMOTED_PATH, "es"), `${siteUrl}${PROMOTED_PATH}`, label);
    assert.equal(claimed.hreflangForRoute(PROMOTED_PATH, "es"), undefined, label);
    assert.equal(claimed.isSitemapEligible(PROMOTED_PATH, "es"), false, label);
    assert.equal(pageCopyFor(PROMOTED_PATH, "es", PROMOTED, [page]).contentLocale, "en", label);
  }

  assert.equal(rejectedTranslations(claims.map(([, page]) => page)).length, claims.length);
  // Honest and complete entry beside dishonest ones promotes its page alone.
  const mixed = createAvailabilityPolicy([...claims.map(([, page]) => page), COMPLETE_ES_PAGE]);
  assert.equal(mixed.isSitemapEligible(PROMOTED_PATH, "es"), true);
  assert.equal(mixed.isSitemapEligible(SIBLING_PATH, "es"), false);
});

// ---------------------------------------------------------------------------
// 7 · Nothing beside the policy and the resolution may answer availability.
// ---------------------------------------------------------------------------
test("the SEO surfaces and the deep renderers share one source of the answer", () => {
  const policy = read("src/content/availability.ts");
  assert.match(policy, /locales\.filter\(\(locale\) => resolvedContentLocaleOf\(path, locale, registry\) === locale\)/,
    "the policy must ask the render resolution, not a class of paths");
  assert.doesNotMatch(policy, /if \(!isDeepContentDetail\(path\)\) return true/, "the path-class exemption must stay gone");
  assert.doesNotMatch(policy, /=== "es"|"es" ===|"de" ===/, "the policy may not special-case a locale");
  assert.match(read("src/app/sitemap.ts"), /hreflangForPath\(path\)/, "sitemap must declare alternates through the policy");
  assert.doesNotMatch(read("src/app/sitemap.ts"), /translation-availability/, "only the policy may read the evidence");
  assert.match(read("src/lib/seo.tsx"), /canonicalUrlFor\(path, locale\)/);
  assert.doesNotMatch(read("src/lib/seo.tsx"), /translation-availability/, "metadata must not bypass the policy");

  const deepRenderers = [
    "src/components/product/product-view.tsx",
    "src/components/application/application-view.tsx",
    "src/components/answers/answer-article.tsx",
    "src/app/[lang]/products/[slug]/page.tsx",
    "src/app/[lang]/applications/[slug]/page.tsx",
    "src/app/[lang]/answers/[slug]/page.tsx",
    "src/app/[lang]/knowledge/[slug]/page.tsx",
  ];
  for (const file of deepRenderers) {
    const source = read(file);
    assert.match(source, /pageCopyFor\(/, `${file} must resolve its own page copy through the registry`);
    assert.match(source, /contentLocale/, `${file} must index its own fields with the resolved key`);
  }
});
