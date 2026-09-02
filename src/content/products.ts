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
  technicalOverview: Record<ContentLocale, readonly string[]>;
  processGuide: Record<ContentLocale, readonly (readonly [string, string])[]>;
  faqs: Record<ContentLocale, readonly (readonly [string, string])[]>;
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
  technicalOverview: { zh: readonly string[] };
  processGuide: { zh: readonly (readonly [string, string])[] };
  faqs: { zh: readonly (readonly [string, string])[] };
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
    technicalOverview: { en: src.technicalOverview.map(brandFix), zh: patch.technicalOverview.zh },
    processGuide: { en: src.processGuide, zh: patch.processGuide.zh },
    faqs: { en: src.faqs, zh: patch.faqs.zh },
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
    technicalOverview: {
      zh: [
        "水溶性 PVA 纱线是一种临时工艺材料：它必须在络筒、织造、针织或刺绣过程中保持稳定，随后在受控的水处理中失去强度并离开织物结构。因此，一份有用的规格应把纱线结构与明确的溶解方法结合起来，而不是只依赖一个温度标签。",
        "荣沣目前围绕 20°C、40°C、55°C、60°C、70°C、80°C 和 90°C 的工艺目标开发 PVA 纱线。合适的等级取决于作用时间、浴液运动、织物密度、化学助剂和可接受的去除终点。我们会在评审买方工艺后确认确切的支数与当前可生产范围。",
      ],
    },
    processGuide: {
      zh: [
        ["明确临时功能", "说明纱线在何处提供支撑、承受多大张力，以及必须在生产的哪个阶段被去除。这样可以避免选出在烧杯里溶解正常、却在纺织加工中失效的等级。"],
        ["设定可重复的去除方法", "记录水温容差、作用时间、浴比、搅动方式，以及终点定义——是软化、强度丧失还是完全可见去除。"],
        ["确认生产代表性样品", "使用拟定的染料、助剂和整理顺序，对织物最致密或最难处理的部位进行试验，并把确认结果与书面产品规格挂钩。"],
      ],
    },
    faqs: {
      zh: [
        ["能否只按溶解温度选纱？", "不能。温度只是有用的起点，但纱线支数、捻度、织物结构、水的运动、时间和整理化学都会改变实际观察到的去除结果。"],
        ["样品申请应包含哪些信息？", "请提供支数体系、单纱或合股结构、目标温度与时间、纺织工艺、预计订量和交货目的地。"],
        ["两个 PVA 纱样品应如何对比？", "使用相同的样品尺寸、浴液体积、温度容差、搅动和终点定义，并同时记录加工稳定性和去除性能。"],
      ],
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
    technicalOverview: {
      zh: [
        "PVA 缝纫线用于临时缝合、定位和组装工序：生产过程中需要可靠的缝线，但成品上不能留下永久线迹。纱线必须在针性能、成圈和临时缝合强度之间取得平衡，并与成衣、刺绣或纺织结构相适应的去除周期相匹配。",
        "松散纱线的演示无法还原真实缝纫条件。线迹密度、缝型、针温、机速、卷装形式和周围材料都会影响表现。我们会在提出样品建议前评审这些条件，并建议让完整的缝合结构经过拟定的湿法整理顺序进行测试。",
      ],
    },
    processGuide: {
      zh: [
        ["描述缝纫工序", "提供设备类型、机针、线迹和缝型结构、运行速度，以及生产中必须避免的失效模式。"],
        ["定义不损伤成品的去除条件", "明确面料、染料和辅料可承受的最高水温，以及水洗周期、搅动方式和要求的残留状态。"],
        ["锁定商务规格", "试缝成功后，记录支数、合股数、上油、卷装尺寸、标签、测试方法和验收标准，使生产订单严格对照确认样品执行。"],
      ],
    },
    faqs: {
      zh: [
        ["水溶缝纫线和水溶刺绣底材是一回事吗？", "不是。缝纫线形成线迹，而水溶膜、水溶布或无纺布提供更大面积的支撑。正确选材取决于临时功能和去除路线。"],
        ["为什么拉伸数据合格，线还是会断？", "针况、导线器、张力、速度、卷装退绕和缝型设计都会产生实验室拉伸数据无法还原的应力。"],
        ["OEM 包装需要提供哪些信息？", "包括卷装类型和尺寸、净重、标签语言、纸箱要求、图案确认以及目的地专用的唫头信息。"],
      ],
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
    technicalOverview: {
      zh: [
        "PVA 短纤是一种非连续的材料形态，适用于需要混拌、梳理、分散或成网的工艺，而非连续的纱线路径。长度、细度、表面状态和水行为会影响开松、分布和下游表现，因此材料应与实际设备和配方相匹配。",
        "荣沣为纺织、无纺、造纸及其他选定的技术工艺供应 PVA 短纤。我们不把任何一个等级宣称为通用产品。在确认当前规格和样品供应之前，会先评审拟用的浆料或混料、工艺用水、温度历史、添加剂以及所需的成品材料性能。",
      ],
    },
    processGuide: {
      zh: [
        ["从材料系统出发", "说明其他纤维或原料、混比、添加剂、pH 值，以及各组分进入工艺的顺序。"],
        ["评估可加工性与分布", "在接近生产的混合或成网条件下，检查开松、喂入、分散、絮聚和兼容性。"],
        ["测量相关的成品性能", "以对该应用关键的纺织、无纺或纸页性能来确认样品，而不是只看松散纤维的外观。"],
      ],
    },
    faqs: {
      zh: [
        ["应规定哪些尺寸指标？", "说明纤维长度、细度及其容差，以及与工艺相关的表面、水分、包装或分散性要求。"],
        ["能凭目录照片选纤维吗？", "不能。外观相似的纤维在开松、分散和湿加工中的表现可能完全不同，必须进行受控的应用试验。"],
        ["你们供应混凝土用 PVA 纤维吗？", "不供应。混凝土 PVA 纤维不在我们当前的产品范围内。我们目前专注于纺织、无纺、造纸及选定的兼容技术工艺。"],
      ],
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
    technicalOverview: {
      zh: [
        "PVA 长丝为需要受控线性强度、稳定张力或可去除连续元件的工艺提供连续的材料路径。长丝规格与结构影响操作性，而强度、伸长率、表面状态和水响应必须结合目标纺织或技术工艺统筹考虑。",
        "选型应从设备和功能出发，而不是宽泛的产品名称。同一长丝作为支撑纱、织造组分或临时通道时表现可能不同，因为张力、接触面、周围材料和湿处理条件都会变化。荣沣会在确认样品规格前评审这些工艺背景。",
      ],
    },
    processGuide: {
      zh: [
        ["梳理长丝路径", "提供卷装形式、导纱器、接触面、运行速度、工作张力，以及最容易出现磨损或断头的位置。"],
        ["定义所需的服役窗口", "说明长丝必须经受哪些干法或湿法工序，以及应在什么确切条件下软化、失去强度或被去除。"],
        ["从受控试验逐步放大", "从可追溯样品开始，在代表性设备上测试，并在确认批量前记录加工与去除结果。"],
      ],
    },
    faqs: {
      zh: [
        ["长丝和短纤有什么区别？", "长丝是连续的，适合受控的线性加工；短纤是非连续的，适用于混拌、成网或基于分散的工艺路线。"],
        ["除旦数或分特数外还有哪些关键指标？", "结构、单丝数、强度、伸长率、卷装、表面状态、运行张力和溶解方法都会影响适用性。"],
        ["同一等级能用于所有技术纺织品吗？", "不能。设备、张力、化学环境、温度和临时材料的功能都必须按具体应用逐一验证。"],
      ],
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
