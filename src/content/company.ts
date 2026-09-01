/**
 * Centralized company identity — the ONLY place that names the company.
 *
 * Naming notes (see docs/site-rebuild-plan.md §6):
 * - The dual-name relationship is now VERIFIED from official documents:
 *   the ISO 9001 certificate (23226Q00380R101) and the OEKO-TEX Standard 100
 *   certificate (SH005 149658) are issued to the same entity, printed as
 *   山东荣沣纺织有限公司 (CN) / SHANDONG THREE THAI TEXTILE CO., LTD. (EN).
 * - 山东惠民三泰纺织有限公司 (Shandong Huimin Santai Textile Co., Ltd.) is a
 *   separate legal entity at the same address that co-owns several patents
 *   with 荣沣 — it is a related company, not a trading name of this site.
 */

export const company = {
  nameLegalZh: "山东荣沣纺织有限公司",
  /** Official English legal name — verified against ISO 9001 & OEKO-TEX certificates. */
  nameExportEn: "Shandong Three Thai Textile Co., Ltd.",
  shortBrandEn: "Three Thai Textile",
  /** Product brand — displayed with the ™ mark. */
  brandMark: "threethai™",
  shortBrandExport: "Three Thai Textile",
  /** Unified Social Credit Code — printed on the ISO 9001 certificate. */
  uscc: "91371621MA3CH7D83K",
  establishedYear: 2006,
  locationZh: "中国山东省惠民县",
  locationEn: "Huimin County, Shandong Province, China",
  /** Registered/production address — as printed on the ISO 9001 certificate (zh). */
  addressZh: "山东省滨州市惠民县淄角镇南街村",
  addressEn: "Nanjie Village, Zijiao Town, Huimin County, Binzhou, Shandong, China",
  email: "salesmanager@threethai.com",
  phoneDisplay: "+86 187 0662 1275",
  phoneHref: "+8618706621275",
  whatsappHref: "https://wa.me/8618706621275",
} as const;

/** Public origin — drives canonicals, sitemap and structured data. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com").replace(/\/$/, "");

/** Internal export-operations tool. Kept out of primary navigation. */
export const letterOfCreditUrl = (process.env.NEXT_PUBLIC_LC_URL || "https://lc.threethailc.xyz").replace(/\/$/, "");

/**
 * Locales.
 *
 * - ContentLocale: languages with fully translated deep content
 *   (products, applications, articles, answers, quality, patents).
 * - Locale (UI): the ten site languages. UI chrome is translated for all
 *   ten; the eight additional locales fall back to English deep content
 *   while keeping fully localized navigation, homepage, forms and CTAs.
 */
export type ContentLocale = "en" | "zh";

export type Locale = ContentLocale | "es" | "pt" | "ru" | "ar" | "tr" | "vi" | "id" | "de";

export const locales: Locale[] = ["en", "zh", "es", "pt", "ru", "ar", "tr", "vi", "id", "de"];

/**
 * Locales served by the dynamic /[lang] routes (everything except en at root).
 * zh is served here too: the hand-translated static /zh pages keep precedence
 * for their routes, while any /zh path without a static override (knowledge,
 * answers, product-finder, request-sample, article detail pages) is rendered
 * by /[lang] with the zh dictionary — this keeps the hreflang graph honest.
 */
export const dynamicLocales: readonly Exclude<Locale, "en">[] = ["zh", "es", "pt", "ru", "ar", "tr", "vi", "id", "de"];

/** Deep-content language used to render Record<ContentLocale> data. */
export function contentLocaleOf(locale: Locale): ContentLocale {
  return locale === "zh" ? "zh" : "en";
}

/** BCP-47 tag for the lang attribute / hreflang. */
export const htmlLang: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  es: "es",
  pt: "pt",
  ru: "ru",
  ar: "ar",
  tr: "tr",
  vi: "vi",
  id: "id",
  de: "de",
};

/** Native endonyms for the language switcher. */
export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
  es: "Español",
  pt: "Português",
  ru: "Русский",
  ar: "العربية",
  tr: "Türkçe",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  de: "Deutsch",
};

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

/** Prefixed route for a locale — English stays at the root (legacy SEO URLs). */
export function localePath(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path;
  if (locale === "en") return clean || "/";
  return `/${locale}${clean || ""}`;
}

/** @deprecated legacy helper kept for compatibility — use contentLocaleOf. */
export function legacyContentLocale(locale: Locale): ContentLocale {
  return contentLocaleOf(locale);
}
