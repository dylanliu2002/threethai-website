import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactView from "@/components/sections/contact-view";
import { buildMetadata } from "@/lib/seo";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "Contact — Three Thai Textile (山东荣沣纺织)",
    description:
      "Contact the Three Thai Textile team in Shandong, China about water-soluble PVA products, specifications, samples, documents and factory audits.",
    path: "/contact",
    locale,
  });
}

export default async function LangContactPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <ContactView locale={locale} dict={dict} />;
}
