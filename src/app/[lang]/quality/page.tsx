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
      "Verifiable quality evidence: ISO 9001:2015 certificate (valid to Aug 2029), OEKO-TEX Standard 100 Class I certification for raw-white PVA yarn (valid to Jan 2027), published TESTEX report, and 9 invention patents, 25 utility models plus Nigeria & Malta patents.",
    path: "/quality",
    locale,
  });
}

export default async function LangQualityPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <QualityView locale={locale} dict={dict} />;
}
