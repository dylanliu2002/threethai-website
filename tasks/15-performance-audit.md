# Task 15 — QA, Accessibility, and Performance Audit

## Goal

Establish the current static quality baseline and identify the highest-risk runtime,
responsive, accessibility, and performance areas for later verification.

## Mode

Read-only audit. Do not edit files, install packages, start a browser, or commit.

## Inspect

- Package scripts, Next.js configuration, layouts, client boundaries, media usage,
  forms, navigation, route duplication, tests, and likely bundle/performance hotspots.
- Keyboard semantics, labels, focus behavior, image sizing, loading behavior, and errors.

## Deliverable

Return:

1. Static QA findings ranked P0–P3 with file evidence.
2. Accessibility checklist with confirmed and unverified items.
3. Performance risk register for LCP, CLS, INP, bundle size, and image delivery.
4. A later browser/test matrix for 390, 768, 1440, and 1920 px.
5. Prioritized implementation or verification tasks and dependencies.

## Acceptance criteria

- Do not report Lighthouse or browser results that were not measured.
- Distinguish confirmed code defects from runtime risks.
- Prefer reviewer ownership; do not claim page-development ownership.
