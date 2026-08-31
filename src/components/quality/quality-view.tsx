import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Reveal from "@/components/layout/reveal";
import { certificates, qualityIntro, qualityPillars, verificationNote } from "@/content/quality";
import {
  inventionPatents,
  foreignPatents,
  utilityPatents,
  patentStats,
  patentIntro,
  patentDisclaimer,
} from "@/content/patents";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { contentLocaleOf, localePath } from "@/content/company";

export default function QualityView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.qualityPage;
  const intro = qualityIntro[cl];
  const pIntro = patentIntro[cl];
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
                { name: dict.breadcrumbs.quality, path: lp("/quality") },
              ]}
            />
          </div>
          <p className="eyebrow-light mt-6">{dict.nav.quality}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.lead}</p>
        </div>
      </section>

      {/* QC pillars */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{t.processTitle}</p>
            <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">{intro.title}</h2>
            <p className="lede mt-4 max-w-3xl">{intro.body}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {qualityPillars.map((pillar, i) => (
              <Reveal key={pillar.title.en} delay={i * 60}>
                <article className="card-line h-full p-6">
                  <p aria-hidden="true" className="text-sm font-bold text-gold-deep">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-semibold text-ink">{pillar.title[cl]}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body[cl]}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate gallery with verified facts */}
      <section className="border-y border-border bg-paper py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{t.certsTitle}</p>
                <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">
                  {locale === "zh" ? "ISO · OEKO-TEX · SGS · 专利文件" : "ISO · OEKO-TEX · SGS · patent documents"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{t.certsNote}</p>
            </div>
          </Reveal>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert, i) => (
              <Reveal as="li" key={cert.image} delay={(i % 3) * 45}>
                <figure className="card-line group flex h-full flex-col overflow-hidden">
                  <a href={cert.pdf ?? cert.image} target="_blank" rel="noopener" className="block" aria-label={cert.label[cl]}>
                    <div className="relative aspect-[3/4] bg-muted">
                      <Image
                        src={cert.image}
                        alt={cert.label[cl]}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  </a>
                  <figcaption className="flex grow flex-col border-t border-border p-4">
                    <p className="text-sm font-semibold text-ink">{cert.label[cl]}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cert.note[cl]}</p>
                    {cert.facts ? (
                      <dl className="mt-3 space-y-1.5 border-t border-dashed border-border pt-3">
                        {cert.facts.map((fact) => (
                          <div key={fact.name.en} className="grid grid-cols-[auto_1fr] gap-x-3 text-xs leading-relaxed">
                            <dt className="shrink-0 text-muted-foreground">{fact.name[cl]}</dt>
                            <dd className="font-medium text-ink">{fact.value[cl]}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {cert.pdf ? (
                      <a
                        href={cert.pdf}
                        target="_blank"
                        rel="noopener"
                        className="mt-3 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-gold-deep underline-offset-4 hover:underline"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
                        </svg>
                        {t.downloadPdf}
                      </a>
                    ) : null}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl rounded-lg border border-gold/40 bg-accent/60 p-4 text-sm leading-relaxed text-accent-foreground">
            {verificationNote[cl]}
          </p>
        </div>
      </section>

      {/* Patents & IP */}
      <section className="py-14 sm:py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{t.patentsTitle}</p>
            <h2 className="display-2 mt-3 !text-2xl sm:!text-3xl">{pIntro.title}</h2>
            <p className="lede mt-4 max-w-3xl">{pIntro.body}</p>
          </Reveal>

          <Reveal delay={60}>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { value: patentStats.inventionCount, label: t.patentsStatsInvention },
                { value: patentStats.utilityCount, label: t.patentsStatsUtility },
                { value: patentStats.foreignCount, label: t.patentsStatsForeign },
              ].map((stat) => (
                <div key={stat.label} className="card-line p-6">
                  <p className="text-3xl font-bold tracking-tight text-ink">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Invention patents */}
          <h3 className="mt-12 text-lg font-semibold text-ink">
            {locale === "zh" ? "授权发明专利" : "Granted invention patents"}
          </h3>
          <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inventionPatents.map((patent) => (
              <li key={patent.number} className="card-line flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-ink">{patent.number}</p>
                  <span className="shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {patent.ownership === "sole" ? t.patentSoleLabel : t.patentJointLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug text-foreground">{locale === "zh" ? patent.titleZh : patent.titleEn}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{locale === "zh" ? patent.titleEn : patent.titleZh}</p>
                <dl className="mt-auto grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pt-4 text-xs text-muted-foreground">
                  <dt>{t.patentFiledLabel}</dt>
                  <dd className="text-foreground/80">{patent.filed}</dd>
                  <dt>{t.patentGrantedLabel}</dt>
                  <dd className="text-foreground/80">{patent.granted}{patent.publication ? ` · ${patent.publication}` : ""}</dd>
                </dl>
              </li>
            ))}
          </ul>

          {/* Foreign patents */}
          <h3 className="mt-12 text-lg font-semibold text-ink">
            {locale === "zh" ? "国外授权专利" : "Patents granted abroad"}
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {foreignPatents.map((patent) => (
              <figure key={patent.number} className="card-line group flex flex-col overflow-hidden sm:flex-row">
                <a href={patent.pdf} target="_blank" rel="noopener" className="relative block aspect-[3/4] w-full shrink-0 bg-muted sm:aspect-auto sm:w-44" aria-label={`${patent.country[cl]} ${patent.number}`}>
                  <Image
                    src={patent.image}
                    alt={`${patent.country[cl]} patent certificate ${patent.number}`}
                    fill
                    sizes="(min-width: 640px) 176px, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </a>
                <figcaption className="flex grow flex-col p-5">
                  <p className="text-sm font-bold tracking-tight text-ink">
                    <span aria-hidden="true" className="mr-2 inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{patent.flag}</span>
                    {patent.country[cl]}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-snug text-foreground">{locale === "zh" ? patent.titleZh : patent.titleEn}</p>
                  <dl className="mt-auto space-y-1 pt-4 text-xs text-muted-foreground">
                    <div className="flex gap-2">
                      <dt className="shrink-0">{t.patentNoLabel}:</dt>
                      <dd className="font-mono font-medium text-foreground/80">{patent.number}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0">{locale === "zh" ? "优先权" : "Priority"}:</dt>
                      <dd className="font-mono text-foreground/80">{patent.priority}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0">{patent.dateLabel[cl]}:</dt>
                      <dd className="text-foreground/80">{patent.dateValue[cl]}</dd>
                    </div>
                  </dl>
                  <a href={patent.pdf} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-gold-deep underline-offset-4 hover:underline">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
                    </svg>
                    {t.downloadPdf}
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Utility models — full list in a disclosure so the DOM stays crawlable */}
          <h3 className="mt-12 text-lg font-semibold text-ink">{t.utilityTableTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.utilityTableNote}</p>
          <details className="mt-4 rounded-lg border border-border bg-paper">
            <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-ink hover:text-gold-deep">
              {locale === "zh" ? `展开查看全部 ${patentStats.utilityCount} 件实用新型专利` : `Show all ${patentStats.utilityCount} utility model patents`}
            </summary>
            <div className="overflow-x-auto px-5 pb-5">
              <table className="table-spec w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th scope="col" className="text-left">{t.patentNoLabel}</th>
                    <th scope="col" className="text-left">{locale === "zh" ? "授权公告号" : "Publication"}</th>
                    <th scope="col" className="text-left">{locale === "zh" ? "实用新型名称" : "Title"}</th>
                    <th scope="col" className="text-left">{t.patentGrantedLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {utilityPatents.map((patent) => (
                    <tr key={patent.number}>
                      <td className="whitespace-nowrap font-mono text-xs">{patent.number}</td>
                      <td className="whitespace-nowrap font-mono text-xs">{patent.publication}</td>
                      <td className="text-xs leading-snug">{locale === "zh" ? patent.titleZh : patent.titleEn}</td>
                      <td className="whitespace-nowrap text-xs">{patent.granted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <p className="mt-6 max-w-3xl rounded-lg border border-gold/40 bg-accent/60 p-4 text-sm leading-relaxed text-accent-foreground">
            {patentDisclaimer[cl]}
          </p>
        </div>
      </section>

      {/* Verification steps */}
      <section className="border-t border-border bg-paper py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <h2 className="display-3">{t.verifyTitle}</h2>
            <ol className="mt-5 space-y-4">
              {t.verifySteps.map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/85">{step}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={90}>
            <div className="rounded-lg bg-primary p-7 text-primary-foreground">
              <h2 className="text-lg font-semibold text-white">{dict.actions.requestSample}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{dict.form.sampleIntro}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={lp("/request-sample")} className="btn-gold !min-h-10 !px-4 text-sm">{dict.actions.requestSample}</Link>
                <Link href={lp("/contact")} className="btn-light !min-h-10 !px-4 text-sm">{dict.actions.contactTeam}</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
