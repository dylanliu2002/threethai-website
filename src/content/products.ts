import { products as legacyProducts } from "./legacy-source";
import type { ContentLocale } from "./company";

/**
 * Product content model. English copy is migrated verbatim from the legacy
 * site (legacy-source.ts). Chinese summary copy comes from the verified
 * Chinese homepage copy of the legacy site. Applications cross-link both ways
 * with content/applications.ts (see `applicationProducts` there).
 */

export type ProductSpec = { label: string; value: string };

export type Product = {
  slug: string;
  name: Record<ContentLocale, string>;
  tagline: Record<ContentLocale, string>;
  image: string;
  imageAlt: Record<ContentLocale, string>;
  metaDescription: Record<ContentLocale, string>;
  intro: Record<ContentLocale, string>;
  highlights: Record<ContentLocale, readonly string[]>;
  applications: readonly string[];
  applicationsSlugs: readonly string[];
  selection: Record<ContentLocale, readonly string[]>;
  technicalOverview: readonly string[];
  processGuide: readonly (readonly [string, string])[];
  faqs: readonly (readonly [string, string])[];
  keywords: readonly string[];
};

const legacy = Object.fromEntries(legacyProducts.map((p) => [p.slug, p]));

/** Chinese summary fields layered over the English legacy content. */
type ProductPatch = {
  name: { zh: string };
  tagline: { zh: string };
  imageAlt: Record<ContentLocale, string>;
  metaDescription: { zh: string };
  intro: { zh: string };
  highlights: { zh: readonly string[] };
  applicationsSlugs: readonly string[];
  selection: { zh: readonly string[] };
};

function build(slug: string, patch: ProductPatch): Product {
  const src = legacy[slug] as unknown as {
    title: string;
    intro: string;
    image: string;
    metaDescription: string;
    applications: readonly string[];
    selection: readonly string[];
    technicalOverview: readonly string[];
    processGuide: readonly (readonly [string, string])[];
    faqs: readonly (readonly [string, string])[];
    keywords: readonly string[];
  };
  if (!src) throw new Error(`Unknown legacy product: ${slug}`);
  /**
   * Brand voice at the display layer: legacy copy names the export brand
   * ("Three Thai") as sentence subject. Owner confirmed (2026-09) that the
   * English-facing name is Shandong Three Thai Textile Co., Ltd. — also the
   * name printed on the ISO 9001 / OEKO-TEX certificates — so legacy text
   * passes through unchanged. Facts are unchanged.
   */
  const brandFix = (text: string) => text;
  return {
    slug,
    name: { en: src.title, zh: patch.name.zh },
    tagline: { en: brandFix(src.intro), zh: patch.tagline.zh },
    image: src.image,
    imageAlt: patch.imageAlt,
    metaDescription: { en: brandFix(src.metaDescription), zh: patch.metaDescription.zh },
    intro: { en: brandFix(src.intro), zh: patch.intro.zh },
    highlights: { en: src.applications, zh: patch.highlights.zh },
    applications: src.applications,
    applicationsSlugs: patch.applicationsSlugs,
    selection: { en: src.selection, zh: patch.selection.zh },
    technicalOverview: src.technicalOverview.map(brandFix),
    processGuide: src.processGuide,
    faqs: src.faqs,
    keywords: src.keywords,
  };
}

export const products: readonly Product[] = [
  build("water-soluble-pva-yarn", {
    name: { zh: "PVA 水溶纱" },
    tagline: { zh: "纺纱性能稳定，覆盖低温至高温的可控溶解方案。" },
    imageAlt: {
      en: "Water-soluble PVA yarn cones produced by Three Thai Textile",
      zh: "threethai™ 生产的水溶性 PVA 纱线",
    },
    metaDescription: {
      zh: "水溶性 PVA 纱线制造商，提供低温至高温溶解选择，适用于织造、针织与临时支撑用途。",
    },
    intro: { zh: "荣沣纺织生产水溶性 PVA 纱线，在织造、针织等加工过程中保持稳定强度，并可在设定的水洗条件下受控去除。" },
    highlights: {
      zh: ["提供多种纱线支数选择", "支持低温至高温的可控溶解", "适用于织造、针织及临时支撑"],
    },
    applicationsSlugs: ["towel-weaving", "embroidery-sewing", "knitting", "technical-textiles"],
    selection: {
      zh: ["纱线支数与结构", "所需断裂强度与伸长率", "目标水溶温度", "溶解时间、搅动及后整理条件"],
    },
  }),
  build("water-soluble-pva-sewing-thread", {
    name: { zh: "PVA 水溶缝纫线" },
    tagline: { zh: "生产过程中保持可靠缝合强度，后整理时洁净去除。" },
    imageAlt: {
      en: "Water-soluble PVA sewing thread packages",
      zh: "水溶性 PVA 缝纫线卷装",
    },
    metaDescription: {
      zh: "水溶性 PVA 缝纫线，适用于临时缝合、刺绣引导与服装加工，湿法后整理中洁净去除。",
    },
    intro: { zh: "水溶性 PVA 缝纫线在生产过程中提供可靠的缝合强度，并在设定的湿法后整理条件下去除。" },
    highlights: {
      zh: ["满足临时缝合的稳定性要求", "湿法后整理过程中洁净去除", "适用于缝纫、刺绣及服装加工"],
    },
    applicationsSlugs: ["embroidery-sewing", "technical-textiles"],
    selection: {
      zh: ["线的支数与合股数", "缝纫速度与针型条件", "临时缝合强度", "目标去除温度与水洗周期"],
    },
  }),
  build("pva-staple-fiber", {
    name: { zh: "PVA 短纤" },
    tagline: { zh: "适用于纺织、无纺及技术用途的短切纤维。" },
    imageAlt: {
      en: "PVA staple fiber supplied in short-cut formats",
      zh: "短切形式供应的 PVA 短纤",
    },
    metaDescription: {
      zh: "PVA 短纤供应商，面向纺织、无纺及选定的工业应用，根据工艺与性能需求匹配产品。",
    },
    intro: { zh: "PVA 短纤以短切形式供应，适用于需要分散或受控去除的纺织、无纺及选定技术用途。" },
    highlights: {
      zh: ["可根据应用提供不同短切规格", "支持分散型及水溶型方案", "适用于纺织、无纺及技术材料"],
    },
    applicationsSlugs: ["papermaking", "technical-textiles", "knitting"],
    selection: {
      zh: ["纤维长度与细度", "分散性要求", "强度与伸长率目标", "水溶性或保留性要求"],
    },
  }),
  build("pva-filament-yarn", {
    name: { zh: "PVA 长丝" },
    tagline: { zh: "强度、伸长率与水溶性能稳定的连续长丝。" },
    imageAlt: {
      en: "Continuous PVA filament yarn package",
      zh: "连续 PVA 长丝卷装",
    },
    metaDescription: {
      zh: "PVA 长丝制造商，为技术纺织品、复合材料加工与受控水溶应用提供连续长丝。",
    },
    intro: { zh: "连续 PVA 长丝具有稳定的结构一致性，可根据强度、伸长率与溶解曲线匹配技术纺织或复合材料工艺。" },
    highlights: {
      zh: ["连续长丝性能稳定一致", "可提供定制水溶曲线", "适用于产业用纺织品及复合材料加工"],
    },
    applicationsSlugs: ["technical-textiles", "towel-weaving"],
    selection: {
      zh: ["长丝结构", "强度与伸长率", "加工张力", "目标溶解曲线"],
    },
  }),
] as const;

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

/** Extended material formats verified from the legacy homepage copy. */
export const extendedFormats = {
  en: {
    kicker: "Additional formats",
    title: "More PVA material forms for specialized applications",
    body: "We also manufacture PVA cotton, PVA top, PPVA fiber, concrete PVA fiber and Gracell yarn. Contact our team to match the specification and sample to your application.",
    items: ["PVA cotton", "PVA top", "PPVA fiber", "Concrete PVA fiber", "Gracell yarn"],
  },
  zh: {
    kicker: "扩展产品目录",
    title: "面向专业应用的更多 PVA 材料形态",
    body: "我们同样生产 PVA Cotton、PVA Top、PPVA 纤维、混凝土 PVA 纤维和 Gracell 纱线，可根据具体应用匹配规格并安排样品。",
    items: ["PVA Cotton", "PVA Top", "PPVA 纤维", "混凝土 PVA 纤维", "Gracell 纱线"],
  },
} as const;
