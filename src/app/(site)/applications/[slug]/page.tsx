import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplicationView from "@/components/application/application-view";
import { applications, applicationBySlug } from "@/content/applications";
import { en } from "@/content/i18n";
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
    title: `${app.name.en} — Water-Soluble PVA Applications`,
    description: app.summary.en,
    path: `/applications/${app.slug}`,
    locale: "en",
    alternates: { en: `/applications/${app.slug}`, zh: `/zh/applications/${app.slug}` },
    image: app.image,
  });
}

export default async function ApplicationPage({ params }: AppPageProps) {
  const { slug } = await params;
  const app = applicationBySlug(slug);
  if (!app) notFound();
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: en.breadcrumbs.home, path: "/" },
        { name: en.breadcrumbs.applications, path: "/applications" },
        { name: app.name.en, path: `/applications/${app.slug}` },
      ])])}
      <ApplicationView application={app} locale="en" dict={en} />
    </>
  );
}
