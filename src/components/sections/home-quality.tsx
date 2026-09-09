import Link from "next/link";
import Reveal from "@/components/layout/reveal";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { localePath } from "@/content/company";

const marks: { title: string; body: Record<Locale, string> }[] = [
  { title: "ISO 9001:2015", body: { en: "Valid to Aug 2029 · CFC", zh: "有效期至 2029 年 8 月 · 首信认证", es: "Válido hasta ago 2029 · CFC", de: "Gültig bis Aug 2029 · CFC" } },
  { title: "OEKO-TEX Class I", body: { en: "Baby-articles grade · valid to Jan 2027", zh: "婴幼儿级 · 有效期至 2027 年 1 月", es: "Grado para artículos de bebé · válido hasta ene 2027", de: "Babyartikel-Klasse · gültig bis Jan 2027" } },
  { title: "SGS & TESTEX", body: { en: "Third-party test reports on file", zh: "第三方检测报告可查", es: "Informes de ensayo de terceros disponibles", de: "Prüfberichte Dritter liegen vor" } },
  { title: "34 + 2 patents", body: { en: "Granted CN patents + Nigeria & Malta", zh: "中国授权专利 + 尼日利亚、马耳他", es: "Patentes concedidas en CN + Nigeria y Malta", de: "Erteilte CN-Patente + Nigeria und Malta" } },
];

export default function HomeQuality({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.quality;
  return (
    <section className="border-b border-border py-16 sm:py-20" aria-labelledby="home-quality-title">
      <div className="container-site">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 id="home-quality-title" className="display-2 mt-3">{t.title}</h2>
              <p className="lede mt-4">{t.body}</p>
            </div>
            <Link href={localePath("/quality", locale)} className="btn-ghost !min-h-10 !px-4 text-sm">
              {t.cta}
            </Link>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {marks.map((mark) => (
              <li key={mark.title} className="card-line flex items-center gap-4 p-5">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold tracking-tight text-ink">{mark.title}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{mark.body[locale]}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">{t.disclaimer}</p>
        </Reveal>
      </div>
    </section>
  );
}
