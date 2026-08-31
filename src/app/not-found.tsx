import Link from "next/link";
import { en } from "@/content/i18n";

export default function NotFound() {
  return (
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
  );
}
