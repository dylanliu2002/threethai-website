import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/layout/reveal";
import { applications } from "@/content/applications";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { applicationCard } from "@/content/card-copy";

export default function HomeApplications({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.applications;
  // A card quotes another page's headline text, but the card belongs to this page.
  // That is why it can read Spanish before the detail page is promoted; the
  // promotion seam is pageCopyFor, used by the page's own body, and nothing here
  // reaches through it. See src/content/card-copy.ts.
  const cards = applications.map((application) => ({
    application,
    ...applicationCard(application.slug, locale),
  }));
  return (
    <section className="border-y border-border bg-paper py-16 sm:py-20" aria-labelledby="home-applications-title">
      <div className="container-site">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 id="home-applications-title" className="display-2 mt-3">{t.title}</h2>
              <p className="lede mt-4">{t.body}</p>
            </div>
            <Link href={`/${locale === "zh" ? "zh/" : ""}applications`} className="btn-ghost !min-h-10 !px-4 text-sm">
              {dict.nav.applications}
            </Link>
          </div>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(({ application: app, name, summary, imageAlt }, index) => (
            <Reveal as="li" key={app.slug} delay={index * 60} className="h-full">
              <Link
                href={`/${locale === "zh" ? "zh/" : ""}applications/${app.slug}`}
                className="card-line group flex h-full flex-col overflow-hidden transition-all duration-200 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <Image
                    src={app.image}
                    alt={imageAlt}
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-ink">{name}</h3>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-[0.82rem] leading-relaxed text-muted-foreground">
                    {summary}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
