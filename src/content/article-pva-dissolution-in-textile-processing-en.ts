import type { ArticleBody } from "./article-blocks";

/**
 * R7 "Dissolution variables" — English body.
 *
 * Copy rules: `docs/audits/resources-editorial-voice.md`. Every statement is grounded in
 * the dissolution record this repository already holds: the product entry in
 * `legacy-source.ts` (its `technicalOverview` carries the seven 20 °C to 90 °C process
 * targets and the variables they depend on, its `processGuide` names what a repeatable
 * removal method records, and its first FAQ refuses to select a yarn by dissolution
 * temperature alone), the `legacy-source.ts` dissolution-guide article (temperature is one
 * variable, yarn structure affects access, finishing conditions matter, read more than the
 * final disappearance, and move from laboratory to production), the temperature note in
 * `catalog.ts`, and the buyer answers `test-pva-yarn-dissolution-temperature` and
 * `20c-vs-90c-pva-yarn-difference`.
 *
 * Nothing here states a dissolution time, a mechanical value, a twist figure, a machine
 * speed, a residue limit, a quantity or a price, because none of those is published in this
 * repository. The troubleshooting table asks questions to investigate; it does not assert a
 * cause.
 */
export const en: ArticleBody = [
  {
    heading: "The variables that decide a removal result",
    blocks: [
      {
        type: "paragraph",
        text: "A removal result is not set by one number on a grade label. It comes out of several variables acting at the same time, and a trial that moves one of them while leaving the rest unrecorded cannot be repeated. The list below is the set this article works through, in the order a mill usually has to settle them.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "Temperature of the removal bath, and how warm the piece can be held there." }],
          [{ kind: "text", text: "Time at that temperature, which is not the same as the time the piece spends in the machine." }],
          [{ kind: "text", text: "Water movement, meaning how the liquor circulates and how much agitation reaches the fibre inside the piece." }],
          [{ kind: "text", text: "Access and exposure, meaning whether the yarn is open to the water or buried inside a dense, folded or coated structure." }],
          [{ kind: "text", text: "Material quantity, meaning how much PVA sits in the load beside the water available to carry it away." }],
          [{ kind: "text", text: "Construction: yarn count, twist direction and sett, and how tightly the support yarn is bound in." }],
          [{ kind: "text", text: "Prior processing: sizing, heat setting, dyeing and any earlier wet treatment the piece has already passed." }],
          [{ kind: "text", text: "Grade, and whether the window it was chosen for is the window the line can actually hold." }],
        ],
      },
      {
        type: "paragraph",
        text: "None of these is decided alone. A change in construction can move the temperature that works, and a change in grade can change what the bath has to do. That is why the sections below take them one at a time and then put them back together in a trial record.",
      },
    ],
  },
  {
    heading: "Temperature comes first and is never the only variable",
    blocks: [
      {
        type: "paragraph",
        text: "Temperature is the variable buyers reach for first, and the one most often read alone. A warmer bath shortens the work the water has to do, and in the same pass it moves the dye, the trim and the hand feel of the piece. The useful question is not how hot the bath can be, but how warm it can be while the rest of the article still comes out as it went in.",
      },
      {
        type: "paragraph",
        text: "Three Thai develops PVA yarn around 20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C process targets. Those targets describe the grades and where each is designed to work. They are not a statement about the result on any one line, because the temperature that removes the support in a loose open fabric can sit several steps below the temperature the same grade needs inside a dense one.",
      },
      {
        type: "paragraph",
        text: "Reading a grade label alone therefore hides the second half of the choice. A grade named for 90\u00B0C says where that grade is designed to work, and the line still has to reach that point without changing the article.",
      },
    ],
  },
  {
    heading: "Time at temperature is not the machine cycle",
    blocks: [
      {
        type: "paragraph",
        text: "The time that matters is the time the yarn spends at the working temperature, and that is not the time the piece spends in the machine. A batch fills, comes up to temperature and then cools; the first pieces in the load are exposed longer than the last, and the drain and rinse that follow the bath still act on the yarn while the water is warm.",
      },
      {
        type: "paragraph",
        text: "Two runs with the same recipe can therefore return different results. Recording the dwell at temperature, rather than the machine cycle, is what makes the two runs comparable. A cycle time quoted without the dwell describes the equipment and not the chemistry.",
      },
    ],
  },
  {
    heading: "Water movement decides whether the liquor can carry the material away",
    blocks: [
      {
        type: "paragraph",
        text: "Water has to reach the fibre, and it then has to carry the dissolved material away from it. A bath that is warm but gives the liquor nowhere to move removes the support unevenly, and the zones that sit still are the last to clear. In a trough, a jet or a winch the movement is different, and the same grade meets different conditions in each.",
      },
      {
        type: "paragraph",
        text: "Bath ratio and agitation are the two settings that describe this side of the process. A low ratio gives each kilogram of fabric less water to work in, so the material leaving the yarn accumulates in a smaller volume. A high ratio dilutes it and can lower the mechanical action on the piece. Neither setting is right on its own, so the trial record should carry both.",
      },
    ],
  },
  {
    heading: "Construction and earlier processing change how much water reaches the yarn",
    blocks: [
      {
        type: "paragraph",
        text: "Where the support yarn sits decides how much water reaches it. On the face of a knit, in an open seam or in a loose woven structure, the bath reaches the yarn almost at once. Buried inside a dense weave, a folded hem, a plied cord or a coated backing, the water has to penetrate the construction first.",
      },
      {
        type: "paragraph",
        text: "Processing that happened earlier changes the answer as well. Sizing adds a film over the yarn, heat setting can change how the structure holds its shape, and an earlier dyeing or washing step may have moved some of the material already. A trial on greige fabric and a trial on a piece that has been through part of the route are not the same experiment.",
      },
      {
        type: "paragraph",
        text: "Where the water has to travel, the record should say so. A trial that reports the fabric, without saying which zone the sample came from, does not describe the piece the mill is running.",
      },
    ],
  },
  {
    heading: "The grade sets the window the other variables work inside",
    blocks: [
      {
        type: "paragraph",
        text: "The grade sets the window the other variables work inside. Choose a grade whose window sits below what the line can hold and the support stays behind; choose one whose window sits above what the fabric, the dyes and the trims can take, and the piece is changed while the support leaves.",
      },
      {
        type: "paragraph",
        text: "Because the grade and the route have to agree, two questions belong in the same conversation: what the removal bath can actually run, and which grade fits that window. Deciding the grade first and then bending the bath to it is how a first trial ends up testing the wrong half of the process.",
      },
      {
        type: "paragraph",
        text: "The seven targets the catalogue lists give a mill a place to start, and they do not remove the need for that trial. Two constructions can carry the same grade and still need different conditions, and the grade that fits one line is not automatically the grade that fits the next.",
      },
    ],
  },
  {
    heading: "A troubleshooting table of questions to investigate",
    blocks: [
      {
        type: "paragraph",
        text: "When a trial does not return the result that was expected, the productive next move is to list what to look at rather than to name a cause. The table below is written as questions for that reason. Each row points at a variable the next run can measure.",
      },
      {
        type: "table",
        caption: "Questions to investigate when removal is not what the trial expected",
        columns: ["Observed in the trial", "Question to investigate"],
        rowHeader: true,
        rows: [
          ["Support has not gone in the densest area", "Did the water reach that area, or was the test piece too small to reproduce the real construction?"],
          ["Support has gone, fabric hand has changed", "Was the bath set for the yarn, or for the fabric, the dye and the trims that share it?"],
          ["Removal is slower than the bench result suggested", "Was the bench sample a loose hank while the production piece is bound into a dense structure?"],
          ["Removal varies across one piece", "Is the bath movement even across the piece, and does the load sit where the liquor circulates?"],
          ["Result changes between two runs of the same recipe", "Was every variable recorded both times, or only the temperature and the time?"],
          ["Support leaves a mark on the finished article", "Does the record name the endpoint as complete visible removal, or only as loss of strength?"],
          ["A second grade behaves unlike the first", "Was the grade chosen for the same window, and is that window the one the line can hold?"],
        ],
      },
      {
        type: "paragraph",
        text: "Working through the rows in this order keeps a failed trial useful. Each answer narrows the variable to move next, and none of them asserts a cause the record cannot support.",
      },
    ],
  },
  {
    heading: "A beaker result and a production result answer different questions",
    blocks: [
      {
        type: "paragraph",
        text: "A beaker of warm water and a production finishing line look like the same experiment and are not. The beaker holds a loose hank, in a still volume, with all the water in contact with the fibre. The line holds a full piece, in a moving bath, with the yarn bound inside the structure. A beaker settles whether a grade can dissolve at all. It does not settle how the line will behave.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "The forms a support yarn takes, and where a mill puts it, are covered in " },
          { kind: "link", text: "what water-soluble PVA yarn is", href: "/knowledge/what-is-water-soluble-pva-yarn" },
          { kind: "text", text: ". The batch-to-batch side of the same question, and the records that make two runs comparable, sit in " },
          { kind: "link", text: "the consistency article", href: "/knowledge/pva-batch-dissolution-consistency" },
          { kind: "text", text: ". The grade-and-temperature pairing itself is set out in " },
          { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: "." },
        ],
      },
      {
        type: "paragraph",
        text: "The production case is what the beaker cannot reach. A large bath loading, restricted water movement in the tightest part of the piece, and the real finishing chemicals in the bath all slow removal against a loose-yarn demonstration. That is why the pilot belongs on the most difficult construction rather than the easiest one.",
      },
    ],
  },
  {
    heading: "Write the variables down before the next trial",
    blocks: [
      {
        type: "paragraph",
        text: "A record that names the variables is what makes the second trial cheaper than the first. Five of them carry most of the value.",
      },
      {
        type: "definitionList",
        items: [
          { term: "Temperature held, and the time at that temperature", detail: [{ kind: "text", text: "The two settings the next run starts from" }] },
          { term: "Bath ratio and agitation", detail: [{ kind: "text", text: "What the water in the bath was doing" }] },
          { term: "Construction, and where the support sat inside it", detail: [{ kind: "text", text: "Whether the sample reproduced the real piece" }] },
          { term: "Endpoint used", detail: [{ kind: "text", text: "Softening, loss of strength or complete visible removal" }] },
          { term: "Grade tested, and the window it was chosen for", detail: [{ kind: "text", text: "Whether the next grade moves in the right direction" }] },
        ],
      },
      {
        type: "paragraph",
        text: "Written this way, a trial that reports a poor result still leaves something usable. A result without the conditions attached cannot be compared with the next one, and the discussion then restarts from the temperature label each time.",
      },
      {
        type: "callout",
        label: "Name the endpoint before the trial",
        tone: "note",
        text: "Softening, loss of strength and complete visible removal are three different finishes, and a trial that reports only that the support became weaker has no acceptance criterion attached to it. Fixing the endpoint before the run is what makes the result repeatable.",
      },
    ],
  },
  {
    heading: "Send the conditions the removal bath actually runs",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "The route the piece will run is what the conversation starts from. The material involved is described on " },
          { kind: "link", text: "water-soluble PVA yarn", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: ", and a trial route begins at " },
          { kind: "link", text: "a sample request", href: "/request-sample" },
          { kind: "text", text: ". The variables above are the ones worth sending with it." },
        ],
      },
      {
        type: "paragraph",
        text: "Sending the conditions rather than a single temperature is what lets a grade be proposed against the real line. A sample settles whether a grade can dissolve at all, a pilot run settles the movement, the load and the finishing chemicals, and a production order follows once those are fixed. The quantity behind each step is a separate question, and it depends on the construction rather than on one published number.",
      },
    ],
  },
];
