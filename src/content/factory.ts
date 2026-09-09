import type { Locale } from "./company";

/**
 * Manufacturing facts reproduced from the verified legacy website copy.
 * Figures are dated claims from the existing site — see the uncertainty list
 * in docs/site-rebuild-plan.md §8 (owner to reconfirm current values).
 */

export const factoryStats: readonly { value: string; label: Record<Locale, string> }[] = [
  { value: "30,000 m²", label: { en: "Production site", es: "Base de producción", de: "Produktionsstandort",zh: "生产基地" } },
  { value: "120,000", label: { en: "Spindles", es: "Husos", de: "Spindeln",zh: "纺锭规模" } },
  { value: "8,000+ t", label: { en: "Annual PVA capacity", es: "Capacidad anual de PVA", de: "Jährliche PVA-Kapazität",zh: "PVA 年产能力" } },
  { value: "300+", label: { en: "Employees", es: "Empleados", de: "Mitarbeitende",zh: "员工" } },
  { value: "50+", label: { en: "Specifications", es: "Especificaciones", de: "Spezifikationen",zh: "产品规格" } },
  { value: "2006", label: { en: "Established", es: "Fundación", de: "Gründungsjahr",zh: "成立年份" } },
];

export const factoryEquipment: readonly {
  image: string;
  name: Record<Locale, string>;
  step: string;
  /** Named machine brands as listed in official company filings. */
  brand?: Record<Locale, string>;
}[] = [
  { image: "/images/factory-live/blow-room.webp", step: "01", name: { en: "Blow room", es: "Sala de apertura", de: "Fasersaal",zh: "清花设备" } },
  { image: "/images/factory-live/blowing-carding.webp", step: "02", name: { en: "Blowing-carding", es: "Abertura y carda", de: "Krempel-Kombination",zh: "清梳联系统" } },
  {
    image: "/images/factory-live/drawing.webp",
    step: "03",
    name: { en: "Drawing", es: "Estiraje", de: "Ausstrecke",zh: "并条工序" },
    brand: { en: "Rieter drawing frames (Switzerland)", es: "Batidoras Rieter (Suiza)", de: "Rieter-Ausstreckstellen (Schweiz)",zh: "瑞士立达并条机" },
  },
  { image: "/images/factory-live/speed-frame.webp", step: "04", name: { en: "Speed frame", es: "Batería", de: "Vorwerk",zh: "粗纱工序" } },
  { image: "/images/factory-live/ring-spinning.webp", step: "05", name: { en: "Ring spinning", es: "Hilatura de anillos", de: "Ringenspinnen",zh: "环锭细纱" } },
  {
    image: "/images/factory-live/automatic-winding.webp",
    step: "06",
    name: { en: "Automatic winding", es: "Bobinado automático", de: "Automatische Umspulung",zh: "自动络筒" },
    brand: { en: "Schlafhorst (Germany) & Savio (Italy) autoconers", es: "Hilanderas automáticas Schlafhorst (Alemania) y Savio (Italia)", de: "Automatikspulmaschinen Schlafhorst (Deutschland) und Savio (Italien)",zh: "德国赐来福 · 意大利萨维奥自动络筒机" },
  },
];

/** Spinning flow described in legacy copy, ordered as the equipment above. */
export const processFlow: readonly { title: Record<Locale, string>; body: Record<Locale, string> }[] = [
  {
    title: { en: "Fiber opening & cleaning", es: "Apertura y limpieza de fibras", de: "Faseröffnung und Reinigung",zh: "开清棉" },
    body: {
      en: "Raw PVA material is opened and cleaned in the blow room to prepare an even feed for the line.",es: "El material de PVA en bruto se abre y se limpia en la sala de apertura para preparar una alimentación uniforme de la línea.",de: "Das Roh-PVA-Material wird im Fasersaal geöffnet und gereinigt, um eine gleichmäßige Zufuhr für die Linie vorzubereiten.",
      zh: "原料 PVA 在清花工序中开松、除杂，为生产线提供均匀喂入。",
    },
  },
  {
    title: { en: "Carding", es: "Cardado", de: "Krempeln",zh: "梳棉" },
    body: {
      en: "The blowing-carding system forms a uniform web and sliver, controlling fiber orientation from the start.",es: "El sistema de abertura y carda forma una manta y una cinta uniformes, y controla la orientación de la fibra desde el inicio.",de: "Die Krempel-Kombination erzeugt eine gleichmäßige Faserbahn und das Wickelband und steuert die Faserorientierung von Anfang an.",
      zh: "清梳联系统形成均匀的纤维网与棉条，从一开始控制纤维取向。",
    },
  },
  {
    title: { en: "Drawing", es: "Estiraje", de: "Ausstrecke",zh: "并条" },
    body: {
      en: "Drawing passes blend and parallelize the slivers to stabilize count and evenness.",es: "Las pasadas de estiraje mezclan y paralelizan las cintas para estabilizar el título y la regularidad.",de: "Die Ausstreckzüge mischen und parallelisieren die Bänder, um Feinnummer und Gleichmäßigkeit zu stabilisieren.",
      zh: "并条工序将棉条混合、平行化，稳定支数与条干均匀度。",
    },
  },
  {
    title: { en: "Speed framing", es: "Preparación de mecha en batería", de: "Vorwerkspinnen",zh: "粗纱" },
    body: {
      en: "The speed frame adds controlled twist and drafts the sliver into roving ready for fine spinning.",es: "La batería aporta un torsionado controlado y estira la cinta hasta convertirla en mecha lista para el hilado fino.",de: "Das Vorwerk bringt eine kontrollierte Drillung ein und streckt das Band zu Vorgarn für das Feinspinnen.",
      zh: "粗纱工序施加受控捻度，将棉条牵伸为可供细纱的粗纱。",
    },
  },
  {
    title: { en: "Ring spinning", es: "Hilatura de anillos", de: "Ringenspinnen",zh: "环锭纺纱" },
    body: {
      en: "Ring spinning frames draw and twist the roving into the target count with the required strength profile.",es: "Las hilanderas de anillos estiran y torsionan la mecha hasta el título objetivo con el perfil de resistencia requerido.",de: "Ringspinnmaschinen strecken und drillen das Vorgarn auf die Ziel-Feinnummer mit dem geforderten Festigkeitsprofil.",
      zh: "环锭细纱机将粗纱牵伸加捻至目标支数，并达到所需的强度水平。",
    },
  },
  {
    title: { en: "Automatic winding", es: "Bobinado automático", de: "Automatische Umspulung",zh: "自动络筒" },
    body: {
      en: "Automatic winders clear, splices and package the yarn into consistent cones prepared for inspection and shipment.",es: "Las bobinadoras automáticas limpian, empalman y envasan el hilo en conos consistentes, preparados para la inspección y el envío.",de: "Automatische Spulmaschinen reinigen, verbinden und verpacken das Garn zu gleichmäßigen Kreuzspulen, bereit für Prüfung und Versand.",
      zh: "自动络筒机对纱线进行清纱、捻接并卷绕成一致的筒子，为检验和发运做准备。",
    },
  },
];

export const manufacturingIntro: Record<Locale, { title: string; body: string; note: string }> = {
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
  es: {
    title: "Una ruta de hilatura completa e interna para PVA hidrosoluble",
    body: "Nuestra ruta de producción integra el bobinado automático, la hilatura de anillos, las baterías, la sala de apertura, la abertura con carda y el estiraje, para sostener una fabricación consistente y trazable en todos los títulos y grados de disolución.",
    note: "Desde la disolución a baja temperatura de 20 °C hasta los grados de 90 °C, y desde el título del hilo y la longitud del envase hasta la finura de la fibra y la longitud de corte, el formato se adapta al proceso previsto.",
  },
  de: {
    title: "Eine vollständige, hauseigene Spinnroute für wasserlösliches PVA",
    body: "Unsere Produktionsroute integriert automatische Umspulung, Ringenspinnen, Vorwerke, Fasersaal, Krempel-Kombination und Ausstrecke, um eine konsistente, nachvollziehbare Herstellung über alle Feinnummern und Auflösungsstufen zu tragen.",
    note: "Von der Niedertemperaturauflösung bei 20 °C bis zu den 90 °C-Sorten, von Garnfeinnummer und Spulenlänge bis zu Faserfeinheit und Schnittlänge — das Format wird auf den vorgesehenen Prozess abgestimmt.",
  },
};
