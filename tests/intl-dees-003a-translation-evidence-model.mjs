import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * INTL-DEES-003A — the translation evidence model.
 *
 * INTL-DEES-002B made availability path-aware: a page owns a localized URL only
 * if the copy it renders exists. This suite pins the half that was missing —
 * *approval*. One record in `src/content/translation-evidence.ts` is the single
 * source of truth, keyed by path + locale, carrying the copy, the field list it
 * was reviewed against, its provenance and its status; only a record that
 * survives `evidenceDecisionFor` becomes a promotion, and a promotion is the
 * only thing both the SEO resolver and the renderer are built over.
 *
 * The five things this suite must show, per the card:
 *
 * 1. approved evidence promotes a page — and grants all four surfaces at once
 *    (self canonical, hreflang, sitemap alternate, localized `inLanguage`);
 * 2. missing evidence does not;
 * 3. incomplete evidence does not;
 * 4. draft evidence does not;
 * 5. the renderer and the SEO resolver read the same evidence source, so they
 *    cannot disagree about a page's language.
 *
 * Nothing is translated or promoted here: `TRANSLATION_EVIDENCE` ships empty, so
 * every shipped ES/DE answer is still the English-owner fallback, and promotion
 * is proven only against synthetic evidence registries.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const evidence = await importSource("src/content/translation-evidence.ts");
const {
  DEEP_CONTENT_SECTIONS,
  TRANSLATION_EVIDENCE,
  approvedEvidence,
  approvedEvidenceFor,
  approvedPromotions,
  draftEvidence,
  evidenceDecisionFor,
  evidenceFor,
  isDeepContentDetail,
  isGenuineTranslation,
  isPromotionLocale,
  promotionOf,
  rejectedEvidence,
} = evidence;

const {
  TRANSLATED_PAGES,
  isTranslationAvailable,
  pageCopyFor,
  resolvedContentLocaleOf,
  translatedPageFor,
} = await importSource("src/content/translation-availability.ts");

const {
  canonicalLocaleFor,
  canonicalUrlFor,
  contentHtmlLangOf,
  createAvailabilityPolicy,
  hreflangForPath,
  hreflangForRoute,
  indexabilityForRoute,
  isEnglishFallbackCopy,
  isLocalizedAt,
  isSitemapEligible,
  localizedLocalesFor,
  TRANSLATED_CONTENT_LOCALES,
} = await importSource("src/content/availability.ts");

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

const HONEST_PROVENANCE = {
  translatedBy: "seo-content/INTL-DEES-001",
  reviewedBy: "technical-seo/GSC-REVIEW",
  sourceRevision: "d34cd95",
  reviewedOn: "2026-09-08",
};

/**
 * One evidence record for a real entity, complete by default.
 *
 * `patch` mutates the finished record the way a real mistake would: a draft
 * status, a dropped field, an undeclared field, a pasted-back block, absent or
 * self-referential provenance. Everything the gate must refuse is built here by
 * subtraction from an approved record, so a test that passes for the wrong
 * reason (a typo in the fixture rather than the rule) shows up immediately.
 */
function recordFor(record, pagePath, locale, fields, patch = {}) {
  const requiredFields = fields ?? contentFieldsOf(record);
  const source = {};
  const content = {};
  for (const field of requiredFields) {
    source[field] = record[field].en;
    content[field] = synth(record[field].en);
  }
  const base = {
    path: pagePath,
    locale,
    status: "approved",
    requiredFields,
    source,
    content,
    provenance: { ...HONEST_PROVENANCE },
  };
  return typeof patch === "function" ? patch(base) : { ...base, ...patch };
}

const PROMOTED = products[0];
const PROMOTED_PATH = `/products/${PROMOTED.slug}`;
const SIBLING_PATH = `/products/${products[1].slug}`;
const FIELDS = contentFieldsOf(PROMOTED);
const APPROVED_ES = recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS);
const APPROVED_DE = recordFor(PROMOTED, PROMOTED_PATH, "de", FIELDS);

/** Every SEO surface a locale can own a page with, in one snapshot. */
function ownershipSurfaces(policy, pagePath, locale) {
  return {
    selfCanonical: policy.canonicalLocaleFor(pagePath, locale) === locale
      && policy.indexabilityForRoute(pagePath, locale).ownsOwnCanonical,
    hreflang: policy.hreflangForRoute(pagePath, locale) !== undefined
      && policy.localizedLocalesFor(pagePath).includes(locale),
    sitemapAlternate: policy.isSitemapEligible(pagePath, locale),
    localizedInLanguage: policy.contentHtmlLangOf(pagePath, locale) === htmlLang[locale],
  };
}

/** The shipped policy surface, as the site's own exports answer it. */
const shipped = {
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
};

const ALL_SURFACES_ON = { selfCanonical: true, hreflang: true, sitemapAlternate: true, localizedInLanguage: true };
const ALL_SURFACES_OFF = { selfCanonical: false, hreflang: false, sitemapAlternate: false, localizedInLanguage: false };

assert.ok(FIELDS.length >= 6, `expected a product record to carry its body fields, found ${FIELDS.length}`);
assert.ok(DEEP_PATHS.length > 40, `deep-content inventory looks too small: ${DEEP_PATHS.length}`);
assert.deepEqual(PROMOTION_LOCALES, ["es", "de"], "ES and DE must be the promotion pair");
assert.equal(typeof evidenceDecisionFor(APPROVED_ES).qualified, "boolean");
assert.deepEqual([...evidenceDecisionFor(APPROVED_ES).reasons], [], "the fixture itself must be promotable");

// ---------------------------------------------------------------------------
// 1 · The evidence registry is the single source of truth, and it is empty.
// ---------------------------------------------------------------------------
test("REQ 1/6 · one evidence registry ships, and it promotes nothing today", () => {
  assert.ok(Array.isArray(TRANSLATION_EVIDENCE), "the evidence registry must be an array");
  assert.deepEqual([...TRANSLATION_EVIDENCE], [], "INTL-DEES-003A must ship no evidence");
  assert.deepEqual([...approvedEvidence()], [], "no record may be approved before it exists");
  assert.deepEqual([...draftEvidence()], [], "no draft may be recorded either");
  assert.deepEqual([...rejectedEvidence()], [], "nothing to reject");

  // The promotion set is derived from the registry, not restated beside it.
  assert.deepEqual([...TRANSLATED_PAGES], [...approvedPromotions(TRANSLATION_EVIDENCE)]);
  assert.deepEqual([...TRANSLATED_PAGES], [], "REQ 6: zero ES/DE promotions");
  assert.deepEqual([...TRANSLATED_CONTENT_LOCALES], ["en", "zh"], "the model baseline must not absorb a promotion");
  assert.equal(approvedPromotions([APPROVED_ES]).length, 1, "a non-empty synthetic registry must be able to promote");
  assert.equal(approvedPromotions([{ ...APPROVED_ES, status: "draft" }]).length, 0);
});

// ---------------------------------------------------------------------------
// 2 · REQ 4 — without approved evidence, ES/DE stay English-owner fallbacks.
// ---------------------------------------------------------------------------
test("REQ 4 · every shipped ES and DE page keeps its English owner, on all four surfaces", () => {
  for (const locale of PROMOTION_LOCALES) {
    for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
      assert.deepEqual(ownershipSurfaces(shipped, p, locale), ALL_SURFACES_OFF, `${locale} ${p}`);
      assert.equal(resolvedContentLocaleOf(p, locale), "en", `${locale} ${p} resolved to its own copy`);
      assert.equal(canonicalUrlFor(p, locale), `${siteUrl}${p}`, `${locale} ${p} moved off its owner`);
      assert.equal(isEnglishFallbackCopy(p, locale), true, `${locale} ${p} was promoted`);
      assert.equal(hreflangForRoute(p, locale), undefined, `${locale} ${p} claims a language graph`);
      assert.equal(contentHtmlLangOf(p, locale), htmlLang.en, `${locale} ${p} claims translated body copy`);
      assert.equal(isTranslationAvailable(p, locale), false, `${locale} ${p} has no evidence yet`);
      assert.equal(evidenceFor(p, locale), undefined, `${locale} ${p} has an evidence record`);
    }
  }
});

// ---------------------------------------------------------------------------
// 3 · EN and ZH ownership is untouched by the evidence model.
// ---------------------------------------------------------------------------
test("REQ 7 · EN and ZH keep owning every page, with or without an ES record present", () => {
  for (const registry of [[], [APPROVED_ES]]) {
    const policy = createAvailabilityPolicy(approvedPromotions(registry));
    const promotedHere = registry.length > 0;
    for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
      for (const locale of TRANSLATED_CONTENT_LOCALES) {
        assert.equal(policy.canonicalLocaleFor(p, locale), locale, `${locale} ${p} lost its ownership`);
        assert.notEqual(policy.hreflangForRoute(p, locale), undefined, `${locale} ${p} lost its graph`);
        assert.equal(policy.isSitemapEligible(p, locale), true, `${locale} ${p} left the sitemap`);
        assert.equal(policy.contentHtmlLangOf(p, locale), htmlLang[locale], `${locale} ${p} changed language`);
      }
      const ownEs = promotedHere && p === PROMOTED_PATH;
      assert.deepEqual([...policy.localizedLocalesFor(p)], ownEs ? ["en", "zh", "es"] : ["en", "zh"], `${p} locale graph`);
      assert.deepEqual(
        Object.keys(policy.hreflangForPath(p)).sort(),
        ownEs ? ["en", "es", "x-default", "zh-CN"] : ["en", "x-default", "zh-CN"],
        `${p} hreflang`,
      );
    }
    // English and Chinese never need evidence, so they must not be able to use it.
    for (const locale of TRANSLATED_CONTENT_LOCALES) {
      const claimed = recordFor(PROMOTED, PROMOTED_PATH, locale, FIELDS);
      const decision = evidenceDecisionFor(claimed, [claimed]);
      assert.equal(decision.qualified, false, `${locale} must not be promotable through evidence`);
      assert.ok(decision.reasons.includes("locale-not-promotable"), locale);
    }
  }
});

// ---------------------------------------------------------------------------
// 4 · REQ 3 — approved evidence promotes, and grants all four surfaces at once.
// ---------------------------------------------------------------------------
test("REQ 3 · approved evidence promotes its page on every surface at once", () => {
  const promotions = approvedPromotions([APPROVED_ES]);
  assert.equal(promotions.length, 1);
  assert.deepEqual(promotions[0], promotionOf(APPROVED_ES), "a promotion is the record's own copy, shape-stripped");

  const policy = createAvailabilityPolicy(promotions);
  assert.deepEqual(ownershipSurfaces(policy, PROMOTED_PATH, "es"), ALL_SURFACES_ON);
  assert.equal(policy.canonicalUrlFor(PROMOTED_PATH, "es"), `${siteUrl}/es${PROMOTED_PATH}`);
  assert.equal(policy.contentHtmlLangOf(PROMOTED_PATH, "es"), htmlLang.es);
  assert.equal(policy.indexabilityForRoute(PROMOTED_PATH, "es").ownsOwnCanonical, true);
  assert.deepEqual([...policy.localizedLocalesFor(PROMOTED_PATH)], ["en", "zh", "es"]);

  // The English owner learns the real equivalent, symmetrically.
  const fromEn = policy.hreflangForRoute(PROMOTED_PATH, "en");
  assert.deepEqual(fromEn, policy.hreflangForRoute(PROMOTED_PATH, "es"));
  assert.equal(fromEn[htmlLang.es], `${siteUrl}/es${PROMOTED_PATH}`);
  assert.equal(fromEn["x-default"], `${siteUrl}${PROMOTED_PATH}`);

  // Scope: its path and its locale only.
  assert.deepEqual(ownershipSurfaces(policy, SIBLING_PATH, "es"), ALL_SURFACES_OFF);
  assert.deepEqual(ownershipSurfaces(policy, PROMOTED_PATH, "de"), ALL_SURFACES_OFF);
  assert.equal(policy.canonicalUrlFor(PROMOTED_PATH, "de"), `${siteUrl}${PROMOTED_PATH}`);

  // A second locale on the same page is a second record, and both survive.
  const both = createAvailabilityPolicy(approvedPromotions([APPROVED_ES, APPROVED_DE]));
  assert.deepEqual(ownershipSurfaces(both, PROMOTED_PATH, "es"), ALL_SURFACES_ON);
  assert.deepEqual(ownershipSurfaces(both, PROMOTED_PATH, "de"), ALL_SURFACES_ON);
  assert.deepEqual([...both.localizedLocalesFor(PROMOTED_PATH)], ["en", "zh", "es", "de"]);
});

test("REQ 2 · evidence is keyed by path AND locale: a neighbouring page or slug form inherits nothing", () => {
  const promotions = approvedPromotions([APPROVED_ES]);
  const policy = createAvailabilityPolicy(promotions);
  for (const other of [
    SIBLING_PATH,
    `${PROMOTED_PATH}/`,
    `${PROMOTED_PATH}x`,
    `/applications/${PROMOTED.slug}`,
    "/products",
  ]) {
    assert.deepEqual(ownershipSurfaces(policy, other, "es"), ALL_SURFACES_OFF, other);
    assert.equal(translatedPageFor(other, "es", promotions), undefined, other);
  }
});

// ---------------------------------------------------------------------------
// 5 · REQ 3 (negative half) — incomplete evidence does not promote.
// ---------------------------------------------------------------------------
const INCOMPLETE = [
  ["a declared field with no translated value", (r) => ({
    ...r,
    content: Object.fromEntries(Object.entries(r.content).filter(([f]) => f !== "intro")),
  }), "missing-translated-field:intro"],
  ["no declared fields at all", (r) => ({ ...r, requiredFields: [] }), "no-required-fields"],
  ["a translated field nobody declared", (r) => ({
    ...r,
    content: { ...r.content, specSheet: "ficha técnica" },
  }), "undeclared-content-field:specSheet"],
  ["a source field nobody declared", (r) => ({
    ...r,
    source: { ...r.source, specSheet: "specification sheet" },
  }), "undeclared-source-field:specSheet"],
  ["the English pasted back", (r) => ({ ...r, content: { ...r.source } }), "copy-not-translated"],
  ["one field left in English", (r) => ({
    ...r,
    content: { ...r.content, intro: r.source.intro },
  }), "copy-not-translated"],
  ["an empty translated block", (r) => ({
    ...r,
    content: { ...r.content, name: "   " },
  }), "copy-not-translated"],
  ["a source map that is one field short", (r) => ({
    ...r,
    source: Object.fromEntries(Object.entries(r.source).filter(([f]) => f !== "intro")),
  }), "missing-source-field:intro"],
  ["a field declared twice", (r) => ({ ...r, requiredFields: [...r.requiredFields, "intro"] }), "duplicate-required-field:intro"],
  ["a section index", (r) => ({ ...r, path: "/products" }), "path-not-entity-detail"],
  ["a core route", (r) => ({ ...r, path: "/quality" }), "path-not-entity-detail"],
];

for (const [label, patch, reason] of INCOMPLETE) {
  test(`REQ 3 · refuses incomplete evidence — ${label}`, () => {
    const broken = recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, patch);
    const decision = evidenceDecisionFor(broken, [broken]);
    assert.equal(decision.qualified, false, label);
    assert.ok(decision.reasons.includes(reason), `${label}: expected "${reason}" in ${JSON.stringify(decision.reasons)}`);
    assert.deepEqual([...approvedPromotions([broken])], [], label);

    const promotions = approvedPromotions([broken, APPROVED_DE]);
    const policy = createAvailabilityPolicy(promotions);
    assert.deepEqual(ownershipSurfaces(policy, PROMOTED_PATH, "es"), ALL_SURFACES_OFF, label);
    assert.deepEqual(ownershipSurfaces(policy, PROMOTED_PATH, "de"), ALL_SURFACES_ON, `${label}: a sibling record must not be collateral damage`);
    assert.equal(pageCopyFor(PROMOTED_PATH, "es", PROMOTED, promotions).contentLocale, "en", label);
  });
}

test("REQ 3 · a partially translated page stays a fallback even when the copy it does carry is perfect", () => {
  // The trap INTL-DEES-002 left open at the promotion seam: a record can be
  // internally honest about the fields it names. The declaration gate cannot see
  // the live entity, so the render gate catches it — and detail pages are
  // prerendered, so the build fails rather than shipping half a page.
  const underDeclared = recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS.slice(0, FIELDS.length - 1));
  assert.equal(isGenuineTranslation(promotionOf(underDeclared)), true, "the copy it names is honest");
  assert.equal(evidenceDecisionFor(underDeclared, [underDeclared]).qualified, true, "the declaration gate is satisfied");
  assert.equal(isDeepContentDetail(PROMOTED_PATH), true);

  const promotions = approvedPromotions([underDeclared]);
  assert.throws(
    () => pageCopyFor(PROMOTED_PATH, "es", PROMOTED, promotions),
    /has no translated/,
    "a page may not own a localized URL while a field it renders is uncovered",
  );
});

// ---------------------------------------------------------------------------
// 6 · Draft evidence is content work, not an SEO claim.
// ---------------------------------------------------------------------------
test("REQ 3 · draft evidence promotes nothing and stays visible as a draft", () => {
  const draft = recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, { status: "draft" });
  const decision = evidenceDecisionFor(draft, [draft]);
  assert.equal(decision.qualified, false);
  assert.ok(decision.reasons.includes("status-not-approved:draft"), JSON.stringify(decision.reasons));
  assert.equal(evidenceFor(PROMOTED_PATH, "es", [draft]) !== undefined, true, "a draft must remain findable");
  assert.equal(approvedEvidenceFor(PROMOTED_PATH, "es", [draft]), undefined, "a draft must not be approved");
  assert.deepEqual([...draftEvidence([draft, APPROVED_DE])].map((e) => e.locale), ["es"]);
  assert.deepEqual([...approvedEvidence([draft, APPROVED_DE])].map((e) => e.locale), ["de"]);

  const policy = createAvailabilityPolicy(approvedPromotions([draft]));
  assert.deepEqual(ownershipSurfaces(policy, PROMOTED_PATH, "es"), ALL_SURFACES_OFF);
  assert.equal(pageCopyFor(PROMOTED_PATH, "es", PROMOTED, approvedPromotions([draft])).contentLocale, "en");

  // Flipping the one field that means "a reviewer signed it" moves all four
  // surfaces together, and nothing else about the record changes.
  const promoted = createAvailabilityPolicy(approvedPromotions([{ ...draft, status: "approved" }]));
  assert.deepEqual(ownershipSurfaces(promoted, PROMOTED_PATH, "es"), ALL_SURFACES_ON);
  assert.equal(approvedPromotions([draft]).length, 0);
});

test("REQ 3 · provenance is required, and an author may not approve their own copy", () => {
  const cases = [
    ["no translator", { translatedBy: " " }, "provenance-missing:translatedBy"],
    ["no reviewer", { reviewedBy: "" }, "provenance-missing:reviewedBy"],
    ["no source revision", { sourceRevision: "" }, "provenance-missing:sourceRevision"],
    ["no review date", { reviewedOn: "" }, "provenance-missing:reviewedOn"],
    ["a non-ISO review date", { reviewedOn: "8/9/2026" }, "provenance-review-date-not-iso"],
    ["an impossible review date", { reviewedOn: "2026-13-40" }, "provenance-review-date-not-iso"],
    ["the author as reviewer", { reviewedBy: HONEST_PROVENANCE.translatedBy }, "self-approved"],
    ["the author as reviewer, padded", { translatedBy: " vendor-a ", reviewedBy: "vendor-a " }, "self-approved"],
  ];
  for (const [label, patch, reason] of cases) {
    const broken = recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, (r) => ({
      ...r,
      provenance: { ...r.provenance, ...patch },
    }));
    const decision = evidenceDecisionFor(broken, [broken]);
    assert.equal(decision.qualified, false, label);
    assert.ok(decision.reasons.includes(reason), `${label}: ${JSON.stringify(decision.reasons)}`);
    assert.deepEqual([...approvedPromotions([broken])], [], label);
  }
  // An unrecognised status is not "approved", whatever it is called.
  for (const status of ["pending", "auto", "APPROVED", "", undefined]) {
    const odd = recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, { status });
    assert.equal(evidenceDecisionFor(odd, [odd]).qualified, false, `status ${String(status)}`);
    assert.ok(evidenceDecisionFor(odd, [odd]).reasons.includes(`status-not-approved:${status}`));
  }
});

test("REQ 2 · a duplicated (path, locale) pair is refused until the registry is unambiguous", () => {
  const twin = { ...APPROVED_ES, provenance: { ...HONEST_PROVENANCE, reviewedBy: "other-reviewer" } };
  const registry = [APPROVED_ES, twin];
  for (const record of registry) {
    const decision = evidenceDecisionFor(record, registry);
    assert.equal(decision.qualified, false, "two records cannot both be the truth");
    assert.ok(decision.reasons.includes("duplicate-evidence"), JSON.stringify(decision.reasons));
  }
  // Decided against the shipped (empty) registry each is individually promotable,
  // so the duplicate rule is the registry's, not a coincidence of one record.
  assert.equal(evidenceDecisionFor(APPROVED_ES, []).qualified, true);
  assert.deepEqual([...approvedPromotions(registry)], []);
  assert.equal(approvedPromotions([APPROVED_ES, APPROVED_DE]).length, 2, "two locales on one page are two records, not a clash");
});

test("REQ 2 · the page-shape model is the evidence layer's, and reports its sections", () => {
  assert.deepEqual([...DEEP_CONTENT_SECTIONS], ["answers", "knowledge", "products", "applications"]);
  assert.equal(isDeepContentDetail(PROMOTED_PATH), true);
  assert.equal(isDeepContentDetail("/products"), false);
  assert.equal(isPromotionLocale("es") && isPromotionLocale("de"), true);
  assert.equal(isPromotionLocale("en") || isPromotionLocale("zh"), false);
  assert.equal(isPromotionLocale("pt"), false, "a retired locale must not be promotable");
});

// ---------------------------------------------------------------------------
// 7 · REQ "renderer and SEO resolver use the same evidence source".
// ---------------------------------------------------------------------------
const AGREEMENT_MATRIX = [
  ["approved", [APPROVED_ES]],
  ["draft", [recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, { status: "draft" })]],
  ["incomplete", [recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, (r) => ({
    ...r,
    content: Object.fromEntries(Object.entries(r.content).filter(([f]) => f !== "intro")),
  }))]],
  ["self-approved", [recordFor(PROMOTED, PROMOTED_PATH, "es", FIELDS, (r) => ({
    ...r,
    provenance: { ...r.provenance, reviewedBy: r.provenance.translatedBy },
  }))]],
  ["none", []],
];

test("the resolver and the renderer answer from one evidence registry, every case", () => {
  for (const [label, registry] of AGREEMENT_MATRIX) {
    const promotions = approvedPromotions(registry);
    const policy = createAvailabilityPolicy(promotions);
    for (const [pagePath, record] of [[PROMOTED_PATH, PROMOTED], [SIBLING_PATH, products[1]]]) {
      for (const locale of locales) {
        const owned = policy.isLocalizedAt(pagePath, locale);
        const rendered = pageCopyFor(pagePath, locale, record, promotions);
        assert.equal(resolvedContentLocaleOf(pagePath, locale, promotions), rendered.contentLocale,
          `${label} ${locale} ${pagePath}: policy and renderer disagreed about this page's language`);
        assert.equal(owned, rendered.contentLocale === locale, `${label} ${locale} ${pagePath}`);
        if (pagePath === PROMOTED_PATH && locale === "es") {
          assert.equal(owned, label === "approved", `${label} must not decide ownership for the promoted page`);
        }
        if (locale === "es" && pagePath === PROMOTED_PATH && owned) {
          assert.equal(rendered.entity.name.es, APPROVED_ES.content.name, "the renderer must show the approved copy");
        }
        if (!owned && locale !== "en" && locale !== "zh") {
          assert.equal(rendered.entity, record, `${label} ${locale} ${pagePath} altered an unpromoted record`);
        }
      }
    }
  }
  // And the shipped surfaces are that same array, not a second copy of it.
  const policy = createAvailabilityPolicy();
  for (const p of [...DEEP_PATHS, ...CORE_PATHS]) {
    for (const locale of PROMOTION_LOCALES) {
      assert.equal(policy.isLocalizedAt(p, locale), isLocalizedAt(p, locale), p);
      assert.equal(pageCopyFor(p, locale, PROMOTED).contentLocale, contentLocaleOf(locale), p);
    }
  }
});

test("nothing beside the evidence layer may grant ownership (structure pins)", () => {
  const availability = read("src/content/translation-availability.ts");
  assert.match(availability, /export const TRANSLATED_PAGES: readonly TranslatedPage\[\] = approvedPromotions\(\);/,
    "the promotion set must be derived from the evidence registry");
  assert.doesNotMatch(availability, /export const TRANSLATED_PAGES[^=]*=\s*\[\]/,
    "the promotion set may not be restated as a literal beside the evidence");
  assert.doesNotMatch(availability, /export const DEEP_CONTENT_SECTIONS|export type TranslationEvidence|EvidenceStatus/,
    "the evidence model must not be duplicated in the availability layer");

  const policySource = read("src/content/availability.ts");
  assert.match(policySource, /export function createAvailabilityPolicy\(registry: readonly TranslatedPage\[\] = TRANSLATED_PAGES\)/,
    "the policy must default to the evidence-derived promotions");
  assert.match(policySource, /locales\.filter\(\(locale\) => resolvedContentLocaleOf\(path, locale, registry\) === locale\)/,
    "the policy must ask the render resolution, not a class of paths");
  // Named in prose is fine; imported is not. The policy may describe where
  // promotions come from, but it must not read the registry itself — that is
  // how a second, ungated door to ownership would reopen.
  assert.doesNotMatch(policySource, /import\s*\{[^}]*\bTRANSLATION_EVIDENCE\b[^}]*\}/s,
    "only the promotion derivation may read the evidence registry");
  assert.doesNotMatch(policySource, /import\s*\{[^}]*\bapprovedEvidence\b[^}]*\}/s,
    "the policy may not decide approval for itself");

  for (const file of ["src/app/sitemap.ts", "src/lib/seo.tsx", "src/components/layout/site-header.tsx", "src/proxy.ts"]) {
    assert.doesNotMatch(read(file), /translation-evidence|translation-availability/, `${file} must answer through the policy`);
  }
  for (const file of [
    "src/components/product/product-view.tsx",
    "src/components/application/application-view.tsx",
    "src/components/answers/answer-article.tsx",
    "src/app/[lang]/products/[slug]/page.tsx",
    "src/app/[lang]/applications/[slug]/page.tsx",
    "src/app/[lang]/answers/[slug]/page.tsx",
    "src/app/[lang]/knowledge/[slug]/page.tsx",
  ]) {
    assert.match(read(file), /pageCopyFor\(/, `${file} must resolve its copy through the promotion set`);
  }
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

test("build: zero promotions means the served bytes carry no ES/DE ownership claim", buildOptions, () => {
  // Ground truth, not a re-derivation: these are the bytes a crawler receives.
  const body = readFileSync(path.join(prerenderRoot, "sitemap.xml.body"), "utf8");
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const alternates = [...body.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(locs.length > 50, `expected the full declared owner set, saw ${locs.length} <loc> entries`);
  for (const locale of PROMOTION_LOCALES) {
    assert.equal(
      locs.filter((url) => new RegExp(`^${siteUrl}/${locale}(/|$)`).test(url)).length,
      0,
      `the sitemap declares a /${locale} owner with no approved evidence`,
    );
  }
  const advertised = [...new Set(alternates)];
  assert.deepEqual(advertised.sort(), ["en", "x-default", "zh-CN"], "the sitemap advertises a locale with no approved evidence");

  for (const locale of PROMOTION_LOCALES) {
    const html = htmlFor(`/${locale}${PROMOTED_PATH}`);
    const canonical = (html.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1];
    assert.equal(canonical, `${siteUrl}${PROMOTED_PATH}`, `${locale} copy stopped consolidating`);
    assert.equal((html.match(/rel="alternate"/g) ?? []).length, 0, `${locale} copy claims alternates`);
    assert.ok(!html.includes(`"inLanguage":"${htmlLang[locale]}"`), `${locale} copy claims its own language`);
    // og:locale follows the canonical owner, so an unapproved ES/DE copy must
    // still declare itself English. Captured, not just searched for: a missing
    // tag is a failure, not a pass.
    const ogLocale = (html.match(/property="og:locale" content="([^"]*)"/) ?? [])[1];
    assert.equal(ogLocale, "en_US", `${locale} copy declares og:locale "${ogLocale}"`);
  }
  const english = htmlFor(PROMOTED_PATH);
  assert.equal((english.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1], `${siteUrl}${PROMOTED_PATH}`);
  assert.equal(isSitemapEligible(PROMOTED_PATH, "es"), false);
  assert.equal(approvedPromotions().length, 0);
});
