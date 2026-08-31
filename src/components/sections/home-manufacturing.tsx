import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/layout/reveal";
import { factoryStats } from "@/content/factory";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { contentLocaleOf, localePath } from "@/content/company";

export default function HomeManufacturing({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const cl = contentLocaleOf(locale);
  const t = dict.home.manufacturing;
  return (
    <section className="bg-primary py-16 text-primary-foreground sm:py-20" aria-labelledby="home-manufacturing-title">
      <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/15">
            <Image
              src="/images/factory-live/ring-spinning.webp"
              alt={
                locale === "zh"
                  ? "荣沣纺织生产基地的环锭纺细纱机"
                  : "Ring spinning frames at the Three Thai Textile production base"
              }
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </figure>
        </Reveal>
        <Reveal delay={90}>
          <p className="eyebrow-light">{t.eyebrow}</p>
          <h2 id="home-manufacturing-title" className="mt-3 text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">{t.body}</p>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
            {factoryStats.slice(0, 3).map((stat) => (
              <div key={stat.value}>
                <dt className="order-2 mt-1 block text-xs uppercase tracking-wider text-white/60">{stat.label[cl]}</dt>
                <dd className="order-1 text-2xl font-bold tracking-tight text-gold sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <Link href={localePath("/manufacturing", locale)} className="btn-light mt-8">
            {t.cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
