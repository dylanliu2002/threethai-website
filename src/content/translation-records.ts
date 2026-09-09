import { applications, type Application } from "./applications";
import { applicationCopy, productCopy } from "./translation-copy";
import { products, type Product } from "./products";
import type { TranslatedValue, TranslationEvidence } from "./translation-evidence";

/**
 * The evidence records INTL-DEES-001 produces for the localized entity pages.
 *
 * INTL-DEES-003A left the registry empty and said what would fill it: "INTL-DEES-001
 * produces the copy; promoting a page is then one record, no code change." This
 * module is that record-making step. It adds no rule to the gate and grants
 * nothing by itself — every record it returns is still judged by
 * `evidenceDecisionFor`, and `TRANSLATED_PAGES` is still `approvedPromotions()`
 * over whatever survives. What is different is that a record is now *assembled*
 * from two live sources instead of being typed by hand:
 *
 * - `source` comes from the English side of the entity itself, field by field,
 *   so the English a reviewer signed off on is no longer a claim about the
 *   corpus — it is read out of it. `translation-evidence.ts` documented that
 *   limitation ("the field list a record declares required is the reviewer's
 *   statement, not a measurement of the live entity"); deriving the list here
 *   removes it for these nine pages, and `pageCopyFor`'s prerender throw stays
 *   the net for any page that is not.
 * - `content` comes from `./translation-copy`, so the text the promotion puts on
 *   the page is the same text the reviewer read.
 *
 * Both are checked against the entity's own copy surface: a field the renderer
 * can widen that `translation-copy.ts` does not carry — in either language — is a
 * thrown error, not a silently partial page. Because detail pages prerender, that
 * error stops `next build`.
 *
 * Everything here ships as `status: "draft"`, which is the honest state: the copy
 * is written and self-checked, and it has not been reviewed by anyone who did not
 * write it. A draft moves nothing — no canonical, no hreflang, no sitemap entry,
 * no `inLanguage`. Sign-off is the owner's edit: set `status` to `"approved"`,
 * name themselves in `reviewedBy`, and date it in `reviewedOn`. The
 * `self-approved` and blank-provenance rules in the gate exist to make that edit
 * mean something.
 */

/** The English revision this copy was translated from — the branch base. */
const SOURCE_REVISION = "9c38f43";

const TRANSLATED_BY = "Qwen Code for INTL-DEES-001 (industrial B2B glossary pass)";

/**
 * Not a reviewer. An explicit pending marker rather than a blank, so a reader of
 * the record sees who the review is waiting on. The gate still refuses the record
 * for `status-not-approved:draft` and `provenance-missing:reviewedOn`.
 */
const AWAITING_REVIEW = "pending review — dylanliu2002";

/** Locales this line localizes, in the order the switcher already uses. */
const PROMOTION_LOCALES = ["es", "de"] as const;

/**
 * One entity's localized text, field by field, per promotion locale. Typed with
 * `TranslatedValue` leaves so `translation-copy.ts` is checked against the gate's
 * own value shape at the call site: a store entry that is neither a string, a
 * list nor a `{ … }` object stops compiling here instead of turning into an
 * untranslated field at prerender.
 */
type CopyStore = {
  readonly [slug: string]: {
    readonly [field: string]: { readonly es: TranslatedValue; readonly de: TranslatedValue };
  };
};

/**
 * A copyable body field: exactly `{ en, zh }`, which is the shape
 * `pageCopyFor` recognises and widens. Deliberately mirrored from
 * `isContentField` in `./translation-availability` rather than imported, because
 * this module must not create an import cycle into the gate it feeds. If the two
 * ever disagree the disagreement surfaces as a prerender throw on a promoted
 * page, never as a page that renders English under a localized canonical.
 */
function copyableFields(entity: object): string[] {
  return Object.entries(entity)
    .filter(([, value]) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
      const keys = Object.keys(value);
      return keys.length === 2 && "en" in value && "zh" in value;
    })
    .map(([field]) => field);
}

/**
 * One page's record, assembled from the entity's real copy surface.
 *
 * Throws when the store has nothing for the page or is missing a field the
 * renderer will widen: a silently absent value here would become either a refused
 * record nobody notices or, worse, a half-translated page that owns its URL.
 */
function entityRecord(
  slug: string,
  path: string,
  locale: (typeof PROMOTION_LOCALES)[number],
  entity: object,
  store: CopyStore,
  label: string,
): TranslationEvidence {
  const fields = copyableFields(entity);
  const stored = store[slug];
  if (!stored) {
    throw new Error(
      `translation-copy: ${label} has no entry for ${path}. Add the page to ` +
        `src/content/translation-copy.ts or drop it from the store — a record cannot be ` +
        `built for a page whose localized text does not exist.`,
    );
  }
  const source: Record<string, TranslatedValue> = {};
  const content: Record<string, TranslatedValue> = {};
  for (const field of fields) {
    const english = (entity as Record<string, { en: TranslatedValue; zh: TranslatedValue }>)[field]
      .en;
    const translated = stored[field]?.[locale];
    if (translated === undefined) {
      throw new Error(
        `translation-copy: ${path} renders "${field}" as body copy, but ${label}.${slug}.${field}` +
          ` carries no ${locale} value. Every field the renderer can widen needs one: a page may ` +
          `not own a localized URL while part of its copy is English.`,
      );
    }
    source[field] = english;
    content[field] = translated;
  }
  return {
    path,
    locale,
    status: "draft",
    requiredFields: fields,
    source,
    content,
    provenance: {
      translatedBy: TRANSLATED_BY,
      reviewedBy: AWAITING_REVIEW,
      sourceRevision: SOURCE_REVISION,
      reviewedOn: "",
    },
  };
}

/** The nine entity detail pages this task localizes, both languages each. */
export function intlDees001Records(): readonly TranslationEvidence[] {
  const productRecords = (products as readonly Product[]).flatMap((product) =>
    PROMOTION_LOCALES.map((locale) =>
      entityRecord(product.slug, `/products/${product.slug}`, locale, product, productCopy, "productCopy"),
    ),
  );
  const applicationRecords = (applications as readonly Application[]).flatMap((application) =>
    PROMOTION_LOCALES.map((locale) =>
      entityRecord(
        application.slug,
        `/applications/${application.slug}`,
        locale,
        application,
        applicationCopy,
        "applicationCopy",
      ),
    ),
  );
  return [...productRecords, ...applicationRecords];
}
