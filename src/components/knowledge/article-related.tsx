import Link from "next/link";

/**
 * Renders an article's own related reading.
 *
 * The route resolves every label through `card-copy.ts` and passes strings down.
 * That is not redundancy — it is what the two contracts require at once:
 * `tests/intl-dees-001-es-de-localization.mjs:404-419` pins a `card-copy` import
 * in each card surface, and `:628-631` forbids the localised article teaser from
 * appearing on the article's own page. A component that did its own lookup could
 * satisfy neither honestly, and a route that imported the module without using it
 * would pass the pin while meaning nothing.
 *
 * So: the route decides *what* is related and in which language; this file decides
 * only how it looks.
 */

export type RelatedLinkItem = {
  readonly label: string;
  readonly href: string;
};

export type RelatedLinkGroup = {
  readonly heading: string;
  /** `"pill"` is the product-chip treatment; `"line"` is the reading list. */
  readonly variant: "pill" | "line";
  readonly items: readonly RelatedLinkItem[];
  /** The section index link ("All buyer answers (30)") that anchored the old block. */
  readonly trailing?: RelatedLinkItem & { readonly muted?: boolean };
};

const PILL =
  "inline-block rounded-full border border-input px-4 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary";
const LINE = "text-sm font-medium text-primary hover:underline";
const LINE_MUTED = "text-sm text-muted-foreground hover:text-primary";

export default function ArticleRelatedView({ groups }: { groups: readonly RelatedLinkGroup[] }) {
  const filled = groups.filter((group) => group.items.length > 0 || group.trailing);
  if (filled.length === 0) return null;

  return (
    <section className="hairline mt-12 pt-8">
      {filled.map((group, index) => {
        const headingClass = index === 0 ? "display-3" : "display-3 mt-8";
        if (group.variant === "pill") {
          return (
            <div key={group.heading}>
              <h2 className={headingClass}>{group.heading}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={PILL}>
                      {item.label}
                    </Link>
                  </li>
                ))}
                {group.trailing && (
                  <li key={group.trailing.href}>
                    <Link href={group.trailing.href} className={LINE}>
                      {group.trailing.label}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          );
        }
        return (
          <div key={group.heading}>
            <h2 className={headingClass}>{group.heading}</h2>
            <ul className="mt-4 space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINE}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {group.trailing && (
                <li key={group.trailing.href}>
                  <Link
                    href={group.trailing.href}
                    className={group.trailing.muted === false ? LINE : LINE_MUTED}
                  >
                    {group.trailing.label}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
