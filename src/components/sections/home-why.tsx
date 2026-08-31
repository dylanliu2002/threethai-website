import Reveal from "@/components/layout/reveal";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";

export default function HomeWhy({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.why;
  return (
    <section className="py-16 sm:py-20" aria-labelledby="home-why-title">
      <div className="container-site">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="home-why-title" className="display-2 mt-3">{t.title}</h2>
            <p className="lede mt-4">{t.body}</p>
          </div>
        </Reveal>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {t.points.map((point, index) => (
            <Reveal as="li" key={point.title} delay={index * 55}>
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
