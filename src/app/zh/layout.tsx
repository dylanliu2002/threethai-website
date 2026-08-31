import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import { zh } from "@/content/i18n";
import { organizationSchema, websiteSchema, jsonLd } from "@/lib/seo";

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" lang="zh-CN">
      {jsonLd([organizationSchema(), websiteSchema()])}
      <SiteHeader locale="zh" dict={zh} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale="zh" dict={zh} />
    </div>
  );
}
