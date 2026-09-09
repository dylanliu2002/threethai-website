import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AboutView from "@/components/sections/about-view";
import { buildMetadata } from "@/lib/seo";
import { pageMeta } from "@/content/site-copy";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict, locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: pageMeta[locale].about.title,
    description: pageMeta[locale].about.description,
    path: "/about",
    locale,
  });
}

export default async function LangAboutPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <AboutView locale={locale} dict={dict} />;
}
