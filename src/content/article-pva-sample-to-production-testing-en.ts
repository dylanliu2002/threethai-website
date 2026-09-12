import type { ArticleBody } from "./article-blocks";

/**
 * R9 — from sample to production, slug `pva-sample-to-production-testing`.
 *
 * Evidence ledger. The trial sequence follows `legacy-source.ts`
 * `products[0].processGuide`, which asks for the temporary function to be defined,
 * a repeatable removal method to be set, and the approval to rest on the
 * production-representative part of the fabric; the five-step sample process (brief,
 * recommendation, traceable sample, controlled trial, written approval) is the buyer
 * answer `sample-order-process-pva-water-soluble-yarn`. The seven process targets
 * (20/40/55/60/70/80/90 C) are `products[0].technicalOverview`. The pool of
 * co-variables and the bath vocabulary come from `catalog.ts` and the product
 * selection fields, and the two closing routes are the registered `/quality` and
 * `/request-sample` pages.
 *
 * Nothing here states a dissolution time, a mechanical value, a twist figure, a
 * machine speed, a residue limit, a quantity, a lead time or a price, and every
 * figure is one of those seven whole numeric tokens already present in the
 * repository's record.
 */
export const en: ArticleBody = [
  {
    heading: "Write the job down before ordering anything",
    blocks: [
      {
        type: "paragraph",
        text: "A trial answers a question that someone has already framed. If the request says only that the yarn has to dissolve, the trial will produce a result that nobody can read, and the second sample will be picked by guesswork. The work that makes a trial useful happens before the sample is sent, and it takes the form of a short written brief for the temporary material.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "Where the support sits in the construction, and what it holds while the fabric is being built." }],
          [{ kind: "text", text: "The handling it meets before removal, whether that is winding, weaving, knitting, stitching or a wet process." }],
          [{ kind: "text", text: "The stage of the route at which it has to be gone, and the bath that is expected to remove it." }],
          [{ kind: "text", text: "The water that bath actually runs: its temperature range, tank volume, how the liquor moves, and how long the goods stay in it." }],
          [{ kind: "text", text: "The chemicals already present in the bath at the removal stage." }],
          [{ kind: "text", text: "What counts as removed for the finished article, stated as something an operator can see or measure." }],
        ],
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "The form the material takes narrows with the brief. " },
          { kind: "link", text: "The water-soluble PVA yarn range", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: " sets out the count, construction and package options a first development trial has to choose between." },
        ],
      },
    ],
  },
  {
    heading: "Choose a grade to trial, not a grade to buy",
    blocks: [
      {
        type: "paragraph",
        text: "A candidate is chosen against the brief, and the temperature label is the first filter rather than the answer. Three Thai develops PVA yarn around seven process targets: 20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C. The first filter question is which of those the goods can tolerate at the removal stage without harm to the fibre, the dye or the finish.",
      },
      {
        type: "paragraph",
        text: "The second filter is what the rest of the bath does. Exposure time, liquor movement, the volume of water relative to the goods, the density of the construction and the chemicals in the tank all shift the result inside one temperature label. A grade that clears in a beaker at the trial temperature can sit in the same water on the machine and stay largely intact, because the two baths differ in everything except the number on the label.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "The labelled targets, and what each one does and does not promise, are set out in " },
          { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: ". That reading belongs before the brief is sent, not after the first trial has failed." },
        ],
      },
      {
        type: "paragraph",
        text: "Bring two candidates to the first trial, not five. Two grades weighed against one brief produce a decision, and a decision is what the brief was written for. Five produce a shelf of unlabelled samples and a question about which one was which.",
      },
    ],
  },
  {
    heading: "Run the first trial at the smallest useful scale",
    blocks: [
      {
        type: "paragraph",
        text: "The first trial belongs on the smallest piece of material that still reproduces the process, which is not the same as the easiest piece. A loose hank of yarn in a beaker clears far faster than the same yarn woven into a dense panel, because the water reaches every filament in the first case and only the surface in the second.",
      },
      {
        type: "paragraph",
        text: "Reproduce the order of operations as well. If the goods are dried, heatset or stitched before the removal bath in production, the trial specimen has to pass through those steps before its own bath. Washing a fresh sample and comparing it with a production piece that has been through finishing compares two different materials and reports the difference as a grade property.",
      },
      {
        type: "paragraph",
        text: "Fix the conditions in writing before anything goes into the water: specimen mass and length, water volume, temperature and its tolerance, how the bath is agitated, and the points at which the operator is to look. Two people reading the same sheet should arrive at the same result, and where they cannot, the sheet is missing something rather than the material being unpredictable.",
      },
    ],
  },
  {
    heading: "Read the trial through more than the final disappearance",
    blocks: [
      {
        type: "paragraph",
        text: "Disappearance is the last thing to happen and the least informative. Before it, the material wets, softens, gives up the strength that was holding the construction together, and then breaks into fragments. Which of those stages carries the decision depends on the job. A temporary stitch that holds a seam through handling has done its work once the seam is closed, long before the last trace has gone.",
      },
      {
        type: "table",
        caption: "The shape of a trial record that someone who was not in the room can read",
        columns: ["Line", "What to record", "What it settles"],
        rowHeader: true,
        rows: [
          ["Grade and identification", "The grade trialled, its batch or sample reference, and the count and construction", "Whether the result belongs to the material that will be ordered"],
          ["Application and process", "Where the material sits, and the route it was taken through before removal", "Whether the trial reproduced the process instead of taking a bench shortcut"],
          ["Observation at each endpoint", "Time to wetting, to softening, to loss of strength and to visible removal, with the bath conditions beside it", "Which stage the material reached, and where its removal stopped"],
          ["Result against the criteria", "Whether the finished piece met the written acceptance criteria, and the points where it did not", "Whether the grade can be approved, and what still has to change"],
          ["Next adjustment", "The one condition to change before the next trial, and the conditions to hold", "That the next trial isolates a variable instead of moving several at once"],
        ],
      },
      {
        type: "paragraph",
        text: "A record kept in that form answers the question a photograph cannot. It reports which stage the material reached, under which bath conditions, and what that leaves to change, rather than stating only that the sample went in and did not come out.",
      },
    ],
  },
  {
    heading: "Change one variable between trials and hold the rest",
    blocks: [
      {
        type: "paragraph",
        text: "When a trial falls short, the temptation is to raise the temperature and lengthen the bath at the same time, because both act on the same symptom. If the next trial then works, nothing has been learned about which change did it, and the production bath cannot be tightened later without risking the result it depends on.",
      },
      {
        type: "definitionList",
        items: [
          { term: "Wetting", detail: [{ kind: "text", text: "the first visible change, when the fibre stops resisting the water and begins to take it in" }] },
          { term: "Softening", detail: [{ kind: "text", text: "the point at which the material no longer holds its shape under the handling load it was taking" }] },
          { term: "Loss of strength", detail: [{ kind: "text", text: "the point at which the construction it was supporting can no longer rely on it" }] },
          { term: "Visible removal", detail: [{ kind: "text", text: "the last trace an operator can still see, judged at the agreed distance and light" }] },
        ],
      },
      {
        type: "paragraph",
        text: "Those four endpoints are not interchangeable, and a trial that reports only the last one discards the three that would have shown where the change belongs. Hold everything except the single condition under test, and move that one by a defined step rather than by whatever the operator feels is enough.",
      },
    ],
  },
  {
    heading: "Validate on the production structure before approving bulk",
    blocks: [
      {
        type: "paragraph",
        text: "A small trial that works is a candidate, not an approval. The densest area of the production construction, the goods taken through the full dyeing and finishing sequence, and the real tank with its own water movement are the three things a bench trial leaves out. Put them back one at a time before the grade is written into an order.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Approval should rest on a quality record rather than on a sample alone, so the " },
          { kind: "link", text: "quality page", href: "/quality" },
          { kind: "text", text: " sets out what the mill holds and what a buyer can ask to see, and the " },
          { kind: "link", text: "sample request route", href: "/request-sample" },
          { kind: "text", text: " is where a development trial starts. Neither one replaces running the production structure." },
        ],
      },
      {
        type: "paragraph",
        text: "Validation is also where the sample-to-bulk plan is agreed: which conditions are locked, which tolerances the mill will hold, what happens when a measurement falls outside them, and which changes need the buyer's agreement before anything ships. The conditions that produced the approved result travel with the specification, so a later batch is compared against a written method and not against a memory of one sample.",
      },
    ],
  },
  {
    heading: "Keep the approved conditions with the specification",
    blocks: [
      {
        type: "paragraph",
        text: "What a successful trial produces is a set of conditions, and those conditions belong in the specification as much as the count and the strength do. Write in the temperature and its tolerance, the bath, the dwell, the chemicals present and the endpoint that was accepted, and reference the approved sample by its identification so that the record and the material can be matched.",
      },
      {
        type: "callout",
        label: "One record, two readers",
        tone: "note",
        text: "The same sheet should let a production operator set the bath and let a buyer confirm that an incoming batch was made and tested the same way. Where it serves only one of the two, the trial will have to be run again before either side can rely on it.",
      },
      {
        type: "paragraph",
        text: "Then hold those conditions still. A change to the grade, the construction, the finish or the removal bath puts the approval back into question until the trial is run again, and the second run costs less than the first because the record already says which single condition has to move.",
      },
    ],
  },
];
