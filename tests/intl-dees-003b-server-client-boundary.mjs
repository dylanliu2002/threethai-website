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
 * answers. This suite pins the three things that makes true:
 *
 * 1. no ownership string reaches `.next/static/chunks`, and the bundle comes
 *    back down to its INTL-DEES-002B size;
 * 2. the server-side answers are unchanged, and every value the client receives
 *    *is* the policy's answer rather than a restatement of its rules;
 * 3. the switcher still receives correct props — proven from built HTML, where
 *    each document's per-link `hreflang` must equal the policy's answer for that
 *    path, with navigation to all four languages intact.
 *
 * The payload encoding is itself pinned, because the obvious encoding was
 * measured and rejected: a complete `path → locales` map cost +3,210 B raw /
 * +800 B gzip on **every** document to save 586 B gzip once on a cached chunk.
 *
 * Nothing is promoted, translated, re-designed or re-routed here.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const { SWITCHER_AVAILABILITY, SWITCHER_PATHS } = await importSource("src/content/switcher-availability.ts");
const { htmlLang, locales, siteUrl } = await importSource("src/content/company.ts");
const {
  canonicalLocaleFor,
  contentHtmlLangOf,
  createAvailabilityPolicy,
  hreflangForPath,
  isEnglishFallbackCopy,
  isSitemapEligible,
  localizedLocalesFor,
} = await importSource("src/content/availability.ts");
const { TRANSLATED_PAGES } = await importSource("src/content/translation-availability.ts");

/** What the client is allowed to conclude about a path — data only. */
const answerFor = (pagePath) => SWITCHER_AVAILABILITY.exceptions[pagePath] ?? SWITCHER_AVAILABILITY.common;

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

/** Ceiling for the serialized prop: the full map it replaced was ~1.7 KB. */
const PAYLOAD_CEILING = 400;

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
  const owner = ["zh", "es", "de"].includes(segments[0]) ? segments.slice(1) : segments;
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
  // Exceptions are keyed by inventoried paths only, and hold string arrays.
  for (const pagePath of Object.keys(SWITCHER_AVAILABILITY.exceptions)) {
    assert.ok(SWITCHER_PATHS.includes(pagePath), `${pagePath} is not a switcher path`);
  }
  for (const list of [SWITCHER_AVAILABILITY.common, ...Object.values(SWITCHER_AVAILABILITY.exceptions)]) {
    assert.ok(Array.isArray(list), "each answer must be an array");
    for (const locale of list) assert.equal(typeof locale, "string", "each answer must hold locale strings");
  }
  // `common` is derived, not written down: it equals the policy on the modal path.
  assert.deepEqual([...SWITCHER_AVAILABILITY.common], [...localizedLocalesFor("/")], "common must come from the policy");
  const bridge = read("src/content/switcher-availability.ts");
  assert.doesNotMatch(bridge, /common[^=]*=\s*\[\s*"en"/, "`common` may not be a hardcoded locale list");
});

test("REQ 2 · zero promotions means the payload carries one answer and no exceptions", () => {
  assert.deepEqual([...SWITCHER_AVAILABILITY.common], ["en", "zh"],
    "with an empty evidence registry the policy must answer en+zh");
  assert.deepEqual(Object.keys(SWITCHER_AVAILABILITY.exceptions), [],
    "no path may differ from the common answer while nothing is promoted");
  // The design invariant that keeps documents small: the wire format scales with
  // exceptions, not with the inventory. A complete map would be ~1.7 KB here.
  const payload = JSON.stringify(SWITCHER_AVAILABILITY);
  assert.ok(payload.length < PAYLOAD_CEILING,
    `the serialized prop is ${payload.length} B — the bridge is shipping one entry per path again`);
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

  // The same derivation the bridge runs, replayed over the promoted policy,
  // produces exactly the shape the client already knows how to read.
  const answer = (policy, pagePath) => [...policy.localizedLocalesFor(pagePath)];
  const modal = answer(promoted, "/quality");
  const exceptions = Object.fromEntries(
    SWITCHER_PATHS.map((p) => [p, answer(promoted, p)])
      .filter(([, list]) => list.join(",") !== modal.join(","))
      .map(([p, list]) => [p, list]),
  );
  assert.deepEqual(Object.keys(exceptions), [promotion.path]);
  assert.deepEqual([...exceptions[promotion.path]], ["en", "zh", "es"]);
  // And the shipped values are untouched by this simulation.
  assert.deepEqual([...answerFor(promotion.path)], ["en", "zh"]);
});

// ---------------------------------------------------------------------------
// 2 · The browser receives data, never the policy.
// ---------------------------------------------------------------------------
test("REQ 1 · the client header imports no ownership machinery", () => {
  const source = read("src/components/layout/site-header.tsx");
  assert.doesNotMatch(source, /from "@\/content\/(?:availability|translation-availability|translation-evidence|switcher-availability)"/,
    "the browser component may not import the SEO policy, the evidence layer, or its serialization bridge");
  assert.doesNotMatch(source, /localizedLocalesFor/, "the client must not call the policy");
  assert.match(source, /availableLocales\.exceptions\[currentPath\] \?\? availableLocales\.common/,
    "the switcher must read both branches of the server-resolved answer");
  assert.doesNotMatch(source, /\[\s*"en",\s*"zh"\s*\]/, "the client must not hardcode the modelled pair");
  // The gating GSC-INDEX-002 was written to protect is unchanged, on both switchers.
  assert.equal((source.match(/hrefLang=\{localizedTargets\.includes\(l\) \? htmlLang\[l\] : undefined\}/g) ?? []).length, 2,
    "desktop and mobile switcher must both stay gated");
  assert.equal((source.match(/locales\.map\(\(l\) =>/g) ?? []).length, 2,
    "both switchers must still enumerate the locale model");
});

test("REQ 1 · only the three root layouts import the bridge, and they pass it down", () => {
  for (const file of ["src/app/(site)/layout.tsx", "src/app/[lang]/layout.tsx", "src/app/zh/layout.tsx"]) {
    const source = read(file);
    assert.match(source, /from "@\/content\/switcher-availability"/, `${file} must import the bridge`);
    assert.match(source, /<SiteHeader[^>]*availableLocales=\{SWITCHER_AVAILABILITY\}/, `${file} must pass the prop`);
  }
  const bridge = read("src/content/switcher-availability.ts");
  assert.match(bridge, /localizedLocalesFor\(/, "the map must be produced by the policy");
  assert.doesNotMatch(bridge, /^["']use client["']/m, "the bridge must not be a client module");

  // Match import specifiers, not prose: the header mentions the bridge in a
  // comment precisely to explain why it must not import it.
  const importsBridge = /(?:^|\n)\s*(?:import|export)\b[^\n]*from\s+"[^"]*switcher-availability"/;
  const importers = walkFiles(path.join(repoRoot, "src"), new Set([".ts", ".tsx"]))
    .filter((file) => importsBridge.test(readFileSync(file, "utf8")))
    .map((file) => path.relative(repoRoot, file).split(path.sep).join("/"));
  assert.deepEqual(importers.sort(), [
    "src/app/(site)/layout.tsx",
    "src/app/[lang]/layout.tsx",
    "src/app/zh/layout.tsx",
  ].sort(), "only the three root layouts may import the bridge");
});

// ---------------------------------------------------------------------------
// 3 · Server-side SEO behaviour is untouched by the boundary.
// ---------------------------------------------------------------------------
test("REQ 3 · every policy answer is exactly as INTL-DEES-003A left it", () => {
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
  const total = walkFiles(chunksRoot, new Set([".js"])).reduce((sum, file) => sum + statSync(file).size, 0);
  assert.ok(total <= LEAKED_003A_TOTAL - 1_000,
    `the bundle did not shrink: ${total} B, still within 1 KB of the ${LEAKED_003A_TOTAL} B leaked build`);
  assert.ok(total <= BASE_002B_TOTAL + TOLERANCE,
    `client bundle is ${total - BASE_002B_TOTAL} B above the ${BASE_002B_TOTAL} B INTL-DEES-002B baseline (tolerance ${TOLERANCE} B)`);
  assert.ok(total > BASE_002B_TOTAL - 20_000,
    `the bundle lost far more than this task can explain: ${total} B vs ${BASE_002B_TOTAL} B baseline`);
});

test("build: every document's switcher hreflang equals the server-resolved answer", buildOptions, () => {
  const documents = walkFiles(PRERENDER_ROOT, new Set([".html"]));
  assert.ok(documents.length > 200, `expected the full prerendered set, saw ${documents.length}`);
  let checked = 0;
  for (const file of documents) {
    const html = readFileSync(file, "utf8");
    if (!html.includes('data-testid="lang-switcher"')) continue;
    checked++;
    const pagePath = pageOf(file);
    const expected = answerFor(pagePath).map((l) => htmlLang[l]).sort();
    assert.deepEqual(switcherHreflangs(html), expected,
      `${pagePath}: the switcher claims a locale the policy does not own, or lost one it does`);
    assert.equal(switcherLinkCount(html), locales.length,
      `${pagePath} must still offer navigation to every language`);
  }
  assert.ok(checked > 200, `only ${checked} documents carry a switcher — the probe stopped matching`);
});

test("build: documents did not grow to pay for the boundary", buildOptions, () => {
  // The reason the prop is `common` + `exceptions`: the complete map variant of
  // this same fix measured +3,210 B raw per document. Anything near that scale
  // means the encoding regressed, not the policy.
  const documents = walkFiles(PRERENDER_ROOT, new Set([".html"]));
  const total = documents.reduce((sum, file) => sum + statSync(file).size, 0);
  const average = total / documents.length;
  assert.ok(average < 78_000,
    `average prerendered document is ${Math.round(average)} B against the ${Math.round(76_751)} B the leaked build measured — the prop encoding grew the documents`);
});

test("build: consolidation and head alternates are untouched by the boundary", buildOptions, () => {
  // The switcher is not the only SEO surface in a document, and this is the
  // cheap end-to-end proof that moving the prop changed no declared ownership.
  for (const pagePath of ["/products/water-soluble-pva-yarn", "/quality", "/answers", "/request-quote"]) {
    const owner = readFileSync(path.join(PRERENDER_ROOT, `${pagePath.replace(/^\//, "")}.html`), "utf8");
    assert.equal((owner.match(/rel="canonical"[^>]*href="([^"]*)"/) ?? [])[1],
      `${siteUrl}${pagePath}`, `${pagePath} English owner moved`);
    for (const locale of ["es", "de"]) {
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
