import type { Metadata } from "next";
import HomeHero from "@/components/sections/home-hero";
import HomeProducts from "@/components/sections/home-products";
import HomeApplications from "@/components/sections/home-applications";
import HomeWhy from "@/components/sections/home-why";
import HomeManufacturing from "@/components/sections/home-manufacturing";
import HomeQuality from "@/components/sections/home-quality";
import HomeCta from "@/components/sections/home-cta";
import { zh } from "@/content/i18n";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { siteUrl } from "@/content/company";

export const metadata: Metadata = buildMetadata({
  title: zh.meta.defaultTitle,
  description: zh.meta.defaultDescription,
  titleAbsolute: true,
  path: "/",
  locale: "zh",
  alternates: { en: "/", zh: "/zh" },
});

export default function ZhHomePage() {
  return (
    <>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${siteUrl}/zh#webpage`,
        url: `${siteUrl}/zh`,
        name: zh.meta.defaultTitle,
        description: zh.meta.defaultDescription,
        inLanguage: "zh-CN",
        isPartOf: { "@id": `${siteUrl}/#website` },
      })}
      <HomeHero locale="zh" dict={zh} />
      <HomeProducts locale="zh" dict={zh} />
      <HomeApplications locale="zh" dict={zh} />
      <HomeWhy locale="zh" dict={zh} />
      <HomeManufacturing locale="zh" dict={zh} />
      <HomeQuality locale="zh" dict={zh} />
      <HomeCta locale="zh" dict={zh} />
    </>
  );
}
