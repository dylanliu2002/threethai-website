"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";import type { Dictionary } from "@/content/i18n";
import { company, htmlLang, localeLabels, localePath, locales, type Locale } from "@/content/company";

const UI_PREFIXES = locales.filter((l) => l !== "en");

/** Split a pathname into its locale + unprefixed path (en stays at root). */
function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const seg = pathname.split("/")[1];
  if (seg && (UI_PREFIXES as string[]).includes(seg)) {
    const rest = pathname.split("/").slice(2).join("/");
    return { locale: seg as Locale, path: rest ? `/${rest}` : "/" };
  }
  return { locale: "en", path: pathname };
}

type NavItem = { href: string; label: string };

const navItems: NavItem[] = [
  { href: "/products", label: "products" },
  { href: "/applications", label: "applications" },
  { href: "/manufacturing", label: "manufacturing" },
  { href: "/quality", label: "quality" },
  { href: "/knowledge", label: "knowledge" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
] as const;

function Wordmark({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath("/", locale)} className="group flex items-center gap-3" aria-label="Three Thai Textile home">
      <Image
        src="/images/brand/threethai-logo.png"
        alt="THREE THAI — PVA yarn/thread/fiber"
        width={170}
        height={45}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );
}

export default function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Escape closes the panel; lock scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const switchHref = (target: Locale) => {
    const { path } = splitLocalePath(pathname);
    return localePath(path, target);
  };

  const currentLabel = localeLabels[locale];

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* Utility strip */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="container-site flex h-9 items-center justify-between text-xs">
          <p className="tracking-wide opacity-90">
            {locale === "zh" ? "水溶性 PVA 纱线 · 缝纫线 · 短纤 · 长丝" : "Water-soluble PVA yarn · thread · fiber · filament"}
          </p>
          <div className="flex items-center gap-5 opacity-90">
            <a className="hover:text-gold" href="mailto:salesmanager@threethai.com">
              salesmanager@threethai.com
            </a>
            <span aria-hidden="true" className="opacity-40">|</span>
            <a className="hover:text-gold" href={`tel:${company.phoneHref}`}>
              {company.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Wordmark locale={locale} />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive(item.href) ? "text-primary" : "text-foreground/80 hover:text-primary"
              }`}
            >
              {dict.nav[item.label as keyof typeof dict.nav]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <details className="group relative hidden sm:block" data-testid="lang-switcher">
            <summary
              className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-semibold text-ink [&::-webkit-details-marker]:hidden"
              aria-label={`${dict.actions.language}: ${currentLabel}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="uppercase">{locale === "zh" ? "中文" : locale}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className="transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <ul className="absolute end-0 z-50 mt-1 max-h-80 w-44 overflow-y-auto rounded-md border border-border bg-background py-1 shadow-lg">
              {locales.map((l) => (
                <li key={l}>
                  <Link
                    href={switchHref(l)}
                    hrefLang={htmlLang[l]}
                    lang={htmlLang[l]}
                    aria-current={l === locale ? "true" : undefined}
                    className={`flex items-center justify-between px-3 py-2 text-sm ${l === locale ? "bg-secondary font-semibold text-primary" : "text-foreground/80 hover:bg-secondary/60 hover:text-primary"}`}
                    onClick={(e) => {
                      if (l === locale) e.preventDefault();
                      const details = e.currentTarget.closest("details");
                      if (details) details.open = false;
                    }}
                  >
                    {localeLabels[l]}
                    {l === locale && <span aria-hidden="true">✓</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          <Link href={localePath("/request-quote", locale)} className="btn-gold hidden !min-h-10 !px-4 md:inline-flex">
            {dict.actions.requestQuote}
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.actions.close : dict.actions.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

    </header>

    {/*
      Mobile navigation panel — a sibling of <header>, because the header's
      backdrop-filter makes it the containing block for `fixed` descendants
      (which would collapse the panel to zero height).
    */}
    {open && (
      <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-background md:top-[100px] lg:hidden">
        <nav aria-label="Mobile" className="container-site flex flex-col gap-1 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-3 text-base font-medium ${
                isActive(item.href) ? "bg-secondary text-primary" : "text-foreground"
              }`}
              onClick={() => setOpen(false)}
            >
              {dict.nav[item.label as keyof typeof dict.nav]}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-5">
            <Link href={localePath("/request-quote", locale)} className="btn-gold w-full" onClick={() => setOpen(false)}>
              {dict.actions.requestQuote}
            </Link>
            <Link href={localePath("/request-sample", locale)} className="btn-ghost w-full" onClick={() => setOpen(false)}>
              {dict.actions.requestSample}
            </Link>
            <details className="mt-2" data-testid="lang-switcher-mobile">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
                <span>{dict.actions.language}:</span>
                <span className="font-semibold text-ink">{currentLabel}</span>
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {locales.map((l) => (
                  <Link
                    key={l}
                    href={switchHref(l)}
                    hrefLang={htmlLang[l]}
                    lang={htmlLang[l]}
                    className={`rounded px-2 py-1.5 text-sm ${l === locale ? "bg-primary font-semibold text-primary-foreground" : "bg-secondary/60 text-foreground/80"}`}
                    onClick={(e) => {
                      if (l === locale) e.preventDefault();
                      setOpen(false);
                    }}
                  >
                    {localeLabels[l]}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </nav>
      </div>
    )}
    </>
  );
}
