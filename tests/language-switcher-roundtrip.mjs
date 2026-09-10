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
const { suggestedLocaleFor, pathWithoutLocale } = await importSource("src/content/locale-suggestion.ts");
const { clientLabels } = await importSource("src/content/site-copy.ts");
const routing = await importSource("src/content/locale-routing.ts");
const { routeFor, LOCALE_COOKIE, LOCALE_PARAM, PERMANENT_REDIRECT_STATUS } = routing;

/** Paths that exist under every locale, including the prefix-free root. */
const SAMPLE_PATHS = ["/", "/products", "/quality", "/request-quote", "/manufacturing", "/about"];
const ALL_LOCALES = [...locales];

/**
 * Exactly what `switchHref` in src/components/layout/site-header.tsx builds.
 * Kept here as a function, and asserted against the component below, so a change
 * to the component that expresses English some other way fails this suite
 * instead of silently making the two disagree.
 */
const pickerHref = (basePath, target) =>
  target === "en" ? `/en${basePath === "/" ? "" : basePath}` : localePath(basePath, target);

/** Follow the hops the way a browser does, cookie rewrite included. */
function followClick(basePath, fromLocale, toLocale, staleCookie) {
  const href = pickerHref(basePath, toLocale);
  const [pathname, query = ""] = href.split("?");
  const hint = new URLSearchParams(query).get(LOCALE_PARAM);
  const hops = [];
  // A loop is a path visited twice, which is what a browser actually detects.
  // (Comparing a decision's target against the state already advanced to that
  // target reports a loop on every ordinary redirect — which is how this line
  // first read, and it fired on the /en hop.)
  const visited = new Set([pathname]);
  let current = { pathname, selectedLocale: hint, savedLocale: staleCookie };
  for (let i = 0; i < 6; i++) {
    const decision = routeFor(current);
    hops.push({ input: { ...current }, decision });
    if (decision.kind === "serve") return { decision, hops };
    if (visited.has(decision.target)) return { decision, hops, loop: true };
    visited.add(decision.target);
    current = {
      pathname: decision.target,
      selectedLocale: decision.stripLocaleParam ? null : current.selectedLocale,
      savedLocale: decision.persist ?? current.savedLocale,
    };
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
          assert.equal(first.locale, "en", `the English entry was not honoured on the first hop from ${from}`);
          // English states itself in the path now, so there is no parameter left
          // to consume: a second hop may re-decide from a weaker signal, and this
          // is the assertion that notices if that ever becomes the landing path.
          assert.equal(first.stripLocaleParam, false,
            "the English entry carries no query parameter, so nothing should be stripping one");
          // REQ 3's own rule applies to the alias: it persists a preference, so a
          // cached copy of it would stop delivering that preference.
          assert.equal(first.permanent, false, "a cached /en hop would swallow the picker's cookie");
          assert.equal(first.target, localePath(basePath, "en"),
            `the /en alias must consolidate onto the English owner, got ${first.target}`);
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

  // The permanent ones are the retired-prefix consolidations, and each must land
  // on the English owner — a cached hop to a *non*-English URL would be the same
  // bug wearing a different hat. `/en` is in this loop because it must reach the
  // same owner in one hop, but it is deliberately temporary: unlike `/pt`, it is
  // the live target of the language picker and it writes the preference cookie,
  // so caching it re-creates the bug this requirement exists to prevent.
  for (const stale of ["pt", "ru", "ar", "tr", "vi", "id", "en"]) {
    const decision = routeFor({ pathname: `/${stale}/products`, selectedLocale: null, savedLocale: null });
    assert.equal(decision.permanent, stale !== "en", `/${stale}/products permanence is wrong`);
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
  // English must be expressed in the path, not in a query parameter: a parameter
  // is consumed on arrival, so a bookmark or shared link of it carries no intent.
  assert.match(header, /target === "en" \? `\/en\$\{/,
    "the English option must link through the /en alias, not a one-time hint");
  assert.doesNotMatch(header, /\?_locale=/,
    "a leftover ?_locale= in the switcher means English is back to stating itself in a query string");
  for (const l of ALL_LOCALES.filter((x) => x !== "en")) {
    assert.ok(!/[?&]_locale=/.test(pickerHref("/products", l)), `${l} must not need a hint`);
  }
});

test("REQ 4 · the English entry stays English whatever the cookie says", () => {
  // The whole point of routing English through the alias. If a future change
  // makes the alias consolidate without persisting its locale, this is the test
  // that fails — the reported bug returns the moment that happens.
  for (const basePath of SAMPLE_PATHS) {
    for (const stale of [null, ...ALL_LOCALES, "pt"]) {
      const alias = `/en${basePath === "/" ? "" : basePath}`;
      const first = routeFor({ pathname: alias, selectedLocale: null, savedLocale: stale });
      assert.equal(first.locale, "en", `${alias} did not resolve to English with cookie=${stale ?? "none"}`);
      assert.equal(first.persist, "en", `${alias} did not record the preference that keeps it English`);
      const second = routeFor({ pathname: first.target, selectedLocale: null, savedLocale: first.persist });
      assert.equal(second.locale, "en", `${alias} landed on ${second.locale} after the hop`);
      assert.equal(second.kind, "serve", `${alias} did not settle in two hops`);
    }
  }
});

/* ------------------------------------------------------- language notice */
test("REQ 6 · the browser's own preferences map onto a site language, or nothing", () => {
  const cases = [
    [["de-AT", "en"], "en", "de"],
    [["es-MX", "es"], "en", "es"],
    [["zh-CN", "en"], "de", "zh"],
    [["en-GB"], "en", null],
    [["fr-FR", "de"], "en", "de"],
    [["de"], "de", null],
    [["pt-BR"], "en", null],
    [[], "en", null],
    [["  ", "de-DE"], "en", "de"],
  ];
  for (const [preferred, current, expected] of cases) {
    assert.deepEqual(suggestedLocaleFor(preferred, current), expected,
      `${JSON.stringify(preferred)} on a ${current} page`);
  }
  // A retired code must never be suggested: there is no page to suggest.
  for (const retired of ["pt", "ru", "ar", "tr", "vi", "id"]) {
    assert.equal(suggestedLocaleFor([retired], "en"), null, `${retired} is retired and cannot be suggested`);
  }
  // The path strip must agree with the picker about what a locale prefix is.
  assert.equal(pathWithoutLocale("/de/products"), "/products");
  assert.equal(pathWithoutLocale("/products"), "/products");
  assert.equal(pathWithoutLocale("/"), "/");
  assert.equal(pathWithoutLocale("/pt/products"), "/pt/products", "a retired prefix is not a locale to strip");
});

test("REQ 6 · the notice can only ever be a link, never a navigation", () => {
  // "Non-blocking" is what GSC-LOCALE-003A's own documentation asks of any
  // browser-signal affordance. It is only real if the component holds no way to
  // move the browser, so that is asserted rather than commented.
  const notice = read("src/components/layout/locale-suggestion.tsx");
  // Reading the address is how the notice builds its own link; writing it is a
  // redirect. An assertion that forbids both forbids the component's purpose.
  assert.doesNotMatch(notice, /location\.href\s*=|location\.assign\(|location\.replace\(|location\.reload|document\.location\s*=/,
    "the notice must not navigate; a suggestion that redirects is the removed geo rule in disguise");
  assert.doesNotMatch(notice, /useRouter|router\.push|router\.replace/, "the notice must not navigate");
  assert.doesNotMatch(notice, /fetch\(|XMLHttpRequest|axios/, "the notice must not call anything");
  assert.match(notice, /"use client"/, "the notice must be client-side, or it decides the served document");
  // A server snapshot of null is what keeps the prerendered HTML identical for
  // every visitor; a setState-in-effect would re-render instead and is rejected by
  // the repo's own lint rule.
  assert.match(notice, /useSyncExternalStore\(\s*subscribe,\s*getSnapshot,\s*\(\)\s*=>\s*null\s*\)/,
    "the notice must render nothing on the server, via a store snapshot rather than an effect");
  assert.doesNotMatch(notice, /useState|useEffect/,
    "the notice must not carry render-time state; it subscribes to the browser instead");
  assert.doesNotMatch(notice, /document\.cookie\s*=/,
    "dismissal belongs in localStorage; a cookie the server would then read is a request-time signal again");
  // Its module graph must stop short of the gate: this is browser code, and
  // INTL-DEES-003B measured what it costs when the gate is reachable from here.
  for (const rel of ["src/components/layout/locale-suggestion.tsx", "src/content/locale-suggestion.ts"]) {
    assert.doesNotMatch(
      read(rel),
      /from ["'](@\/content|\.\.)\/(locale-routing|translation-availability|translation-evidence)["']/,
      `${rel} reaches the routing or gate modules, which would ship the SEO gate to browsers`,
    );
  }
});

test("REQ 6 · no server render may read a browser header", () => {
  // If a layout consulted Accept-Language, every English page would become
  // per-requester and stop being prerendered — 57 documents answered differently
  // to Google than to the visitor who bookmarked them.
  for (const rel of [
    "src/app/(site)/layout.tsx", "src/app/[lang]/layout.tsx", "src/app/zh/layout.tsx",
    "src/components/layout/root-document.tsx", "src/content/locale-routing.ts", "src/proxy.ts",
  ]) {
    assert.doesNotMatch(read(rel), /headers\(\)|Accept-Language|acceptLanguage/i,
      `${rel} must not let a browser header decide what is rendered`);
  }
});

test("REQ 6 · the notice is written in the language it offers", () => {
  for (const l of ALL_LOCALES) {
    for (const key of ["localeNotice", "localeNoticeLink", "localeNoticeDismiss"]) {
      const value = clientLabels[l]?.[key];
      assert.ok(typeof value === "string" && value.trim().length > 1, `${l}.${key} is missing`);
    }
  }
  assert.match(clientLabels.de.localeNoticeLink, /Deutsch/);
  assert.match(clientLabels.es.localeNoticeLink, /español/);
  assert.match(clientLabels.zh.localeNoticeLink, /[一-鿿]/);
});

test("REQ 7 · a link handler may not close the container the link lives in", () => {
  // The reported symptom was "I click and nothing happens, then I click again".
  // The cause is structural, not a race to be tuned: calling setOpen(false) or
  // details.open = false inside the link's own onClick removes the <a> while its
  // click is still being processed, so the navigation can be dropped — and it only
  // happens after hydration, which is what made it look random. Closing is derived
  // from `pathname` instead, so this asserts the shape of the file.
  const header = read("src/components/layout/site-header.tsx");
  assert.doesNotMatch(header, /onClick=\{\s*\(\)\s*=>\s*setOpen\(false\)\s*\}/,
    "a link must not close the dialog synchronously on click");
  assert.doesNotMatch(header, /onClick=\{[^}]*closest\("details"\)[^}]*\.open\s*=/s,
    "a link must not close the <details> synchronously on click");
  // Count statements, not mentions: the prose above the state also names the call.
  const synchronousCloses = (header.match(/setOpen\(false\);/g) || []).length;
  assert.ok(synchronousCloses <= 1,
    `at most one synchronous close is allowed (the current-language no-op); found ${synchronousCloses}`);
  // The no-op branch has to come first, so a real navigation is never touched.
  assert.equal((header.match(/if \(l === locale\) \{/g) || []).length, 2,
    "both switchers must handle the current-language no-op first, one per locale list");
  assert.match(header, /const dialogOpen = open && openedOn === pathname;/,
    "the panel must close because the path it was opened on is gone");
  assert.match(header, /<DialogPrimitive\.Root\s*\n?\s*open=\{dialogOpen\}/,
    "the dialog must render the derived state, not the raw one");
  assert.match(header, /ref=\{detailsRef\}/, "the desktop menu must be reachable to close");
  assert.match(header, /useEffect\(\(\) => \{\s*if \(detailsRef\.current\)[\s\S]{0,80}\}, \[pathname\]\);/,
    "the desktop menu must close on navigation, in an effect keyed to the path");

  // A language is a document, not a client-route transition. Verified in Chrome:
  // with next/link, English (the prefix-free owner, reached only through the /en
  // alias and its 308) was resolved by the router out of its prefetch data and
  // landed the visitor on a different locale entirely — clicking English from /es
  // arrived at /de. An anchor goes through the proxy, which is where the alias and
  // the preference are actually decided.
  assert.equal((header.match(/<a[\s\S]{0,80}href=\{switchHref\(l\)\}/g) || []).length, 2,
    "both locale lists must navigate with real anchors, not next/link");
  assert.equal((header.match(/<Link[\s\S]{0,80}href=\{switchHref\(l\)\}/g) || []).length, 0,
    "a switcher link routed through the client router can resolve /en/<path> wrongly");

  // And the choice must be visible to JS, or the language notice never stands down:
  // the proxy's cookie is httpOnly.
  assert.equal((header.match(/markLocaleChosen\(\);/g) || []).length, 2,
    "both switchers must record the choice where the notice can read it");
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
