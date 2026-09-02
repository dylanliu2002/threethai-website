import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/product-view";
import { products, productBySlug } from "@/content/products";
import { buildMetadata, breadcrumbSchema, faqSchema, jsonLd, productSchema } from "@/lib/seo";
import { localePath, contentLocaleOf } from "@/content/company";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) =>
    products.map(({ slug }) => ({ lang, slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  const { locale } = await resolveLang(params, notFound);
  const cl = contentLocaleOf(locale);
  return buildMetadata({
    title: `${product.name[cl]} Manufacturer & Supplier`,
    description: product.metaDescription[cl],
    path: `/products/${product.slug}`,
    locale,
    image: product.image,
    keywords: product.keywords,
  });
}

export default async function LangProductPage({ params }: Props) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  const { dict, locale } = await resolveLang(params, notFound);
  const cl = contentLocaleOf(locale);
  return (
    <>
      {jsonLd([
        productSchema({ name: product.name[cl], description: product.metaDescription[cl], image: product.image, slug: product.slug }),
        faqSchema(product.faqs[cl]),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: localePath("/", locale) },
          { name: dict.breadcrumbs.products, path: localePath("/products", locale) },
          { name: product.name[cl], path: localePath(`/products/${product.slug}`, locale) },
        ]),
      ])}
      <ProductView product={product} locale={locale} dict={dict} />
    </>
  );
}
