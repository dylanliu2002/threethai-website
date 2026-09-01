import { dynamicLocales, type Locale } from "@/content/company";
import { getDictionary, type Dictionary } from "@/content/i18n";

/** generateStaticParams for every /[lang] route — the eight prefixed locales. */
export function langParams(): { lang: string }[] {
  return dynamicLocales.map((lang) => ({ lang }));
}

export type LangResult = { locale: Locale; dict: Dictionary };

/** Resolve + validate the lang segment; call notFound() when invalid. */
export async function resolveLang(
  params: Promise<{ lang: string }>,
  notFound: () => never
): Promise<LangResult> {
  const { lang } = await params;
  if (!(dynamicLocales as readonly string[]).includes(lang)) notFound();
  const locale = lang as Locale;
  return { locale, dict: getDictionary(locale) };
}
