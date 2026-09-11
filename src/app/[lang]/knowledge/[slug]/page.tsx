import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import ArticleBodyView from "@/components/knowledge/article-body";
import ArticleRelatedView, { type RelatedLinkGroup } from "@/components/knowledge/article-related";
import { articles, articleBySlug } from "@/content/articles";
import { buildMetadata, articleSchema, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { localePath } from "@/content/company";
import { answerCard, applicationCard, articleCard, productCard } from "@/content/card-copy";
import { DISPLAY_PAGES, pageCopyFor } from "@/content/translation-availability";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) => articles.map(({ slug }) => ({ lang, slug })));
}

/**
 * The article's own copy resolves through `pageCopyFor`, the same call the
 * availability policy reads. The product and article links in the footer are
 * cards, so they come from card-copy and follow the reader's language: this
 * page is doing the advertising, and the article behind such a link is deferred
 * content that a record would have to reach on its own.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const record = articleBySlug(slug);
  if (!record) return {};
  const { locale } = await resolveLang(params, notFound);
  const { entity: article, contentLocale } = pageCopyFor(`/knowledge/${slug}`, locale, record, DISPLAY_PAGES);
  return buildMetadata({
    title: article.title[contentLocale],
    description: article.metaDescription[contentLocale],
    path: `/knowledge/${article.slug}`,
    locale,
    type: "article",
    publishedTime: article.datePublished,
    modifiedTime: article.dateModified,
  });
}

export default async function LangArticlePage({ params }: Props) {
  const { slug } = await params;
  const record = articleBySlug(slug);
  if (!record) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  const { entity: article, contentLocale } = pageCopyFor(`/knowledge/${slug}`, locale, record, DISPLAY_PAGES);
  const lp = (p: string) => localePath(p, locale);

  // This article's own navigation, resolved to strings. Labels come from card-copy so
  // the links follow the reader's language; `related` carries slugs only, so no
  // promotion is ever asked to translate a relationship.
  const groups: RelatedLinkGroup[] = [
    {
      heading: dict.actions.exploreProducts,
      variant: "pill",
      items: article.related.products.map((slug) => ({
        label: productCard(slug, locale).name,
        href: lp(`/products/${slug}`),
      })),
    },
    {
      heading: dict.nav.applications,
      variant: "pill",
      items: article.related.applications.map((slug) => ({
        label: applicationCard(slug, locale).name,
        href: lp(`/applications/${slug}`),
      })),
    },
    {
      heading: dict.answersIndex.title,
      variant: "line",
      items: article.related.answers.map((slug) => ({
        label: answerCard(slug, locale).question,
        href: lp(`/answers/${slug}`),
      })),
    },
    {
      heading: dict.actions.allArticles,
      variant: "line",
      items: article.related.articles.map((slug) => ({
        label: articleCard(slug, locale).title,
        href: lp(`/knowledge/${slug}`),
      })),
      // Kept as a trailing row so the answers index stays reachable from every
      // article, as it was before this block became per-article.
      trailing: { label: `${dict.actions.allAnswers} (${dict.answersIndex.count})`, href: lp("/answers") },
    },
  ];

  return (
    <>
      {jsonLd([
        articleSchema({
          headline: article.title[contentLocale],
          description: article.metaDescription[contentLocale],
          slug: article.slug,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          section: "knowledge",
          locale,
        }),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.knowledge, path: lp("/knowledge") },
          { name: article.title[contentLocale], path: lp(`/knowledge/${article.slug}`) },
        ]),
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.knowledge, path: lp("/knowledge") },
          { name: article.title[contentLocale], path: lp(`/knowledge/${article.slug}`) },
        ]}
      />
      <article>
        {/* The eyebrow used to end in a hardcoded English section name, so /zh, /es
            and /de articles carried an English suffix. `nav.knowledge` is the
            section's approved name in all four locales. Guarded by task 61. */}
        <p className="eyebrow mt-8">{article.category[contentLocale]} · {dict.nav.knowledge}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{article.title[contentLocale]}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          <time dateTime={article.datePublished}>{dict.knowledgeIndex.published} {article.datePublished}</time>
          <span aria-hidden="true"> · </span>
          <time dateTime={article.dateModified}>{dict.knowledgeIndex.updated} {article.dateModified}</time>
        </p>
        <p className="mt-6 border-l-2 border-gold pl-5 text-lg leading-relaxed text-foreground/90">{article.intro[contentLocale]}</p>

        <ArticleBodyView body={article.sections[contentLocale]} locale={locale} />

        <aside className="mt-10 rounded-lg bg-primary p-7 text-primary-foreground">
          <h2 className="text-lg font-semibold text-white">{dict.productsIndex.ctaTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{dict.productsIndex.ctaBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={lp("/request-sample")} className="btn-gold !min-h-10 !px-4 text-sm">{dict.actions.requestSample}</Link>
            <Link href={lp("/contact")} className="btn-light !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
          </div>
        </aside>
      </article>

      <ArticleRelatedView groups={groups} />
      </div>
    </>
  );
}
