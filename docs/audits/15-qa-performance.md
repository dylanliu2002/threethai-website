# Task 15 — Static QA, Accessibility, and Performance Audit

## Executive summary

No source-confirmed P0 issue was found. The highest-risk confirmed defects are
production builds ignoring TypeScript errors, wrong document language for
localized routes, blank screen-reader validation messages, and insufficient
contrast for small gold text on light surfaces.

No Lighthouse, Core Web Vitals, responsive, or browser result is claimed here.

## Confirmed findings

### P1

1. `next.config.ts` sets `typescript.ignoreBuildErrors: true`; production can ship
   type defects. Lint is a separate script rather than a required build gate.
2. Root `<html lang="en">` remains wrong on localized pages.
3. Inquiry form passes boolean error flags, but the error region renders text only
   for strings. Invalid controls therefore reference an empty error message.
4. `--gold-deep: #c07f1a` is approximately 3.34:1 on white and 3.06:1 on the
   warm light surface, below 4.5:1 for normal-sized text in current usages.

### P2

- Mobile navigation lacks modal/focus-transfer/focus-return/background-isolation
  behavior even though Escape handling exists.
- Active navigation state fails on prefixed locale paths.
- Article schema references missing `/og.png`.
- Product schema uses English-root entity URLs on locale-prefixed pages.
- English answer metadata bypasses the shared multilingual helper.
- Parallel `(site)`, `zh`, and `[lang]` route trees create parity/regression risk.
- Global header and Toaster hydration may be broader than necessary.
- The priority logo may compete with actual LCP hero images.
- Inquiry Suspense fallback appears much shorter than the full form, creating a
  source-backed CLS risk that needs measurement.
- No frontend test script or route/form/keyboard regression suite exists.

### P3

- Footer/breadcrumb links do not consistently define explicit `focus-visible` styles.
- Form pending state lacks `aria-busy` or an announced status.
- `reactStrictMode` is disabled, reducing development-time diagnostics.

## Accessibility baseline

Confirmed strengths include semantic landmarks, labeled form controls, native
required/email/min-length validation, useful autocomplete values, appropriate
button types, native details/summary controls, Next Image use, hidden decorative
SVGs, product-finder progress/pressed semantics, and reduced-motion CSS.

Browser and assistive-tech verification is still required for tab order, focus
visibility, screen-reader announcements, mobile-menu isolation, RTL ordering,
hero contrast, form failure states, overflow, redirects, and 404 behavior.

## Performance risk register

| Area | Source-backed risk | Required measurement |
| --- | --- | --- |
| LCP | Global priority logo can compete with page hero; global fonts | LCP resource, preload order, decode and font timing |
| CLS | Form Suspense fallback likely under-reserves height | Cold-load CLS on quote, sample, contact |
| INP | Client header, body scroll mutation, blur, broad transitions | Menu, finder, language, and form interactions |
| Bundle | Global header/toast hydration; several large unused-looking dependencies | Production chunk graph before removal |
| Images | Public image/PDF footprint is material; some certificate images are large | Actual optimized payload, formats, widths, cache headers |
| Delivery | Caddyfile shows reverse proxy only | Deployed compression and cache headers |

## Browser matrix for the verification phase

| Width | Focus |
| --- | --- |
| 390 px | Home LCP, mobile menu focus/scroll lock, finder, forms, overflow, FAQ |
| 768 px | Breakpoint transitions, menu offset, two-column layouts, table overflow |
| 1440 px | Desktop nav/aria-current, hero crop, grids, certificate gallery, focus |
| 1920 px | Max-width behavior, raster sizing, sticky-header cost, alignment |

Test representative English, Chinese, Arabic, and German routes; include home,
products/detail, applications, quality, conversion forms, one article, one answer,
legacy redirects, and invalid slugs.

## Prioritized work

1. Fix field-specific error messages and add automated form a11y coverage.
2. Make `<html lang>` and RTL route-aware.
3. Darken/replace light-surface gold text tokens.
4. Add mobile-menu focus trap, focus return, modal semantics, and background isolation.
5. Normalize localized active-path behavior.
6. Remove `ignoreBuildErrors`; require typecheck/lint in production validation.
7. Correct schema image and localized entity URLs.
8. Add parity tests or consolidate route ownership.
9. Measure form CLS before changing the fallback.
10. Inspect production chunks before dependency or provider refactors.
11. Verify image optimization and deployed headers.
12. Add responsive browser regression coverage.

Shared files requiring orchestrator coordination include root layout, header,
global CSS, Next config, SEO helper, package scripts, and route-tree ownership.

No browser, server, dependency installation, or file edit was performed.
