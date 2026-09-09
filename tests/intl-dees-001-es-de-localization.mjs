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

/* -------------------------------------------------------------- build */
const PRERENDER_ROOT = path.join(repoRoot, ".next", "server", "app");
const buildOptions = { skip: !existsSync(PRERENDER_ROOT) };

test("REQ 4 · the shipped HTML still serves English deep copy on ES and DE", buildOptions, () => {
  const doc = (rel) => readFileSync(path.join(PRERENDER_ROOT, rel), "utf8");
  const englishName = products[0].name.en;
  for (const locale of ["es", "de"]) {
    const html = doc(`${locale}/products/${products[0].slug}.html`);
    assert.ok(html.includes(englishName), `${locale} product page no longer renders the model's English copy`);
    // A long prose field, not a product name: a name is a short phrase the
    // localized chrome legitimately repeats, while this sentence exists only in
    // the copy store until a reviewer approves the record.
    const unique = productCopy[products[0].slug].technicalOverview[locale][0];
    assert.ok(unique.length > 120, "the fixture field is too short to prove anything");
    assert.ok(!html.includes(unique.slice(0, 80)),
      `draft-record copy reached the shipped ${locale} page before anyone approved it`);
    // The chrome is localized even though the entity copy is not — the state a
    // draft leaves the page in, and the reason no promotion may rest on it.
    assert.ok(html.includes(getDictionary(locale).nav.products), `${locale} page lost its localized navigation`);
    assert.ok(/<link rel="canonical" href="[^"]*\/products\/[^"]+"/.test(html),
      `${locale} page no longer canonicalises to its English owner`);
    assert.equal(/rel="alternate" hreflang="es"/.test(html), false, `${locale} declares an es alternate`);
    assert.equal(/rel="alternate" hreflang="de"/.test(html), false, `${locale} declares a de alternate`);
  }
});
