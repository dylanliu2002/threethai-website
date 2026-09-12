import type { ArticleBody } from "./article-blocks";

/**
 * R1 "What is water-soluble PVA yarn?" — Simplified Chinese body.
 *
 * Same shape as the English body, block for block: `assertAlignedBody` compares structural
 * fingerprints and refuses a pair that differs, so a missing list item or an extra paragraph
 * stops the build rather than shipping half a translation.
 */
export const zh: ArticleBody = [
  {
    heading: "一种买来就是为了消失的纱",
    blocks: [
      {
        type: "paragraph",
        text: "工厂采购的绝大多数纱线，都要一直留在成品里。棉、涤纶、羊毛和普通缝纫线，都是按「客户穿着时它还在」来选的。水溶性 PVA 纱线是为相反的目的采购的：它进入织物结构，在织造过程中承担一项任务，然后在工厂指定的工序节点上，在水浴中离开。",
      },
    ],
  },
  {
    heading: "这种材料是什么",
    blocks: [
      {
        type: "paragraph",
        text: "PVA 即聚乙烯醇。荣沣把它纺成纱线与纤维，而不是当作化工原料销售。一个牌号的界定依据是它在什么水条件下溶解，而不是某一个温度数字。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "它溶于水，但不是一接触就消失。水温、作用时间、水的流动、浴比以及周围织物的密度，共同决定去除实际在什么时候完成。" }],
          [{ kind: "text", text: "它是临时元件。它占着一个纱线该占的位置，然后离开，不会作为涂层或整理剂留下来。" }],
          [{ kind: "text", text: "凡有认证的，范围都窄到可以逐项核对。" }],
        ],
      },
      {
        type: "callout",
        label: "请核对证书的范围行",
        tone: "note",
        text: "原白色水溶性 PVA 纱线取得 OEKO-TEX Standard 100 I 类（婴幼儿级）认证，有效期至 2027 年 1 月 31 日。ISO 9001 覆盖的是水溶性 PVA 纱线生产与水溶性 PVA 纤维销售的质量管理体系。两份文件都没有说明某一批次在贵方浴液中的表现，也都不覆盖它没有写明的颜色或结构。",
      },
    ],
  },
  {
    heading: "工厂为什么要把一种纱放进去再取出来",
    blocks: [
      {
        type: "paragraph",
        text: "有些结构没有临时支撑就织不出来，有些功能必须在成品完成之前就不再存在。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "在织造中承担张力——当绒头纱或地纱自身无法站立时。" }],
          [{ kind: "text", text: "把结构撑开，直到它稳定到能维持自己的形状。" }],
          [{ kind: "text", text: "在刺绣与缝合中固定位置，之后不再受力。" }],
          [{ kind: "text", text: "占住一处之后必须空出来的位置，例如成品中的通道或孔隙。" }],
        ],
      },
      {
        type: "paragraph",
        text: "去除要像其他任何工序一样写清规格：水温、作用时间、搅动，以及工厂判定纱线已消失的那个节点。没有被告知这个节点的供应商，无法把牌号与之对应。",
      },
    ],
  },
  {
    heading: "目前用在哪些地方",
    blocks: [
      {
        type: "paragraph",
        text: "下面每个应用都有独立页面，因为它们各自是不同的生产问题，而不是同一个问题的不同版本。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [
            { kind: "link", text: "毛巾织造与无捻毛巾", href: "/applications/towel-weaving" },
            { kind: "text", text: "：绒头与低捻纱需要在织机上获得支撑。" },
          ],
          [
            { kind: "link", text: "刺绣与临时缝合", href: "/applications/embroidery-sewing" },
            { kind: "text", text: "：接缝与导引只在拼装完成前保持位置。" },
          ],
          [
            { kind: "link", text: "针织，包括镂空组织", href: "/applications/knitting" },
            { kind: "text", text: "。一件已授权生产装置 CN 218520715 U，覆盖的是采用水溶纱制造镂空单面针织面料。" },
          ],
          [
            { kind: "link", text: "造纸", href: "/applications/papermaking" },
            { kind: "text", text: "：短切纤维进入浆料。" },
          ],
          [
            { kind: "link", text: "产业用纺织品与复合材料", href: "/applications/technical-textiles" },
            { kind: "text", text: "：用于临时通道与支撑结构。" },
          ],
        ],
      },
    ],
  },
  {
    heading: "四种形态，以及为什么名称很重要",
    blocks: [
      {
        type: "paragraph",
        text: "询盘常常只写「水溶性 PVA」，不写形态。这四种形态进入工序的位置不同，规格变量也不同，所以名称决定了会寄回哪一种样品。",
      },
      {
        type: "table",
        caption: "四种形态、各自是什么，以及买方要指定什么",
        columns: ["形态", "是什么", "需要指定什么"],
        rowHeader: true,
        rows: [
          ["PVA 纱线", "用于织造、针织与临时支撑的短纤纱", "支数体系、单纱或合股、捻度、强度与伸长率、目标温度"],
          ["缝纫线", "为缝合工序准备的纱线", "线密度与股数、设备与机针、临时缝强度、去除温度"],
          ["长丝", "用于产业用与复合材料加工的连续长丝", "长丝结构、强度与伸长率、运行张力、溶解曲线"],
          ["短纤", "用于混纺、无纺与分散工艺的短切纤维", "长度与细度、分散性、强度目标、水溶或保留要求"],
        ],
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "作为材料形态，纱线与长丝的对比见 " },
          { kind: "link", text: "PVA 短纤与长丝", href: "/knowledge/pva-staple-fiber-vs-filament-yarn" },
          { kind: "text", text: "。" },
        ],
      },
    ],
  },
  {
    heading: "溶解温度没有告诉你的那些事",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "荣沣围绕 " },
          {
            kind: "link",
            text: "20°C、40°C、55°C、60°C、70°C、80°C 与 90°C 七个工艺目标",
            href: "/products/water-soluble-pva-yarn",
          },
          { kind: "text", text: "研产水溶性 PVA 纱线，具体支数与当前可生产范围在评估买方工艺之后确认。" },
        ],
      },
      {
        type: "paragraph",
        text: "一个牌号研发所指向的温度区间，并不等于一份去除规格。它不说明材料可以湿多久、有多少水在它表面流动，也不说明下一道工序开始前必须达到什么状态。润湿、软化、丧失强度、肉眼可见消失是四个独立事件，书面的方法必须写明你买的是哪一个。",
      },
    ],
  },
  {
    heading: "索取样品之前应当先定下的内容",
    blocks: [
      {
        type: "paragraph",
        text: "询盘里先把这五项答清楚，第一次样品就更容易匹配。",
      },
      {
        type: "table",
        caption: "决定寄出哪个样品的五项答复",
        columns: ["问题", "它决定了什么"],
        rowHeader: true,
        rows: [
          ["PVA 放在哪里，又必须在哪里消失", "材料按哪个应用来匹配"],
          ["去除之前的温度与化学品", "较低或较高的牌号能否扛过前面的湿工序"],
          ["支数或纤维规格", "报价的是哪种形态与结构"],
          ["去除如何判定", "样品将按哪个终点评估"],
          ["试样数量、包装与预计订单", "第一步是样品、中试还是量产"],
        ],
      },
    ],
  },
  {
    heading: "荣沣如何接手一个新应用",
    blocks: [
      {
        type: "paragraph",
        text: "开发从工艺出发，而不是从目录中的一个料号出发。",
      },
      {
        type: "list",
        ordered: true,
        items: [
          [{ kind: "text", text: "描述应用，以及 PVA 元件要承担的那项任务。" }],
          [{ kind: "text", text: "固定要求：结构、温度、化学品、去除终点、数量。" }],
          [{ kind: "text", text: "按这些要求匹配产品形态与牌号。" }],
          [{ kind: "text", text: "寄出可追溯样品，在生产代表性的材料上做试验。" }],
          [{ kind: "text", text: "按书面方法与约定终点评估这次试验。" }],
          [{ kind: "text", text: "把确认的规格、批次控制与包装带入供货。" }],
        ],
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "规格、证书与报告参数公布在 " },
          { kind: "link", text: "质量页面", href: "/quality" },
          { kind: "text", text: "，材料形态说明见 " },
          { kind: "link", text: "水溶性 PVA 纱线", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "。" },
        ],
      },
    ],
  },
  {
    heading: "如果这个应用比较特殊",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "告诉我们您生产什么，以及 PVA 元件要在哪一步不再存在。接下来可以看：" },
          { kind: "link", text: "溶解温度指南", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: "、" },
          { kind: "link", text: "五项规格询单清单", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: "，或直接 " },
          { kind: "link", text: "申请样品", href: "/request-sample" },
          { kind: "text", text: "。" },
        ],
      },
    ],
  },
];
