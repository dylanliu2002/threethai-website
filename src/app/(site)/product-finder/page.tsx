import type { Metadata } from "next";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import ProductFinder from "@/components/forms/product-finder";
import { en } from "@/content/i18n";
import { buildMetadata } from "@/lib/seo";
import { temperatureCatalog } from "@/content/catalog";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "PVA Product Finder — Select by Form, Application & Dissolution Temperature",
  description:
    "Answer four questions about your process and get a suggested water-soluble PVA product family: yarn, sewing thread, staple fiber or filament — then confirm the grade with a sample.",
  path: "/product-finder",
  locale: "en",
  alternates: { en: "/product-finder" },
});

export default function ProductFinderPage() {
  const dict = en;
  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale="en"
              trail={[
                { name: dict.breadcrumbs.home, path: "/" },
                { name: dict.breadcrumbs.finder, path: "/product-finder" },
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
          <ProductFinder locale="en" dict={dict} />
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
            <p className="hairline mt-5 pt-4 text-xs leading-relaxed text-muted-foreground">
              A temperature label is a starting point — see the{" "}
              <Link href="/knowledge/pva-yarn-dissolution-temperature-guide" className="font-semibold text-primary hover:underline">
                dissolution guide
              </Link>
              . Final suitability is confirmed with a traceable sample.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
