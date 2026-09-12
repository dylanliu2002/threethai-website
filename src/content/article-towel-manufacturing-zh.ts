import type { ArticleBody } from "./article-blocks";

/**
 * R3 "Water-soluble PVA yarn in towel manufacturing" — Simplified Chinese body.
 *
 * Same shape as the English body, block for block: `assertAlignedBody` compares structural
 * fingerprints and refuses a pair that differs.
 */
export const zh: ArticleBody = [
  {
    heading: "毛巾厂为什么要把一种纱放进去再取出来",
    blocks: [
      {
        type: "paragraph",
        text: "无捻或低捻毛巾，绒头纱在织机上无法自己立住。没有支撑地织造，绒头纱会滑移，钢筘会在布面留下痕迹，织机降速甚至停机。用一根永久性的绑纱能解决这个问题，却制造出更糟的一个：毛巾成品发硬，而当初把绒头拢在一起的那根纱，现在又把水挡在外面。",
      },
    ],
  },
  {
    heading: "织机需要它，成品毛巾不需要它",
    blocks: [
      {
        type: "paragraph",
        text: "支撑必须从整经开始，经织造与毛圈形成一路存在，并且在毛巾到达客户手里之前就不再存在。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "在织机上，它承担绒头纱单独无法承担的张力。" }],
          [{ kind: "text", text: "在毛圈形成过程中，它让地组织保持足够张开，绒头才立得起来。" }],
          [{ kind: "text", text: "在整理水浴中它离开，因此不会残留下来让绒头发硬或挡住吸水。" }],
        ],
      },
    ],
  },
  {
    heading: "这根纱在毛巾流程中的位置",
    blocks: [
      {
        type: "paragraph",
        text: "支撑纱与绒头纱或地纱一起走完整条路线，只有最后一道工序把它去除。",
      },
      {
        type: "table",
        caption: "各工序中 PVA 支撑纱在做什么",
        columns: ["工序", "支撑纱在做什么"],
        rowHeader: true,
        rows: [
          ["整经与络筒", "与绒头纱或地纱同行，并随其一起施加张力。"],
          ["织造与毛圈形成", "在绒头成形期间维持结构。"],
          ["湿加工与后整理", "在整理水浴中去除，条件必须在棉可承受的范围内。"],
          ["整理之后", "只剩下棉的结构，手感、蓬松度与吸水性都在这一步被决定。"],
        ],
      },
      {
        type: "paragraph",
        text: "去除条件的边界由棉决定，而不是由 PVA 决定。荣沣围绕 20°C、40°C、55°C、60°C、70°C、80°C 与 90°C 七个工艺目标研产水溶性 PVA 纱线，而后整理线能承受多少，正是为毛巾缩短这份名单的依据。这条边界往往在谈到价格之前就已经决定了哪个牌号可行，也正是毛巾试验不能按纱线试验来做的原因。",
      },
    ],
  },
  {
    heading: "做试验之前必须先定下的内容",
    blocks: [
      {
        type: "paragraph",
        text: "首次试验有没有机会，由五项内容决定。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "支撑纱支数与棉绒头纱的配比。" }],
          [{ kind: "text", text: "织造张力与结构密度。" }],
          [{ kind: "text", text: "后整理线实际能给到的水温、作用时间与搅动，而不是纱线规格书假定能给的。" }],
          [{ kind: "text", text: "终点：支撑只需丧失强度，还是必须肉眼可见地消失？" }],
          [{ kind: "text", text: "成品毛巾按什么验收。" }],
        ],
      },
    ],
  },
  {
    heading: "在毛巾上判断去除，而不是在烧杯里",
    blocks: [
      {
        type: "paragraph",
        text: "把一段支撑纱放进温水烧杯，这不叫毛巾试验。试验必须使用该系列中最致密的结构和真实的整理配方，因为这两者都会限制水到达纱线、并把溶解聚合物带走的快慢。",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "该试哪个牌号，以及各去除阶段的含义，见 " },
          { kind: "link", text: "溶解温度指南", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: "。本文谈的是毛巾这一端会发生什么。" },
        ],
      },
    ],
  },
  {
    heading: "毛巾试验常见的四种失误",
    blocks: [
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "只凭温度标签选牌号，没有核对该牌号能否扛过后整理线的条件。" }],
          [{ kind: "text", text: "把烧杯里的结果当成了致密毛圈组织的预测。" }],
          [{ kind: "text", text: "浴液按 PVA 来设定、没有按棉来设定，结果毛巾发生的变化恰恰不是试验要测的那一项。" }],
          [{ kind: "text", text: "只记了「掉了」或「没掉」，没有记录浴液条件，于是没有人能重复这次结果。" }],
        ],
      },
    ],
  },
  {
    heading: "试验过程中要记录什么",
    blocks: [
      {
        type: "paragraph",
        text: "记录让第二次试验比第一次便宜，也正是它把一次样品讨论变成一份规格。",
      },
      {
        type: "table",
        caption: "要写下什么，以及它日后决定了什么",
        columns: ["记录项", "它日后决定了什么"],
        rowHeader: true,
        rows: [
          ["实际保持住的浴液温度", "后整理线究竟能不能复现这次试验"],
          ["到达各去除阶段的作用时间", "这条线在手头的时间里能到达哪个终点"],
          ["最致密区域的残留情况", "是否需要更严格的终点"],
          ["干燥后的蓬松度、吸水性与手感", "去除是否损害了毛巾赖以销售的那部分品质"],
          ["整理后的尺寸稳定性", "该改结构还是该改浴液"],
        ],
      },
    ],
  },
  {
    heading: "从毛巾的结构出发",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "请把毛巾的结构和您实际在用的整理配方发给我们。应用细节见 " },
          { kind: "link", text: "毛巾织造与无捻毛巾", href: "/applications/towel-weaving" },
          { kind: "text", text: "，纱线与长丝形态见 " },
          { kind: "link", text: "水溶性 PVA 纱线", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "，取样路径见 " },
          { kind: "link", text: "申请样品", href: "/request-sample" },
          { kind: "text", text: "。询盘清单见 " },
          { kind: "link", text: "订购前应确认的五项规格", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: "。" },
        ],
      },
    ],
  },
];
