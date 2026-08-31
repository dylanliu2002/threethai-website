import Link from "next/link";
import ProductCard from "@/components/product/product-card";
import Reveal from "@/components/layout/reveal";
import { products, extendedFormats } from "@/content/products";
import { temperatureCatalog } from "@/content/catalog";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { contentLocaleOf, localePath } from "@/content/company";

export default function HomeProducts({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.home.products;
  const ext = extendedFormats[cl];
  return (
    <section className="py-16 sm:py-20" aria-labelledby="home-products-title">
      <div className="container-site">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="home-products-title" className="display-2 mt-3">{t.title}</h2>
            <p className="lede mt-4">{t.body}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.slug} delay={index * 70} className="h-full">
              <ProductCard product={product} locale={locale} dict={dict} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-8 grid gap-5 rounded-lg border border-border bg-muted p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <h3 className="display-3 !text-base">{ext.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{ext.body}</p>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label={ext.title}>
              {ext.items.map((item) => (
                <li key={item} className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground/80">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={localePath("/product-finder", locale)}
              className="btn-ghost !min-h-10 w-fit whitespace-nowrap !px-4 text-sm"
            >
              {dict.actions.productFinder}
            </Link>
          </div>
        </Reveal>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {temperatureCatalog.map((entry) => entry.temperature).join(" · ")} —{" "}
          <Link href={localePath("/products", locale)} className="font-semibold text-primary underline-offset-4 hover:underline">
            {dict.actions.viewAllProducts}
          </Link>
        </p>
      </div>
    </section>
  );
}
