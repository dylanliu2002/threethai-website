# Task 21 — Navigation and Accessibility Bundle

Status: COMPLETE

## Includes

Backlog tasks 23, 25, and 26.

## Goal

Restore localized active navigation, accessible light-surface accents, and robust
mobile-menu focus behavior without redesigning navigation.

## Allowed files

- `src/components/layout/site-header.tsx`
- `src/app/globals.css`

## Forbidden

- Navigation labels/IA, footer, route structure, company content, dependencies.

## Acceptance criteria

- Active navigation and `aria-current` work on root and all locale prefixes.
- Mobile menu moves focus inside on open, traps Tab, closes on Escape, restores
  focus to the trigger, and isolates background interaction.
- Body scroll state is restored reliably.
- Small light-surface accent text reaches WCAG AA contrast.
- Dark-surface brand accents retain intended visual hierarchy.
- No navigation items or conversion strategy are changed.

## Model

Terra high for interaction design and review; Agent 0 integrates shared files.

## Checks

- Typecheck, lint, production build.
- Later browser keyboard and contrast verification.
