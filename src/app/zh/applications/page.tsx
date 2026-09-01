import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { applications } from "@/content/applications";
import { zh } from "@/content/i18n";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "应用领域 — 水溶性 PVA 在纺织制造中的应用",
  description: "水溶性 PVA 纱线、缝纫线和纤维的典型应用：毛巾织造与无捻毛巾、刺绣与缝纫、针织、造纸及产业用纺织品——附选型要点。",
  path: "/applications",
  locale: "zh",
  alternates: { en: "/applications", zh: "/zh/applications" },
});

export default function ZhApplicationsPage() {
  const dict = zh;
  const t = dict.applicationsPage;
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: "/zh" },
        { name: dict.breadcrumbs.applications, path: "/zh/applications" },
      ])])}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="zh"
              trail={[
                { name: dict.breadcrumbs.home, path: "/zh" },
                { name: dict.breadcrumbs.applications, path: "/zh/applications" },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.applications}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app, index) => (
            <Reveal key={app.slug} delay={index * 60} className="h-full">
              <Link
                href={`/zh/applications/${app.slug}`}
                className="card-line group flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_rgba(26,33,81,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-2 text-lg font-semibold text-ink group-hover:text-primary">{app.name.zh}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{app.summary.zh}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {dict.actions.viewApplication}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
