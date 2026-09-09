import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * BUSINESS-FACT-D2 — concrete PVA fiber is not a current Three Thai product.
 *
 * `extendedFormats` in src/content/products.ts used to read "We also
 * manufacture PVA cotton, PVA top, PPVA fiber, concrete PVA fiber and Gracell
 * yarn" and listed "Concrete PVA fiber" as an available format, while the
 * staple-fiber FAQ on the same site answered "No. Concrete PVA fiber is not
 * part of our current product offering." The owner has confirmed the negation
 * is the fact, so the affirmative line was the defect (audited as TSEO-10-05 /
 * SEO11-04, and the blocker INTL-DEES-001 raised before translating the block).
 *
 * What these tests pin down, in the narrowest way that still catches a
 * regression:
 *
 *   1. the extended-formats block — the copy whose whole job is to promise what
 *      is available — may not name the material in any language;
 *   2. no string in the shipped content model may *affirmatively* frame it as
 *      something Three Thai makes;
 *   3. the truthful "we do not offer it" answers must stay, and must not be
 *      swept away by rule 2 — so the detector reads framing, never the term;
 *   4. PVA cotton, PVA top, PPVA fiber and Gracell yarn are untouched: the
 *      owner confirmation covers concrete PVA fiber alone.
 *
 * There is deliberately no global ban on the phrase. Audit documents under
 * docs/ describe the old contradiction and must keep doing so.
 *
 * Rule 2 is additionally checked against the real production build when present
 * (set REQUIRE_BUILD_OUTPUT=1 to make a missing build a failure). Runtime note:
 * content modules are TypeScript imported directly, which needs Node's built-in
 * type stripping (see tests/support/ts-extension-hooks.mjs).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const { products, extendedFormats } = await importSource("src/content/products.ts");
const { products: legacyProducts } = await importSource("src/content/legacy-source.ts");
const { locales, contentLocaleOf } = await importSource("src/content/company.ts");

// ---------------------------------------------------------------------------
// Framing detector: the term is allowed, a promise to supply it is not.
// ---------------------------------------------------------------------------

/**
 * Every wording the site has used for the material, in each language it now
 * publishes. Spanish and German arrived with INTL-DEES-001: the offering copy,
 * the product FAQ answers and the page metadata exist in both, so a claim
 * reintroduced there would previously have passed this file untouched.
 */
const TERM_PATTERNS = [
  /concrete[\s-]*(?:grade[\s-]*)?pva[\s-]*fib(?:er|re)/i, // "concrete PVA fiber"
  /pva[\s-]*fib(?:er|re)[\s-]*(?:for|in|to)[\s-]*concrete/i, // "PVA fiber for concrete"
  /concrete[\s-]*(?:mix|reinforcement|shotcrete)[\s-]*(?:pva|fiber|fibre)/i,
  /混凝土[^，。、；\n]{0,12}?纤维/, // "混凝土 PVA 纤维"
  // Spanish and German admit the plural and the article, so neither inflection
  // can be the reason a sentence reads as "no mention". An unrecognised term is
  // not a passing term: it is a sentence the detector never looked at.
  /fibra(?:s)?[\s-]*(?:de[\s-]*)?pva[\s-]*(?:para|de)[\s-]*hormig/i, // "fibra(s) de PVA para hormigón"
  /hormig[\s-]*(?:ón|on)[\s-]*(?:pva|fibra)/i, // "hormigón … PVA/fibra"
  /pva[\s-]*(?:fibra|faser)s?[\s-]*(?:para|für)[\s-]*(?:hormig|beton)/i,
  /pva[\s-]*fasern?[\s-]*(?:fuer|für)[\s-]*beton/i, // "PVA-Faser(n) für Beton"
  /beton[\s-]*(?:pva|faser|stahlfaser)/i, // "Beton … PVA/Faser"
  /pva[\s-]*fasern?[\s-]*im[\s-]*beton/i, // "PVA-Fasern im Beton"
  /beton[\s-]*(?:stahl)?fasern?\b/i, // "Betonfasern", "Betonstahlfasern"
  /\bfasern?\b[^.\n]{0,40}\bfür[\s-]*beton\b/i, // "Fasern für Beton" without the PVA prefix
];

/** Verbs and nouns that put a material inside what the seller makes. */
const AFFIRM_PATTERNS = [
  /\bmanufactur\w*/i,
  /\bwe\s+(?:also\s+|currently\s+)?(?:make|produce|produce|supply|offer|provide)\b/i,
  /\b(?:produce|making|supplying|offering|available)\b/i,
  /\b(?:range|catalogue|catalog|lineup|line|offerings?|portfolio)\b(?:\s+\w+){0,4}?\bincludes?\b/i,
  /\binclude[sd]?\b/i,
  /生产|制造|加工供应|供应|提供/,
  /产品(?:范围|目录|线|清单)/,
  // Spanish and German "we make it" wording, so the detector is not English-only.
  /\bfabric\w*/i, // fabrica, fabricamos, fabricación
  /\bproduc\w*imos\b|\bproducci[oó]n\b/i,
  /\bsuministramos\b/i,
  /nuestra\s+(?:gama|cat[áa]logo|l[íi]nea|oferta)\b/i,
  /\bstellen (?:wir|auch|keine)\b/i, // "wir stellen … her"
  /\b(?:herstellen|produzieren|liefern|anbieten|f[üu]hren)\b/i,
  /unser(?:e[sn]?|es)?\s+(?:sortiment|programm|palette|angebot)\b/i,
];

/** Explicit current-status denials, including the shipped ones. */
const DENY_PATTERNS = [
  /\bnot\b/i,
  /\bno\.\s/i,
  /\bnever\b/i,
  /\bcannot\b/i,
  /\bcan'?t\b/i,
  /\bdoes not\b/i,
  /不(?:供应|生产|制造|提供|在|包括|属于|支持|建议)/,
  /没有|不涉及|不在/,
  // A truthful refusal in the two new languages carries its negation with it.
  /^\s*no[.,\s]/i,
  /^\s*nein[.,\s]/i,
  /\bno\s+(?:suministramos|fabricamos|producimos|ofrecemos|forma parte|est[áa]|contamos)/i,
  /\b(?:nicht|keine?)\b/i,
  /\bgeh[öo]rt nicht\b/i,
  /\bf[üu]hren (?:wir )?nicht\b/i,
];

const mentionsTerm = (text) => TERM_PATTERNS.some((re) => re.test(text));

/** A buyer's question is not the site making a promise. */
const isQuestion = (text) => /[?？]/.test(text);

/** A truthful current-status answer always carries its denial with it. */
const deniesTerm = (text) => DENY_PATTERNS.some((re) => re.test(text));

/** True when a string offers the material as current Three Thai production. */
const promisesConcreteFiber = (text) =>
  mentionsTerm(text) && !isQuestion(text) && !deniesTerm(text) && AFFIRM_PATTERNS.some((re) => re.test(text));

/**
 * Stricter rule for surfaces that are lists of things on offer: there the bare
 * label "Concrete PVA fiber" is the promise, so any mention that is not
 * question or denial is the defect. Prose fields keep promisesConcreteFiber, so
 * an honest explanation is never swept up by a banned word.
 */
const presentsAsOffering = (text) => mentionsTerm(text) && !isQuestion(text) && !deniesTerm(text);

/** Collect every string leaf of a content object as [field path, text]. */
const stringLeaves = (value, prefix = "", found = []) => {
  if (typeof value === "string") found.push([prefix, value]);
  else if (Array.isArray(value)) {
    value.forEach((entry, index) => stringLeaves(entry, `${prefix}[${index}]`, found));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) stringLeaves(entry, `${prefix ? `${prefix}.` : ""}${key}`, found);
  }
  return found;
};

/** Content-model fields that read as "and we have this too". */
const LABEL_FIELDS = ["items", "highlights", "keywords", "applications", "selection"];
const isLabelField = (fieldPath) =>
  fieldPath
    .replace(/\[\d+\]/g, "")
    .split(".")
    .some((segment) => LABEL_FIELDS.includes(segment));

const normalizeItem = (text) => text.toLowerCase().replace(/[\s、，,/]+/g, "");
const inOfferingList = (items) => items.some((item) => mentionsTerm(normalizeItem(item)));

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/**
 * The four formats the owner confirmation says nothing about, named the way each
 * language the site publishes names them. Keyed by route Locale rather than
 * ContentLocale: since INTL-DEES-001 the offering block is localized per route
 * language, so a Spanish page may say "Algodón de PVA" and must still say nothing
 * about hormigón.
 */
const OTHER_FORMATS = {
  en: ["PVA cotton", "PVA top", "PPVA fiber", "Gracell yarn"],
  zh: ["PVA Cotton", "PVA Top", "PPVA 纤维", "Gracell 纱线"],
  es: ["Algodón de PVA", "PVA top", "Fibra PPVA", "Hilo Gracell"],
  de: ["PVA-Baumwolle", "PVA Top", "PPVA-Faser", "Gracell-Garn"],
};

// ---------------------------------------------------------------------------
// A · The offering block itself.
// ---------------------------------------------------------------------------

test("extended-formats block names no concrete PVA fiber in any language", () => {
  const blocks = Object.entries(extendedFormats);
  assert.equal(blocks.length, 4, "expected the en, zh, es and de offering blocks");
  for (const [contentLocale, block] of blocks) {
    const leaves = stringLeaves(block);
    assert.ok(leaves.length >= 4, `${contentLocale} offering block looks empty`);
    for (const [, text] of leaves) {
      assert.ok(
        !mentionsTerm(text),
        `${contentLocale} offering copy still mentions concrete PVA fiber: ${text}`,
      );
    }
    assert.ok(!inOfferingList([...block.items]), `${contentLocale} items list offers it again`);
  }
});

test("the offering block makes no manufacturing promise at all", () => {
  for (const [contentLocale, block] of Object.entries(extendedFormats)) {
    for (const [fieldPath, text] of stringLeaves(block)) {
      assert.ok(!promisesConcreteFiber(text), `${contentLocale}${fieldPath}: ${text}`);
      assert.ok(!presentsAsOffering(text), `${contentLocale}${fieldPath}: ${text}`);
    }
  }
});

test("other extended formats keep their copy, neither deleted nor strengthened", () => {
  for (const [contentLocale, expected] of Object.entries(OTHER_FORMATS)) {
    const block = extendedFormats[contentLocale];
    const items = block.items.map(normalizeItem);
    for (const format of expected) {
      assert.ok(
        items.includes(normalizeItem(format)),
        `${contentLocale} items list lost "${format}"`,
      );
      assert.ok(
        normalizeItem(block.body).includes(normalizeItem(format)),
        `${contentLocale} body copy no longer names "${format}"`,
      );
    }
    assert.equal(block.items.length, expected.length, `${contentLocale} items list length changed`);
  }
  // Wording outside the removed entry must be byte-identical to the legacy copy.
  assert.match(extendedFormats.en.body, /^We also manufacture PVA cotton, PVA top, PPVA fiber and Gracell yarn\./);
  assert.match(extendedFormats.en.body, /Contact our team to match the specification and sample to your application\.$/);
  assert.equal(extendedFormats.zh.title, "面向专业应用的更多 PVA 材料形态");
});

// ---------------------------------------------------------------------------
// B · Everything the product content model can render.
// ---------------------------------------------------------------------------

test("no shipped product copy presents it as a current manufacture", () => {
  let mentions = 0;
  const check = (owner, fieldPath, text) => {
    if (mentionsTerm(text)) mentions += 1;
    assert.ok(!promisesConcreteFiber(text), `${owner}${fieldPath}: ${text}`);
    if (isLabelField(fieldPath)) {
      assert.ok(
        !presentsAsOffering(text),
        `${owner}${fieldPath} lists it among what is on offer: ${text}`,
      );
    }
  };
  for (const product of products) {
    for (const [fieldPath, text] of stringLeaves(product)) check(product.slug, fieldPath, text);
  }
  for (const product of legacyProducts) {
    for (const [fieldPath, text] of stringLeaves(product)) check(`legacy ${product.slug}`, fieldPath, text);
  }
  assert.ok(mentions >= 2, `expected the truthful negatives to still be present, found ${mentions}`);
});

test("the four product families and their FAQ copy are otherwise intact", () => {
  assert.deepEqual(
    products.map((p) => p.slug),
    ["water-soluble-pva-yarn", "water-soluble-pva-sewing-thread", "pva-staple-fiber", "pva-filament-yarn"],
  );
  const staple = products.find((p) => p.slug === "pva-staple-fiber");
  assert.equal(staple.faqs.zh.length, 3, "staple-fiber FAQ entries changed beyond this task");
  assert.equal(staple.keywords.length > 0, true);
});

// ---------------------------------------------------------------------------
// C · A truthful "we do not offer it" must not be treated as the defect.
// ---------------------------------------------------------------------------

test("the shipped current-status negatives are kept and read as denials", () => {
  const staple = products.find((p) => p.slug === "pva-staple-fiber");
  const zhAnswer = staple.faqs.zh.find(([, answer]) => mentionsTerm(answer));
  assert.ok(zhAnswer, "the Chinese staple-fiber FAQ answer was deleted");
  assert.ok(deniesTerm(zhAnswer[1]), `Chinese answer no longer denies: ${zhAnswer[1]}`);
  assert.ok(!promisesConcreteFiber(zhAnswer[1]));

  const legacyStaple = legacyProducts.find((p) => p.slug === "pva-staple-fiber");
  const enFaq = legacyStaple.faqs.find(([question, answer]) => mentionsTerm(question) || mentionsTerm(answer));
  assert.ok(enFaq, "the English staple-fiber FAQ was deleted");
  assert.ok(deniesTerm(enFaq[1]), `English answer no longer denies: ${enFaq[1]}`);
  assert.ok(!promisesConcreteFiber(enFaq[1]));
  assert.match(enFaq[1], /Concrete PVA fiber is not part of our current product offering\./);
});

test("detector accepts truthful framings and rejects promises", () => {
  const truthful = [
    "Concrete PVA fiber is not part of our current product offering.",
    "Do you supply PVA fiber for concrete? No.",
    "不供应。混凝土 PVA 纤维不在我们当前的产品范围内。",
    "你们供应混凝土用 PVA 纤维吗？",
    "We manufacture PVA cotton, PVA top, PPVA fiber and Gracell yarn.", // other formats, no term
  ];
  for (const text of truthful) {
    assert.ok(!promisesConcreteFiber(text), `truthful copy flagged as a claim: ${text}`);
    assert.ok(!presentsAsOffering(text), `truthful copy flagged as an offering: ${text}`);
  }

  const promises = [
    "Concrete PVA fiber", // bare label in an offering list
    "我们同样生产混凝土 PVA 纤维。",
    "Our current product range includes concrete PVA fiber.",
  ];
  for (const text of promises) {
    assert.ok(presentsAsOffering(text), `offering rule misses: ${text}`);
  }
});

// ---------------------------------------------------------------------------
// D · Source sweep, so the promise cannot move to another file.
// ---------------------------------------------------------------------------

test("no source line outside comments promises the material", () => {
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

  let linesMentioning = 0;
  for (const absolute of files) {
    const code = stripComments(readFileSync(absolute, "utf8"));
    for (const line of code.split("\n")) {
      if (!mentionsTerm(line)) continue;
      linesMentioning += 1;
      // Strict on source lines: whatever renders the material as available has
      // to say so with its own denial or a question mark next to it.
      assert.ok(
        !presentsAsOffering(line),
        `${path.relative(repoRoot, absolute)} presents it as available: ${line.trim()}`,
      );
    }
  }
  // The sweep must actually see the surviving negatives, not scan nothing.
  assert.ok(linesMentioning >= 2, `expected the truthful negatives in src/, found ${linesMentioning} lines`);
});

// ---------------------------------------------------------------------------
// E · Negative control: the pre-fix copy has to fail the rules above.
// ---------------------------------------------------------------------------

const PREFIX_EN_BODY =
  "We also manufacture PVA cotton, PVA top, PPVA fiber, concrete PVA fiber and Gracell yarn. Contact our team to match the specification and sample to your application.";
const PREFIX_EN_ITEMS = ["PVA cotton", "PVA top", "PPVA fiber", "Concrete PVA fiber", "Gracell yarn"];
const PREFIX_ZH_BODY =
  "我们同样生产 PVA Cotton、PVA Top、PPVA 纤维、混凝土 PVA 纤维和 Gracell 纱线，可根据具体应用匹配规格并安排样品。";
const PREFIX_ZH_ITEMS = ["PVA Cotton", "PVA Top", "PPVA 纤维", "混凝土 PVA 纤维", "Gracell 纱线"];

test("negative control: the removed claim is caught by every rule it broke", () => {
  assert.ok(mentionsTerm(PREFIX_EN_BODY), "detector is blind to the English claim");
  assert.ok(promisesConcreteFiber(PREFIX_EN_BODY), "English claim reads as truthful");
  assert.ok(inOfferingList(PREFIX_EN_ITEMS), "items rule misses the English entry");

  assert.ok(mentionsTerm(PREFIX_ZH_BODY), "detector is blind to the Chinese claim");
  assert.ok(promisesConcreteFiber(PREFIX_ZH_BODY), "Chinese claim reads as truthful");
  assert.ok(inOfferingList(PREFIX_ZH_ITEMS), "items rule misses the Chinese entry");

  // Restoring either body fails the offering-block rules and restoring either
  // list fails the items rule.
  const texts = (value) => stringLeaves(value).map(([, text]) => text);
  assert.ok(texts({ ...extendedFormats.en, body: PREFIX_EN_BODY }).some(promisesConcreteFiber));
  assert.ok(texts({ ...extendedFormats.zh, items: PREFIX_ZH_ITEMS }).some(mentionsTerm));

  // And the same claim cannot dodge the rules by moving into a product list,
  // where it arrives as a bare label with no verb to detect.
  const staple = products.find((p) => p.slug === "pva-staple-fiber");
  const movedIntoProductList = {
    slug: staple.slug,
    highlights: { en: [...staple.highlights.en, "Concrete PVA fiber"] },
  };
  assert.ok(
    stringLeaves(movedIntoProductList).some(
      ([fieldPath, text]) => isLabelField(fieldPath) && presentsAsOffering(text),
    ),
    "a bare label slipped past the product-list rule",
  );
});

// ---------------------------------------------------------------------------
// F · Ground truth from the real production build.
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

/**
 * Route as the build writes it: `/products`, `/zh/products`, the English home
 * as `index.html` and every other home as the bare locale document (`zh.html`).
 */
const localeHref = (locale, sitePath) => {
  if (sitePath === "/") return locale === "en" ? "/index" : `/${locale}`;
  return locale === "en" ? sitePath : `/${locale}${sitePath}`;
};

const readPage = (locale, sitePath) => {
  const htmlPath = path.join(prerenderRoot, `${localeHref(locale, sitePath)}.html`);
  assert.ok(existsSync(htmlPath), `prerendered page missing: ${path.relative(repoRoot, htmlPath)}`);
  return { htmlPath, html: readFileSync(htmlPath, "utf8") };
};

const jsonLdRaw = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.stringify(JSON.parse(m[1])))
    .join(" ");

test("every rendered page that sells formats omits it in every language", buildOptions, () => {
  let inspected = 0;
  for (const sitePath of ["/", "/products"]) {
    for (const locale of locales) {
      const { htmlPath, html } = readPage(locale, sitePath);
      const visible = visibleText(html);
      assert.ok(
        !mentionsTerm(visible),
        `${path.relative(prerenderRoot, htmlPath)} offers concrete PVA fiber`,
      );
      assert.ok(!promisesConcreteFiber(visible), path.relative(prerenderRoot, htmlPath));
      // The block still renders, so a pass cannot come from deleting the page.
      // Keyed by route locale: /es sells the same four formats, in Spanish.
      for (const format of OTHER_FORMATS[locale]) {
        assert.ok(
          visible.includes(format),
          `${path.relative(prerenderRoot, htmlPath)} lost "${format}"`,
        );
      }
      inspected += 1;
    }
  }
  assert.equal(inspected, locales.length * 2);
});

/**
 * The rendered check below covers the languages whose staple page shows the
 * answer today. INTL-DEES-001 also wrote a Spanish and a German version of that
 * refusal, and they live in the copy store until a reviewer approves the record —
 * so they are checked at the store, where a mistranslation ("yes, we supply it",
 * or a refusal that dropped its own negation) would otherwise reach the page the
 * moment someone flips the record's status.
 */
test("the Spanish and German staple-fiber FAQ keeps answering no", async () => {
  const { productCopy } = await importSource("src/content/translation-copy.ts");
  const faqs = productCopy["pva-staple-fiber"].faqs;
  for (const locale of ["es", "de"]) {
    const pair = faqs[locale].find(([question]) => mentionsTerm(question));
    assert.ok(pair, locale + ": no longer asks the concrete-fiber question at all");
    const [question, answer] = pair;
    assert.ok(isQuestion(question), locale + ": concrete-fiber entry is not a question: " + question);
    assert.ok(mentionsTerm(answer), locale + ": answer stops naming what is not supplied: " + answer);
    assert.ok(deniesTerm(answer), locale + ": answer carries no refusal: " + answer);
    assert.ok(!promisesConcreteFiber(answer), locale + ": answer offers the material: " + answer);
    assert.ok(!presentsAsOffering(answer), locale + ": answer presents the material as on offer: " + answer);
  }
});

test("rendered staple-fiber pages keep answering the buyer honestly", buildOptions, () => {
  for (const locale of ["en", "zh"]) {
    const cl = contentLocaleOf(locale);
    const { htmlPath, html } = readPage(locale, "/products/pva-staple-fiber");
    const visible = visibleText(html);
    const inFaqSchema = jsonLdRaw(html);

    const denial =
      cl === "en"
        ? "Concrete PVA fiber is not part of our current product offering."
        : "混凝土 PVA 纤维不在我们当前的产品范围内";

    assert.ok(visible.includes(denial), `${path.relative(prerenderRoot, htmlPath)} lost the visible answer`);
    assert.ok(inFaqSchema.includes(denial), `${path.relative(prerenderRoot, htmlPath)} lost it in FAQ JSON-LD`);
    // Audited contradiction was HTML vs JSON-LD: neither side may promise it.
    for (const text of [visible, inFaqSchema]) {
      assert.ok(!promisesConcreteFiber(text), `${path.relative(prerenderRoot, htmlPath)} still claims it`);
    }
    assert.ok(mentionsTerm(visible), `${path.relative(prerenderRoot, htmlPath)} no longer mentions it at all`);
  }
});

test("no sentence on any rendered page presents it as available", buildOptions, () => {
  // Checked sentence by sentence: merged page text almost always contains the
  // word "not" somewhere, which would mask an affirmative claim.
  const offenders = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) {
        if (entry === "product-finder" || entry === "_not-found") continue;
        visit(absolute);
        continue;
      }
      if (!entry.endsWith(".html")) continue;
      const visible = visibleText(readFileSync(absolute, "utf8"));
      for (const sentence of visible.split(/(?<=[.!?。！？])\s+/)) {
        if (presentsAsOffering(sentence)) offenders.push(`${path.relative(prerenderRoot, absolute)} :: ${sentence}`);
      }
    }
  };
  visit(prerenderRoot);
  assert.deepEqual(offenders, [], "a rendered page presents it as current production");
});
