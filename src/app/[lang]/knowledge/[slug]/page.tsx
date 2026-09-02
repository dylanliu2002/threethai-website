import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { articles, articleBySlug } from "@/content/articles";
import { products } from "@/content/products";
import { buildMetadata, articleSchema, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { localePath, contentLocaleOf } from "@/content/company";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) => articles.map(({ slug }) => ({ lang, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};
  const { locale } = await resolveLang(params, notFound);
  const cl = contentLocaleOf(locale);
  return buildMetadata({
    title: article.title[cl],
    description: article.metaDescription[cl],
    path: `/knowledge/${article.slug}`,
    locale,
    type: "article",
    publishedTime: article.datePublished,
    modifiedTime: article.dateModified,
  });
}

export default async function LangArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  const cl = contentLocaleOf(locale);
  const lp = (p: string) => localePath(p, locale);
  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <>
      {jsonLd([
        articleSchema({
          headline: article.title[cl],
          description: article.metaDescription[cl],
          slug: article.slug,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          section: "knowledge",
        }),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.knowledge, path: lp("/knowledge") },
          { name: article.title[cl], path: lp(`/knowledge/${article.slug}`) },
        ]),
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
      <Breadcrumbs
        locale={locale}
        trail={[
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.knowledge, path: lp("/knowledge") },
          { name: article.title[cl], path: lp(`/knowledge/${article.slug}`) },
        ]}
      />
      <article>
        <p className="eyebrow mt-8">{article.category[cl]} · PVA knowledge</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{article.title[cl]}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          <time dateTime={article.datePublished}>{dict.knowledgeIndex.published} {article.datePublished}</time>
          <span aria-hidden="true"> · </span>
          <time dateTime={article.dateModified}>{dict.knowledgeIndex.updated} {article.dateModified}</time>
        </p>
        <p className="mt-6 border-l-2 border-gold pl-5 text-lg leading-relaxed text-foreground/90">{article.intro[cl]}</p>

        {article.sections[cl].map((section) => (
          <section key={section[0]} className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{section[0]}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{section[1]}</p>
          </section>
        ))}

        <aside className="mt-10 rounded-lg bg-primary p-7 text-primary-foreground">
          <h2 className="text-lg font-semibold text-white">{dict.productsIndex.ctaTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{dict.productsIndex.ctaBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={lp("/request-sample")} className="btn-gold !min-h-10 !px-4 text-sm">{dict.actions.requestSample}</Link>
            <Link href={lp("/contact")} className="btn-light !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
          </div>
        </aside>
      </article>

      <section className="hairline mt-12 pt-8">
        <h2 className="display-3">{dict.actions.exploreProducts}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {products.map((p) => (
            <li key={p.slug}>
              <Link href={lp(`/products/${p.slug}`)} className="inline-block rounded-full border border-input px-4 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary">
                {p.name[cl]}
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="display-3 mt-8">{dict.actions.allArticles}</h2>
        <ul className="mt-4 space-y-2">
          {others.map((a) => (
            <li key={a.slug}>
              <Link href={lp(`/knowledge/${a.slug}`)} className="text-sm font-medium text-primary hover:underline">
                {a.title[cl]}
              </Link>
            </li>
          ))}
          <li>
            <Link href={lp("/answers")} className="text-sm text-muted-foreground hover:text-primary">
              {dict.actions.allAnswers} ({dict.answersIndex.count})
            </Link>
          </li>
        </ul>
      </section>
      </div>
    </>
  );
}
