import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { RootDocument, rootMetadata, rootViewport } from "@/components/layout/root-document";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/seo";
import { langParams, resolveLang } from "./_lang";
import "../globals.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

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
    <RootDocument locale={locale}>
      <div className="flex min-h-screen flex-col">
        {jsonLd([organizationSchema(), websiteSchema()])}
        <SiteHeader locale={locale} dict={dict} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} dict={dict} />
      </div>
    </RootDocument>
  );
}
