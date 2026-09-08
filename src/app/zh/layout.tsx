import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { RootDocument, rootMetadata, rootViewport } from "@/components/layout/root-document";
import { zh } from "@/content/i18n";
import { SWITCHER_AVAILABILITY } from "@/content/switcher-availability";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument locale="zh">
      <div className="flex min-h-screen flex-col">
        {jsonLd([organizationSchema(), websiteSchema()])}
        <SiteHeader locale="zh" dict={zh} availableLocales={SWITCHER_AVAILABILITY} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale="zh" dict={zh} />
      </div>
    </RootDocument>
  );
}
