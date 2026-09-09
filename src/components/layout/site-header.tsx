"use client";

import Link from "next/link";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/content/i18n";
import { company, htmlLang, localeLabels, localePath, locales, type Locale } from "@/content/company";
import { clientLabels } from "@/content/site-copy";
import { markLocaleChosen } from "@/content/locale-suggestion";

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
    <Link href={localePath("/", locale)} className="group flex items-center gap-3" aria-label={clientLabels[locale].homeAriaLabel}>
      <Image
        src="/images/brand/threethai-logo.png"
        alt={clientLabels[locale].logoAlt}
        width={170}
        height={45}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );
}

export default function SiteHeader({
  locale,
  dict,
  availableLocales,
}: {
  locale: Locale;
  dict: Dictionary;
  /**
   * The server-resolved ownership answers: `baseline` is the set of locales the
   * content model carries on **every** page, `exceptions` the complete answer for
   * each path the policy resolves beyond it, keyed by prefix-free owner.
   * INTL-DEES-003B. This component is `"use client"`, and which locale may claim
   * a URL is an SEO ownership decision: it must arrive as answers, never as a
   * rule this file can re-derive or a locale list it can hardcode. A path with no
   * entry resolves to `baseline`, so it can never gain a promotion this file did
   * not receive from the server.
   */
  availableLocales: {
    readonly baseline: readonly Locale[];
    readonly exceptions: Readonly<Record<string, readonly Locale[]>>;
  };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  /*
   * The panel and the desktop menu close by derivation, not from inside a link's
   * click handler. Calling setOpen(false) or details.open = false there removes the
   * <a> while its own click is still being processed — the dialog unmounts its
   * content, <details> hides it — and the navigation can be dropped, which is the
   * "I clicked and nothing happened, then I clicked again" report. `pathname`
   * changing is the fact that a navigation happened, so that is what closes them.
   */
  const [openedOn, setOpenedOn] = useState(pathname);
  const dialogOpen = open && openedOn === pathname;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const { path: currentPath } = splitLocalePath(pathname);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/"
      ? currentPath === "/"
      : currentPath === href || currentPath.startsWith(`${href}/`);

  /**
   * Where a picker click goes.
   *
   * zh, es and de carry their locale in the path, so the path alone states the
   * choice. English owns the prefix-free URL, so a bare `/products` says nothing
   * about English and a stored preference may legitimately relocate it — that is
   * how a visitor who last chose Deutsch ends up on `/de/products` after typing
   * the English address. So the English entry points at the `/en` safety alias:
   * the choice is written into the path itself, which survives a bookmark, a
   * shared link and a back navigation, and the alias consolidates permanently
   * onto the English owner while recording `en` as the preference. Measured
   * against the routing policy: `/en/products` lands in English even with a
   * stale `threethai_locale=de`, because the alias persists the served locale
   * before the stored preference is ever consulted.
   */
  const switchHref = (target: Locale) => {
    const { path } = splitLocalePath(pathname);
    return target === "en" ? `/en${path === "/" ? "" : path}` : localePath(path, target);
  };

  // Locales that genuinely have this page. The switcher keeps linking users to
  // every language (English-fallback copies included), but `hreflang`/`lang`
  // are only claims we can honour — advertising them on a fallback copy is what
  // tells Google the copy is an independent localised document. Both branches are
  // server-resolved data (003B): this browser component holds no ownership rule,
  // imports no policy, names no locale list, and an unknown path falls back to
  // the model-guaranteed baseline rather than to anyone's promotion.
  const localizedTargets = availableLocales.exceptions[currentPath] ?? availableLocales.baseline;

  const currentLabel = localeLabels[locale];

  return (
    <DialogPrimitive.Root
      open={dialogOpen}
      onOpenChange={(next) => {
        if (next) setOpenedOn(pathname);
        setOpen(next);
      }}
      modal
    >
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* Utility strip */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="container-site flex h-9 items-center justify-between text-xs">
          <p className="tracking-wide opacity-90">
            {clientLabels[locale].headerTagline}
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

        <nav aria-label={clientLabels[locale].mainNavAriaLabel} className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={localePath(item.href, locale)}
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
          <details ref={detailsRef} className="group relative hidden sm:block" data-testid="lang-switcher">
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
                  {/*
                    A plain anchor, deliberately. Changing site language is a
                    document-level event — every locale serves its own prerendered
                    page — and next/link would try to resolve it in the client router
                    instead. Measured in Chrome: English is the prefix-free owner, so
                    its `/en/products` exists only as a 308 from the proxy, which the
                    router never consults; it picked another locale out of its prefetch
                    data and landed a visitor who clicked English on /es/products.
                  */}
                  <a
                    href={switchHref(l)}
                    hrefLang={localizedTargets.includes(l) ? htmlLang[l] : undefined}
                    lang={localizedTargets.includes(l) ? htmlLang[l] : undefined}
                    aria-current={l === locale ? "true" : undefined}
                    className={`flex items-center justify-between px-3 py-2 text-sm ${l === locale ? "bg-secondary font-semibold text-primary" : "text-foreground/80 hover:bg-secondary/60 hover:text-primary"}`}
                    onClick={(e) => {
                      if (l === locale) {
                        // Nothing to navigate to; close the menu the click opened.
                        e.preventDefault();
                        if (detailsRef.current) detailsRef.current.open = false;
                        return;
                      }
                      // Record the choice where JS can see it: the cookie the proxy
                      // writes is httpOnly, so the notice could never read it.
                      markLocaleChosen();
                    }}
                  >
                    {localeLabels[l]}
                    {l === locale && <span aria-hidden="true">✓</span>}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <Link href={localePath("/request-quote", locale)} className="btn-gold hidden !min-h-10 !px-4 md:inline-flex">
            {dict.actions.requestQuote}
          </Link>

          <DialogPrimitive.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
              aria-controls="mobile-nav"
              aria-label={dialogOpen ? dict.actions.close : dict.actions.menu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </DialogPrimitive.Trigger>
        </div>
      </div>

    </header>

    {/*
      Mobile navigation panel — a sibling of <header>, because the header's
      backdrop-filter makes it the containing block for `fixed` descendants
      (which would collapse the panel to zero height).
    */}
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-transparent lg:hidden" />
      <DialogPrimitive.Content
        id="mobile-nav"
        aria-describedby={undefined}
        className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-background md:top-[100px] lg:hidden"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          firstMobileLinkRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogPrimitive.Title className="sr-only">{dict.actions.menu}</DialogPrimitive.Title>
        <DialogPrimitive.Close
          type="button"
          aria-label={dict.actions.close}
          className="absolute end-5 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </DialogPrimitive.Close>
        <nav aria-label={clientLabels[locale].mobileNavAriaLabel} className="container-site flex flex-col gap-1 pb-6 pt-16">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              ref={index === 0 ? firstMobileLinkRef : undefined}
              href={localePath(item.href, locale)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-3 text-base font-medium ${
                isActive(item.href) ? "bg-secondary text-primary" : "text-foreground"
              }`}
            >
              {dict.nav[item.label as keyof typeof dict.nav]}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-5">
            <Link href={localePath("/request-quote", locale)} className="btn-gold w-full">
              {dict.actions.requestQuote}
            </Link>
            <Link href={localePath("/request-sample", locale)} className="btn-ghost w-full">
              {dict.actions.requestSample}
            </Link>
            <details className="mt-2" data-testid="lang-switcher-mobile">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
                <span>{dict.actions.language}:</span>
                <span className="font-semibold text-ink">{currentLabel}</span>
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {locales.map((l) => (
                  <a
                    key={l}
                    href={switchHref(l)}
                    hrefLang={localizedTargets.includes(l) ? htmlLang[l] : undefined}
                    lang={localizedTargets.includes(l) ? htmlLang[l] : undefined}
                    className={`rounded px-2 py-1.5 text-sm ${l === locale ? "bg-primary font-semibold text-primary-foreground" : "bg-secondary/60 text-foreground/80"}`}
                    onClick={(e) => {
                      // Plain anchor for the same reason as the desktop list: a
                      // language is a document, not a client-route transition.
                      if (l === locale) {
                        e.preventDefault();
                        setOpen(false);
                        return;
                      }
                      markLocaleChosen();
                    }}
                  >
                    {localeLabels[l]}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </nav>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
