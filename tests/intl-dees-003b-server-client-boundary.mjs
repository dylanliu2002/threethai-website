import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * INTL-DEES-003B — server/client boundary for translation availability.
 *
 * INTL-DEES-003A proved the evidence model is correct and, in the same
 * measurement, exposed its cost: `site-header.tsx` is `"use client"` and asked
 * the availability policy `localizedLocalesFor(currentPath)` directly, so the
 * whole evidence gate — `TRANSLATED_PAGES`, `approvedPromotions()`,
 * `evidenceDecisionFor()` and every reason literal it carries — was reachable
 * from the browser and shipped there (+1,684 B raw / +586 B gzip on a chunk
 * loaded by 220 of 222 documents) to decide a `hreflang` attribute.
 *
 * The fix is a serialization boundary: `src/content/switcher-availability.ts`
 * runs on the server, asks the policy once per path, and hands the client plain
 * data. This suite pins:
 *
 * 1. no ownership string reaches `.next/static/chunks`, and the bundle comes
 *    back down to its INTL-DEES-002B size;
 * 2. every value the client can read *is* the policy's answer, and every value
 *    it cannot read stays the model-guaranteed baseline — an unlisted path can
 *    never inherit somebody else's promotion;
 * 3. every prerendered switcher document resolves to an inventoried path, so (2)
 *    is not load-bearing on a fallback nobody measured;
 * 4. the switcher's built `hreflang` attributes equal the server answer, with
 *    navigation to all four languages intact.
 *
 * The encoding is pinned **structurally, not by a byte budget**. A review of the
 * first version measured what a budget does to legitimate work: a fixed 400-byte
 * ceiling went red somewhere around the seventh promoted page — with a message
 * blaming the encoding — while the *rejected* alternative (a complete
 * `path → locales` map, ~1.9 KB) was strictly worse than the state it was
 * blocking. Budgets also cannot tell a correct large payload from an accidental
 * full map. Structure can: an exception must add a locale the model does not
 * already guarantee, and it must belong to a path the evidence registry actually
 * promotes.
 *
 * Nothing is promoted, translated, re-designed or re-routed here.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const { SWITCHER_AVAILABILITY, SWITCHER_PATHS } = await importSource("src/content/switcher-availability.ts");
const { htmlLang, localePath, locales, siteUrl } = await importSource("src/content/company.ts");
const {
  canonicalLocaleFor,
  contentHtmlLangOf,
  createAvailabilityPolicy,
  hreflangForPath,
  isEnglishFallbackCopy,
  isSitemapEligible,
  localizedLocalesFor,
  TRANSLATED_CONTENT_LOCALES,
} = await importSource("src/content/availability.ts");
const { TRANSLATED_PAGES } = await importSource("src/content/translation-availability.ts");
const { products } = await importSource("src/content/products.ts");

const { baseline, exceptions } = SWITCHER_AVAILABILITY;

/** What the client is allowed to conclude about a path — data only. */
const answerFor = (pagePath) => exceptions[pagePath] ?? baseline;

/** Locale URL prefixes: every locale except the prefix-free English owner. */
const PREFIXED_LOCALES = locales.filter((locale) => localePath("/", locale) !== "/");

/** Paths the shipped evidence registry promotes. The cap on legitimate exceptions. */
const promotedPaths = () => new Set(TRANSLATED_PAGES.map((page) => page.path));

/** Strings that exist only inside the server-side ownership machinery. */
const POLICY_STRINGS = [
  "status-not-approved",
  "provenance-review-date-not-iso",
  "missing-translated-field",
  "undeclared-content-field",
  "duplicate-evidence",
  "copy-not-translated",
  "locale-not-promotable",
  "path-not-entity-detail",
  "has no translated",
];

/**
 * Measured on this host: total bytes of `.next/static/chunks`. Chunk sizes are
 * stable across builds of one tree (only their names move with the build id), so
 * these bounds pin "the bundle came back down" without freezing one artifact.
 */
const BASE_002B_TOTAL = 822_743; // d34cd95, before the evidence layer existed
const LEAKED_003A_TOTAL = 824_427; // e99937e, the build this task repairs
const TOLERANCE = 256;

function walkFiles(dir, extensions, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    if (statSync(absolute).isDirectory()) {
      if (entry === "api" || entry.startsWith("_")) continue;
      walkFiles(absolute, extensions, out);
    } else if (extensions.has(path.extname(entry)) && !entry.startsWith("_")) {
      out.push(absolute);
    }
  }
  return out;
}

const PRERENDER_ROOT = path.join(repoRoot, ".next", "server", "app");

/** The prefix-free English owner a prerendered document belongs to. */
function pageOf(file) {
  let relative = path.relative(PRERENDER_ROOT, file).split(path.sep).join("/").replace(/\.html$/, "");
  if (relative === "index") relative = "";
  relative = relative.replace(/\/index$/, "");
  const segments = relative.split("/").filter(Boolean);
  const owner = PREFIXED_LOCALES.includes(segments[0]) ? segments.slice(1) : segments;
  return owner.length ? `/${owner.join("/")}` : "/";
}

/**
 * The desktop switcher block of a built document.
 *
 * Two traps, both measured rather than assumed: Next renders the `hrefLang` prop
 * with its camel-case spelling intact in the SSR markup (an HTML parser
 * case-folds it, so it remains a valid `hreflang` attribute), so attribute
 * matching here is case-insensitive; and the mobile panel lives in a Radix
 * `Portal` that mounts only on open, so it is absent from prerendered HTML — the
 * block is bounded by its own `</details>`, not by a mobile testid.
 */
function desktopSwitcher(html) {
  const start = html.indexOf('data-testid="lang-switcher"');
  assert.notEqual(start, -1, "the built document has no desktop language switcher");
  const end = html.indexOf("</details>", start);
  assert.notEqual(end, -1, "the desktop switcher is never closed");
  return html.slice(start, end);
}

const switcherHreflangs = (html) =>
  [...desktopSwitcher(html).matchAll(/<a\b[^>]*?\bhreflang="([^"]+)"/gi)].map((m) => m[1]).sort();
const switcherLinkCount = (html) => (desktopSwitcher(html).match(/<a\b/g) ?? []).length;

/** The bridge's own derivation, replayed against any policy-shaped answer set. */
function encodeWith(answer) {
  const baselineKey = [...TRANSLATED_CONTENT_LOCALES].join(",");
  return {
    baseline: [...TRANSLATED_CONTENT_LOCALES],
    exceptions: Object.fromEntries(
      SWITCHER_PATHS.map((pagePath) => [pagePath, [...answer(pagePath)]])
        .filter(([, list]) => list.join(",") !== baselineKey),
    ),
  };
}

assert.ok(SWITCHER_PATHS.length >= 50, `the switcher inventory looks too small: ${SWITCHER_PATHS.length}`);
assert.deepEqual([...TRANSLATED_PAGES], [], "INTL-DEES-003B must ship zero promotions");

// ---------------------------------------------------------------------------
// 1 · The client receives the policy's answers, and nothing else.
// ---------------------------------------------------------------------------
test("REQ 2 · every answer the client can read is the availability policy's own", () => {
  for (const pagePath of SWITCHER_PATHS) {
    assert.deepEqual([...answerFor(pagePath)], [...localizedLocalesFor(pagePath)],
      `${pagePath} is not the policy's answer`);
  }
  // The baseline is exactly what the content model guarantees, so it is a true
  // answer for *any* path, listed here or not.
  assert.deepEqual([...baseline], [...TRANSLATED_CONTENT_LOCALES],
    "baseline must be the model-guaranteed locales, not a chosen subset");
  for (const pagePath of SWITCHER_PATHS) {
    const answer = localizedLocalesFor(pagePath);
    for (const locale of baseline) assert.ok(answer.includes(locale), `${locale} must own ${pagePath} by model`);
  }
  for (const list of [baseline, ...Object.values(exceptions)]) {
    assert.ok(Array.isArray(list), "each answer must be an array");
    for (const locale of list) assert.equal(typeof locale, "string", "each answer must hold locale strings");
  }
});

test("REQ 2 · baseline is model-derived, never a locale list written down", () => {
  const bridge = read("src/content/switcher-availability.ts");
  assert.match(bridge, /TRANSLATED_CONTENT_LOCALES/, "baseline must come from the content model's own export");
  assert.doesNotMatch(bridge, /baseline[^=]*=\s*\[\s*"[a-z]{2}"/, "baseline may not be a hardcoded locale list");
  assert.doesNotMatch(bridge, /\[\s*"en",\s*"zh"\s*\]/, "the bridge may not name en+zh literally");
  // And the locale model really is what makes those two unconditional.
  for (const pagePath of ["/", "/quality", "/products/water-soluble-pva-yarn"]) {
    for (const locale of TRANSLATED_CONTENT_LOCALES) {
      assert.equal(localizedLocalesFor(pagePath).includes(locale), true, `${locale} ${pagePath}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 2 · B1/B2 — the guard catches a path map, and never punishes translations.
// ---------------------------------------------------------------------------
test("B1 · the payload guard rejects a serialized path map but allows legitimate exceptions", () => {
  const keys = Object.keys(exceptions);
  const promoted = promotedPaths();

  // Structural rule 1: an exception must add something the model does not
  // already guarantee. A complete `path → locales` map violates this at once,
  // because most of its entries merely restate the baseline.
  for (const [pagePath, list] of Object.entries(exceptions)) {
    assert.ok(list.length > baseline.length,
      `${pagePath} is an exception that adds no locale — that is path-map serialization, not an exception`);
    for (const locale of baseline) assert.ok(list.includes(locale), `${pagePath} dropped a baseline locale`);
  }
  // Structural rule 2: only paths the evidence registry promotes may appear.
  for (const pagePath of keys) {
    assert.ok(promoted.has(pagePath), `${pagePath} is an exception with no approved promotion behind it`);
  }

  // The regression this replaced: a byte ceiling that legitimate translations
  // trip. Show that a serialized full map is *structurally* inert — every entry
  // merely restates the baseline, which is precisely what rule 1 refuses — and
  // that it is also larger than the retired 400-byte ceiling, so the ceiling
  // could not have told the two payloads apart in the useful direction.
  const fullMap = Object.fromEntries(SWITCHER_PATHS.map((p) => [p, [...baseline]]));
  assert.ok(Object.values(fullMap).every((list) => list.length === baseline.length),
    "fixture: a full path map adds no locale anywhere, so rule 1 rejects all of it");
  assert.ok(JSON.stringify(fullMap).length > 400,
    "fixture: the retired byte ceiling would have failed this payload for the wrong reason");

  // And the opposite: legitimate maximum adoption — every path promoted — is
  // larger than that same ceiling yet passes both structural rules.
  const allDeep = encodeWith(() => [...baseline, ...locales.filter((l) => !baseline.includes(l))]);
  assert.equal(Object.keys(allDeep.exceptions).length, SWITCHER_PATHS.length);
  assert.ok(JSON.stringify(allDeep).length > 400,
    "fixture: legitimate adoption at scale exceeds the retired ceiling");
  assert.ok(Object.values(allDeep.exceptions).every((list) => list.length > baseline.length),
    "legitimate promotion of every path must satisfy the guard");
});

test("B2 · a path the server did not resolve cannot receive anyone's promotion", () => {
  // The property the review asked for: an unknown URL must fall back to the
  // model-guaranteed baseline, never to a majority/modal answer that a future
  // ES-DE rollout could turn into a false claim on a page with no evidence.
  const promotionLocales = locales.filter((locale) => !baseline.includes(locale));
  assert.deepEqual([...promotionLocales], ["es", "de"], "the promotion pair is what must be unreachable");

  // Simulate the landscape that broke the previous encoding: most of the site
  // promoted, so a frequency-derived default would have become en+zh+es+de.
  const nearTotal = encodeWith((pagePath) =>
    pagePath === "/request-quote" ? [...baseline] : [...baseline, ...promotionLocales]);
  assert.deepEqual([...nearTotal.baseline], [...baseline],
    "baseline must not move when promotions become the majority of pages");
  assert.equal(Object.keys(nearTotal.exceptions).length, SWITCHER_PATHS.length - 1);
  assert.deepEqual([...(nearTotal.exceptions["/unknown-section"] ?? nearTotal.baseline)], [...baseline],
    "an unresolved path must not inherit es or de");

  // And the shipped client-side expression really is the fallback above.
  const source = read("src/components/layout/site-header.tsx");
  assert.match(source, /availableLocales\.exceptions\[currentPath\] \?\? availableLocales\.baseline/,
    "the switcher must fall back to the model baseline, not to an inventory-derived value");
  assert.doesNotMatch(source, /\.common/, "no modal/frequency default may return");
});

test("REQ 2 · an approved promotion reaches the prop with no client change", () => {
  // The boundary must stay honest when INTL-DEES-001 lands copy: a promotion is
  // visible through the same policy call the bridge uses, so the client would
  // never need a new rule, a new import, or a new literal.
  const promotion = {
    path: "/products/water-soluble-pva-yarn",
    locale: "es",
    source: { name: "Water-soluble PVA yarn" },
    content: { name: "Hilo de PVA soluble en agua" },
  };
  const promoted = createAvailabilityPolicy([promotion]);
  assert.deepEqual([...promoted.localizedLocalesFor(promotion.path)], ["en", "zh", "es"]);
  assert.deepEqual([...promoted.localizedLocalesFor("/quality")], ["en", "zh"],
    "a promotion must stay on its own path even through the bridge");

  const simulated = encodeWith((pagePath) => [...promoted.localizedLocalesFor(pagePath)]);
  assert.deepEqual(Object.keys(simulated.exceptions), [promotion.path]);
  assert.deepEqual([...simulated.exceptions[promotion.path]], ["en", "zh", "es"]);
  assert.deepEqual([...(simulated.exceptions["/quality"] ?? simulated.baseline)], ["en", "zh"]);
  // The shipped values are untouched by the simulation above.
  assert.deepEqual([...answerFor(promotion.path)], ["en", "zh"]);
});

// ---------------------------------------------------------------------------
// 3 · Coverage: the inventory must match the site that actually renders.
// ---------------------------------------------------------------------------
test("B3 · locale prefix handling is derived from the locale model", () => {
  // Derived, and checked against the model rather than a literal: a hardcoded
  // prefix set silently mis-reads the documents of any future locale.
  const derived = locales.filter((locale) => localePath("/", locale) !== "/");
  assert.equal(PREFIXED_LOCALES.length, locales.length - 1,
    "every locale in the model except the prefix-free owner must be a URL prefix");
  assert.ok(PREFIXED_LOCALES.every((locale) => derived.includes(locale)),
    "prefixes must be exactly `locales` minus the prefix-free owner");
  assert.equal(PREFIXED_LOCALES.includes("en"), false, "English is the prefix-free owner, never a prefix");
  // Anchored in what `localePath` really does, not in an assumption about it.
  assert.equal(localePath("/", "en"), "/", "English must stay the prefix-free owner");
  for (const locale of PREFIXED_LOCALES) {
    assert.equal(localePath("/quality", locale), `/${locale}/quality`, `${locale} must be prefixed`);
  }
  // Neither this suite nor the bridge may restate the prefix list as a literal.
  assert.doesNotMatch(read("tests/intl-dees-003b-server-client-boundary.mjs"), /\[\s*"zh",\s*"es",\s*"de"\s*\]/,
    "the test must derive prefixes from the locale model like the product does");
  assert.doesNotMatch(read("src/content/switcher-availability.ts"), /"zh"|"es"|"de"/,
    "the bridge names no locale at all");
});

test("B3 · every inventoried path is a real route and no route class is unaccounted", () => {
  assert.equal(new Set(SWITCHER_PATHS).size, SWITCHER_PATHS.length, "the inventory holds no duplicate path");
  const prefixed = new RegExp(`\\/(${PREFIXED_LOCALES.join("|")})(\\/|$)`);
  for (const pagePath of SWITCHER_PATHS) {
    assert.ok(pagePath.startsWith("/"), `${pagePath} must be an absolute prefix-free path`);
    assert.equal(prefixed.test(pagePath), false, `${pagePath} must not carry a locale prefix`);
  }
  // The inventory must cover every deep path the content model can produce.
  for (const product of products) {
    assert.ok(SWITCHER_PATHS.includes(`/products/${product.slug}`), `/products/${product.slug} is unlisted`);
  }
});

// ---------------------------------------------------------------------------
// 4 · Server-side SEO behaviour is untouched by the boundary.
// ---------------------------------------------------------------------------
test("REQ 4 · every policy answer is exactly as INTL-DEES-003A left it", () => {
  for (const pagePath of SWITCHER_PATHS) {
    for (const locale of locales) {
      const owned = answerFor(pagePath).includes(locale);
      assert.equal(isEnglishFallbackCopy(pagePath, locale), !owned, `${locale} ${pagePath} fallback flag moved`);
      assert.equal(isSitemapEligible(pagePath, locale), owned, `${locale} ${pagePath} sitemap answer moved`);
      assert.equal(canonicalLocaleFor(pagePath, locale), owned ? locale : "en", `${locale} ${pagePath} canonical moved`);
      assert.equal(contentHtmlLangOf(pagePath, locale), htmlLang[owned ? locale : "en"],
        `${locale} ${pagePath} content language moved`);
    }
    assert.deepEqual(Object.keys(hreflangForPath(pagePath)).sort(), ["en", "x-default", "zh-CN"], pagePath);
  }
  assert.deepEqual([...TRANSLATED_PAGES], [], "ES/DE promotions must stay at zero");
  assert.deepEqual(Object.keys(exceptions), [], "zero promotions means the payload lists no exceptions");
});

// ---------------------------------------------------------------------------
// Optional build-output checks (run in the validation build).
// ---------------------------------------------------------------------------
const requireBuild = process.env.REQUIRE_BUILD_OUTPUT === "1";
const chunksRoot = path.join(repoRoot, ".next", "static", "chunks");
const buildPresent = existsSync(PRERENDER_ROOT) && existsSync(chunksRoot);
if (requireBuild && !buildPresent) {
  test("REQUIRE_BUILD_OUTPUT is set but no production build exists", () => {
    assert.fail(`${PRERENDER_ROOT} or ${chunksRoot} is missing — run \`npm run build\` first`);
  });
}
const buildOptions = { skip: buildPresent ? false : "no .next production build to inspect" };

test("build: no client chunk carries any translation-ownership string", buildOptions, () => {
  const chunks = walkFiles(chunksRoot, new Set([".js"]));
  assert.ok(chunks.length > 5, `expected the client chunk set, found ${chunks.length} files`);
  const offenders = [];
  for (const file of chunks) {
    const hits = POLICY_STRINGS.filter((marker) => readFileSync(file, "utf8").includes(marker));
    if (hits.length) offenders.push(`${path.basename(file)}: ${hits.join(", ")}`);
  }
  assert.deepEqual(offenders, [], "the ownership policy is still reachable from the browser");
});

test("build: the client bundle returns to its INTL-DEES-002B size", buildOptions, () => {
  // What this assertion really owns is "the 1,684 B of SEO-gate code that
  // INTL-DEES-003A put in every browser is gone", and the load-bearing proof of
  // that is the POLICY_STRINGS scan immediately above: it names the code, this one
  // only counts bytes. So when later tasks added client-rendered content that is
  // not a gate leak, each addition is named here with its measured cost rather
  // than folded into a tolerance that would stop resembling one.
  //
  // A future gate leak is caught by the string scan, not by this ceiling.
  const CLIENT_LABELS_001 = 1_237; // localized labels in the header and inquiry form
  // Measured at the committed state: 833,313 B total against the 822,743 B baseline,
  // so 10,570 B above it. 1,237 B is the labels above; this 9,333 B is the notice
  // (component 7,990 B, its strings 434 B in the shared label module the header
  // already imports) plus the 909 B that bought the fix making switching work at
  // all — locale links became plain anchors, because the client router resolves
  // /en/<path> to some other locale, and the notice needed a JS-visible mark since
  // the preference cookie is httpOnly. Verified in Chrome: one click now lands on
  // the language clicked, from every locale, desktop and mobile.
  const LOCALE_NOTICE = 9_333; // notice + anchor switcher; owner-accepted 2026-09-09
  const CLIENT_CONTENT = CLIENT_LABELS_001 + LOCALE_NOTICE;
  const total = walkFiles(chunksRoot, new Set([".js"])).reduce((sum, file) => sum + statSync(file).size, 0);
  assert.ok(total <= LEAKED_003A_TOTAL - 1_000 + CLIENT_CONTENT,
    `the bundle did not shrink: ${total} B, within ${LEAKED_003A_TOTAL - total} B of the `
    + `${LEAKED_003A_TOTAL} B leaked build against a ${CLIENT_CONTENT} B itemized allowance`);
  assert.ok(total <= BASE_002B_TOTAL + TOLERANCE + CLIENT_CONTENT,
    `client bundle is ${total - BASE_002B_TOTAL} B above the ${BASE_002B_TOTAL} B INTL-DEES-002B `
    + `baseline (tolerance ${TOLERANCE} B + ${CLIENT_LABELS_001} B labels + ${LOCALE_NOTICE} B notice)`);
  assert.ok(total > BASE_002B_TOTAL - 20_000,
    `the bundle lost far more than this task can explain: ${total} B vs ${BASE_002B_TOTAL} B baseline`);
});

test("build: every switcher document resolves to an inventoried path", buildOptions, () => {
  // B3's real teeth: the baseline fallback is correct for every path, but an
  // un-inventoried page is still an unmeasured page, and this line of work does
  // not ship unmeasured SEO claims.
  const documents = walkFiles(PRERENDER_ROOT, new Set([".html"]));
  assert.ok(documents.length > 200, `expected the full prerendered set, saw ${documents.length}`);
  const unlisted = [];
  const covered = new Set();
  let checked = 0;
  for (const file of documents) {
    const html = readFileSync(file, "utf8");
    if (!html.includes('data-testid="lang-switcher"')) continue;
    checked++;
    const pagePath = pageOf(file);
    if (!SWITCHER_PATHS.includes(pagePath)) {
      unlisted.push(`${pagePath} <- ${path.relative(PRERENDER_ROOT, file).split(path.sep).join("/")}`);
      continue;
    }
    covered.add(pagePath);
    const expected = answerFor(pagePath).map((l) => htmlLang[l]).sort();
    assert.deepEqual(switcherHreflangs(html), expected,
      `${pagePath}: the switcher claims a locale the policy does not own, or lost one it does`);
    assert.equal(switcherLinkCount(html), locales.length,
      `${pagePath} must still offer navigation to every language`);
  }
  assert.deepEqual(unlisted, [], "a rendered switcher sits on a path the bridge never resolved");
  assert.ok(checked > 200, `only ${checked} documents carry a switcher — the probe stopped matching`);
  const missing = SWITCHER_PATHS.filter((p) => !covered.has(p));
  assert.deepEqual(missing, [], "the inventory lists paths that render no switcher document");
});

test("build: documents did not grow to pay for the boundary", buildOptions, () => {
  // The byte guard lives here, where it measures the thing that actually costs
  // money per request. The rejected complete-map encoding measured +3,210 B raw
  // per document; the shipped one costs tens of bytes.
  //
  // INTL-DEES-001 split the measurement by language. A global average cannot tell
  // a leak from a localization: translating a page legitimately makes that page
  // bigger, and Spanish and German documents now carry their own longer text. The
  // languages this task does NOT translate are the ones that would grow if the
  // boundary leaked, so they are pinned at the size they had before it, byte for
  // byte. English and Chinese measured 0 B of change at the INTL-DEES-001 head.
  const byLanguage = (predicate) =>
    walkFiles(PRERENDER_ROOT, new Set([".html"]))
      .map((file) => path.relative(PRERENDER_ROOT, file).split(path.sep).join("/"))
      .filter(predicate)
      .map((rel) => statSync(path.join(PRERENDER_ROOT, rel)).size);
  const average = (sizes) => sizes.reduce((a, b) => a + b, 0) / sizes.length;

  const localized = (rel) => rel === "es.html" || rel === "de.html"
    || rel.startsWith("es/") || rel.startsWith("de/");
  const untouched = byLanguage((rel) => !localized(rel));
  const averageUntouched = average(untouched);
  // Measured at the INTL-DEES-001 head: the 110 untranslated documents this file walks average 76,384 B —
  // byte-for-byte the size they had before this task, because localization added
  // no text to a page whose language it did not change. The ceiling below is that
  // measured number plus 416 B of headroom: a prop carrying a rule, or copy landing in the
  // dictionary for a language nobody translated, moves it by kilobytes.
  assert.ok(averageUntouched < 76_800,
    `untranslated (EN/ZH) documents average ${Math.round(averageUntouched)} B against the 76,384 B they measured before INTL-DEES-001 — text reached pages this task does not translate`);

  const all = average(byLanguage(() => true));
  assert.ok(all < 79_200,
    `average prerendered document is ${Math.round(all)} B against the ${76_751} B the leaked build measured; INTL-DEES-001 raised the ceiling from 78,000 to cover Spanish and German text on the pages that now carry it, and any further growth must be explained by more localized copy, not by a policy reaching the browser`);
});

test("build: consolidation and head alternates are untouched by the boundary", buildOptions, () => {
  // The switcher is not the only SEO surface in a document, and this is the
  // cheap end-to-end proof that moving the prop changed no declared ownership.
  for (const pagePath of ["/products/water-soluble-pva-yarn", "/quality", "/answers", "/request-quote"]) {
    const owner = readFileSync(path.join(PRERENDER_ROOT, `${pagePath.replace(/^\//, "")}.html`), "utf8");
    assert.equal((owner.match(/rel="canonical"[^>]*href="([^"]*)"/) ?? [])[1],
      `${siteUrl}${pagePath}`, `${pagePath} English owner moved`);
    for (const locale of locales.filter((l) => !baseline.includes(l))) {
      const file = path.join(PRERENDER_ROOT, locale, `${pagePath.replace(/^\//, "")}.html`);
      if (!existsSync(file)) continue;
      const html = readFileSync(file, "utf8");
      assert.equal((html.match(/rel="canonical"[^>]*href="([^"]*)"/) ?? [])[1],
        `${siteUrl}${pagePath}`, `${locale}${pagePath} stopped consolidating`);
      assert.equal((html.match(/<link[^>]*rel="alternate"[^>]*hreflang/g) ?? []).length, 0,
        `${locale}${pagePath} claims head alternates`);
    }
  }
});
