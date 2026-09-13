import type { ArticleBody } from "./article-blocks";

/**
 * R9 — from sample to production, slug `pva-sample-to-production-testing`.
 * Chinese mirror of `article-pva-sample-to-production-testing-en.ts`.
 *
 * Evidence ledger. The trial sequence follows `legacy-source.ts`
 * `products[0].processGuide` (define the temporary function, set a repeatable
 * removal method, approve against the production structure); the five-step sample
 * process is the buyer answer `sample-order-process-pva-water-soluble-yarn`; the
 * seven process targets (20/40/55/60/70/80/90 C) are
 * `products[0].technicalOverview`; the bath vocabulary is `catalog.ts`; the two
 * closing routes are the registered `/quality` and `/request-sample` pages.
 *
 * Structure mirrors the English body block for block: same section count, same
 * block types and order, same table dimensions and header flag, same callout tone,
 * same prose span kinds, same list and definitionList item counts. No dissolution
 * time, mechanical value, twist figure, machine speed, residue limit, quantity,
 * lead time or price is stated.
 */
export const zh: ArticleBody = [
  {
    heading: "先把要做的事写下来，再谈订样",
    blocks: [
      {
        type: "paragraph",
        text: "试做是用来回答一个已经写清楚的问题的。如果需求里只写“纱要能溶解”，这次试做得到的结果就没有人能读，第二次取样也只能靠猜。真正让试做有用的工作发生在寄样之前，落在给这种临时材料的一份简短说明里。",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "支撑纱线在组织结构里的位置，以及它在织物成型过程中承担什么。" }],
          [{ kind: "text", text: "退除之前它要经历的处理，络筒、织造、编织、缝制或湿加工都属于这一类。" }],
          [{ kind: "text", text: "在流程的哪一步它必须已经退干净，以及由哪一浴来完成退除。" }],
          [{ kind: "text", text: "这一浴实际的运行条件：温度区间、缸体水量、浴比、液体流动方式，以及织物在浴中停留的时间。" }],
          [{ kind: "text", text: "退除阶段浴中已经存在的化学品。" }],
          [{ kind: "text", text: "对成品来说什么算退除完成，并且要写成操作工能看见或能测量的东西。" }],
        ],
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "材料的形式会随这份说明一起收窄。" },
          { kind: "link", text: "水溶性 PVA 纱线系列", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "列出了第一次开发试做要在克重、结构和卷装之间做的取舍。" },
        ],
      },
    ],
  },
  {
    heading: "选一个要试的规格，不是要买的规格",
    blocks: [
      {
        type: "paragraph",
        text: "候选规格是照着说明选的，温度标号只是第一道筛选，不是答案。Three Thai 的水溶性 PVA 纱线围绕七个工艺目标开发：20\u00B0C、40\u00B0C、55\u00B0C、60\u00B0C、70\u00B0C、80\u00B0C 和 90\u00B0C。第一道筛选要问的是，织物在退除阶段能承受其中哪一个，而不伤到纤维、染料或整理。",
      },
      {
        type: "paragraph",
        text: "第二道筛选看浴里其余的条件。浸泡时间、浴比、液体流动、织物的紧密程度以及浴中的化学品，都会在同一个温度标号之内把结果推向不同的方向。在烧杯里按试做温度退得很干净的规格，到了机器上的同一缸水里可能大部分还在，因为两个浴除了标号上的那个数字以外，没有一样是一样的。",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "各个标号承诺什么、不承诺什么，写在" },
          { kind: "link", text: "PVA 纱线溶解温度指南", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: "里。这份内容应该在寄出说明之前读，而不是在第一次试做失败之后。" },
        ],
      },
      {
        type: "paragraph",
        text: "第一次试做带两个候选规格，不要带五个。两个规格对着同一份说明比，能得出一个判断，而这个判断正是写说明的目的。五个规格只会摆出一排没有标注的样品，然后留下一个“哪个是哪个”的问题。",
      },
    ],
  },
  {
    heading: "第一次试做，用能说明问题的最小规模",
    blocks: [
      {
        type: "paragraph",
        text: "第一次试做要用能复现工艺的最小一块料，这跟最省事的那块料不是一回事。烧杯里一绞松散的纱退得很快，同一根纱织进密实的布片之后要慢得多，因为前者水能进到每一根单丝，后者只接触到表面。",
      },
      {
        type: "paragraph",
        text: "退除之前的工序顺序也要照着走一遍。如果大货里织物在退除浴之前会经过烘干、热定形或缝制，试做样就必须先走过这些步骤，再进自己的浴。拿一块新样洗一洗，再去跟一块走过整理的成品比，比的是两种不同的料，却把差别当成规格本身的性能报出来。",
      },
      {
        type: "paragraph",
        text: "下料之前先把条件写死：试样重量和长度、水量、温度及其允许偏差、浴的搅动方式，以及操作工要观察的几个时点。两个人照着同一张记录单，应该得到同一个结果；对不上的时候，是记录单缺了东西，而不是材料本身不可测。",
      },
    ],
  },
  {
    heading: "看试做结果，不能只看最后是否消失",
    blocks: [
      {
        type: "paragraph",
        text: "消失是最后发生的事，也是信息量最少的事。在它之前，材料先被水润湿，再软化，接着失去原来撑着组织结构的那一点强力，最后碎成小块。这几步里哪一步影响判断，取决于要做的事；一段临时缝线只要把接缝撑到缝完就算完成了任务，远在最后一点痕迹消失之前。",
      },
      {
        type: "table",
        caption: "一份不在现场的人也能看懂的试做记录该有的样子",
        columns: ["记录项", "记什么", "它确定了什么"],
        rowHeader: true,
        rows: [
          ["规格与标识", "试做的规格，它的批号或样品编号，以及克重和结构", "这个结果是否属于将要下单的那批料"],
          ["用途与工序", "材料在结构里的位置，以及退除之前走过的流程", "这次试做复现的是真实工序，还是走了台面上的捷径"],
          ["各个终点的观察", "润湿、软化、失强和可见退除各自的时间，旁边写上对应的浴条件", "材料实际走到了哪一步，退除停在哪里"],
          ["对照标准的结果", "成品是否达到书面的验收标准，以及没有达到的地方", "规格能否批准，还有哪些地方要改"],
          ["下一次的调整", "下一次试做之前要改的那一个条件，以及要保持不变的条件", "下一次试做只隔离一个变量，而不是同时动好几项"],
        ],
      },
      {
        type: "paragraph",
        text: "按这个格式记下来的东西，回答的是照片回答不了的问题。它记的是材料走到了哪一步、在什么浴条件下走到那一步、还剩下什么要改，而不是只说样品放进去了、没有出来。",
      },
    ],
  },
  {
    heading: "两次试做之间只改一个变量，其余保持不变",
    blocks: [
      {
        type: "paragraph",
        text: "试做不达标的时候，很容易一边升温度一边延长浴时间，因为这两个动作作用在同一个症状上。如果下一次试做因此成功了，就说不清是哪一个改动起了作用，之后大货的浴也没法收紧，因为一收紧就会动摇它依赖的那个结果。",
      },
      {
        type: "definitionList",
        items: [
          { term: "润湿", detail: [{ kind: "text", text: "纤维不再抗拒水、开始吸水时的第一个可见变化" }] },
          { term: "软化", detail: [{ kind: "text", text: "材料在它原本承受的操作负荷下不再保持形状的那一点" }] },
          { term: "失强", detail: [{ kind: "text", text: "它所支撑的组织结构不能再依靠它的那一点" }] },
          { term: "可见退除", detail: [{ kind: "text", text: "在约定的距离和光线下，操作工还能看到的最后一点痕迹" }] },
        ],
      },
      {
        type: "paragraph",
        text: "这四个终点不能互换，只报最后一个的试做记录，丢掉的恰好是指出改动该往哪里落的另外三个。除了被测的那一个条件，其余全部保持不变，而那个条件要按既定的步长去动，不能凭操作工觉得差不多了就算。",
      },
    ],
  },
  {
    heading: "在大货结构上验证，再批准批量",
    blocks: [
      {
        type: "paragraph",
        text: "小试成功只是一个候选，不是批准。大货结构里最密的位置、走完整染整流程的织物，以及带自身水流方式的真实染缸，是台面试做漏掉的三件事。把这三件事一件一件补回来，再把规格写进订单。",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "批准的依据应该是质量记录，而不是单件样品，所以" },
          { kind: "link", text: "质量页面", href: "/quality" },
          { kind: "text", text: "写明了工厂保留什么、买方可以索要什么，而" },
          { kind: "link", text: "索样入口", href: "/request-sample" },
          { kind: "text", text: "是开发试做的起点。这两者都不能代替在大货结构上跑一遍。" },
        ],
      },
      {
        type: "paragraph",
        text: "验证也是约定从样品到大货这一段的场合：哪些条件锁定、工厂能守住哪些偏差、测量超出偏差时怎么处理、哪些改动需要在发货前得到买方同意。得出批准结果的那组条件，要跟规格一起走下去，这样后面的批次对照的是一份书面方法，而不是对某一件样品的记忆。",
      },
    ],
  },
  {
    heading: "把批准的工艺条件写进规格书",
    blocks: [
      {
        type: "paragraph",
        text: "一次成功的试做产出的是一组条件，这组条件和克重、强力一样，属于规格书的一部分。把温度及其允许偏差、浴、停留时间、浴中存在的化学品以及被认可的终点写进去，并用标识引用已批准的样品，让记录和材料能一一对上。",
      },
      {
        type: "callout",
        label: "一份记录，两个读者",
        tone: "note",
        text: "同一张单子，既要能让操作工把浴设好，也要能让买方确认进来的这批料是用同样的方式做出来、测出来的。它只服务其中一方的时候，这次试做就得重跑，两边才谈得上信任它。",
      },
      {
        type: "paragraph",
        text: "然后把这组条件固定下来。规格、结构、整理或者退除浴发生改变，批准就重新变成问题，直到再跑一次试做；第二次的成本比第一次低，因为记录已经写明要动的是哪一个条件。",
      },
    ],
  },
];
