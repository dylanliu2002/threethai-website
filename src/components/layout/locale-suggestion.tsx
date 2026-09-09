"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { localePath, type Locale } from "@/content/company";
import {
  CHOSEN_LOCALE_COOKIE,
  DISMISSAL_STORAGE_KEY,
  pathWithoutLocale,
  suggestedLocaleFor,
} from "@/content/locale-suggestion";
import { clientLabels } from "@/content/site-copy";

/** Fired when the visitor dismisses the notice, so the store re-reads. */
const DISMISS_EVENT = "threethai:locale-notice-dismissed";

/**
 * What the browser says about this visitor's language, as a site locale or null.
 *
 * Reads three things that exist only in a browser: the language preferences, the
 * dismissal, and the cookie the language picker writes. A visitor who has already
 * chosen a language has answered the question, so the notice stands down.
 */
function readSuggestion(locale: Locale): Locale | null {
  try {
    if (window.localStorage.getItem(DISMISSAL_STORAGE_KEY)) return null;
    const choseAlready = document.cookie
      .split(";")
      .some((entry) => entry.trim().startsWith(`${CHOSEN_LOCALE_COOKIE}=`));
    if (choseAlready) return null;
    return suggestedLocaleFor(navigator.languages ?? [navigator.language], locale);
  } catch {
    // Private-mode storage errors must not break the page. A notice that fails to
    // appear is the worst outcome available here; a thrown one is not.
    return null;
  }
}

const subscribe = (notify: () => void) => {
  window.addEventListener(DISMISS_EVENT, notify);
  return () => window.removeEventListener(DISMISS_EVENT, notify);
};

/**
 * A dismissible, purely advisory notice: "this site is also available in
 * <language>".
 *
 * It decides in the browser and its server snapshot is a permanent `null`, which
 * is the whole design. Reading `Accept-Language` on the server would look like the
 * cheaper route to the same result and would quietly make every English page
 * dynamic — 57 prerendered documents answered per requester instead of once —
 * which is the shape GSC LOCALE-003A removed a geo rule for. Here the initial HTML
 * is byte-identical for every visitor (verified: EN 57/57 and ZH 55/55 documents
 * unchanged, 0 dynamic routes), the suggestion cannot become a redirect because
 * this file holds no way to navigate, and dismissal never reaches a server.
 *
 * What it does cost is 8,424 B of client bundle — 7,990 B for the component and
 * 434 B for its strings, which live in the shared label module the header already
 * imports. Mounting it in the English layout alone measured worse (29 KB: the
 * bundler duplicated a 63 KB chunk per route tree), so the shared shell is the
 * cheap place. The owner accepted the figure on 2026-09-09 and INTL-DEES-003B's
 * ceiling carries it as a named allowance.
 */
export default function LocaleSuggestion({ locale }: { locale: Locale }) {
  const getSnapshot = useCallback(() => readSuggestion(locale), [locale]);
  const target = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (!target) return null;

  // The same rule the header's picker follows: a prefixed locale says so in the
  // path, and English — the prefix-free owner — travels as /en/<path>.
  const path = pathWithoutLocale(window.location.pathname);
  const href = target === "en" ? `/en${path === "/" ? "" : path}` : localePath(path, target);
  const copy = clientLabels[target];

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSAL_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 print:hidden">
      <div className="container-site pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 shadow-lg">
          <p className="text-sm leading-relaxed text-foreground">
            {copy.localeNotice}
            <Link href={href} className="ml-1 font-semibold text-primary hover:underline">
              {copy.localeNoticeLink}
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-10 rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {copy.localeNoticeDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
