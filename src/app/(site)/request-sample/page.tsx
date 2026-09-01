import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import InquiryForm from "@/components/forms/inquiry-form";
import { en } from "@/content/i18n";
import { buildMetadata, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Request a Sample — Water-Soluble PVA Materials",
  description:
    "Request a traceable PVA sample: yarn, sewing thread, staple fiber or filament. We confirm specification and test method with you before shipping.",
  path: "/request-sample",
  locale: "en",
  alternates: { en: "/request-sample", zh: "/zh/request-quote" },
});

export default function RequestSamplePage() {
  const dict = en;
  return (
    <>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: dict.form.sampleTitle,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com"}/request-sample`,
      })}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="en"
              trail={[
                { name: dict.breadcrumbs.home, path: "/" },
                { name: dict.breadcrumbs.sample, path: "/request-sample" },
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
                <InquiryForm locale="en" dict={dict} kind="sample" />
              </Suspense>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <aside className="card-line p-6">
              <h2 className="font-semibold text-ink">What happens after you send the brief</h2>
              <ol className="mt-4 space-y-4">
                {(
                  [
                    ["Application review", "Our team maps your construction, tension, chemistry and removal cycle against current grades."],
                    ["Sample specification", "We confirm count, construction and dissolution method in writing — linked to a traceable sample."],
                    ["Controlled trial", "You test in your process with a written method; we stay available for parameter questions."],
                    ["Approval & scale-up", "The approved result becomes the bulk specification with batch-level QC records."],
                  ] as const
                ).map(([title, body], i) => (
                  <li key={title} className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
