import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/product-view";
import { products, productBySlug } from "@/content/products";
import { zh } from "@/content/i18n";
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
    title: `${product.name.zh} — 制造商与供应商`,
    description: product.metaDescription.zh,
    path: `/products/${product.slug}`,
    locale: "zh",
    alternates: { en: `/products/${product.slug}`, zh: `/zh/products/${product.slug}` },
    image: product.image,
  });
}

export default async function ZhProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  return (
    <>
      {jsonLd([
        productSchema({ name: product.name.zh, description: product.metaDescription.zh, image: product.image, slug: product.slug }),
        faqSchema(product.faqs.zh),
        breadcrumbSchema([
          { name: zh.breadcrumbs.home, path: "/zh" },
          { name: zh.breadcrumbs.products, path: "/zh/products" },
          { name: product.name.zh, path: `/zh/products/${product.slug}` },
        ]),
      ])}
      <ProductView product={product} locale="zh" dict={zh} />
    </>
  );
}
