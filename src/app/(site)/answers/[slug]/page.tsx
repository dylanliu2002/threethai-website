import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { buyerAnswers, answerBySlug, expandedEnglishAnswers } from "@/content/answers";
import { productBySlug } from "@/content/products";
import { en } from "@/content/i18n";
import { articleSchema, breadcrumbSchema, clampMetaDescription, faqSchema, jsonLd } from "@/lib/seo";

type AnswerPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return buyerAnswers.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: AnswerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const answer = answerBySlug(slug);
  if (!answer) return {};
  const expanded = expandedEnglishAnswers[slug];
  const description = clampMetaDescription(expanded?.metaDescription ?? answer.shortAnswer);
  return {
    title: `${answer.question} | Buyer Answer`,
    description,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com"}/answers/${answer.slug}` },
    openGraph: { title: answer.question, description, type: "article" },
  };
}

function ArticleFooterCta() {
  return (
    <aside className="mt-10 rounded-lg bg-primary p-7 text-primary-foreground">
      <h2 className="text-lg font-semibold text-white">{en.productsIndex.ctaTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{en.productsIndex.ctaBody}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/request-sample" className="btn-gold !min-h-10 !px-4 text-sm">{en.actions.requestSample}</Link>
        <Link href="/contact" className="btn-light !min-h-10 !px-4 text-sm">{en.actions.contactTeam}</Link>
      </div>
    </aside>
  );
}

function ExpandedAnswerBody({ slug }: { slug: string }) {
  const expanded = expandedEnglishAnswers[slug]!;
  return (
    <article className="mt-8">
      <p className="eyebrow">{expanded.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{expanded.question}</h1>
      <div className="mt-6 rounded-lg border border-gold/40 bg-accent/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">{expanded.directLabel}</p>
        <p className="mt-2 leading-relaxed text-foreground/90">{expanded.directAnswer}</p>
      </div>
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
        <h2 className="text-xl font-semibold tracking-tight text-ink">{expanded.inquiryHeading}</h2>
        <p className="mt-3 text-base text-muted-foreground">{expanded.inquiryIntro}</p>
        <ul className="mt-4 space-y-2">
          {expanded.askFor.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{expanded.faqHeading}</h2>
        <div className="mt-4 space-y-3">
          {expanded.faqs.map(([question, answer]) => (
            <details key={question} className="card-line group px-5 py-4 open:border-primary/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {question}
                <span aria-hidden="true" className="text-gold-deep transition-transform duration-200 group-open:rotate-45">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{expanded.relatedHeading}</h2>
        <p className="mt-3 text-base text-muted-foreground">{expanded.relatedIntro}</p>
        <ul className="mt-4 space-y-2">
          {expanded.relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm font-medium text-primary hover:underline">{link.label}</Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{expanded.conclusionHeading}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{expanded.conclusion}</p>
      </section>
      <ArticleFooterCta />
    </article>
  );
}

function StandardAnswerBody({ slug }: { slug: string }) {
  const answer = answerBySlug(slug)!;
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
      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{en.answersIndex.askHeading}</h2>
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
        <h2 className="mt-2 font-semibold text-ink">{en.answersIndex.aboutHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{en.answersIndex.aboutBody}</p>
        {related && (
          <Link href={`/products/${related.slug}`} className="btn-primary mt-5 !min-h-10 !px-4 text-sm">
            {related.name.en} →
          </Link>
        )}
      </aside>
      <ArticleFooterCta />
    </article>
  );
}

export default async function AnswerPage({ params }: AnswerPageProps) {
  const { slug } = await params;
  const answer = answerBySlug(slug);
  if (!answer) notFound();
  const expanded = expandedEnglishAnswers[slug];
  const faqs = expanded?.faqs ?? ([[answer.question, answer.shortAnswer]] as const);
  const siteUrlEnv = process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com";

  return (
    <>
      {jsonLd([
        articleSchema({
          headline: answer.question,
          description: expanded?.metaDescription ?? answer.shortAnswer,
          slug: answer.slug,
          datePublished: "2026-08-15",
          dateModified: "2026-08-29",
          section: "answers",
        }),
        faqSchema(faqs),
        breadcrumbSchema([
          { name: en.breadcrumbs.home, path: "/" },
          { name: en.breadcrumbs.answers, path: "/answers" },
          { name: answer.question, path: `/answers/${answer.slug}` },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: `${siteUrlEnv}/answers/${answer.slug}`,
          inLanguage: "en",
        },
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
        <Breadcrumbs
          locale="en"
          trail={[
            { name: en.breadcrumbs.home, path: "/" },
            { name: en.breadcrumbs.answers, path: "/answers" },
            { name: answer.question, path: `/answers/${answer.slug}` },
          ]}
        />
        {expanded ? <ExpandedAnswerBody slug={slug} /> : <StandardAnswerBody slug={slug} />}
        <p className="mt-10 text-xs text-muted-foreground">
          {en.actions.allAnswers}:{" "}
          <Link href="/answers" className="font-semibold text-primary hover:underline">
            {buyerAnswers.length} {en.answersIndex.count}
          </Link>
        </p>
      </div>
    </>
  );
}
