import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactView from "@/components/sections/contact-view";
import { buildMetadata } from "@/lib/seo";
import { pageMeta } from "@/content/site-copy";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict, locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: pageMeta[locale].contact.title,
    description: pageMeta[locale].contact.description,
    path: "/contact",
    locale,
  });
}

export default async function LangContactPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <ContactView locale={locale} dict={dict} />;
}
