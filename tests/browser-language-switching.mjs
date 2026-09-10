/**
 * Browser checks for the language switcher and the language notice.
 *
 * These exist because a pure routing unit test could claim "320 combinations all
 * land correctly" while the picker, in a browser, sent a visitor who clicked English
 * to a different language. The layer that was wrong — Next's client router resolving
 * /en/<path> out of its own data, never asking the proxy — sits between the click and
 * the routing function, and no coverage of that function can see it. So these tests
 * click, exactly once, in a real browser against the same artefact `npm start` serves.
 *
 * Run: `npm run build && npm run test:browser`. Without an installed browser or a
 * build the file reports skipped, never passed; with REQUIRE_BROWSER=1 that becomes a
 * failure, so the suite cannot quietly stop checking what it covers (same convention
 * as REQUIRE_BUILD_OUTPUT in the SEO suites).
 *
 * One browser per window shape for the whole file, with cookies and storage cleared
 * before each test. Per-test process churn was measured as a source of instability: a
 * test started while the previous Chrome's children were still exiting, and the first
 * measured failure was a click that never navigated — indistinguishable from the
 * defect under test.
 */

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { Browser, findBrowser, freePort } = await import(pathToFileURL(path.join(repoRoot, "tests/support/chrome-cdp.mjs")).href);
const { locales, localePath, htmlLang } = await import(pathToFileURL(path.join(repoRoot, "src/content/company.ts")).href);

const requireBrowser = process.env.REQUIRE_BROWSER === "1";
const standaloneEntry = path.join(repoRoot, ".next", "standalone", "server.js");
const executable = findBrowser();

const SWITCHER = '[data-testid="lang-switcher"] a';
const SWITCHER_SUMMARY = '[data-testid="lang-switcher"] summary';
const SWITCHER_MOBILE = '[data-testid="lang-switcher-mobile"] a';
const LABEL = { en: "English", zh: "简体中文", es: "Español", de: "Deutsch" };

let server = null;
let base = null;
const shared = { desktop: null, mobile: null };

async function waitForServer(url, ms = 30_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(2000) });
      if (r.status) return true;
    } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

before(async () => {
  if (!existsSync(standaloneEntry) || !executable) return;
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  // The entrypoint production actually runs. `next start` warns it is unsupported
  // with output: "standalone", so a pass there would not prove this deployable.
  server = spawn(process.execPath, [standaloneEntry], {
    cwd: path.dirname(standaloneEntry),
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: "ignore",
  });
  if (!await waitForServer(`${base}/`)) {
    server.kill();
    server = null;
    base = null;
  }
});

after(() => {
  for (const b of Object.values(shared)) {
    try { b?.close(); } catch { /* already gone */ }
  }
  server?.kill();
});

/** True when browser and server are both up; the caller returns on false. */
function guard(t) {
  if (server && executable && existsSync(standaloneEntry)) return true;
  const missing = [
    !executable && "no installed browser (set BROWSER_PATH)",
    !existsSync(standaloneEntry) && "no .next/standalone build (run `npm run build`)",
    !server && "standalone server did not answer",
  ].filter(Boolean).join("; ");
  if (requireBrowser) assert.fail(`REQUIRE_BROWSER=1: ${missing}`);
  t.skip(missing);
  return false;
}

/** A ready browser of the given shape, with no state left from the previous test. */
async function fresh(kind = "desktop") {
  if (!shared[kind]) {
    const args = kind === "mobile" ? ["--window-size=430,860"] : ["--window-size=1280,1000"];
    // --lang=zh-CN: the browser's declared language differs from the English owner,
    // which is what the notice test needs and what a real visitor brings.
    shared[kind] = await new Browser({ executable, args: ["--lang=zh-CN", ...args] }).connect();
  }
  await shared[kind].reset();
  return shared[kind];
}

/** Open the desktop menu and click one entry; returns once the click was delivered. */
async function pick(b, label) {
  await b.click(SWITCHER_SUMMARY);
  await b.waitFor(`document.querySelector('[data-testid="lang-switcher"]').open`);
  // The item must be laid out before the single click that is under test: measuring
  // a box that is not painted yet produces a no-op that looks exactly like the bug.
  return b.click(SWITCHER, label);
}

/** `/zh/quality` -> `/quality`, `/` -> `/`: the path a visitor is reading. */
const pageOf = (url) => {
  const seg = url.split("/")[1];
  return locales.includes(seg) ? (url.slice(seg.length + 1) || "/") : url;
};

/** The alias the header builds for an owner URL: `/en`, or `/en/<path>`. */
const aliasFor = (owner) => `/en${owner === "/" ? "" : owner}`;

const NOTICE = `(() => {
  const el = [...document.querySelectorAll("div")].find(d =>
    /auch auf|también está|也提供中文|also available/.test(d.textContent) && d.querySelector("button"));
  return el ? el.textContent.trim().replace(/\\s+/g, " ") : null;
})()`;

// ------------------------------------------------------------------- the matrix
test("clicking a language reaches that language, once, from every locale", async (t) => {
  if (!guard(t)) return;
  const b = await fresh();
  for (const from of ["/", "/es", "/de/products", "/zh/quality"]) {
    const page = pageOf(from);
    for (const target of locales) {
      await b.navigate(base + from);
      await b.waitFor(`document.querySelector('[data-testid="lang-switcher"]')`);
      // The language already displayed is a no-op by design; asserting a navigation
      // here would be wrong, and that branch is covered by the notice test's reset.
      if (localePath(page, target) === from) continue;
      assert.ok(await pick(b, LABEL[target]), `no visible "${LABEL[target]}" item on ${from}`);
      const landed = await b.waitFor(`location.pathname === ${JSON.stringify(localePath(page, target))}`, 9000);
      assert.ok(landed, `one click on "${LABEL[target]}" from ${from} landed on ${await b.path}`);
    }
  }
});

test("the English item navigates through the proxy, not the client router", async (t) => {
  if (!guard(t)) return;
  const b = await fresh();
  // The case that shipped broken: English from a prefixed page landed on another
  // locale, because /en/<path> exists only as a proxy redirect and the client router
  // answered it from its own data.
  for (const [from, expected] of [["/es", "/"], ["/de/products", "/products"], ["/zh/quality", "/quality"]]) {
    await b.navigate(base + from);
    await b.waitFor(`document.querySelector(${JSON.stringify(SWITCHER)})`);
    assert.ok(await pick(b, "English"), `no English item on ${from}`);
    const arrived = await b.waitFor(`location.pathname === ${JSON.stringify(expected)}`, 9000);
    assert.ok(arrived, `English from ${from} landed on ${await b.path}, expected ${expected}`);
    // A trailing slash here would be normalised by Next into /en, whose redirect is
    // a slash redirect rather than the consolidation under test.
    const r = await fetch(base + aliasFor(expected), { redirect: "manual" });
    // 307, not 308: the alias carries the Set-Cookie that records the choice, and a
    // cached response is not re-validated, so permanence made every English click
    // after the first land back in the language being left. See the test below.
    assert.equal(r.status, 307, `${aliasFor(expected)} must consolidate without being cacheable`);
    assert.equal(r.headers.get("location"), expected);
  }
  // The retired prefixes keep their permanent consolidation — the difference is
  // that GSC-INDEX-002 has real indexed URLs there and no preference to deliver.
  const retired = await fetch(base + "/pt/products", { redirect: "manual" });
  assert.equal(retired.status, 308, "/pt must keep its permanent consolidation");
  assert.equal(retired.headers.get("location"), "/products");
});

test("clicking English again in the same profile still lands in English", async (t) => {
  if (!guard(t)) return;
  const b = await fresh();
  // No reset() between the clicks: the defect only appeared once the browser had
  // seen the alias once, because the stored redirect answered the second click
  // from cache and never re-applied its Set-Cookie.
  for (const attempt of [1, 2, 3]) {
    await b.navigate(base + "/es");
    await b.waitFor(`document.querySelector(${JSON.stringify(SWITCHER)})`);
    assert.ok(await pick(b, "English"), `no English item on attempt ${attempt}`);
    assert.ok(
      await b.waitFor(`location.pathname === "/"`, 9000),
      `attempt ${attempt} landed on ${await b.path} — the /en hop was served from cache`);
    assert.equal(await b.evaluate(`document.documentElement.lang`), htmlLang.en,
      `attempt ${attempt} arrived in the wrong language`);
  }
});

test("the menu is closed again once the visitor has arrived", async (t) => {
  if (!guard(t)) return;
  const b = await fresh();
  await b.navigate(base + "/es");
  await b.waitFor(`document.querySelector('[data-testid="lang-switcher"]')`);
  assert.ok(await pick(b, "Deutsch"), "no Deutsch item");
  assert.ok(await b.waitFor(`location.pathname === "/de"`, 9000), `did not reach /de: ${await b.path}`);
  assert.ok(
    await b.evaluate(`(() => { const d = document.querySelector('[data-testid="lang-switcher"]'); return d && !d.open; })()`),
    "the menu was still open on arrival — it must close because the path changed");
  // The app's own tag, not a guessed BCP-47 literal: htmlLang maps de -> "de".
  assert.equal(await b.evaluate(`document.documentElement.lang`), htmlLang.de,
    "<html lang> did not follow the switch");
});

test("one click works from the mobile dialog too", async (t) => {
  if (!guard(t)) return;
  // The dialog used to unmount its own content inside the click, which is how a press
  // could be swallowed outright. Narrow window: lg:hidden shows the trigger.
  const b = await fresh("mobile");
  await b.navigate(base + "/es/products");
  assert.ok(await b.waitFor(`document.querySelector('button[aria-controls="mobile-nav"]')`), "no mobile trigger");
  await b.click('button[aria-controls="mobile-nav"]');
  assert.ok(await b.waitFor(`document.querySelector('[data-testid="lang-switcher-mobile"]')`), "dialog did not open");
  await b.click('[data-testid="lang-switcher-mobile"] summary');
  const centre = await b.waitForCentre(SWITCHER_MOBILE, "English");
  assert.ok(centre, "the English item was never clickable at its measured position (settled and hit-testable)");
  await b.clickAt(centre.x, centre.y);
  assert.ok(await b.waitFor(`location.pathname === "/products"`, 9000),
    `one click from the mobile dialog landed on ${await b.path}`);
});

test("the language notice offers, then stands down after a real choice", async (t) => {
  if (!guard(t)) return;
  const b = await fresh();
  await b.navigate(base + "/");
  await b.waitFor(`document.querySelector('[data-testid="lang-switcher"]')`);
  const first = await b.evaluate(NOTICE);
  assert.ok(first, "the notice never appeared for a zh-CN browser reading the English owner");
  assert.match(first, /中文/, "the notice is not written in the language it offers");

  assert.ok(await pick(b, "Español"), "no Español item");
  assert.ok(await b.waitFor(`location.pathname === "/es"`, 9000), `switch did not happen: ${await b.path}`);

  await b.navigate(base + "/");
  await b.waitFor(`document.querySelector('[data-testid="lang-switcher"]')`);
  assert.equal(await b.evaluate(NOTICE), null,
    "the notice kept offering after the visitor used the picker — it read the httpOnly cookie, which JS cannot see");
  assert.equal(await b.evaluate(`localStorage.getItem("threethai.localeNotice.dismissed")`), "1",
    "using the picker must leave the JS-visible mark the notice can read");
});

test("nothing advertises an /en URL to crawlers", async (t) => {
  if (!guard(t)) return;
  // The alias is a redirect target for visitors, never a declared document.
  for (const file of ["index.html", "es/quality.html", "zh/products.html"]) {
    const html = (await import("node:fs")).readFileSync(path.join(repoRoot, ".next/server/app", file), "utf8");
    for (const link of [...html.matchAll(/rel="alternate" hreflang="[^"]*" href="([^"]+)"/g)].map((m) => m[1])) {
      assert.ok(!/\/en(\/|$)/.test(link), `${file} advertises an /en hreflang target: ${link}`);
    }
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? "";
    assert.ok(!/\/en(\/|$)/.test(canonical), `${file} canonicalises to an /en URL: ${canonical}`);
  }
});
