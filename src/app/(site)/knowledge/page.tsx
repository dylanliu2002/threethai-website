import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { articles } from "@/content/articles";
import { en } from "@/content/i18n";
import { pageMeta } from "@/content/site-copy";
import { knowledgeBlocks } from "@/content/resources-groups";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * `site-copy.pageMeta` is the single source for page titles and descriptions.
 * This route used to carry its own copy of the English pair, byte-identical at
 * the time of writing — a third place to edit when the section was renamed, and
 * the one duplication of it that no test covered.
 */
export const metadata: Metadata = buildMetadata({
  title: pageMeta.en.knowledge.title,
  description: pageMeta.en.knowledge.description,
  path: "/knowledge",
  locale: "en",
});

export default function KnowledgePage() {
  const dict = en;
  const t = dict.knowledgeIndex;
  const blocks = knowledgeBlocks();
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  return (
    <>
      {jsonLd([
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: "/" },
          { name: dict.breadcrumbs.knowledge, path: "/knowledge" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.title,
          hasPart: articles.map((a) => ({
            "@type": "Article",
            headline: a.title.en,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com"}/knowledge/${a.slug}`,
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
                { name: dict.breadcrumbs.knowledge, path: "/knowledge" },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.knowledge}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site">
          {blocks.map((block, blockIndex) => {
            // A labelled group takes `<h2>`, so its cards drop to `<h3>`. An
            // unlabelled stretch has no heading above it, and dropping the card to
            // `<h3>` there would skip a level under the page `<h1>` — so the cards
            // stay `<h2>`, which is also exactly what this page renders today.
            const CardTitle = block.label ? "h3" : "h2";
            return (
              <Fragment key={block.label ?? "all"}>
                {block.label && (
                  <h2
                    className={`text-sm font-semibold uppercase tracking-[0.14em] text-gold-deep ${
                      blockIndex === 0 ? "" : "mt-10"
                    }`}
                  >
                    {block.label}
                  </h2>
                )}
                <ul className={block.label ? "mt-4 grid gap-5 md:grid-cols-2" : "grid gap-5 md:grid-cols-2"}>
                  {block.slugs.map((slug, index) => {
                    const article = bySlug.get(slug);
                    if (!article) return null;
                    return (
                      <Reveal as="li" key={article.slug} delay={index * 60} className="h-full">
                        <Link
                          href={`/knowledge/${article.slug}`}
                          className="card-line group flex h-full flex-col p-6 transition-all duration-200 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">{article.category.en}</p>
                            <time dateTime={article.dateModified} className="text-xs text-muted-foreground">
                              {t.updated} {article.dateModified}
                            </time>
                          </div>
                          <CardTitle className="mt-3 font-semibold leading-snug text-ink group-hover:text-primary">{article.title.en}</CardTitle>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{article.intro.en}</p>
                          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                            {dict.actions.readArticle}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                          </span>
                        </Link>
                      </Reveal>
                    );
                  })}
                </ul>
              </Fragment>
            );
          })}

          <Reveal delay={100}>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-secondary p-6">
              <div>
                <h2 className="font-semibold text-ink">{dict.answersIndex.title}</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{dict.answersIndex.lead}</p>
              </div>
              <Link href="/answers" className="btn-primary !min-h-10 !px-4 text-sm">
                {dict.actions.allAnswers} →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
