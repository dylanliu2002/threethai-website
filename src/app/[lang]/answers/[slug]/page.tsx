import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import AnswerArticle from "@/components/answers/answer-article";
import { buyerAnswers, answerBySlug, expandedAnswerFor } from "@/content/answers";
import { articleSchema, breadcrumbSchema, buildMetadata, faqSchema, jsonLd, webPageSchema } from "@/lib/seo";
import { localePath, contentLocaleOf, type Locale } from "@/content/company";
import { pageCopyFor } from "@/content/translation-availability";
import { pageMeta } from "@/content/site-copy";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) => buyerAnswers.map(({ slug }) => ({ lang, slug })));
}

/**
 * The answer's own copy and its SEO ownership both resolve from `pageCopyFor`.
 * The per-locale expansion pack (`expandedAnswerFor`) is English and Chinese
 * material only, so it is used exactly as far as this page is still rendering
 * that modelled copy: once the page is promoted, mixing the English expansion
 * blocks back in would put English prose on a page that owns itself as Spanish.
 */
function answerCopy(slug: string, locale: Locale) {
  const record = answerBySlug(slug)!;
  const { entity, contentLocale } = pageCopyFor(`/answers/${slug}`, locale, record);
  const modelled = contentLocaleOf(locale);
  const expanded = contentLocale === modelled ? expandedAnswerFor(slug, modelled) : undefined;
  return {
    record,
    question: entity.question[contentLocale],
    shortAnswer: entity.shortAnswer[contentLocale],
    expanded,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!answerBySlug(slug)) return {};
  const { dict, locale } = await resolveLang(params, notFound);
  const { question, shortAnswer, expanded } = answerCopy(slug, locale);
  return buildMetadata({
    title: `${question} | ${pageMeta[locale].answers.suffix}`,
    description: expanded?.metaDescription ?? shortAnswer,
    path: `/answers/${slug}`,
    locale,
    type: "article",
  });
}

export default async function LangAnswerPage({ params }: Props) {
  const { slug } = await params;
  const answer = answerBySlug(slug);
  if (!answer) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  const { question, shortAnswer, expanded } = answerCopy(slug, locale);
  const faqs = expanded?.faqs ?? ([[question, shortAnswer]] as const);
  const lp = (p: string) => localePath(p, locale);

  return (
    <>
      {jsonLd([
        articleSchema({
          headline: question,
          description: expanded?.metaDescription ?? shortAnswer,
          slug: answer.slug,
          datePublished: "2026-08-15",
          dateModified: "2026-08-29",
          section: "answers",
          locale,
        }),
        faqSchema(faqs),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.answers, path: lp("/answers") },
          { name: question, path: lp(`/answers/${answer.slug}`) },
        ]),
        webPageSchema({
          path: `/answers/${answer.slug}`,
          locale,
          name: question,
          description: expanded?.metaDescription ?? shortAnswer,
        }),
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
        <Breadcrumbs
          locale={locale}
          trail={[
            { name: dict.breadcrumbs.home, path: lp("/") },
            { name: dict.breadcrumbs.answers, path: lp("/answers") },
            { name: question, path: lp(`/answers/${answer.slug}`) },
          ]}
        />
        <AnswerArticle slug={slug} locale={locale} dict={dict} />
        <p className="mt-10 text-xs text-muted-foreground">
          {dict.actions.allAnswers}:{" "}
          <Link href={lp("/answers")} className="font-semibold text-primary hover:underline">
            {buyerAnswers.length} {dict.answersIndex.count}
          </Link>
        </p>
      </div>
    </>
  );
}
