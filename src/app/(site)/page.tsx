import type { Metadata } from "next";
import HomeHero from "@/components/sections/home-hero";
import HomeProducts from "@/components/sections/home-products";
import HomeApplications from "@/components/sections/home-applications";
import HomeWhy from "@/components/sections/home-why";
import HomeManufacturing from "@/components/sections/home-manufacturing";
import HomeQuality from "@/components/sections/home-quality";
import HomeKnowledge from "@/components/sections/home-knowledge";
import HomeCta from "@/components/sections/home-cta";
import { en } from "@/content/i18n";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { siteUrl } from "@/content/company";

export const metadata: Metadata = buildMetadata({
  title: en.meta.defaultTitle,
  description: en.meta.defaultDescription,
  titleAbsolute: true,
  path: "/",
  locale: "en",
  alternates: { en: "/", zh: "/zh" },
});

export default function HomePage() {
  return (
    <>
      {jsonLd([
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${siteUrl}/#webpage`,
          url: `${siteUrl}/`,
          name: en.meta.defaultTitle,
          description: en.meta.defaultDescription,
          inLanguage: "en",
          isPartOf: { "@id": `${siteUrl}/#website` },
          about: { "@id": `${siteUrl}/#organization` },
        },
      ])}
      <HomeHero locale="en" dict={en} />
      <HomeProducts locale="en" dict={en} />
      <HomeApplications locale="en" dict={en} />
      <HomeWhy locale="en" dict={en} />
      <HomeManufacturing locale="en" dict={en} />
      <HomeQuality locale="en" dict={en} />
      <HomeKnowledge locale="en" dict={en} />
      <HomeCta locale="en" dict={en} />
    </>
  );
}
