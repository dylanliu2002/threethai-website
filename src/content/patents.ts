import type { ContentLocale } from "./company";

/**
 * Patent portfolio — transcribed from the company's patent dossier
 * (certificate scans + CNIPA register extracts + transfer notices,
 * reviewed Aug 2026). English titles are working translations of the
 * registered Chinese titles; Chinese titles are authoritative.
 *
 * Ownership note: patents marked "joint" are co-owned with
 * 山东惠民三泰纺织有限公司 (Shandong Huimin Santai Textile Co., Ltd.),
 * a related company at the same registered address.
 *
 * Pending applications (e.g. 202411066795.6, antibacterial composite
 * fabric) are NOT counted here — only granted patents are listed.
 */

export type Ownership = "sole" | "joint";

export type InventionPatent = {
  number: string;
  publication?: string;
  titleZh: string;
  titleEn: string;
  filed: string;
  granted: string;
  ownership: Ownership;
};

export type UtilityPatent = {
  number: string;
  publication: string;
  titleZh: string;
  titleEn: string;
  granted: string;
};

export type ForeignPatent = {
  country: Record<ContentLocale, string>;
  flag: string;
  number: string;
  titleEn: string;
  titleZh: string;
  priority: string;
  dateLabel: Record<ContentLocale, string>;
  dateValue: Record<ContentLocale, string>;
  pdf: string;
  image: string;
};

export const inventionPatents: readonly InventionPatent[] = [
  {
    number: "ZL 2021 1 1485226.1",
    publication: "CN 114182457 B",
    titleZh: "一种基于物联网的可分布均匀式纱线整理机",
    titleEn: "IoT-based yarn finishing machine with uniform distribution",
    filed: "2021-12-07",
    granted: "2023-12-19",
    ownership: "sole",
  },
  {
    number: "ZL 2023 1 1515068.9",
    publication: "CN 117367975 B",
    titleZh: "一种水溶性维纶纱弹性测试装置",
    titleEn: "Elasticity testing device for water-soluble vinylon yarn",
    filed: "2023-11-14",
    granted: "2024-03-15",
    ownership: "sole",
  },
  {
    number: "ZL 2024 1 1912256.X",
    publication: "CN 119663498 B",
    titleZh: "一种牦牛绒和水溶纤维的混纺纱线的制备工艺",
    titleEn: "Preparation process for yak-cashmere / water-soluble-fiber blended yarn",
    filed: "2024-12-24",
    granted: "2025-06-20",
    ownership: "sole",
  },
  {
    number: "ZL 2022 1 0286031.2",
    publication: "CN 114633987 B",
    titleZh: "一种智能纺织用的管纱输送卷绕筒除尘装置",
    titleEn: "Dust-removal device for cop conveying and winding in intelligent textile production",
    filed: "2022-03-22",
    granted: "2023-12-15",
    ownership: "joint",
  },
  {
    number: "ZL 2023 1 0531858.X",
    publication: "CN 116240638 B",
    titleZh: "一种化纤生产用纺丝自动干燥装置",
    titleEn: "Automatic spinning-drying device for chemical fiber production",
    filed: "2023-05-12",
    granted: "2023-08-25",
    ownership: "joint",
  },
  {
    number: "ZL 2017 1 1466277.3",
    titleZh: "纺织用系统及其使用方法",
    titleEn: "Textile system and its usage method",
    filed: "2017-12-28",
    granted: "2019-05-10",
    ownership: "joint",
  },
  {
    number: "ZL 2020 1 0227142.7",
    titleZh: "一种全面型毛细渗透式纱线上蜡工艺",
    titleEn: "Capillary-penetration yarn waxing process",
    filed: "2020",
    granted: "2025*",
    ownership: "joint",
  },
  {
    number: "ZL 2020 1 0365670.9",
    publication: "CN 111536146 B",
    titleZh: "一种拆装便捷的纺织胶辊",
    titleEn: "Easy-to-dismantle textile rubber roller",
    filed: "2020-04-30",
    granted: "2025-04-11",
    ownership: "joint",
  },
  {
    number: "ZL 2020 1 1350928.4",
    publication: "CN 112551264 B",
    titleZh: "一种具有自净功能的纺纱纱筒支架",
    titleEn: "Self-cleaning bobbin bracket for spinning frames",
    filed: "2020-11-27",
    granted: "2023-05-26",
    ownership: "joint",
  },
];

export const foreignPatents: readonly ForeignPatent[] = [
  {
    country: { en: "Nigeria", zh: "尼日利亚" },
    flag: "NG",
    number: "RP: F/PT/C/O/2026/21316",
    titleEn: "Broken-end detection and automatic feed-stopping device for spinning frames",
    titleZh: "纺纱机断头检测与自动停车喂料装置",
    priority: "CN 20251132549.7 · 2025-09-16",
    dateLabel: { en: "Patent date", zh: "授权日" },
    dateValue: { en: "Feb 9, 2026", zh: "2026 年 2 月 9 日" },
    pdf: "/documents/patent-certificate-nigeria-2026.pdf",
    image: "/images/certificates/patent-nigeria.jpg",
  },
  {
    country: { en: "Malta", zh: "马耳他" },
    flag: "MT",
    number: "No. 5964",
    titleEn: "Dust purification device for water-soluble yarn processing",
    titleZh: "水溶性纱线加工除尘净化装置",
    priority: "CN 2025109190368 · 2025-07-03",
    dateLabel: { en: "Registered", zh: "注册日" },
    dateValue: { en: "Apr 20, 2026", zh: "2026 年 4 月 20 日" },
    pdf: "/documents/patent-certificate-malta-2026.pdf",
    image: "/images/certificates/patent-malta.jpg",
  },
];

export const utilityPatents: readonly UtilityPatent[] = [
  { number: "ZL 2019 2 0067840.8", publication: "CN 209619548 U", titleZh: "一种水溶性PVA/棉混纺纤维型波形线", titleEn: "Water-soluble PVA/cotton blended wave-shaped thread", granted: "2019-11-12" },
  { number: "ZL 2020 2 1051878.5", publication: "CN 212334209 U", titleZh: "一种具有良好导湿性能的空心纱", titleEn: "Hollow yarn with good moisture conductivity", granted: "2021-01-12" },
  { number: "ZL 2020 2 1828339.8", publication: "CN 213476216 U", titleZh: "一种保暖吸湿中空纱", titleEn: "Warm, moisture-absorbing hollow yarn", granted: "2021-06-18" },
  { number: "ZL 2020 2 1828402.8", publication: "CN 213480448 U", titleZh: "一种适用于水溶纱生产的车间空调系统", titleEn: "Workshop air-conditioning system for water-soluble yarn production", granted: "2021-06-18" },
  { number: "ZL 2020 2 1834975.1", publication: "CN 213476203 U", titleZh: "一种变频细纱机", titleEn: "Variable-frequency ring spinning frame", granted: "2021-06-18" },
  { number: "ZL 2021 2 0206765.6", publication: "CN 214271137 U", titleZh: "一种水溶纱和毛油添加装置", titleEn: "Wool-oil dosing device for water-soluble yarn", granted: "2021-09-24" },
  { number: "ZL 2021 2 0206782.X", publication: "CN 214300715 U", titleZh: "一种水溶纱蒸纱装置", titleEn: "Yarn steaming device for water-soluble yarn", granted: "2021-09-28" },
  { number: "ZL 2021 2 0206784.9", publication: "CN 214300723 U", titleZh: "一种空心纱退绕装置", titleEn: "Hollow-yarn unwinding device", granted: "2021-09-28" },
  { number: "ZL 2021 2 0221226.X", publication: "CN 214300496 U", titleZh: "一种水溶性维纶开清装置", titleEn: "Opening & cleaning device for water-soluble vinylon", granted: "2021-09-28" },
  { number: "ZL 2021 2 0221227.4", publication: "CN 214268703 U", titleZh: "一种成品水溶纱放置架", titleEn: "Storage rack for finished water-soluble yarn", granted: "2021-09-24" },
  { number: "ZL 2022 2 0232653.2", publication: "CN 217298121 U", titleZh: "防止异纤混入的水溶纱原料隔离间", titleEn: "Foreign-fiber isolation room for water-soluble yarn raw material", granted: "2022-08-26" },
  { number: "ZL 2022 2 0232654.7", publication: "CN 217191455 U", titleZh: "水溶纱回花容器高效清理机", titleEn: "High-efficiency cleaning machine for water-soluble yarn waste containers", granted: "2022-08-16" },
  { number: "ZL 2022 2 0233201.6", publication: "CN 217304407 U", titleZh: "水溶纱性能试验用智能取样器", titleEn: "Intelligent sampler for water-soluble yarn testing", granted: "2022-08-26" },
  { number: "ZL 2022 2 1611143.2", publication: "CN 217499531 U", titleZh: "一种开清棉机用除杂装置", titleEn: "Impurity-removal device for opening & cleaning machines", granted: "2022-09-27" },
  { number: "ZL 2022 2 2939030.1", publication: "CN 218403161 U", titleZh: "平行纺水溶性维纶包芯柔体纱生产装置", titleEn: "Production device for parallel-spun water-soluble vinylon core yarn", granted: "2023-01-31" },
  { number: "ZL 2022 2 2944642.X", publication: "CN 218860999 U", titleZh: "高支数维纶PVA水溶纱线加工设备", titleEn: "Processing equipment for high-count vinylon PVA water-soluble yarn", granted: "2023-04-14" },
  { number: "ZL 2022 2 2949209.5", publication: "CN 218711120 U", titleZh: "水溶性维纶纱纺制中空纱的纺纱装置", titleEn: "Spinning device for hollow yarn from water-soluble vinylon", granted: "2023-03-24" },
  { number: "ZL 2022 2 2968610.3", publication: "CN 218520715 U", titleZh: "一种采用水溶纱制造的镂空单面针织面料的生产装置", titleEn: "Production device for openwork single-jersey knitted fabric using water-soluble yarn", granted: "2023-02-24" },
  { number: "ZL 2022 2 3009630.4", publication: "CN 218812588 U", titleZh: "一种纺织设备用可均匀染色的纱线染色装置", titleEn: "Even-dyeing yarn dyeing device for textile equipment", granted: "2023-04-07" },
  { number: "ZL 2022 2 3032543.0", publication: "CN 219218505 U", titleZh: "一种基于纺织的具有除尘功能的纺织品吸尘装置", titleEn: "Dust-suction device for textiles", granted: "2023-06-20" },
  { number: "ZL 2022 2 3080759.4", publication: "CN 218629045 U", titleZh: "一种水溶纱性能试验用取样器", titleEn: "Sampler for water-soluble yarn performance testing", granted: "2023-03-14" },
  { number: "ZL 2022 2 3259047.9", publication: "CN 218812349 U", titleZh: "一种用于水溶纱线的并条机换筒保护装置", titleEn: "Can-change protection device for drawing frames handling water-soluble yarn", granted: "2023-04-07" },
  { number: "ZL 2022 2 3295072.2", publication: "CN 218621168 U", titleZh: "用于水溶纱纺织的吸落棉装置", titleEn: "Waste-suction device for water-soluble yarn spinning", granted: "2023-03-14" },
  { number: "ZL 2022 2 3338114.6", publication: "CN 218909409 U", titleZh: "一种用于水溶纱线的双纱自动络筒机", titleEn: "Double-yarn automatic winder for water-soluble yarn", granted: "2023-04-25" },
  { number: "ZL 2024 2 0403546.0", publication: "CN 222412350 U", titleZh: "一种具有除尘功能的布料上浆装置", titleEn: "Dust-removing sizing device for fabric", granted: "2025-01-28" },
];

export const patentStats = {
  inventionCount: inventionPatents.length, // 9
  utilityCount: utilityPatents.length, // 25
  foreignCount: foreignPatents.length, // 2
  totalGranted: inventionPatents.length + utilityPatents.length, // 34 (CN)
};

export const patentIntro: Record<ContentLocale, { title: string; body: string }> = {
  en: {
    title: "Patents behind the process",
    body: "The company holds 34 granted Chinese patents — 9 invention patents and 25 utility models — plus registered patents in Nigeria and Malta. Many cover the specific machinery and test methods used to spin, dye, test and handle water-soluble PVA yarn, which is why process details on this site can be backed by documents rather than marketing copy. Several patents are co-owned with a related company, Shandong Huimin Santai Textile Co., Ltd.; ownership is stated per certificate.",
  },
  zh: {
    title: "工艺背后的专利",
    body: "公司拥有 34 件中国授权专利——9 件发明专利与 25 件实用新型——以及尼日利亚、马耳他授权专利。其中多数专利覆盖水溶性 PVA 纱线的纺纱、染色、检测与运输专用设备和试验方法，这也是本站工艺细节可以提供文件佐证、而非仅凭宣传话术的原因。部分专利与关联公司山东惠民三泰纺织有限公司共有，权属以各证书登记为准。",
  },
};

export const patentDisclaimer: Record<ContentLocale, string> = {
  en: "Titles, numbers and dates are transcribed from patent certificates and CNIPA register documents on file. English titles are working translations; the registered Chinese titles are authoritative. Patent validity is maintained by paying annual fees — request the current register extract for any specific patent before relying on it contractually.",
  zh: "以上名称、编号与日期均转录自现存专利证书及国家知识产权局登记簿副本。英文名称为参考译名，以中文名称为准。专利效力以缴纳年费维持——如需在合同中依赖某件专利，请向我们索取该专利的最新登记簿副本。",
};
