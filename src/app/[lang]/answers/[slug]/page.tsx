import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import AnswerArticle from "@/components/answers/answer-article";
import { buyerAnswers, answerBySlug, expandedEnglishAnswers } from "@/content/answers";
import { articleSchema, breadcrumbSchema, buildMetadata, faqSchema, jsonLd } from "@/lib/seo";
import { localePath, siteUrl } from "@/content/company";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) => buyerAnswers.map(({ slug }) => ({ lang, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const answer = answerBySlug(slug);
  if (!answer) return {};
  const expanded = expandedEnglishAnswers[slug];
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: `${answer.question} | Buyer Answer`,
    description: expanded?.metaDescription ?? answer.shortAnswer,
    path: `/answers/${answer.slug}`,
    locale,
    type: "article",
  });
}

export default async function LangAnswerPage({ params }: Props) {
  const { slug } = await params;
  const answer = answerBySlug(slug);
  if (!answer) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  const expanded = expandedEnglishAnswers[slug];
  const faqs = expanded?.faqs ?? ([[answer.question, answer.shortAnswer]] as const);
  const lp = (p: string) => localePath(p, locale);

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
          { name: dict.breadcrumbs.home, path: lp("/") },
          { name: dict.breadcrumbs.answers, path: lp("/answers") },
          { name: answer.question, path: lp(`/answers/${answer.slug}`) },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: `${siteUrl}${lp(`/answers/${answer.slug}`)}`,
          inLanguage: locale,
        },
      ])}
      <div className="container-site max-w-3xl py-12 sm:py-16">
        <Breadcrumbs
          locale={locale}
          trail={[
            { name: dict.breadcrumbs.home, path: lp("/") },
            { name: dict.breadcrumbs.answers, path: lp("/answers") },
            { name: answer.question, path: lp(`/answers/${answer.slug}`) },
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
