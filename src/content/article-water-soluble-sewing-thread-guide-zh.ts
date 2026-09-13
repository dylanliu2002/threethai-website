import type { ArticleBody } from "./article-blocks";

/**
 * R5 "Water-soluble sewing thread" — Chinese body.
 *
 * Same section order, block types and link positions as the English body, which
 * `assertAlignedBody` enforces at build time by comparing `bodySignature`. Every string a
 * reader experiences as a whole is Chinese; the specification codes (40S/2) and the
 * temperature values stay as they are, because a buyer matches those against a spec sheet.
 *
 * Vocabulary deliberately kept concrete: 卷装 (package), 针孔 (stitch holes), 终点
 * (removal endpoint), 缝型 (seam type) — the terms the process actually turns on, rather
 * than abstract nouns that no operator can act on.
 */
export const zh: ArticleBody = [
  {
    heading: "一根先起作用、随后离开的线",
    blocks: [
      {
        type: "paragraph",
        text: "水溶性 PVA 缝纫线先形成一个缝线，在缝制、裁剪和搬运过程中把它固定住，最后在水洗工序里离开。它的支撑力正好落在针迹所在的位置上，这与刺绣用的膜或非织造衬布正好相反：衬布把支撑铺在一个面上，缝纫线则把支撑带在一条线上。",
      },
      {
        type: "paragraph",
        text: "这一点决定了两种材料该怎么比。衬布看的是它稳住的那片面积，缝纫线看的是它先固定住、随后放掉的那道缝线。只看温度标签就把两者放在一起比，结果往往是把缝纫线当成衬布来用，问题也不出现在边缘，而是出现在结构中间：该有支撑的那一段没有支撑。",
      },
    ],
  },
  {
    heading: "缝纫线可以承担的三种位置",
    blocks: [
      {
        type: "paragraph",
        text: "在缝纫或刺绣工序里，缝纫线并不总在做同一件事。下面三种位置覆盖了工厂对它的多数用法，而它们对线的要求各不相同。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "临时缝线本身：缝纫线就是那道针迹线，在两块面料或两个部件合拢的过程中把它们固定在一起。" }],
          [{ kind: "text", text: "定位线或引导线：缝纫线把一个部件固定住或标出来，让机器沿着一条之后会被取掉的路线走。" }],
          [{ kind: "text", text: "组装支撑：缝纫线在一道水洗去除的工序里把部件固定住，让裁片能被搬运和叠放，随后再被放开。" }],
        ],
      },
      {
        type: "paragraph",
        text: "第一种就是多数买家说的临时缝线，也是对机针最苛刻的一种：缝纫线要在生产速度下走完一道之后还会被从面料里抽出来的针迹。",
      },
      {
        type: "paragraph",
        text: "另外两种对缝线强度的要求低一些，对稳定性的要求高一些。引导线如果在花型中间断掉，或者支撑在裁片还没搬完时就松脱，机器就失去了它一直在跟随的那个参照。",
      },
    ],
  },
  {
    heading: "缝纫线在每一段工序里做什么",
    blocks: [
      {
        type: "paragraph",
        text: "在这条流程的每一段，缝纫线做的事都不同，而只有最后一段才把它从成品里拿出去。",
      },
      {
        type: "table",
        caption: "缝纫线在每一段工序里做的事",
        columns: ["工序段", "它在做什么"],
        rowHeader: true,
        rows: [
          ["缝制与组装", "它形成缝线或引导线，并在生产速度下把它固定住。"],
          ["裁剪与搬运", "裁片被搬运、修剪和叠放时，它让针迹线保持完整。"],
          ["水洗工序", "它在本面料、染料和辅料都能承受的条件下松开。"],
          ["去除之后", "针迹线已经消失，成品上不再留下任何记号。"],
        ],
      },
      {
        type: "paragraph",
        text: "三泰以 20°C、40°C、55°C、60°C、70°C、80°C 和 90°C 的工艺目标开发水溶性 PVA 系列，目录中 20°C 一档配的是 40S/2 缝纫线，60°C 一档配的是 PVA 缝纫线。",
      },
      {
        type: "paragraph",
        text: "到了真实的缝纫车间，这份清单会很快收窄。去除用的水洗必须在面料、染料和辅料三者都能承受的温度以内，其中最敏感的那一项，就决定了整件成品的水洗上限。",
      },
    ],
  },
  {
    heading: "缝线必须整条消失，而不是只变软",
    blocks: [
      {
        type: "paragraph",
        text: "一条已经变软却没有消失的缝线，仍然占着那道针迹线。它已经拉不住组件，却还留在成品上，而客户第一眼看到的就是针孔和残留。",
      },
      {
        type: "callout",
        label: "打样前先把终点定下来",
        tone: "note",
        text: "变软、丧失缝线强度、完全目视去除是三种不同的结果，其中只有一种是这件成品需要的结果。打样之前把终点写清楚，结果才可重复；一次只报告缝线变弱了的打样，等于没有验收标准。",
      },
      {
        type: "paragraph",
        text: "这也正是值得去找一条低温去除路线的原因。摆在桌面上的备选方案，很少是一条温度更高而成品没有变化的方案，更多的是温度更高、缝线确实去掉了，染料、辅料或手感同时也变了。",
      },
    ],
  },
  {
    heading: "打样之前要先定下来的五件事",
    blocks: [
      {
        type: "paragraph",
        text: "有五件事决定第一次缝纫打样能不能给出可用的答案。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "与缝纫工序匹配的线的支数与合股数。" }],
          [{ kind: "text", text: "机器类型、机针、线迹与缝型结构。" }],
          [{ kind: "text", text: "运行速度，以及由此产生的针温。" }],
          [{ kind: "text", text: "面料、染料和辅料可承受的最高水温。" }],
          [{ kind: "text", text: "去除的终点：缝线强度丧失，还是完全去除。" }],
        ],
      },
      {
        type: "paragraph",
        text: "在寄出样品之前把这五项答清楚，一次打样才不会去测错变量。没有写清终点的打样只会给出一个看法，于是第二次样品花的力气和第一次一样多。",
      },
    ],
  },
  {
    heading: "为什么拉伸结果合格，缝线仍然会断",
    blocks: [
      {
        type: "paragraph",
        text: "在台面上通过拉伸测试的缝纫线，到机器上仍然可能断，而这正是最容易让买家意外的失效方式。实验室的结果测的是受控拉力下的一根散线，而机器缝纫给出的并不是这样一股拉力。",
      },
      {
        type: "paragraph",
        text: "针的状态、导线器、张力、机器速度、卷装的退绕以及缝型设计，各自都会带来实验室那股拉力从未复现的应力。机针在运行时升温，导线器在磨线，卷装还必须顺畅退绕而不能打顿。生产中断线，说明的问题既在纤维上，也在这些条件上。",
      },
    ],
  },
  {
    heading: "要在成品上判断缝线，而不是在一根散线上",
    blocks: [
      {
        type: "paragraph",
        text: "从卷装上抽一段线，只能说明这根线在台面上的表现；对于同一根线缝进真实面料的那道针迹线，它能说明的相当有限，因为机针、面料和机器设定都在参与。",
      },
      {
        type: "paragraph",
        text: "差别来自水进入的方式。在一条开缝里，水几乎立刻就能接触到线；而在致密的刺绣、折边或缝合固定的部件里，水洗必须先把这一层结构浸透，最后被处理到的那一段线，正处在最密的区域里。",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "温度、暴露时间和搅动各自如何改变去除结果，写在" },
          { kind: "link", text: "溶解温度指南", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: "里。同一个问题的批次一侧，写在" },
          { kind: "link", text: "一致性文章", href: "/knowledge/pva-batch-dissolution-consistency" },
          { kind: "text", text: "里；询价时值得一并提供的字段，列在" },
          { kind: "link", text: "规格清单", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: "里。" },
        ],
      },
    ],
  },
  {
    heading: "打样过程中要记下来的内容",
    blocks: [
      {
        type: "paragraph",
        text: "这份记录决定了第二次打样是不是比第一次更省事，也是它把一场样品讨论变成一份规格。",
      },
      {
        type: "definitionList",
        items: [
          { term: "实际缝制的支数、合股与后整理", detail: [{ kind: "text", text: "打样的条件是不是量产要跑的条件" }] },
          { term: "机器、机针、线迹与运行速度", detail: [{ kind: "text", text: "换一台机器能不能复现同样的结果" }] },
          { term: "水洗时保持的温度，以及裁片实际经历的水浴", detail: [{ kind: "text", text: "这条路线能够走到哪个终点" }] },
          { term: "水洗之后的缝线强度，以及留下的残留", detail: [{ kind: "text", text: "成品是干净的，还是仍然带记号" }] },
          { term: "断线发生的位置，以及发生在哪一段", detail: [{ kind: "text", text: "原因在缝纫线，还是在缝纫条件" }] },
        ],
      },
      {
        type: "paragraph",
        text: "这样记下来，一次失败的打样仍然留下有用的东西。只记了线有没有走掉的记录，会让下一次尝试靠猜来挑要动的那个变量。",
      },
    ],
  },
  {
    heading: "第一次打样不成功的时候",
    blocks: [
      {
        type: "paragraph",
        text: "缝纫打样失败通常有四种原因，每一种对应的改动都不同。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "照着温度标签选了一档，却没有核对水洗线能承受多少度。" }],
          [{ kind: "text", text: "缝纫线跑的速度或穿过的机针超出了这道缝线结构能承受的范围，还没走到去除那一步就断了。" }],
          [{ kind: "text", text: "水浴是照着线定的，不是照着面料、染料和辅料定的，于是缝线去掉了，成品也跟着变了。" }],
          [{ kind: "text", text: "打样记下了结论，却没有记条件，于是这次试验没有任何一部分能被重复。" }],
        ],
      },
    ],
  },
  {
    heading: "把你实际在跑的条件寄过来",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "机器、缝型和水洗浴是这场讨论的起点。这道应用在" },
          { kind: "link", text: "刺绣与缝纫", href: "/applications/embroidery-sewing" },
          { kind: "text", text: "页面有更详细的说明；与它配合的两种材料是" },
          { kind: "link", text: "水溶性 PVA 缝纫线", href: "/products/water-soluble-pva-sewing-thread" },
          { kind: "text", text: "和" },
          { kind: "link", text: "水溶性 PVA 纱线", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "；而要开始打样，从" },
          { kind: "link", text: "索取样品", href: "/request-sample" },
          { kind: "text", text: "开始。" },
        ],
      },
      {
        type: "paragraph",
        text: "寄出的是实际条件而不是一个支数，这样才有可能针对那道缝线提出一种结构，而决定实际上正是在这个层面上做出的。后面的数量分成三个独立的问题。一次证明缝线的样品，一次核对机器、水洗线和包装的小批量试产，以及规格锁定之后的生产订单。每一项的数值取决于缝线结构，而不是某个对外公布的单一数字。",
      },
    ],
  },
];
