import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import InquiryForm from "@/components/forms/inquiry-form";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { company, localePath, siteUrl } from "@/content/company";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "Request a Quote — Water-Soluble PVA Yarn, Thread & Fiber",
    description:
      "Request a quotation for water-soluble PVA yarn, sewing thread, staple fiber or filament. Share your count, application and target dissolution temperature for a matched specification.",
    path: "/request-quote",
    locale,
  });
}

export default async function LangRequestQuotePage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  const lp = (p: string) => localePath(p, locale);
  return (
    <>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: dict.form.quoteTitle,
        url: `${siteUrl}${lp("/request-quote")}`,
      })}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.quote, path: lp("/request-quote") },
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
                <InquiryForm locale={locale} dict={dict} kind="quote" />
              </Suspense>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <aside className="space-y-6">
              <div className="card-line p-6">
                <h2 className="font-semibold text-ink">{dict.actions.productFinder}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dict.finder.intro}</p>
                <Link href={lp("/product-finder")} className="btn-ghost mt-4 !min-h-10 !px-4 text-sm">
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
                Quotations are prepared against a complete specification — count system, construction, dissolution method, quantity, packing and Incoterm.
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
