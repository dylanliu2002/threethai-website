import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import InquiryForm from "@/components/forms/inquiry-form";
import { en } from "@/content/i18n";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { company, localePath } from "@/content/company";

export const metadata: Metadata = buildMetadata({
  title: "Request a Quote — Water-Soluble PVA Yarn, Thread & Fiber",
  description:
    "Request a quotation for water-soluble PVA yarn, sewing thread, staple fiber or filament. Share your count, application and target dissolution temperature for a matched specification.",
  path: "/request-quote",
  locale: "en",
  alternates: { en: "/request-quote", zh: "/zh/request-quote" },
  noindex: false,
});

export default function RequestQuotePage() {
  const dict = en;
  return (
    <>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: dict.form.quoteTitle,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com"}/request-quote`,
      })}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="en"
              trail={[
                { name: dict.breadcrumbs.home, path: "/" },
                { name: dict.breadcrumbs.quote, path: "/request-quote" },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.actions.requestQuote}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {dict.form.quoteTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{dict.form.quoteIntro}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <div className="card-line p-6 sm:p-8">
              <Suspense fallback={<p className="text-sm text-muted-foreground">Loading form…</p>}>
                <InquiryForm locale="en" dict={dict} kind="quote" />
              </Suspense>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <aside className="space-y-6">
              <div className="card-line p-6">
                <h2 className="font-semibold text-ink">{dict.actions.productFinder}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dict.finder.intro}</p>
                <Link href={localePath("/product-finder", "en")} className="btn-ghost mt-4 !min-h-10 !px-4 text-sm">
                  {dict.actions.productFinder}
                </Link>
              </div>
              <div className="card-line p-6">
                <h2 className="font-semibold text-ink">{dict.form.contactDirect}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <dd>
                    <a className="text-primary hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
                  </dd>
                  <dd>
                    <a className="text-primary hover:underline" href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>
                  </dd>
                  <dd className="text-muted-foreground">{company.locationEn}</dd>
                </dl>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Quotations are prepared against a complete specification — count system, construction, dissolution method, quantity, packing and Incoterm. This makes supplier offers comparable (see our{" "}
                <a href="/answers/compare-water-soluble-pva-yarn-supplier-prices" className="font-semibold text-primary hover:underline">
                  price-comparison guide
                </a>
                ).
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
