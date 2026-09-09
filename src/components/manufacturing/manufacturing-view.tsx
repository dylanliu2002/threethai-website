import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { factoryEquipment, factoryStats, manufacturingIntro, processFlow } from "@/content/factory";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { localePath } from "@/content/company";
import { serverLabels } from "@/content/site-copy";

export default function ManufacturingView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.manufacturingPage;
  const intro = manufacturingIntro[locale];
  const lp = (path: string) => localePath(path, locale);

  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-site py-12 sm:py-16">
          <div className="[&_a]:text-white/70 [&_span]:text-white/40">
            <Breadcrumbs
              locale={locale}
              trail={[
                { name: dict.breadcrumbs.home, path: lp("/") },
                { name: dict.breadcrumbs.manufacturing, path: lp("/manufacturing") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.manufacturing}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      {/* Intro + stats */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="eyebrow">{dict.nav.manufacturing}</p>
                <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">{intro.title}</h2>
                <p className="lede mt-4">{intro.body}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{intro.note}</p>
              </div>
              <figure className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border">
                <Image
                  src="/images/factory-live/blowing-carding.webp"
                  alt={serverLabels[locale].manufacturingHeroImageAlt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </figure>
            </div>
          </Reveal>

          <div className="mt-12">
            <h2 className="display-3">{t.statsTitle}</h2>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {factoryStats.map((stat, i) => (
                <Reveal key={stat.value} delay={i * 50}>
                  <div className="card-line h-full p-4 text-center">
                    <dd className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{stat.value}</dd>
                    <dt className="mt-1 text-xs leading-snug text-muted-foreground">{stat.label[locale]}</dt>
                  </div>
                </Reveal>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{t.statsNote}</p>
          </div>
        </div>
      </section>

      {/* Process flow with real factory imagery */}
      <section className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{dict.nav.manufacturing}</p>
            <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">
              {serverLabels[locale].spinningCapabilityHeading}
            </h2>
            <p className="lede mt-3 max-w-3xl">
              {serverLabels[locale].spinningCapabilityBody}
            </p>
          </Reveal>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {processFlow.map((step, i) => {
              const equipment = factoryEquipment[i];
              return (
                <Reveal as="li" key={step.title.en} delay={i * 60}>
                  <figure className="card-line h-full overflow-hidden">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={equipment.image}
                        alt={`${equipment.name[locale]} — ${serverLabels[locale].equipmentImageSuffix}`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="p-5">
                      <p className="text-xs font-bold tracking-widest text-gold-deep">{equipment.step}</p>
                      <h3 className="mt-1 font-semibold text-ink">{step.title[locale]}</h3>
                      {equipment.brand ? <p className="mt-1 text-xs font-medium text-gold-deep">{equipment.brand[locale]}</p> : null}
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body[locale]}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Traceability + capability */}
      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="display-3">{t.traceTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t.traceBody}</p>
            <ul className="mt-5 space-y-3">
              {[
                serverLabels[locale].traceRecordIncoming,
                serverLabels[locale].traceRecordParameters,
                serverLabels[locale].traceRecordTesting,
                serverLabels[locale].traceRecordChangeControl,
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={90}>
            <div className="card-line p-7">
              <h2 className="display-3">{t.capabilityTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {serverLabels[locale].supplyCapabilityBody}
              </p>
              <div className="hairline mt-5 pt-5">
                <p className="text-sm font-semibold text-ink">{t.visitTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.visitBody}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={lp("/contact")} className="btn-primary !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
                <Link href={lp("/quality")} className="btn-ghost !min-h-10 !px-4 text-sm">{dict.nav.quality}</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
