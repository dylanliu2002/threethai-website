import type { ContentLocale } from "./company";

/**
 * Application pages. Every claim is composed from verified legacy-site content
 * (product copy, buyer answers, technical articles). No new business facts.
 */

export type Application = {
  slug: string;
  name: Record<ContentLocale, string>;
  summary: Record<ContentLocale, string>;
  image: string;
  imageAlt: Record<ContentLocale, string>;
  /** The production problem the customer is solving. */
  problem: Record<ContentLocale, { heading: string; body: string }>;
  /** Where PVA sits in the customer's process. */
  whereUsed: Record<ContentLocale, { heading: string; body: string }>;
  /** Why a temporary material is required. */
  whyTemporary: Record<ContentLocale, { heading: string; body: string }>;
  /** Selection variables to align before sampling. */
  selectionVariables: Record<ContentLocale, readonly string[]>;
  /** What to test and how. */
  testing: Record<ContentLocale, { heading: string; body: string }>;
  productSlugs: readonly string[];
};

export const applications: readonly Application[] = [
  {
    slug: "towel-weaving",
    name: { en: "Towel weaving & zero-twist", zh: "毛巾织造与无捻毛巾" },
    summary: {
      en: "Temporary PVA yarn supports pile and zero-twist constructions during weaving, then removes completely in finishing so the towel keeps its loft and absorbency.",
      zh: "PVA 临时纱在织造过程中支撑绒头与无捻结构，在后整理中完全去除，保持毛巾的蓬松度和吸水性。",
    },
    image: "/images/pva-yarn.jpg",
    imageAlt: {
      en: "Water-soluble PVA yarn used as temporary support in towel weaving",
      zh: "用作毛巾织造临时支撑的水溶性 PVA 纱线",
    },
    problem: {
      en: {
        heading: "The production problem",
        body: "Zero-twist and low-twist towels cannot hold their pile yarns on the loom without support. Weaving an unsupported construction breaks yarns, damages fabric face and slows the loom, yet any permanent support yarn would stiffen the towel and reduce absorbency.",
      },
      zh: {
        heading: "生产痛点",
        body: "无捻和低捻毛巾若无支撑，绒头纱无法在织机上稳定织造。缺乏支撑会导致断纱、布面损伤和织机效率下降，而任何永久性支撑纱都会使毛巾发硬并降低吸水性。",
      },
    },
    whereUsed: {
      en: {
        heading: "Where PVA sits in the process",
        body: "Water-soluble PVA yarn is wound and woven together with the pile or ground yarn as a temporary supporting element. It carries tension through weaving, terry formation and wet processing, and is then dissolved in the finishing bath, leaving only the cotton construction.",
      },
      zh: {
        heading: "PVA 在工艺中的位置",
        body: "水溶性 PVA 纱与绒头纱或地纱一起整经、织造，作为临时支撑元件。它在织造、毛圈形成和湿加工过程中承担张力，随后在整理水浴中溶解，最终只保留棉的结构。",
      },
    },
    whyTemporary: {
      en: {
        heading: "Why a temporary material",
        body: "The support function must exist only until the towel structure is stable. After finishing, residual support material would harm hand feel, loft and water uptake, so the yarn must leave the fabric cleanly under conditions the cotton can tolerate.",
      },
      zh: {
        heading: "为什么需要临时材料",
        body: "支撑功能只需存在到毛巾结构稳定为止。整理后若残留支撑材料会损害手感、蓬松度和吸水性，因此纱线必须在棉纤维可承受的条件下干净地离开织物。",
      },
    },
    selectionVariables: {
      en: [
        "Supporting-yarn count relative to the cotton pile yarn",
        "Weaving tension and fabric construction density",
        "Water temperature, time and agitation available in finishing",
        "Required endpoint: strength loss or complete removal",
        "Acceptance criteria for residual PVA, loft and absorbency after washing",
      ],
      zh: [
        "与棉绒头纱匹配的支撑纱支数",
        "织造张力与织物结构密度",
        "后整理可用的水温、时间和搅动条件",
        "所需终点：强度丧失或完全去除",
        "水洗后残余 PVA、蓬松度和吸水性的验收标准",
      ],
    },
    testing: {
      en: {
        heading: "Testing considerations",
        body: "Trial the densest towel construction with the actual finishing recipe before approving a grade. Evaluate residual material, loft, absorbency, handle and dimensional stability after removal, and record the bath conditions that produced the approved result.",
      },
      zh: {
        heading: "测试要点",
        body: "在确认规格前，应使用实际后整理配方对最致密的毛巾结构进行试验。评估去除后的残余材料、蓬松度、吸水性、手感和尺寸稳定性，并记录产生合格结果的浴液条件。",
      },
    },
    productSlugs: ["water-soluble-pva-yarn", "pva-filament-yarn"],
  },
  {
    slug: "embroidery-sewing",
    name: { en: "Embroidery & sewing", zh: "刺绣与缝纫" },
    summary: {
      en: "Water-soluble PVA yarn and sewing thread hold temporary seams, guides and stitched constructions in place, then wash out cleanly without touching the finished article.",
      zh: "水溶性 PVA 纱线和缝纫线可固定临时缝线、引导线和刺绣结构，随后洁净洗除，不损伤成品。",
    },
    image: "/images/pva-thread.jpg",
    imageAlt: {
      en: "Water-soluble PVA sewing thread for temporary stitching",
      zh: "用于临时缝合的水溶性 PVA 缝纫线",
    },
    problem: {
      en: {
        heading: "The production problem",
        body: "Embroidery lace, garment assembly and positioning operations need stitches that hold reliably through production but must not remain in the finished article. Breaking threads stop machines; permanent threads require manual removal that damages the product.",
      },
      zh: {
        heading: "生产痛点",
        body: "刺绣花边、服装组装和定位工序需要在生产中稳定可靠的缝线，但缝线不能留在成品上。断线会停机，永久缝线则需要人工拆除并损伤产品。",
      },
    },
    whereUsed: {
      en: {
        heading: "Where PVA sits in the process",
        body: "PVA sewing thread forms the temporary seam itself, while water-soluble yarn can act as a guide or supporting element in embroidery and lace constructions. Both remain in place through stitching, cutting and handling, then dissolve during the wet-finishing cycle.",
      },
      zh: {
        heading: "PVA 在工艺中的位置",
        body: "PVA 缝纫线直接形成临时缝线，水溶性纱线也可在刺绣和花边结构中充当引导线或支撑元件。它们在缝制、裁剪和搬运过程中保持原位，随后在水洗工序中溶解。",
      },
    },
    whyTemporary: {
      en: {
        heading: "Why a temporary material",
        body: "The stitch or guide has finished its job once assembly or embroidery is complete. Removal must happen under the finished garment's safe temperature without dyeing, trims or decorative yarns being affected.",
      },
      zh: {
        heading: "为什么需要临时材料",
        body: "组装或刺绣完成后，缝线或引导线即完成使命。去除必须在成品面料的安全温度下进行，且不能影响染色、辅料和装饰纱线。",
      },
    },
    selectionVariables: {
      en: [
        "Thread count and ply for the sewing operation",
        "Machine type, needle, stitch and seam construction",
        "Operating speed and needle-heat exposure",
        "Maximum safe water temperature for fabric, dyes and trims",
        "Required endpoint: loss of seam strength or complete removal",
      ],
      zh: [
        "与缝纫工序匹配的线的支数与合股数",
        "机器类型、机针、线迹与缝型结构",
        "运行速度与针温影响",
        "面料、染料和辅料可承受的最高水温",
        "所需终点：缝线强度丧失或完全去除",
      ],
    },
    testing: {
      en: {
        heading: "Testing considerations",
        body: "A loose-strand demonstration does not reproduce sewing conditions. Run the thread on the intended machine and seam, then test the complete sewn construction through the real finishing cycle, checking needle heat, tension, breakage and the cleanliness of removal.",
      },
      zh: {
        heading: "测试要点",
        body: "松散纱线的演示无法还原真实缝纫条件。应在目标设备和缝型上试缝，并让完整的缝合结构经过真实的水洗工序，检查针温、张力、断线情况和去除洁净度。",
      },
    },
    productSlugs: ["water-soluble-pva-sewing-thread", "water-soluble-pva-yarn"],
  },
  {
    slug: "knitting",
    name: { en: "Knitting & knitwear", zh: "针织与针织纱" },
    summary: {
      en: "PVA yarn and fiber provide temporary support and easy-removal structure in knitted fabrics and knitwear spinning routes, protecting the final hand feel of the garment.",
      zh: "PVA 纱线与纤维在针织物和针织纺纱路线中提供临时支撑与易去除结构，保护成衣的最终手感。",
    },
    image: "/images/about-yarn.jpg",
    imageAlt: {
      en: "PVA yarn prepared for knitting support applications",
      zh: "用于针织支撑应用的 PVA 纱线",
    },
    problem: {
      en: {
        heading: "The production problem",
        body: "Knitted constructions and fancy yarns can need a supporting element during spinning, plating or knitting that must be gone before the garment is worn. Heat or aggressive chemistry cannot always be used because the surrounding fibers are sensitive.",
      },
      zh: {
        heading: "生产痛点",
        body: "针织结构和花式纱线在纺纱、添纱或编织过程中可能需要支撑元件，但成衣穿着前必须去除。由于周围纤维敏感，往往无法使用高温或强化学处理。",
      },
    },
    whereUsed: {
      en: {
        heading: "Where PVA sits in the process",
        body: "Depending on the route, PVA enters as a plating or support yarn, as a blend component in spinning, or as staple fiber in the blend. It stabilizes the construction through preparation and knitting, then dissolves in a mild washing cycle.",
      },
      zh: {
        heading: "PVA 在工艺中的位置",
        body: "根据工艺路线，PVA 可以作为添纱或支撑纱进入，也可作为纺纱混纺组分或混料中的短纤。它在前处理和编织过程中稳定结构，随后在温和的水洗周期中溶解。",
      },
    },
    whyTemporary: {
      en: {
        heading: "Why a temporary material",
        body: "The support is only needed while the knit is fragile. Once the fabric is stable, any remaining material would change hand feel, structure and shrinkage, so a low-temperature removal route is often preferred.",
      },
      zh: {
        heading: "为什么需要临时材料",
        body: "支撑仅在针织物脆弱阶段需要。织物稳定后，任何残留材料都会改变手感、结构和缩率，因此通常优先选择低温去除路线。",
      },
    },
    selectionVariables: {
      en: [
        "Material form: support yarn, plating yarn or blended staple fiber",
        "Fiber length and fineness when blended",
        "Knitting process, tension and machine compatibility",
        "Low-temperature dissolution requirement",
        "Final-fabric criteria: hand feel, structure, shrinkage and residue",
      ],
      zh: [
        "材料形态：支撑纱、添纱或混纺短纤",
        "混纺时的纤维长度与细度",
        "针织工艺、张力与设备兼容性",
        "低温溶解要求",
        "最终面料标准：手感、结构、缩率与残留",
      ],
    },
    testing: {
      en: {
        heading: "Testing considerations",
        body: "Trial the actual blend or knitting route, then evaluate the finished fabric for hand feel, structure, shrinkage and residue after removal. Confirm the washing cycle stays within the temperature the surrounding fibers tolerate.",
      },
      zh: {
        heading: "测试要点",
        body: "应按实际混纺或针织路线进行试验，并在去除后评估成品面料的手感、结构、缩率和残留。确认水洗周期处于周围纤维可承受的温度范围内。",
      },
    },
    productSlugs: ["water-soluble-pva-yarn", "pva-staple-fiber"],
  },
  {
    slug: "papermaking",
    name: { en: "Papermaking", zh: "造纸应用" },
    summary: {
      en: "Short-cut PVA fibers are matched to furnish, dispersion and target paper properties — strengthening sheets or forming sacrificial pores that dissolve after processing.",
      zh: "短切 PVA 纤维可根据浆料、分散性和目标纸性能进行匹配——增强纸页或在加工后溶解形成牺牲孔洞。",
    },
    image: "/images/pva-fiber.jpg",
    imageAlt: {
      en: "Short-cut PVA fiber for papermaking furnish",
      zh: "用于造纸浆料的短切 PVA 纤维",
    },
    problem: {
      en: {
        heading: "The production problem",
        body: "Paper and specialty nonwoven sheets need additive fibers that disperse evenly in water-based furnish. Poor dispersion creates flocculation and sheet defects, and the fiber must either bond permanently or leave the sheet at a defined stage.",
      },
      zh: {
        heading: "生产痛点",
        body: "纸张和特种无纺布需要能在水性浆料中均匀分散的添加纤维。分散不良会导致絮聚和纸病，且纤维必须永久结合或在规定阶段离开纸页。",
      },
    },
    whereUsed: {
      en: {
        heading: "Where PVA sits in the process",
        body: "PVA staple fiber is dosed into the furnish with the pulp blend. Length, fineness and surface condition control opening, distribution and bonding; water-soluble grades can later dissolve to create porosity or release a structured sheet.",
      },
      zh: {
        heading: "PVA 在工艺中的位置",
        body: "PVA 短纤随浆料一起加入。长度、细度和表面状态决定分散、分布和结合效果；水溶级纤维随后可溶解以形成孔隙或释放成型纸页。",
      },
    },
    whyTemporary: {
      en: {
        heading: "Why a temporary material",
        body: "Some grades must remain and reinforce the sheet; others exist to be removed — leaving pores or releasing a layer during processing. The required water behavior, not the product name, decides which grade fits.",
      },
      zh: {
        heading: "为什么需要临时材料",
        body: "部分等级需要保留并增强纸页；另一部分则以去除为目的——在加工中留下孔隙或释放某一层。决定等级的是所需的水行为，而不是产品名称。",
      },
    },
    selectionVariables: {
      en: [
        "Fiber length and fineness (e.g. 2 dtex formats used in our catalog)",
        "Furnish composition, additives, pH and water conditions",
        "Dispersion and flocculation behavior in the mixing sequence",
        "Water-soluble or retention requirement of the grade",
        "Target paper property and approved dosage",
      ],
      zh: [
        "纤维长度与细度（如产品目录中的 2 dtex 规格）",
        "浆料组成、添加剂、pH 值与水质条件",
        "混合过程中的分散与絮聚行为",
        "等级的水溶性或保留性要求",
        "目标纸性能与经验证的添加量",
      ],
    },
    testing: {
      en: {
        heading: "Testing considerations",
        body: "Evaluate opening, distribution and compatibility under production-representative mixing, then measure the paper property that matters — strength, porosity or release — and record the approved dosage and process conditions.",
      },
      zh: {
        heading: "测试要点",
        body: "应在接近生产的混合条件下评估分散、分布和兼容性，然后测量对应用途关键的纸页性能——强度、孔隙率或剥离性——并记录经验证的添加量与工艺条件。",
      },
    },
    productSlugs: ["pva-staple-fiber"],
  },
  {
    slug: "technical-textiles",
    name: { en: "Technical textiles & composites", zh: "产业用纺织品与复合材料" },
    summary: {
      en: "Continuous PVA filament forms temporary channels, sacrificial structures and support elements in technical textiles, composites and specialized weaving.",
      zh: "连续 PVA 长丝可在技术纺织品、复合材料和专业织造中形成临时通道、牺牲结构和支撑元件。",
    },
    image: "/images/pva-filament.jpg",
    imageAlt: {
      en: "Continuous PVA filament yarn for technical textile processing",
      zh: "用于产业用纺织品加工的连续 PVA 长丝",
    },
    problem: {
      en: {
        heading: "The production problem",
        body: "Technical constructions often need a component that exists only during manufacturing: a channel that later becomes a cavity, a reinforcement that carries load until the matrix cures, or a continuous element that must survive processing yet leave no trace in service.",
      },
      zh: {
        heading: "生产痛点",
        body: "技术结构常常需要只存在于制造过程中的部件：后续成为空腔的通道、在基体固化前承载的增强体，或必须在加工中存活而在使用中不留痕迹的连续元件。",
      },
    },
    whereUsed: {
      en: {
        heading: "Where PVA sits in the process",
        body: "Filament yarn runs as a continuous element through guides, tension devices and placement equipment; staple fiber and yarns can be woven or formed into the structure. After processing, controlled dissolution removes the PVA and leaves the designed geometry.",
      },
      zh: {
        heading: "PVA 在工艺中的位置",
        body: "长丝作为连续元件穿过导纱器、张力装置和铺放设备；短纤和纱线可织造或成型到结构中。加工完成后，受控溶解去除 PVA，留下设计好的几何结构。",
      },
    },
    whyTemporary: {
      en: {
        heading: "Why a temporary material",
        body: "The component's job ends when the structure is formed. What remains must be only the customer's material, with the PVA having contributed strength or geometry during production and then removed under defined conditions.",
      },
      zh: {
        heading: "为什么需要临时材料",
        body: "当结构成型后，该部件的使命即结束。最终只应保留客户自己的材料——PVA 在生产过程中提供强度或几何形状，然后在规定条件下去除。",
      },
    },
    selectionVariables: {
      en: [
        "Filament construction, strength and elongation",
        "Processing tension, guides and contact surfaces",
        "Which dry or wet stages the material must survive",
        "Defined softening, strength-loss or removal conditions",
        "Package format and running behavior on the equipment",
      ],
      zh: [
        "长丝结构、强度与伸长率",
        "加工张力、导纱器与接触面",
        "材料必须经受哪些干法或湿法工序",
        "明确的软化、强度丧失或去除条件",
        "卷装形式与设备上的运行表现",
      ],
    },
    testing: {
      en: {
        heading: "Testing considerations",
        body: "Map the filament path and service window first, then trial a traceable sample on representative equipment. Record processing stability and removal results separately before confirming any production quantity.",
      },
      zh: {
        heading: "测试要点",
        body: "首先梳理长丝路径与服役窗口，然后用有代表性的设备对可追溯样品进行试验。在确认批量前，分别记录加工稳定性和去除结果。",
      },
    },
    productSlugs: ["pva-filament-yarn", "pva-staple-fiber", "water-soluble-pva-yarn"],
  },
] as const;

export const applicationBySlug = (slug: string) => applications.find((a) => a.slug === slug);
