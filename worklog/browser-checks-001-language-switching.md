# Worklog — BROWSER-CHECKS-001 Language switching, checked in a browser

## 2026-09-10 — Institutionalise the browser verification, and the defect it exposed

Branch `qwen/browser-checks-001-language-switching`, base `19d1349` (the merge of
PR #36, INTL-DEES-001). Opened as a follow-up PR, not merged. No Task Card is
registered for this work — the owner asked for it directly after reviewing INTL-DEES-001;
board registration is left to ORCHESTRATOR.

### Why this exists

INTL-DEES-001 shipped a language picker whose routing was verified 320-ways in a pure
function while, in a browser, clicking English took a visitor to German. Three separate
defects lived in that gap, and none of them was visible to any test in the repository:

1. the English entry travelled as `?_locale=en`, a hint stripped on arrival;
2. after that was fixed, the entry travelled as `/en/<path>` via `next/link`, and the
   client router answered it out of its own prefetch data without consulting the proxy —
   `/es/products` → `/de/products`, `/zh/quality` → `/es/quality`;
3. after that was fixed with plain anchors, the *second* click in a profile still failed.

The owner's instruction was to keep the checks that had just been run by hand
("我已经merge了，可以沉淀下来吧"). So they became the repository's first browser suite.

### What was built

`tests/support/chrome-cdp.mjs` drives the installed Chrome over the DevTools Protocol
with Node's global `WebSocket` and `Input.dispatchMouseEvent` — **no new dependency**.
Neither alternative was usable: Playwright's browser download is not viable on this
link, and Computer Use cannot observe a window here because the published UIAccess
worker is unsigned (`qwen-cua-driver-uia.exe`, `NotSigned`). That signature gate is not
bypassed; it is the reason CDP is used instead.

`tests/browser-language-switching.mjs` — 7 checks, run by `npm run test:browser`
against `.next/standalone/server.js`, the entrypoint production actually runs:

| check | what it can see that no other test can |
| --- | --- |
| one click reaches the clicked language, 4 starts × 4 targets | the click → router → proxy → document chain |
| English navigates through the proxy, not the client router | the `/en/<path>` hop's status and `Location`, plus `/pt`'s |
| clicking English again in the same profile still lands in English | a cached redirect swallowing its own `Set-Cookie` (defect 3) |
| the menu is closed on arrival, `<html lang>` followed | a container closed synchronously inside its own click |
| one click from the mobile dialog | the same swallow, in the Radix drawer |
| the notice offers, then stands down after a real choice | `localStorage` dismissal, which an `httpOnly` cookie cannot express |
| nothing advertises an `/en` URL | canonical / hreflang strings in the built HTML |

Availability is decided at run time, not at import: no browser or no build makes the
file report **skipped**, and `REQUIRE_BROWSER=1` turns that skip into a failure, the
same convention as `REQUIRE_BUILD_OUTPUT=1` in the SEO suites. Both the skip path and
the failure path were observed, not assumed.

One browser per window shape for the whole file, with the preference cookie and web
storage cleared before each test — per-test process churn measured as a source of
instability (a test starting while the previous Chrome's children were still exiting).

### The product defect this caught, and its fix

`src/content/locale-routing.ts` rule 2 made `/en/*` a **308**. Measured in Chrome, same
profile, clicking English from `/es`:

```
1st (cold)  -> /            2nd (warm) -> /es        3rd (warm) -> /es
with Network.setCacheDisabled: 4th, 5th -> /
server, every time: 308 -> / | set-cookie: threethai_locale=en
```

A stored redirect is not revalidated, so its `Set-Cookie` is applied once — on the very
click that can least afford it. `threethai_locale` stayed at the language being left,
and the saved-preference rule moved the visitor straight back. The picker's permanence
*was* the defect, so permanence is now only on the six retired prefixes, whose
consolidation GSC-INDEX-002 needs and which carry no preference:

- `/en/*` → `307`, `Set-Cookie` on every click, still one hop onto the prefix-free owner;
- `/pt|ru|ar|tr|vi|id/*` → `308` unchanged.

Three other cards' suites had pinned `permanent: true` for the alias
(`gsc-locale-003a` REQ 10/11/18, `locale-retire-001` REQ 17, `language-switcher-roundtrip`
REQ 2/3). All three were updated with the measurement in a comment rather than deleted,
and `tasks/gsc-locale-003a-stable-english-owner.md` carries a dated **Amendment**
section — that card specified the 308, so the change is recorded against it, not hidden.
`language-switcher-roundtrip` also had a nonsense assertion (`stale !== "en" ? true : true`)
which asserted nothing in either branch; it now states the real rule. The card's
acceptance rows were re-measured after the change:

```
/en                                     307 -> /                                     cookie en  final 200
/en/products/water-soluble-pva-yarn     307 -> /products/water-soluble-pva-yarn       cookie en  final 200
/en/answers                             307 -> /answers                              cookie en  final 200
/en/quality                             307 -> /quality                              cookie en  final 200
/en/answers?utm_source=x                307 -> /answers?utm_source=x                 cookie en  final 200
/en/products/definitely-not-a-real-slug 307 -> …/definitely-not-a-real-slug          cookie en  final 404
/en/answers?_locale=pt                  307 -> /answers                              cookie en  final 200
/pt/products                            308 -> /products                             cookie en  final 200
```

### Harness hardening the suite needed before it could be trusted

`waitForCentre` accepted any non-zero rectangle, so a click could be delivered to a
panel that was still animating. It now requires the box to hold still across two reads
**and** `document.elementFromPoint` to resolve that point to the element (or its own
child) — the precondition the "one click" claim is actually about. Same failure mode as
the product defect: measuring too early produced a no-op indistinguishable from the bug.

### Verification

- `npm run lint`, `npm run typecheck`: clean.
- `npm run build`: 225 pages, 0 dynamic routes.
- `REQUIRE_BUILD_OUTPUT=1 npm run test:seo`: **221/221**, unchanged count.
- `REQUIRE_BROWSER=1 npm run test:browser`: **7/7**, and **10/10 consecutive green runs**
  after the hardening (before it, 1 run in 5 failed on the mobile check).
- Mutation, each mutant *rebuilt* — a source edit without a build changes nothing the
  browser can see:

| mutant | result |
| --- | --- |
| `/en` alias back to `permanent: true` | caught by 2 checks: the `307` assertion and "clicking English again…" — the suite would have caught the shipped bug |
| retired prefixes to `permanent: false` | caught by the `/pt` `308` assertion alone; the repeated-click check correctly stays green |

The matrix check passes under the first mutant: one click per page from reset state is
exactly the case the cached alias handled correctly, which is why the dedicated
repeated-click check exists. The tree was restored by writing saved copies (never
`git checkout`, which would destroy uncommitted work) and re-verified green;
`git status` after the experiment is byte-identical to before it.

### Costs and limits stated plainly

- The suite needs `npm run build` first, and skips without one. It is **not wired into
  CI** — no approval for that was given, and the 11 s plus a Chrome spawn per run is not
  free on the current runner.
- `reset()` clears cookies and storage but **not** the HTTP cache, deliberately: that is
  where the defect under test lives.
- Coverage is the language switcher, the notice and the `/en` declaration. The rest of
  the commercial paths are still verified by content and SEO assertions, not by clicks.

### Next (unchanged from INTL-DEES-001)

ES/DE answers and knowledge article bodies remain phase 2 per the owner's ruling
(38–41% English on those detail pages); nothing here promotes a page — all 18 evidence
records are still `draft` with `reviewedOn` unset.
