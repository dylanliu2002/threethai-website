import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import ProductFinder from "@/components/forms/product-finder";
import { buildMetadata } from "@/lib/seo";
import { localePath } from "@/content/company";
import { temperatureCatalog } from "@/content/catalog";
import { resolveLang } from "../_lang";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveLang(params, notFound);
  return buildMetadata({
    title: "PVA Product Finder — Select by Form, Application & Dissolution Temperature",
    description:
      "Answer four questions about your process and get a suggested water-soluble PVA product family: yarn, sewing thread, staple fiber or filament — then confirm the grade with a sample.",
    path: "/product-finder",
    locale,
  });
}

export default async function LangProductFinderPage({ params }: Props) {
  const { dict, locale } = await resolveLang(params, notFound);
  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: localePath("/", locale) },
                { name: dict.breadcrumbs.finder, path: localePath("/product-finder", locale) },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.actions.productFinder}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {dict.finder.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{dict.finder.intro}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <ProductFinder locale={locale} dict={dict} />
          <aside className="card-line p-6">
            <h2 className="font-semibold text-ink">{dict.productsPage.availableAt}</h2>
            <dl className="mt-4 space-y-4">
              {temperatureCatalog.map((entry) => (
                <div key={entry.temperature}>
                  <dt className="text-sm font-bold text-ink">{entry.temperature}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.specs.join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
