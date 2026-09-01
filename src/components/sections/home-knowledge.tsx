import Link from "next/link";
import Reveal from "@/components/layout/reveal";
import { articles } from "@/content/articles";
import type { Dictionary } from "@/content/i18n";
import type { Locale } from "@/content/company";

export default function HomeKnowledge({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.knowledge;
  const featured = articles.slice(0, 3);
  return (
    <section className="bg-paper py-16 sm:py-20" aria-labelledby="home-knowledge-title">
      <div className="container-site">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 id="home-knowledge-title" className="display-2 mt-3">{t.title}</h2>
              <p className="lede mt-4">{t.body}</p>
            </div>
            <Link href="/knowledge" className="btn-ghost !min-h-10 !px-4 text-sm">
              {dict.actions.allArticles}
            </Link>
          </div>
        </Reveal>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.map((article, index) => (
            <Reveal as="li" key={article.slug} delay={index * 70} className="h-full">
              <Link
                href={`/knowledge/${article.slug}`}
                className="card-line group flex h-full flex-col p-6 transition-all duration-200 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">{article.category}</p>
                <h3 className="mt-3 flex-1 font-semibold leading-snug text-ink group-hover:text-primary">{article.title}</h3>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.intro}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {dict.actions.readArticle}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
