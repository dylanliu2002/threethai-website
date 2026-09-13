import type { ArticleBody } from "./article-blocks";

/**
 * R4 "Water-soluble PVA yarn in knitting and knitwear" — English body.
 *
 * Copy rules: `docs/audits/resources-editorial-voice.md`. Every statement is grounded in
 * `applications.ts` knitting (the production problem, the three routes in, why it is
 * temporary, the selection variables, the testing guidance) and in the certificate and
 * patent record: the seven dissolution process targets come from
 * `legacy-source.ts` products[0].technicalOverview, and `CN 218520715 U` is the granted
 * utility model for the openwork single-jersey production device in `patents.ts`.
 *
 * Nothing here states a dissolution time, a mechanical value, a twist figure, a machine
 * speed or a residue limit, because none of those is published in this repository.
 */
export const en: ArticleBody = [
  {
    heading: "Why a knit needs a yarn that will not stay",
    blocks: [
      {
        type: "paragraph",
        text: "A knitted fabric, a plated knit or a fancy yarn can need a supporting element while it is being made, and that element has to be gone before the garment is worn. On a weaving line the supporting yarn usually runs beside a construction that can take heat. On a knitting line it often cannot, because the fibres next to the PVA are the ones that set the limit: wool, elastane and fine-gauge yarns do not come back from hot water and aggressive chemistry, and a garment that comes out of the wash changed in shape or in hand feel has already failed.",
      },
      {
        type: "paragraph",
        text: "The awkward half of the job is therefore removal, not support. A grade that removes cleanly only under conditions the rest of the knit cannot take is not a grade for this fabric, whatever its temperature label says. That is why a knitwear enquiry narrows the candidate list faster than a woven one: the surrounding fibres, not the PVA, are what rule grades out.",
      },
    ],
  },
  {
    heading: "Three routes in, and they are not interchangeable",
    blocks: [
      {
        type: "paragraph",
        text: "There is no single way to put water-soluble PVA into a knit. The form follows the point in the route where the knitting needs help, and the three routes below behave differently on the machine and in the wash.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "A plating or support yarn is knitted alongside the main yarn, so the loop structure is carried while the knit is still loose." }],
          [{ kind: "text", text: "A blend component spun into the yarn makes the PVA part of the yarn itself, so the blend has to be drafted, twisted and knitted as one material." }],
          [{ kind: "text", text: "Staple fibre in the blend is distributed through the mix rather than running as its own thread." }],
        ],
      },
      {
        type: "paragraph",
        text: "The third route is the one that catches buyers out. How evenly the fibre opens and distributes through the blend matters more than how strong any single fibre is. A blend that clumps leaves thin places and thick places, and the thin places are where the knit gives way, either while it is being knitted or during the wash that is meant to remove the support.",
      },
      {
        type: "paragraph",
        text: "The first two routes are more visible on the machine, and that visibility is a trap of its own: a plating yarn that runs without trouble says nothing about how the same yarn behaves once it is wrapped by the surrounding fibres inside a finished loop.",
      },
    ],
  },
  {
    heading: "Where the support sits in a knitwear route",
    blocks: [
      {
        type: "paragraph",
        text: "The support does different work at each stage, and only the last stage takes it out.",
      },
      {
        type: "table",
        caption: "What the support does at each stage",
        columns: ["Stage", "What it is doing"],
        rowHeader: true,
        rows: [
          ["Spinning and preparation", "It carries the blend through drafting, twisting and winding."],
          ["Knitting", "It holds an even tension while the fabric is still loose."],
          ["Washing or finishing", "It leaves under conditions the fibres beside it can take."],
          ["After removal", "Hand feel, structure and shrinkage are settled, with nothing left to change them."],
        ],
      },
      {
        type: "paragraph",
        text: "Three Thai develops water-soluble PVA yarn around 20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C process targets. Inside a knitwear route that list rarely stays that wide. The wash has to remain inside the temperature the wool or the elastane beside the PVA can take, and whichever fibre limits the wash decides which grade is worth a trial at all.",
      },
      {
        type: "paragraph",
        text: "It is worth stating the bound plainly, because it is the point most first enquiries miss: a PVA knitted into a garment does not get to choose its own removal conditions. The garment chooses them.",
      },
    ],
  },
  {
    heading: "Why the support has to leave completely",
    blocks: [
      {
        type: "paragraph",
        text: "The support exists only while the knit is fragile. Once the loops have settled and the fabric holds its own shape, material still inside it has stopped doing useful work.",
      },
      {
        type: "callout",
        label: "Residue is not neutral",
        tone: "note",
        text: "What stays behind changes hand feel, structure and shrinkage \u2014 the three properties a knitwear buyer judges the garment on. A removal route that leaves part of the yarn in the fabric is not a cheaper version of a clean one; it is a different product, and the difference appears after the garment has been washed by the customer.",
      },
      {
        type: "paragraph",
        text: "That is also why a low-temperature removal route is worth the extra work of finding one. The alternative on the table is seldom a hotter wash that works; it is a hotter wash that takes the support out and changes the garment at the same time.",
      },
    ],
  },
  {
    heading: "What to settle before a knitting trial",
    blocks: [
      {
        type: "paragraph",
        text: "Five things decide whether a first trial has a chance.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "The material form: a plating yarn, a blend component spun in, or staple fibre in the blend." }],
          [{ kind: "text", text: "Fibre length and fineness, if the PVA is blended rather than run as its own thread." }],
          [{ kind: "text", text: "The knitting process, the tension the machine runs at, and whether the package suits that machine." }],
          [{ kind: "text", text: "Whether removal has to work at low temperature, and the highest temperature the rest of the knit can take." }],
          [{ kind: "text", text: "How the finished fabric will be judged: hand feel, structure, shrinkage and residue." }],
        ],
      },
      {
        type: "paragraph",
        text: "Answering these before a sample is ordered is what keeps a trial from becoming a test of the wrong thing. A trial run without a stated endpoint produces a result nobody can act on, and the second attempt then costs as much as the first.",
      },
    ],
  },
  {
    heading: "The openwork case: the holes are where the yarn was",
    blocks: [
      {
        type: "paragraph",
        text: "Knitting does not only ask a support yarn to hold a fabric together. A granted Three Thai utility model, CN 218520715 U, granted 2023-02-24, covers the production device for an openwork single-jersey knit made with a water-soluble yarn. The yarn is knitted in as part of the structure and then removed, and the openings it leaves are the pattern rather than a fault.",
      },
      {
        type: "paragraph",
        text: "The distinction matters when the job is described. A support yarn that carries a loose knit and a yarn whose removal creates the structure are the same material doing opposite work, and a trial has to state which one it is testing before the sample is sent.",
      },
    ],
  },
  {
    heading: "Judge removal on the fabric, not in a beaker",
    blocks: [
      {
        type: "paragraph",
        text: "A length of PVA yarn dropped into a warm beaker shows how that yarn behaves in a beaker. It says much less about the same yarn knitted into a fine-gauge fabric, where other fibres wrap it and the wash has to reach it through a structure that resists water movement.",
      },
      {
        type: "paragraph",
        text: "Access and exposure are what make the difference. In a loose knit, water reaches the yarn almost at once. In a tight plated construction it has to penetrate the fabric first, and the part of the yarn that goes last is the part sitting in the densest zone.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "How temperature, exposure time and agitation each change the result is set out in " },
          { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: ". What changes when the support sits inside a terry structure instead of a knit is in " },
          { kind: "link", text: "the towel article", href: "/knowledge/water-soluble-pva-yarn-towel-manufacturing" },
          { kind: "text", text: ", and the batch-to-batch side of the same question is in " },
          { kind: "link", text: "the consistency article", href: "/knowledge/pva-batch-dissolution-consistency" },
          { kind: "text", text: "." },
        ],
      },
    ],
  },
  {
    heading: "What to write down while the trial runs",
    blocks: [
      {
        type: "paragraph",
        text: "The record is what makes the second trial cheaper than the first, and it is also what turns a sample discussion into a specification.",
      },
      {
        type: "definitionList",
        items: [
          { term: "The blend or plating ratio actually run", detail: [{ kind: "text", text: "Whether the trial matches what production will run" }] },
          { term: "Machine, gauge and running tension", detail: [{ kind: "text", text: "Whether a second machine reproduces the result" }] },
          { term: "The wash temperature held, and the time at each stage", detail: [{ kind: "text", text: "Which endpoint the route can reach" }] },
          { term: "Hand feel, structure and shrinkage after drying", detail: [{ kind: "text", text: "Whether removal changed the product the garment is sold on" }] },
          { term: "Where residue was found, and how much of it", detail: [{ kind: "text", text: "Whether another grade or a longer wash is needed" }] },
        ],
      },
      {
        type: "paragraph",
        text: "Written down this way, a trial that does not work still produces something. A record that says only whether the support disappeared leaves the next attempt to guess which variable to move.",
      },
    ],
  },
  {
    heading: "When the first trial does not work",
    blocks: [
      {
        type: "paragraph",
        text: "A knitting trial usually fails for one of four reasons, and each of them calls for a different change.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "The grade was chosen from its temperature label without checking what the wash line can hold." }],
          [{ kind: "text", text: "The blend was fed unevenly, so the fibre clumped and the fabric failed in the thin places rather than at the support." }],
          [{ kind: "text", text: "The wash was set for the PVA and not for the fibre beside it, so removal worked and the fabric came out changed." }],
          [{ kind: "text", text: "The trial recorded an outcome but not the conditions, so nothing about it can be repeated." }],
        ],
      },
    ],
  },
  {
    heading: "Send the route you actually run",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "The machine, the blend, the wash and the judgement are what the conversation starts from. The application is described in more detail on " },
          { kind: "link", text: "knitting and knitwear", href: "/applications/knitting" },
          { kind: "text", text: "; the two forms used in this article are " },
          { kind: "link", text: "water-soluble PVA yarn", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: " and " },
          { kind: "link", text: "PVA staple fibre", href: "/products/pva-staple-fiber" },
          { kind: "text", text: "; and " },
          { kind: "link", text: "a sample request", href: "/request-sample" },
          { kind: "text", text: " is where the trial begins. What to have ready before the first enquiry is in " },
          { kind: "link", text: "the specification checklist", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: "." },
        ],
      },
      {
        type: "paragraph",
        text: "Sending the route rather than a product name is what allows a grade to be proposed against the fabric, which is the level at which the decision is actually made.",
      },
    ],
  },
];
