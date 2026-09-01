import type { Metadata } from "next";
import ContactView from "@/components/sections/contact-view";
import { en } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact — Three Thai Textile (山东荣沣纺织)",
  description:
    "Contact the Three Thai Textile team in Shandong, China about water-soluble PVA products, specifications, samples, documents and factory audits.",
  path: "/contact",
  locale: "en",
  alternates: { en: "/contact", zh: "/zh/contact" },
});

export default function ContactPage() {
  return <ContactView locale="en" dict={en} />;
}
