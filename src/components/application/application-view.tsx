import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import type { Application } from "@/content/applications";
import { productBySlug } from "@/content/products";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { contentLocaleOf, localePath } from "@/content/company";

/** Shared application-page template — all five application pages render here. */
export default function ApplicationView({ application, locale, dict }: { application: Application; locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.applicationPage;
  const lp = (path: string) => localePath(path, locale);
  const blocks = [
    { heading: application.problem[cl], icon: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" },
    { heading: application.whereUsed[cl], icon: "M12 21s-7-5.1-7-11a7 7 0 1114 0c0 5.9-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" },
    { heading: application.whyTemporary[cl], icon: "M4 4v6h6M20 20v-6h-6M20 9A8 8 0 005.6 5.6L4 10m16 4l-1.6 4.4A8 8 0 014 15" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-border bg-primary text-primary-foreground">
        <div className="container-site grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
          <div>
            <div className="[&_a]:text-white/70 [&_span]:text-white/40">
              <Breadcrumbs
                locale={locale}
                trail={[
                  { name: dict.breadcrumbs.home, path: lp("/") },
                  { name: dict.breadcrumbs.applications, path: lp("/applications") },
                  { name: application.name[cl], path: lp(`/applications/${application.slug}`) },
                ]}
              />
            </div>
            <p className="eyebrow-light mt-6">{dict.nav.applications}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {application.name[cl]}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{application.summary[cl]}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${lp("/request-sample")}?application=${application.slug}`} className="btn-gold">
                {dict.actions.requestSample}
              </Link>
              <Link href={`${lp("/request-quote")}?application=${application.slug}`} className="btn-light">
                {dict.actions.requestQuote}
              </Link>
            </div>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/15 shadow-2xl">
            <Image
              src={application.image}
              alt={application.imageAlt[cl]}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </figure>
        </div>
      </section>

      {/* Problem / where used / why temporary */}
      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-6 md:grid-cols-3">
          {blocks.map((block, i) => (
            <Reveal key={block.heading.heading} delay={i * 70}>
              <article className="card-line h-full p-6">
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={block.icon} />
                  </svg>
                </span>
                <h2 className="mt-4 font-semibold text-ink">{block.heading.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{block.heading.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Products + selection variables */}
      <section className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="display-3">{t.productsTitle}</h2>
            <ul className="mt-5 space-y-3">
              {application.productSlugs.map((slug) => {
                const product = productBySlug(slug);
                if (!product) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={lp(`/products/${slug}`)}
                      className="card-line group flex items-center gap-4 p-4 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span>
                        <span className="block font-semibold text-ink group-hover:text-primary">{product.name[cl]}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{product.tagline[cl]}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="display-3">{t.selectionTitle}</h2>
            <ul className="mt-5 space-y-3">
              {application.selectionVariables[cl].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Testing + next step */}
      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <h2 className="display-3">{application.testing[cl].heading}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{application.testing[cl].body}</p>
            <Link href={lp("/knowledge")} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              {dict.nav.knowledge}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </Reveal>
          <Reveal delay={90}>
            <div className="rounded-lg bg-primary p-7 text-primary-foreground">
              <h2 className="text-lg font-semibold text-white">{t.nextStepTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{t.nextStepBody}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`${lp("/request-sample")}?application=${application.slug}`} className="btn-gold !min-h-10 !px-4 text-sm">
                  {dict.actions.requestSample}
                </Link>
                <Link href={lp("/contact")} className="btn-light !min-h-10 !px-4 text-sm">
                  {dict.actions.contactTeam}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
