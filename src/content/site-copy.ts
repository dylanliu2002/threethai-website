import type { Locale } from "./company";

/**
 * Localized copy that a route or component reads per locale, without the dictionary.
 *
 * This is deliberately NOT part of `src/content/i18n`'s `Dictionary`. The
 * dictionary travels into the browser: `src/app/[lang]/layout.tsx` passes the
 * whole merged object to `site-header`, `inquiry-form` and `product-finder`, all
 * three `"use client"`, so every key added to `Dictionary` is serialized into the
 * payload of all 222 prerendered documents — measured, not assumed. INTL-DEES-001
 * adds page titles, descriptions and section labels for four languages, and putting
 * them in the dictionary grew an English page by 4,805 bytes and a Chinese page by
 * 4,726 bytes to pay for text no browser ever reads. `tests/intl-dees-003b-*` has a
 * document-size budget precisely because that boundary is easy to cross by accident.
 *
 * So the rule is: **if a client component renders the string, it belongs in the
 * dictionary; if only the server renders it, it belongs here.** `pageMeta` is read
 * exclusively by `generateMetadata`, and every label below is rendered by a server
 * component. The five strings the client forms genuinely need
 * (`form.fields.*`, `form.optional`, `form.errors.*`, `header.tagline`, and the
 * placeholders and option label in `labels`) stayed in `Dictionary`.
 *
 * Values are per `Locale`, like `htmlLang` and `localeLabels`, because none of this
 * is an entity's body copy. Entity prose must stay `{ en, zh }` so `pageCopyFor`
 * can widen it and an evidence record can own it; a page `<title>` has no promotion
 * to describe and no renderer that could mistake it for one.
 */

/**
 * One page's search-result title and description, per language.
 *
 * `suffix` is appended after the page's own separator, which is how the
 * application and answer routes already built their titles.
 */
export type PageMeta = {
  title: string;
  description: string;
  suffix?: string;
};

/** Route key → its metadata in each language. */
/**
 * The product page title as a whole pattern per language, "%s" standing for the
 * product name — rather than a suffix glued onto it. English has no separator
 * (`Water-Soluble PVA Yarn Manufacturer & Supplier`); carried over verbatim into
 * Spanish or German that yields two noun phrases with nothing between them
 * ("Fibra cortada de PVA Fabricante y proveedor"), which is what the first
 * promotion build actually produced. The English string is byte-identical to the
 * concatenation it replaces, so no English title moves.
 */
export const productTitlePattern: Record<Locale, string> = {
  en: "%s Manufacturer & Supplier",
  zh: "%s — 制造商与供应商",
  es: "%s — fabricante y proveedor",
  de: "%s — Hersteller und Anbieter",
};

export const pageMeta: Record<Locale, Record<string, PageMeta>> = {
  en: {
    about: {
      title: "About — Three Thai Textile (山东荣沣纺织有限公司)",
      description:
        "Three Thai Textile (山东荣沣纺织有限公司): a specialist water-soluble PVA manufacturer established in 2006 in Huimin County, Shandong — products, philosophy, positioning and company identity.",
    },
    answers: {
      title: "PVA Yarn Buyer Questions & Technical Answers",
      description:
        "Evidence-led answers to 30 common sourcing questions about water-soluble PVA yarn, sewing thread, staple fiber and filament yarn — supplier selection, testing, MOQ, documents and audits.",
      suffix: "Buyer Answer",
    },
    applications: {
      title: "Applications of Water-Soluble PVA in Textile Manufacturing",
      description:
        "Where water-soluble PVA yarn, thread and fiber are used: towel weaving and zero-twist, embroidery and sewing, knitting, papermaking and technical textiles — with selection guidance.",
      suffix: "Water-Soluble PVA Applications",
    },
    contact: {
      title: "Contact — Three Thai Textile (山东荣沣纺织)",
      description:
        "Contact the Three Thai Textile team in Shandong, China about water-soluble PVA products, specifications, samples, documents and factory audits.",
    },
    knowledge: {
      title: "Technical Resources — PVA Selection, Testing & QC Guides",
      description:
        "Technical articles for PVA buyers: dissolution temperature guide, buyer specification checklist, batch consistency evaluation and staple fiber vs filament selection.",
    },
    manufacturing: {
      title: "Manufacturing — PVA Spinning Base in Shandong, China",
      description:
        "Inside the Three Thai production base: 30,000 m², 120,000 spindles, integrated blow room to automatic winding line producing water-soluble PVA yarn, thread, fiber and filament.",
    },
    productFinder: {
      title: "PVA Product Finder — Select by Form, Application & Dissolution Temperature",
      description:
        "Answer four questions about your process and get a suggested water-soluble PVA product family: yarn, sewing thread, staple fiber or filament — then confirm the grade with a sample.",
    },
    products: {
      title: "Water-Soluble PVA Yarn, Thread, Fiber & Filament | Products",
      description:
        "Explore water-soluble PVA yarn, sewing thread, staple fiber and filament yarn by material form and dissolution temperature from 20°C to 90°C. Batch-level QC, traceable samples.",

    },
    quality: {
      title: "Quality & Certification — ISO 9001, OEKO-TEX Class I, Patents",
      description:
        "Verifiable quality evidence: ISO 9001:2015 certificate (valid to Aug 2029), OEKO-TEX Standard 100 Class I certification for raw-white PVA yarn (valid to Jan 2027), published TESTEX report, and 9 invention patents, 25 utility models plus Nigeria & Malta patents.",
    },
    requestQuote: {
      title: "Request a Quote — Water-Soluble PVA Yarn, Thread & Fiber",
      description:
        "Request a quotation for water-soluble PVA yarn, sewing thread, staple fiber or filament. Share your count, application and target dissolution temperature for a matched specification.",
    },
    requestSample: {
      title: "Request a Sample — Water-Soluble PVA Materials",
      description:
        "Request a traceable PVA sample: yarn, sewing thread, staple fiber or filament. We confirm specification and test method with you before shipping.",
    },
  },
  zh: {
    // Chinese values are the ones the `/zh` static routes already publish, moved
    // here so one file owns each page's metadata per language. The four marked
    // "rendered English" have no Chinese counterpart anywhere on the site today:
    // those routes are served by `/[lang]`, whose literal this was. Translating
    // them is a Chinese-content decision, not an ES/DE one, so they stay verbatim
    // and `/zh` renders exactly what it rendered before.
    about: {
      title: "关于荣沣纺织 — 山东荣沣纺织有限公司",
      description:
        "山东荣沣纺织有限公司：成立于 2006 年的水溶性 PVA 专业制造商，位于山东省惠民县——产品体系、制造理念、业务定位与公司主体。",
    },
    answers: {
      title: "PVA Yarn Buyer Questions & Technical Answers",
      description:
        "Evidence-led answers to 30 common sourcing questions about water-soluble PVA yarn, sewing thread, staple fiber and filament yarn — supplier selection, testing, MOQ, documents and audits.",
      suffix: "Buyer Answer",
    },
    applications: {
      title: "应用领域 — 水溶性 PVA 在纺织制造中的应用",
      description:
        "水溶性 PVA 纱线、缝纫线和纤维的典型应用：毛巾织造与无捻毛巾、刺绣与缝纫、针织、造纸及产业用纺织品——附选型要点。",
      suffix: "水溶性 PVA 应用",
    },
    contact: {
      title: "联系我们 — 山东荣沣纺织有限公司",
      description: "就水溶性 PVA 产品、规格、样品、单证与验厂事宜联系山东荣沣纺织团队。",
    },
    knowledge: {
      title: "Technical Resources — PVA Selection, Testing & QC Guides",
      description:
        "Technical articles for PVA buyers: dissolution temperature guide, buyer specification checklist, batch consistency evaluation and staple fiber vs filament selection.",
    },
    manufacturing: {
      title: "生产制造 — 山东 PVA 专纺生产基地",
      description:
        "走进荣沣生产基地：30,000 平方米、120,000 锭，从清花到自动络筒的完整生产线，制造水溶性 PVA 纱线、缝纫线、短纤和长丝。",
    },
    productFinder: {
      title: "PVA Product Finder — Select by Form, Application & Dissolution Temperature",
      description:
        "Answer four questions about your process and get a suggested water-soluble PVA product family: yarn, sewing thread, staple fiber or filament — then confirm the grade with a sample.",
    },
    products: {
      title: "PVA 产品中心 — 水溶纱、缝纫线、短纤、长丝",
      description:
        "按材料形态与水溶温度（20°C–90°C）浏览水溶性 PVA 纱线、缝纫线、短纤和长丝，均支持批次级质检与样品验证。",

    },
    quality: {
      title: "品质与认证 — ISO 9001 · OEKO-TEX I 类 · 34 项专利",
      description:
        "可查验的质量证据：ISO 9001:2015 证书（有效期至 2029 年 8 月）、OEKO-TEX Standard 100 I 类婴幼儿级认证（有效期至 2027 年 1 月）、TESTEX 检测报告，以及 9 项发明专利、25 项实用新型与尼日利亚、马耳他专利。",
    },
    requestQuote: {
      title: "在线询价 — 水溶性 PVA 纱线、缝纫线与纤维",
      description:
        "提交水溶性 PVA 产品询价：请提供支数、应用场景和目标水溶温度，我们将为您匹配合适规格。",
    },
    requestSample: {
      title: "Request a Sample — Water-Soluble PVA Materials",
      description:
        "Request a traceable PVA sample: yarn, sewing thread, staple fiber or filament. We confirm specification and test method with you before shipping.",
    },
  },
  es: {
    about: {
      title: "Nosotros — Three Thai Textile (山东荣沣纺织有限公司)",
      description:
        "Three Thai Textile (山东荣沣纺织有限公司): fabricante especializado en PVA hidrosoluble fundado en 2006 en el condado de Huimin, Shandong — productos, filosofía, posicionamiento e identidad de la empresa.",
    },
    answers: {
      title: "Preguntas y respuestas técnicas para compradores de hilo PVA",
      description:
        "Respuestas basadas en evidencia a 30 preguntas habituales de abastecimiento sobre hilo de PVA hidrosoluble, hilo de coser, fibra cortada y filamento — selección de proveedor, ensayos, pedido mínimo, documentos y auditorías.",
      suffix: "Respuesta a comprador",
    },
    applications: {
      title: "Aplicaciones del PVA hidrosoluble en la fabricación textil",
      description:
        "Dónde se emplean el hilo, el hilo de coser y la fibra de PVA hidrosoluble: tejeduría de toallas y sin torsión, bordado y confección, punto, fabricación de papel y textiles técnicos — con orientación de selección.",
      suffix: "Aplicaciones de PVA hidrosoluble",
    },
    contact: {
      title: "Contacto — Three Thai Textile (山东荣沣纺织)",
      description:
        "Contacte con el equipo de Three Thai Textile en Shandong, China, sobre productos de PVA hidrosoluble, especificaciones, muestras, documentos y auditorías de fábrica.",
    },
    knowledge: {
      title: "Recursos técnicos — guías de selección, ensayo y control de PVA",
      description:
        "Artículos técnicos para compradores de PVA: guía de temperatura de disolución, lista de verificación de especificaciones, evaluación de consistencia entre lotes y fibra cortada frente a filamento.",
    },
    manufacturing: {
      title: "Fabricación — base de hilatura de PVA en Shandong, China",
      description:
        "Dentro de la base de producción de Three Thai: 30.000 m², 120.000 husos y una línea integrada desde la apertura de fibra hasta el bobinado automático para hilo, hilo de coser, fibra y filamento de PVA hidrosoluble.",
    },
    productFinder: {
      title: "Buscador de productos PVA — por forma, aplicación y temperatura de disolución",
      description:
        "Responda cuatro preguntas sobre su proceso y reciba una familia de productos PVA hidrosoluble sugerida: hilo, hilo de coser, fibra cortada o filamento — y confirme la clase con una muestra.",
    },
    products: {
      title: "Hilo, hilo de coser, fibra y filamento de PVA hidrosoluble | Productos",
      description:
        "Explore el hilo de PVA hidrosoluble, el hilo de coser, la fibra cortada y el filamento por forma de material y temperatura de disolución de 20 °C a 90 °C. Control por lote y muestras trazables.",

    },
    quality: {
      title: "Calidad y certificación — ISO 9001, OEKO-TEX Clase I, patentes",
      description:
        "Evidencia de calidad verificable: certificado ISO 9001:2015 (válido hasta ago 2029), certificación OEKO-TEX Standard 100 Clase I para el hilo de PVA en blanco crudo (válido hasta ene 2027), informe TESTEX publicado, 9 patentes de invención y 25 modelos de utilidad, además de patentes en Nigeria y Malta.",
    },
    requestQuote: {
      title: "Solicitar cotización — hilo, hilo de coser y fibra de PVA hidrosoluble",
      description:
        "Solicite cotización de hilo de PVA hidrosoluble, hilo de coser, fibra cortada o filamento. Indique título, aplicación y temperatura de disolución objetivo para una especificación ajustada.",
    },
    requestSample: {
      title: "Solicitar muestra — materiales de PVA hidrosoluble",
      description:
        "Solicite una muestra trazable de PVA: hilo, hilo de coser, fibra cortada o filamento. Confirmamos especificación y método de ensayo con usted antes del envío.",
    },
  },
  de: {
    about: {
      title: "Über uns — Three Thai Textile (山东荣沣纺织有限公司)",
      description:
        "Three Thai Textile (山东荣沣纺织有限公司): spezialisierter Hersteller wasserlöslicher PVA-Materialien, gegründet 2006 im Kreis Huimin, Shandong — Produkte, Philosophie, Positionierung und Unternehmensidentität.",
    },
    answers: {
      title: "Käuferfragen und Fachantworten zu PVA-Garn",
      description:
        "Belegbasierte Antworten auf 30 übliche Beschaffungsfragen zu wasserlöslichem PVA-Garn, Nähgarn, Stapelfaser und Filament — Lieferantenauswahl, Prüfung, MOQ, Dokumente und Audits.",
      suffix: "Käuferantwort",
    },
    applications: {
      title: "Anwendungen wasserlöslichen PVA in der Textilfertigung",
      description:
        "Wo wasserlösliches PVA-Garn, Nähgarn und Fasern eingesetzt werden: Handtuchweberei und Zero-Twist, Stickerei und Näherei, Strickerei, Papierherstellung und technische Textilien — mit Auswahlhinweisen.",
      suffix: "Anwendungen für wasserlösliches PVA",
    },
    contact: {
      title: "Kontakt — Three Thai Textile (山东荣沣纺织)",
      description:
        "Kontaktieren Sie das Team von Three Thai Textile in Shandong, China zu wasserlöslichen PVA-Produkten, Spezifikationen, Mustern, Dokumenten und Fabrikaudits.",
    },
    knowledge: {
      title: "Fachressourcen — Leitfäden zu PVA-Auswahl, Prüfung und QS",
      description:
        "Fachartikel für PVA-Einkäufer: Leitfaden zur Auflösungstemperatur, Checkliste für Käufer-Spezifikationen, Bewertung der Chargenkonsistenz sowie Stapelfaser im Vergleich zu Filament.",
    },
    manufacturing: {
      title: "Fertigung — PVA-Spinnstandort in Shandong, China",
      description:
        "Im Produktionsstandort von Three Thai: 30.000 m², 120.000 Spindeln und eine integrierte Linie vom Krempelsaal bis zum automatischen Spulen für wasserlösliche PVA-Garne, Nähgarn, Fasern und Filamente.",
    },
    productFinder: {
      title: "PVA-Produktfinder — Auswahl nach Form, Anwendung und Auflösungstemperatur",
      description:
        "Beantworten Sie vier Fragen zu Ihrem Prozess und erhalten Sie eine vorgeschlagene Produktfamilie: Garn, Nähgarn, Stapelfaser oder Filament — bestätigen Sie die Sorte anschließend mit einem Muster.",
    },
    products: {
      title: "Wasserlösliche PVA-Garne, Nähgarn, Faser & Filament | Produkte",
      description:
        "Wasserlösliche PVA-Garne, Nähgarn, Stapelfaser und Filament nach Materialform und Auflösungstemperatur von 20 °C bis 90 °C — Prüfung pro Charge, rückverfolgbare Muster.",

    },
    quality: {
      title: "Qualität & Zertifizierung — ISO 9001, OEKO-TEX Klasse I, Patente",
      description:
        "Überprüfbare Qualitätsnachweise: ISO-9001:2015-Zertifikat (gültig bis Aug 2029), OEKO-TEX-Standard-100-Klasse-I-Zertifizierung für ungebleichtes weißes PVA-Garn (gültig bis Jan 2027), veröffentlichter TESTEX-Bericht sowie 9 Erteilungspatente, 25 Gebrauchsmuster und Patente in Nigeria und Malta.",
    },
    requestQuote: {
      title: "Angebot anfordern — wasserlösliche PVA-Garne, Nähgarn & Faser",
      description:
        "Fordern Sie ein Angebot für wasserlösliches PVA-Garn, Nähgarn, Stapelfaser oder Filament an. Nennen Sie Nummer, Anwendung und Ziel-Auflösungstemperatur für eine passende Spezifikation.",
    },
    requestSample: {
      title: "Muster anfordern — wasserlösliche PVA-Materialien",
      description:
        "Fordern Sie ein rückverfolgbares PVA-Muster an: Garn, Nähgarn, Stapelfaser oder Filament. Wir bestätigen Spezifikation und Prüfverfahren mit Ihnen, bevor etwas versandt wird.",
    },
  },
};

/**
 * Labels INTL-DEES-001 took out of `locale === "zh" ? … : …` expressions in
 * server components. The keys stay in the declaration order of the first locale so
 * a reviewer can read English, Chinese, Spanish and German side by side.
 */

/**
 * The strings a `"use client"` component renders. Measured on this branch:
 * `pageMeta` and `serverLabels` contribute nothing to `.next/static/chunks` (0
 * occurrences of any of their texts), so sharing this module with them is free,
 * while putting these keys in `Dictionary` is not — the three client components
 * take the whole dictionary as a prop and it is serialized into every one of the
 * 222 prerendered documents.
 */
export const clientLabels: Record<Locale, Record<string, string>> = {
  en: {
    headerTagline: "Water-soluble PVA yarn · thread · fiber · filament",
    formLoading: "Loading form…",
    productOtherOption: "Other / extended format",
    destinationPlaceholder: "e.g. India / Türkiye",
    specificationPlaceholder: "e.g. 40S/2 · 1.50 dtex × 38 mm",
    quantityPlaceholder: "sample / pilot / annual",
    homeAriaLabel: "Three Thai Textile home",
    logoAlt: "THREE THAI — PVA yarn/thread/fiber",
    // Landmark names a screen reader announces on every page. They sat in the
    // header as literals, so a Spanish or German reader heard English; the en and
    // zh values are the strings the site announces today, kept byte-for-byte.
    mainNavAriaLabel: "Main",
    mobileNavAriaLabel: "Mobile",
    productOptionYarn: "Water-soluble PVA yarn · PVA 水溶纱",
    productOptionThread: "Water-soluble PVA sewing thread · PVA 水溶缝纫线",
    productOptionStaple: "PVA staple fiber · PVA 短纤",
    productOptionFilament: "PVA filament yarn · PVA 长丝",
  },
  zh: {
    headerTagline: "水溶性 PVA 纱线 · 缝纫线 · 短纤 · 长丝",
    formLoading: "正在加载表单…",
    productOtherOption: "其他 / 扩展形态",
    mainNavAriaLabel: "Main",
    mobileNavAriaLabel: "Mobile",
    destinationPlaceholder: "如：印度／土耳其",
    specificationPlaceholder: "如：40S/2 · 1.50 dtex × 38 mm",
    quantityPlaceholder: "样品／试单／年用量",
    // Kept verbatim: these three are what `/zh` pages render today, and INTL-001
    // adds languages without rewriting the two that already ship. The Chinese
    // product-option labels read as bilingual because that is the live text.
    homeAriaLabel: "Three Thai Textile home",
    logoAlt: "THREE THAI — PVA yarn/thread/fiber",
    productOptionYarn: "Water-soluble PVA yarn · PVA 水溶纱",
    productOptionThread: "Water-soluble PVA sewing thread · PVA 水溶缝纫线",
    productOptionStaple: "PVA staple fiber · PVA 短纤",
    productOptionFilament: "PVA filament yarn · PVA 长丝",
  },
  es: {
    headerTagline: "Hilo de PVA hidrosoluble · hilo de coser · fibra cortada · filamento",
    formLoading: "Cargando el formulario…",
    productOtherOption: "Otro / formato adicional",
    destinationPlaceholder: "p. ej., India / Turquía",
    specificationPlaceholder: "p. ej., 40S/2 · 1,50 dtex × 38 mm",
    quantityPlaceholder: "muestra / prueba / consumo anual",
    homeAriaLabel: "Inicio de Three Thai Textile",
    logoAlt: "THREE THAI — hilo de PVA hidrosoluble, hilo de coser, fibra cortada y filamento",
    productOptionYarn: "Hilo de PVA hidrosoluble",
    productOptionThread: "Hilo de coser de PVA hidrosoluble",
    productOptionStaple: "Fibra cortada de PVA",
    productOptionFilament: "Hilo de filamento de PVA",
    mainNavAriaLabel: "Principal",
    mobileNavAriaLabel: "Navegación móvil",
  },
  de: {
    headerTagline: "Wasserlösliches PVA-Garn · Nähgarn · Stapelfaser · Filament",
    formLoading: "Formular wird geladen…",
    productOtherOption: "Sonstige / erweiterte Form",
    destinationPlaceholder: "z. B. Indien / Türkei",
    specificationPlaceholder: "z. B. 40S/2 · 1,50 dtex × 38 mm",
    quantityPlaceholder: "Muster / Pilotcharge / Jahresmenge",
    homeAriaLabel: "Three Thai Textile — Startseite",
    logoAlt: "THREE THAI — wasserlösliches PVA-Garn, Nähgarn, Stapelfaser, Filament",
    productOptionYarn: "Wasserlösliches PVA-Garn",
    productOptionThread: "Wasserlösliches PVA-Nähgarn",
    productOptionStaple: "PVA-Stapelfaser",
    productOptionFilament: "PVA-Filamentgarn",
    mainNavAriaLabel: "Hauptnavigation",
    mobileNavAriaLabel: "Mobile Navigation",
  },
};
export const serverLabels: Record<Locale, Record<string, string>> = {
  en: {
    temperatureColumn: "Temperature",
    temperatureFootnote:
      "A temperature label is a starting point, not a complete specification — see the dissolution temperature guide before comparing samples.",
    productFamilyEyebrow: "Product family",
    temperatureOptionsTitle: "Dissolution temperature options",
    targetDissolution: "target dissolution",
    requirementToSupplyHeading: "From requirement to repeatable supply",
    addressLabel: "Address",
    legalEntityLabel: "Legal entity",
    aboutHeroImageAlt: "PVA yarn manufactured by Three Thai Textile",
    qualityEvidenceEyebrow: "ISO · OEKO-TEX · SGS · patent documents",
    inventionPatentsHeading: "Granted invention patents",
    patentPriorityLabel: "Priority",
    utilityShowAll: "Show all {count} utility model patents",
    utilityPublicationColumn: "Publication",
    utilityTitleColumn: "Title",
    breadcrumbNav: "Breadcrumb",
    patentCertificateAlt: "{country} patent certificate {number}",
    manufacturingHeroImageAlt: "Blowing-carding line at the production base",
    spinningCapabilityHeading: "Complete spinning capability, blow room to winding",
    equipmentImageSuffix: "live production",
    homeManufacturingImageAlt: "Ring spinning frames at the Three Thai Textile production base",
    quoteAssuranceNote:
      "Quotations are prepared against a complete specification — count system, construction, dissolution method, quantity, packing and Incoterm.",
    spinningCapabilityBody: "The production system covers automatic winding, ring spinning, speed frames, blow room, blowing-carding and drawing. Live production imagery below.",
    traceRecordIncoming: "Incoming material identification and batch records",
    traceRecordParameters: "Process parameters recorded at each step",
    traceRecordTesting: "Batch testing and release records",
    traceRecordChangeControl: "Change control with customer notification",
    supplyCapabilityBody: "The company supports customers from sample validation through repeat bulk supply. Specifications, packaging and delivery terms are confirmed per order at contracting.",
    productFamiliesHeading: "Product families",
  },
  zh: {
    temperatureColumn: "温度",
    temperatureFootnote: "温度标签只是起点，不是完整规格——比较样品前请先阅读溶解温度指南。",
    productFamilyEyebrow: "产品系列",
    temperatureOptionsTitle: "水溶温度选择",
    targetDissolution: "目标水溶温度",
    requirementToSupplyHeading: "从需求到批量供应的三步流程",
    addressLabel: "地址",
    legalEntityLabel: "法定主体",
    aboutHeroImageAlt: "threethai™ PVA 纱线",
    qualityEvidenceEyebrow: "ISO · OEKO-TEX · SGS · 专利文件",
    inventionPatentsHeading: "授权发明专利",
    patentPriorityLabel: "优先权",
    utilityShowAll: "展开查看全部 {count} 件实用新型专利",
    utilityPublicationColumn: "授权公告号",
    utilityTitleColumn: "实用新型名称",
    breadcrumbNav: "Breadcrumb",
    patentCertificateAlt: "{country} patent certificate {number}",
    manufacturingHeroImageAlt: "清梳联生产现场",
    spinningCapabilityHeading: "从清梳联到自动络筒的完整纺纱能力",
    equipmentImageSuffix: "生产现场",
    homeManufacturingImageAlt: "荣沣纺织生产基地的环锭纺细纱机",
    quoteAssuranceNote: "报价以完整规格为依据——支数体系、结构、溶解方法、数量、包装与贸易术语。",
    spinningCapabilityBody: "生产体系覆盖自动络筒、环锭纺、粗纱、清花、清梳联和并条等关键环节。以下为生产现场影像。",
    traceRecordIncoming: "原料入厂与批次标识",
    traceRecordParameters: "各工序工艺参数记录",
    traceRecordTesting: "批次检测与放行记录",
    traceRecordChangeControl: "变更控制与客户通知",
    supplyCapabilityBody: "公司支持从样品验证到批量交付的完整流程。规格、包装与交期安排在签约时逐项确认。",
    productFamiliesHeading: "产品家族",
  },
  es: {
    temperatureColumn: "Temperatura",
    temperatureFootnote:
      "La temperatura es un punto de partida, no una especificación completa: consulte la guía de temperatura de disolución antes de comparar muestras.",
    productFamilyEyebrow: "Familia de productos",
    temperatureOptionsTitle: "Opciones de temperatura de disolución",
    targetDissolution: "disolución objetivo",
    requirementToSupplyHeading: "Del requisito al suministro repetible",
    addressLabel: "Dirección",
    legalEntityLabel: "Persona jurídica",
    aboutHeroImageAlt: "Hilo de PVA fabricado por Three Thai Textile",
    qualityEvidenceEyebrow: "ISO · OEKO-TEX · SGS · documentos de patentes",
    inventionPatentsHeading: "Patentes de invención concedidas",
    patentPriorityLabel: "Prioridad",
    utilityShowAll: "Ver los {count} modelos de utilidad concedidos",
    utilityPublicationColumn: "Publicación",
    utilityTitleColumn: "Denominación",
    breadcrumbNav: "Ruta de navegación",
    patentCertificateAlt: "Certificado de patente de {country} — {number}",
    manufacturingHeroImageAlt: "Línea de cardado en la base de producción",
    spinningCapabilityHeading: "Capacidad de hilatura completa, de la apertura de fibra al bobinado",
    equipmentImageSuffix: "producción en directo",
    homeManufacturingImageAlt: "Hilanderas de anillos en la base de producción de Three Thai Textile",
    quoteAssuranceNote:
      "Las cotizaciones se preparan sobre una especificación completa: sistema de títulos, construcción, método de disolución, cantidad, embalaje e Incoterm.",
    spinningCapabilityBody: "El sistema de producción abarca el bobinado automático, la hilatura de anillos, las baterías, la sala de apertura, la abertura con carda y el estiraje. Más abajo hay imágenes de producción en directo.",
    traceRecordIncoming: "Identificación de materia prima entrante y registros de lote",
    traceRecordParameters: "Parámetros de proceso registrados en cada etapa",
    traceRecordTesting: "Registros de ensayo y liberación por lote",
    traceRecordChangeControl: "Control de cambios con notificación al cliente",
    supplyCapabilityBody: "La empresa acompaña al cliente desde la validación de la muestra hasta el suministro repetido en volumen. Las especificaciones, el embalaje y las condiciones de entrega se confirman pedido a pedido en el momento del contrato.",
    productFamiliesHeading: "Familias de productos",
  },
  de: {
    temperatureColumn: "Temperatur",
    temperatureFootnote:
      "Die Temperatur ist ein Ausgangspunkt, keine vollständige Spezifikation — lesen Sie den Leitfaden zur Auflösungstemperatur, bevor Sie Muster vergleichen.",
    productFamilyEyebrow: "Produktfamilie",
    temperatureOptionsTitle: "Optionen der Auflösungstemperatur",
    targetDissolution: "Ziel-Auflösung",
    requirementToSupplyHeading: "Von der Anforderung zur wiederholbaren Lieferung",
    addressLabel: "Anschrift",
    legalEntityLabel: "Rechtseinheit",
    aboutHeroImageAlt: "PVA-Garn von Three Thai Textile",
    qualityEvidenceEyebrow: "ISO · OEKO-TEX · SGS · Patentunterlagen",
    inventionPatentsHeading: "Erteilte Erfindungspatente",
    patentPriorityLabel: "Priorität",
    utilityShowAll: "Alle {count} erteilten Gebrauchsmuster anzeigen",
    utilityPublicationColumn: "Bekanntmachung",
    utilityTitleColumn: "Bezeichnung",
    breadcrumbNav: "Brotkrümelnavigation",
    patentCertificateAlt: "Patenturkunde {country} — {number}",
    manufacturingHeroImageAlt: "Krempel-Kombination am Produktionsstandort",
    spinningCapabilityHeading: "Vollständige Spinnkapazität, vom Krempelsaal bis zum Spulen",
    equipmentImageSuffix: "laufende Produktion",
    homeManufacturingImageAlt: "Ringsspinnmaschinen am Produktionsstandort von Three Thai Textile",
    quoteAssuranceNote:
      "Angebote werden auf Basis einer vollständigen Spezifikation erstellt — Nummernsystem, Konstruktion, Auflösungsverfahren, Menge, Verpackung und Incoterm.",
    spinningCapabilityBody: "Das Produktionssystem umfasst automatische Umspulung, Ringenspinnen, Vorwerke, Fasersaal, Krempel-Kombination und Ausstrecke. Weiter unten folgen Aufnahmen aus der laufenden Produktion.",
    traceRecordIncoming: "Eingangsmaterial-Identifikation und Chargenaufzeichnungen",
    traceRecordParameters: "Prozessparameter je Schritt dokumentiert",
    traceRecordTesting: "Chargenprüfung und Freigabeaufzeichnungen",
    traceRecordChangeControl: "Änderungskontrolle mit Kundeninformation",
    supplyCapabilityBody: "Das Unternehmen begleitet Kunden von der Mustervalidierung bis zur wiederholten Belieferung in Produktionsmenge. Spezifikationen, Verpackung und Lieferbedingungen werden bei jedem Auftrag beim Vertragsabschluss bestätigt.",
    productFamiliesHeading: "Produktfamilien",
  },
};
