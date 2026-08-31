import { notFound } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/seo";
import { htmlLang, isRtl } from "@/content/company";
import { langParams, resolveLang } from "./_lang";

export function generateStaticParams() {
  return langParams();
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { locale, dict } = await resolveLang(params, notFound);
  return (
    <div
      className="flex min-h-screen flex-col"
      lang={htmlLang[locale]}
      dir={isRtl(locale) ? "rtl" : undefined}
    >
      {jsonLd([organizationSchema(), websiteSchema()])}
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} dict={dict} />
    </div>
  );
}
