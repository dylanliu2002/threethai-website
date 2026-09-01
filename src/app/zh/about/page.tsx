import type { Metadata } from "next";
import AboutView from "@/components/sections/about-view";
import { zh } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "关于荣沣纺织 — 山东荣沣纺织有限公司",
  description: "山东荣沣纺织有限公司：成立于 2006 年的水溶性 PVA 专业制造商，位于山东省惠民县——产品体系、制造理念、业务定位与公司主体。",
  path: "/about",
  locale: "zh",
  alternates: { en: "/about", zh: "/zh/about" },
});

export default function ZhAboutPage() {
  return <AboutView locale="zh" dict={zh} />;
}
