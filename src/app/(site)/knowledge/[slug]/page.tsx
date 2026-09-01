import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { articles, articleBySlug } from "@/content/articles";
import { products } from "@/content/products";
import { en } from "@/content/i18n";
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
    title: article.title,
    description: article.metaDescription,
    path: `/knowledge/${article.slug}`,
    locale: "en",
    alternates: { en: `/knowledge/${article.slug}` },
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
  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <>
      {jsonLd([
        articleSchema({
          headline: article.title,
          description: article.metaDescription,
          slug: article.slug,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          section: "knowledge",
        }),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: "/" },
          { name: dict.breadcrumbs.knowledge, path: "/knowledge" },
          { name: article.title, path: `/knowledge/${article.slug}` },
        ]),
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
        <Breadcrumbs
          locale="en"
          trail={[
            { name: dict.breadcrumbs.home, path: "/" },
            { name: dict.breadcrumbs.knowledge, path: "/knowledge" },
            { name: article.title, path: `/knowledge/${article.slug}` },
          ]}
        />
        <article>
          <p className="eyebrow mt-8">{article.category} · PVA knowledge</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{article.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            <time dateTime={article.datePublished}>{dict.knowledgeIndex.published} {article.datePublished}</time>
            <span aria-hidden="true"> · </span>
            <time dateTime={article.dateModified}>{dict.knowledgeIndex.updated} {article.dateModified}</time>
            <span aria-hidden="true"> · </span>
            <span>{dict.answersIndex.aboutHeading}</span>
          </p>
          <p className="mt-6 border-l-2 border-gold pl-5 text-lg leading-relaxed text-foreground/90">{article.intro}</p>

          {article.sections.map(([heading, body]: readonly [string, string]) => (
            <section key={heading} className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{heading}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{body}</p>
            </section>
          ))}

          <aside className="mt-10 rounded-lg bg-primary p-7 text-primary-foreground">
            <h2 className="text-lg font-semibold text-white">{dict.productsIndex.ctaTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{dict.productsIndex.ctaBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/request-sample" className="btn-gold !min-h-10 !px-4 text-sm">{dict.actions.requestSample}</Link>
              <Link href="/contact" className="btn-light !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
            </div>
          </aside>
        </article>

        <section className="hairline mt-12 pt-8">
          <h2 className="display-3">{dict.actions.exploreProducts}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="inline-block rounded-full border border-input px-4 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary">
                  {p.name.en}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="display-3 mt-8">{dict.actions.allArticles}</h2>
          <ul className="mt-4 space-y-2">
            {others.map((a) => (
              <li key={a.slug}>
                <Link href={`/knowledge/${a.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {a.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/answers" className="text-sm text-muted-foreground hover:text-primary">
                {dict.actions.allAnswers} ({dict.answersIndex.count})
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
