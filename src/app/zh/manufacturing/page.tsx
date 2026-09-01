import type { Metadata } from "next";
import ManufacturingView from "@/components/manufacturing/manufacturing-view";
import { zh } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "生产制造 — 山东 PVA 专纺生产基地",
  description: "走进荣沣生产基地：30,000 平方米、120,000 锭，从清花到自动络筒的完整生产线，制造水溶性 PVA 纱线、缝纫线、短纤和长丝。",
  path: "/manufacturing",
  locale: "zh",
  alternates: { en: "/manufacturing", zh: "/zh/manufacturing" },
});

export default function ZhManufacturingPage() {
  return <ManufacturingView locale="zh" dict={zh} />;
}
