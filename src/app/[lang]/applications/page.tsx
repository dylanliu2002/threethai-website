import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { applications } from "@/content/applications";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { contentLocaleOf, localePath } from "@/content/company";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "Applications of Water-Soluble PVA in Textile Manufacturing",
    description:
      "Where water-soluble PVA yarn, thread and fiber are used: towel weaving and zero-twist, embroidery and sewing, knitting, papermaking and technical textiles — with selection guidance.",
    path: "/applications",
    locale,
  });
}

export default async function LangApplicationsPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  const t = dict.applicationsPage;
  const cl = contentLocaleOf(locale);
  const lp = (p: string) => localePath(p, locale);
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: lp("/") },
        { name: dict.breadcrumbs.applications, path: lp("/applications") },
      ])])}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.applications, path: lp("/applications") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.applications}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app, index) => (
            <Reveal key={app.slug} delay={index * 60} className="h-full">
              <Link
                href={lp(`/applications/${app.slug}`)}
                className="card-line group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_rgba(26,33,81,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-ink group-hover:text-primary">{app.name[cl]}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{app.summary[cl]}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {dict.actions.viewApplication}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
                <ul className="border-t border-border bg-paper/60 px-6 py-4">
                  {app.productSlugs.slice(0, 2).map((slug) => (
                    <li key={slug} className="text-xs text-muted-foreground">
                      → {dict.nav.products}: {slug.replaceAll("-", " ")}
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={applications.length * 60} className="h-full">
            <div className="flex h-full flex-col justify-between rounded-lg border border-primary/20 bg-secondary p-6">
              <div>
                <h2 className="text-lg font-semibold text-ink">{dict.actions.productFinder}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{dict.finder.intro}</p>
              </div>
              <Link href={lp("/product-finder")} className="btn-primary mt-5 w-fit !min-h-10 !px-4 text-sm">
                {dict.actions.productFinder} →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
