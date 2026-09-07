import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { RootDocument, rootMetadata, rootViewport } from "@/components/layout/root-document";
import { en } from "@/content/i18n";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument locale="en">
      <div className="flex min-h-screen flex-col">
        {jsonLd([organizationSchema(), websiteSchema()])}
        <SiteHeader locale="en" dict={en} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale="en" dict={en} />
      </div>
    </RootDocument>
  );
}
