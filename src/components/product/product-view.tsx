import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import type { Product } from "@/content/products";
import { products as allProducts } from "@/content/products";
import { applications } from "@/content/applications";
import { temperatureCatalog, temperatureNote } from "@/content/catalog";
import { buyerAnswers } from "@/content/answers";
import { articles } from "@/content/articles";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { contentLocaleOf, localePath } from "@/content/company";

/**
 * Shared product-page template (master prompt §12). All four product pages
 * render through this component — no duplicated page implementations.
 */
export default function ProductView({ product, locale, dict }: { product: Product; locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.productsIndex;
  const lp = (path: string) => localePath(path, locale);
  const relatedApps = applications.filter((a) => product.applicationsSlugs.includes(a.slug));
  const relatedAnswers = buyerAnswers.filter((a) => a.relatedProduct === product.slug).slice(0, 4);
  const relatedArticles = articles.slice(0, 2);
  const index = allProducts.findIndex((p) => p.slug === product.slug);
  const next = allProducts[(index + 1) % allProducts.length];

  return (
    <>
      {/* 1 · Product hero */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <div className="[&_a]:text-white/70 [&_span]:text-white/40">
              <Breadcrumbs
                locale={locale}
                trail={[
                  { name: dict.breadcrumbs.home, path: lp("/") },
                  { name: dict.breadcrumbs.products, path: lp("/products") },
                  { name: product.name[cl], path: lp(`/products/${product.slug}`) },
                ]}
              />
            </div>
            <p className="eyebrow-light mt-6">{locale === "zh" ? "产品系列" : "Product family"}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {product.name[cl]}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{product.tagline[cl]}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {product.highlights[cl].map((item) => (
                <li key={item} className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/85">
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${lp("/request-sample")}?product=${product.slug}`} className="btn-gold">
                {dict.actions.requestSample}
              </Link>
              <Link href={`${lp("/request-quote")}?product=${product.slug}`} className="btn-light">
                {dict.actions.requestQuote}
              </Link>
            </div>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/15 shadow-2xl">
            <Image
              src={product.image}
              alt={product.imageAlt[cl]}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </figure>
        </div>
      </section>

      {/* 2 · Overview + technical overview */}
      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <p className="eyebrow">{t.overviewTitle}</p>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/90">
              <p>{product.intro[cl]}</p>
              {product.technicalOverview.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={90}>
            <aside className="card-line p-6">
              <h2 className="display-3 !text-base">{t.selectionTitle}</h2>
              <ul className="mt-4 space-y-3">
                {product.selection[cl].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="hairline mt-5 pt-4">
                <Link href={`${lp("/request-quote")}?product=${product.slug}`} className="text-sm font-semibold text-primary hover:underline">
                  {t.ctaTitle} →
                </Link>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* 3 · Dissolution profile options */}
      <section className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{t.specsTitle}</p>
            <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">
              {locale === "zh" ? "水溶温度选择" : "Dissolution temperature options"}
            </h2>
            <p className="lede mt-3 max-w-3xl !text-sm">{temperatureNote[cl]}</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {temperatureCatalog.map((entry, i) => (
              <Reveal key={entry.temperature} delay={i * 50}>
                <div className="card-line h-full p-5">
                  <p className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-ink">{entry.temperature}</span>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {locale === "zh" ? "目标水溶温度" : "target dissolution"}
                    </span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {entry.specs.map((spec) => (
                      <li key={spec} className="text-sm text-muted-foreground">{spec}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{dict.home.manufacturing.body.split("—")[0]}</p>
        </div>
      </section>

      {/* 4 · Applications */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <h2 className="display-2 !text-2xl sm:!text-3xl">{t.applicationsTitle}</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedApps.map((app, i) => (
              <Reveal key={app.slug} delay={i * 60}>
                <Link
                  href={lp(`/applications/${app.slug}`)}
                  className="card-line group flex h-full flex-col p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <h3 className="font-semibold text-ink group-hover:text-primary">{app.name[cl]}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{app.summary[cl]}</p>
                  <span className="mt-4 text-sm font-semibold text-primary">{dict.actions.viewApplication} →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Process guide */}
      <section className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{t.processTitle}</p>
            <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">
              {locale === "zh" ? "从需求到批量供应的三步流程" : "From requirement to repeatable supply"}
            </h2>
          </Reveal>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {product.processGuide.map(([heading, body], i) => (
              <Reveal as="li" key={heading} delay={i * 70}>
                <div className="card-line h-full p-6">
                  <p aria-hidden="true" className="text-sm font-bold text-gold-deep">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-semibold text-ink">{heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 · Manufacturing / QC evidence + resources */}
      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="display-3">{t.evidenceTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.evidenceBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={lp("/manufacturing")} className="btn-ghost !min-h-10 !px-4 text-sm">{dict.nav.manufacturing}</Link>
              <Link href={lp("/quality")} className="btn-ghost !min-h-10 !px-4 text-sm">{dict.nav.quality}</Link>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-3">{t.resourcesTitle}</h2>
            <ul className="mt-4 space-y-3">
              {relatedArticles.map((article) => (
                <li key={article.slug}>
                  <Link href={lp(`/knowledge/${article.slug}`)} className="text-sm font-medium text-primary hover:underline">
                    {article.title}
                  </Link>
                </li>
              ))}
              {relatedAnswers.map((answer) => (
                <li key={answer.slug}>
                  <Link href={lp(`/answers/${answer.slug}`)} className="text-sm text-muted-foreground hover:text-primary">
                    {answer.question}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 7 · FAQ */}
      <section className="border-t border-border bg-paper py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          <Reveal>
            <h2 className="display-2 !text-2xl sm:!text-3xl">{t.faqTitle}</h2>
          </Reveal>
          <div className="mt-6 space-y-3">
            {product.faqs.map(([question, answer], i) => (
              <Reveal key={question} delay={i * 60}>
                <details className="card-line group px-5 py-4 open:border-primary/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {question}
                    <span aria-hidden="true" className="text-gold-deep transition-transform duration-200 group-open:rotate-45">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · CTA */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <div className="rounded-lg bg-primary p-8 text-primary-foreground sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t.ctaTitle}</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{t.ctaBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`${lp("/request-sample")}?product=${product.slug}`} className="btn-gold">{dict.actions.requestSample}</Link>
              <Link href={`${lp("/request-quote")}?product=${product.slug}`} className="btn-light">{dict.actions.requestQuote}</Link>
            </div>
          </div>
          <div className="mt-8">
            <Link href={lp(`/products/${next.slug}`)} className="group inline-flex items-center gap-2 text-sm font-semibold text-primary">
              {t.nextPrev}: {next.name[cl]}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
