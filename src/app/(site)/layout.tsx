import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { en } from "@/content/i18n";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {jsonLd([organizationSchema(), websiteSchema()])}
      <SiteHeader locale="en" dict={en} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale="en" dict={en} />
    </div>
  );
}
