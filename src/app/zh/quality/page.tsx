import type { Metadata } from "next";
import QualityView from "@/components/quality/quality-view";
import { zh } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "品质与认证 — ISO 9001 · OEKO-TEX I 类 · 34 项专利",
  description:
    "可查验的质量证据：ISO 9001:2015 证书（有效期至 2029 年 8 月）、OEKO-TEX Standard 100 I 类婴幼儿级认证（有效期至 2027 年 1 月）、TESTEX 检测报告，以及 9 项发明专利、25 项实用新型与尼日利亚、马耳他专利。",
  path: "/quality",
  locale: "zh",
  alternates: { en: "/quality", zh: "/zh/quality" },
});

export default function ZhQualityPage() {
  return <QualityView locale="zh" dict={zh} />;
}
