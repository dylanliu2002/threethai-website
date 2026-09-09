import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/product-view";
import { products, productBySlug } from "@/content/products";
import { buildMetadata, breadcrumbSchema, faqSchema, jsonLd, productPageSchema } from "@/lib/seo";
import { localePath } from "@/content/company";
import { pageCopyFor } from "@/content/translation-availability";
import { pageMeta } from "@/content/server-copy";
import { langParams, resolveLang } from "../../_lang";

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return langParams().flatMap(({ lang }) =>
    products.map(({ slug }) => ({ lang, slug }))
  );
}

/**
 * Published copy resolves through `pageCopyFor`, the same call the availability
 * policy reads: unpromoted this is the model record and the `contentLocaleOf`
 * key it always used, promoted it is the registered translation that also
 * earned the URL its ownership.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  const { dict, locale } = await resolveLang(params, notFound);
  const { entity, contentLocale } = pageCopyFor(`/products/${slug}`, locale, product);
  return buildMetadata({
    title: `${entity.name[contentLocale]} ${pageMeta[locale].products.suffix}`,
    description: entity.metaDescription[contentLocale],
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
  const { entity, contentLocale } = pageCopyFor(`/products/${slug}`, locale, product);
  return (
    <>
      {jsonLd([
        productPageSchema({ name: entity.name[contentLocale], description: entity.metaDescription[contentLocale], slug: product.slug, locale }),
        faqSchema(entity.faqs[contentLocale]),
        breadcrumbSchema([
          { name: dict.breadcrumbs.home, path: localePath("/", locale) },
          { name: dict.breadcrumbs.products, path: localePath("/products", locale) },
          { name: entity.name[contentLocale], path: localePath(`/products/${product.slug}`, locale) },
        ]),
      ])}
      <ProductView product={product} locale={locale} dict={dict} />
    </>
  );
}
