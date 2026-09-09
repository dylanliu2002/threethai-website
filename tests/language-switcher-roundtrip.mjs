/**
 * Language switcher — "I clicked English and landed on German".
 *
 * The switcher's promise is one sentence: choosing a language must land the
 * visitor in that language, whatever they were reading before and whatever the
 * `threethai_locale` cookie happens to say. Four things could break that, and
 * each gets its own test rather than being assumed:
 *
 *   1. the click's href resolves to a different locale than the label claims;
 *   2. a stale preference cookie outranks the explicit click;
 *   3. a locale relocation is issued as a *cacheable* redirect, which would make
 *      one wrong landing stick to the visitor's browser and re-fire on later
 *      visits — the signature of a bug that happens "sometimes";
 *   4. the click's one-time hint is consumed twice, or never consumed, so the
 *      second hop re-decides from weaker signals.
 *
 * English is the interesting case throughout: it is the prefix-free owner, so it
 * is the only language whose picker entry cannot say which language it wants
 * from the path alone and has to carry `?_locale=en` instead.
 *
 * `routeFor` in src/content/locale-routing.ts is the whole decision, and
 * src/proxy.ts is only its executor, so the decision is tested directly and the
 * executor is pinned at source level — the same split GSC-LOCALE-003A set up.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const importSource = (relativePath) => import(pathToFileURL(path.join(repoRoot, relativePath)).href);

const { locales, localePath, localeLabels, htmlLang } = await importSource("src/content/company.ts");
const routing = await importSource("src/content/locale-routing.ts");
const { routeFor, LOCALE_COOKIE, LOCALE_PARAM, PERMANENT_REDIRECT_STATUS } = routing;

/** Paths that exist under every locale, including the prefix-free root. */
const SAMPLE_PATHS = ["/", "/products", "/quality", "/request-quote", "/manufacturing", "/about"];
const ALL_LOCALES = [...locales];

/**
 * Exactly what `switchHref` in src/components/layout/site-header.tsx builds.
 * Kept here as a function, and asserted against the component below, so a change
 * to the component that drops the English hint fails this suite instead of
 * silently making the two disagree.
 */
const pickerHref = (basePath, target) =>
  `${localePath(basePath, target)}${target === "en" ? `?${LOCALE_PARAM}=en` : ""}`;

/** Follow the hops the way a browser does, cookie rewrite included. */
function followClick(basePath, fromLocale, toLocale, staleCookie) {
  const href = pickerHref(basePath, toLocale);
  const [pathname, query = ""] = href.split("?");
  const hint = new URLSearchParams(query).get(LOCALE_PARAM);
  const hops = [];
  let current = { pathname, selectedLocale: hint, savedLocale: staleCookie };
  for (let i = 0; i < 6; i++) {
    const decision = routeFor(current);
    hops.push({ input: { ...current }, decision });
    if (decision.kind === "serve") return { decision, hops };
    current = {
      pathname: decision.target,
      selectedLocale: decision.stripLocaleParam ? null : current.selectedLocale,
      savedLocale: decision.persist ?? current.savedLocale,
    };
    if (decision.target === current.pathname && decision.stripLocaleParam === false) {
      return { decision, hops, loop: true };
    }
  }
  return { decision: hops[hops.length - 1].decision, hops, loop: true };
}

/* ---------------------------------------------------------------- 1 & 2 */
test("REQ 1 · every picker click lands in the language that was clicked", () => {
  const mismatches = [];
  for (const basePath of SAMPLE_PATHS) {
    for (const from of ALL_LOCALES) {
      for (const to of ALL_LOCALES) {
        for (const stale of [null, ...ALL_LOCALES, "pt"]) {
          const { decision, loop } = followClick(basePath, from, to, stale);
          if (loop) {
            mismatches.push(`LOOP ${localePath(basePath, from)} -> ${pickerHref(basePath, to)} (cookie=${stale ?? "none"})`);
          } else if (decision.locale !== to) {
            mismatches.push(
              `${localePath(basePath, from)} -> click "${localeLabels[to]}" (${pickerHref(basePath, to)}) `
              + `cookie=${stale ?? "none"} landed ${decision.locale} at ${decision.target}`,
            );
          }
        }
      }
    }
  }
  assert.deepEqual(mismatches, [], `${mismatches.length} picker clicks do not land where they point:\n${mismatches.slice(0, 12).join("\n")}`);
});

test("REQ 1 · the click is settled in one hop, so no intermediate can re-decide", () => {
  // A two-hop click is where a stale cookie gets a second chance to win, so the
  // English hint in particular must be consumed by the hop that honours it.
  for (const basePath of SAMPLE_PATHS) {
    for (const from of ALL_LOCALES) {
      for (const to of ALL_LOCALES) {
        const { hops } = followClick(basePath, from, to, to === "en" ? "de" : null);
        const first = hops[0].decision;
        if (from === to) continue;
        assert.ok(hops.length <= 2,
          `${localePath(basePath, from)} -> ${pickerHref(basePath, to)} took ${hops.length} hops`);
        if (to === "en") {
          assert.equal(first.locale, "en", `the English hint was not honoured on the first hop from ${from}`);
          assert.equal(first.stripLocaleParam, true, "the one-time hint must not survive the hop that used it");
        }
      }
    }
  }
});

test("REQ 2 · an explicit click outranks every stored preference", () => {
  for (const saved of ALL_LOCALES) {
    for (const chosen of ALL_LOCALES) {
      const decision = routeFor({
        pathname: localePath("/products", saved),
        selectedLocale: chosen,
        savedLocale: saved,
      });
      assert.equal(decision.locale, chosen, `?${LOCALE_PARAM}=${chosen} lost to cookie ${saved}`);
      assert.equal(decision.persist, chosen, "the click must also replace the stored preference");
    }
  }
  // A retired cookie value is not a locale and must not survive as a choice.
  const retired = routeFor({ pathname: "/products", selectedLocale: "es", savedLocale: "pt" });
  assert.equal(retired.locale, "es");
});

/* -------------------------------------------------------------------- 3 */
test("REQ 3 · no cookie-dependent relocation may be cached by a browser", () => {
  // This is the "sometimes" trap: a 308 for `/products` -> `/de/products` would
  // be stored by the browser and re-fire on a later visit that carried no hint,
  // reproducing the reported bug with nothing left in the code to find.
  const offenders = [];
  for (const basePath of SAMPLE_PATHS) {
    for (const saved of ALL_LOCALES) {
      const decision = routeFor({ pathname: localePath(basePath, "en"), selectedLocale: null, savedLocale: saved });
      if (decision.kind === "redirect" && decision.permanent) {
        offenders.push(`${localePath(basePath, "en")} cookie=${saved} -> ${decision.target} as ${PERMANENT_REDIRECT_STATUS}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `cacheable cookie-driven redirects:\n${offenders.join("\n")}`);

  // The permanent ones are the retired-prefix and /en consolidations, and each
  // must land on the English owner — a cached hop to a *non*-English URL would
  // be the same bug wearing a different hat.
  for (const stale of ["pt", "ru", "ar", "tr", "vi", "id", "en"]) {
    const decision = routeFor({ pathname: `/${stale}/products`, selectedLocale: null, savedLocale: null });
    assert.equal(decision.permanent, stale !== "en" ? true : true, `/${stale}/products must consolidate permanently`);
    assert.equal(decision.locale, "en", `/${stale}/products consolidated to ${decision.locale}`);
    assert.equal(decision.target, "/products", `/${stale}/products did not reach the English owner`);
  }
});

/* -------------------------------------------------------------------- 4 */
test("REQ 4 · the picker's labels and targets cannot drift apart", () => {
  assert.deepEqual(Object.keys(localeLabels), ALL_LOCALES,
    "a locale without a label, or a label for a retired locale");
  // Each label must be the language it names, so "English" can never point at
  // `de` — the literal form of the reported symptom.
  const byLabel = new Map(ALL_LOCALES.map((l) => [localeLabels[l], l]));
  assert.equal(byLabel.size, ALL_LOCALES.length, "two locales share one label");
  assert.equal(byLabel.get("English"), "en");
  assert.equal(byLabel.get("Deutsch"), "de");
  assert.equal(byLabel.get("Español"), "es");
  assert.equal(byLabel.get("简体中文"), "zh");
  // Each language is offered by its own name (an endonym), because that is the
  // only form a visitor who cannot read the current page can still recognise.
  assert.match(localeLabels.es, /[áéíóúñ]/, "Español must carry its own accents");
  assert.match(localeLabels.de, /Deutsch/, "German must be offered as Deutsch, not German");
  assert.match(localeLabels.zh, /[一-鿿]{2,}/, "Chinese must be offered in Chinese characters");
  assert.match(localeLabels.en, /^English$/, "English must be offered as English");
  for (const l of ALL_LOCALES) {
    assert.ok(typeof htmlLang[l] === "string" && htmlLang[l].length > 1, `${l} has no BCP-47 tag`);
  }
});

test("REQ 4 · both header switchers build their hrefs the same way", () => {
  const header = read("src/components/layout/site-header.tsx");
  const uses = (header.match(/href=\{switchHref\(l\)\}/g) || []).length;
  assert.equal(uses, 2, `desktop and mobile switchers must share one href builder, found ${uses}`);
  assert.match(header, new RegExp(`\\?\\$\\{LOCALE_PARAM\\}|\\?_${LOCALE_PARAM}=|target === "en"`),
    "the English option must carry the one-time hint");
  assert.doesNotMatch(header, /href=\{localePath\(path,\s*target\)\}(?!\s*\+\s*\?)/,
    "a switcher href built without the English hint cannot express English at all");
  // The hint is only ever needed for the prefix-free locale.
  for (const l of ALL_LOCALES.filter((x) => x !== "en")) {
    assert.ok(!/[?&]_locale=/.test(pickerHref("/products", l)), `${l} must not need a hint`);
  }
});

/* --------------------------------------------------- proxy wiring (source) */
test("REQ 5 · the proxy executes the decision without adding a rule of its own", () => {
  const proxy = read("src/proxy.ts");
  assert.match(proxy, /url\.searchParams\.get\(LOCALE_PARAM\)/,
    "the proxy must read the hint from the URL, not from the body or a header");
  assert.match(proxy, /request\.cookies\.get\(LOCALE_COOKIE\)/, "the proxy must pass the stored preference in");
  assert.match(proxy, /routeFor\(/, "the decision must come from locale-routing");
  assert.doesNotMatch(proxy, /accept-language|Accept-Language|x-vercel-ip-country|geo/i,
    "no browser header or geography may choose a locale");
  // Both branches must persist what was served, or the next unprefixed visit
  // re-decides from a stale cookie.
  assert.match(proxy, /decision\.persist === null \? response : persistLocale/,
    "serve branch must write the cookie unless the decision says leave it");
  assert.match(proxy, /return persistLocale\(response, decision\.persist\)/,
    "redirect branch must write the cookie");
  // The matcher has to cover the prefix-free owner, or English is unpolicied.
  const matcher = /matcher:\s*\[([^\]]+)\]/.exec(proxy)?.[1] ?? "";
  assert.match(matcher, /\.\*/, `matcher is empty or malformed: ${matcher}`);
  assert.doesNotMatch(matcher, /\[\^.*\bde\b/, "the matcher must not exclude locale prefixes");
  assert.equal(LOCALE_COOKIE, "threethai_locale");
  assert.equal(LOCALE_PARAM, "_locale");
});
