import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManufacturingView from "@/components/manufacturing/manufacturing-view";
import { buildMetadata } from "@/lib/seo";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "Manufacturing — PVA Spinning Base in Shandong, China",
    description:
      "Inside the Three Thai production base: 30,000 m², 120,000 spindles, integrated blow room to automatic winding line producing water-soluble PVA yarn, thread, fiber and filament.",
    path: "/manufacturing",
    locale,
  });
}

export default async function LangManufacturingPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return <ManufacturingView locale={locale} dict={dict} />;
}
