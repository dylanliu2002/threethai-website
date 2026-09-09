import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { buyerAnswers } from "@/content/answers";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { localePath, siteUrl, contentLocaleOf } from "@/content/company";
import { pageMeta } from "@/content/site-copy";
import { answerCard } from "@/content/card-copy";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict, locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: pageMeta[locale].answers.title,
    description: pageMeta[locale].answers.description,
    path: "/answers",
    locale,
  });
}

export default async function LangAnswersPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  const t = dict.answersIndex;
  // A question title on a listing is this page's own label for the entry, so it
  // follows the reader. The answer behind it is deferred content and still renders
  // the model's copy — see src/content/card-copy.ts.
  const teaser = (slug: string) => answerCard(slug, locale);
  // The short answer below stays in the model's language on purpose: a question
  // title is this page's label for an entry, while an answer is the substance of
  // a deferred section. Localising the preview and not the page behind it would
  // put two languages in one reader's decision path for no gain.
  const cl = contentLocaleOf(locale);
  const lp = (p: string) => localePath(p, locale);
  return (
    <>
      {jsonLd([
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.answers, path: lp("/answers") },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.title,
          description: t.lead,
          hasPart: buyerAnswers.map((answer) => ({
            "@type": "Article",
            headline: teaser(answer.slug).question,
            url: `${siteUrl}${lp(`/answers/${answer.slug}`)}`,
          })),
        },
      ])}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.answers, path: lp("/answers") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.breadcrumbs.answers}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {buyerAnswers.length} {t.count}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/50">{t.englishNote}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site">
          <ol className="grid gap-4 md:grid-cols-2">
            {buyerAnswers.map((answer, index) => (
              <Reveal as="li" key={answer.slug} delay={Math.min(index, 8) * 35} className="h-full">
                <Link
                  href={lp(`/answers/${answer.slug}`)}
                  className="card-line group flex h-full flex-col p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="text-sm font-bold text-gold-deep">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 className="font-semibold leading-snug text-ink group-hover:text-primary">{teaser(answer.slug).question}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{answer.shortAnswer[cl]}</p>
                    </div>
                  </div>
                  <span className="mt-4 pl-9 text-sm font-semibold text-primary">{dict.actions.readAnswer} →</span>
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
