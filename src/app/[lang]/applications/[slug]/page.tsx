import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplicationView from "@/components/application/application-view";
import { applications, applicationBySlug } from "@/content/applications";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { contentLocaleOf, localePath, type Locale } from "@/content/company";
import { DISPLAY_PAGES, pageCopyFor } from "@/content/translation-availability";
import { pageMeta } from "@/content/site-copy";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) =>
    applications.map(({ slug }) => ({ lang, slug }))
  );
}

/**
 * The application's published name and summary come from `pageCopyFor` — the
 * same resolution the SEO policy reads — so a promotion of this exact page is
 * what reaches the metadata, and nothing else. This route has always taken its
 * metadata from the English record for every locale, so the English key stays
 * the unpromoted answer and only a promotion replaces it.
 */
function applicationCopy(slug: string, locale: Locale) {
  const application = applicationBySlug(slug)!;
  const { entity, contentLocale } = pageCopyFor(`/applications/${slug}`, locale, application, DISPLAY_PAGES);
  const nameKey = contentLocale === contentLocaleOf(locale) ? "en" : contentLocale;
  return { application, name: entity.name[nameKey], summary: entity.summary[nameKey] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!applicationBySlug(slug)) return {};
  const { dict, locale } = await resolveLang(params, notFound);
  const { application, name, summary } = applicationCopy(slug, locale);
  return buildMetadata({
    title: `${name} — ${pageMeta[locale].applications.suffix}`,
    description: summary,
    path: `/applications/${application.slug}`,
    locale,
    image: application.image,
  });
}

export default async function LangApplicationPage({ params }: Props) {
  const { slug } = await params;
  const app = applicationBySlug(slug);
  if (!app) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  const { name } = applicationCopy(slug, locale);
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: localePath("/", locale) },
        { name: dict.breadcrumbs.applications, path: localePath("/applications", locale) },
        { name, path: localePath(`/applications/${app.slug}`, locale) },
      ])])}
      <ApplicationView application={app} locale={locale} dict={dict} />
    </>
  );
}
