import type { ArticleBody } from "./article-blocks";

/**
 * R3 "Water-soluble PVA yarn in towel manufacturing" — English body.
 *
 * Copy rules: `docs/audits/resources-editorial-voice.md`. Every statement is grounded in
 * `applications.ts` towel-weaving (the production problem, where the support sits, why it is
 * temporary, the selection variables, the testing guidance) plus the certificate scopes in
 * `quality.ts`. Nothing here states a finishing temperature, a dwell time, a machine speed or
 * a residual limit, because none of those is published in this repository.
 */
export const en: ArticleBody = [
  {
    heading: "Why a towel mill puts a yarn in and then takes it out",
    blocks: [
      {
        type: "paragraph",
        text: "A zero-twist or low-twist towel cannot hold its pile on the loom by itself. Woven without support, the pile yarns slip, the reed marks the face, and the loom slows or stops. A permanent binder yarn solves that and creates a worse problem: the towel finishes stiff, and the yarn that held the pile together now keeps water out of it.",
      },
    ],
  },
  {
    heading: "What the loom needs that the finished towel does not",
    blocks: [
      {
        type: "paragraph",
        text: "The support has to exist from winding through weaving and terry formation, and it has to stop existing before the towel reaches the customer.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "On the loom it carries tension the pile yarn cannot carry on its own." }],
          [{ kind: "text", text: "Through terry formation it keeps the ground structure open enough for the pile to form." }],
          [{ kind: "text", text: "In the finishing bath it leaves, so nothing remains to stiffen the pile or hold water out of it." }],
        ],
      },
    ],
  },
  {
    heading: "Where the yarn sits in the towel process",
    blocks: [
      {
        type: "paragraph",
        text: "The support runs with the pile or ground yarn through the whole route, and only the last stage removes it.",
      },
      {
        type: "table",
        caption: "What the PVA support is doing at each stage",
        columns: ["Stage", "What the support is doing"],
        rowHeader: true,
        rows: [
          ["Winding and warping", "It runs with the pile or ground yarn and is tensioned with it."],
          ["Weaving and terry formation", "It holds the construction while the pile is formed."],
          ["Wet processing and finishing", "It is removed in the finishing bath, under conditions the cotton can tolerate."],
          ["After finishing", "Only the cotton construction remains, and handle, loft and absorbency are decided here."],
        ],
      },
      {
        type: "paragraph",
        text: "The removal conditions are bounded by the cotton rather than by the PVA. Three Thai develops water-soluble PVA yarn around 20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C process targets, and what the finishing line can hold is what narrows that list for a towel. The bound usually settles which grade is viable long before price is discussed, and it is the reason a towel trial cannot be run like a yarn trial.",
      },
    ],
  },
  {
    heading: "What has to be settled before a trial",
    blocks: [
      {
        type: "paragraph",
        text: "Five things decide whether a first trial has a chance.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "Supporting-yarn count relative to the cotton pile yarn." }],
          [{ kind: "text", text: "Weaving tension and the density of the construction." }],
          [{ kind: "text", text: "The water temperature, exposure time and agitation the finishing line can actually deliver, as opposed to what the datasheet of a yarn assumes." }],
          [{ kind: "text", text: "The endpoint: does the support only have to lose strength, or must it be visibly gone?" }],
          [{ kind: "text", text: "How the finished towel will be judged." }],
        ],
      },
    ],
  },
  {
    heading: "Judge removal on the towel, not in a beaker",
    blocks: [
      {
        type: "paragraph",
        text: "A loose length of support yarn in a warm beaker is not a towel trial. The trial has to use the densest construction in the range and the real finishing recipe, because both restrict how quickly water reaches the yarn and carries dissolved polymer away.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Which grade to try, and what each removal stage means, are set out in " },
          { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: ". This article is about what happens in the towel." },
        ],
      },
    ],
  },
  {
    heading: "Four ways a towel trial goes wrong",
    blocks: [
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "A grade chosen from its temperature label, without checking what the finishing line can hold." }],
          [{ kind: "text", text: "A beaker result treated as a prediction for a dense terry pile." }],
          [{ kind: "text", text: "The bath set for the PVA and not for the cotton, so the towel comes out changed in ways the trial was not measuring." }],
          [{ kind: "text", text: "Only \u201Cgone\u201D or \u201Cnot gone\u201D written down, with no bath conditions, so nobody can repeat the result." }],
        ],
      },
    ],
  },
  {
    heading: "What to record while the trial runs",
    blocks: [
      {
        type: "paragraph",
        text: "The record is what makes the second trial cheaper than the first, and it is also what turns a sample discussion into a specification.",
      },
      {
        type: "table",
        caption: "What to write down, and what it settles later",
        columns: ["Recorded", "What it settles"],
        rowHeader: true,
        rows: [
          ["The bath temperature actually held", "Whether the finishing line can reproduce the trial at all"],
          ["Exposure time to each removal stage", "Which endpoint the line can reach in the time it has"],
          ["Residual material in the densest zone", "Whether a stricter endpoint is needed"],
          ["Loft, absorbency and handle after drying", "Whether removal damaged the product the towel is sold on"],
          ["Dimensional stability after finishing", "Whether the construction or the bath needs to change"],
        ],
      },
    ],
  },
  {
    heading: "Start from the towel construction",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Send the towel construction and the finishing recipe you actually run. The application is described in more detail on " },
          { kind: "link", text: "towel weaving and zero-twist", href: "/applications/towel-weaving" },
          { kind: "text", text: ", the yarn and filament forms are under " },
          { kind: "link", text: "water-soluble PVA yarn", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: ", and the sampling route is " },
          { kind: "link", text: "request a sample", href: "/request-sample" },
          { kind: "text", text: ". The pre-inquiry checklist is at " },
          { kind: "link", text: "five specifications to confirm", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: "." },
        ],
      },
    ],
  },
];
