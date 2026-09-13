import type { ArticleBody } from "./article-blocks";

/**
 * R4 针织与水溶性 PVA 纱线 — 中文正文。
 *
 * 与 `article-water-soluble-pva-yarn-knitting-en.ts` 逐块对齐（标题、段落、列表、
 * 表格、提示框、术语表、内链位置全部一一对应），因为 `assertAlignedBody` 比较的是结构
 * 指纹，两个语种必须同形。事实来源与英文版一致：`applications.ts` 的 knitting 条目
 * （生产中的问题、三条进入路径、临时性、选型变量、测试建议）、
 * `legacy-source.ts` 产品 technicalOverview 中的七个工艺目标，以及 `patents.ts` 中已授权
 * 的镂空单面针织生产装置 CN 218520715 U。中文版同样不涉及溶解时间、力学数值、捻度、
 * 车速或残留限值——这些在本仓库中都没有公开数据。
 */
export const zh: ArticleBody = [
  {
    heading: "为什么针织物需要一根留不下来的纱",
    blocks: [
      {
        type: "paragraph",
        text: "针织面料、添纱结构或花色纱在织造过程中可能需要一个支撑要素，而这个要素必须在成衣被穿着之前消失。在机织线上，支撑纱通常与能承受高温的组织并排运行；到了针织线上往往做不到，因为紧挨 PVA 的纤维才是限制条件：羊毛、氨纶和细针距纱线经不起热水和强化学处理，一件出缸后手感或形态发生变化的成衣，已经算失败了。",
      },
      {
        type: "paragraph",
        text: "所以这项工作中麻烦的一半是去除，不是支撑。只有在织物其余部分承受不了的条件下才能去除干净的规格，无论它的温度标签写着什么，都不是为这块面料准备的规格。这也是针织询单比机织询单更快缩小候选范围的原因：淘汰规格的是周边纤维，不是 PVA。",
      },
    ],
  },
  {
    heading: "三条进入路径，彼此不可互换",
    blocks: [
      {
        type: "paragraph",
        text: "把水溶性 PVA 放进针织物并没有唯一做法。形态取决于路线中哪一段需要帮助，下面三条路径在机器上和水洗里的表现并不相同。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "添纱或支撑纱与主体纱同时编织，在织物还很松散的时候把线圈结构带住。" }],
          [{ kind: "text", text: "混纺组分被纺进纱线里，PVA 成为纱线自身的一部分，混料必须作为一个整体去牵伸、加捻和编织。" }],
          [{ kind: "text", text: "混纺中的短纤分布在整个混料里，而不是作为自己那一根纱线单独走。" }],
        ],
      },
      {
        type: "paragraph",
        text: "第三条最容易让采购方失手。纤维在混料中开松并分布的均匀程度，比任何单根纤维的强度都重要。结块的混料会留下薄处和厚处，而先断的是薄处，要么在编织时断，要么在本来用来去除支撑的那次水洗里断。",
      },
      {
        type: "paragraph",
        text: "前两条路径在机器上更容易被看见，而这种可见性本身就是个陷阱：一根运行顺畅的添纱纱线，完全不能说明同一根纱线在成圈后被周边纤维包覆起来会怎样表现。",
      },
    ],
  },
  {
    heading: "支撑在针织路线里各段做的事情",
    blocks: [
      {
        type: "paragraph",
        text: "支撑在每个阶段做的工作都不一样，只有最后一个阶段把它取走。",
      },
      {
        type: "table",
        caption: "支撑在各阶段分别做什么",
        columns: ["阶段", "它在做什么"],
        rowHeader: true,
        rows: [
          ["纺纱与前道准备", "带着混料通过牵伸、加捻和卷绕，结构不会塌陷。"],
          ["编织", "织物还很松散时，保持张力均匀。"],
          ["水洗或后整理", "在周边纤维能承受的条件下离开。"],
          ["去除之后", "手感、结构和缩率就此确定，没有东西再改变它们。"],
        ],
      },
      {
        type: "paragraph",
        text: "三泰围绕 20\u00B0C、40\u00B0C、55\u00B0C、60\u00B0C、70\u00B0C、80\u00B0C 和 90\u00B0C 工艺目标开发水溶性 PVA 纱线。放进针织路线之后，这份清单很少还能保持这么宽。水洗必须落在 PVA 旁边羊毛或氨纶能承受的温度之内，而限制水洗的那种纤维，直接决定哪一档规格值得做小样。",
      },
      {
        type: "paragraph",
        text: "这个边界值得说清楚，因为它是大多数初次询单会漏掉的一点：被织进成衣的 PVA 不能自己选择去除条件，是成衣在选择。",
      },
    ],
  },
  {
    heading: "为什么支撑必须完全离开",
    blocks: [
      {
        type: "paragraph",
        text: "支撑只在针织物脆弱的那段时间存在。线圈稳定、面料能保持自己的形状以后，还留在里面的材料已经不再做有用功。",
      },
      {
        type: "callout",
        label: "残留不是中性的",
        tone: "note",
        text: "留下来的东西会改变手感、结构和缩率，而这三项正是针织买家用来判断成衣的属性。把一部分纱线留在面料里的去除路线，不是干净路线的廉价版本，而是另一个产品，差别会在客户第一次水洗之后出现。",
      },
      {
        type: "paragraph",
        text: "这也是低温柔去除路线值得多花力气去找的原因。摆在桌面上的选择很少是一条更高温但可行的水洗，通常是一条更高温、把支撑去掉的同时也把成衣改掉的水洗。",
      },
    ],
  },
  {
    heading: "编织打样之前要先定下来的事",
    blocks: [
      {
        type: "paragraph",
        text: "有五件事决定第一次打样有没有机会。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "材料形态：添纱、纺进纱里的混纺组分，还是混纺中的短纤。" }],
          [{ kind: "text", text: "若是混纺而不是单根走纱，纤维长度和细度要先定。" }],
          [{ kind: "text", text: "编织工艺、机器运行的张力，以及卷装是否适配那台机器。" }],
          [{ kind: "text", text: "去除是否必须在低温下完成，以及针织物其余部分能承受的最高温度。" }],
          [{ kind: "text", text: "成品面料怎么判定：手感、结构、缩率和残留。" }],
        ],
      },
      {
        type: "paragraph",
        text: "在订购样品之前把这些答完，可以避免一次打样变成对错误对象的测试。一次没有写明终点的打样，只能得到一个谁也没法据以行动的结果，第二次尝试的成本和第一次一样。",
      },
    ],
  },
  {
    heading: "镂空这个例子：孔洞就是纱线原本所在的位置",
    blocks: [
      {
        type: "paragraph",
        text: "针织对支撑纱的要求不只是把面料拉住。三泰一项已授权的实用新型 CN 218520715 U（授权日 2023-02-24）保护的是一种采用水溶性纱线制造的镂空单面针织面料的生产装置。纱线被织进结构里，随后被去除，留下的开孔是花型，不是疵点。",
      },
      {
        type: "paragraph",
        text: "描述订单的时候这个区别很重要。把松散针织物带住的支撑纱，和靠去除生成结构的纱线，是同一个材料在干相反的活，打样之前必须说明在测哪一种。",
      },
    ],
  },
  {
    heading: "判断去除效果要看面料，不要看烧杯",
    blocks: [
      {
        type: "paragraph",
        text: "把一段 PVA 纱线丢进温水烧杯，说明的只是这根纱线在烧杯里的表现。同一根纱线织成细针距面料之后情况很不一样：其他纤维把它包覆起来，水洗必须穿过一个抵抗水运动的组织才能接触到它。",
      },
      {
        type: "paragraph",
        text: "造成差别的是接触机会和暴露时长。在松散针织物里，水几乎立刻到达纱线；在紧密的添纱组织里，水必须先渗透面料，最后被溶解的那一段纱线，就在最密的区域里。",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "温度、暴露时长与搅动各自怎样改变结果，" },
          { kind: "link", text: "溶解温度指南", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: "里写得很清楚。换成毛圈结构而不是针织物会有什么变化，在" },
          { kind: "link", text: "毛巾那篇文章", href: "/knowledge/water-soluble-pva-yarn-towel-manufacturing" },
          { kind: "text", text: "里；同一个问题的批次层面，在" },
          { kind: "link", text: "一致性那篇文章", href: "/knowledge/pva-batch-dissolution-consistency" },
          { kind: "text", text: "里。" },
        ],
      },
    ],
  },
  {
    heading: "打样进行时要记录什么",
    blocks: [
      {
        type: "paragraph",
        text: "记录让第二次打样比第一次便宜，也是把一次样品讨论变成一份规格的过程。",
      },
      {
        type: "definitionList",
        items: [
          { term: "实际使用的混纺比或添纱比", detail: [{ kind: "text", text: "这次打样是否等于量产要跑的方案" }] },
          { term: "机型、机号和运行张力", detail: [{ kind: "text", text: "第二台机器能否复现结果" }] },
          { term: "实际保持的水洗温度，以及每个阶段的处理时长", detail: [{ kind: "text", text: "这条路线在允许时间内能到达哪个终点" }] },
          { term: "干燥后的手感、结构和缩率", detail: [{ kind: "text", text: "去除是否改变了成衣销售所依据的产品" }] },
          { term: "在哪里发现残留，残留多少", detail: [{ kind: "text", text: "是否需要换一档规格或延长水洗" }] },
        ],
      },
      {
        type: "paragraph",
        text: "这样写下来，一次没成功的打样也留下了东西。只记录支撑有没有消失的台账，会让下一次尝试只能靠猜哪个变量该动。",
      },
    ],
  },
  {
    heading: "第一次打样不成功的时候",
    blocks: [
      {
        type: "paragraph",
        text: "针织打样通常因为四个原因之一失败，每个原因要求的调整都不一样。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "只照温度标签选规格，没有核对水洗线能保持什么条件。" }],
          [{ kind: "text", text: "混料喂入不匀，纤维结块，面料断在薄处而不是断在支撑上。" }],
          [{ kind: "text", text: "水洗按 PVA 设定，没有按它旁边的纤维设定，结果去除成功了，面料却变了。" }],
          [{ kind: "text", text: "记录了结果却没有记录条件，于是没有一项可以复现。" }],
        ],
      },
    ],
  },
  {
    heading: "把你们真正在跑的路线发过来",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "机型、混料、水洗和判定标准，才是这场对话的起点。这条应用在" },
          { kind: "link", text: "针织与针织纱", href: "/applications/knitting" },
          { kind: "text", text: "有更详细的说明；本文用到的两种形态是" },
          { kind: "link", text: "水溶性 PVA 纱线", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "和" },
          { kind: "link", text: "PVA 短纤", href: "/products/pva-staple-fiber" },
          { kind: "text", text: "；打样从" },
          { kind: "link", text: "索样", href: "/request-sample" },
          { kind: "text", text: "开始。第一次询单之前要准备什么，在" },
          { kind: "link", text: "规格确认清单", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: "里。" },
        ],
      },
      {
        type: "paragraph",
        text: "发来整条路线而不是一个产品名称，才可能按面料来提规格，而决定实际上就是在这一层做的。",
      },
    ],
  },
];
