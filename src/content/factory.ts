import type { ContentLocale } from "./company";

/**
 * Manufacturing facts reproduced from the verified legacy website copy.
 * Figures are dated claims from the existing site — see the uncertainty list
 * in docs/site-rebuild-plan.md §8 (owner to reconfirm current values).
 */

export const factoryStats: readonly { value: string; label: Record<ContentLocale, string> }[] = [
  { value: "30,000 m²", label: { en: "Production site", zh: "生产基地" } },
  { value: "120,000", label: { en: "Spindles", zh: "纺锭规模" } },
  { value: "8,000+ t", label: { en: "Annual PVA capacity", zh: "PVA 年产能力" } },
  { value: "300+", label: { en: "Employees", zh: "员工" } },
  { value: "50+", label: { en: "Specifications", zh: "产品规格" } },
  { value: "2006", label: { en: "Established", zh: "成立年份" } },
];

export const factoryEquipment: readonly {
  image: string;
  name: Record<ContentLocale, string>;
  step: string;
  /** Named machine brands as listed in official company filings. */
  brand?: Record<ContentLocale, string>;
}[] = [
  { image: "/images/factory-live/blow-room.webp", step: "01", name: { en: "Blow room", zh: "清花设备" } },
  { image: "/images/factory-live/blowing-carding.webp", step: "02", name: { en: "Blowing-carding", zh: "清梳联系统" } },
  {
    image: "/images/factory-live/drawing.webp",
    step: "03",
    name: { en: "Drawing", zh: "并条工序" },
    brand: { en: "Rieter drawing frames (Switzerland)", zh: "瑞士立达并条机" },
  },
  { image: "/images/factory-live/speed-frame.webp", step: "04", name: { en: "Speed frame", zh: "粗纱工序" } },
  { image: "/images/factory-live/ring-spinning.webp", step: "05", name: { en: "Ring spinning", zh: "环锭细纱" } },
  {
    image: "/images/factory-live/automatic-winding.webp",
    step: "06",
    name: { en: "Automatic winding", zh: "自动络筒" },
    brand: { en: "Schlafhorst (Germany) & Savio (Italy) autoconers", zh: "德国赐来福 · 意大利萨维奥自动络筒机" },
  },
];

/** Spinning flow described in legacy copy, ordered as the equipment above. */
export const processFlow: readonly { title: Record<ContentLocale, string>; body: Record<ContentLocale, string> }[] = [
  {
    title: { en: "Fiber opening & cleaning", zh: "开清棉" },
    body: {
      en: "Raw PVA material is opened and cleaned in the blow room to prepare an even feed for the line.",
      zh: "原料 PVA 在清花工序中开松、除杂，为生产线提供均匀喂入。",
    },
  },
  {
    title: { en: "Carding", zh: "梳棉" },
    body: {
      en: "The blowing-carding system forms a uniform web and sliver, controlling fiber orientation from the start.",
      zh: "清梳联系统形成均匀的纤维网与棉条，从一开始控制纤维取向。",
    },
  },
  {
    title: { en: "Drawing", zh: "并条" },
    body: {
      en: "Drawing passes blend and parallelize the slivers to stabilize count and evenness.",
      zh: "并条工序将棉条混合、平行化，稳定支数与条干均匀度。",
    },
  },
  {
    title: { en: "Speed framing", zh: "粗纱" },
    body: {
      en: "The speed frame adds controlled twist and drafts the sliver into roving ready for fine spinning.",
      zh: "粗纱工序施加受控捻度，将棉条牵伸为可供细纱的粗纱。",
    },
  },
  {
    title: { en: "Ring spinning", zh: "环锭纺纱" },
    body: {
      en: "Ring spinning frames draw and twist the roving into the target count with the required strength profile.",
      zh: "环锭细纱机将粗纱牵伸加捻至目标支数，并达到所需的强度水平。",
    },
  },
  {
    title: { en: "Automatic winding", zh: "自动络筒" },
    body: {
      en: "Automatic winders clear, splices and package the yarn into consistent cones prepared for inspection and shipment.",
      zh: "自动络筒机对纱线进行清纱、捻接并卷绕成一致的筒子，为检验和发运做准备。",
    },
  },
];

export const manufacturingIntro: Record<ContentLocale, { title: string; body: string; note: string }> = {
  en: {
    title: "A complete in-house spinning route for water-soluble PVA",
    body: "Our production route integrates automatic winding, ring spinning, speed frames, blow room, blowing-carding and drawing equipment to support consistent, traceable manufacturing across counts and dissolution grades.",
    note: "From 20°C low-temperature dissolution to 90°C grades, from yarn count and package length to fiber fineness and cut length, the format is matched to the intended process.",
  },
  zh: {
    title: "覆盖完整纺纱流程的 PVA 水溶产品制造",
    body: "生产体系覆盖自动络筒、环锭纺、粗纱、清花、清梳联和并条等关键环节，为不同支数和水溶温度产品提供稳定、可追溯的制造基础。",
    note: "从 20°C 低温水溶到 90°C 高温水溶，从纱线支数、卷装长度到纤维细度与切断长度，我们根据最终工艺条件匹配产品。",
  },
};
