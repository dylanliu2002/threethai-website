import Link from "next/link";
import { answerBySlug, expandedEnglishAnswers } from "@/content/answers";
import { productBySlug } from "@/content/products";
import type { Dictionary } from "@/content/i18n";
import { localePath, type Locale } from "@/content/company";

/**
 * Full buyer-answer article for the /[lang] routes. Deep content is
 * English-only; UI strings come from the resolved dictionary and internal
 * links are locale-prefixed.
 */
export default function AnswerArticle({ slug, locale, dict }: { slug: string; locale: Locale; dict: Dictionary }) {
  const answer = answerBySlug(slug)!;
  const expanded = expandedEnglishAnswers[slug];
  const lp = (p: string) => localePath(p, locale);
  const related = answer.relatedProduct ? productBySlug(answer.relatedProduct) : undefined;

  return (
    <article className="mt-8">
      <p className="eyebrow">Buyer answer · Water-soluble PVA materials</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">{answer.question}</h1>
      <div className="mt-6 rounded-lg border border-gold/40 bg-accent/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">Direct answer</p>
        <p className="mt-2 leading-relaxed text-foreground/90">{answer.shortAnswer}</p>
      </div>

      {answer.details.map(([heading, body]) => (
        <section key={heading} className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight text-ink">{heading}</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{body}</p>
        </section>
      ))}

      {expanded ? (
        <>
          {expanded.sections.map((section) => (
            <section key={section.heading} className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-base leading-relaxed text-muted-foreground">{paragraph}</p>
              ))}
            </section>
          ))}
          {expanded.comparison.rows.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{expanded.comparison.heading}</h2>
              <p className="mt-3 text-base text-muted-foreground">{expanded.comparison.intro}</p>
              <div className="scroll-thin mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="table-spec min-w-[560px]">
                  <thead>
                    <tr>
                      {expanded.comparison.columns.map((column) => (
                        <th key={column} scope="col">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expanded.comparison.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) => (
                          <td key={`${row[0]}-${i}`} className={i === 0 ? "font-semibold text-ink" : ""}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{expanded.faqHeading}</h2>
            <div className="mt-4 space-y-3">
              {expanded.faqs.map(([question, faqAnswer]) => (
                <details key={question} className="card-line group px-5 py-4 open:border-primary/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {question}
                    <span aria-hidden="true" className="text-gold-deep transition-transform duration-200 group-open:rotate-45">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faqAnswer}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{dict.answersIndex.askHeading}</h2>
        <ul className="mt-4 space-y-2">
          {answer.askFor.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-10 rounded-lg border border-border bg-paper p-6">
        <p className="eyebrow">Source transparency</p>
        <h2 className="mt-2 font-semibold text-ink">{dict.answersIndex.aboutHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dict.answersIndex.aboutBody}</p>
        {related && (
          <Link href={lp(`/products/${related.slug}`)} className="btn-primary mt-5 !min-h-10 !px-4 text-sm">
            {related.name.en} →
          </Link>
        )}
      </aside>

      <aside className="mt-10 rounded-lg bg-primary p-7 text-primary-foreground">
        <h2 className="text-lg font-semibold text-white">{dict.productsIndex.ctaTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{dict.productsIndex.ctaBody}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={lp("/request-sample")} className="btn-gold !min-h-10 !px-4 text-sm">{dict.actions.requestSample}</Link>
          <Link href={lp("/contact")} className="btn-light !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
        </div>
      </aside>
    </article>
  );
}
