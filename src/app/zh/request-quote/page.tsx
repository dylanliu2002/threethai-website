import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import InquiryForm from "@/components/forms/inquiry-form";
import { zh } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";
import { company } from "@/content/company";

export const metadata: Metadata = buildMetadata({
  title: "在线询价 — 水溶性 PVA 纱线、缝纫线与纤维",
  description: "提交水溶性 PVA 产品询价：请提供支数、应用场景和目标水溶温度，我们将为您匹配合适规格。",
  path: "/request-quote",
  locale: "zh",
  alternates: { en: "/request-quote", zh: "/zh/request-quote" },
});

export default function ZhRequestQuotePage() {
  const dict = zh;
  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="zh"
              trail={[
                { name: dict.breadcrumbs.home, path: "/zh" },
                { name: dict.breadcrumbs.quote, path: "/zh/request-quote" },
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
              <Suspense fallback={<p className="text-sm text-muted-foreground">加载表单中…</p>}>
                <InquiryForm locale="zh" dict={dict} kind="quote" />
              </Suspense>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <aside className="space-y-6">
              <div className="card-line p-6">
                <h2 className="font-semibold text-ink">{dict.form.contactDirect}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <dd>
                    <a className="text-primary hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
                  </dd>
                  <dd>
                    <a className="text-primary hover:underline" href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>
                  </dd>
                  <dd className="text-muted-foreground">{company.locationZh}</dd>
                </dl>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                报价基于完整规格——支数体系、结构、水溶方法、数量、包装与贸易条款。统一的询价要素让不同供应商的报价可以横向比较。
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
