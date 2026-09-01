import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import ProductCard from "@/components/product/product-card";
import { products, extendedFormats } from "@/content/products";
import { temperatureCatalog, temperatureIntro } from "@/content/catalog";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";
import { contentLocaleOf, localePath } from "@/content/company";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "Water-Soluble PVA Yarn, Thread, Fiber & Filament | Products",
    description:
      "Explore water-soluble PVA yarn, sewing thread, staple fiber and filament yarn by material form and dissolution temperature from 20°C to 90°C. Batch-level QC, traceable samples.",
    path: "/products",
    locale,
    keywords: ["PVA yarn manufacturer", "water soluble PVA products", "PVA staple fiber", "PVA filament yarn"],
  });
}

export default async function LangProductsPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  const t = dict.productsPage;
  const cl = contentLocaleOf(locale);
  const temp = temperatureIntro[cl];
  const ext = extendedFormats[cl];
  const lp = (p: string) => localePath(p, locale);
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: lp("/") },
        { name: dict.breadcrumbs.products, path: lp("/products") },
      ])])}

      {/* Hero */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.products, path: lp("/products") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.products}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      {/* Product families */}
      <section className="py-14 sm:py-16" aria-labelledby="families">
        <div className="container-site">
          <h2 id="families" className="sr-only">Product families</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.slug} delay={index * 70} className="h-full">
                <ProductCard product={product} locale={locale} dict={dict} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Temperature selection */}
      <section id="temperatures" className="border-y border-border bg-paper py-14 sm:py-16" aria-labelledby="temperatures-title">
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
                    <th scope="col" className="w-32">{locale === "zh" ? "温度" : "Temperature"}</th>
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
                        <Link href={lp(`/request-quote?temperature=${encodeURIComponent(entry.temperature)}`)} className="text-sm font-semibold text-primary hover:underline">
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
            {locale === "zh"
              ? "温度标签只是起点，不是完整规格——比较样品前请先阅读溶解温度指南。"
              : "A temperature label is a starting point, not a complete specification — see the dissolution temperature guide before comparing samples."}
          </p>
        </div>
      </section>

      {/* Extended formats */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <div className="grid gap-6 rounded-lg border border-border bg-muted p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="eyebrow">{ext.kicker}</p>
                <h2 className="display-3 mt-2">{ext.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ext.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {ext.items.map((item) => (
                    <li key={item} className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground/80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={lp("/contact")} className="btn-primary w-fit whitespace-nowrap">{dict.actions.contactTeam}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
