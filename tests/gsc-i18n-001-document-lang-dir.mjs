import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * GSC-I18N-001 — document-level HTML lang / dir.
 *
 * The defect: the site had exactly one document root, a hardcoded
 * `<html lang="en">`, so every document reported English to parsers no matter
 * what the inner wrapper underneath it claimed. The fix gives each locale route
 * tree its own root layout rendering the shared document root, so the emitted
 * `<html>` element carries the route's own language and writing direction.
 *
 * These tests pin WHERE the locale signal lives — the document root, derived
 * from the route locale, from the one existing tag map — and prove it against
 * the HTML a production build actually emits. Route semantics (canonical
 * ownership, hreflang membership, sitemap eligibility, the `/en` alias, the
 * unknown-locale 404) belong to GSC-INDEX-002 and GSC-LOCALE-003A; they appear
 * here only as invariants this change must not disturb.
 *
 * Runtime note: the locale map is TypeScript imported directly, which needs
 * Node's built-in type stripping (Node >= 22.18 / 23.6 / 24.x).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const company = await importSource("src/content/company.ts");
const { locales, htmlLang, isRtl, localePath, siteUrl } = company;

/** The three route trees that now own a document: English, prefixed locales, static Chinese. */
const ROOT_LAYOUTS = ["src/app/(site)/layout.tsx", "src/app/[lang]/layout.tsx", "src/app/zh/layout.tsx"];

const DOCUMENT_ROOT = "src/components/layout/root-document.tsx";
const PRODUCT = "/products/water-soluble-pva-yarn";

// ---------------------------------------------------------------------------
// Where the locale signal lives.
// ---------------------------------------------------------------------------
test("no hardcoded document root survives outside the route tree", () => {
  assert.ok(
    !existsSync(path.join(repoRoot, "src/app/layout.tsx")),
    "src/app/layout.tsx is back — a single hardcoded root <html> relabels every locale English"
  );
  for (const file of ROOT_LAYOUTS) {
    assert.match(read(file), /<RootDocument/, `${file} does not render the shared document root`);
  }
});

test("the document root takes lang and dir from the route locale", () => {
  const source = read(DOCUMENT_ROOT);
  assert.match(
    source,
    /<html\s+lang=\{htmlLang\[locale\]\}\s+dir=\{isRtl\(locale\) \? "rtl" : undefined\}/,
    "the root <html> no longer derives both attributes from the route locale"
  );
  assert.match(source, /import \{[^}]*htmlLang[^}]*isRtl[^}]*\} from "@\/content\/company"/);
  assert.doesNotMatch(
    source,
    /"(zh-CN|es|de|ar|pt|ru|tr|vi|id)"/,
    "a second locale→tag map was introduced instead of reusing htmlLang"
  );
});

test("the locale signal is no longer carried by an inner wrapper", () => {
  for (const file of ROOT_LAYOUTS) {
    const source = read(file);
    assert.doesNotMatch(source, /<div[^>]*\s(lang|dir)=/s, `${file} still declares lang/dir on a wrapper`);
  }
});

test("document language depends on the route only", () => {
  const sources = [DOCUMENT_ROOT, ...ROOT_LAYOUTS].map(read).join("\n");
  assert.doesNotMatch(
    sources,
    /headers\(|cookies\(|accept-language|x-vercel-ip-country|geolocation|userAgent/i,
    "document language became requester-dependent"
  );
  assert.doesNotMatch(
    sources,
    /documentElement|useEffect|"use client"/,
    "document language is being patched in the browser"
  );
  // Scope boundary: language mechanics only — indexation policy stays where it is.
  assert.doesNotMatch(sources, /canonical|hreflang|sitemap|indexab/i, "the document root started deciding indexation");
});

test("the unknown-locale 404 and the redirect-only /en alias survive the restructure", () => {
  assert.match(
    read("src/app/[lang]/_lang.ts"),
    /if \(!\(dynamicLocales as readonly string\[\]\)\.includes\(lang\)\) notFound\(\);/,
    "the locale route guard was relaxed — unknown prefixes could render"
  );
  assert.match(read("src/app/[lang]/layout.tsx"), /resolveLang\(params, notFound\)/);
  for (const directory of ["src/app/en", "src/app/fr"]) {
    assert.ok(!existsSync(path.join(repoRoot, directory)), `${directory} exists — a locale prefix became a renderable route`);
  }
});

test("the 404 document owns its root and declares the language it is written in", () => {
  assert.match(read("src/app/global-not-found.tsx"), /<RootDocument locale="en">/);
  assert.ok(
    !existsSync(path.join(repoRoot, "src/app/not-found.tsx")),
    "src/app/not-found.tsx is back without a root layout to render it"
  );
  assert.match(read("next.config.ts"), /globalNotFound: true/);
});

// ---------------------------------------------------------------------------
// Emitted HTML: the only proof that matters for a document-level attribute.
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
  const file = path.join(prerenderRoot, `${urlPath === "/" ? "index" : urlPath.replace(/^\//, "")}.html`);
  assert.ok(existsSync(file), `expected prerendered ${file}`);
  return readFileSync(file, "utf8");
};

/** The opening `<html>` tag of a document — the element this task is about. */
const documentRoot = (html) => {
  const match = html.match(/<html(?:\s[^>]*)?>/);
  assert.ok(match, "no <html> element in the rendered document");
  return match[0];
};

const urlFor = (sitePath, locale) => localePath(sitePath, locale);

test("build: the root <html> carries every locale's language", buildOptions, () => {
  for (const locale of locales) {
    for (const sitePath of ["/", PRODUCT]) {
      const urlPath = urlFor(sitePath, locale);
      const root = documentRoot(htmlFor(urlPath));
      assert.match(root, new RegExp(`lang="${htmlLang[locale]}"[ >]`), `${urlPath} root lang is ${root}`);
      assert.equal((root.match(/\blang=/g) ?? []).length, 1, `${urlPath} root tag carries two lang attributes: ${root}`);
    }
  }
});

test("build: only Arabic gets a right-to-left document root", buildOptions, () => {
  for (const locale of locales) {
    for (const sitePath of ["/", PRODUCT]) {
      const urlPath = urlFor(sitePath, locale);
      const root = documentRoot(htmlFor(urlPath));
      if (isRtl(locale)) {
        assert.match(root, /dir="rtl"/, `${urlPath} lost its document direction`);
      } else {
        assert.doesNotMatch(root, /dir="rtl"/, `${urlPath} claims a right-to-left document`);
      }
    }
  }
});

test("build: no wrapper element re-declares the document language", buildOptions, () => {
  for (const locale of locales) {
    const urlPath = urlFor("/", locale);
    const inner = htmlFor(urlPath).slice(documentRoot(htmlFor(urlPath)).length);
    const wrapper = inner.match(/<(?:div|main|body|section|article|header|footer|nav|ul)[^>]*\s(?:lang|dir)=/);
    assert.equal(wrapper, null, `${urlPath} still carries the locale on ${wrapper?.[0]}`);
  }
});

test("build: one document root per page, with the shared services intact", buildOptions, () => {
  for (const locale of locales) {
    for (const sitePath of ["/", PRODUCT]) {
      const urlPath = urlFor(sitePath, locale);
      const html = htmlFor(urlPath);
      assert.equal((html.match(/<html(?:\s|>)/g) ?? []).length, 1, `${urlPath} renders more than one <html>`);
      assert.equal((html.match(/<body(?:\s|>)/g) ?? []).length, 1, `${urlPath} renders more than one <body>`);
      const body = html.match(/<body(?:\s[^>]*)?>/)[0];
      assert.match(body, /min-h-screen antialiased bg-background text-foreground/, `${urlPath} lost the body classes`);
      // Geist and Geist Mono each contribute one hashed font-variable class and one preload.
      assert.match(body, /\b[^\s"]+__variable\b/, `${urlPath} lost the font-variable classes`);
      assert.equal((html.match(/as="font"/g) ?? []).length, 2, `${urlPath} does not preload Geist and Geist Mono once each`);
      assert.match(html, /name="theme-color"[^>]*content="#1a2151"/, `${urlPath} lost the global viewport`);
      assert.match(html, /name="application-name"/, `${urlPath} lost the global metadata`);
      assert.match(html, /rel="icon"[^>]*href="\/favicon\.svg"/, `${urlPath} lost the global icons`);
    }
  }
});

test("build: no route tree re-declares the global stylesheet", buildOptions, () => {
  // (site), [lang] and zh each own a document root; per-tree CSS duplication
  // would show up here as a different stylesheet count for one of them.
  const counts = {};
  for (const urlPath of ["/", "/zh", "/es", "/ar"]) {
    counts[urlPath] = (htmlFor(urlPath).match(/<link rel="stylesheet"/g) ?? []).length;
    assert.ok(counts[urlPath] >= 1, `${urlPath} got no stylesheet bundle`);
  }
  assert.equal(new Set(Object.values(counts)).size, 1, `stylesheet counts diverge across route trees: ${JSON.stringify(counts)}`);
});

test("build: the fallback 404 document renders English and owns its root", buildOptions, () => {
  const html = htmlFor("_not-found");
  assert.match(documentRoot(html), /^<html lang="en">$/, `the 404 document root is ${documentRoot(html)}`);
  assert.match(html, /Page not found|does not exist/i, "the 404 document lost its copy");
});

test("build: canonical and hreflang strings are unchanged by the document rewrite", buildOptions, () => {
  const english = htmlFor(PRODUCT);
  assert.equal(
    (english.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1],
    `${siteUrl}${PRODUCT}`,
    "the English owner's canonical moved"
  );
  const alternates = (english.match(/rel="alternate"/g) ?? []).length;
  assert.ok(alternates > 1, `${PRODUCT} lost its hreflang alternates (${alternates})`);

  for (const locale of ["es", "de", "ar"]) {
    const urlPath = urlFor(PRODUCT, locale);
    const html = htmlFor(urlPath);
    assert.equal(
      (html.match(/rel="canonical"[^>]*href="([^"]*)"/i) ?? [])[1],
      `${siteUrl}${PRODUCT}`,
      `${urlPath} stopped pointing at the English owner`
    );
    assert.equal((html.match(/rel="alternate"/g) ?? []).length, 0, `${urlPath} claims alternates it must not have`);
  }
});

test("build: no locale prefix became a renderable route", buildOptions, () => {
  for (const segment of ["en", "fr"]) {
    assert.ok(!existsSync(path.join(prerenderRoot, segment)), `.next/server/app/${segment} exists — /${segment}/* now renders`);
  }
});
