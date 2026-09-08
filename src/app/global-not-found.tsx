import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { RootDocument, rootMetadata, rootViewport } from "@/components/layout/root-document";
import { en } from "@/content/i18n";
import "./globals.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

/**
 * The 404 document, served for URLs that match no route and for any locale
 * segment that is not a site language. It lives outside every route tree, so it
 * brings its own root layout: nothing here is translated, so the document
 * declares the English it is actually written in.
 */
export default function GlobalNotFound() {
  return (
    <RootDocument locale="en">
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="eyebrow">404</p>
        <h1 className="display-2 mt-3">{en.notFound.title}</h1>
        <p className="lede mt-3 max-w-md">{en.notFound.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">{en.nav.home}</Link>
          <Link href="/products" className="btn-ghost">{en.nav.products}</Link>
          <Link href="/contact" className="btn-ghost">{en.nav.contact}</Link>
        </div>
      </div>
    </RootDocument>
  );
}
