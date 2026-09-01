import Link from "next/link";
import Reveal from "@/components/layout/reveal";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";
import { localePath } from "@/content/company";

export default function HomeCta({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.cta;
  return (
    <section className="py-16 sm:py-20" aria-labelledby="home-cta-title">
      <div className="container-site">
        <Reveal>
          <div className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-secondary via-background to-accent/40 p-8 sm:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: "linear-gradient(to right, #1a2151 1px, transparent 1px), linear-gradient(to bottom, #1a2151 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
            <div className="relative max-w-2xl">
              <h2 id="home-cta-title" className="display-2">{t.title}</h2>
              <p className="lede mt-4">{t.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={localePath("/request-quote", locale)} className="btn-primary">
                  {dict.actions.requestQuote}
                </Link>
                <Link href={localePath("/request-sample", locale)} className="btn-ghost">
                  {dict.actions.requestSample}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
