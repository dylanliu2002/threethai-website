import type { Metadata } from "next";
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
    title: "Request a Sample — Water-Soluble PVA Materials",
    description:
      "Request a traceable PVA sample: yarn, sewing thread, staple fiber or filament. We confirm specification and test method with you before shipping.",
    path: "/request-sample",
    locale,
  });
}

export default async function LangRequestSamplePage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  const lp = (p: string) => localePath(p, locale);
  return (
    <>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: dict.form.sampleTitle,
        url: `${siteUrl}${lp("/request-sample")}`,
      })}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.sample, path: lp("/request-sample") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.actions.requestSample}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {dict.form.sampleTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{dict.form.sampleIntro}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <div className="card-line p-6 sm:p-8">
              <Suspense fallback={<p className="text-sm text-muted-foreground">Loading form…</p>}>
                <InquiryForm locale={locale} dict={dict} kind="sample" />
              </Suspense>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <aside className="space-y-6">
              <div className="card-line p-6">
                <h2 className="font-semibold text-ink">{dict.form.contactDirect}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <dd>
                    <a className="text-primary hover:underline" href="mailto:salesmanager@threethai.com">salesmanager@threethai.com</a>
                  </dd>
                  <dd>
                    <a className="text-primary hover:underline" href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>
                  </dd>
                </dl>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
