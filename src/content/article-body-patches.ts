import type { ArticleBody } from "./article-blocks";

/**
 * Article bodies re-authored on the block model.
 *
 * Two rules shape everything below, and both exist because of how the rest of the
 * site reads this content.
 *
 * 1. **Only `sections` are rewritten here.** `title`, `intro`, `metaDescription` and
 *    `category` are mirrored in `card-copy.ts` `ARTICLE_TEASERS`, which carries
 *    Spanish and German for all four and throws if the English or Chinese side
 *    drifts from the entity. Editing an English headline would therefore stale a
 *    Spanish card, and refreshing that Spanish would mean authoring a translation
 *    nobody has reviewed. So the headlines stay as they are and the body carries
 *    the depth instead.
 * 2. **Nothing below is a new claim.** Every figure is already published elsewhere
 *    in this repository, and each is attributed below. No dissolution time,
 *    strength, tenacity, twist, machine speed, bath ratio, tolerance, capacity,
 *    headcount, MOQ, lead time or customer case appears, because none of those is
 *    in the public record here — they are the CONTENT-QUALITY-001A
 *    `NEEDS_COMPANY_INPUT` list, and they stay with the company.
 *
 * `assertAlignedBody` runs over both locales of every entry, so an English and a
 * Chinese body that drift apart in *shape* — not in wording — fail the build. That
 * guard is the reason the two languages below sit block for block.
 *
 * Provenance of every figure used:
 *   - the seven process targets ................. products[0].technicalOverview, legacy-source.ts
 *   - ISO 9001 scope / number / dates ........... quality.ts certificates[0], [1]
 *   - OEKO-TEX SH005 149658, Class I, expiry .... quality.ts certificates[2]
 *   - TESTEX SH005 275198.1, pH 6.2, parameter list  quality.ts certificates[3]
 *   - SGS SL22002263585101TX, 7.5 tex, four test items  quality.ts certificates[4]
 *   - removal stages, dense zones, bath loading ... the article's own pre-existing body
 *   - residual PVA / loft / absorbency endpoints .. applications.ts towel-weaving
 *   - sampling and elasticity-test fixtures ...... patents.ts utility + invention entries
 */

export const reAuthoredBodies: Record<string, { en: ArticleBody; zh: ArticleBody }> = {
  /* ------------------------------------------------------------------ *
   * R1 — dissolution-temperature selection
   * ------------------------------------------------------------------ */
  "pva-yarn-dissolution-temperature-guide": {
    en: [
      {
        heading: "The label is not the specification",
        blocks: [
          {
            type: "paragraph",
            text: "A dissolution temperature states the direction a grade was developed in. It does not state how long the material may stay wet, how much water moves across it, what else in the construction is dissolving at the same time, or what has to be true before the next process step can start. A grade selected on the label alone is selected on one of those five inputs.",
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "Three Thai currently develops water-soluble PVA yarn around " },
              {
                kind: "link",
                text: "20°C, 40°C, 55°C, 60°C, 70°C, 80°C and 90°C process targets",
                href: "/products/water-soluble-pva-yarn",
              },
              {
                kind: "text",
                text: ". This article is headed with 20°C, 40°C and 90°C because those are the labels buyers ask about most; the wider range exists, and the exact count and current production range for a given grade are confirmed only after the buyer's process has been reviewed.",
              },
            ],
          },
          {
            type: "callout",
            label: "What we will not do",
            tone: "note",
            text: "We will not propose a grade from a temperature alone. If an enquiry says \u201C40°C soluble\u201D and nothing else, the honest answer is that the specification is incomplete — not that a grade exists, and not that it does not.",
          },
        ],
      },
      {
        heading: "Five inputs that move the observed result",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              [{ kind: "text", text: "Exposure time: how long the material stays wet, including the dwell your machine actually gives it." }],
              [{ kind: "text", text: "Bath movement. Water sitting around a yarn saturates locally and slows removal; water passing across it carries dissolved polymer away." }],
              [{ kind: "text", text: "Liquor ratio, and whether the bath is renewed between specimens." }],
              [{ kind: "text", text: "How dense the surrounding construction is, which decides whether water reaches the interior of the fabric at all." }],
              [{ kind: "text", text: "Everything else in the bath: sizing, spinning oils, dyes, auxiliaries, and the order they arrive in." }],
            ],
          },
          {
            type: "paragraph",
            text: "The same grade can disappear in a beaker and still be present in the densest zone of a towel run through the buyer's own finishing recipe. Both results are correct for the test that produced them, and only one of them was ever going to predict a line.",
          },
        ],
      },
      {
        heading: "Five separate events, not one",
        blocks: [
          {
            type: "paragraph",
            text: "\u201CDissolved\u201D is not a single observation. Recording the stages separately is what turns an argument about whether the yarn left the fabric into a measurement both sides can repeat.",
          },
          {
            type: "table",
            caption: "Removal stages, and the situation each one is a reasonable acceptance endpoint for",
            columns: ["Stage", "What you can observe", "When this is the right endpoint"],
            rowHeader: true,
            rows: [
              ["Initial wetting", "Water has reached the material; nothing has been lost yet", "Never. It says only that the bath touched the goods."],
              ["Softening", "The element yields to handling but still carries load", "Only where it stops carrying load later in the same cycle anyway."],
              ["Loss of tensile function", "The element can no longer perform its job", "Removable stitching and temporary seams, which must stop holding before they are visibly gone."],
              ["Breakup", "The construction separates; fragments may remain in place", "Open constructions where separated fragments will still be carried away by the flow."],
              ["Complete visible removal", "No residue is visible in the finished article", "Towel and open-work fabrics, where residual material damages handle, loft and absorbency."],
            ],
          },
          {
            type: "paragraph",
            text: "Fix the stage before the trial, write it into the method, and reject a result reported against a different one. A supplier who answers \u201Cfully dissolved\u201D to a question about load-bearing has answered another question.",
          },
        ],
      },
      {
        heading: "Run a comparison the next supplier can repeat",
        blocks: [
          {
            type: "paragraph",
            text: "A first test is not there to prove the yarn dissolves. It is there to produce a number that still means something when the supplier changes, so a later difference can be acted on instead of argued.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              [{ kind: "text", text: "Identify and condition the specimens; record the batch code before anything meets water." }],
              [{ kind: "text", text: "Fix specimen mass and length, so no candidate is helped by being smaller or looser." }],
              [{ kind: "text", text: "Fix water volume and liquor ratio, and write both down." }],
              [{ kind: "text", text: "Hold the temperature inside an agreed tolerance, measured with a calibrated instrument rather than the bath's own display." }],
              [{ kind: "text", text: "Fix the agitation, and decide in advance whether the bath is renewed between specimens; polymer left in the water changes the next result." }],
              [{ kind: "text", text: "State the endpoint every party will accept, using the stage names above." }],
              [{ kind: "text", text: "Repeat. One favourable run tells you nothing about the next shipment." }],
            ],
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "For the batch-to-batch version of the same discipline, see " },
              { kind: "link", text: "how to evaluate PVA batch dissolution consistency", href: "/knowledge/pva-batch-dissolution-consistency" },
              { kind: "text", text: "; for the short procedure form, " },
              { kind: "link", text: "how the yarn is tested for dissolution temperature", href: "/answers/test-pva-yarn-dissolution-temperature" },
              { kind: "text", text: "." },
            ],
          },
        ],
      },
      {
        heading: "Four terms to fix before you order",
        blocks: [
          {
            type: "definitionList",
            items: [
              {
                term: "Process target",
                detail: [
                  { kind: "text", text: "The temperature band a grade was developed toward. Not a pass condition, and not a guarantee that removal completes at that temperature in your construction." },
                ],
              },
              {
                term: "Endpoint",
                detail: [
                  { kind: "text", text: "The stage at which you declare the material removed. The choice belongs to the application, not to the yarn." },
                ],
              },
              {
                term: "Liquor ratio",
                detail: [
                  { kind: "text", text: "Water relative to material. With agitation, it sets how fast dissolved polymer is carried away — usually the whole difference between a laboratory result and a machine result." },
                ],
              },
              {
                term: "Residual condition",
                detail: [
                  { kind: "text", text: "What may remain, and how it will be judged: none visible, none in dense zones, or within an agreed inspection. For towelling, this is where handle, loft and absorbency are decided." },
                ],
              },
            ],
          },
        ],
      },
      {
        heading: "Where a low-temperature grade earns its place",
        blocks: [
          {
            type: "paragraph",
            text: "A 20°C grade is usually chosen because something else in the article cannot take heat — a fibre, a coating, a trim or a dye that would move, felt or shade off in a warmer bath. That is a real reason to buy it, and it is a trade: the same properties that let it go cold make it harder to protect through humid storage, warm transit and any earlier wet stage. A higher-temperature grade serves the mirror case, where the material has to survive the wet processes before it and dissolve only where you want it gone.",
          },
          {
            type: "callout",
            label: "Handling",
            tone: "caution",
            text: "Humidity protection, package integrity and conditioning affect processing long before any bath does. Agree labelling and batch identification so the warehouse and the production floor are protecting the same approved material.",
          },
        ],
      },
      {
        heading: "What to send with the enquiry",
        blocks: [
          {
            type: "paragraph",
            text: "The fastest route to a usable sample is a brief that has already fixed the five variables and the endpoint. If you have a preferred specification, send the count system, single or plied construction, twist direction, the machine and tension it will run under, the bath you can actually control, and the stage you will accept as removed.",
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "The full form of that brief, including the commercial terms that make two quotations comparable, is in " },
              { kind: "link", text: "five specifications to confirm before ordering water-soluble PVA yarn", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
              { kind: "text", text: "." },
            ],
          },
          {
            type: "paragraph",
            text: "If a number is unknown, describe the process problem instead of guessing a value. A guessed tolerance becomes the specification you are later held to; a described failure mode gets a sample plan that tests the thing that actually decides the application.",
          },
        ],
      },
    ],
    zh: [
      {
        heading: "标签不是规格",
        blocks: [
          {
            type: "paragraph",
            text: "溶解温度说明的是一个牌号研发的方向，并不说明材料可以湿多久、有多少水在它表面流动、同时还有什么也在溶解，也不说明下一道工序开始前必须达到什么状态。决定这个牌号能否用于贵方生产线的恰恰是后面这些，而它们都不在标签里。",
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "荣沣目前围绕 " },
              { kind: "link", text: "20°C、40°C、55°C、60°C、70°C、80°C 与 90°C 七个工艺目标", href: "/products/water-soluble-pva-yarn" },
              { kind: "text", text: "研产水溶性 PVA 纱线。本文标题只写 20°C、40°C 与 90°C，是因为这三个是买家最常问的标签；更宽的区间确实存在，但具体支数与当前可生产范围，要在评估买方工艺之后才能确认。" },
            ],
          },
          {
            type: "callout",
            label: "我们不做的事",
            tone: "note",
            text: "我们不会只凭一个温度就推荐牌号。如果询盘只写了「40°C 可溶」而没有其他条件，诚实的答复是这份规格尚不完整——而不是某个牌号存在或不存在。",
          },
        ],
      },
      {
        heading: "影响观测结果的五个变量",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              [{ kind: "text", text: "作用时间——材料实际与水接触多久，包括设备给它的时间。" }],
              [{ kind: "text", text: "浴液流动——水是掠过纱线还是滞留在周围。静止水会局部饱和，从而拖慢去除。" }],
              [{ kind: "text", text: "浴比——水量与材料量的比例，以及溶解后的聚合物是否被允许留在水中。" }],
              [{ kind: "text", text: "周围结构——PVA 元件周围的织物有多密，水能否到达内部。" }],
              [{ kind: "text", text: "其他化学品——浆料、纺纱油剂、染料、助剂与整理顺序，都会改变润湿行为。" }],
            ],
          },
          {
            type: "paragraph",
            text: "这就是同一个牌号能在烧杯中消失、却能在用贵方整理配方处理的最密毛巾区域中存活的原因。两个观察都没有错，它们只是两个不同的试验，而其中只有一个接近量产。",
          },
        ],
      },
      {
        heading: "去除是五个独立事件",
        blocks: [
          {
            type: "paragraph",
            text: "「已溶解」不是一个观察值。把各阶段分开记录，才能把「纱到底有没有离开织物」的争论，变成双方都能复现的测量。",
          },
          {
            type: "table",
            caption: "去除阶段，以及每一阶段作为验收终点的适用场合",
            columns: ["阶段", "可以观察到什么", "何时它是合适的终点"],
            rowHeader: true,
            rows: [
              ["初始润湿", "水已接触到材料，尚未有任何损失", "永远不是。它只说明浴液接触了货物。"],
              ["软化", "元件在操作中变形，但仍承受载荷", "仅当它在同一周期的后续阶段本来就会停止承载时才适用。"],
              ["拉伸功能丧失", "元件无法再履行其功能", "临时缝线与临时接缝——它们必须在肉眼可见消失之前就停止受力。"],
              ["破裂分离", "结构分离，但可能有碎段留在原地", "敞开结构，其碎段仍会被水流带走的情形。"],
              ["完全可见去除", "成品中看不到任何残留", "毛巾与镂空织物——残留会损害手感、蓬松度与吸水性。"],
            ],
          },
          {
            type: "paragraph",
            text: "在试验之前就选定阶段、写进文件，并且不接受报告了另一阶段的结果。当你问的是接缝是否已经不再受力，而对方回答「已完全溶解」，那是把问题换掉了，而不是回答了问题。",
          },
        ],
      },
      {
        heading: "让下一家供应商也能复现的比较",
        blocks: [
          {
            type: "paragraph",
            text: "首次试验的目的不是看纱会不会溶解，而是产出一个在供应商变更之后仍然有意义的结果，这样日后的差异才可以被处置。",
          },
          {
            type: "list",
            ordered: true,
            items: [
              [{ kind: "text", text: "标识并调湿样品，在任何东西入水之前记录批次号。" }],
              [{ kind: "text", text: "固定样品的质量与长度，避免某个候选样因为更小或更松而占便宜。" }],
              [{ kind: "text", text: "固定水量与水对材料的比例，并写入文件。" }],
              [{ kind: "text", text: "把温度控制在约定容差内，用校准过的仪器测量，而不是看浴槽自己的显示。" }],
              [{ kind: "text", text: "固定搅动条件，并事先决定样品之间是否换浴。留在水中的溶解聚合物会改变下一个结果。" }],
              [{ kind: "text", text: "写下各方都接受的终点，用上一节的阶段语言表述。" }],
              [{ kind: "text", text: "重复足够次数，使一次幸运的结果无法支撑一个决定。" }],
            ],
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "同一套纪律在批次层面的做法，见 " },
              { kind: "link", text: "如何评估 PVA 批次溶解一致性", href: "/knowledge/pva-batch-dissolution-consistency" },
              { kind: "text", text: "；简化流程版见 " },
              { kind: "link", text: "如何检测 PVA 纱线的溶解温度", href: "/answers/test-pva-yarn-dissolution-temperature" },
              { kind: "text", text: "。" },
            ],
          },
        ],
      },
      {
        heading: "下单前先固定这四个术语",
        blocks: [
          {
            type: "definitionList",
            items: [
              {
                term: "工艺目标",
                detail: [{ kind: "text", text: "该牌号研发所指向的温度区间。它不是合格判据，也不保证在贵方结构中该温度就能完成去除。" }],
              },
              {
                term: "终点",
                detail: [{ kind: "text", text: "你判定材料已去除的那个阶段。这个选择属于应用，而不属于纱线。" }],
              },
              {
                term: "浴比",
                detail: [{ kind: "text", text: "水与材料的比例。它与搅动共同决定溶解聚合物被带走的速率，而这通常就是实验室结果与机台结果之间的全部差别。" }],
              },
              {
                term: "残留状态",
                detail: [{ kind: "text", text: "允许留下什么、如何判定：肉眼不可见、致密区域无残留，或控制在约定的检验范围内。对毛巾而言，手感、蓬松度与吸水性就在这里决定。" }],
              },
            ],
          },
        ],
      },
      {
        heading: "低温牌号在什么场合值得选",
        blocks: [
          {
            type: "paragraph",
            text: "选择 20°C 牌号，通常是因为成品中另有东西承受不了热量——某种纤维、涂层、辅料或染料，在更热的浴液中会位移、毡化或搭色。这是选择它的真实理由，也是一种交换：让它能在冷水中溶解的那套特性，同样会让它在潮湿仓储、高温运输和任何提前的湿工序中更难保护。较高温度的牌号服务于相反的情形——材料需要扛过前面的湿处理，只在你希望它消失的那一步才去除。",
          },
          {
            type: "callout",
            label: "搬运与储存",
            tone: "caution",
            text: "防潮、卷装完整性与调湿，在任何浴液之前就会影响加工。约定标签与批次标识，让仓储与生产团队保护的是同一份已确认的材料。",
          },
        ],
      },
      {
        heading: "询盘时应当附上什么",
        blocks: [
          {
            type: "paragraph",
            text: "最快拿到可用样品的方法，是一份已经把上述五个变量和终点固定下来的说明。如果有倾向规格，请给出支数体系、单纱或合股结构、捻向、它将运行的设备与张力、你能实际控制的浴液条件，以及你会判定为已去除的那个阶段。",
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "这份说明的完整形式，包括让两家报价可以相互比较的商务条件，见 " },
              { kind: "link", text: "订购水溶性 PVA 纱线前应确认的五项规格", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
              { kind: "text", text: "。" },
            ],
          },
          {
            type: "paragraph",
            text: "如果某项数值未知，请描述工艺问题，而不是猜一个数字。猜出来的容差日后会变成约束你的规格；而被清楚描述的失效模式，会换来一个真正检验关键问题的样品方案。",
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * R2 — batch-to-batch consistency, built on the documents that exist
   * ------------------------------------------------------------------ */
  "pva-batch-dissolution-consistency": {
    en: [
      {
        heading: "A comparison needs records, not a demonstration",
        blocks: [
          {
            type: "paragraph",
            text: "Batch consistency is a statement about records. Anyone can hand over a specimen that behaves beautifully; the question a buyer can actually act on is whether the next shipment behaves like the one they approved, and that is answered by what was measured, against what method, and what was written down — not by a video of a beaker.",
          },
          {
            type: "callout",
            label: "Read certificates narrowly",
            tone: "caution",
            text: "A quality-management certificate attests that a system is certified for a stated scope. It is not a test report, and it says nothing about how this lot dissolves. A product certificate covers the article named on it, at the class named on it. Before either is used to close a technical question, check its scope line and its expiry.",
          },
        ],
      },
      {
        heading: "What already exists for this product, and what each item proves",
        blocks: [
          {
            type: "paragraph",
            text: "These are the records Three Thai can put in front of a buyer today. The second column is what the document states; the third is where it stops, which matters more in a supplier qualification than the first column does.",
          },
          {
            type: "table",
            caption: "Available evidence for water-soluble PVA yarn, and the limit of each item",
            columns: ["Record", "What it states", "What it does not prove"],
            rowHeader: true,
            rows: [
              [
                "ISO 9001:2015, certificate 23226Q00380R101",
                "A certified management system, scope: production of water-soluble PVA yarns and sale of water-soluble PVA fibres. First issued 9 Aug 2023, reissued 7 Aug 2026, valid to 6 Aug 2029.",
                "Anything about a specific batch. It certifies a system and a scope, not product performance.",
              ],
              [
                "OEKO-TEX Standard 100, SH005 149658",
                "Product Class I (baby articles), Annex 6, for 100% PVA water-soluble yarn in raw white; seventh renewal, valid to 31 Jan 2027.",
                "Any grade, colour or construction beyond the article named on it, and nothing about removal behaviour.",
              ],
              [
                "TESTEX report SH005 275198.1, 7 Jan 2026",
                "The testing behind that renewal on raw-white PVA yarn: heavy metals, formaldehyde, pH (6.2), VOCs, PAHs and the other listed parameters, within Class I limits.",
                "Strength, count regularity or dissolution timing. It is a chemistry report.",
              ],
              [
                "SGS report SL22002263585101TX, 19 Jun 2020",
                "A point-in-time test of one 7.5 tex PVA yarn sample: single-thread strength, moisture content and regain, yarn count and evenness.",
                "Current production. It is a 2020 record of a single sample and is presented as that, not as a typical value.",
              ],
              [
                "Batch release record",
                "What was made, against which approved sample it was released, and what was checked before release.",
                "Nothing on its own. It is meaningful only against a method both sides signed beforehand.",
              ],
              [
                "Shipment document set",
                "The commercial and customs identity of the goods.",
                "Quality. Documents describe what was shipped, not how well it was made.",
              ],
            ],
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "Every number above is transcribed from a document held on file, and " },
              { kind: "link", text: "the quality page", href: "/quality" },
              { kind: "text", text: " publishes the certificate images and report PDFs with the issuing body, scope and validity stated per document. Verify the numbers through the issuing body's own channel before contracting — that check is cheaper than a disputed lot." },
            ],
          },
        ],
      },
      {
        heading: "Control the test before you compare the batches",
        blocks: [
          {
            type: "paragraph",
            text: "The specimen, the bath and the endpoint are the three places an apparent batch difference is manufactured. Fix them in writing once, and every later comparison is between batches rather than between technicians.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              [{ kind: "text", text: "Specimen: same mass, same length, same construction, same conditioning, batch code recorded before testing." }],
              [{ kind: "text", text: "Bath: same water volume and liquor ratio, same temperature tolerance, same agitation, same duration; renew the bath when dissolved polymer could affect the next specimen." }],
              [{ kind: "text", text: "Endpoint: wetting, softening, loss of strength and complete visible removal recorded separately, and the accepted one named in advance." }],
              [{ kind: "text", text: "Replicates: more than one specimen per batch, with an approved reference specimen in the same bath whenever one is available." }],
              [{ kind: "text", text: "Records: photographs, timings, bath conditions and the operator's name, kept with the batch rather than in a mailbox." }],
            ],
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "The stage definitions and the reasons a controlled bath matters are set out in " },
              { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
              { kind: "text", text: "; this article is about repeating that test across lots, not about choosing a grade." },
            ],
          },
        ],
      },
      {
        heading: "Separate method drift from product drift",
        blocks: [
          {
            type: "paragraph",
            text: "Most reported batch differences are measurement differences. Temperature overshoot, a change of agitation, a specimen cut to a different length, two people reading \u201Cgone\u201D differently — each can produce a gap far larger than the process variation being investigated. So the first response to a suspect lot is not a claim, it is a review: recalibrate, re-run the reference specimen in the same bath, and compare results on split samples if buyer and supplier each hold material.",
          },
          {
            type: "paragraph",
            text: "If both sides work from the same written procedure and the gap survives, it is now a real deviation with an agreed definition — which is a much easier conversation than the same argument conducted in adjectives.",
          },
        ],
      },
      {
        heading: "Sampling is a process step, not a grab",
        blocks: [
          {
            type: "paragraph",
            text: "Where a comparison fails most often is before the bath: the specimen taken is not the material in the lot. That is the reason sampling has been treated here as something to build equipment for rather than an administrative formality — granted patents in the portfolio cover an intelligent sampler for water-soluble yarn performance testing (CN 217304407 U) and a further performance-test sampler (CN 218629045 U), and the invention portfolio covers an elasticity testing device for water-soluble vinylon yarn (CN 117367975 B).",
          },
          {
            type: "paragraph",
            text: "Two more registered devices say something about which variables this process treats as unstable enough to engineer for: a workshop air-conditioning system for water-soluble yarn production (CN 213480448 U) and a yarn steaming device (CN 214300715 U). Ambient moisture and conditioning are the same problem a buyer meets later as a change in handling and wet behaviour, which is why conditioning belongs in the test method and not in the supplier's goodwill.",
          },
          {
            type: "callout",
            label: "What those numbers are",
            tone: "note",
            text: "A granted patent number is a public, verifiable record that a device was registered. It is not a performance claim, and none is made here. Check ownership and current status in the register before treating any of it as capability evidence.",
          },
        ],
      },
      {
        heading: "Investigate a deviation in this order",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              [{ kind: "text", text: "Quarantine the affected material and confirm its identification against the batch code." }],
              [{ kind: "text", text: "Re-run the test under the written method, with the approved reference specimen in the same bath." }],
              [{ kind: "text", text: "Compare manufacturing and release records for this lot against the approved lot." }],
              [{ kind: "text", text: "Classify the deviation: processing strength, dissolution stage, residue, or final article performance. Each points to a different cause, and lumping them together loses the trace." }],
              [{ kind: "text", text: "Record the finding against the lot, and agree what changes in the next shipment." }],
            ],
          },
        ],
      },
      {
        heading: "Turn the method into an acceptance plan",
        blocks: [
          {
            type: "paragraph",
            text: "A method that lives in a laboratory notebook cannot reject anything. The step that makes consistency enforceable is putting the same numbers into the purchase terms, so both parties are measuring the same thing on the same schedule:",
          },
          {
            type: "definitionList",
            items: [
              { term: "Sampling", detail: [{ kind: "text", text: "How many specimens per lot, drawn from where, by whom." }] },
              { term: "Tolerances", detail: [{ kind: "text", text: "The band each measured item must fall in, and the temperature and bath tolerances of the method itself." }] },
              { term: "Action limits", detail: [{ kind: "text", text: "What triggers a retest, what triggers a technical review, and what rejects the lot outright." }] },
              { term: "Change notification", detail: [{ kind: "text", text: "Which changes in raw material, construction, finish or route must be communicated before shipment, because each can move the removal curve without moving the label." }] },
              { term: "Method revision control", detail: [{ kind: "text", text: "A version number, so historical lot results stay comparable after the method evolves." }] },
            ],
          },
        ],
      },
      {
        heading: "What is deliberately absent from this article",
        blocks: [
          {
            type: "paragraph",
            text: "There is no dissolution time, no strength value, no tenacity, no twist figure, no machine speed, no bath ratio and no tolerance published here. Those are the figures a specification needs and a marketing page prefers, and they are exactly the numbers that must come from a reviewable report against your own construction rather than from an article. Ask for them; the answer you get is the test.",
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "What to ask for, and in what form, is listed in " },
              { kind: "link", text: "the buyer specification checklist", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
              { kind: "text", text: ", and the qualification route for a new supplier in " },
              { kind: "link", text: "how buyers compare PVA yarn manufacturers in China", href: "/answers/best-pva-water-soluble-yarn-manufacturers-china" },
              { kind: "text", text: "." },
            ],
          },
        ],
      },
    ],
    zh: [
      {
        heading: "批次比较需要的是记录，而不是演示",
        blocks: [
          {
            type: "paragraph",
            text: "批次一致性是一句关于记录的话。谁都可以递来一支表现漂亮的样品；买方真正能据此行动的问题是：下一批会不会像他们已经确认的那一批。这要由「测了什么、按什么方法测、留下了什么」来回答，而不是由一段烧杯视频来回答。",
          },
          {
            type: "callout",
            label: "请按字面范围理解证书",
            tone: "caution",
            text: "质量管理体系证书证明的是某个体系在某项范围内获得认证。它不是检测报告，也不说明这一批如何溶解。产品证书只覆盖证书上写明的那个产品与那个级别。在用任何证书关闭一个技术结论之前，先核对它的范围行与有效期。",
          },
        ],
      },
      {
        heading: "这个产品目前已有的证据，以及每项能证明什么",
        blocks: [
          {
            type: "paragraph",
            text: "以下是荣沣今天可以摆在买方面前的记录。第二列是文件本身写明的内容；第三列是它到哪里为止——在评估供应商时，第三列往往比第二列更有用。",
          },
          {
            type: "table",
            caption: "水溶性 PVA 纱线可得证据，以及每一项的边界",
            columns: ["记录", "文件写明什么", "它证明不了什么"],
            rowHeader: true,
            rows: [
              [
                "ISO 9001:2015，证书号 23226Q00380R101",
                "经认证的质量管理体系，范围：水溶性 PVA 纱线的生产与水溶性 PVA 纤维的销售。初次发证 2023 年 8 月 9 日，本次发证 2026 年 8 月 7 日，有效期至 2029 年 8 月 6 日。",
                "任何关于具体批次的事。它认证的是体系与范围，不是产品性能。",
              ],
              [
                "OEKO-TEX Standard 100，SH005 149658",
                "I 类（婴幼儿产品）附录 6，认证范围为原白色 100% 水溶性 PVA 纱线；第七次续期，有效期至 2027 年 1 月 31 日。",
                "证书所列产品之外的任何牌号、颜色或结构；且与去除行为无关。",
              ],
              [
                "TESTEX 报告 SH005 275198.1，2026 年 1 月 7 日",
                "支撑上述续证的检测项目：原白 PVA 纱线的重金属、甲醛、pH 值（6.2）、VOC、多环芳烃及其他列明参数，均在 I 类限值内。",
                "强力、条干均匀度或溶解时间。这是一份化学检测报告。",
              ],
              [
                "SGS 报告 SL22002263585101TX，2020 年 6 月 19 日",
                "对一支 7.5 tex PVA 纱样品的时点检测：单纱强力、回潮率与含水率、线密度与条干均匀度。",
                "当前生产水平。它是 2020 年单个样品的记录，我们也如此呈现，而不把它当作典型值。",
              ],
              [
                "批次放行记录",
                "本批生产内容、对照哪份确认样品放行、以及放行前检查了哪些项目。",
                "单独存在时证明不了任何事——只有配合双方事先签字的方法才有意义。",
              ],
              [
                "发运单证套",
                "货物的商务与报关身份。",
                "质量。单证说明发的是什么，不说明做得好不好。",
              ],
            ],
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "以上每一项数字都转录自存档文件，" },
              { kind: "link", text: "质量页面", href: "/quality" },
              { kind: "text", text: " 公开了证书图片与报告 PDF，并逐份注明发证机构、范围与有效期。签约前请通过发证机构自己的官方渠道核验编号——这次核验的成本，远低于一批货的争议。" },
            ],
          },
        ],
      },
      {
        heading: "先控制试验，再比较批次",
        blocks: [
          {
            type: "paragraph",
            text: "样品、浴液与终点，是「假性批次差异」最常被制造出来的三个地方。把这三者一次性以书面固定下来，之后的每一次比较比的就是批次本身，而不是两名操作人员的手法。",
          },
          {
            type: "list",
            ordered: true,
            items: [
              [{ kind: "text", text: "样品：相同质量、相同长度、相同结构、相同调湿，入水前记录批次号。" }],
              [{ kind: "text", text: "浴液：相同水量与浴比、相同温度容差、相同搅动、相同时间；当溶解聚合物可能影响下一个样品时更换浴液。" }],
              [{ kind: "text", text: "终点：润湿、软化、强度丧失与完全可见去除分开记录，并事先指明验收采用哪一个。" }],
              [{ kind: "text", text: "重复样：每批不止一个样品，并在有可能时把确认参照样放进同一浴液。" }],
              [{ kind: "text", text: "记录：照片、计时、浴液条件与操作人姓名，与批次一起归档，而不是留在邮箱里。" }],
            ],
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "各阶段的定义以及受控浴液为何重要，见 " },
              { kind: "link", text: "PVA 纱线溶解温度指南", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
              { kind: "text", text: "；本文谈的是把同一试验跨批次重复，而不是选牌号。" },
            ],
          },
        ],
      },
      {
        heading: "把方法波动与产品波动分开",
        blocks: [
          {
            type: "paragraph",
            text: "大多数被报告的批次差异，其实是测量差异。温度过冲、搅动改变、样品裁取长度不同、两个人对「消失」的不同理解——任何一项造成的表观差距，都可能远大于正在调查的工艺波动。所以面对可疑批次，第一个动作不是提出索赔，而是复核：重新校准、在同一浴液中重跑参照样，如果买卖双方各持有材料，就在分割样品上比对结果。",
          },
          {
            type: "paragraph",
            text: "当双方使用同一份书面程序而差距依然存在时，它才是一个有共同定义的真实偏差——这比用形容词进行的同一场争论要容易处理得多。",
          },
        ],
      },
      {
        heading: "取样是一道工序，不是一个随手动作",
        blocks: [
          {
            type: "paragraph",
            text: "比较最容易失败的地方在入水之前：取到的样品并不代表这批材料。这也是我们把取样当成值得为其设计装备的环节、而非行政手续的原因——专利组合中有已授权的水溶纱性能试验智能取样器（CN 217304407 U）与另一件性能试验取样器（CN 218629045 U），发明专利中则有水溶性维纶纱弹性测试装置（CN 117367975 B）。",
          },
          {
            type: "paragraph",
            text: "另有两件已授权设备说明了哪些变量在这套工艺里被认为不稳定到需要专门设计去应对：水溶纱生产车间空调系统（CN 213480448 U）与水溶纱蒸纱装置（CN 214300715 U）。环境含水率与调湿，正是买方日后在搬运与湿处理行为变化中遇到的同一个问题——这也是为什么调湿应当写进试验方法，而不是依赖供应商的自觉。",
          },
          {
            type: "callout",
            label: "这些编号是什么",
            tone: "note",
            text: "专利授权号是可公开核验的设备登记记录，不是性能声明，本文也不作任何性能推定。在把任何一项当作能力证据之前，请到登记库核对权属与当前法律状态。",
          },
        ],
      },
      {
        heading: "按这个顺序处置偏差",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              [{ kind: "text", text: "隔离受影响材料，并对照批次标识确认其身份。" }],
              [{ kind: "text", text: "按书面方法重测，并把确认参照样放入同一浴液。" }],
              [{ kind: "text", text: "把本批的生产与放行记录同确认批次逐项比对。" }],
              [{ kind: "text", text: "给偏差归类：加工强度、溶解阶段、残留，还是成品性能。每一类指向不同原因，混在一起就失去了线索。" }],
              [{ kind: "text", text: "把结论记在该批次档案上，并约定下一批需要改变什么。" }],
            ],
          },
        ],
      },
      {
        heading: "把方法升级成验收计划",
        blocks: [
          {
            type: "paragraph",
            text: "记在实验室本子上的方法无法拒收任何东西。让一致性真正具有约束力的那一步，是把这些数字写进采购条款，使双方在同一个进度上量同一件事：",
          },
          {
            type: "definitionList",
            items: [
              { term: "取样", detail: [{ kind: "text", text: "每批取多少样、从哪里取、由谁取。" }] },
              { term: "容差", detail: [{ kind: "text", text: "每个被测量项目需要落入的区间，以及方法本身的温度与浴液容差。" }] },
              { term: "处置界限", detail: [{ kind: "text", text: "什么情况触发复测、什么情况触发技术评审、什么情况直接拒收。" }] },
              { term: "变更通知", detail: [{ kind: "text", text: "原材料、结构、油剂或生产路线的哪些变更必须在发运前告知——因为每一项都能在不动标签的前提下移动溶解曲线。" }] },
              { term: "方法版本控制", detail: [{ kind: "text", text: "给方法一个版本号，使历史批次结果在方法演进之后仍然可比。" }] },
            ],
          },
        ],
      },
      {
        heading: "本文刻意不包含的内容",
        blocks: [
          {
            type: "paragraph",
            text: "这里没有溶解时间、没有强力值、没有断裂强度、没有捻度、没有车速、没有浴比、也没有任何容差被公布。这些恰恰是规格所需要的数字，也是营销页面最喜欢出现的数字；它们应当来自一份针对贵方结构、可供核查的报告，而不应当来自一篇文章。开口去要——你得到的答复本身就是测试。",
          },
          {
            type: "prose",
            spans: [
              { kind: "text", text: "该要什么、以什么形式要，列在 " },
              { kind: "link", text: "订购前应确认的五项规格", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
              { kind: "text", text: "；新供应商的资质评估路径见 " },
              { kind: "link", text: "买家应如何比较中国的 PVA 纱线制造商", href: "/answers/best-pva-water-soluble-yarn-manufacturers-china" },
              { kind: "text", text: "。" },
            ],
          },
        ],
      },
    ],
  },
};
