import type { Metadata } from "next";
import AboutView from "@/components/sections/about-view";
import { en } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About — Three Thai Textile (山东荣沣纺织有限公司)",
  description:
    "Three Thai Textile (山东荣沣纺织有限公司): a specialist water-soluble PVA manufacturer established in 2006 in Huimin County, Shandong — products, philosophy, positioning and company identity.",
  path: "/about",
  locale: "en",
  alternates: { en: "/about", zh: "/zh/about" },
});

export default function AboutPage() {
  return <AboutView locale="en" dict={en} />;
}
