import type { ArticleBody } from "./article-blocks";

/**
 * R1 "What is water-soluble PVA yarn?" — English body.
 *
 * Split from the spec module so one tool call never carries two long locales. Copy rules:
 * `docs/audits/resources-editorial-voice.md`. Sources for every figure are listed in
 * `article-additions.ts`.
 */
export const en: ArticleBody = [
  {
    heading: "A yarn that is bought to disappear",
    blocks: [
      {
        type: "paragraph",
        text: "Almost every yarn a mill buys has to survive into the finished article. Cotton, polyester, wool and ordinary sewing thread are selected to still be there when the customer wears the garment. Water-soluble PVA yarn is bought for the other reason. It goes into the construction, does a job while the fabric is being made, and then leaves in a water bath at a stage the mill chooses.",
      },
    ],
  },
  {
    heading: "What the material is",
    blocks: [
      {
        type: "paragraph",
        text: "PVA is polyvinyl alcohol, spun into yarn and fibre rather than sold as a chemical. A grade is defined by the water conditions under which it dissolves, not by one temperature number.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "It dissolves in water, but not on contact. Temperature, exposure time, water movement, bath ratio and the surrounding fabric together decide when removal actually finishes." }],
          [{ kind: "text", text: "It is a temporary element. It occupies the place a yarn occupies and then leaves, rather than staying as a coating or a finish." }],
          [{ kind: "text", text: "Where it is certified, the scope is narrow enough to check." }],
        ],
      },
      {
        type: "callout",
        label: "Check the scope line",
        tone: "note",
        text: "The raw-white PVA water-soluble yarn is OEKO-TEX Standard 100 certified at Class I, the baby-articles class, valid to 31 January 2027. ISO 9001 covers the management system for producing water-soluble PVA yarn and selling water-soluble PVA fibre. Neither document says how a particular batch behaves in your bath, and neither covers a colour or a construction it does not name.",
      },
    ],
  },
  {
    heading: "Why a mill puts a yarn in only to take it out",
    blocks: [
      {
        type: "paragraph",
        text: "Some constructions cannot be made without temporary support, and some functions have to stop existing before the article is finished.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "Carry tension through weaving, where the pile or ground yarn cannot hold itself." }],
          [{ kind: "text", text: "Hold a structure open until it is stable enough to keep its own shape." }],
          [{ kind: "text", text: "Position parts during embroidery and stitching, then stop holding." }],
          [{ kind: "text", text: "Occupy space that has to be empty afterwards, such as a channel or a pore in the finished material." }],
        ],
      },
      {
        type: "paragraph",
        text: "Removal is specified like any other process step: water temperature, exposure time, movement, and the stage at which the mill declares the yarn gone. A supplier who is not told that stage cannot match a grade to it.",
      },
    ],
  },
  {
    heading: "Where it is used now",
    blocks: [
      {
        type: "paragraph",
        text: "Each application below has its own page, because each one is a different production problem rather than a different version of the same one.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [
            { kind: "link", text: "Towel weaving and zero-twist", href: "/applications/towel-weaving" },
            { kind: "text", text: ", where pile and low-twist yarns need support on the loom." },
          ],
          [
            { kind: "link", text: "Embroidery and temporary stitching", href: "/applications/embroidery-sewing" },
            { kind: "text", text: ", where seams and guides hold position only until assembly is finished." },
          ],
          [
            { kind: "link", text: "Knitting, including openwork", href: "/applications/knitting" },
            { kind: "text", text: ". A registered production device, CN 218520715 U, covers making openwork single-jersey fabric with a water-soluble yarn." },
          ],
          [
            { kind: "link", text: "Papermaking", href: "/applications/papermaking" },
            { kind: "text", text: ", where short-cut fibre goes into the furnish." },
          ],
          [
            { kind: "link", text: "Technical textiles and composites", href: "/applications/technical-textiles" },
            { kind: "text", text: ", for temporary channels and support structures." },
          ],
        ],
      },
    ],
  },
  {
    heading: "Four forms, and why the name matters",
    blocks: [
      {
        type: "paragraph",
        text: "Enquiries often ask for \u201Cwater-soluble PVA\u201D without naming the form. The four forms enter the process at different points and are specified by different variables, so the name decides which sample comes back.",
      },
      {
        type: "table",
        caption: "The four forms, what each one is, and what buyers specify",
        columns: ["Form", "What it is", "What you specify"],
        rowHeader: true,
        rows: [
          ["PVA yarn", "Spun yarn for weaving, knitting and temporary support", "Count system, single or plied, twist, strength and elongation, target temperature"],
          ["Sewing thread", "Yarn prepared for stitching operations", "Thread count and ply, machine and needle, temporary seam strength, removal temperature"],
          ["Filament yarn", "Continuous filament for technical and composite processing", "Filament construction, strength and elongation, running tension, dissolution profile"],
          ["Staple fibre", "Short-cut fibre for blending, nonwoven and dispersion routes", "Length and fineness, dispersion, strength targets, solubility or retention"],
        ],
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Yarn and filament as material forms are compared in " },
          { kind: "link", text: "PVA staple fibre vs filament yarn", href: "/knowledge/pva-staple-fiber-vs-filament-yarn" },
          { kind: "text", text: "." },
        ],
      },
    ],
  },
  {
    heading: "What a dissolution temperature does not tell you",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Three Thai develops water-soluble PVA yarn around " },
          {
            kind: "link",
            text: "20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C process targets",
            href: "/products/water-soluble-pva-yarn",
          },
          { kind: "text", text: ", and confirms the exact count and current production range after the buyer's process has been reviewed." },
        ],
      },
      {
        type: "paragraph",
        text: "The band a grade was developed toward is not the same thing as a removal specification. It does not state how long the material may stay wet, how much water moves across it, or what has to be true before the next process step begins. Wetting, softening, losing strength and being visibly gone are four separate events, and a written method has to say which one you are buying.",
      },
    ],
  },
  {
    heading: "What to settle before you ask for a sample",
    blocks: [
      {
        type: "paragraph",
        text: "A first sample is easier to match when the enquiry already answers these five.",
      },
      {
        type: "table",
        caption: "Five answers that decide which sample is sent",
        columns: ["Question", "What it decides"],
        rowHeader: true,
        rows: [
          ["Where the PVA sits, and where it has to be gone", "Which application the material is matched against"],
          ["Temperatures and chemistry before removal", "Whether a lower or a higher grade can survive the earlier wet stages"],
          ["Count or fibre specification", "Which form and construction is quoted"],
          ["How removal will be judged", "The endpoint the sample is evaluated against"],
          ["Trial quantity, packaging and the intended order", "Whether the first step is a sample, a pilot or production"],
        ],
      },
    ],
  },
  {
    heading: "How Three Thai handles a new application",
    blocks: [
      {
        type: "paragraph",
        text: "Development starts from the process, not from a catalogue item.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          [{ kind: "text", text: "Describe the application and the job the PVA element has to do." }],
          [{ kind: "text", text: "Fix the requirements: construction, temperatures, chemistry, removal endpoint, quantity." }],
          [{ kind: "text", text: "Match a product form and a grade against those requirements." }],
          [{ kind: "text", text: "Send a traceable sample for a trial on production-representative material." }],
          [{ kind: "text", text: "Evaluate the trial against the written method and the agreed endpoint." }],
          [{ kind: "text", text: "Carry the approved specification, batch controls and packaging into supply." }],
        ],
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Specifications, certificates and report parameters are published on the " },
          { kind: "link", text: "quality page", href: "/quality" },
          { kind: "text", text: ", and the material forms are described under " },
          { kind: "link", text: "water-soluble PVA yarn", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "." },
        ],
      },
    ],
  },
  {
    heading: "If the application is unusual",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Tell us what you manufacture and where the PVA element has to stop existing. Useful next steps: " },
          { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: ", " },
          { kind: "link", text: "the five-point inquiry checklist", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
          { kind: "text", text: ", or " },
          { kind: "link", text: "request a sample", href: "/request-sample" },
          { kind: "text", text: "." },
        ],
      },
    ],
  },
];
