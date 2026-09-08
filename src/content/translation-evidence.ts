import { contentLocaleOf, locales, type ContentLocale, type Locale } from "./company";

/**
 * Translation evidence — the single source of truth for ES/DE ownership.
 *
 * INTL-DEES-002B made availability path-aware: a page can only own a localized
 * URL if the copy it renders exists. This module supplies the missing half —
 * *who says that copy exists, and what exactly did they check*. Existence of a
 * string in a registry is not the same as a reviewed translation, and before
 * this module the two were indistinguishable: any structurally honest entry
 * became a canonical, hreflang, sitemap and `inLanguage` claim the moment it
 * was written down, with no approval step and no record of the English source
 * it was checked against.
 *
 * So the unit stored here is *evidence*, not an intention:
 *
 * - keyed by **path + locale**, exactly like the ownership claim it can grant;
 * - carrying the translated fields beside the English fields they replace;
 * - declaring the **required fields** the page renders, as reviewed;
 * - carrying **provenance** — who translated, who independently reviewed, which
 *   English revision, on which date;
 * - and carrying a **status**, because writing copy down and approving it are
 *   different events. A `draft` record is real content work in progress and
 *   must not move a single SEO surface.
 *
 * Only a record that clears every rule in `evidenceDecisionFor` becomes a
 * promotion, and a promotion is the only thing `./availability` (the SEO
 * resolver) and `pageCopyFor` in `./translation-availability` (the renderer)
 * are built over. Both read `TRANSLATED_PAGES`, and `TRANSLATED_PAGES` is
 * derived from `TRANSLATION_EVIDENCE` by one call, so there is no second door
 * from "someone wrote a string" to "Google is told this URL owns itself".
 *
 * Every rule here fails closed: an unrecognised status, a self-approval, a
 * malformed review date, a field the page does not render, a duplicated
 * (path, locale) pair, or a "translation" that pastes the English back all
 * leave the page an English-owner fallback, which is the state that cannot
 * cost the site a duplicate-content penalty.
 *
 * Nothing is promoted today. `TRANSLATION_EVIDENCE` ships empty, so all ES and
 * DE pages remain English-owner fallbacks and the shipped answers are
 * byte-identical to INTL-DEES-002B. INTL-DEES-001 owns producing the copy;
 * approval of a page then becomes one reviewed record, not a code change.
 *
 * A limitation stated plainly: this module cannot see the content model, so the
 * field list a record declares required is the reviewer's statement, not a
 * measurement of the live entity. What stops a wrong statement from shipping is
 * `pageCopyFor`, which resolves against the real record at prerender and throws
 * if the page renders body copy no approved evidence covers. The declaration
 * gate and the render gate are two independent nets, and the build fails
 * between them.
 *
 * And a cost worth knowing before adding a rule: `TRANSLATED_PAGES` is evaluated
 * at module scope, `./availability` imports it, and `src/components/layout/site-header.tsx`
 * is `"use client"` and imports `localizedLocalesFor` — so this file's decision
 * machinery is reachable from the browser and ships there (measured at 1.7 KB
 * raw / 0.6 KB gzip of the shared chunk, loaded by 220 of 222 documents). Every
 * rule added here is paid for on the client too, until the header is handed its
 * locale list from a server component instead.
 */

/**
 * A locale the content model holds no body copy for. `en` and `zh` are absent
 * because `ContentLocale` already carries their copy on every entity, so they
 * need no evidence: they are owners by the model's own guarantee. Derived from
 * `contentLocaleOf` rather than listed, so a retired or added locale cannot be
 * left behind in a literal.
 */
export type PromotionLocale = Exclude<Locale, ContentLocale>;

const PROMOTION_LOCALE_SET: readonly string[] = locales.filter(
  (locale) => contentLocaleOf(locale) !== locale,
);

/** Is this locale one that can only become an owner through evidence? */
export function isPromotionLocale(locale: string): locale is PromotionLocale {
  return PROMOTION_LOCALE_SET.includes(locale);
}

/**
 * One localized value. Nested on purpose: a product's `faqs` and `processGuide`
 * hold pairs inside lists, and a record must mirror the field's own shape so the
 * renderer consumes it unchanged.
 */
export type TranslatedValue = string | readonly TranslatedValue[];

/** Sections whose entity detail pages carry `Record<ContentLocale, …>` copy. */
export const DEEP_CONTENT_SECTIONS = [
  "answers",
  "knowledge",
  "products",
  "applications",
] as const;

export type DeepContentSection = (typeof DEEP_CONTENT_SECTIONS)[number];

const deepDetailPath = new RegExp(`^/(${DEEP_CONTENT_SECTIONS.join("|")})/[^/]+/?$`);

/** Which deep-content section (if any) a site path belongs to. */
export function deepContentSectionOf(path: string): DeepContentSection | null {
  const match = deepDetailPath.exec(path);
  return match ? (match[1] as DeepContentSection) : null;
}

/**
 * Is this an entity detail page — the only kind of page evidence can describe?
 * Copy elsewhere on the site comes from the UI dictionary rather than from an
 * entity record, so a record for a core or section path describes a page whose
 * body this layer cannot cover. Widening evidence to those routes is a separate
 * change with its own evidence.
 */
export function isDeepContentDetail(path: string): boolean {
  return deepDetailPath.test(path);
}

/**
 * One page promoted by reviewed evidence: the English fields and the translated
 * fields that replace them. This is the shape the resolver and the renderer
 * consume, and it is only ever built from a `TranslationEvidence` record by
 * `promotionOf`.
 */
export type TranslatedPage = {
  path: string;
  locale: PromotionLocale;
  source: Readonly<Record<string, TranslatedValue>>;
  content: Readonly<Record<string, TranslatedValue>>;
};

/**
 * Has a reviewer approved this record, or is it still content work in progress?
 *
 * Exactly two states, and the default is not a shortcut: a record is `draft`
 * until someone who did not write it signs it off. There is no `pending` or
 * `auto` state, because a status the model cannot enumerate is a status some
 * future caller will guess at.
 */
export type EvidenceStatus = "draft" | "approved";

/**
 * Who produced the copy and who checked it. Required on every record, approved
 * or not: provenance is what a draft is *for*, and a record without it cannot be
 * re-reviewed when the English source moves.
 */
export type TranslationProvenance = {
  /** Who or what produced `content` (person, vendor, machine pass). */
  translatedBy: string;
  /** Who checked it against `source`. May not be `translatedBy`. */
  reviewedBy: string;
  /** The English revision `content` was translated from. */
  sourceRevision: string;
  /** ISO date (`YYYY-MM-DD`) of the review. */
  reviewedOn: string;
};

/**
 * One page, in one language, and the claim that it is translated.
 *
 * `path` is the prefix-free English owner (`/products/pva-staple-fiber`), never
 * a locale-prefixed URL: the record describes the page, and `localePath()`
 * derives the prefixed form from it. `requiredFields` is the reviewer's list of
 * the body fields the page renders; `source` and `content` are keyed by those
 * field names, `source` holding the English verbatim. `content` is the copy the
 * page will actually render, so the record that grants ownership is the record
 * the renderer reads.
 */
export type TranslationEvidence = {
  path: string;
  locale: PromotionLocale;
  status: EvidenceStatus;
  requiredFields: readonly string[];
  source: Readonly<Record<string, TranslatedValue>>;
  content: Readonly<Record<string, TranslatedValue>>;
  provenance: TranslationProvenance;
};

/**
 * Approved evidence, by path and locale. Empty by fact, not by policy: ES and DE
 * pages still render the English record, and ES/DE core and section pages render
 * partially translated chrome over English body copy (INTL-DEES-002B measured
 * 128 of 248 UI strings per locale), so no record exists to approve yet.
 */
export const TRANSLATION_EVIDENCE: readonly TranslationEvidence[] = [];

const sameText = (a: TranslatedValue, b: TranslatedValue): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const textLeaves = (value: TranslatedValue): string[] =>
  typeof value === "string" ? [value] : value.flatMap((part) => textLeaves(part));

const nonEmpty = (value: TranslatedValue): boolean => {
  const leaves = textLeaves(value);
  return leaves.length > 0 && leaves.every((leaf) => leaf.trim().length > 0);
};

/**
 * Does this promotion actually carry translated copy?
 *
 * The structural half of the gate, unchanged from INTL-DEES-002B: the field
 * sets must match, every value must be present, and no value may be its own
 * English text again — a "translation" that pastes the source back is the
 * fabrication this whole layer exists to refuse.
 */
export function isGenuineTranslation(page: TranslatedPage): boolean {
  const { path, source, content } = page;
  if (!isDeepContentDetail(path)) return false;
  const fields = Object.keys(content);
  if (fields.length === 0 || fields.length !== Object.keys(source).length) return false;
  return fields.every((field) => {
    if (!(field in source)) return false;
    const translated = content[field];
    const english = source[field];
    return nonEmpty(translated) && nonEmpty(english) && !sameText(translated, english);
  });
}

const isBlank = (value: unknown): boolean =>
  typeof value !== "string" || value.trim().length === 0;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const reviewDateIsWellFormed = (value: string): boolean =>
  ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));

/**
 * Whether one record may grant ownership, and why not.
 *
 * The reasons are machine-checkable strings rather than a boolean because the
 * point of this layer is an audit trail: a reviewer reading a page's status has
 * to be able to tell "nobody wrote it" from "written, incomplete" from "complete
 * but signed off by its own author". Every reason is reported, not the first
 * one, so one pass over a registry shows everything to fix.
 */
export function evidenceDecisionFor(
  evidence: TranslationEvidence,
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): { qualified: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  const { path, locale, status, requiredFields, source, content, provenance } = evidence;

  // `en` and `zh` are refused here too, not because their copy is unproven but
  // because the content model already guarantees it: an evidence record for a
  // modelled locale means someone is routing a locale through the wrong door.
  if (!isPromotionLocale(locale)) reasons.push("locale-not-promotable");

  if (!isDeepContentDetail(path)) reasons.push("path-not-entity-detail");

  if (status !== "approved") reasons.push(`status-not-approved:${status}`);

  if (isBlank(provenance?.translatedBy)) reasons.push("provenance-missing:translatedBy");
  if (isBlank(provenance?.reviewedBy)) reasons.push("provenance-missing:reviewedBy");
  if (isBlank(provenance?.sourceRevision)) reasons.push("provenance-missing:sourceRevision");
  if (isBlank(provenance?.reviewedOn)) {
    reasons.push("provenance-missing:reviewedOn");
  } else if (!reviewDateIsWellFormed(provenance.reviewedOn)) {
    reasons.push("provenance-review-date-not-iso");
  }
  if (
    !isBlank(provenance?.translatedBy) &&
    !isBlank(provenance?.reviewedBy) &&
    provenance.translatedBy.trim() === provenance.reviewedBy.trim()
  ) {
    reasons.push("self-approved");
  }

  const declared = requiredFields ?? [];
  if (declared.length === 0) reasons.push("no-required-fields");

  const seen = new Set<string>();
  for (const field of declared) {
    if (seen.has(field)) {
      reasons.push(`duplicate-required-field:${field}`);
      continue;
    }
    seen.add(field);
    if (!(field in content)) reasons.push(`missing-translated-field:${field}`);
    if (!(field in source)) reasons.push(`missing-source-field:${field}`);
  }
  for (const field of Object.keys(content)) {
    if (!seen.has(field)) reasons.push(`undeclared-content-field:${field}`);
  }
  for (const field of Object.keys(source)) {
    if (!seen.has(field)) reasons.push(`undeclared-source-field:${field}`);
  }

  if (
    registry.filter(
      (other) => other.path === path && String(other.locale) === String(locale),
    ).length > 1
  ) {
    reasons.push("duplicate-evidence");
  }

  if (isPromotionLocale(locale) && isDeepContentDetail(path)) {
    if (!isGenuineTranslation(promotionOf(evidence))) reasons.push("copy-not-translated");
  }

  return { qualified: reasons.length === 0, reasons };
}

/**
 * The promotion a record grants: the page plus the copy that page will render.
 * Shape-stripping only, so the resolver and the renderer cannot see a different
 * page than the reviewer saw.
 */
export function promotionOf(evidence: TranslationEvidence): TranslatedPage {
  return {
    path: evidence.path,
    locale: evidence.locale,
    source: evidence.source,
    content: evidence.content,
  };
}

/** Exact-match lookup by path and locale, regardless of status. */
export function evidenceFor(
  path: string,
  locale: Locale,
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): TranslationEvidence | undefined {
  return registry.find((evidence) => evidence.path === path && evidence.locale === locale);
}

/** Records cleared for ownership, in registry order. */
export function approvedEvidence(
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): readonly TranslationEvidence[] {
  return registry.filter((evidence) => evidenceDecisionFor(evidence, registry).qualified);
}

/** Approved records for one exact path and locale. */
export function approvedEvidenceFor(
  path: string,
  locale: Locale,
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): TranslationEvidence | undefined {
  const evidence = evidenceFor(path, locale, registry);
  if (!evidence) return undefined;
  return evidenceDecisionFor(evidence, registry).qualified ? evidence : undefined;
}

/** Records still awaiting sign-off — content work, not an SEO claim. */
export function draftEvidence(
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): readonly TranslationEvidence[] {
  return registry.filter((evidence) => evidence.status === "draft");
}

/** Records that claim ownership and are refused, with their reasons. */
export function rejectedEvidence(
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): { evidence: TranslationEvidence; reasons: readonly string[] }[] {
  return registry
    .map((evidence) => ({ evidence, ...evidenceDecisionFor(evidence, registry) }))
    .filter((entry) => !entry.qualified)
    .map(({ evidence, reasons }) => ({ evidence, reasons }));
}

/**
 * The promotions this evidence set grants.
 *
 * The one derivation `TRANSLATED_PAGES` is built from, so every consumer of a
 * promotion — the availability policy and the deep renderers — is reading this
 * same answer.
 */
export function approvedPromotions(
  registry: readonly TranslationEvidence[] = TRANSLATION_EVIDENCE,
): readonly TranslatedPage[] {
  return approvedEvidence(registry).map(promotionOf);
}
