import type { Metadata } from "next";
import ManufacturingView from "@/components/manufacturing/manufacturing-view";
import { en } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Manufacturing — PVA Spinning Base in Shandong, China",
  description:
    "Inside the Three Thai production base: 30,000 m², 120,000 spindles, integrated blow room to automatic winding line producing water-soluble PVA yarn, thread, fiber and filament.",
  path: "/manufacturing",
  locale: "en",
  alternates: { en: "/manufacturing", zh: "/zh/manufacturing" },
});

export default function ManufacturingPage() {
  return <ManufacturingView locale="en" dict={en} />;
}
