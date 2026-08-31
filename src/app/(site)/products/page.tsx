import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import ProductCard from "@/components/product/product-card";
import { products, extendedFormats } from "@/content/products";
import { temperatureCatalog, temperatureIntro } from "@/content/catalog";
import { en } from "@/content/i18n";
import { buildMetadata, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Water-Soluble PVA Yarn, Thread, Fiber & Filament | Products",
  description:
    "Explore water-soluble PVA yarn, sewing thread, staple fiber and filament yarn by material form and dissolution temperature from 20°C to 90°C. Batch-level QC, traceable samples.",
  path: "/products",
  locale: "en",
  alternates: { en: "/products", zh: "/zh/products" },
  keywords: ["PVA yarn manufacturer", "water soluble PVA products", "PVA staple fiber", "PVA filament yarn"],
});

export default function ProductsPage() {
  const dict = en;
  const t = dict.productsPage;
  const temp = temperatureIntro.en;
  return (
    <>
      {jsonLd([breadcrumbSchema([
        { name: dict.breadcrumbs.home, path: "/" },
        { name: dict.breadcrumbs.products, path: "/products" },
      ])])}

      {/* Hero */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="en"
              trail={[
                { name: dict.breadcrumbs.home, path: "/" },
                { name: dict.breadcrumbs.products, path: "/products" },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">Products</p>
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
                <ProductCard product={product} locale="en" dict={dict} />
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
                    <th scope="col" className="w-32">Temperature</th>
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
                        <Link href={`/request-quote?temperature=${encodeURIComponent(entry.temperature)}`} className="text-sm font-semibold text-primary hover:underline">
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
            A temperature label is a starting point, not a complete specification — see the{" "}
            <Link href="/knowledge/pva-yarn-dissolution-temperature-guide" className="font-semibold text-primary hover:underline">
              dissolution temperature guide
            </Link>{" "}
            before comparing samples.
          </p>
        </div>
      </section>

      {/* Extended formats */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <div className="grid gap-6 rounded-lg border border-border bg-muted p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="eyebrow">{extendedFormats.en.kicker}</p>
                <h2 className="display-3 mt-2">{extendedFormats.en.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{extendedFormats.en.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {extendedFormats.en.items.map((item) => (
                    <li key={item} className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground/80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/contact" className="btn-primary w-fit whitespace-nowrap">{dict.actions.contactTeam}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
