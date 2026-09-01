import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { buyerAnswers } from "@/content/answers";
import { en } from "@/content/i18n";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "PVA Yarn Buyer Questions & Technical Answers",
  description:
    "Evidence-led answers to 30 common sourcing questions about water-soluble PVA yarn, sewing thread, staple fiber and filament yarn — supplier selection, testing, MOQ, documents and audits.",
  path: "/answers",
  locale: "en",
  alternates: { en: "/answers" },
});

export default function AnswersPage() {
  const dict = en;
  const t = dict.answersIndex;
  return (
    <>
      {jsonLd([
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: "/" },
          { name: dict.breadcrumbs.answers, path: "/answers" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.title,
          description: t.lead,
          hasPart: buyerAnswers.map((answer) => ({
            "@type": "Article",
            headline: answer.question,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com"}/answers/${answer.slug}`,
          })),
        },
      ])}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="en"
              trail={[
                { name: dict.breadcrumbs.home, path: "/" },
                { name: dict.breadcrumbs.answers, path: "/answers" },
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
                  href={`/answers/${answer.slug}`}
                  className="card-line group flex h-full flex-col p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="text-sm font-bold text-gold-deep">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 className="font-semibold leading-snug text-ink group-hover:text-primary">{answer.question}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{answer.shortAnswer}</p>
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
