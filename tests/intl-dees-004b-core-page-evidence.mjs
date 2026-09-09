import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * INTL-DEES-004B — core/section pages can become localized owners through
 * evidence, and still cannot become owners through anything else.
 *
 * INTL-DEES-002B made availability path-aware and INTL-DEES-003A made it
 * evidence-based, but both fixed the *kind* of page that could be described to
 * one shape: an entity detail route. The gate asked `isDeepContentDetail(path)`,
 * and the net behind it — `pageCopyFor` — worked because an entity carries its
 * own field list, so a promotion that omitted a rendered field failed the build.
 * A core or section page has no entity: its chrome and CTAs come from the
 * per-locale UI dictionary (which ES/DE already largely carry) and its body prose
 * from inline literals in its own components (which ES/DE do not). For that kind
 * of page there was no enumerable surface, so there could be no honest
 * promotion: a boolean "this path is translated" would advertise an ES canonical
 * over copy that is still English — the state GSC-INDEX-002 recorded 75 times.
 *
 * This task adds the missing property, not a permission: `./page-surfaces`
 * declares a page's complete copy surface; a record for that path must cover it
 * exactly (`surface-slot-undeclared` / `surface-slot-extra`), must carry a real
 * translation (`copy-not-translated`), and the page must agree with the
 * declaration (`pageCopyFor` throws on drift, on every locale). The availability
 * policy needed no new branch — it has always been path-agnostic — so no locale
 * list, exemption or prefix rule exists to be abused.
 *
 * Held true here by test rather than by argument:
 * 1. entity detail rules are unchanged, including a record 003A would approve;
 * 2. both shipped registries are empty, so every answer is 003B's: zero ES/DE
 *    promotions across all 55 owner paths, `{en, x-default, zh-CN}` everywhere;
 * 3. a URL prefix never creates ownership, and neither does a declared surface
 *    without an approved record;
 * 4. each of the four nets fires, shown with synthetic fixtures inside this file
 *    (the assignment excludes a mutation harness, so a guard is demonstrated by
 *    accepting the legitimate case and refusing the broken one);
 * 5. none of the new decision strings reaches a browser chunk, and the built SEO
 *    surfaces still consolidate ES/DE onto the English owner.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const {
  approvedPromotions,
  evidenceDecisionFor,
  isGenuineTranslation,
  promotableClassFor,
  TRANSLATION_EVIDENCE,
} = await importSource("src/content/translation-evidence.ts");
const { SECTION_SURFACES, isSectionEvidencePath, sectionSurfaceFor } =
  await importSource("src/content/page-surfaces.ts");
const {
  pageCopyFor,
  rejectedTranslations,
  resolvedContentLocaleOf,
  TRANSLATED_PAGES,
  translatedPageFor,
} = await importSource("src/content/translation-availability.ts");
const {
  canonicalLocaleFor,
  contentHtmlLangOf,
  createAvailabilityPolicy,
  hreflangForPath,
  isEnglishFallbackCopy,
  isSitemapEligible,
  localizedLocalesFor,
} = await importSource("src/content/availability.ts");
const { SWITCHER_PATHS } = await importSource("src/content/switcher-availability.ts");
const { htmlLang, locales } = await importSource("src/content/company.ts");

/** A core path with no entity record behind it, the kind 004B must serve. */
const CORE_PATH = "/quality";
const CORE_SLOTS = ["heading", "lede", "cta"];

const provenance = (overrides = {}) => ({
  translatedBy: "SEO_CONTENT:intl-dees-001",
  reviewedBy: "TECHNICAL_SEO:independent-reviewer",
  sourceRevision: "f27bfcae83d0d7b6a758246ea8c72e65739c0015",
  reviewedOn: "2026-09-08",
  ...overrides,
});

const CORE_SOURCE = {
  heading: "Quality you can verify",
  lede: "Certified system, tested yarn.",
  cta: "Request a quote",
};
const CORE_CONTENT = {
  heading: "Calidad verificable",
  lede: "Sistema certificado, hilo ensayado.",
  cta: "Solicitar cotización",
};

/** One complete, honest section record — what a real promotion must look like. */
const sectionRecord = (overrides = {}) => ({
  path: CORE_PATH,
  locale: "es",
  status: "approved",
  requiredFields: [...CORE_SLOTS],
  source: { ...CORE_SOURCE },
  content: { ...CORE_CONTENT },
  provenance: provenance(),
  ...overrides,
});

/** The shipped registry plus one declared surface, for evaluating a migration. */
const withSurface = (target, slots = CORE_SLOTS) => ({ ...SECTION_SURFACES, [target]: slots });

/** A bundle shaped exactly like an entity's body fields: one slot per `{en, zh}`. */
const coreBundle = () => ({
  heading: { en: CORE_SOURCE.heading, zh: "可验证的质量" },
  lede: { en: CORE_SOURCE.lede, zh: "体系认证，纱线经检测。" },
  cta: { en: CORE_SOURCE.cta, zh: "申请报价" },
});

/** An entity record INTL-DEES-003A would approve unchanged. */
const entityRecord = (overrides = {}) => ({
  path: "/products/water-soluble-pva-yarn",
  locale: "es",
  status: "approved",
  requiredFields: ["name", "summary"],
  source: { name: "Water-soluble PVA yarn", summary: "Dissolves at 20 degrees in cold water." },
  content: { name: "Hilo de PVA soluble en agua", summary: "Se disuelve a 20 grados en agua fría." },
  provenance: provenance(),
  ...overrides,
});

const reasonsOf = (evidence, surfaces = SECTION_SURFACES) =>
  evidenceDecisionFor(evidence, [evidence], surfaces).reasons;

const promotionFor = (record, surfaces) => approvedPromotions([record], surfaces);

// 004B shipped against an empty registry because no ES or DE copy existed yet.
// INTL-DEES-001 has since written it, and every record is a draft awaiting the
// owner's review. What this file's rules depend on is not that nobody has written
// anything down: it is that nothing is approved, and that no core or section route
// has declared a copy surface — the two things that would make a section promotion
// possible. Both still hold, and are now asserted as themselves rather than as a
// side effect of an empty array.
assert.deepEqual(approvedPromotions(TRANSLATION_EVIDENCE), [], "no shipped record may grant a promotion");
assert.deepEqual(Object.keys(SECTION_SURFACES), [], "004B must ship zero declared surfaces");
assert.deepEqual([...TRANSLATED_PAGES], [], "004B must ship zero promotions");
assert.equal(
  TRANSLATION_EVIDENCE.every((record) => record.status === "draft"),
  true,
  "every record that ships today must be a draft",
);

// ---------------------------------------------------------------------------
// 1 · The two page classes, kept apart.
// ---------------------------------------------------------------------------
test("REQ 3 · entity detail paths keep their class and their rules", () => {
  for (const p of ["/products/water-soluble-pva-yarn", "/answers/x", "/knowledge/x", "/applications/x"]) {
    assert.equal(promotableClassFor(p), "entity", `${p} must stay entity-class`);
  }
  // Core routes stay unpromotable while nobody declares their surface.
  for (const p of ["/", CORE_PATH, "/manufacturing", "/request-quote", "/products", "/answers"]) {
    assert.equal(promotableClassFor(p), null, `${p} must need a declared surface`);
    assert.equal(isSectionEvidencePath(p), false, `${p} has no surface today`);
  }
});

test("REQ 3 · registering a surface is what makes a core path promotable", () => {
  const surfaces = withSurface(CORE_PATH);
  assert.equal(promotableClassFor(CORE_PATH, surfaces), "section");
  assert.deepEqual([...sectionSurfaceFor(CORE_PATH, surfaces)], CORE_SLOTS);
  // A record keys on the prefix-free owner. The localized URL is derived by
  // localePath(), so it can never be the thing that grants itself ownership.
  assert.equal(promotableClassFor("/es/quality", surfaces), null);
  assert.equal(promotableClassFor("/zh/quality", surfaces), null);
  assert.ok(reasonsOf(sectionRecord({ path: "/es/quality" }), surfaces).includes("path-not-entity-detail"),
    "a prefixed URL must not be promotable even with its owner registered");
});

test("REQ 3 · a path claiming both classes is refused by both", () => {
  const surfaces = withSurface("/products/water-soluble-pva-yarn", ["name", "summary"]);
  assert.equal(promotableClassFor("/products/water-soluble-pva-yarn", surfaces), null,
    "double registration must not pick a rule set");
  assert.ok(reasonsOf(entityRecord(), surfaces).includes("path-not-entity-detail"),
    "a doubly-registered entity path must lose its promotion, not keep it");
  assert.equal(promotionFor(entityRecord(), surfaces).length, 0);
});

test("REQ 1 · an entity record still qualifies exactly as INTL-DEES-003A decided", () => {
  assert.deepEqual([...reasonsOf(entityRecord())], [],
    `entity approval changed: ${JSON.stringify(reasonsOf(entityRecord()))}`);
  assert.equal(
    isGenuineTranslation({ path: entityRecord().path, locale: "es",
      source: entityRecord().source, content: entityRecord().content }),
    true,
  );
  // And it promotes through the policy exactly as before.
  const policy = createAvailabilityPolicy(promotionFor(entityRecord()));
  assert.deepEqual([...policy.localizedLocalesFor(entityRecord().path)], ["en", "zh", "es"]);
  assert.deepEqual([...policy.localizedLocalesFor(CORE_PATH)], ["en", "zh"]);
});

// ---------------------------------------------------------------------------
// 2 · A section record must cover its declared surface, exactly.
// ---------------------------------------------------------------------------
test("REQ 2 · a complete section record promotes only its own path", () => {
  const surfaces = withSurface(CORE_PATH);
  const record = sectionRecord();
  assert.deepEqual([...reasonsOf(record, surfaces)], [],
    `a complete record must qualify: ${JSON.stringify(reasonsOf(record, surfaces))}`);

  const promotions = promotionFor(record, surfaces);
  assert.equal(promotions.length, 1);
  // Ownership is decided by exactly one predicate, so proving it here is proving
  // it for every SEO surface: `localizedLocalesFor`, `canonicalLocaleFor`,
  // `isSitemapEligible`, `contentHtmlLangOf` and `hreflangForPath` are all built
  // on `resolvedContentLocaleOf(path, locale) === locale` in
  // `src/content/availability.ts`. That predicate is asserted below to still be
  // the policy's only source, which is what makes this sufficient without
  // handing the shipped factory a synthetic registry — a shape INTL-DEES-002B's
  // own suite pins, and deliberately so.
  assert.equal(resolvedContentLocaleOf(CORE_PATH, "es", promotions, surfaces), "es");
  assert.equal(resolvedContentLocaleOf(CORE_PATH, "de", promotions, surfaces), "en");
  assert.equal(resolvedContentLocaleOf(CORE_PATH, "zh", promotions, surfaces), "zh");
  for (const p of SWITCHER_PATHS) {
    if (p === CORE_PATH) continue;
    assert.equal(resolvedContentLocaleOf(p, "es", promotions, surfaces), "en",
      `${p} gained ownership from a record for ${CORE_PATH}`);
  }
});

test("REQ 2 · the shipped policy is still derived from that one predicate", () => {
  // The bridge between the test above and the four SEO surfaces: if the policy
  // ever answers from anything other than `resolvedContentLocaleOf`, this fails.
  for (const p of SWITCHER_PATHS) {
    assert.deepEqual(
      [...localizedLocalesFor(p)],
      locales.filter((locale) => resolvedContentLocaleOf(p, locale) === locale),
      `${p}: localizedLocalesFor no longer equals the single resolution`,
    );
    for (const locale of locales) {
      const owned = resolvedContentLocaleOf(p, locale) === locale;
      assert.equal(canonicalLocaleFor(p, locale), owned ? locale : "en", `${locale} ${p} canonical`);
      assert.equal(isSitemapEligible(p, locale), owned, `${locale} ${p} sitemap`);
      assert.equal(isEnglishFallbackCopy(p, locale), !owned, `${locale} ${p} fallback flag`);
      assert.equal(contentHtmlLangOf(p, locale), htmlLang[owned ? locale : "en"], `${locale} ${p} language`);
    }
  }
  const policy = createAvailabilityPolicy();
  for (const p of SWITCHER_PATHS) {
    assert.deepEqual([...policy.localizedLocalesFor(p)], [...localizedLocalesFor(p)], `${p} policy drift`);
    assert.deepEqual(Object.keys(policy.hreflangForPath(p)).sort(), ["en", "x-default", "zh-CN"]);
  }
});

test("REQ 5 · an incomplete section record is refused, naming the slot", () => {
  const surfaces = withSurface(CORE_PATH);
  const thin = sectionRecord({
    requiredFields: ["heading", "lede"],
    source: { heading: CORE_SOURCE.heading, lede: CORE_SOURCE.lede },
    content: { heading: CORE_CONTENT.heading, lede: CORE_CONTENT.lede },
  });
  assert.ok(reasonsOf(thin, surfaces).includes("surface-slot-undeclared:cta"),
    "a record covering 2 of 3 slots must not buy ownership");
  assert.equal(
    isGenuineTranslation({ path: CORE_PATH, locale: "es", source: thin.source, content: thin.content }, surfaces),
    false,
  );
  assert.equal(promotionFor(thin, surfaces).length, 0);
  // The shipped policy never sees a refusal: this path is still a fallback copy.
  assert.equal(localizedLocalesFor(CORE_PATH).includes("es"), false);
});

test("REQ 2 · a record naming slots the surface does not carry is refused", () => {
  const surfaces = withSurface(CORE_PATH);
  const padded = sectionRecord({
    requiredFields: [...CORE_SLOTS, "hero"],
    source: { ...CORE_SOURCE, hero: "Water-soluble PVA yarn" },
    content: { ...CORE_CONTENT, hero: "Hilo de PVA soluble en agua" },
  });
  assert.ok(reasonsOf(padded, surfaces).includes("surface-slot-extra:hero"),
    "reviewing copy the page does not render must not count as coverage");
  assert.equal(promotionFor(padded, surfaces).length, 0);
});

test("REQ 5 · adding a slot invalidates the approvals that predate it", () => {
  const surfaces = withSurface(CORE_PATH, [...CORE_SLOTS, "footnote"]);
  assert.ok(reasonsOf(sectionRecord(), surfaces).includes("surface-slot-undeclared:footnote"),
    "a widened surface must not inherit a promotion granted against the old one");
});

test("REQ 2 · a malformed surface declaration is refused by both classes", () => {
  // Key presence is what claims the `section` class; the slot list is what makes
  // that claim checkable. A registry entry that is not an array must therefore
  // refuse the record outright. Reading it as "no surface here" instead would
  // hand a core page to the entity obligation — the looser rule, and the one
  // direction a registry mistake is supposed to fail away from.
  const malformed = [
    ["null", null],
    ["undefined", undefined],
    ["a bare string", "heading"],
    ["an object of slots", { heading: "x", lede: "y", cta: "z" }],
    ["a number", 3],
  ];
  for (const [label, value] of malformed) {
    const surfaces = { [CORE_PATH]: value };
    assert.equal(isSectionEvidencePath(CORE_PATH, surfaces), true, `${label} is still a registered path`);
    assert.equal(sectionSurfaceFor(CORE_PATH, surfaces), null, `${label} must yield no slot list`);
    assert.equal(promotableClassFor(CORE_PATH, surfaces), null, `${label} must class as neither`);
    const reasons = reasonsOf(sectionRecord(), surfaces);
    assert.ok(reasons.includes("path-not-entity-detail"), `${label} must be refused, got ${JSON.stringify(reasons)}`);
    assert.equal(promotionFor(sectionRecord(), surfaces).length, 0, `${label} must grant no promotion`);
    // Naming a slot no surface declares is refused too, not accepted by default
    // once the declaration has become unreadable.
    const padded = sectionRecord({
      requiredFields: [...CORE_SLOTS, "hero"],
      source: { ...CORE_SOURCE, hero: "Water-soluble PVA yarn" },
      content: { ...CORE_CONTENT, hero: "Hilo de PVA soluble en agua" },
    });
    assert.equal(promotionFor(padded, surfaces).length, 0, `${label} must not accept an undeclared slot`);
    // And nothing downstream moves: the path stays a fallback copy.
    const promotions = promotionFor(sectionRecord(), surfaces);
    const bundle = coreBundle();
    assert.equal(resolvedContentLocaleOf(CORE_PATH, "es", promotions, surfaces), "en", `${label} moved ownership`);
    const rendered = pageCopyFor(CORE_PATH, "es", bundle, promotions, surfaces);
    assert.equal(rendered.entity, bundle, `${label} must leave the bundle untouched`);
    assert.equal(rendered.contentLocale, "en", `${label} must not advertise a content locale`);
  }
  // `undefined` used to reach `for (const slot of surface)` and throw at module
  // scope through `TRANSLATED_PAGES = approvedPromotions()`, which takes down
  // every importer of the availability layer rather than refusing one record.
  assert.doesNotThrow(() => evidenceDecisionFor(sectionRecord(), [sectionRecord()], { [CORE_PATH]: undefined }));
  assert.doesNotThrow(() => approvedPromotions([sectionRecord()], { [CORE_PATH]: undefined }));
  // A malformed entry against an entity detail path is refused as well, rather
  // than quietly left to whichever rule the mistake happened not to contradict.
  const detail = "/products/water-soluble-pva-yarn";
  assert.equal(promotableClassFor(detail, { [detail]: null }), null,
    "a malformed entry may not fall through to the entity rule");
  assert.equal(promotionFor(entityRecord(), { [detail]: null }).length, 0,
    "and the damage there is a granted promotion, not just a label: the entity record must promote nothing");
  assert.equal(resolvedContentLocaleOf(detail, "es", promotionFor(entityRecord(), { [detail]: null }), { [detail]: null }), "en",
    "the entity path must keep its English owner under a malformed entry");
  assert.equal(promotableClassFor(detail, { [detail]: ["name", "summary"] }), null,
    "a path claiming both classes is still refused by both");
  assert.equal(promotableClassFor(detail), "entity", "and an unregistered entity path keeps 003A's treatment");
  // None of the above is a shipped answer: the registry still ships empty.
  assert.deepEqual(Object.keys(SECTION_SURFACES), []);
  assert.equal(resolvedContentLocaleOf(CORE_PATH, "es"), "en");
  assert.equal(approvedPromotions().length, 0);
});

// ---------------------------------------------------------------------------
// 3 · The render net: the page must agree with the declaration.
// ---------------------------------------------------------------------------
test("REQ 4 · pageCopyFor refuses a bundle that drifts from its surface", () => {
  const surfaces = withSurface(CORE_PATH);
  const bundle = coreBundle();
  // Unpromoted (every locale today): identity, and the key the model always gave.
  const plain = pageCopyFor(CORE_PATH, "es", bundle, [], surfaces);
  assert.equal(plain.entity, bundle, "an unpromoted bundle must be the same object");
  assert.equal(plain.contentLocale, "en");
  // A bundle missing a declared slot.
  const short = { heading: bundle.heading, lede: bundle.lede };
  assert.throws(() => pageCopyFor(CORE_PATH, "es", short, [], surfaces), /does not match what it renders/);
  assert.throws(() => pageCopyFor(CORE_PATH, "es", short, [], surfaces), /missing \[cta\]/);
  // A bundle carrying text the surface never declared.
  assert.throws(
    () => pageCopyFor(CORE_PATH, "es", { ...bundle, unlisted: { en: "x y z", zh: "甲乙丙" } }, [], surfaces),
    /not-in-surface \[unlisted\]/,
  );
  // Checked on every locale, not only the promoted one: drift is a declaration
  // error, and waiting for a translation to notice it is how a partial
  // localization gets approved.
  assert.throws(() => pageCopyFor(CORE_PATH, "en", short, [], surfaces), /does not match what it renders/);
  // An exact bundle passes, and a path with no surface keeps entity behaviour:
  // no surface check at all.
  assert.equal(pageCopyFor(CORE_PATH, "en", bundle, [], surfaces).contentLocale, "en");
  const passthrough = { slug: "water-soluble-pva-yarn", name: { en: "A b c", zh: "甲乙丙" } };
  assert.equal(pageCopyFor("/quality", "en", passthrough).entity, passthrough);
});

test("REQ 4 · pageCopyFor refuses a declared slot the renderer cannot widen", () => {
  const surfaces = withSurface(CORE_PATH);
  const bundle = coreBundle();
  const promotions = promotionFor(sectionRecord(), surfaces);
  assert.equal(promotions.length, 1, "the record itself is complete and honestly provenanced");
  // Each shape below passes the *name* test: the key is declared, the bundle
  // carries it, nothing is missing and nothing is extra. Only the value shape
  // tells the renderer it can write reviewed copy into the slot, and that is the
  // case a name-only check cannot see — without it the page keeps its English
  // text while the canonical, hreflang, sitemap and `inLanguage` all move to es.
  const unrenderable = [
    ["a plain string", { ...bundle, cta: CORE_SOURCE.cta }],
    ["a list of locale pairs", { ...bundle, cta: [{ en: "Request a quote", zh: "申请报价" }] }],
    ["a nested bundle", { ...bundle, cta: { title: { en: "a b", zh: "甲乙" }, body: { en: "c d", zh: "丙丁" } } }],
    ["a pre-resolved locale", { ...bundle, cta: { en: "x y", zh: "甲乙", es: "z" } }],
  ];
  for (const [label, shaped] of unrenderable) {
    assert.throws(
      () => pageCopyFor(CORE_PATH, "es", shaped, promotions, surfaces),
      /not-widenable \[cta\]/,
      `${label} must fail at prerender instead of rendering English under a promoted canonical`,
    );
    assert.throws(
      () => pageCopyFor(CORE_PATH, "en", shaped, promotions, surfaces),
      /does not match what it renders/,
      `${label} must fail on every locale, not only the promoted one`,
    );
    assert.throws(
      () => pageCopyFor(CORE_PATH, "zh", shaped, promotions, surfaces),
      /does not match what it renders/,
      `${label} must fail on the modelled locale too`,
    );
  }
  // The legitimate shapes still pass: this is a shape test, not a leaf-type test.
  const widened = pageCopyFor(CORE_PATH, "es", bundle, promotions, surfaces);
  assert.equal(widened.contentLocale, "es");
  assert.equal(widened.entity.cta.es, CORE_CONTENT.cta, "the reviewed copy must reach the render");
  const listCopy = sectionRecord({ content: { ...CORE_CONTENT, cta: ["Solicitar cotización", "Respuesta en 24 h"] } });
  const listPromotions = promotionFor(listCopy, surfaces);
  assert.equal(listPromotions.length, 1, "a list-valued field is a legal TranslatedValue");
  assert.deepEqual(
    pageCopyFor(CORE_PATH, "es", bundle, listPromotions, surfaces).entity.cta.es,
    ["Solicitar cotización", "Respuesta en 24 h"],
    "reviewed copy may itself be a list, so the guard must not reject it",
  );
  // An entity bundle is untouched by the new clause: its non-copy fields are
  // deliberately not slots, and INTL-DEES-003A's behaviour must not move.
  const entityBundle = { slug: "water-soluble-pva-yarn", name: { en: "A b c", zh: "甲乙丙" } };
  assert.equal(pageCopyFor("/products/water-soluble-pva-yarn", "en", entityBundle).entity, entityBundle);
});

test("REQ 4 · a promoted bundle renders the reviewed copy under the reviewed key", () => {
  const surfaces = withSurface(CORE_PATH);
  const promotions = promotionFor(sectionRecord(), surfaces);
  const { entity, contentLocale } = pageCopyFor(CORE_PATH, "es", coreBundle(), promotions, surfaces);
  assert.equal(contentLocale, "es");
  assert.equal(entity.heading[contentLocale], CORE_CONTENT.heading);
  assert.equal(entity.cta[contentLocale], CORE_CONTENT.cta);
  // The English owner still reads its own source for the same bundle.
  assert.equal(entity.heading.en, CORE_SOURCE.heading);
  // A locale with no approved record is untouched, even for a promoted path.
  assert.equal(pageCopyFor(CORE_PATH, "de", coreBundle(), promotions, surfaces).contentLocale, "en");
});

// ---------------------------------------------------------------------------
// 4 · Everything else about the gate is class-blind.
// ---------------------------------------------------------------------------
test("REQ 5 · provenance and status rules apply to a section record unchanged", () => {
  const surfaces = withSurface(CORE_PATH);
  const cases = [
    ["draft", sectionRecord({ status: "draft" }), "status-not-approved:draft"],
    ["self-approved", sectionRecord({ provenance: provenance({ reviewedBy: "SEO_CONTENT:intl-dees-001" }) }), "self-approved"],
    ["blank reviewer", sectionRecord({ provenance: provenance({ reviewedBy: "  " }) }), "provenance-missing:reviewedBy"],
    ["non-ISO date", sectionRecord({ provenance: provenance({ reviewedOn: "08/09/2026" }) }), "provenance-review-date-not-iso"],
    ["english pasted back", sectionRecord({ content: { ...CORE_CONTENT, lede: CORE_SOURCE.lede } }), "copy-not-translated"],
    ["modelled locale", sectionRecord({ locale: "zh" }), "locale-not-promotable"],
    ["nothing declared", sectionRecord({ requiredFields: [] }), "no-required-fields"],
    ["undeclared content", sectionRecord({ requiredFields: ["heading", "lede"], content: { ...CORE_CONTENT } }), "undeclared-content-field:cta"],
  ];
  for (const [label, record, code] of cases) {
    const reasons = reasonsOf(record, surfaces);
    assert.ok(reasons.includes(code), `${label} must be refused with ${code}, got ${JSON.stringify(reasons)}`);
    assert.equal(promotionFor(record, surfaces).length, 0, `${label} must grant nothing`);
  }
});

test("REQ 2 · the shipped policy answers exactly as INTL-DEES-003B left it", () => {
  assert.equal(rejectedTranslations().length, 0);
  assert.ok(SWITCHER_PATHS.length >= 50, `owner inventory looks too small: ${SWITCHER_PATHS.length}`);
  for (const pagePath of SWITCHER_PATHS) {
    assert.equal(translatedPageFor(pagePath, "es"), undefined, `${pagePath} has a promotion`);
    assert.equal(resolvedContentLocaleOf(pagePath, "es"), "en", `${pagePath} promoted without evidence`);
    assert.equal(resolvedContentLocaleOf(pagePath, "de"), "en", `${pagePath} promoted without evidence`);
    assert.equal(canonicalLocaleFor(pagePath, "es"), "en");
    assert.equal(contentHtmlLangOf(pagePath, "es"), htmlLang.en);
    assert.equal(isSitemapEligible(pagePath, "es"), false);
    assert.equal(isEnglishFallbackCopy(pagePath, "es"), true);
    assert.deepEqual(Object.keys(hreflangForPath(pagePath)).sort(), ["en", "x-default", "zh-CN"],
      `${pagePath} language universe moved`);
    for (const owned of localizedLocalesFor(pagePath)) {
      assert.ok(owned === "en" || owned === "zh", `${pagePath} claims ${owned} with no evidence`);
    }
  }
});

test("REQ 4 · the shipped code keeps the class decision in one place", () => {
  const gate = read("src/content/translation-evidence.ts");
  assert.match(gate, /if \(entity === section\) return null;/,
    "promotableClassFor must refuse a path claiming both classes");
  assert.match(gate, /const pageClass = promotableClassFor\(path, surfaces\);/,
    "the gate must decide the class once, through one function");
  assert.doesNotMatch(gate, /if \(!isDeepContentDetail\(path\)\)/,
    "no rule may re-decide promotability from the entity door alone again");
  // The registry stays a leaf: an import statement here would re-form the cycle
  // the gate exists to avoid. (Prose in its doc comment is not an import.)
  const surfaces = read("src/content/page-surfaces.ts");
  assert.doesNotMatch(surfaces, /^[\t ]*import[\t ]/m, "the surface registry must import nothing");
  assert.match(surfaces, /SECTION_SURFACES: Readonly<Record<string, SectionSurface>> = \{\}/,
    "the registry must ship empty so no shipped answer moves");
});

// ---------------------------------------------------------------------------
// Optional build-output checks (run in the validation build).
// ---------------------------------------------------------------------------
const requireBuild = process.env.REQUIRE_BUILD_OUTPUT === "1";
const appRoot = path.join(repoRoot, ".next", "server", "app");
const chunksRoot = path.join(repoRoot, ".next", "static", "chunks");
const buildPresent = existsSync(appRoot) && existsSync(chunksRoot);
if (requireBuild && !buildPresent) {
  test("REQUIRE_BUILD_OUTPUT is set but no production build exists", () => {
    assert.fail(`${appRoot} or ${chunksRoot} is missing — run \`npm run build\` first`);
  });
}
const buildOptions = { skip: buildPresent ? false : "no .next production build to inspect" };

function walkFiles(dir, extensions, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (entry === "api" || entry.startsWith("_")) continue;
      walkFiles(abs, extensions, out);
    } else if (extensions.has(path.extname(entry)) && !entry.startsWith("_")) {
      out.push(abs);
    }
  }
  return out;
}

/**
 * Strings that must never reach a browser chunk: the INTL-DEES-003A reason codes
 * and the three 004B adds. Held in one list so a future rule added to the gate
 * has to be named here to ship, which is the check INTL-DEES-003B left behind.
 */
const POLICY_STRINGS = [
  "status-not-approved", "provenance-review-date-not-iso", "missing-translated-field",
  "undeclared-content-field", "duplicate-evidence", "copy-not-translated",
  "locale-not-promotable", "path-not-entity-detail", "has no translated",
  "surface-slot-undeclared", "surface-slot-extra", "does not match what it renders",
  "not-widenable",
];

test("build: no client chunk carries any ownership string, new ones included", buildOptions, () => {
  const chunks = walkFiles(chunksRoot, new Set([".js"]));
  assert.ok(chunks.length > 5, `expected the client chunk set, found ${chunks.length} files`);
  const offenders = [];
  for (const file of chunks) {
    const text = readFileSync(file, "utf8");
    const hits = POLICY_STRINGS.filter((marker) => text.includes(marker));
    if (hits.length) offenders.push(`${path.basename(file)}: ${hits.join(", ")}`);
  }
  assert.deepEqual(offenders, [], "the ownership policy is reachable from the browser again");
});

test("build: promoting nothing is still what production renders", buildOptions, () => {
  const documents = walkFiles(appRoot, new Set([".html"]));
  assert.ok(documents.length > 200, `expected the full prerendered set, saw ${documents.length}`);
  let checked = 0;
  for (const file of documents) {
    const relative = path.relative(appRoot, file).split(path.sep).join("/");
    const locale = relative.split("/")[0];
    if (locale !== "es" && locale !== "de") continue;
    checked++;
    const html = readFileSync(file, "utf8");
    const canonical = (html.match(/rel="canonical"[^>]*href="([^"]*)"/) ?? [])[1] ?? "";
    assert.equal(canonical.includes(`/${locale}/`), false, `${relative} self-canonicalises a fallback copy`);
    assert.equal((html.match(/<link[^>]*rel="alternate"[^>]*hreflang/g) ?? []).length, 0,
      `${relative} declares an hreflang graph it has no evidence for`);
    assert.equal(/"inLanguage":"(es|de)"/.test(html), false, `${relative} claims a localized inLanguage`);
  }
  assert.ok(checked > 100, `${checked} ES/DE documents — the probe stopped matching`);
});

test("build: the sitemap and robots bodies are still the INTL-DEES-003B ones", buildOptions, () => {
  const sitemap = readFileSync(path.join(appRoot, "sitemap.xml.body"), "utf8");
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 55, "sitemap entry count moved");
  assert.equal((sitemap.match(/<loc>[^<]*\/(es|de)\//g) ?? []).length, 0, "an ES/DE URL entered the sitemap");
  const tags = new Set([...sitemap.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...tags].sort(), ["en", "x-default", "zh-CN"], "the advertised language universe moved");
  assert.equal(readFileSync(path.join(appRoot, "robots.txt.body"), "utf8").includes("Sitemap:"), true,
    "robots.txt lost its sitemap declaration");
});

/**
 * The promotion-time completeness check: prose a locale document still shares
 * verbatim with its English owner. Nothing is declared today, so this is what a
 * future review runs against — and it is fixture-proven below so it cannot pass
 * by being blind.
 */
function textBlocks(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .split(/<[^>]+>/)
    .map((block) => block.replace(/&#x27;|&amp;|&nbsp;/g, " ").replace(/\s+/g, " ").trim())
    // Case-sensitive on purpose: the excluded class is uppercase-and-numeric
    // tokens (ISO 9001, OEKO-TEX, certificate numbers, dates), which are
    // legitimately identical in every language. Adding `i` here would match
    // a–z as well and silently wave through ordinary English prose.
    .filter((block) => block.length > 12 && !/^[\d.,\s°A-Z()/·—–%-]+$/.test(block));
}

function englishRetention(html, englishHtml) {
  const owner = new Set(textBlocks(englishHtml));
  return textBlocks(html).filter((block) => owner.has(block));
}

test("REQ 4 · the promotion-time completeness check is live, not decorative", buildOptions, () => {
  const ownerDoc = (pagePath) => path.join(appRoot, pagePath === "/" ? "index.html" : `${pagePath.slice(1)}.html`);
  for (const pagePath of Object.keys(SECTION_SURFACES)) {
    const localized = path.join(appRoot, "es", `${pagePath === "/" ? "" : pagePath.slice(1)}.html`);
    if (!existsSync(localized) || !existsSync(ownerDoc(pagePath))) continue;
    const retained = englishRetention(readFileSync(localized, "utf8"), readFileSync(ownerDoc(pagePath), "utf8"));
    assert.deepEqual(retained, [],
      `${pagePath} is promoted while English prose remains: ${JSON.stringify(retained.slice(0, 3))}`);
  }
  // Fixtures: the check must pass a real translation and refuse a stale one.
  const englishOwner = "<html><body><p>Quality verified and certified by independent bodies worldwide</p></body></html>";
  const translated = "<html><body><p>Calidad verificada y certificada por organismos independientes</p></body></html>";
  assert.deepEqual(englishRetention(translated, englishOwner), [], "fixture: a real translation must pass");
  assert.deepEqual(englishRetention(englishOwner, englishOwner),
    ["Quality verified and certified by independent bodies worldwide"],
    "fixture: surviving English must be reported, not skipped");
  const withOneStale = "<html><body><p>Calidad verificada</p><p>Quality verified and certified by independent bodies worldwide</p></body></html>";
  assert.equal(englishRetention(withOneStale, englishOwner).length, 1,
    "fixture: one untranslated block must be caught while the rest is translated");
});
