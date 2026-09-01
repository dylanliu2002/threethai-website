import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/product-view";
import { products, productBySlug } from "@/content/products";
import { en } from "@/content/i18n";
import { buildMetadata, breadcrumbSchema, faqSchema, jsonLd, productSchema } from "@/lib/seo";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: `${product.name.en} Manufacturer & Supplier`,
    description: product.metaDescription.en,
    path: `/products/${product.slug}`,
    locale: "en",
    alternates: { en: `/products/${product.slug}`, zh: `/zh/products/${product.slug}` },
    image: product.image,
    keywords: product.keywords,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  return (
    <>
      {jsonLd([
        productSchema({ name: product.name.en, description: product.metaDescription.en, image: product.image, slug: product.slug }),
        faqSchema(product.faqs),
        breadcrumbSchema([
          { name: en.breadcrumbs.home, path: "/" },
          { name: en.breadcrumbs.products, path: "/products" },
          { name: product.name.en, path: `/products/${product.slug}` },
        ]),
      ])}
      <ProductView product={product} locale="en" dict={en} />
    </>
  );
}
