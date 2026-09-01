import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import ProductCard from "@/components/product/product-card";
import { products, extendedFormats } from "@/content/products";
import { temperatureCatalog, temperatureIntro } from "@/content/catalog";
import { zh } from "@/content/i18n";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "PVA 产品中心 — 水溶纱、缝纫线、短纤、长丝",
  description: "按材料形态与水溶温度（20°C–90°C）浏览水溶性 PVA 纱线、缝纫线、短纤和长丝，均支持批次级质检与样品验证。",
  path: "/products",
  locale: "zh",
  alternates: { en: "/products", zh: "/zh/products" },
});

export default function ZhProductsPage() {
  const dict = zh;
  const t = dict.productsPage;
  const temp = temperatureIntro.zh;
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: "/zh" },
        { name: dict.breadcrumbs.products, path: "/zh/products" },
      ])])}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="zh"
              trail={[
                { name: dict.breadcrumbs.home, path: "/zh" },
                { name: dict.breadcrumbs.products, path: "/zh/products" },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.products}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.slug} delay={index * 70} className="h-full">
                <ProductCard product={product} locale="zh" dict={dict} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="temperatures" className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{temp.kicker}</p>
            <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">{temp.title}</h2>
            <p className="lede mt-3 max-w-3xl">{temp.body}</p>
          </Reveal>
          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
            <div className="scroll-thin overflow-x-auto">
              <table className="table-spec min-w-[640px]">
                <thead>
                  <tr>
                    <th scope="col" className="w-32">温度</th>
                    <th scope="col">{t.availableAt}</th>
                    <th scope="col" className="w-44"></th>
                  </tr>
                </thead>
                <tbody>
                  {temperatureCatalog.map((entry) => (
                    <tr key={entry.temperature}>
                      <th scope="row" className="text-lg !border-b !py-4 font-bold text-ink">{entry.temperature}</th>
                      <td>
                        <ul className="flex flex-wrap gap-x-5 gap-y-1">
                          {entry.specs.map((spec) => (
                            <li key={spec}>{spec}</li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <Link href={`/zh/request-quote?temperature=${encodeURIComponent(entry.temperature)}`} className="text-sm font-semibold text-primary hover:underline">
                          {t.sampleCta} →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            温度标签只是选型起点——请先阅读
            <Link href="/zh/knowledge/pva-yarn-dissolution-temperature-guide" className="font-semibold text-primary hover:underline">溶解温度指南</Link>
            （英文）再对比样品。
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <div className="grid gap-6 rounded-lg border border-border bg-muted p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="eyebrow">{extendedFormats.zh.kicker}</p>
                <h2 className="display-3 mt-2">{extendedFormats.zh.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{extendedFormats.zh.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {extendedFormats.zh.items.map((item) => (
                    <li key={item} className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground/80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/zh/contact" className="btn-primary w-fit whitespace-nowrap">{dict.actions.contactTeam}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
