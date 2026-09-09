import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QualityView from "@/components/quality/quality-view";
import { buildMetadata } from "@/lib/seo";
import { resolveLang } from "../_lang";
import { pageMeta } from "@/content/site-copy";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: pageMeta[locale].quality.title,
    description: pageMeta[locale].quality.description,
    path: "/quality",
    locale,
  });
}

export default async function LangQualityPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <QualityView locale={locale} dict={dict} />;
}
