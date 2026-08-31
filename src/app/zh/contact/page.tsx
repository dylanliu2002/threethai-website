import type { Metadata } from "next";
import ContactView from "@/components/sections/contact-view";
import { zh } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "联系我们 — 山东荣沣纺织有限公司",
  description: "就水溶性 PVA 产品、规格、样品、单证与验厂事宜联系山东荣沣纺织团队。",
  path: "/contact",
  locale: "zh",
  alternates: { en: "/contact", zh: "/zh/contact" },
});

export default function ZhContactPage() {
  return <ContactView locale="zh" dict={zh} />;
}
