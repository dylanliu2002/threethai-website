import type { Metadata } from "next";
import { company, htmlLang, localePath, locales, siteUrl, type Locale } from "@/content/company";

/**
 * Metadata + JSON-LD helpers. Canonicals derive from NEXT_PUBLIC_SITE_URL so a
 * domain cutover switches every URL in one place.
 */

type MetaInput = {
  title: string;
  /** Skip the "%s | brand" template (used by the homepage). */
  titleAbsolute?: boolean;
  description: string;
  path: string;
  locale: Locale;
  /** Other locale versions that exist for this page (paths, locale-keyed). */
  alternates?: Partial<Record<Locale, string>>;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: readonly string[];
  noindex?: boolean;
};

/**
 * Clamp a meta description to search-engine-safe length. Bing/Google show only
 * the first ~150-160 characters; long descriptions are cut at a word boundary
 * with an ellipsis so no page ships an over-length description.
 */
export const clampMetaDescription = (d: string): string =>
  d.length <= 158 ? d : `${d.slice(0, 155).replace(/\s+\S*$/, "").replace(/[,;:\-–—]$/, "")}...`;

export function buildMetadata(input: MetaInput): Metadata {
  const { title, path, locale } = input;
  const description = clampMetaDescription(input.description);
  const canonical = `${siteUrl}${localePath(path, locale)}`;
  // Full hreflang graph across all ten locales (EN at the root, /{lang} prefixes).
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[htmlLang[l]] = `${siteUrl}${localePath(path, l)}`;
  }
  languages["x-default"] = `${siteUrl}${localePath(path, "en")}`;
  const ogLocale: Record<Locale, string> = {
    en: "en_US",
    zh: "zh_CN",
    es: "es_ES",
    pt: "pt_BR",
    ru: "ru_RU",
    ar: "ar_AR",
    tr: "tr_TR",
    vi: "vi_VN",
    id: "id_ID",
    de: "de_DE",
  };
  const image = `${siteUrl}${input.image ?? "/og.jpg"}`;

  return {
    title: input.titleAbsolute ? { absolute: title } : title,
    description,
    keywords: input.keywords ? [...input.keywords] : undefined,
    metadataBase: new URL(siteUrl),
    alternates: { canonical, languages: Object.keys(languages).length ? languages : undefined },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: company.shortBrandEn,
      type: input.type ?? "website",
      locale: ogLocale[locale],
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(input.type === "article" ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/* ------------------------------ JSON-LD ------------------------------ */

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: company.nameExportEn,
  alternateName: [company.nameLegalZh, "Three Thai", "threethai", company.brandMark],
  url: siteUrl,
  logo: `${siteUrl}/favicon-256.png`, // square brand mark (Google publisher-logo preference)
  email: company.email,
  telephone: company.phoneDisplay,
  foundingDate: String(company.establishedYear),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Huimin County",
    addressRegion: "Shandong",
    addressCountry: "CN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: company.email,
      telephone: company.phoneDisplay,
      availableLanguage: ["English", "Chinese"],
    },
  ],
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: company.nameExportEn,
  publisher: { "@id": `${siteUrl}/#organization` },
  inLanguage: ["en", "zh-CN"],
});

export const breadcrumbSchema = (trail: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${siteUrl}${item.path}`,
  })),
});

export const productSchema = (product: {
  name: string;
  description: string;
  image: string;
  slug: string;
}) => {
  const url = `${siteUrl}/products/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description,
    image: `${siteUrl}${product.image}`,
    brand: { "@type": "Brand", name: company.shortBrandExport },
    manufacturer: { "@type": "Organization", name: company.nameLegalZh, url: siteUrl },
    url,
  };
};

export const faqSchema = (faqs: readonly (readonly [string, string])[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
});

export const articleSchema = (article: {
  headline: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified: string;
  section: "knowledge" | "answers";
}) => {
  const url = `${siteUrl}/${article.section}/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: { "@type": "Organization", name: company.nameLegalZh, url: siteUrl },
    publisher: { "@type": "Organization", name: company.nameExportEn, url: siteUrl },
    mainEntityOfPage: url,
    image: `${siteUrl}/og.jpg`,
  };
};

export function jsonLd(schemas: object | object[]) {
  const data = Array.isArray(schemas) && schemas.length > 0 ? (schemas.length === 1 ? schemas[0] : schemas) : schemas;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
