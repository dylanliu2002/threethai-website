import type { ContentLocale } from "./company";

/**
 * The typed body of a knowledge article.
 *
 * An article used to be a list of `[heading, body]` tuples, and both renderers
 * printed each tuple as one `<h2>` plus one `<p>`. That ceiling — one sentence
 * bank per heading, no list, no table, no link — is why the section read like a
 * set of outlines rather than like guidance a buyer could act in a mill on. This
 * model lifts the ceiling and nothing else: it changes what an article *can*
 * hold, not what the shipped articles say. Every existing body is folded in as a
 * single `paragraph` block, so the rendered markup is unchanged by construction
 * rather than by review.
 *
 * Three rules hold this together, and each exists because breaking it fails in a
 * way no test downstream would catch:
 *
 * 1. The locale pair stays at FIELD level — `sections` is `{ en, zh }`, and a
 *    block never carries language. `translation-availability.ts` recognises an
 *    entity's body copy structurally (an object whose keys are exactly `en` and
 *    `zh`) and rewrites that one field when a page is promoted. Move the locale
 *    keys inside the blocks and `sections` becomes an array, stops being
 *    recognised, and a future ES/DE approval would publish a self-canonical URL
 *    over an English body — the exact defect GSC-INDEX-002 was raised for.
 * 2. No optional properties. A promoted page replaces this field with reviewed
 *    copy, whose value type is `{ [key: string]: TranslatedValue }`; `string |
 *    undefined` is not assignable to it, so an optional `caption` would not
 *    compile against a real approval. Every table therefore carries a caption —
 *    which is also what a screen reader needs.
 * 3. Both locales must be the same SHAPE, block for block. Promotion replaces the
 *    whole field, so a 9-block English body over an 8-block Chinese one would
 *    render one language's structure with another's text. `assertAlignedBody`
 *    enforces that at module load instead of at review time.
 */

/** One run of prose. `href` is always a prefix-free site path (`/knowledge/x`). */
export type InlineSpan =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string };

export type CalloutTone = "note" | "caution";

export type DefinitionItem = {
  readonly term: string;
  readonly detail: readonly InlineSpan[];
};

export type Block =
  /** A sub-heading inside a section. Rendered as `<h3>`; the model cannot emit an `<h4>`. */
  | { readonly type: "heading"; readonly text: string }
  /** Plain prose. The shape every migrated article section already had. */
  | { readonly type: "paragraph"; readonly text: string }
  /** Prose carrying internal links, which a `paragraph` cannot express. */
  | { readonly type: "prose"; readonly spans: readonly InlineSpan[] }
  | {
      readonly type: "list";
      readonly ordered: boolean;
      readonly items: readonly (readonly InlineSpan[])[];
    }
  | { readonly type: "definitionList"; readonly items: readonly DefinitionItem[] }
  | {
      readonly type: "table";
      readonly caption: string;
      readonly columns: readonly string[];
      readonly rows: readonly (readonly string[])[];
      /** Render column 0 as `<th scope="row">` — a parameter table is read down its first column. */
      readonly rowHeader: boolean;
    }
  | {
      readonly type: "callout";
      readonly label: string;
      readonly tone: CalloutTone;
      readonly text: string;
    };

export type ArticleSection = {
  readonly heading: string;
  readonly blocks: readonly Block[];
};

export type ArticleBody = readonly ArticleSection[];

/** Field-level content locale record — see rule 1 above. */
export type ArticleSections = Record<ContentLocale, ArticleBody>;

/** The pre-block article shape, still what `legacy-source.ts` and `zhPatches` hold. */
export type LegacySectionTuple = readonly [heading: string, body: string];

/** Widest table that stays readable on a phone before it starts scrolling. */
export const MAX_TABLE_COLUMNS = 4;

/* ------------------------------------------------------------------ *
 * Constructors
 * ------------------------------------------------------------------ */

export const textSpan = (value: string): InlineSpan => ({ kind: "text", text: value });

export const linkSpan = (value: string, href: string): InlineSpan => ({
  kind: "link",
  text: value,
  href,
});

export const paragraph = (value: string): Block => ({ type: "paragraph", text: value });

/**
 * One legacy `[heading, body]` tuple becomes one section holding one paragraph —
 * no dropped text, no added text, no re-flow. Used by the migration in
 * `articles.ts` and asserted against directly, so "lossless" is a tested claim.
 */
export const legacyTupleToSection = ([heading, body]: LegacySectionTuple): ArticleSection => ({
  heading,
  blocks: [paragraph(body)],
});

export const legacyTupleToBody = (
  sections: readonly LegacySectionTuple[],
): ArticleBody => sections.map(legacyTupleToSection);

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/** `src/locale/...` would pin one link to one language and defeat the promotion seam. */
const LOCALE_PREFIXED = /^\/(en|zh|es|de)(\/|$)/;

const filled = (value: string): boolean => value.trim().length > 0;

/**
 * An internal link is authored against the English owner and rendered through
 * `localePath`, because a component that received a prefixed href could not
 * re-prefix it for the eight other locales without rewriting it.
 */
export function assertInternalHref(slug: string, href: string): void {
  const path = href.split("?")[0];
  const unusable =
    !href.startsWith("/") ||
    href.includes("#") ||
    LOCALE_PREFIXED.test(path) ||
    path === "/" ||
    path.endsWith("/");
  if (unusable) {
    throw new Error(
      `article-blocks: article "${slug}" links to "${href}", which is not a prefix-free site ` +
        `path. Renderers add the locale prefix themselves via localePath; an href that already ` +
        `carries one pins a link to a single language, and a fragment or trailing slash will not ` +
        `match a prerendered document.`,
    );
  }
}

function checkSpans(slug: string, where: string, spans: readonly InlineSpan[]): void {
  if (spans.length === 0) {
    throw new Error(`article-blocks: ${slug} ${where} has no spans to render.`);
  }
  spans.forEach((span, index) => {
    if (!filled(span.text)) {
      throw new Error(`article-blocks: ${slug} ${where} span ${index} is empty.`);
    }
    if (span.kind === "link") assertInternalHref(slug, span.href);
  });
}

function checkBlock(slug: string, where: string, block: Block): void {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "callout":
      if (!filled(block.text)) {
        throw new Error(`article-blocks: ${slug} ${where} (${block.type}) has no text.`);
      }
      if (block.type === "callout" && !filled(block.label)) {
        throw new Error(`article-blocks: ${slug} ${where} callout has no label.`);
      }
      return;
    case "prose":
      return checkSpans(slug, `${where} prose`, block.spans);
    case "list":
      if (block.items.length === 0) {
        throw new Error(`article-blocks: ${slug} ${where} list has no items.`);
      }
      return block.items.forEach((item, i) =>
        checkSpans(slug, `${where} list item ${i + 1}`, item),
      );
    case "definitionList":
      if (block.items.length === 0) {
        throw new Error(`article-blocks: ${slug} ${where} definition list has no items.`);
      }
      return block.items.forEach((item, i) => {
        if (!filled(item.term)) {
          throw new Error(`article-blocks: ${slug} ${where} definition ${i + 1} has no term.`);
        }
        checkSpans(slug, `${where} definition ${i + 1}`, item.detail);
      });
    case "table": {
      if (!filled(block.caption)) {
        throw new Error(
          `article-blocks: ${slug} ${where} table has no caption. A table needs one: it is the ` +
            `only text a screen reader announces before the cells, and the model requires it so a ` +
            `caption cannot be forgotten at authoring time.`,
        );
      }
      if (block.columns.length < 2) {
        throw new Error(`article-blocks: ${slug} ${where} table needs at least two columns.`);
      }
      if (block.columns.length > MAX_TABLE_COLUMNS) {
        throw new Error(
          `article-blocks: ${slug} ${where} table has ${block.columns.length} columns, over the ` +
            `limit of ${MAX_TABLE_COLUMNS}. Past that a spec table is unreadable on a phone; split ` +
            `it or move a column into the caption.`,
        );
      }
      if (block.columns.some((column) => !filled(column))) {
        throw new Error(`article-blocks: ${slug} ${where} table has an empty column heading.`);
      }
      if (block.rows.length === 0) {
        throw new Error(`article-blocks: ${slug} ${where} table has no rows.`);
      }
      return block.rows.forEach((row, i) => {
        if (row.length !== block.columns.length) {
          throw new Error(
            `article-blocks: ${slug} ${where} table row ${i + 1} has ${row.length} cells against ` +
              `${block.columns.length} columns. A ragged row renders cells under the wrong heading.`,
          );
        }
        if (row.some((cell) => !filled(cell))) {
          throw new Error(`article-blocks: ${slug} ${where} table row ${i + 1} has an empty cell.`);
        }
      });
    }
  }
}

/**
 * Reject a body that cannot be rendered correctly, at module load, while the
 * prerender is still about to fail loudly — the `card-copy.ts` pattern: a bad
 * slug throws there instead of printing an empty card, and this is the same bet.
 */
export function assertArticleBodyShape(slug: string, sections: ArticleSections): void {
  (Object.keys(sections) as ContentLocale[]).forEach((locale) => {
    const body = sections[locale];
    if (!Array.isArray(body)) {
      throw new Error(`article-blocks: ${slug} ${locale} body is not a list of sections.`);
    }
    body.forEach((section, index) => {
      if (!filled(section.heading)) {
        throw new Error(
          `article-blocks: ${slug} ${locale} section ${index + 1} has no heading.`,
        );
      }
      if (section.blocks.length === 0) {
        throw new Error(
          `article-blocks: ${slug} ${locale} section "${section.heading}" has no blocks — it would ` +
            `render a heading over nothing.`,
        );
      }
      section.blocks.forEach((block, blockIndex) =>
        checkBlock(slug, `${locale} section ${index + 1} block ${blockIndex + 1}`, block),
      );
    });
  });
}

/**
 * Structural fingerprint: block types, arities and flags — never text, which
 * legitimately differs between languages. Two bodies with the same signature hold
 * the same article; a promotion can therefore replace one with the other whole.
 */
export function bodySignature(body: ArticleBody): string {
  const spans = (list: readonly InlineSpan[]) => list.map((span) => span.kind).join("+");
  const block = (value: Block): string => {
    switch (value.type) {
      case "heading":
        return "h";
      case "paragraph":
        return "p";
      case "prose":
        return `prose(${spans(value.spans)})`;
      case "list":
        return `${value.ordered ? "ol" : "ul"}[${value.items.map(spans).join(",")}]`;
      case "definitionList":
        return `dl[${value.items.map((item) => spans(item.detail)).join(",")}]`;
      case "table":
        return `table:${value.columns.length}x${value.rows.length}${value.rowHeader ? "+rh" : ""}`;
      case "callout":
        return `callout(${value.tone})`;
    }
  };
  return body.map((section) => `${section.blocks.length}:${section.blocks.map(block).join("|")}`).join(";");
}

export function assertAlignedBody(slug: string, sections: ArticleSections): void {
  const en = bodySignature(sections.en);
  const zh = bodySignature(sections.zh);
  if (en !== zh) {
    throw new Error(
      `article-blocks: ${slug} en and zh bodies are not the same shape.\n` +
        `  en: ${en}\n` +
        `  zh: ${zh}\n` +
        `A promotion replaces the whole "sections" field, so the two languages must match block ` +
        `for block — otherwise an approved page publishes one language's structure over another's ` +
        `text, which is the failure this model exists to prevent.`,
    );
  }
}
