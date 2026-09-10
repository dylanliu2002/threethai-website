import type { ReactNode } from "react";
import Link from "next/link";
import type { ArticleBody, Block, InlineSpan } from "@/content/article-blocks";
import { localePath, type Locale } from "@/content/company";

/**
 * Renders an article body.
 *
 * Server-only on purpose: this is static technical text, and shipping a client
 * component here would add a JavaScript bundle to every article in four locales
 * to draw a `<table>` the browser already knows how to draw. `INTL-DEES-003B`
 * measured what that mistake costs — a policy object passed to the language
 * switcher put 1,684 raw bytes into a chunk loaded by 220 of 222 documents — and
 * `document-size` assertions still guard the boundary. So this file imports no
 * React hooks, fetches nothing, and carries no `"use client"`.
 *
 * It takes the ALREADY-RESOLVED body. Locale resolution belongs to the route,
 * which calls `pageCopyFor` and hands the promoted entity down; a component that
 * resolved its own copy would be a second, unreviewed seam.
 */

const BODY_TEXT = "mt-3 text-base leading-relaxed text-muted-foreground";

/**
 * Complete class literals, so Tailwind's scanner can see them. Table width grows
 * with column count because a spec table is only useful if its first column stays
 * readable while the rest scrolls.
 */
const TABLE_MIN_WIDTH: Record<number, string> = {
  2: "min-w-[420px]",
  3: "min-w-[560px]",
  4: "min-w-[720px]",
};

const CALLOUT_TONE: Record<"note" | "caution", { box: string; label: string }> = {
  note: { box: "border-gold/40 bg-accent/40", label: "text-gold-deep" },
  caution: { box: "border-border bg-secondary", label: "text-ink" },
};

/**
 * A text run renders as a bare string; only a link costs an element. That keeps a
 * link-free list item byte-clean, and React's comment separators between adjacent
 * children appear only where a paragraph genuinely mixes prose and links.
 */
function renderSpans(spans: readonly InlineSpan[], lp: (href: string) => string): ReactNode[] {
  return spans.map((span, index) =>
    span.kind === "link" ? (
      <Link
        key={index}
        href={lp(span.href)}
        className="font-medium text-primary underline decoration-gold/60 underline-offset-4 hover:decoration-gold"
      >
        {span.text}
      </Link>
    ) : (
      span.text
    ),
  );
}

function BlockView({ block, lp }: { block: Block; lp: (href: string) => string }) {
  switch (block.type) {
    case "heading":
      // Sections are `<h2>` (the route owns `<h1>`), so a block heading is an
      // `<h3>` and nothing lower: the model cannot skip an outline level.
      return <h3 className="mt-6 text-lg font-semibold tracking-tight text-ink">{block.text}</h3>;

    case "paragraph":
      return <p className={BODY_TEXT}>{block.text}</p>;

    case "prose":
      return <p className={BODY_TEXT}>{renderSpans(block.spans, lp)}</p>;

    case "list": {
      const className = `${BODY_TEXT} space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`;
      const items = block.items.map((item, index) => (
        <li key={index}>{renderSpans(item, lp)}</li>
      ));
      return block.ordered ? (
        <ol className={className}>{items}</ol>
      ) : (
        <ul className={className}>{items}</ul>
      );
    }

    case "definitionList":
      // `<dt>`/`<dd>` rather than a two-column table: a term and its explanation
      // are read in sequence, and on a phone a definition list reflows while a
      // table only scrolls.
      return (
        <dl className={`${BODY_TEXT} space-y-3`}>
          {block.items.map((item, index) => (
            <div key={index}>
              <dt className="font-semibold text-ink">{item.term}</dt>
              <dd className="mt-1">{renderSpans(item.detail, lp)}</dd>
            </div>
          ))}
        </dl>
      );

    case "table":
      return (
        <figure className="mt-4">
          <div className="scroll-thin mt-4 overflow-x-auto rounded-lg border border-border">
            <table className={`table-spec ${TABLE_MIN_WIDTH[block.columns.length] ?? "min-w-[560px]"}`}>
              <caption className="px-4 py-2 text-left text-xs font-normal text-muted-foreground">
                {block.caption}
              </caption>
              <thead>
                <tr>
                  {block.columns.map((column, index) => (
                    <th key={index} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) =>
                      cellIndex === 0 && block.rowHeader ? (
                        // `bg-transparent` because `.table-spec th` applies
                        // `bg-muted`; without it a row-headed table is entirely
                        // one grey column.
                        <th
                          key={cellIndex}
                          scope="row"
                          className="bg-transparent text-left font-semibold text-ink"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td
                          key={cellIndex}
                          className={cellIndex === 0 ? "font-semibold text-ink" : ""}
                        >
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );

    case "callout": {
      const tone = CALLOUT_TONE[block.tone];
      return (
        <aside className={`mt-5 rounded-lg border p-5 ${tone.box}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone.label}`}>
            {block.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{block.text}</p>
        </aside>
      );
    }
  }
}

export default function ArticleBodyView({ body, locale }: { body: ArticleBody; locale: Locale }) {
  const lp = (href: string) => localePath(href, locale);
  return (
    <>
      {body.map((section, index) => (
        <section key={`${index}-${section.heading}`} className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight text-ink">{section.heading}</h2>
          {section.blocks.map((block, blockIndex) => (
            <BlockView key={blockIndex} block={block} lp={lp} />
          ))}
        </section>
      ))}
    </>
  );
}
