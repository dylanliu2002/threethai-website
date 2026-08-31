import type { Metadata } from "next";
import QualityView from "@/components/quality/quality-view";
import { en } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Quality & Certification — ISO 9001, OEKO-TEX Class I, Patents",
  description:
    "Verifiable quality evidence: ISO 9001:2015 certificate (valid to Aug 2029), OEKO-TEX Standard 100 Class I certification for raw-white PVA yarn (valid to Jan 2027), published TESTEX report, and 9 invention patents, 25 utility models plus Nigeria & Malta patents.",
  path: "/quality",
  locale: "en",
  alternates: { en: "/quality", zh: "/zh/quality" },
});

export default function QualityPage() {
  return <QualityView locale="en" dict={en} />;
}
