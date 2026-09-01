import Link from "next/link";
import Image from "next/image";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { localePath } from "@/content/company";

export default function HomeHero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.hero;
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      {/* Full-bleed spinning-mill backdrop — brand-graded banner (2560×1120) */}
      <div>
        <Image
          src="/images/generated/hero-pva-spinning.jpg"
          alt={t.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] rtl:object-[30%_center]"
        />
        {/* Legibility scrims: text side on desktop, vertical wash top & bottom */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/55 to-primary/10 rtl:bg-gradient-to-l"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/60" />
        {/* Subtle industrial grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="container-site relative flex min-h-[560px] flex-col justify-center py-20 sm:min-h-[620px] sm:py-24 lg:min-h-[700px]">
        <div className="max-w-2xl">
          <p className="eyebrow-light">{t.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
            {t.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{t.body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={localePath("/request-quote", locale)} className="btn-gold">
              {dict.actions.requestQuote}
            </Link>
            <Link href={localePath("/products", locale)} className="btn-light">
              {dict.actions.exploreProducts}
            </Link>
          </div>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
            {t.stamp}
          </p>
        </div>
      </div>
    </section>
  );
}
