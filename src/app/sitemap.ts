import type { MetadataRoute } from "next";
import { dynamicLocales, htmlLang, localePath, siteUrl, type Locale } from "@/content/company";
import { products } from "@/content/products";
import { applications } from "@/content/applications";
import { articles } from "@/content/articles";
import { buyerAnswers } from "@/content/answers";

/**
 * Multilingual sitemap. English routes live at the root (preserving every
 * legacy indexed URL); Simplified Chinese lives under /zh for the core buyer
 * journey; the eight additional UI locales live under /{lang} for the core
 * buyer journey (deep content falls back to English on those routes).
 *
 * Entries use `alternates.languages` to declare the full hreflang graph.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-01");

  /** Core buyer-journey paths localised for every UI locale. */
  const corePaths: string[] = [
    "/",
    "/products",
    ...products.map(({ slug }) => `/products/${slug}`),
    "/applications",
    ...applications.map(({ slug }) => `/applications/${slug}`),
    "/manufacturing",
    "/quality",
    "/about",
    "/contact",
    "/request-quote",
    "/request-sample",
    "/product-finder",
    "/knowledge",
    "/answers",
  ];

  /** English-only deep content (articles + buyer answers). */
  const enOnlyPaths: string[] = [
    ...articles.map(({ slug }) => `/knowledge/${slug}`),
    ...buyerAnswers.map(({ slug }) => `/answers/${slug}`),
  ];

  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap[number] => {
    const languages: Record<string, string> = {};
    for (const l of ["en", "zh", ...dynamicLocales] as Locale[]) {
      languages[htmlLang[l]] = `${siteUrl}${localePath(path, l)}`;
    }
    languages["x-default"] = `${siteUrl}${localePath(path, "en")}`;
    return {
      url: `${siteUrl}${localePath(path, "en")}`,
      lastModified: updated,
      changeFrequency,
      priority,
      alternates: { languages },
    };
  };

  const enOnlyEntry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    lastModified: updated,
    changeFrequency: "monthly",
    priority,
  });

  const priorities: Record<string, { priority: number; changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]> }> = {
    "/": { priority: 1, changeFrequency: "weekly" },
    "/products": { priority: 0.9, changeFrequency: "monthly" },
    "/applications": { priority: 0.8, changeFrequency: "monthly" },
    "/manufacturing": { priority: 0.8, changeFrequency: "monthly" },
    "/quality": { priority: 0.85, changeFrequency: "monthly" },
    "/about": { priority: 0.6, changeFrequency: "yearly" },
    "/contact": { priority: 0.7, changeFrequency: "yearly" },
    "/request-quote": { priority: 0.9, changeFrequency: "yearly" },
    "/request-sample": { priority: 0.85, changeFrequency: "yearly" },
    "/product-finder": { priority: 0.7, changeFrequency: "yearly" },
    "/knowledge": { priority: 0.75, changeFrequency: "monthly" },
    "/answers": { priority: 0.85, changeFrequency: "weekly" },
  };

  const core = corePaths.map((path) => {
    const meta = priorities[path] ?? { priority: 0.8, changeFrequency: "monthly" as const };
    return entry(path, meta.priority, meta.changeFrequency);
  });

  // Product & application detail entries share their section priority.
  const productDetails = products.map(({ slug }) => entry(`/products/${slug}`, 0.85, "monthly"));
  const applicationDetails = applications.map(({ slug }) => entry(`/applications/${slug}`, 0.75, "monthly"));
  const enOnly = enOnlyPaths.map((path) => enOnlyEntry(path, path.startsWith("/knowledge/") ? 0.7 : 0.65));

  // De-duplicate: corePaths already includes /products etc. but detail lists are separate.
  const seen = new Set<string>();
  const all: MetadataRoute.Sitemap = [];
  for (const item of [...core, ...productDetails, ...applicationDetails, ...enOnly]) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    all.push(item);
  }
  return all;
}
