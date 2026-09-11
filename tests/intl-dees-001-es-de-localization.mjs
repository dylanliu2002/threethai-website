/**
 * INTL-DEES-001 · Spanish and German content implementation
 *
 * What this suite owns is the promise the task made and the gates it had to pass
 * through, not the wording of the translations:
 *
 *   1. The ES/DE chrome is complete — every dictionary leaf a Spanish or German
 *      page can draw is in that language, with an explicit allowlist for the four
 *      leaves that are correctly identical (a brand inside a template, a year, and
 *      the German word "optional").
 *   2. Nothing is hardcoded past the content model — no `locale === "zh" ? … : …`
 *      literal survives in `src`, and no `[lang]` route writes its own `<title>`.
 *   3. The localized copy cannot fall behind the content model — every field the
 *      renderer can widen has ES and DE text, in the shape the renderer reads.
 *   4. Written is not approved — every shipped record is a draft, the gate refuses
 *      each one for exactly the two review-shaped reasons, and no ES or DE page
 *      owns a URL, a canonical, an hreflang entry, a sitemap slot or a content
 *      language because of it.
 *   5. Approval is the only remaining step — signing the same records flips
 *      precisely those nine pages and nothing else, and the text that reaches the
 *      renderer is the text the record carries.
 *   6. A card is not the page it links to — listing and home cards show Spanish and
 *      German today, because that text is the listing page's own prose, while the
 *      page behind each card still resolves its body through the promotion seam and
 *      is still refused. If the second half of that ever stops being true, the card
 *      pass has become an unapproved promotion.
 *
 * Run with the rest: `REQUIRE_BUILD_OUTPUT=1 npm run test:seo`.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const { getDictionary } = await importSource("src/content/i18n/index.ts");
const { en } = await importSource("src/content/i18n/en.ts");
const { products } = await importSource("src/content/products.ts");
const { applications } = await importSource("src/content/applications.ts");
const { productCopy, applicationCopy } = await importSource("src/content/translation-copy.ts");
const { articles } = await importSource("src/content/articles.ts");
const { productCard, applicationCard, articleCard } = await importSource("src/content/card-copy.ts");
const { pageCopyFor, TRANSLATED_PAGES, resolvedContentLocaleOf } = await importSource(
  "src/content/translation-availability.ts",
);
const evidence = await importSource("src/content/translation-evidence.ts");
const { createAvailabilityPolicy } = await importSource("src/content/availability.ts");
const { htmlLang, locales } = await importSource("src/content/company.ts");

const { TRANSLATION_EVIDENCE, approvedEvidence, draftEvidence, rejectedEvidence, approvedPromotions,
  evidenceDecisionFor } = evidence;
const { pageMeta, clientLabels, serverLabels } = await importSource("src/content/site-copy.ts");

/**
 * A line that decides *displayed prose* by comparing the locale to "zh". The
 * content-language rule in `company.ts`, the answer-pack lookup in
 * `answer-expanded.ts` and the prefix juggling in `home-applications.tsx` choose
 * a locale code or an empty string instead, and are out of scope — which is what
 * the four-character floor on both branches expresses. Double-quoted only, and
 * deliberately: an earlier version of this predicate used `\p{L}` without a `u`
 * flag, matched a literal "p", and reported a clean tree while a real bilingual
 * literal sat in `product-view.tsx`.
 */
const BILINGUAL_PROSE = /locale === "zh"\s*\?\s*"[^"]{4,}"\s*:\s*"[^"]{4,}"/;
const choosesBilingualProse = (line) => BILINGUAL_PROSE.test(line);

/** A content field is `Record<ContentLocale, …>`: exactly `{ en, zh }`. */
const widenableFields = (entity) =>
  Object.entries(entity)
    .filter(([, value]) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
      const keys = Object.keys(value);
      return keys.length === 2 && "en" in value && "zh" in value;
    })
    .map(([field]) => field);

const LOCALIZED_PAGES = [
  ...products.map((p) => ({ path: `/products/${p.slug}`, entity: p, store: productCopy })),
  ...applications.map((a) => ({ path: `/applications/${a.slug}`, entity: a, store: applicationCopy })),
];

/* ------------------------------------------------------------------ 1 */
test("REQ 3 · the Spanish and German dictionaries cover every English leaf", () => {
  const leaves = (value, prefix = "", out = new Map()) => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => leaves(entry, `${prefix}[${index}]`, out));
    } else if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) leaves(entry, prefix ? `${prefix}.${key}` : key, out);
    } else if (typeof value === "string") {
      out.set(prefix, value);
    }
    return out;
  };
  const english = leaves(en);
  assert.ok(english.size > 250, `the English dictionary shrank to ${english.size} leaves`);

  // Identical on purpose: a brand inside a title template, the site name itself,
  // a year, and the German spelling of "optional", which is the same word.
  const IDENTITY_BY_DESIGN = {
    es: ["meta.titleTemplate", "meta.siteName", "about.timeline[0].year"],
    de: ["meta.titleTemplate", "meta.siteName", "about.timeline[0].year", "form.optional"],
  };

  for (const locale of ["es", "de"]) {
    const dict = getDictionary(locale);
    const here = leaves(dict);
    assert.equal(here.size, english.size, `${locale} dictionary is missing keys the English one has`);
    const stillEnglish = [...english]
      .filter(([key, text]) => here.get(key) === text)
      .map(([key]) => key)
      .filter((key) => !IDENTITY_BY_DESIGN[locale].includes(key));
    assert.deepEqual(stillEnglish, [], `${locale} still renders these leaves in English: ${stillEnglish.join(", ")}`);
    for (const key of IDENTITY_BY_DESIGN[locale]) {
      assert.equal(here.get(key), english.get(key), `${locale} ${key} must stay the brand/number/word it is`);
    }
  }
});

/* ------------------------------------------------------------------ 2 */
test("REQ 3 · no page string is decided inside a component any more", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (/\.tsx?$/.test(entry.name)) offenders.push(abs);
    }
  };
  walk(path.join(repoRoot, "src"));
  const bilingual = [];
  for (const abs of offenders) {
    const rel = path.relative(repoRoot, abs).split(path.sep).join("/");
    const text = readFileSync(abs, "utf8");
    text.split(/\r?\n/).forEach((line, index) => {
      if (choosesBilingualProse(line)) {
        bilingual.push(`${rel}:${index + 1}: ${line.trim().slice(0, 80)}`);
      }
    });
  }
  assert.deepEqual(bilingual, [], `hardcoded bilingual copy remains:\n${bilingual.join("\n")}`);

  // An empty result from a scan is worth only what the scan is proved to see. One
  // line it must catch, one it must leave alone: without these two controls a
  // blind detector is indistinguishable from a clean tree, which is exactly the
  // state this predicate was in before it stopped pretending to read Unicode.
  assert.equal(
    choosesBilingualProse('alt={locale === "zh" ? "清梳联生产现场" : "Blowing-carding line at the base"}'),
    true,
    "the detector missed a bilingual literal it exists to find",
  );
  assert.equal(
    choosesBilingualProse('return locale === "zh" ? "zh" : "en";'),
    false,
    "the detector treated a content-language rule as page copy",
  );
});

test("REQ 3 · every /[lang] route takes its metadata from the content model", () => {
  const routeFiles = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name === "page.tsx") routeFiles.push(abs);
    }
  };
  walk(path.join(repoRoot, "src", "app", "[lang]"));
  assert.ok(routeFiles.length >= 14, `only ${routeFiles.length} [lang] routes found`);
  const hardcoded = [];
  for (const abs of routeFiles) {
    const rel = path.relative(repoRoot, abs).split(path.sep).join("/");
    const body = readFileSync(abs, "utf8");
    const metadata = /generateMetadata[\s\S]*?\n\}/.exec(body)?.[0] ?? "";
    if (!metadata) continue;
    // A title assembled from content is allowed — an entity name plus the page's
    // own suffix is how these routes advertise a product page. What is not allowed
    // is a literal that no locale can override.
    const literals = [...metadata.matchAll(/(?:title|description):\s*(`[^`]*`|"[^"]*"|'[^']*')/g)]
      .map((match) => match[1])
      .filter((value) => !value.includes("${"));
    if (literals.length) hardcoded.push(`${rel}: ${literals.join(" | ").slice(0, 90)}`);
  }
  assert.deepEqual(hardcoded, [], `these routes still write their own metadata literals: ${hardcoded.join(", ")}`);
});

test("REQ 3 · client-rendered copy is the only localized text in Dictionary", () => {
  // `Dictionary` is a prop of three `"use client"` components and is serialized
  // into every prerendered document. Page metadata and server-only labels live in
  // `site-copy.ts` so they cost once instead of 222 times.
  const dictionarySource = read("src/content/i18n/en.ts");
  assert.doesNotMatch(dictionarySource, /^\s*pageMeta: \{/m, "page metadata must not ride in the client dictionary");
  assert.doesNotMatch(dictionarySource, /^\s*header: \{/m, "the header tagline must not ride in the client dictionary");
  const labels = [...dictionarySource.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1]);
  assert.ok(!labels.includes("labels"), "only the client form labels may stay, under their own group");
  assert.equal(Object.keys(clientLabels).length, 4, "client labels must exist for all four languages");
  assert.equal(Object.keys(pageMeta).length, 4, "pageMeta must exist for all four languages");
  assert.ok(Object.keys(serverLabels).length === 4);
});

/* ------------------------------------------------------------------ 3 */
test("REQ 2 · the copy store covers the entity's whole renderable surface", () => {
  for (const { path: pagePath, entity, store } of LOCALIZED_PAGES) {
    const slug = entity.slug;
    const fields = widenableFields(entity);
    assert.ok(fields.length >= 8, `${pagePath} exposes only ${fields.length} body fields — did the model change?`);
    const stored = store[slug];
    assert.ok(stored, `${pagePath} has no entry in the copy store`);
    for (const field of fields) {
      for (const locale of ["es", "de"]) {
        const value = stored[field]?.[locale];
        assert.notEqual(value, undefined, `${pagePath}.${field} has no ${locale} text`);
        const english = JSON.stringify(entity[field].en);
        assert.notEqual(JSON.stringify(value), english, `${pagePath}.${field}.${locale} is the English pasted back`);
        // The localized value must fit the shape the renderer already reads.
        assert.equal(
          JSON.stringify(structuredKeys(value)),
          JSON.stringify(structuredKeys(entity[field].en)),
          `${pagePath}.${field}.${locale} does not mirror the field's own shape`,
        );
      }
    }
    const extra = Object.keys(stored).filter((field) => !fields.includes(field));
    assert.deepEqual(extra, [], `${pagePath}: the store carries fields no renderer widens: ${extra.join(", ")}`);
  }
});

function structuredKeys(value) {
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return value.map(structuredKeys);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, structuredKeys(v)]));
}

test("REQ 2 · translated copy keeps every number the English source states", () => {
  const numbers = (text) => (text.match(/\d+(?:[.,]\d+)*/g) ?? []).sort().join("|");
  const walk = (value, sink) => {
    if (typeof value === "string") sink.push(value);
    else if (Array.isArray(value)) value.forEach((entry) => walk(entry, sink));
    else if (value && typeof value === "object") Object.values(value).forEach((entry) => walk(entry, sink));
    return sink;
  };
  for (const { path: pagePath, entity, store } of LOCALIZED_PAGES) {
    for (const field of widenableFields(entity)) {
      const english = walk(entity[field].en, []);
      for (const locale of ["es", "de"]) {
        const translated = walk(store[entity.slug][field][locale], []);
        assert.equal(translated.length, english.length, `${pagePath}.${field}.${locale} changed its length`);
        translated.forEach((text, index) => {
          // Thousands separators legitimately differ (30,000 → 30.000), so compare
          // the digits themselves rather than the rendered grouping.
          const digits = (s) => (s.match(/\d+/g) ?? []).join(",");
          assert.equal(digits(text), digits(english[index]),
            `${pagePath}.${field}.${locale}[${index}] changed a figure:\n  en:  ${english[index]}\n  out: ${text}`);
        });
      }
    }
  }
});

/* ------------------------------------------------------------------ 4 */
test("REQ 5 · everything shipped is a draft, and a draft grants nothing", () => {
  assert.equal(TRANSLATION_EVIDENCE.length, LOCALIZED_PAGES.length * 2,
    "one record per localized page and language");
  assert.equal(TRANSLATION_EVIDENCE.every((record) => record.status === "draft"), true,
    "INTL-DEES-001 may not approve its own translation");
  assert.deepEqual([...approvedEvidence()], [], "no record may be approved without a reviewer");
  assert.equal(draftEvidence().length, TRANSLATION_EVIDENCE.length);
  assert.deepEqual([...TRANSLATED_PAGES], [], "the promotion set stays empty while nothing is approved");

  for (const { evidence: record, reasons } of rejectedEvidence()) {
    assert.deepEqual([...reasons].sort(), ["provenance-missing:reviewedOn", "status-not-approved:draft"],
      `${record.locale} ${record.path} is refused for more than being unreviewed: ${reasons.join(", ")}`);
  }
});

test("REQ 5 · an unapproved record moves none of the four SEO surfaces", () => {
  const policy = createAvailabilityPolicy();
  for (const { path: pagePath } of LOCALIZED_PAGES) {
    for (const locale of ["es", "de"]) {
      assert.equal(resolvedContentLocaleOf(pagePath, locale), "en", `${locale} ${pagePath} resolved to itself`);
      assert.equal(policy.canonicalLocaleFor(pagePath, locale), "en", `${locale} ${pagePath} owns its URL`);
      assert.equal(policy.isSitemapEligible(pagePath, locale), false, `${locale} ${pagePath} is in the sitemap`);
      assert.equal(policy.hreflangForRoute(pagePath, locale), undefined, `${locale} ${pagePath} declares a graph`);
      assert.equal(policy.contentHtmlLangOf(pagePath, locale), htmlLang.en, `${locale} ${pagePath} claims a language`);
      const unpromoted = pageCopyFor(pagePath, locale, entityFor(pagePath));
      assert.equal(unpromoted.contentLocale, "en", `${locale} ${pagePath} rendered its own copy`);
      assert.equal(unpromoted.entity, entityFor(pagePath), `${locale} ${pagePath} got a copied entity`);
    }
  }
});

const entityFor = (pagePath) =>
  LOCALIZED_PAGES.find((page) => page.path === pagePath)?.entity;

/* ------------------------------------------------------------------ 5 */
test("REQ 6 · the owner's sign-off is the only thing that promotes these pages", () => {
  const signed = TRANSLATION_EVIDENCE.map((record) => ({
    ...record,
    status: "approved",
    provenance: { ...record.provenance, reviewedBy: "dylanliu2002", reviewedOn: "2026-09-09" },
  }));
  assert.equal(approvedEvidence(signed).length, signed.length,
    "a signed-off INTL-DEES-001 record must qualify with no other change");
  for (const record of approvedEvidence(signed)) {
    assert.deepEqual([...evidenceDecisionFor(record, signed).reasons], [], `${record.locale} ${record.path}`);
  }

  const promoted = approvedPromotions(signed);
  const policy = createAvailabilityPolicy(promoted);
  const owners = new Set(LOCALIZED_PAGES.map((page) => page.path));
  for (const pagePath of owners) {
    for (const locale of ["es", "de"]) {
      assert.equal(policy.canonicalLocaleFor(pagePath, locale), locale, `${locale} ${pagePath} did not gain its owner`);
      assert.equal(policy.isSitemapEligible(pagePath, locale), true, `${locale} ${pagePath} stayed out of the sitemap`);
      assert.equal(
        Object.keys(policy.hreflangForRoute(pagePath, locale)).sort().join(","),
        ["de", "en", "es", "x-default", "zh-CN"].sort().join(","),
        `${pagePath} hreflang universe after promotion`,
      );
      assert.equal(policy.contentHtmlLangOf(pagePath, locale), htmlLang[locale], `${locale} ${pagePath} language`);
    }
  }
  // English and Chinese answers are unchanged by a flip: they were owners already.
  for (const pagePath of owners) {
    assert.deepEqual([...policy.localizedLocalesFor(pagePath)].sort(), [...locales].sort());
    for (const locale of ["en", "zh"]) {
      assert.equal(policy.canonicalLocaleFor(pagePath, locale), locale);
    }
  }
});

test("REQ 6 · a promoted page renders the reviewed text, field by field", () => {
  const signed = TRANSLATION_EVIDENCE.map((record) => ({
    ...record,
    status: "approved",
    provenance: { ...record.provenance, reviewedBy: "dylanliu2002", reviewedOn: "2026-09-09" },
  }));
  const promoted = approvedPromotions(signed);
  for (const { path: pagePath, entity, store } of LOCALIZED_PAGES) {
    for (const locale of ["es", "de"]) {
      const { entity: rendered, contentLocale } = pageCopyFor(pagePath, locale, entity, promoted);
      assert.equal(contentLocale, locale, `${locale} ${pagePath} did not resolve`);
      for (const field of widenableFields(entity)) {
        assert.deepEqual(rendered[field][locale], store[entity.slug][field][locale],
          `${pagePath}.${field}.${locale} is not the text the record carries`);
        // The model's own languages stay intact beside it.
        assert.deepEqual(rendered[field].en, entity[field].en, `${pagePath}.${field}.en changed`);
        assert.deepEqual(rendered[field].zh, entity[field].zh, `${pagePath}.${field}.zh changed`);
      }
    }
  }
});

test("REQ 6 · a half-translated page cannot be approved at all", () => {
  // The net that makes "evidence matches output" mechanical: drop one field from a
  // record and the gate refuses it, instead of promoting a page with English left
  // in it. Mutating the registry is enough — no source edit is needed to check it.
  const target = TRANSLATION_EVIDENCE.find((record) => record.path === "/products/water-soluble-pva-yarn"
    && record.locale === "es");
  assert.ok(target, "the fixture target disappeared");
  const dropped = {
    ...target,
    status: "approved",
    requiredFields: target.requiredFields.filter((field) => field !== "faqs"),
    source: Object.fromEntries(Object.entries(target.source).filter(([field]) => field !== "faqs")),
    content: Object.fromEntries(Object.entries(target.content).filter(([field]) => field !== "faqs")),
    provenance: { ...target.provenance, reviewedBy: "dylanliu2002", reviewedOn: "2026-09-09" },
  };
  const registry = [...TRANSLATION_EVIDENCE.filter((r) => r !== target), dropped];
  const decision = evidenceDecisionFor(dropped, registry);
  assert.equal(decision.qualified, true, "the record itself is well-formed; the miss is caught at render");
  const promoted = approvedPromotions(registry);
  assert.throws(
    () => pageCopyFor("/products/water-soluble-pva-yarn", "es", entityFor("/products/water-soluble-pva-yarn"), promoted),
    /no translated "faqs"/,
    "a promotion that misses a rendered field must fail the build, not ship English under a localized canonical",
  );
});

test("REQ 6 · self-approval stays refused after the flip", () => {
  const selfApproved = TRANSLATION_EVIDENCE.map((record) => ({
    ...record,
    status: "approved",
    provenance: { ...record.provenance, reviewedBy: record.provenance.translatedBy, reviewedOn: "2026-09-09" },
  }));
  assert.deepEqual([...approvedEvidence(selfApproved)], [], "an author may not sign their own translation");
  for (const { reasons } of rejectedEvidence(selfApproved)) {
    assert.ok(reasons.includes("self-approved"), reasons.join(", "));
  }
});

/* ------------------------------------------------------------------ 6 */
/**
 * A card quotes another page's headline text, but the card belongs to the page it
 * sits on, so it is allowed to be Spanish before the page behind it is promoted.
 * Both halves of that sentence have to stay true at once: the card localizes, and
 * the promoted seam is untouched. Only the second half makes this a content pass
 * rather than a promotion nobody signed off.
 */
const CARD_RENDERERS = [
  "src/components/product/product-card.tsx",
  "src/components/sections/home-applications.tsx",
  "src/components/sections/home-knowledge.tsx",
  "src/components/product/product-view.tsx",
  "src/components/application/application-view.tsx",
  "src/app/[lang]/applications/page.tsx",
  "src/app/[lang]/knowledge/page.tsx",
  "src/app/[lang]/knowledge/[slug]/page.tsx",
  "src/app/[lang]/answers/page.tsx",
];

test("REQ 2 · every card surface reads its copy from the card module", () => {
  for (const rel of CARD_RENDERERS) {
    assert.match(read(rel), /from ["']@\/content\/card-copy["']/, `${rel} no longer imports the card module`);
  }
  // The remaining product cards go through the shared component rather than
  // repeating the lookup.
  assert.match(read("src/components/sections/home-products.tsx"), /<ProductCard/);
  assert.match(read("src/app/[lang]/products/page.tsx"), /<ProductCard/);
  assert.equal(
    /[A-Za-z]+\.name\[cl\]|\.title\[cl\]|\.intro\[cl\]|slug\.replaceAll/.test(
      [
        "src/components/sections/home-applications.tsx",
        "src/components/sections/home-knowledge.tsx",
        "src/app/[lang]/applications/page.tsx",
        "src/app/[lang]/knowledge/page.tsx",
      ].map(read).join("\n"),
    ),
    false,
    "a card went back to reading the entity in its content language (or printing a slug)",
  );
});

test("REQ 2 · a card shows the store's text, so approving a page cannot contradict it", () => {
  for (const product of products) {
    const stored = productCopy[product.slug];
    assert.deepEqual(productCard(product.slug, "en"), {
      name: product.name.en, tagline: product.tagline.en, imageAlt: product.imageAlt.en,
    }, `${product.slug}: the English card drifted from the entity it points at`);
    assert.deepEqual(productCard(product.slug, "zh"), {
      name: product.name.zh, tagline: product.tagline.zh, imageAlt: product.imageAlt.zh,
    }, `${product.slug}: the Chinese card drifted from the entity it points at`);
    for (const locale of ["es", "de"]) {
      assert.deepEqual(productCard(product.slug, locale), {
        name: stored.name[locale], tagline: stored.tagline[locale], imageAlt: stored.imageAlt[locale],
      }, `${product.slug}: the ${locale} card is not the text a record would carry`);
    }
  }

  for (const application of applications) {
    const stored = applicationCopy[application.slug];
    assert.deepEqual(applicationCard(application.slug, "en"), {
      name: application.name.en, summary: application.summary.en, imageAlt: application.imageAlt.en,
    }, `${application.slug}: the English card drifted from the entity it points at`);
    assert.deepEqual(applicationCard(application.slug, "zh"), {
      name: application.name.zh, summary: application.summary.zh, imageAlt: application.imageAlt.zh,
    }, `${application.slug}: the Chinese card drifted from the entity it points at`);
    for (const locale of ["es", "de"]) {
      assert.deepEqual(applicationCard(application.slug, locale), {
        name: stored.name[locale], summary: stored.summary[locale], imageAlt: stored.imageAlt[locale],
      }, `${application.slug}: the ${locale} card is not the text a record would carry`);
    }
  }

  // Article teasers carry only the three fields a card shows; their bodies stay
  // untranslated, so there is no store and no record for them to contradict.
  for (const article of articles) {
    assert.deepEqual(articleCard(article.slug, "en"), {
      category: article.category.en, title: article.title.en, intro: article.intro.en,
    }, `${article.slug}: the English teaser drifted from articles.ts`);
    assert.deepEqual(articleCard(article.slug, "zh"), {
      category: article.category.zh, title: article.title.zh, intro: article.intro.zh,
    }, `${article.slug}: the Chinese teaser drifted from articles.ts`);
    for (const locale of ["es", "de"]) {
      const teaser = articleCard(article.slug, locale);
      assert.notEqual(teaser.title, article.title.en, `${article.slug}: ${locale} teaser title is English pasted back`);
      assert.notEqual(teaser.intro, article.intro.en, `${article.slug}: ${locale} teaser intro is English pasted back`);
      assert.ok(teaser.intro.length > 80, `${article.slug}: ${locale} teaser intro is too short to be a summary`);
      const digits = (s) => (s.match(/\d+/g) ?? []).join(",");
      assert.equal(digits(teaser.title), digits(article.title.en), `${article.slug}: ${locale} teaser moved a figure`);
    }
  }
});

test("REQ 2 · the teaser guard reads the entity rather than trusting its own table", () => {
  // Without this control the guard above is indistinguishable from absent: the
  // table asserts its own en/zh against articles.ts on every call, and the only
  // way to see that it bites is to make the two disagree.
  const article = articles[0];
  const before = article.title.en;
  try {
    article.title.en = "Retitled after the teaser table was written";
    assert.throws(() => articleCard(article.slug, "es"), /no longer matches articles\.ts/,
      "a stale teaser table passed silently");
  } finally {
    article.title.en = before;
  }
  assert.equal(articleCard(article.slug, "en").title, before, "the guard stayed angry after the fix");
});

test("REQ 5 · localizing a card grants the page behind it nothing", async () => {
  const cardSource = read("src/content/card-copy.ts");
  const specifiers = [...cardSource.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
  assert.deepEqual(
    specifiers.filter((spec) => /translation-availability|translation-evidence|availability/.test(spec)),
    [],
    `card copy imports the promotion machinery: ${specifiers.join(", ")}`,
  );
  assert.equal(
    /pageCopyFor/.test(cardSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")),
    false,
    "card copy calls the promotion seam",
  );

  for (const { path: pagePath, entity } of LOCALIZED_PAGES) {
    for (const locale of ["es", "de"]) {
      const unpromoted = pageCopyFor(pagePath, locale, entity);
      assert.equal(unpromoted.contentLocale, "en", `${locale} ${pagePath} body resolved to itself`);
      assert.equal(unpromoted.entity, entity, `${locale} ${pagePath} was handed a copied entity`);
      assert.equal(resolvedContentLocaleOf(pagePath, locale), "en", `${locale} ${pagePath} claimed a content language`);
    }
  }
  assert.equal(TRANSLATION_EVIDENCE.length, LOCALIZED_PAGES.length * 2, "the card pass added evidence records");
  assert.equal(TRANSLATION_EVIDENCE.every((record) => record.status === "draft"), true);
  assert.deepEqual([...TRANSLATED_PAGES], [], "a localized card promoted a page");
});

/* -------------------------------------------------------------- build */
const PRERENDER_ROOT = path.join(repoRoot, ".next", "server", "app");
const buildOptions = { skip: !existsSync(PRERENDER_ROOT) };

test("REQ 4 · a draft page displays its translation and claims none of it", buildOptions, () => {
  const raw = (rel) => readFileSync(path.join(PRERENDER_ROOT, rel), "utf8");
  for (const locale of ["es", "de"]) {
    const product = products[0];
    const application = applications[0];
    const productHtml = raw(`${locale}/products/${product.slug}.html`);
    const applicationHtml = raw(`${locale}/applications/${application.slug}.html`);
    const productPage = visibleText(productHtml);
    const applicationPage = visibleText(applicationHtml);

    // The display tier: text that exists only in the copy store is now on the
    // page, and the model's English is gone from it. A long prose field is the
    // witness, not a name — the localized header strip repeats short names in
    // every document, so a name proves nothing either way.
    for (const [page, html, label, english, translated] of [
      [productPage, productHtml, product.slug, product.tagline.en, productCopy[product.slug].tagline[locale]],
      [applicationPage, applicationHtml, application.slug, application.summary.en,
        applicationCopy[application.slug].summary[locale]],
    ]) {
      assert.ok(translated.length > 60, `${label}: the fixture field is too short to prove anything`);
      assert.ok(page.includes(translated),
        `${locale} ${label} did not render the draft record's copy`);
      assert.equal(page.includes(english), false,
        `${locale} ${label} still renders the model's English body copy`);
      assert.ok(page.includes(getDictionary(locale).nav.products), `${locale} ${label} lost its localized navigation`);

      // The claim tier, unmoved by a draft. All four surfaces a promotion owns.
      assert.match(html, new RegExp(`<link rel="canonical" href="[^"]*/(products|applications)/[^"]+"`),
        `${locale} ${label} no longer canonicalises to its English owner`);
      assert.equal(/rel="alternate" hreflang="(es|de)"/.test(html), false, `${locale} ${label} declares a graph`);
      assert.match(html, /property="og:locale" content="en_/, `${locale} ${label} moved og:locale`);
      for (const tag of [...html.matchAll(/"inLanguage":\s*"([^"]+)"/g)].map((m) => m[1])) {
        assert.equal(tag, htmlLang.en, `${locale} ${label} claims ${tag} in structured data`);
      }
    }
  }
  // English and Chinese are owners by the model's guarantee and never went
  // through this seam, so their shipped pages still carry the model's own text.
  const english = visibleText(raw(`products/${products[0].slug}.html`));
  assert.ok(english.includes(products[0].tagline.en), "the English owner lost its own copy");
  const chinese = visibleText(readFileSync(path.join(PRERENDER_ROOT, "zh", "products", `${products[0].slug}.html`), "utf8"));
  assert.ok(chinese.includes(products[0].tagline.zh), "the Chinese owner lost its own copy");
});

/**
 * The text a visitor actually reads: scripts (Next's flight payload, which carries
 * the whole serialized dictionary) and tags (which carry attribute text, including
 * `alt`) both go, and entities come back. A card assertion on the raw document
 * would be a test about escaping — the German application name renders as
 * `Handtuchweberei &amp; Zero-Twist`, which is exactly the string a reader sees and
 * not the string `includes` looks for.
 */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

test("REQ 4 · the shipped HTML shows localized cards over unpromoted pages", buildOptions, () => {
  const page = (rel) => visibleText(readFileSync(path.join(PRERENDER_ROOT, rel), "utf8"));
  const product = products[0];
  const application = applications[0];
  const article = articles[0];

  for (const locale of ["es", "de"]) {
    const card = productCard(product.slug, locale);
    const appCard = applicationCard(application.slug, locale);
    const teaser = articleCard(article.slug, locale);

    // What a card contributes: the listing page and the home page carry it.
    const listings = [page(`${locale}.html`), page(`${locale}/products.html`)];
    for (const text of listings) assert.ok(text.includes(card.tagline),
      `${locale} card did not ship its localized tagline`);
    assert.ok(page(`${locale}.html`).includes(appCard.summary), `${locale} home application card stayed English`);
    assert.ok(page(`${locale}/applications.html`).includes(appCard.summary), `${locale} application card stayed English`);
    assert.ok(page(`${locale}/knowledge.html`).includes(teaser.title), `${locale} knowledge teaser stayed English`);
    assert.ok(page(`${locale}/knowledge.html`).includes(teaser.intro), `${locale} teaser intro stayed English`);

    // What a deferred page still claims: `/knowledge/*` and `/answers/*` have no
    // record in either tier, so their own copy is still the model's. The card
    // above may be Spanish while the page behind it is English, and that is the
    // honest shape of a page this task has not translated rather than a promotion
    // nobody signed.
    const articlePage = page(`${locale}/knowledge/${article.slug}.html`);
    assert.ok(articlePage.includes(article.title.en), `${locale} article page lost the headline it still owns`);
    assert.equal(articlePage.includes(teaser.title), false,
      `the localized teaser leaked into ${locale} ${article.slug}`);

    // And the four SEO surfaces still describe the pre-approval world.
    const policy = createAvailabilityPolicy();
    for (const pagePath of LOCALIZED_PAGES.map((entry) => entry.path)) {
      assert.equal(policy.canonicalLocaleFor(pagePath, locale), "en", `${locale} ${pagePath} owns its URL`);
      assert.equal(policy.isSitemapEligible(pagePath, locale), false, `${locale} ${pagePath} entered the sitemap`);
    }
    for (const rel of [
      `${locale}/products/${product.slug}.html`,
      `${locale}/applications/${application.slug}.html`,
    ]) {
      const raw = readFileSync(path.join(PRERENDER_ROOT, rel), "utf8");
      assert.equal(/rel="alternate" hreflang="(es|de)"/.test(raw), false, `${rel} declares a localized alternate`);
    }
  }
});

/**
 * ============================================================================
 * Task 61 · CONTENT-QUALITY-001B — the knowledge article body model
 *
 * Appended here rather than into a new file because `package.json` lists every
 * `test:seo` suite by name and that file is shared, and because this suite already
 * reads the article cards, the promotion seam and the built documents.
 *
 * An article used to be `(heading, body)[]`, which both renderers printed as one
 * `<h2>` plus one `<p>` — no list, no table, no inline link was expressible. The
 * model now carries typed blocks. What makes that safe, in order of how badly each
 * failure would arrive silently:
 *
 *   1. `sections` must STILL be a single `{ en, zh }` field. `translation-availability.ts`
 *      recognises body copy by counting an object's keys, so a model that moved the
 *      locale pair inside each block would stop being recognised, and a future ES/DE
 *      approval would publish a self-canonical URL over an English body. Nothing
 *      errors; that is GSC-INDEX-002 arriving again.
 *   2. The four shipped articles must render the text they shipped with. This task
 *      changes what an article CAN hold, not what these four say.
 *   3. Related reading must be the article's own, and every declared slug must resolve.
 *   4. Each guard is proved able to fail by a planted bad value, as elsewhere here.
 */

const {
  assertArticleBodyShape, assertAlignedBody, assertInternalHref, bodySignature, legacyTupleToBody,
} = await importSource("src/content/article-blocks.ts");
const { articlesForProduct, assertArticleRelated, relatedFor } = await importSource("src/content/article-related.ts");
const {
  knowledgeBlocks, resourcesGroups, MIN_GROUP_SIZE, RESOURCES_CATEGORY_ORDER,
} = await importSource("src/content/resources-groups.ts");
const { articles: legacyArticleEntries } = await importSource("src/content/legacy-source.ts");
const { buyerAnswers } = await importSource("src/content/answers.ts");
const { answerCard } = await importSource("src/content/card-copy.ts");

test("TASK 61 · a block body is still one { en, zh } record, so the seam can widen it", () => {
  for (const article of articles) {
    assert.deepEqual(Object.keys(article.sections).sort(), ["en", "zh"],
      `${article.slug}: sections must hold exactly en and zh. translation-availability.ts ` +
      `identifies body copy by its key set, and a body it cannot recognise is a body that ` +
      `stays English under a localized canonical`);
    assert.equal(Array.isArray(article.sections), false,
      `${article.slug}: sections became an array — the one shape the seam skips`);
  }
});

test("TASK 61 · the articles this pass left alone still render their legacy text", () => {
  const legacy = new Map(legacyArticleEntries.map((entry) => [entry.slug, entry]));
  const reAuthored = new Set(Object.keys(reAuthoredBodies));
  assert.ok(reAuthored.size < articles.length,
    "every article is re-authored, so nothing in this suite still checks the legacy fold");

  for (const article of articles.filter((a) => !reAuthored.has(a.slug))) {
    const before = legacy.get(article.slug);
    assert.ok(before, `${article.slug} is no longer in legacy-source.ts`);
    assert.equal(article.sections.en.length, before.sections.length, `${article.slug}: section count changed`);
    assert.equal(article.sections.zh.length, before.sections.length, `${article.slug}: zh section count changed`);
    before.sections.forEach(([heading, body], index) => {
      const section = article.sections.en[index];
      assert.equal(section.heading, heading, `${article.slug}: section ${index + 1} heading drifted`);
      assert.equal(section.blocks.length, 1, `${article.slug}: section ${index + 1} gained structure`);
      assert.equal(section.blocks[0].type, "paragraph", `${article.slug}: section ${index + 1} is not a paragraph`);
      assert.equal(section.blocks[0].text, body, `${article.slug}: section ${index + 1} text drifted`);
    });
  }
});

/*
 * ============================================================================
 * Task 62 · R1 and R2 re-authored on the block model
 *
 * Batch 0's guarantee was "no copy changed". This pass deliberately breaks it
 * for two articles, so the guard that mattered has to become a different one:
 *
 *   1. Every published figure in new prose must trace to a source already in the
 *      repository. That is the whole factual red line reduced to a test: a
 *      number that exists nowhere else is an invented number.
 *   2. No fabricated commercial or performance claim — no MOQ, lead time, price,
 *      guarantee, superlative, customer or dissolution time.
 *   3. Headlines, intros, categories and descriptions stay untouched, because
 *      card-copy mirrors them in four locales and refreshing the Spanish side
 *      would mean authoring a translation nobody reviewed.
 *   4. dateModified advances only where the body actually changed.
 */

const { reAuthoredBodies } = await importSource("src/content/article-body-patches.ts");

/** Every string leaf in a body, in declaration order. */
function bodyStrings(body) {
  const out = [];
  const spans = (list) => list.forEach((span) => out.push(span.text));
  for (const section of body) {
    out.push(section.heading);
    for (const block of section.blocks) {
      switch (block.type) {
        case "heading":
        case "paragraph":
          out.push(block.text);
          break;
        case "callout":
          out.push(block.text, block.label);
          break;
        case "prose":
          spans(block.spans);
          break;
        case "list":
          block.items.forEach(spans);
          break;
        case "definitionList":
          block.items.forEach((item) => {
            out.push(item.term);
            spans(item.detail);
          });
          break;
        case "table":
          out.push(block.caption, ...block.columns);
          block.rows.forEach((row) => out.push(...row));
          break;
      }
    }
  }
  return out;
}

/**
 * Numeric tokens, extracted the same way from prose and from source.
 *
 * This is deliberately not a substring test. An earlier version asked whether
 * "42.7" appeared anywhere in the corpus and was satisfied — because it is the
 * tail of the patent application number `ZL 2020 1 0227142.7`. A figure buried
 * inside an unrelated identifier does not publish that figure, so both sides are
 * reduced to whole numeric tokens and compared as sets.
 */
const figureTokens = (text) =>
  new Set((text.match(/\d[\d.,]*\d|\d/g) || []).map((token) => token.replace(/[.,]+$/, "")));

/** The repository's own published record — the only admissible source of a figure. */
const evidenceCorpus = [
  "src/content/quality.ts",
  "src/content/patents.ts",
  "src/content/factory.ts",
  "src/content/legacy-source.ts",
  "src/content/applications.ts",
  "src/content/catalog.ts",
].map(read).join("\n");
const corpusFigures = figureTokens(evidenceCorpus);

test("TASK 62 · every figure in a re-authored body already exists in the repository's record", () => {
  for (const [slug, body] of Object.entries(reAuthoredBodies)) {
    for (const locale of ["en", "zh"]) {
      const figures = figureTokens(bodyStrings(body[locale]).join(" "));
      assert.ok(figures.size > 0, `${slug}/${locale} states no figures at all`);
      for (const figure of figures) {
        assert.ok(corpusFigures.has(figure),
          `${slug}/${locale} states "${figure}", which is published nowhere in the repository's own ` +
            `record. A number that exists nowhere else is an invented number: cite it or cut it.`);
      }
    }
  }
});

test("TASK 62 · the re-authored bodies add no fabricated commercial or performance claim", () => {
  const forbidden = [
    [/minimum order quantity|\bMOQ\b/i, "an MOQ figure or promise"],
    [/lead time/i, "a lead-time claim"],
    [/per (kg|kilogram|tonne|ton)\b|US?\$\s?\d|price of \$/i, "a price"],
    // Affirmative promises only. This copy's whole position is that nothing here is
    // a guarantee, so a bare /guarantee/ would flag the sentence that says so.
    [/\bguaranteed\b|we guarantee|this guarantees|guarantee of|comes with a guarantee|market share/i,
      "a guarantee or market-share claim"],
    [/\b(no\.?1|number one|best|leading|largest)\b/i, "a superlative the repository does not support"],
    [/\b(dissolves?|removal|dissolution)\b[^.]{0,60}\b\d+(\.\d+)?\s*(minutes?|mins|hours?|seconds?)\b/i, "a dissolution time"],
    [/\b(tenacity|breaking strength|elongation)\b[^.]{0,40}\b\d+(\.\d+)?\s*(cN|cn|g\/d|MPa|%)/i, "a mechanical value"],
    [/\btwist\b[^.]{0,30}\b\d+(\.\d+)?\s*(tm|t\/m|turns)/i, "a twist figure"],
    [/\b(bath|liquor) ratio\b[^.]{0,30}1\s*[:：]\s*\d/i, "a bath ratio"],
    [/\b(customer|client) (named|called|such as|like)\b/i, "a named customer"],
  ];
  for (const [slug, body] of Object.entries(reAuthoredBodies)) {
    const text = [...bodyStrings(body.en), ...bodyStrings(body.zh)].join(" ");
    for (const [pattern, what] of forbidden) {
      const hit = text.match(pattern);
      assert.equal(hit, null, `${slug} states ${what}${hit ? `: "...${hit[0]}..."` : ""}`);
    }
  }
});

test("TASK 62 · re-authoring kept the headlines and gave the bodies real structure", () => {
  const legacy = new Map(legacyArticleEntries.map((entry) => [entry.slug, entry]));
  for (const article of articles) {
    const before = legacy.get(article.slug);
    const authored = article.sections.en;
    const isReauthored = Object.prototype.hasOwnProperty.call(reAuthoredBodies, article.slug);

    // card-copy mirrors these four in en/zh/es/de, so this pass may not move them.
    assert.equal(article.title.en, before.title, `${article.slug}: English title changed`);
    assert.equal(article.intro.en, before.intro, `${article.slug}: English intro changed`);
    assert.equal(article.category.en, before.category, `${article.slug}: category changed`);
    assert.equal(article.metaDescription.en, before.metaDescription, `${article.slug}: description changed`);

    const kinds = new Set(authored.flatMap((s) => s.blocks.map((b) => b.type)));
    assert.ok(kinds.has("paragraph"), `${article.slug} lost its prose`);
    if (isReauthored) {
      for (const kind of ["table", "definitionList", "list", "prose", "callout"]) {
        assert.ok(kinds.has(kind),
          `${article.slug} was re-authored without the ${kind} this task exists to enable`);
      }
      const linked = authored.some((section) => section.blocks.some((block) => {
        const leaves = block.type === "prose" ? block.spans
          : block.type === "list" ? block.items.flat()
          : block.type === "definitionList" ? block.items.flatMap((i) => i.detail)
          : [];
        return leaves.some((leaf) => leaf.kind === "link");
      }));
      assert.ok(linked, `${article.slug} added structure but no internal link`);
      assert.equal(article.dateModified, "2026-09-11",
        `${article.slug} was rewritten but still claims the legacy revision date`);
    } else {
      assert.equal(article.dateModified, before.dateModified,
        `${article.slug} did not change, so its dateModified must not move`);
    }
  }
});

test("TASK 62 · an invented figure cannot pass the traceability filter", () => {
  // Negative control: without this, "every number traces" is indistinguishable
  // from a filter that accepts everything. 42.7 is chosen deliberately — it is the
  // tail of a patent application number, so a weaker substring rule would wave it
  // through as if the company had published that strength.
  const planted = [{
    heading: "Planted",
    blocks: [{ type: "paragraph", text: "Typical breaking strength is 42.7 cN/tex." }],
  }];
  const figures = [...figureTokens(bodyStrings(planted).join(" "))];
  assert.ok(figures.length >= 1, "the extractor found no figures to check");
  const untraceable = figures.filter((figure) => !corpusFigures.has(figure));
  assert.ok(untraceable.includes("42.7"),
    "an invented mechanical value passed the traceability filter");
});

test("TASK 61 · the legacy fold adds no text and loses none", () => {
  assert.deepEqual(legacyTupleToBody([["Heading A", "Body A"], ["Heading B", "Body B"]]), [
    { heading: "Heading A", blocks: [{ type: "paragraph", text: "Body A" }] },
    { heading: "Heading B", blocks: [{ type: "paragraph", text: "Body B" }] },
  ]);
  assert.deepEqual(legacyTupleToBody([]), [], "an empty body should fold to empty, not throw");
});

test("TASK 61 · the model carries what the old one could not", () => {
  const body = [{
    heading: "A procedure",
    blocks: [
      { type: "heading", text: "Before you start" },
      { type: "prose", spans: [
        { kind: "text", text: "Record partial softening separately from " },
        { kind: "link", text: "complete removal", href: "/knowledge/pva-batch-dissolution-consistency" },
        { kind: "text", text: "." },
      ] },
      { type: "list", ordered: true, items: [
        [{ kind: "text", text: "Condition the specimen." }],
        [{ kind: "text", text: "Hold the bath within tolerance." }],
      ] },
      { type: "definitionList", items: [
        { term: "Endpoint", detail: [{ kind: "text", text: "The stage that matters to the process." }] },
      ] },
      { type: "table", caption: "Grades this site describes", rowHeader: true,
        columns: ["Label", "Intended use"], rows: [["20°C", "Cool bath"], ["90°C", "Hot bath"]] },
      { type: "callout", label: "Note", tone: "note", text: "A label is not a pass condition." },
    ],
  }];
  const signature = bodySignature(body);
  assert.ok(signature.includes("table:2x2+rh"), `the fingerprint lost the table shape: ${signature}`);
  assert.ok(signature.includes("ol["), `the fingerprint lost the ordered list: ${signature}`);
  assertArticleBodyShape("fixture", { en: body, zh: body });
  assertAlignedBody("fixture", { en: body, zh: body });
});

test("TASK 61 · every guard refuses the mistake it exists for", () => {
  const ok = { type: "paragraph", text: "x" };
  const pair = (extra) => {
    const sections = [{ heading: "H", blocks: [ok, ...extra] }];
    return { en: sections, zh: sections };
  };

  assert.throws(() => assertArticleBodyShape("t", pair(
    [{ type: "table", caption: "c", columns: ["A", "B"], rows: [["1"]], rowHeader: false }]),
  ), /row 1 has 1 cells against 2 columns/, "a ragged table was accepted");

  assert.throws(() => assertArticleBodyShape("t", pair(
    [{ type: "table", caption: "  ", columns: ["A", "B"], rows: [["1", "2"]], rowHeader: false }]),
  ), /has no caption/, "a table with a blank caption was accepted");

  assert.throws(() => assertArticleBodyShape("t", pair(
    [{ type: "table", caption: "c", columns: ["A", "B", "C", "D", "E"], rows: [["1", "2", "3", "4", "5"]], rowHeader: false }]),
  ), /over the limit/, "a five-column table was accepted");

  assert.throws(() => assertInternalHref("t", "/es/knowledge/x"), /prefix-free/, "a locale-prefixed href was accepted");
  assert.throws(() => assertInternalHref("t", "/knowledge/x#frag"), /prefix-free/, "a fragment href was accepted");
  assert.throws(() => assertInternalHref("t", "https://example.com/x"), /prefix-free/, "an absolute URL was accepted");
  assert.throws(() => assertInternalHref("t", "/knowledge/x/"), /prefix-free/, "a trailing-slash href was accepted");
  assert.doesNotThrow(() => assertInternalHref("t", "/request-sample?application=towel-weaving"),
    "a query link, which the sample flow uses, was rejected");

  // Promotion replaces the whole field, so both locales must share one shape.
  assert.throws(() => assertAlignedBody("t", {
    en: [{ heading: "H", blocks: [ok, ok] }],
    zh: [{ heading: "H", blocks: [ok] }],
  }), /not the same shape/, "a mis-aligned zh body was accepted");

  assert.throws(() => assertArticleBodyShape("t", {
    en: [{ heading: "H", blocks: [] }],
    zh: [{ heading: "H", blocks: [] }],
  }), /has no blocks/, "a heading with nothing under it was accepted");

  assert.throws(() => resourcesGroups([{ slug: "x", category: { en: "Weather" } }]),
    /no Resources category claims/, "an article filed under an undeclared category was accepted");

  assert.throws(() => relatedFor("not-an-article"), /has no related set/,
    "an article with no declared related set was silently accepted");
  // A retired article must fail loudly, not render a dead card.
  assert.throws(() => assertArticleRelated(["pva-yarn-dissolution-temperature-guide"]),
    /no longer exists/, "assertArticleRelated accepted an edge it cannot resolve");
});

test("TASK 61 · related content is declared, resolves, and never points at itself", () => {
  const knownProducts = new Set(products.map((entry) => entry.slug));
  const knownApplications = new Set(applications.map((entry) => entry.slug));
  const knownAnswers = new Set(buyerAnswers.map((entry) => entry.slug));
  const knownArticles = new Set(articles.map((entry) => entry.slug));

  for (const article of articles) {
    const set = relatedFor(article.slug);
    assert.equal(new Set(set.products).size, set.products.length, `${article.slug}: repeated product edge`);
    for (const slug of set.products) assert.ok(knownProducts.has(slug), `${article.slug}: unknown product ${slug}`);
    for (const slug of set.applications) assert.ok(knownApplications.has(slug), `${article.slug}: unknown application ${slug}`);
    for (const slug of set.answers) assert.ok(knownAnswers.has(slug), `${article.slug}: unknown answer ${slug}`);
    for (const slug of set.articles) {
      assert.ok(knownArticles.has(slug), `${article.slug}: unknown article ${slug}`);
      assert.notEqual(slug, article.slug, `${article.slug}: lists itself as related reading`);
    }
    // Every edge needs a label in all four locales; the card accessors throw without one.
    for (const locale of locales) {
      for (const slug of set.products) productCard(slug, locale);
      for (const slug of set.answers) answerCard(slug, locale);
      for (const slug of set.articles) articleCard(slug, locale);
    }
  }
  for (const product of products) {
    for (const slug of articlesForProduct(product.slug)) {
      assert.ok(knownArticles.has(slug), `${product.slug}: recommends unknown article ${slug}`);
    }
  }
});

test("TASK 61 · the hub groups by category and stays unlabelled until a label is honest", () => {
  assert.ok(MIN_GROUP_SIZE >= 2, "a group of one is not a category — it adds a heading and no information");

  const shown = knowledgeBlocks();
  const slugs = shown.flatMap((block) => [...block.slugs]).sort();
  assert.deepEqual(slugs, articles.map((article) => article.slug).sort(),
    "grouping must show every article exactly once");
  assert.equal(new Set(slugs).size, slugs.length, "an article is rendered in two groups");
  for (const block of shown) {
    if (block.label === null) continue;
    const shared = new Set(block.slugs.map((slug) => articleCard(slug, "en").category));
    assert.equal(shared.size, 1, `labelled block "${block.label}" spans several categories`);
    assert.ok(shared.has(block.label), `label "${block.label}" is not a category its members use`);
  }

  // Prove the machinery works without waiting for more copy: agreement earns a
  // heading, disagreement must not invent one.
  const twin = resourcesGroups([
    { slug: "a", category: { en: "Material selection" } },
    { slug: "b", category: { en: "Material selection" } },
  ]);
  assert.equal(twin.length, 1);
  assert.equal(twin[0].label, "Material selection", "a genuine two-article group earned no heading");
  const split = resourcesGroups([
    { slug: "a", category: { en: "Material selection" } },
    { slug: "b", category: { en: "Technical guide" } },
  ]);
  assert.equal(split[0].label, null,
    "two articles with different approved labels were given a heading neither one uses");

  assert.deepEqual(RESOURCES_CATEGORY_ORDER,
    ["product-selection", "applications", "testing-evidence", "manufacturing-capability", "troubleshooting", "buyer-guides"],
    "the six-category model changed shape");
});

test("TASK 61 · the section answers to one name in every locale", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale);
    assert.equal(dict.knowledgeIndex.title, dict.nav.knowledge,
      `${locale}: the H1 and the navigation give this section different names`);
    assert.equal(dict.breadcrumbs.knowledge, dict.nav.knowledge,
      `${locale}: the breadcrumb disagrees with the navigation`);
    assert.ok(dict.knowledgeIndex.title.trim().length > 0, `${locale}: the section has no name`);
  }
  const indexRoute = read("src/app/(site)/knowledge/page.tsx");
  assert.match(indexRoute, /pageMeta\.en\.knowledge\.title/, "the EN route went back to its own <title> literal");
  assert.doesNotMatch(indexRoute, /title: "Technical Resources/, "a duplicated EN <title> literal is back");
  for (const route of ["src/app/(site)/knowledge/[slug]/page.tsx", "src/app/[lang]/knowledge/[slug]/page.tsx"]) {
    assert.doesNotMatch(read(route), /PVA knowledge/, `${route} prints an English section name again`);
  }
  assert.doesNotMatch(read("src/app/(site)/knowledge/[slug]/page.tsx"), /answersIndex\.aboutHeading/,
    "the article byline is pointing at answer wording again");
});

/** Visible text of the related block: after `</article>`, before the site footer. */
function relatedFootline(rel) {
  const html = readFileSync(path.join(PRERENDER_ROOT, rel), "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, " ");
  const start = html.indexOf("</article>");
  const end = html.indexOf("<footer");
  if (start < 0) return "";
  return visibleText(end > start ? html.slice(start, end) : html.slice(start));
}

const articleDoc = (locale, slug) => (locale === "en" ? `knowledge/${slug}.html` : `${locale}/knowledge/${slug}.html`);

test("TASK 61 · the shipped HTML renders the model and keeps each article's own prose", buildOptions, () => {
  for (const article of articles) {
    for (const locale of locales) {
      const rel = articleDoc(locale, article.slug);
      if (!existsSync(path.join(PRERENDER_ROOT, rel))) throw new Error(`missing prerendered document: ${rel}`);
      const html = readFileSync(path.join(PRERENDER_ROOT, rel), "utf8");
      const body = visibleText(html);
      const sections = locale === "zh" ? article.sections.zh : article.sections.en;

      let cursor = 0;
      for (const section of sections) {
        const at = body.indexOf(section.heading, cursor);
        assert.ok(at >= 0, `${rel}: lost the heading "${section.heading}"`);
        for (const block of section.blocks) {
          if (block.type !== "paragraph") continue;
          const found = body.indexOf(block.text, at);
          assert.ok(found >= 0, `${rel}: lost the body of "${section.heading}"`);
          cursor = found + block.text.length;
        }
      }

      const articleRegion = html.slice(html.indexOf("<article"), html.indexOf("</article>"))
        .replace(/<script[\s\S]*?<\/script>/g, " ");
      const declared = sections.some((section) => section.blocks.some((block) => block.type !== "paragraph"));
      assert.equal(/<(ul|ol|dl|table|figure)[\s>]/.test(articleRegion), declared,
        `${rel}: shows list or table markup the article body never asked for`);
      assert.equal(articleRegion.includes("PVA knowledge"), false, `${rel}: still prints the old English suffix`);
      assert.equal(articleRegion.includes("About this answer"), false, `${rel}: still prints the orphan answer label`);
    }
  }

  // Related reading is the article's own, not the whole catalogue.
  for (const article of articles) {
    const footline = relatedFootline(articleDoc("en", article.slug));
    const declared = article.related.products.map((slug) => productCard(slug, "en").name);
    const undeclared = products.map((product) => productCard(product.slug, "en").name)
      .filter((name) => !declared.includes(name));
    for (const name of declared) {
      assert.ok(footline.includes(name), `${article.slug}: declares "${name}" but does not link it`);
    }
    for (const name of undeclared) {
      assert.equal(footline.includes(name), false,
        `${article.slug}: still advertises "${name}", which it does not declare`);
    }
    for (const slug of article.related.answers) {
      assert.ok(footline.includes(answerCard(slug, "en").question), `${article.slug}: lost related answer "${slug}"`);
    }
  }
});

test("TASK 61 · the body renderer stays server-only and keeps the route's pins", () => {
  for (const [name, source] of [
    ["article-body.tsx", read("src/components/knowledge/article-body.tsx")],
    ["article-related.tsx", read("src/components/knowledge/article-related.tsx")],
  ]) {
    assert.doesNotMatch(source, /^\s*"use client";/m, `${name} became a client component`);
    assert.doesNotMatch(source, /\buse(State|Effect|Memo|Callback|Ref)\b/, `${name} gained client state`);
    assert.doesNotMatch(source, /pageCopyFor\(/,
      `${name} resolves its own copy: locale resolution belongs to the route, and a second ` +
      `seam here would be one no evidence record was ever reviewed against`);
  }
  const bodyView = read("src/components/knowledge/article-body.tsx");
  assert.match(bodyView, /<caption/, "a table could render with no caption again");
  assert.match(bodyView, /scope="col"/, "column headers lost their scope");
  assert.match(bodyView, /scope="row"/, "row headers lost their scope");
  assert.match(bodyView, /scroll-thin/, "the table no longer scrolls on a phone");
  assert.match(bodyView, /table-spec/, "the table left the shared spec-table style");

  const langRoute = read("src/app/[lang]/knowledge/[slug]/page.tsx");
  assert.match(langRoute, /pageCopyFor\(/, "the localized route stopped resolving copy");
  assert.match(langRoute, /contentLocale/);
  assert.match(langRoute, /section: "knowledge",\s*\n\s*locale,/);
  assert.match(langRoute, /from ["']@\/content\/card-copy["']/,
    "the route stopped resolving card labels, so related links would go English");
});
