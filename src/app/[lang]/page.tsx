import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeHero from "@/components/sections/home-hero";
import HomeProducts from "@/components/sections/home-products";
import HomeApplications from "@/components/sections/home-applications";
import HomeWhy from "@/components/sections/home-why";
import HomeManufacturing from "@/components/sections/home-manufacturing";
import HomeQuality from "@/components/sections/home-quality";
import HomeKnowledge from "@/components/sections/home-knowledge";
import HomeCta from "@/components/sections/home-cta";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { siteUrl } from "@/content/company";
import { resolveLang } from "./_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dict, locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: dict.meta.defaultTitle,
    description: dict.meta.defaultDescription,
    titleAbsolute: true,
    path: "/",
    locale,
  });
}

export default async function LangHomePage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return (
    <>
      {jsonLd([
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${siteUrl}${locale === "en" ? "" : `/${locale}`}/#webpage`,
          url: `${siteUrl}${locale === "en" ? "" : `/${locale}`}/`,
          name: dict.meta.defaultTitle,
          description: dict.meta.defaultDescription,
          inLanguage: locale,
          isPartOf: { "@id": `${siteUrl}/#website` },
          about: { "@id": `${siteUrl}/#organization` },
        },
      ])}
      <HomeHero locale={locale} dict={dict} />
      <HomeProducts locale={locale} dict={dict} />
      <HomeApplications locale={locale} dict={dict} />
      <HomeWhy locale={locale} dict={dict} />
      <HomeManufacturing locale={locale} dict={dict} />
      <HomeQuality locale={locale} dict={dict} />
      <HomeKnowledge locale={locale} dict={dict} />
      <HomeCta locale={locale} dict={dict} />
    </>
  );
}
