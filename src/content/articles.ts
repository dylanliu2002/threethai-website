import { articles as legacyArticles } from "./legacy-source";
import type { ContentLocale } from "./company";

/**
 * Technical knowledge articles — English copy migrated verbatim from the
 * legacy site (URLs preserved for SEO), Simplified Chinese written for the
 * /zh knowledge routes so the Chinese site no longer falls back to English.
 */

export type Article = {
  slug: string;
  category: Record<ContentLocale, string>;
  datePublished: string;
  dateModified: string;
  title: Record<ContentLocale, string>;
  metaDescription: Record<ContentLocale, string>;
  intro: Record<ContentLocale, string>;
  sections: Record<ContentLocale, readonly (readonly [string, string])[]>;
};

const legacy = Object.fromEntries(legacyArticles.map((a) => [a.slug, a]));

type ArticlePatch = {
  category: string;
  title: string;
  metaDescription: string;
  intro: string;
  sections: readonly (readonly [string, string])[];
};

const zhPatches: Record<string, ArticlePatch> = {
  "pva-yarn-dissolution-temperature-guide": {
    category: "技术指南",
    title: "PVA 纱线溶解温度指南：20°C、40°C 与 90°C",
    metaDescription: "了解 PVA 纱线溶解为何随温度、时间、搅动、纱线结构与整理条件而变化，再确定采购规格。",
    intro: "标称的溶解温度只是起点，不是完整的工艺规格。买家应在可重复的条件下评估完整的去除周期。",
    sections: [
      ["温度只是其中一个变量", "更高的水温通常会加速溶解，但时间、浴液运动、浴比和织物结构都可能改变观察到的结果。"],
      ["纱线结构影响水分接触", "支数、捻度、合股和周围织物密度，会影响水分接触 PVA 材料并带走溶解聚合物的速度。"],
      ["整理条件同样重要", "浆料、油剂、染料及其他工艺化学品会改变润湿和去除行为。实验室样品应还原拟定的生产顺序。"],
      ["如何对比样品", "使用相同的样品尺寸、水量、温度容差、搅动和观察方法，并把部分软化与完全去除分开记录。"],
      ["20°C、40°C 和 90°C 实际代表什么", "这些标签描述的是预期的工作范围，而不是通用的合格判据。当周围材料无法承受热量时可选择 20°C 等级；较高温度的等级则可能需要在更早的湿工序中保持稳定。买卖双方应把每个标签与书面的时间、浴液和终点定义对应起来。"],
      ["建立有效的测试方案", "对样品进行调湿和标识，使用校准过的温度计，规定水与材料的比例，并把温度控制在约定的容差内。保持搅动一致；当溶解的聚合物可能影响下一次测试时，应在样品之间更换浴液。重复测试应足够充分，以区分规律性差异和一次性观察。"],
      ["不要只看最终消失时间", "把初始润湿、软化、拉伸功能丧失、破裂和完全可见去除分别记录。不同应用关心的阶段不同：临时缝线可能在每一点痕迹消失之前就停止发挥作用，而镂空织物可能需要严格得多的目视终点。"],
      ["从实验室走向生产", "与松散纱线的演示相比，致密织物区域、大浴量装载、受限的水流运动和真实的整理化学品都会减缓去除速度。应在最难处理的生产结构上做中试，检查残留材料和最终织物性能，并把确认的方法随产品和批次记录存档。"],
    ],
  },
  "pva-yarn-buyer-specification-checklist": {
    category: "采购清单",
    title: "订购水溶性 PVA 纱线前应确认的五项规格",
    metaDescription: "面向买家的实用清单：订购 PVA 纱线样品前，确认支数、强度、伸长率、溶解曲线和最终用途工艺。",
    intro: "一份有效的报价需要的不只是产品名称。提前分享五项核心需求，能帮助供应商推荐更贴近的首次样品，并缩短开发周期。",
    sections: [
      ["1. 纱线支数与结构", "说明所需的支数体系、单纱或合股结构、捻向，以及与贵方设备相关的尺寸限制。"],
      ["2. 强度要求", "描述纱线在络筒、织造、缝纫或整理过程中需要承受的载荷，而不是脱离工艺背景直接要求最高强度。"],
      ["3. 伸长率与加工表现", "说明张力、运行速度和需要避免的失效模式。稳定的加工可能需要在强度与伸长率之间取得平衡。"],
      ["4. 溶解曲线", "规定目标水温、作用时间、搅动和可接受的残留状态。不要只依赖温度。"],
      ["5. 最终用途工艺", "提供织物结构、化学品、整理顺序和预计用量，使取样能反映真实的生产环境。"],
      ["补充样品与包装要求", "说明代表性试验所需的材料数量、贵方设备可接受的卷装形式，以及标签或纸箱要求。技术上合适的纱线，如果卷装尺寸、退绕方向或标识与生产线不匹配，仍会带来本可避免的问题。"],
      ["让商务报价可相互比较", "要求每家供应商按相同的规格、数量、包装、贸易术语、目的地、币种和报价有效期报价，并把样品量、中试量和批量分开。这样更容易比较到岸成本，也避免把不同的结构或交货基础误当成同一材料的更低价格。"],
      ["定义样品到批量的控制", "记录确认样品的标识、测试方法和验收标准；询问原材料、结构、上油或生产路线的变化如何受控并通知。对于返单，约定哪些数据随每批传递、哪些偏差需要买家批准。"],
      ["使用完整的询单说明", "一份实用的询单包括：支数体系与容差、单纱或合股结构、强度与伸长率需求、纺织工艺、目标去除周期、化学品、卷装、试验数量、年度预测和目的地。如果某项数值未知，请描述工艺问题，而不是凭空猜测一个数字。"],
    ],
  },
  "pva-batch-dissolution-consistency": {
    category: "质量控制",
    title: "如何评估 PVA 批次溶解一致性",
    metaDescription: "用受控样品、水条件和验收标准，建立跨批次比较 PVA 纱线溶解表现的可重复框架。",
    intro: "批次一致性无法通过不受控的目视演示来判断。有效的比较需要书面方法和针对每一批次的相同验收标准。",
    sections: [
      ["控制样品", "使用相同的质量、长度、结构和调湿时间，并在测试前记录批次标识。"],
      ["控制浴液", "保持水量、温度容差、搅动和测试时长。当溶解的聚合物可能影响下一个结果时，应在测试之间更换浴液。"],
      ["定义终点", "把润湿、软化、强度丧失和完全可见去除分开。选择对生产过程真正重要的那个终点。"],
      ["保留可比较的记录", "照片、计时、浴液条件和操作员记录，能让供需双方的结果更容易相互印证。"],
      ["使用重复样与参照样", "每批次测试不止一个样品，并尽可能加入一个确认过的参照样。参照样有助于发现浴液、设备或操作手法的漂移，否则这些变化可能被误判为批次差异。记录取样位置，使结果可追溯到被测材料。"],
      ["区分方法波动与产品波动", "温度过冲、搅动不同、样品质量差异和终点判断都可能造成很大的表观差异。在断定生产发生变化之前，先复核校准和方法执行情况。如有可能，买卖双方应交换同一份书面程序，并在分割样品上比较结果。"],
      ["系统化调查偏差", "隔离受影响材料，确认标识，在受控条件下重复测试，并把制造和放行记录与确认批次对比。区分偏差涉及加工强度、溶解阶段、残留还是成品性能——每一条都指向不同的调查路径。"],
      ["把方法升级为验收计划", "规定抽样量、频次、设备、容差、终点、报告格式和处置界限。提前决定什么情况触发复测、技术评审或拒收。对方法变更实行版本控制，保证测试方法演进后历史批次结果仍可比较。"],
    ],
  },
  "pva-staple-fiber-vs-filament-yarn": {
    category: "选材对比",
    title: "PVA 短纤与长丝：如何选择材料形态",
    metaDescription: "从结构、加工路线、增强行为和去除需求出发，比较 PVA 短纤与 PVA 长丝。",
    intro: "短纤和连续长丝解决的是不同的工艺问题。正确的选择从制造路线和 PVA 材料必须承担的功能开始。",
    sections: [
      ["短纤", "短切纤维适合纺纱、混拌、无纺成网和选定的基于分散的用途。长度与细度是关键选型变量。"],
      ["长丝", "连续长丝适合需要受控线性强度、稳定张力和不间断结构的过程。"],
      ["先比较所需功能", "在比较价格之前，先确定材料需要分散、增强、形成连续支撑还是制造可去除的通道。"],
      ["在真实工艺中验证", "在放大生产之前，用实际的张力、化学品、温度和整理条件测试选定的形态。"],
      ["比较制造路线", "短纤要经过开松、混拌、梳理、湿法成网等工序，分布与兼容性是核心；长丝则沿导纱器、张力装置、织造或铺放设备连续运行，线性强度、伸长率、耐磨和卷装表现更重要。"],
      ["精确定义水行为", "有些应用需要受控去除，另一些则需要材料在服役的部分或全部阶段保留。请描述接触温度、时间、搅动、化学品和要求的终点。不要假设所有标称 PVA 的材料都有相同的溶解曲线。"],
      ["考虑储存与搬运", "防潮、卷装完整性和调湿都会影响加工。短纤要考虑压缩、开松和喂入；长丝要确认卷装类型、退绕和张力。约定标签和批次标识，让仓储和生产团队共同保护确认过的材料。"],
      ["确认商用等级", "索取书面规格、可追溯样品和生产代表性试验。评估成品、记录确认条件，并与采购规格挂钩。价格比较应基于相同的材料形态、尺寸、性能、包装和交货基础。"],
    ],
  },
};

function build(slug: string): Article {
  const src = legacy[slug];
  const zh = zhPatches[slug];
  if (!src) throw new Error(`Unknown legacy article: ${slug}`);
  if (!zh) throw new Error(`Missing zh patch for article: ${slug}`);
  return {
    slug,
    datePublished: src.datePublished,
    dateModified: src.dateModified,
    category: { en: src.category, zh: zh.category },
    title: { en: src.title, zh: zh.title },
    metaDescription: { en: src.metaDescription, zh: zh.metaDescription },
    intro: { en: src.intro, zh: zh.intro },
    sections: { en: src.sections, zh: zh.sections },
  };
}

export const articles: readonly Article[] = legacyArticles.map((a) => build(a.slug));

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
