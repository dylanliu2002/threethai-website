import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplicationView from "@/components/application/application-view";
import { applications, applicationBySlug } from "@/content/applications";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { localePath } from "@/content/company";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) =>
    applications.map(({ slug }) => ({ lang, slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = applicationBySlug(slug);
  if (!app) return {};
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: `${app.name.en} — Water-Soluble PVA Applications`,
    description: app.summary.en,
    path: `/applications/${app.slug}`,
    locale,
    image: app.image,
  });
}

export default async function LangApplicationPage({ params }: Props) {
  const { slug } = await params;
  const app = applicationBySlug(slug);
  if (!app) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: localePath("/", locale) },
        { name: dict.breadcrumbs.applications, path: localePath("/applications", locale) },
        { name: app.name.en, path: localePath(`/applications/${app.slug}`, locale) },
      ])])}
      <ApplicationView application={app} locale={locale} dict={dict} />
    </>
  );
}
