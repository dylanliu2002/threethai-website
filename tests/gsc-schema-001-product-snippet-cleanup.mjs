import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * GSC-SCHEMA-001 — invalid Google Product Snippet markup.
 *
 * Search Console reported "Either \"offers\", \"review\", or \"aggregateRating\"
 * should be specified" for /products/water-soluble-pva-yarn and
 * /products/pva-staple-fiber. Three Thai sells by inquiry and publishes no
 * price, stock state, review or rating, so the fix removes the unsupported
 * `Product` node instead of manufacturing the fields Google asks for.
 *
 * The tests therefore pin two things at once:
 *   1. the factual premise — there is genuinely nothing truthful to put in
 *      `offers`/`review`/`aggregateRating`, in the content model or on the page;
 *   2. the shipped consequence — no product URL emits Product markup or any
 *      commercial property, while BreadcrumbList, FAQPage and the
 *      canonical-aware WebPage node survive.
 *
 * Requirement 2 is checked against the real production build output when it is
 * present. `npm run build && npm run test:seo` is the documented gate; set
 * REQUIRE_BUILD_OUTPUT=1 to turn a missing build into a failure instead of a
 * skip (the validation run does exactly that).
 *
 * Runtime note: the policy and content modules are TypeScript imported
 * directly, which needs Node's built-in type stripping (see
 * tests/support/ts-extension-hooks.mjs). `src/lib/seo.tsx` renders JSX and so
 * cannot be imported here; it is asserted as source and through build output.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const { canonicalUrlFor, contentHtmlLangOf, isEnglishFallbackCopy, TRANSLATED_CONTENT_LOCALES } =
  await importSource("src/content/availability.ts");
const { siteUrl, locales } = await importSource("src/content/company.ts");
const { products } = await importSource("src/content/products.ts");

/**
 * Derived from the locale model rather than listed. GSC-SCHEMA-001 checked all
 * ten languages that existed when it shipped; LOCALE-RETIRE-001 retired six of
 * them, and a literal here would look for prerendered `/pt/products/…` pages
 * that the four-language site no longer builds. What this suite pins is that no
 * locale — present or future — emits an unsupported commercial node.
 */
const FALLBACK_LOCALES = locales.filter((l) => !TRANSLATED_CONTENT_LOCALES.includes(l));
const ALL_LOCALES = [...locales];

/** The two URLs Search Console reported, plus the rest of the same template. */
const REPORTED_SLUGS = ["water-soluble-pva-yarn", "pva-staple-fiber"];
const ALL_SLUGS = products.map((p) => p.slug);
assert.ok(
  REPORTED_SLUGS.every((slug) => ALL_SLUGS.includes(slug)),
  "the reported slugs must still exist in the product catalogue",
);

/**
 * Property names that would make a page claim a commercial offer, a customer
 * review or an aggregate score. Presence of any of them with no real data
 * behind it is the defect; inventing values for them is forbidden.
 */
const COMMERCIAL_KEYS = [
  "offers",
  "price",
  "priceCurrency",
  "priceValidUntil",
  "aggregateOffer",
  "availability",
  "itemCondition",
  "seller",
  "businessFunction",
  "review",
  "reviews",
  "aggregateRating",
  "ratingValue",
  "reviewCount",
  "bestRating",
  "worstRating",
];

/** Google's Product rich result is keyed off these type names. */
const PRODUCT_RICH_RESULT_TYPES = ["Product", "Offer", "AggregateOffer", "AggregateRating", "Review"];

/** Strip comments so prose about a field is never mistaken for emitting it. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const collectTypes = (node, found = []) => {
  if (node == null || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    for (const entry of node) collectTypes(entry, found);
    return found;
  }
  if (node["@type"] != null) {
    for (const t of Array.isArray(node["@type"]) ? node["@type"] : String(node["@type"]).split(/\s+/)) {
      found.push(t);
    }
  }
  for (const value of Object.values(node)) collectTypes(value, found);
  return found;
};

const collectKeys = (node, found = []) => {
  if (node == null || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    for (const entry of node) collectKeys(entry, found);
    return found;
  }
  for (const [key, value] of Object.entries(node)) {
    found.push(key);
    collectKeys(value, found);
  }
  return found;
};

const jsonLdBlocks = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    const parsed = JSON.parse(m[1]);
    return Array.isArray(parsed) ? parsed : [parsed];
  }).flat();

const linkTag = (html, rel) => {
  const match = html.match(new RegExp(`<link rel="${rel}" href="([^"]+)"`));
  return match ? match[1] : null;
};

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");

/** `/es/products/foo` style route for a locale, English being the bare path. */
const localeHref = (locale, sitePath) => (locale === "en" ? sitePath : `/${locale}${sitePath}`);

// ---------------------------------------------------------------------------
// A · The factual premise: the site has no truthful commercial data to publish.
// ---------------------------------------------------------------------------

test("product content model carries no price, offer, review, rating or stock field", () => {
  assert.ok(products.length >= 4, `expected at least 4 products, got ${products.length}`);
  for (const product of products) {
    const keys = collectKeys(product);
    for (const forbidden of COMMERCIAL_KEYS) {
      assert.ok(
        !keys.includes(forbidden),
        `${product.slug} exposes a "${forbidden}" field; GSC-SCHEMA-001 forbids inventing one`,
      );
    }
  }
});

test("the quote-only conversion path is the real business model, in copy and in routes", () => {
  for (const product of products) {
    // The page body itself invites an inquiry rather than a purchase.
    assert.ok(
      product.faqs.en.length > 0 && product.processGuide.en.length > 0,
      `${product.slug} must keep its visible FAQ and process copy`,
    );
    for (const dir of ["src/app/(site)/request-quote", "src/app/(site)/request-sample"]) {
      assert.ok(existsSync(path.join(repoRoot, dir)), `${dir} is the site's conversion route`);
    }
  }
  // And the site says so out loud: there is no durable public price list.
  const answers = read("src/content/legacy-source.ts");
  assert.match(answers, /There is no durable public price/);
});

// ---------------------------------------------------------------------------
// B · The source no longer asks Google to treat a product page as a Product.
// ---------------------------------------------------------------------------

test("SEO source emits no Product rich-result node or commercial property", () => {
  const code = stripComments(read("src/lib/seo.tsx"));

  assert.doesNotMatch(code, /["']@type["']\s*:\s*["']Product["']/, "Product JSON-LD is back");
  assert.doesNotMatch(code, /["']@type["']\s*:\s*["'](?:Offer|AggregateOffer|AggregateRating|Review)["']/);
  for (const forbidden of COMMERCIAL_KEYS) {
    assert.doesNotMatch(
      code,
      // Word boundaries on both sides: `preview":` must not read as `review:`.
      new RegExp(`\\b${forbidden}\\b["']?\\s*:`),
      `seo.tsx emits "${forbidden}:" — unsupported by any real data`,
    );
  }
  // The helper that used to build the Product node must not survive under a
  // name that still promises one.
  assert.doesNotMatch(code, /\bproductSchema\b/);
});

test("product routes describe themselves with the shared canonical-aware WebPage node", () => {
  const code = stripComments(read("src/lib/seo.tsx"));
  assert.ok(code.includes("export const productPageSchema"), "productPageSchema is missing");
  const helper = code.slice(code.indexOf("export const productPageSchema"));
  assert.match(helper, /webPageSchema\(\{/, "the product helper must delegate to the shared WebPage node");
  assert.match(helper, /path: `\/products\/\$\{product\.slug\}`/);
  assert.match(helper, /locale: product\.locale \?\? "en"/);

  // Exactly one WebPage builder, so a product page cannot grow a second one.
  assert.equal(code.match(/"@type":\s*"WebPage"/g)?.length ?? 0, 1);
});

test("no product template imports or emits Product structured data", () => {
  const templates = [
    "src/app/(site)/products/[slug]/page.tsx",
    "src/app/zh/products/[slug]/page.tsx",
    "src/app/[lang]/products/[slug]/page.tsx",
  ];
  for (const file of templates) {
    const source = read(file);
    assert.doesNotMatch(source, /\bproductSchema\b/, `${file} emits Product markup again`);
    assert.match(source, /\bproductPageSchema\(\{/, `${file} lost its WebPage node`);
    // Preserved, still-valid structured data on the same route.
    assert.match(source, /\bfaqSchema\(/, `${file} lost FAQPage markup`);
    assert.match(source, /\bbreadcrumbSchema\(\[/, `${file} lost BreadcrumbList markup`);
  }
  // Locale still drives the structured-data URL for every rendered copy.
  assert.match(read("src/app/[lang]/products/[slug]/page.tsx"), /slug: product\.slug, locale \}/);
  assert.match(read("src/app/zh/products/[slug]/page.tsx"), /slug: product\.slug, locale: "zh" \}/);
});

test("product detail pages are the only Product-schema consumers removed", () => {
  // Nothing elsewhere in src/ may reintroduce a Product node.
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory)) {
      if (entry === "node_modules") continue;
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) visit(absolute);
      else if (/\.tsx?$/.test(entry)) files.push(absolute);
    }
  };
  visit(path.join(repoRoot, "src"));
  for (const absolute of files) {
    const code = stripComments(readFileSync(absolute, "utf8"));
    assert.doesNotMatch(
      code,
      /["']@type["']\s*:\s*["']Product["']/,
      `${path.relative(repoRoot, absolute)} declares Product structured data`,
    );
  }
});

// ---------------------------------------------------------------------------
// C · Canonical-awareness inherited from GSC-INDEX-002 stays intact.
// ---------------------------------------------------------------------------

test("product structured data follows the English canonical for fallback copies", () => {
  for (const slug of ALL_SLUGS) {
    const sitePath = `/products/${slug}`;
    assert.equal(canonicalUrlFor(sitePath, "en"), `${siteUrl}${sitePath}`);
    assert.equal(canonicalUrlFor(sitePath, "zh"), `${siteUrl}/zh${sitePath}`);
    for (const locale of FALLBACK_LOCALES) {
      assert.equal(isEnglishFallbackCopy(sitePath, locale), true, `${locale} ${sitePath}`);
      assert.equal(canonicalUrlFor(sitePath, locale), `${siteUrl}${sitePath}`, `${locale} ${sitePath}`);
      assert.ok(!canonicalUrlFor(sitePath, locale).includes(`/${locale}/`), `${locale} ${sitePath}`);
      // Body copy is English, so the node must not claim another language.
      assert.equal(contentHtmlLangOf(sitePath, locale), "en", `${locale} ${sitePath}`);
    }
  }
});

// ---------------------------------------------------------------------------
// D · Ground truth from the real production build.
// ---------------------------------------------------------------------------

const prerenderRoot = path.join(repoRoot, ".next", "server", "app");
const buildPresent = existsSync(prerenderRoot);
const requireBuild = process.env.REQUIRE_BUILD_OUTPUT === "1";

if (!buildPresent && requireBuild) {
  test("REQUIRE_BUILD_OUTPUT is set but no production build exists", () => {
    assert.fail(`run \`npm run build\` first — ${prerenderRoot} is missing`);
  });
}

const buildOptions = { skip: buildPresent ? false : "no .next production build to inspect" };

test("every rendered product page drops the invalid Product node", buildOptions, () => {
  let inspected = 0;
  for (const slug of ALL_SLUGS) {
    for (const locale of ALL_LOCALES) {
      const sitePath = `/products/${slug}`;
      const htmlPath = path.join(prerenderRoot, `${localeHref(locale, sitePath)}.html`);
      assert.ok(existsSync(htmlPath), `prerendered page missing: ${path.relative(repoRoot, htmlPath)}`);
      const html = readFileSync(htmlPath, "utf8");
      const nodes = jsonLdBlocks(html);
      assert.ok(nodes.length > 0, `${locale} ${sitePath} emitted no JSON-LD`);

      const types = collectTypes(nodes);
      for (const forbidden of PRODUCT_RICH_RESULT_TYPES) {
        assert.ok(!types.includes(forbidden), `${locale} ${sitePath} still declares @type ${forbidden}`);
      }
      for (const forbidden of COMMERCIAL_KEYS) {
        assert.ok(
          !collectKeys(nodes).includes(forbidden),
          `${locale} ${sitePath} emits "${forbidden}" with no real data behind it`,
        );
      }
      inspected += 1;
    }
  }
  assert.equal(inspected, ALL_SLUGS.length * ALL_LOCALES.length);
});

test("rendered product pages keep valid schema and match their canonical", buildOptions, () => {
  for (const slug of REPORTED_SLUGS) {
    for (const locale of ["en", "zh", "es"]) {
      const sitePath = `/products/${slug}`;
      const href = localeHref(locale, sitePath);
      const html = readFileSync(path.join(prerenderRoot, `${href}.html`), "utf8");
      const nodes = jsonLdBlocks(html);
      const expected = canonicalUrlFor(sitePath, locale);

      // One WebPage node, no duplicate or conflicting page entity.
      const pages = nodes.filter((n) => n["@type"] === "WebPage");
      assert.equal(pages.length, 1, `${href} emitted ${pages.length} WebPage nodes`);
      assert.equal(pages[0].url, expected, `${href} structured data disagrees with the policy`);
      assert.equal(pages[0].inLanguage, contentHtmlLangOf(sitePath, locale), href);
      assert.equal(linkTag(html, "canonical"), expected, `${href} metadata/schema canonical mismatch`);
      assert.ok(pages[0].name && pages[0].description, `${href} WebPage lost its name/description`);

      // BreadcrumbList and FAQPage survive, and the FAQ is really on the page.
      const crumbs = nodes.filter((n) => n["@type"] === "BreadcrumbList");
      assert.equal(crumbs.length, 1, href);
      assert.equal(crumbs[0].itemListElement.length, 3, `${href} breadcrumb trail changed length`);

      const faqs = nodes.filter((n) => n["@type"] === "FAQPage");
      assert.equal(faqs.length, 1, href);
      assert.ok(faqs[0].mainEntity.length > 0, `${href} FAQPage is empty`);
      const visible = visibleText(html);
      for (const question of faqs[0].mainEntity) {
        assert.ok(visible.includes(question.name), `${href} FAQ markup is not visible copy: ${question.name}`);
      }

      // Organization identity and the product's own facts remain on the page.
      assert.ok(collectTypes(nodes).includes("Organization"), `${href} lost Organization markup`);
      assert.ok(collectTypes(nodes).includes("WebSite"), `${href} lost WebSite markup`);
      const product = products.find((p) => p.slug === slug);
      const contentLocale = locale === "zh" ? "zh" : "en";
      assert.ok(visible.includes(product.name[contentLocale]), `${href} lost the product name`);
      // The schema describes the copy that is actually on the page.
      assert.equal(pages[0].description, product.metaDescription[contentLocale], `${href} schema drifts from content`);
      // Inquiry routes remain the conversion path.
      assert.ok(html.includes("/request-quote"), `${href} lost the quote CTA`);
      assert.ok(html.includes("/request-sample"), `${href} lost the sample CTA`);
    }
  }
});

test("rendered schema stays parseable JSON across the site", buildOptions, () => {
  let files = 0;
  let blocks = 0;
  const visit = (directory) => {
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) {
        visit(absolute);
        continue;
      }
      if (!entry.endsWith(".html")) continue;
      files += 1;
      for (const match of readFileSync(absolute, "utf8").matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        blocks += 1;
        assert.doesNotMatch(match[1], /undefinedNaN/, `${path.relative(prerenderRoot, absolute)} has broken JSON-LD`);
        JSON.parse(match[1]); // throws -> test fails, which is the point
      }
    }
  };
  visit(prerenderRoot);
  // Scale guard, not an inventory pin. The literal `> 400` was the ten-locale
  // prerender count; LOCALE-RETIRE-001 retired six of those languages and the
  // same site now builds ~222 documents. Deriving the floor from the locale set
  // keeps its real purpose — catching a sweep that quietly covered almost
  // nothing — without re-asserting an architecture this task changed on purpose.
  // The behaviour that matters is above: every JSON-LD block on every page is
  // parsed, and a throw fails the test.
  assert.ok(files > 40 * locales.length, `expected the full prerendered site, found ${files} pages`);
  assert.ok(blocks > 40 * locales.length, `expected JSON-LD on every page, found ${blocks} blocks`);
});

test("only product detail routes changed their entity node type", buildOptions, async () => {
  // Answers and knowledge keep their Article nodes: this task must not sweep
  // valid structured data off unrelated routes.
  const { articles } = await importSource("src/content/articles.ts");
  const { buyerAnswers } = await importSource("src/content/answers.ts");
  for (const article of articles.slice(0, 2)) {
    const html = readFileSync(path.join(prerenderRoot, `knowledge/${article.slug}.html`), "utf8");
    assert.ok(collectTypes(jsonLdBlocks(html)).includes("Article"), `/${article.slug} lost Article markup`);
  }
  for (const answer of buyerAnswers.slice(0, 2)) {
    const html = readFileSync(path.join(prerenderRoot, `answers/${answer.slug}.html`), "utf8");
    const types = collectTypes(jsonLdBlocks(html));
    assert.ok(types.includes("Article"), `/answers/${answer.slug} lost Article markup`);
    assert.ok(types.includes("FAQPage"), `/answers/${answer.slug} lost FAQPage markup`);
  }
});
