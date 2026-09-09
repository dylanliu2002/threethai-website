import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManufacturingView from "@/components/manufacturing/manufacturing-view";
import { buildMetadata } from "@/lib/seo";
import { pageMeta } from "@/content/server-copy";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict, locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: pageMeta[locale].manufacturing.title,
    description: pageMeta[locale].manufacturing.description,
    path: "/manufacturing",
    locale,
  });
}

export default async function LangManufacturingPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <ManufacturingView locale={locale} dict={dict} />;
}
