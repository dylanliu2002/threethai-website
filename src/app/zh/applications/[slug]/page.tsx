import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplicationView from "@/components/application/application-view";
import { applications, applicationBySlug } from "@/content/applications";
import { zh } from "@/content/i18n";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";

type AppPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return applications.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = applicationBySlug(slug);
  if (!app) return {};
  return buildMetadata({
    title: `${app.name.zh} — 水溶性 PVA 应用`,
    description: app.summary.zh,
    path: `/applications/${app.slug}`,
    locale: "zh",
    alternates: { en: `/applications/${app.slug}`, zh: `/zh/applications/${app.slug}` },
    image: app.image,
  });
}

export default async function ZhApplicationPage({ params }: AppPageProps) {
  const { slug } = await params;
  const app = applicationBySlug(slug);
  if (!app) notFound();
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: zh.breadcrumbs.home, path: "/zh" },
        { name: zh.breadcrumbs.applications, path: "/zh/applications" },
        { name: app.name.zh, path: `/zh/applications/${app.slug}` },
      ])])}
      <ApplicationView application={app} locale="zh" dict={zh} />
    </>
  );
}
