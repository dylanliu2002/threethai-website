import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import ArticleBodyView from "@/components/knowledge/article-body";
import ArticleRelatedView, { type RelatedLinkGroup } from "@/components/knowledge/article-related";
import { articles, articleBySlug } from "@/content/articles";
import { en } from "@/content/i18n";
import { answerCard, applicationCard, articleCard, productCard } from "@/content/card-copy";
import { buildMetadata, articleSchema, breadcrumbSchema, jsonLd } from "@/lib/seo";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title.en,
    description: article.metaDescription.en,
    path: `/knowledge/${article.slug}`,
    locale: "en",
    type: "article",
    publishedTime: article.datePublished,
    modifiedTime: article.dateModified,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();
  const dict = en;

  // This article's own navigation. `card-copy` at "en" returns the entity's own
  // English (the module asserts the pair is equal and throws if it drifts), so the
  // labels are byte-identical to the direct `p.name.en` reads this block replaces —
  // and both article routes now resolve related content the same one way.
  const groups: RelatedLinkGroup[] = [
    {
      heading: dict.actions.exploreProducts,
      variant: "pill",
      items: article.related.products.map((slug) => ({
        label: productCard(slug, "en").name,
        href: `/products/${slug}`,
      })),
    },
    {
      heading: dict.nav.applications,
      variant: "pill",
      items: article.related.applications.map((slug) => ({
        label: applicationCard(slug, "en").name,
        href: `/applications/${slug}`,
      })),
    },
    {
      heading: dict.answersIndex.title,
      variant: "line",
      items: article.related.answers.map((slug) => ({
        label: answerCard(slug, "en").question,
        href: `/answers/${slug}`,
      })),
    },
    {
      heading: dict.actions.allArticles,
      variant: "line",
      items: article.related.articles.map((slug) => ({
        label: articleCard(slug, "en").title,
        href: `/knowledge/${slug}`,
      })),
      trailing: { label: `${dict.actions.allAnswers} (${dict.answersIndex.count})`, href: "/answers" },
    },
  ];

  return (
    <>
      {jsonLd([
        articleSchema({
          headline: article.title.en,
          description: article.metaDescription.en,
          slug: article.slug,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          section: "knowledge",
        }),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: "/" },
          { name: dict.breadcrumbs.knowledge, path: "/knowledge" },
          { name: article.title.en, path: `/knowledge/${article.slug}` },
        ]),
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
        <Breadcrumbs
          locale="en"
          trail={[
            { name: dict.breadcrumbs.home, path: "/" },
            { name: dict.breadcrumbs.knowledge, path: "/knowledge" },
            { name: article.title.en, path: `/knowledge/${article.slug}` },
          ]}
        />
        <article>
          <p className="eyebrow mt-8">{article.category.en} · {dict.nav.knowledge}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{article.title.en}</h1>
          {/*
            This byline used to end in an "About this answer" label — the answer
            section's heading key printed on an article page, an orphan with no
            answer box behind it and the wrong noun for the page it was on. The
            localized route never had it, so this is a removal from one page rather
            than a label added to twelve. Guarded by task 61.
          */}
          <p className="mt-4 text-sm text-muted-foreground">
            <time dateTime={article.datePublished}>{dict.knowledgeIndex.published} {article.datePublished}</time>
            <span aria-hidden="true"> · </span>
            <time dateTime={article.dateModified}>{dict.knowledgeIndex.updated} {article.dateModified}</time>
          </p>
          <p className="mt-6 border-l-2 border-gold pl-5 text-lg leading-relaxed text-foreground/90">{article.intro.en}</p>

          <ArticleBodyView body={article.sections.en} locale="en" />

          <aside className="mt-10 rounded-lg bg-primary p-7 text-primary-foreground">
            <h2 className="text-lg font-semibold text-white">{dict.productsIndex.ctaTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{dict.productsIndex.ctaBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/request-sample" className="btn-gold !min-h-10 !px-4 text-sm">{dict.actions.requestSample}</Link>
              <Link href="/contact" className="btn-light !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
            </div>
          </aside>
        </article>

        <ArticleRelatedView groups={groups} />
      </div>
    </>
  );
}
