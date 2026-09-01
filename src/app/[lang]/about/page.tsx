import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AboutView from "@/components/sections/about-view";
import { buildMetadata } from "@/lib/seo";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "About — Three Thai Textile (山东荣沣纺织有限公司)",
    description:
      "Three Thai Textile (山东荣沣纺织有限公司): a specialist water-soluble PVA manufacturer established in 2006 in Huimin County, Shandong — products, philosophy, positioning and company identity.",
    path: "/about",
    locale,
  });
}

export default async function LangAboutPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <AboutView locale={locale} dict={dict} />;
}
