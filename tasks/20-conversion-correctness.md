# Task 20 — Conversion Correctness Bundle

Status: COMPLETE

## Includes

Backlog tasks 20, 21, and 22.

## Goal

Make inquiry errors actionable, preserve Product Finder locale and qualification
context, and turn quote-page Finder guidance into a real action.

## Allowed files

- `src/components/forms/inquiry-form.tsx`
- `src/components/forms/product-finder.tsx`
- `src/app/(site)/request-quote/page.tsx`
- `src/app/zh/request-quote/page.tsx`
- `src/app/[lang]/request-quote/page.tsx`

## Forbidden

- Inquiry persistence, email, database, schema, global layout, navigation, SEO helper.
- New dependencies or analytics.

## Acceptance criteria

- Name, email, and message server errors are visible and announced.
- Non-field persistence failures use an honest retry/direct-contact message.
- Finder quote/sample/product destinations preserve all supported locales.
- Finder passes product, application, temperature, and specification context.
- Inquiry form safely preloads the passed context without inventing values.
- Every quote-page Finder panel links to the locale-correct Finder route.
- Keyboard behavior and existing English/Chinese labels remain intact.

## Model

Luna high for analysis and patch review; Agent 0 integrates source.

## Checks

- Typecheck, lint, production build.
- Static assertions for generated Finder URLs and field error associations.
