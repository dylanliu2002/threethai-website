import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { factoryStats } from "@/content/factory";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { company, contentLocaleOf, localePath } from "@/content/company";

export default function AboutView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.about;
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
                { name: dict.breadcrumbs.about, path: lp("/about") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.about}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <Reveal>
            <figure className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border">
              <Image
                src="/images/about-yarn.jpg"
                alt={locale === "zh" ? "threethai™ PVA 纱线" : "PVA yarn manufactured by Three Thai Textile"}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </figure>
          </Reveal>
          <div className="space-y-8">
            {[
              { title: t.philosophyTitle, body: t.philosophyBody },
              { title: t.positioningTitle, body: t.positioningBody },
              { title: t.coverageTitle, body: t.coverageBody },
              { title: t.identityTitle, body: t.identityBody },
            ].map((block, i) => (
              <Reveal key={block.title} delay={i * 60}>
                <section>
                  <h2 className="display-3">{block.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{block.body}</p>
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <h2 className="display-2 !text-2xl sm:!text-3xl">{t.timelineTitle}</h2>
          </Reveal>
          <ol className="mt-8 space-y-0">
            {t.timeline.map((item, i) => (
              <Reveal as="li" key={item.year} delay={i * 70}>
                <div className="grid gap-2 border-l-2 border-gold/60 pb-8 pl-6 sm:grid-cols-[120px_1fr] sm:gap-8 [&:not(:last-child)]:relative">
                  <p className="text-xl font-bold tracking-tight text-primary">{item.year}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:pt-1.5">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Stats + CTA */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {factoryStats.map((stat, i) => (
              <Reveal key={stat.value} delay={i * 40}>
                <div className="card-line h-full p-4 text-center">
                  <dd className="text-xl font-bold tracking-tight text-ink">{stat.value}</dd>
                  <dt className="mt-1 text-xs leading-snug text-muted-foreground">{stat.label[cl]}</dt>
                </div>
              </Reveal>
            ))}
          </dl>
          <Reveal delay={120}>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-lg bg-primary p-8 text-primary-foreground">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">{dict.home.cta.title}</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{dict.home.cta.body}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={lp("/request-quote")} className="btn-gold">{dict.actions.requestQuote}</Link>
                <Link href={lp("/contact")} className="btn-light">{dict.nav.contact}</Link>
              </div>
            </div>
          </Reveal>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            {locale === "zh"
              ? `主体信息：${company.nameLegalZh}（Shandong Three Thai Textile Co., Ltd.），统一社会信用代码 ${company.uscc}，成立于 ${company.establishedYear} 年，注册/生产地址：${company.addressZh}。中英文名称以 ISO 9001 与 OEKO-TEX 证书登记为准。`
              : `Legal entity: ${company.nameLegalZh} (${company.nameExportEn}), USCC ${company.uscc}, established ${company.establishedYear}. Registered address: ${company.addressEn}. Chinese and English names as registered on our ISO 9001 and OEKO-TEX certificates.`}
          </p>
        </div>
      </section>
    </>
  );
}
