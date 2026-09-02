# Task 13 — Conversion and Lead Generation Audit

## Executive summary

The product-detail journey is the strongest existing conversion path because it
carries product context into sample and quote forms. The main defects occur in
localized Product Finder journeys and in context handoff: the finder collects
four answers but discards application and specification, then sends localized
users to English-root conversion routes.

No root-English funnel blocker was confirmed. No conversion rate or customer
behavior is inferred from source.

## Journey findings

| Journey | Strength | Friction |
| --- | --- | --- |
| Home → quote/sample | Clear category and removal-condition continuity | No product/application context is passed |
| Products → detail → inquiry | Product context is prefilled | Temperature table has only a quote path; extended formats go generic |
| Applications → detail → inquiry | Application slug is passed | Process details and lower-page quote action are missing |
| Finder → result → inquiry | Good four-step qualification concept | Locale breaks; two answers discarded; specification does not affect result |
| Knowledge/answers → inquiry | High-intent educational path | Generic CTAs force the buyer to restate subject and conditions |
| Contact → form/direct channel | Strong fallback with email, phone, WhatsApp | Contact form is lightly qualified by design |

## Confirmed priority findings

### P1

1. Finder result links hardcode `/request-quote` and `/request-sample`, so users
   leave `/zh`, `/de`, `/ar`, and other localized journeys at conversion time.
2. Finder captures material form, application, temperature, and specification,
   but only product and temperature reach the inquiry form.
3. Quote pages show a Product Finder explanatory panel without an actionable link.
4. Persistence failures are shown as “check highlighted fields” even when no
   field error exists.
5. Inquiry persistence can succeed while SMTP notification is skipped; the buyer
   still sees success. Production safety therefore depends on environment and
   operational monitoring.

### P2

- Localized header active state compares prefixed paths with unprefixed routes.
- Static Chinese home omits the technical knowledge section used by other homes.
- English sample metadata points its Chinese alternate to the quote route.
- Knowledge and answer CTAs do not pass useful content context.

### P3

No conversion measurement layer was found in the reviewed app and components.

## CTA matrix

| Page type | Primary | Secondary | Improvement |
| --- | --- | --- | --- |
| Home | Request quote | Explore products | Carry context; surface sample at risk-reduction moments |
| Product detail | Request sample | Request quote | Retain; strongest current journey |
| Application detail | Request sample | Request quote | Preserve application/process context; restore quote lower down |
| Finder result | Technical inquiry | Request sample | Preserve locale and all selected answers |
| Knowledge/answer | Request sample | Contact | Add subject/product/temperature context |
| Contact | Form/direct contact | Quote | Keep low-friction fallback; decide qualification policy |
| Quote | Submit request | Direct contact | Make Finder panel actionable |
| Sample | Submit request | Direct contact | Clarify response and sample-process expectations |

## Form recommendations

### Unblocked fixes

- Generate locale-safe finder destinations with `URLSearchParams`.
- Carry application and specification into the inquiry handoff.
- Add a real Finder link to quote pages.
- Distinguish validation, persistence, and notification errors in the UI.
- Add contextual query parameters to relevant resource CTAs.
- Provide WhatsApp as a fallback on quote/sample pages.

### Owner decisions

- Which qualification fields are required for quote, sample, and contact.
- Progressive form versus one long form.
- Whether to support attachments.
- Response-time promise and escalation ownership.
- Whether contact remains intentionally low-friction.

## Measurement design

After privacy/vendor decisions, instrument non-PII events for:

- CTA impression/click by route, locale, destination, product, application;
- finder steps, options, completion, result CTA, and restart;
- inquiry view, context loaded, validation error, attempt, success, error category;
- direct contact channel clicks;
- server-side persisted, persistence error, notification skipped/error.

Do not log raw form values or personal data.

## Prioritized work and dependencies

1. Fix locale-safe finder links and preserve all useful answers.
2. Add quote-page Finder action and contextual resource CTAs.
3. Separate form validation and persistence failure states.
4. Add operational notification health/alerting before relying on success alone.
5. Fix localized header active state and sample alternate metadata.
6. Decide qualification, SLA, attachments, and privacy behavior.
7. Add analytics only after privacy and ownership are agreed.

Shared coordination is required for header/footer, inquiry persistence, global
analytics bootstrap, and any database attribution fields.

No form was submitted and no files were edited.
