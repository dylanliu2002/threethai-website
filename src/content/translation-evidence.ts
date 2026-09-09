import { contentLocaleOf, locales, type ContentLocale, type Locale } from "./company";
import { intlDees001Records } from "./translation-records";
import {
  isSectionEvidencePath,
  sectionSurfaceFor,
  SECTION_SURFACES,
  type SectionSurface,
} from "./page-surfaces";

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
 * INTL-DEES-004B adds the second promotable page class — a core or section route
 * whose complete copy surface is declared in `./page-surfaces` — because that
 * kind of page has no entity record to derive fields from, so without a declared
 * surface it had no honest route to ownership at all. Entity detail rules are
 * untouched: the class decision in `promotableClassFor` keeps the two apart, and
 * a path claiming both classes is refused by both. The registry ships empty, so
 * every answer produced here is what INTL-DEES-003B shipped.
 *
 * The client cost this file used to carry is gone. `TRANSLATED_PAGES` is still
 * evaluated at module scope, but INTL-DEES-003B moved the only browser-side
 * consumer behind a server bridge: `src/components/layout/site-header.tsx`
 * receives resolved locale lists as a prop and imports nothing here, so no
 * measured chunk carries any reason string from this gate. Rules added here are
 * now paid for on the server only — measured, not assumed: `tests/intl-dees-004b-*`
 * re-checks that every reason literal, including the two new ones, stays out of
 * `.next/static/chunks`.
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
 * hold pairs inside lists, and an application's `problem`, `whereUsed`,
 * `whyTemporary` and `testing` hold a `{ heading, body }` object. A record must
 * mirror the field's own shape so the renderer consumes it unchanged — which is
 * why the object branch is stated here instead of those four fields being
 * flattened in the entity: flattening would move copy the model already
 * describes, and the shape a reviewer signs off on would stop being the shape the
 * page renders. Every leaf is still a string and `isGenuineTranslation` still
 * walks to each one, so an object cannot hide an empty or untranslated member.
 */
export type TranslatedValue =
  | string
  | readonly TranslatedValue[]
  | { readonly [key: string]: TranslatedValue };

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
 * Is this an entity detail page — the page kind whose body copy this layer has
 * always been able to enumerate, because the entity record itself lists it?
 *
 * Since INTL-DEES-004B this is one of **two** promotable classes rather than the
 * only one: a core or section route can also become an owner, but only through a
 * declared copy surface in `./page-surfaces`, because it has no entity to derive
 * its fields from. Widening this predicate itself is not how the extension
 * works — its rules are untouched, and `promotableClassFor` is what decides
 * which class a path belongs to.
 */
export function isDeepContentDetail(path: string): boolean {
  return deepDetailPath.test(path);
}

/**
 * Which promotable class a path belongs to, or `null` when it belongs to neither.
 *
 * `entity` keeps the INTL-DEES-002B rules exactly. `section` is a route whose
 * complete copy surface somebody declared and reviewed in `./page-surfaces`.
 * A path claiming both is reported as promotable by neither, so registering a
 * core surface can never quietly re-decide how an entity detail page is judged —
 * and a mistake in the registry fails closed into "refuse this record" instead of
 * into "apply the looser rule".
 *
 * A path registered with a value that is not a slot list is the same kind of
 * mistake, and gets the same answer. Presence is what makes a path claim the
 * `section` class; the slots are what makes that claim checkable. Treating a
 * malformed entry as "not a section path" would hand a core route to the entity
 * obligation, which is the looser rule and the exact opposite of fail-closed.
 */
export function promotableClassFor(
  path: string,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): "entity" | "section" | null {
  const entity = isDeepContentDetail(path);
  const registered = isSectionEvidencePath(path, surfaces);
  const section = registered && sectionSurfaceFor(path, surfaces) !== null;
  if (registered && !section) return null;
  if (entity === section) return null;
  return entity ? "entity" : "section";
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
 * The evidence registry. INTL-DEES-001 put the first records into it — the nine
 * entity detail pages this line localizes (four products, five applications), in
 * both languages — and every one of them is a `draft`.
 *
 * That is the state the gate was built for: written copy is content work, and an
 * unreviewed draft grants nothing. `TRANSLATED_PAGES` stays empty until a record
 * is signed off by someone other than its author, so no ES or DE page owns a URL
 * anywhere yet and every shipped SEO answer is what INTL-DEES-004B produced.
 * Approval is now an edit to `status`, `reviewedBy` and `reviewedOn` on one
 * record, with no code change anywhere else — which is the property
 * INTL-DEES-003A asked this task to establish.
 *
 * The array is assembled by `./translation-records` from the live entity and
 * `./translation-copy`, not typed here by hand, so `requiredFields` and `source`
 * measure the page instead of describing it. Core and section routes are still
 * absent: their prose is not yet gathered into a bundle they render through
 * `pageCopyFor`, so declaring a surface for them would be a completeness claim
 * nothing enforces (see `./page-surfaces`).
 */
export const TRANSLATION_EVIDENCE: readonly TranslationEvidence[] = intlDees001Records();

const sameText = (a: TranslatedValue, b: TranslatedValue): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Every string inside a localized value, however it is nested. Lists and objects
 * are both walked, so an `{ heading, body }` field cannot pass by carrying one
 * translated member and one empty one, and `nonEmpty` sees all of them.
 */
const textLeaves = (value: TranslatedValue): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((part) => textLeaves(part));
  return Object.values(value).flatMap((part) => textLeaves(part));
};

const nonEmpty = (value: TranslatedValue): boolean => {
  const leaves = textLeaves(value);
  return leaves.length > 0 && leaves.every((leaf) => leaf.trim().length > 0);
};

/**
 * Does this promotion actually carry translated copy?
 *
 * The structural half of the gate, unchanged for entity detail pages from
 * INTL-DEES-002B: the field sets must match, every value must be present, and no
 * value may be its own English text again — a "translation" that pastes the
 * source back is the fabrication this whole layer exists to refuse.
 *
 * INTL-DEES-004B adds one clause, and only for the `section` class: because a
 * core page has no entity to derive its fields from, its declared surface is the
 * only statement of what the page renders. So a section record must carry the
 * surface **exactly** — covering three slots of a forty-slot page is not a
 * genuine translation of the page, it is a partial one wearing the page's URL.
 * Entity records keep deriving their fields from the entity itself, and gain no
 * new obligation.
 */
export function isGenuineTranslation(
  page: TranslatedPage,
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): boolean {
  const { path, source, content } = page;
  if (promotableClassFor(path, surfaces) === null) return false;
  const fields = Object.keys(content);
  if (fields.length === 0 || fields.length !== Object.keys(source).length) return false;
  const surface = sectionSurfaceFor(path, surfaces);
  if (surface !== null) {
    if (surface.length !== fields.length) return false;
    if (!surface.every((slot) => slot in content && slot in source)) return false;
  }
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
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): { qualified: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  const { path, locale, status, requiredFields, source, content, provenance } = evidence;

  // `en` and `zh` are refused here too, not because their copy is unproven but
  // because the content model already guarantees it: an evidence record for a
  // modelled locale means someone is routing a locale through the wrong door.
  if (!isPromotionLocale(locale)) reasons.push("locale-not-promotable");

  const pageClass = promotableClassFor(path, surfaces);
  // The reason code keeps its INTL-DEES-003A spelling on purpose. Since 004B it
  // means "this path belongs to no promotable class" — an entity detail route,
  // or a core route whose surface somebody declared in ./page-surfaces. Renaming
  // it would silently break the assertions other tasks' suites pin, and the
  // strings that prove this gate never reaches a browser chunk.
  if (pageClass === null) reasons.push("path-not-entity-detail");

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

  // INTL-DEES-004B, `section` class only. A core page declares its whole copy
  // surface in ./page-surfaces because it has no entity whose fields could
  // speak for it. So the review must be *against that surface*: a record that
  // names fewer slots is signing off on part of a page while the rest stays
  // English under a localized URL, and one that names more is describing slots
  // the page does not render, which means nobody checked what the page shows.
  // Both are refused, with the slot named. Entity records are unaffected — their
  // obligation still comes from the live record, and `pageCopyFor` is what
  // catches a field they missed at prerender.
  const surface = sectionSurfaceFor(path, surfaces);
  if (surface !== null) {
    for (const slot of surface) {
      if (!seen.has(slot)) reasons.push(`surface-slot-undeclared:${slot}`);
    }
    for (const slot of declared) {
      if (!surface.includes(slot)) reasons.push(`surface-slot-extra:${slot}`);
    }
  }

  if (
    registry.filter(
      (other) => other.path === path && String(other.locale) === String(locale),
    ).length > 1
  ) {
    reasons.push("duplicate-evidence");
  }

  if (isPromotionLocale(locale) && pageClass !== null) {
    if (!isGenuineTranslation(promotionOf(evidence), surfaces)) reasons.push("copy-not-translated");
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
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): readonly TranslationEvidence[] {
  return registry.filter(
    (evidence) => evidenceDecisionFor(evidence, registry, surfaces).qualified,
  );
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
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): { evidence: TranslationEvidence; reasons: readonly string[] }[] {
  return registry
    .map((evidence) => ({ evidence, ...evidenceDecisionFor(evidence, registry, surfaces) }))
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
  surfaces: Readonly<Record<string, SectionSurface>> = SECTION_SURFACES,
): readonly TranslatedPage[] {
  return approvedEvidence(registry, surfaces).map(promotionOf);
}
