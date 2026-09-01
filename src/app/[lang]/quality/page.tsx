import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QualityView from "@/components/quality/quality-view";
import { buildMetadata } from "@/lib/seo";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "Quality & Certification — ISO 9001, OEKO-TEX Class I, Patents",
    description:
      "ISO 9001:2015 (to Aug 2029), OEKO-TEX Standard 100 Class I (to Jan 2027), TESTEX report and 34 granted patents - evidence you can verify, document by document.",
    path: "/quality",
    locale,
  });
}

export default async function LangQualityPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <QualityView locale={locale} dict={dict} />;
}
