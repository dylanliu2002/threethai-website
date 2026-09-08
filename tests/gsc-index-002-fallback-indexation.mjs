import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * GSC-INDEX-002 — fallback-locale duplicate indexation.
 *
 * These tests pin the content-availability policy that decides canonical,
 * hreflang, indexability and sitemap membership for every locale, and prove
 * the surfaces that consume it no longer keep their own locale list.
 *
 * Runtime note: the policy lives in TypeScript and is imported directly, which
 * needs Node's built-in type stripping (Node >= 22.18 / 23.6 / 24.x).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const {
  TRANSLATED_CONTENT_LOCALES,
  canonicalLocaleFor,
  canonicalUrlFor,
  contentHtmlLangOf,
  hreflangForPath,
  hreflangForRoute,
  indexabilityForRoute,
  isEnglishFallbackCopy,
  isLocalizedAt,
  isSitemapEligible,
  localizedLocalesFor,
} = await importSource("src/content/availability.ts");

const company = await importSource("src/content/company.ts");
const { siteUrl, locales, htmlLang, localePath, dynamicLocales } = company;

const { articles } = await importSource("src/content/articles.ts");
const { buyerAnswers } = await importSource("src/content/answers.ts");
const { products } = await importSource("src/content/products.ts");
const { applications } = await importSource("src/content/applications.ts");

/**
 * The locales whose deep content is an English fallback copy, derived from the
 * supported locale set minus the genuinely translated ones.
 *
 * This used to be the literal `["es","pt","ru","ar","tr","vi","id","de"]`.
 * LOCALE-RETIRE-001 took six of those languages out of service, and the card
 * for it is explicit that the *policy* is what this suite pins — the inventory
 * belongs to `src/content/company.ts` and `./availability.ts`. A literal here
 * would fail for a supported-locale change that breaks nothing about fallback
 * canonicalisation, and would pass if someone re-added a locale to the model.
 */
const FALLBACK_LOCALES = locales.filter((l) => !TRANSLATED_CONTENT_LOCALES.includes(l));

/** Every real entity detail path the site renders from ContentLocale data. */
const DEEP_PATHS = [
  ...buyerAnswers.map((a) => `/answers/${a.slug}`),
  ...articles.map((a) => `/knowledge/${a.slug}`),
  ...products.map((p) => `/products/${p.slug}`),
  ...applications.map((a) => `/applications/${a.slug}`),
];

/** Section index pages and core buyer-journey pages: must keep behaving. */
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

/** CJK Unified Ideographs — the presence of real Chinese body copy. */
const hasCjk = (value) => /[一-鿿]/.test(value);

assert.equal(
  DEEP_PATHS.length,
  buyerAnswers.length + articles.length + products.length + applications.length,
  "deep-content inventory must cover every entity detail path",
);
assert.ok(buyerAnswers.length >= 30, `expected at least 30 buyer answers, got ${buyerAnswers.length}`);
assert.ok(articles.length >= 4, `expected at least 4 knowledge articles, got ${articles.length}`);
assert.ok(products.length >= 4, `expected at least 4 products, got ${products.length}`);
assert.ok(applications.length >= 4, `expected at least 4 applications, got ${applications.length}`);
assert.equal(new Set(DEEP_PATHS).size, DEEP_PATHS.length, "duplicate deep path in inventory");
// Vacuity guard, not an inventory pin: if every supported locale had genuine
// deep content, every `for (const locale of FALLBACK_LOCALES)` loop below would
// silently test nothing.
assert.ok(
  locales.length > TRANSLATED_CONTENT_LOCALES.length,
  "no supported locale is left as an English fallback copy; the policy loops below are vacuous",
);
assert.deepEqual(
  TRANSLATED_CONTENT_LOCALES.filter((l) => !locales.includes(l)),
  [],
  "a locale with genuine deep content must be a locale the site serves",
);

// ---------------------------------------------------------------------------
// 1 · English deep content keeps its own canonical.
// ---------------------------------------------------------------------------
test("English deep content is self-canonical", () => {
  for (const p of DEEP_PATHS) {
    assert.equal(canonicalLocaleFor(p, "en"), "en", p);
    assert.equal(canonicalUrlFor(p, "en"), `${siteUrl}${p}`);
    assert.equal(isEnglishFallbackCopy(p, "en"), false, p);
  }
});

// ---------------------------------------------------------------------------
// 2 · Genuine Simplified Chinese deep content keeps its own canonical.
// ---------------------------------------------------------------------------
test("Chinese deep content is self-canonical and genuinely translated", () => {
  const translatedTitles = [
    ...articles.map((a) => a.title.zh),
    ...buyerAnswers.map((a) => a.question.zh),
    ...products.map((p) => p.name.zh),
    ...applications.map((a) => a.name.zh),
  ];
  // The self-canonical is only honest while the copy really is Chinese.
  for (const title of translatedTitles) {
    assert.ok(hasCjk(title), `expected Chinese body copy, got: ${title}`);
  }

  for (const p of DEEP_PATHS) {
    assert.equal(canonicalLocaleFor(p, "zh"), "zh", p);
    assert.equal(canonicalUrlFor(p, "zh"), `${siteUrl}/zh${p}`);
    assert.equal(isEnglishFallbackCopy(p, "zh"), false, p);
  }
});

// ---------------------------------------------------------------------------
// 3 · Every fallback-locale deep-content URL points at its English original.
// ---------------------------------------------------------------------------
test("fallback-locale deep content canonicalises to the English URL", () => {
  for (const p of DEEP_PATHS) {
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(isEnglishFallbackCopy(p, locale), true, `${locale} ${p}`);
      assert.equal(canonicalLocaleFor(p, locale), "en", `${locale} ${p}`);
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale} ${p}`);
      // The English target must never carry the fallback prefix.
      assert.ok(!canonicalUrlFor(p, locale).includes(`/${locale}/`), `${locale} ${p}`);
    }
  }

  // Worked example from the task card.
  const example = `/answers/${buyerAnswers[0].slug}`;
  assert.equal(canonicalUrlFor(example, "es"), `${siteUrl}${example}`);
});

// ---------------------------------------------------------------------------
// 4 · Fallback copies leave the hreflang graph entirely.
// ---------------------------------------------------------------------------
test("fallback deep content is absent from the hreflang graph", () => {
  for (const p of DEEP_PATHS) {
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale} ${p}`);
    }
    const advertised = Object.values(hreflangForPath(p));
    for (const locale of FALLBACK_LOCALES) {
      for (const url of advertised) {
        assert.ok(!url.includes(`${siteUrl}/${locale}/`), `${locale} advertised on ${p}`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// 5 · The English canonical does not advertise untranslated equivalents.
// ---------------------------------------------------------------------------
test("deep-content hreflang graph carries only real equivalents", () => {
  for (const p of DEEP_PATHS) {
    const map = hreflangForPath(p);
    assert.deepEqual(
      Object.keys(map).sort(),
      ["en", "x-default", "zh-CN"],
      `unexpected hreflang set on ${p}: ${Object.keys(map).join(",")}`,
    );
    assert.equal(map.en, `${siteUrl}${p}`);
    assert.equal(map["zh-CN"], `${siteUrl}/zh${p}`);
    assert.equal(map["x-default"], `${siteUrl}${p}`);
  }
});

test("hreflang remains bidirectional between English and Chinese", () => {
  for (const p of DEEP_PATHS) {
    const fromEn = hreflangForRoute(p, "en");
    const fromZh = hreflangForRoute(p, "zh");
    assert.deepEqual(fromEn, fromZh, `asymmetric graph on ${p}`);
    assert.equal(fromEn[htmlLang.zh], fromZh[htmlLang.zh]);
  }
});

// ---------------------------------------------------------------------------
// 6 · Sitemap membership follows the same policy.
// ---------------------------------------------------------------------------
test("sitemap does not advertise false translated deep pages", () => {
  const source = read("src/app/sitemap.ts");
  // The sitemap must consume the policy instead of enumerating locales itself.
  assert.match(source, /hreflangForPath\(path\)/);
  assert.doesNotMatch(source, /for \(const l of \[[^\]]*dynamicLocales/);
  assert.doesNotMatch(source, /htmlLang/);

  for (const p of DEEP_PATHS) {
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(isSitemapEligible(p, locale), false, `${locale} ${p}`);
    }
  }
});

test("sitemap keeps the English canonical and the genuine Chinese equivalent", () => {
  for (const p of DEEP_PATHS) {
    assert.equal(isSitemapEligible(p, "en"), true, p);
    assert.equal(isSitemapEligible(p, "zh"), true, p);
  }
});

// ---------------------------------------------------------------------------
// 7 · Indexability agrees with the canonical policy.
// ---------------------------------------------------------------------------
test("robots posture agrees with the canonical policy", () => {
  for (const p of DEEP_PATHS) {
    for (const locale of [...FALLBACK_LOCALES, "en", "zh"]) {
      const { index, follow, ownsOwnCanonical } = indexabilityForRoute(p, locale);
      assert.equal(index, true, `${locale} ${p}`);
      assert.equal(follow, true, `${locale} ${p}`);
      assert.equal(ownsOwnCanonical, !isEnglishFallbackCopy(p, locale), `${locale} ${p}`);
      // A copy that is not the declared document never carries hreflang, and a
      // page that owns its canonical always declares its own language graph.
      if (!ownsOwnCanonical) {
        assert.equal(hreflangForRoute(p, locale), undefined, `${locale} ${p}`);
      } else {
        assert.notEqual(hreflangForRoute(p, locale), undefined, `${locale} ${p}`);
      }
    }
  }
});

test("body-copy language follows the canonical owner, not the URL prefix", () => {
  for (const p of DEEP_PATHS) {
    assert.equal(contentHtmlLangOf(p, "en"), "en");
    assert.equal(contentHtmlLangOf(p, "zh"), "zh-CN");
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(contentHtmlLangOf(p, locale), "en", `${locale} ${p}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 8 · Core pages keep their genuine owners.
//
// The full supported-locale graph this test used to require on every core path
// rested on a class-wide exemption: "not a detail page" was treated as
// "translated in every locale". INTL-DEES-002B removed it — ES/DE translate
// 128 of 248 UI strings over English body copy — so ES and DE now consolidate
// onto the English owner here too. What this test is for is unchanged: a page
// whose copy really exists owns its canonical and declares exactly its real
// equivalents.
// ---------------------------------------------------------------------------
test("core pages keep their genuine localized owners and claim no false one", () => {
  for (const p of CORE_PATHS) {
    assert.deepEqual([...localizedLocalesFor(p)].sort(), [...TRANSLATED_CONTENT_LOCALES].sort(), p);
    for (const locale of TRANSLATED_CONTENT_LOCALES) {
      assert.equal(isLocalizedAt(p, locale), true, `${locale} ${p}`);
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${localePath(p, locale)}`, `${locale} ${p}`);
    }
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(isEnglishFallbackCopy(p, locale), true, `${locale} ${p} claims ownership it has no copy for`);
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale} ${p}`);
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale} ${p} claims a language graph`);
    }
    const map = hreflangForPath(p);
    assert.equal(Object.keys(map).length, TRANSLATED_CONTENT_LOCALES.length + 1, `${p} graph is not its real equivalents`);
    assert.equal(map["x-default"], `${siteUrl}${localePath(p, "en")}`);
  }
});

// ---------------------------------------------------------------------------
// 9 · The canonical chain terminates; it cannot loop.
// ---------------------------------------------------------------------------
test("canonical resolution is idempotent so no canonical chain can loop", () => {
  for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
    for (const locale of locales) {
      const owner = canonicalLocaleFor(p, locale);
      assert.equal(canonicalLocaleFor(p, owner), owner, `${locale} ${p}`);
      assert.equal(canonicalUrlFor(p, owner), canonicalUrlFor(p, locale), `${locale} ${p}`);
    }
  }
});

test("the proxy redirect map is untouched by this change", () => {
  const source = read("src/proxy.ts");
  // Language selection stays a user-navigation concern; no SEO canonical is
  // expressed as a redirect here, so no new redirect edge can form a loop.
  assert.doesNotMatch(source, /canonical/i);
});

// ---------------------------------------------------------------------------
// 10 · No route is dropped, and every advertised alternate is routable.
// ---------------------------------------------------------------------------
test("every advertised hreflang target is a route the app actually serves", () => {
  function routeTemplates(relativeRoot) {
    const routes = new Set();
    const absoluteRoot = path.join(repoRoot, relativeRoot);
    const visit = (directory) => {
      for (const entry of readdirSync(directory)) {
        const absolute = path.join(directory, entry);
        if (statSync(absolute).isDirectory()) {
          visit(absolute);
          continue;
        }
        if (entry !== "page.tsx") continue;
        const relative = path.relative(absoluteRoot, directory).split(path.sep).filter(Boolean);
        routes.add(relative.length ? `/${relative.join("/")}` : "/");
      }
    };
    visit(absoluteRoot);
    return routes;
  }

  // /[lang] serves every non-English locale; (site) serves English at root.
  const dynamic = routeTemplates("src/app/[lang]");
  const english = routeTemplates("src/app/(site)");
  assert.ok(dynamicLocales.includes("zh"), "zh must stay in dynamicLocales");

  for (const p of DEEP_PATHS) {
    const segments = p.split("/");
    const template = `/${segments[1]}/[slug]`;
    assert.ok(english.has(template), `English canonical route missing: ${template}`);
    assert.ok(dynamic.has(template), `locale route that renders ${p} is missing`);

    for (const url of Object.values(hreflangForPath(p))) {
      const pathname = url.slice(siteUrl.length) || "/";
      const prefixed = pathname.split("/")[1];
      const unprefixed = dynamicLocales.includes(prefixed)
        ? `/${pathname.split("/").slice(2).join("/")}`
        : pathname;
      const candidate = `/${unprefixed.split("/")[1]}/[slug]`;
      const served = dynamicLocales.includes(prefixed) ? dynamic.has(candidate) : english.has(candidate);
      assert.ok(served, `hreflang target has no serving route: ${url}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Wiring: no surface keeps a private locale list.
// ---------------------------------------------------------------------------
test("metadata builder delegates locale decisions to the policy", () => {
  const source = read("src/lib/seo.tsx");
  assert.match(source, /canonicalUrlFor\(path, locale\)/);
  assert.match(source, /hreflangForRoute\(path, locale\)/);
  assert.match(source, /indexabilityForRoute\(path, locale\)/);
  // The old self-canonical + private per-locale loop must not come back.
  assert.doesNotMatch(source, /for \(const l of locales\)/);
  assert.doesNotMatch(source, /`\$\{siteUrl\}\$\{localePath\(path, locale\)\}`/);
});

test("no route overrides the shared hreflang policy", () => {
  const files = [
    "src/app/(site)/answers/[slug]/page.tsx",
    "src/app/(site)/knowledge/[slug]/page.tsx",
    "src/app/(site)/products/[slug]/page.tsx",
    "src/app/[lang]/answers/[slug]/page.tsx",
    "src/app/[lang]/knowledge/[slug]/page.tsx",
    "src/app/[lang]/products/[slug]/page.tsx",
    "src/app/zh/products/[slug]/page.tsx",
    "src/app/zh/applications/[slug]/page.tsx",
  ];
  for (const f of files) {
    assert.doesNotMatch(read(f), /alternates:\s*\{/, `${f} declares its own alternates`);
  }
});

test("deep-content structured data reports the canonical owner", () => {
  assert.match(read("src/app/[lang]/answers/[slug]/page.tsx"), /section: "answers",\s*\n\s*locale,/);
  assert.match(read("src/app/[lang]/knowledge/[slug]/page.tsx"), /section: "knowledge",\s*\n\s*locale,/);
  assert.match(read("src/app/[lang]/products/[slug]/page.tsx"), /slug: product\.slug, locale \}/);
  assert.match(read("src/app/[lang]/answers/[slug]/page.tsx"), /webPageSchema\(\{/);
});

test("language switcher keeps navigation but stops claiming false hreflang", () => {
  const source = read("src/components/layout/site-header.tsx");
  // INTL-DEES-003B moved this question across the server/client boundary. The
  // switcher is `"use client"`, and calling the availability policy from it
  // shipped the whole evidence gate to browsers (+1,684 B raw / +586 B gzip on a
  // chunk loaded by 220 of 222 documents) to answer something the server already
  // knows. The gate's *answer* now arrives as a serializable prop, and an
  // unresolved path falls back to the model-guaranteed baseline (never to another
  // page's promotion); the gating below is byte-for-byte the behaviour this test
  // was written to protect.
  assert.match(source, /const localizedTargets = availableLocales\.exceptions\[currentPath\] \?\? availableLocales\.baseline;/);
  assert.doesNotMatch(source, /@\/content\/(?:availability|translation-availability|translation-evidence)/,
    "the browser component may not import the ownership policy");
  assert.match(
    source,
    /hrefLang=\{localizedTargets\.includes\(l\) \? htmlLang\[l\] : undefined\}/,
  );
  // User-facing navigation for every locale is preserved.
  assert.match(source, /locales\.map\(\(l\) =>/);
  assert.match(source, /href=\{switchHref\(l\)\}/);
  // Both the desktop and the mobile switcher are gated.
  const gated = source.match(/hrefLang=\{localizedTargets\.includes\(l\)/g) ?? [];
  assert.equal(gated.length, 2, "expected desktop and mobile switcher to be gated");
});
