import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/content/products";
import type { Dictionary } from "@/content/i18n";
import { contentLocaleOf, localePath, type Locale } from "@/content/company";

export default function ProductCard({
  product,
  locale,
  dict,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
}) {
  const cl = contentLocaleOf(locale);
  return (
    <Link
      href={localePath(`/products/${product.slug}`, locale)}
      className="card-line group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_rgba(26,33,81,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.imageAlt[cl]}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          priority={priority}
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display-3 !text-lg">{product.name[cl]}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{product.tagline[cl]}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {dict.actions.viewSpecifications}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
