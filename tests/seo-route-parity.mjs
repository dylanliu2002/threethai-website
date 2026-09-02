import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");

function routeSet(relativeRoot) {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  const routes = new Set();

  function visit(directory) {
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) {
        visit(absolute);
        continue;
      }
      if (entry !== "page.tsx") continue;
      const relativeDirectory = path.relative(absoluteRoot, directory).split(path.sep).filter(Boolean);
      routes.add(relativeDirectory.length ? `/${relativeDirectory.join("/")}` : "/");
    }
  }

  visit(absoluteRoot);
  return routes;
}

test("production build does not ignore TypeScript errors", () => {
  assert.doesNotMatch(read("next.config.ts"), /ignoreBuildErrors\s*:/);
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
});

test("SEO helper references only existing static image assets", () => {
  const source = read("src/lib/seo.tsx");
  assert.doesNotMatch(source, /\/og\.png\b/);

  const assets = new Set();
  for (const match of source.matchAll(/["']\/([^"']+\.(?:png|jpe?g|svg|ico))["']/gi)) assets.add(match[1]);
  for (const match of source.matchAll(/\$\{siteUrl\}\/([^`$]+\.(?:png|jpe?g|svg|ico))/gi)) assets.add(match[1]);

  assert.ok(assets.size > 0, "expected SEO image references");
  for (const asset of assets) {
    const absolute = path.join(repoRoot, "public", asset);
    assert.ok(existsSync(absolute), `missing public SEO asset: /${asset}`);
    assert.ok(statSync(absolute).size > 0, `empty public SEO asset: /${asset}`);
  }
});

test("English and dynamic-locale route trees stay in parity", () => {
  const english = routeSet("src/app/(site)");
  const dynamic = routeSet("src/app/[lang]");
  const knownRoutes = [
    "/",
    "/about",
    "/answers",
    "/answers/[slug]",
    "/applications",
    "/applications/[slug]",
    "/contact",
    "/knowledge",
    "/knowledge/[slug]",
    "/manufacturing",
    "/product-finder",
    "/products",
    "/products/[slug]",
    "/quality",
    "/request-quote",
    "/request-sample",
  ];

  assert.deepEqual([...dynamic].sort(), [...english].sort());
  for (const route of knownRoutes) assert.ok(english.has(route), `missing shared route: ${route}`);
});

test("explicit Chinese overrides remain valid shared-route subsets", () => {
  const english = routeSet("src/app/(site)");
  const dynamic = routeSet("src/app/[lang]");
  const chinese = routeSet("src/app/zh");
  const expectedOverrides = [
    "/",
    "/about",
    "/applications",
    "/applications/[slug]",
    "/contact",
    "/manufacturing",
    "/products",
    "/products/[slug]",
    "/quality",
    "/request-quote",
  ];

  assert.deepEqual([...chinese].sort(), [...expectedOverrides].sort());
  for (const route of chinese) {
    assert.ok(english.has(route), `Chinese override missing in English tree: ${route}`);
    assert.ok(dynamic.has(route), `Chinese override missing in dynamic tree: ${route}`);
  }
});

test("English buyer-answer metadata uses the shared contract", () => {
  const source = read("src/app/(site)/answers/[slug]/page.tsx");
  assert.match(source, /return buildMetadata\(\{/);
  assert.match(source, /path:\s*`\/answers\/\$\{answer\.slug\}`/);
  assert.match(source, /locale:\s*["']en["']/);
  assert.match(source, /type:\s*["']article["']/);
});
