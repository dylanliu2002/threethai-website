import Link from "next/link";
import type { Dictionary } from "@/content/i18n";
import { company, letterOfCreditUrl, localePath, type Locale } from "@/content/company";

export default function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = localePath;
  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold tracking-tight text-white">
            THREE THAI<span className="align-super text-[0.6em] text-gold">™</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold">{company.nameLegalZh}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-80">{dict.footer.tagline}</p>
        </div>

        <nav aria-label={dict.footer.explore}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{dict.footer.explore}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {(
              [
                ["/products", dict.nav.products],
                ["/applications", dict.nav.applications],
                ["/manufacturing", dict.nav.manufacturing],
                ["/quality", dict.nav.quality],
                ["/knowledge", dict.nav.knowledge],
                ["/product-finder", dict.actions.productFinder],
              ] as const
            ).map(([href, label]) => (
              <li key={href}>
                <Link className="opacity-80 transition-opacity hover:opacity-100 hover:text-gold" href={t(href, locale)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={dict.footer.company}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{dict.footer.company}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {(
              [
                ["/about", dict.nav.about],
                ["/contact", dict.nav.contact],
                ["/request-quote", dict.actions.requestQuote],
                ["/request-sample", dict.actions.requestSample],
                ["/answers", dict.breadcrumbs.answers],
              ] as const
            ).map(([href, label]) => (
              <li key={href}>
                <Link className="opacity-80 transition-opacity hover:opacity-100 hover:text-gold" href={t(href, locale)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">{dict.footer.contactTitle}</h2>
          <ul className="mt-4 space-y-2.5 text-sm opacity-90">
            <li>
              <a className="hover:text-gold" href={`mailto:${company.email}`}>
                {company.email}
              </a>
            </li>
            <li>
              <a className="hover:text-gold" href={`tel:${company.phoneHref}`}>
                {company.phoneDisplay}
              </a>
            </li>
            <li>{locale === "zh" ? company.locationZh : company.locationEn}</li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed opacity-60">{dict.footer.entityNote}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-5 text-xs opacity-70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.nameLegalZh}. {dict.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            <span>{dict.footer.updatedNote}</span>
            <a
              href={letterOfCreditUrl}
              className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-gold"
              rel="nofollow noopener"
            >
              {dict.footer.lc}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
