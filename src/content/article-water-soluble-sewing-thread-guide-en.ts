import type { ArticleBody } from "./article-blocks";

/**
 * R5 "Water-soluble sewing thread" — English body.
 *
 * Copy rules: `docs/audits/resources-editorial-voice.md`. Every statement is grounded in
 * the sewing-thread record this repository already holds: the product entry in
 * `legacy-source.ts` (its applications, its selection variables, its process guide and its
 * three FAQs — a thread is not a film or nonwoven backing, a break can happen while the
 * tensile result is acceptable, and what OEM packaging needs), the `embroidery-sewing`
 * application entry in `applications.ts` (where the thread sits, why it is temporary, the
 * selection variables, the testing guidance), and the buyer answers
 * `pva-sewing-thread-temporary-stitching-garments`,
 * `reliable-oem-pva-water-soluble-sewing-thread-factory` and
 * `minimum-order-quantity-pva-water-soluble-thread`.
 *
 * The seven dissolution process targets come from `legacy-source.ts`
 * products[0].technicalOverview. The two catalogue pairings — a 40S/2 thread in the 20 °C
 * group and a PVA sewing thread in the 60 °C group — are `catalog.ts` rows and nothing else.
 *
 * Nothing here states a dissolution time, a mechanical value, a twist figure, a machine
 * speed, a residue limit, a quantity or a price, because none of those is published in this
 * repository.
 */
export const en: ArticleBody = [
  {
    heading: "A thread that holds and then leaves",
    blocks: [
      {
        type: "paragraph",
        text: "Water-soluble PVA sewing thread forms a seam, holds it through stitching, cutting and handling, and then leaves during the wet-finishing bath. Its support sits exactly where the stitches sit. That is the opposite of a film or a nonwoven embroidery backing, which spreads support across an area while a thread carries it along a line.",
      },
      {
        type: "paragraph",
        text: "The difference decides how the two materials are compared. A backing is judged by the area it steadies; a thread is judged by the seam it holds and then gives up. A buyer who compares the two on a temperature label alone can end up with a thread asked to do a backing's job, and the gaps then show in the middle of the construction rather than at the edge.",
      },
    ],
  },
  {
    heading: "Three positions the thread can hold",
    blocks: [
      {
        type: "paragraph",
        text: "Inside a sewing or embroidery operation the thread does not always do the same work. Three positions cover most of what a mill asks of it, and they load the thread differently.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "The temporary seam itself, where the thread is the stitch line holding two panels or two components together while they are joined." }],
          [{ kind: "text", text: "A positioning or guide line, where the thread steadies or marks a component so the machine follows a path that is removed afterwards." }],
          [{ kind: "text", text: "An assembly support, where the thread holds a component through a wash-away operation so the piece can be handled and then released." }],
        ],
      },
      {
        type: "paragraph",
        text: "The first position is what most buyers mean by a temporary seam, and it is the hardest on the needle: the thread runs at production speed in a stitch that will be pulled back out of the fabric.",
      },
      {
        type: "paragraph",
        text: "The other two ask for less seam strength and more consistency. A guide line that breaks in the middle of a pattern, or a support that releases before the piece has been handled, leaves the machine without the reference it was following.",
      },
    ],
  },
  {
    heading: "What the thread is doing at each stage",
    blocks: [
      {
        type: "paragraph",
        text: "The thread has a different job at each stage of the route, and only the last stage takes it out of the article.",
      },
      {
        type: "table",
        caption: "What the thread does at each stage",
        columns: ["Stage", "What it is doing"],
        rowHeader: true,
        rows: [
          ["Stitching and assembly", "It forms the seam or the guide and holds it at production speed."],
          ["Cutting and handling", "It keeps the stitch line intact while the piece is moved, trimmed and stacked."],
          ["Wet finishing", "It releases under conditions the fabric, dyes and trims can take."],
          ["After removal", "The stitch line is gone and nothing is left to mark the finished article."],
        ],
      },
      {
        type: "paragraph",
        text: "Three Thai builds water-soluble PVA grades around 20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C process targets, and the catalogue carries a 40S/2 thread in the 20\u00B0C group and a PVA sewing thread in the 60\u00B0C group.",
      },
      {
        type: "paragraph",
        text: "Inside a real sewing room that list narrows quickly. The removal bath has to stay inside the temperature the fabric, the dyes and the trims can all take, and the most sensitive of the three sets the ceiling for the whole piece.",
      },
    ],
  },
  {
    heading: "Why the seam has to disappear, not only loosen",
    blocks: [
      {
        type: "paragraph",
        text: "A seam that has softened but not gone still occupies the stitch line. It no longer holds an assembly, and it still shows on the finished article, where the stitch holes and any residue are what the customer sees first.",
      },
      {
        type: "callout",
        label: "Name the endpoint before the trial",
        tone: "note",
        text: "Softening, loss of seam strength and complete visible removal are three different finishes, and only one of them is the finish the article needs. Naming the endpoint before the trial is what makes the result repeatable; a trial that reports only that the seam became weaker has no acceptance criterion attached to it.",
      },
      {
        type: "paragraph",
        text: "That is also why a low-temperature removal route is worth the search. The alternative on the table is seldom a hotter bath that leaves the piece unchanged; it is a hotter bath that takes the thread out and moves the dye, the trim or the hand feel at the same time.",
      },
    ],
  },
  {
    heading: "What to settle before a sewing trial",
    blocks: [
      {
        type: "paragraph",
        text: "Five things decide whether a first sewing trial can return a usable answer.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "Thread count and ply for the sewing operation." }],
          [{ kind: "text", text: "Machine type, needle, stitch and seam construction." }],
          [{ kind: "text", text: "Operating speed and the needle heat it produces." }],
          [{ kind: "text", text: "The maximum safe water temperature for the fabric, the dyes and the trims." }],
          [{ kind: "text", text: "The removal endpoint: loss of seam strength or complete removal." }],
        ],
      },
      {
        type: "paragraph",
        text: "Answering these before a sample is sent keeps a trial from testing the wrong variable. A trial with no stated endpoint returns an opinion, and the second sample then costs as much as the first.",
      },
    ],
  },
  {
    heading: "Why a thread can break while its tensile result looks fine",
    blocks: [
      {
        type: "paragraph",
        text: "A thread that passed a tensile test on the bench can still break on the machine, and this is the failure that catches buyers out. A laboratory result measures a loose strand under a controlled pull, and a sewing line does not apply one.",
      },
      {
        type: "paragraph",
        text: "Needle conditions, thread guides, tension, machine speed, package unwinding and seam design each add stress that the pull never reproduces. The needle heats as it runs, the guide abrades the thread, and the package has to unwind without snatching. A break in production is evidence about those conditions as much as about the fibre.",
      },
    ],
  },
  {
    heading: "Judge the seam on the garment, not on a loose strand",
    blocks: [
      {
        type: "paragraph",
        text: "A length of thread drawn from a package shows how that thread behaves on a bench, and rather less about the same thread sewn into a stitch line on a real fabric, where the needle, the fabric and the machine settings all take part.",
      },
      {
        type: "paragraph",
        text: "Access is the reason for the gap. In an open seam the water reaches the thread almost at once; in a dense embroidery, a folded hem or a stitched-down component the bath has to penetrate the construction first, and the thread that goes last is the one sitting in the densest zone.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "How temperature, exposure and agitation change a removal result is set out in " },
          { kind: "link", text: "the dissolution temperature guide", href: "/knowledge/pva-yarn-dissolution-temperature-guide" },
          { kind: "text", text: ". The batch-to-batch side of the same question is in " },
          { kind: "link", text: "the consistency article", href: "/knowledge/pva-batch-dissolution-consistency" },
          { kind: "text", text: ", and the fields worth sending with an enquiry are listed in " },
          { kind: "link", text: "the specification checklist", href: "/knowledge/pva-yarn-buyer-specification-checklist" },
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
          { term: "Count, ply and finish actually sewn", detail: [{ kind: "text", text: "Whether the trial matches what production will run" }] },
          { term: "Machine, needle, stitch and running speed", detail: [{ kind: "text", text: "Whether a second machine reproduces the result" }] },
          { term: "The wet-finishing temperature held, and the bath the piece saw", detail: [{ kind: "text", text: "Which endpoint the route can reach" }] },
          { term: "Seam strength after the bath, and any residue left behind", detail: [{ kind: "text", text: "Whether the article is clean or still marked" }] },
          { term: "Where the thread broke, and at which stage", detail: [{ kind: "text", text: "Whether the cause was the thread or the sewing conditions" }] },
        ],
      },
      {
        type: "paragraph",
        text: "Written down this way, a trial that fails still produces something usable. A record that says only whether the thread went away leaves the next attempt guessing at which variable to move.",
      },
    ],
  },
  {
    heading: "When the first trial does not work",
    blocks: [
      {
        type: "paragraph",
        text: "A sewing trial usually fails for one of four reasons, and each of them calls for a different change.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "The grade was chosen from its temperature label without checking what the wash line can hold." }],
          [{ kind: "text", text: "The thread ran at a speed or through a needle the stitch construction could not take, so it broke before removal was reached." }],
          [{ kind: "text", text: "The bath was set for the thread and not for the fabric, the dyes and the trims, so the seam came out and the piece came out changed." }],
          [{ kind: "text", text: "The trial recorded an outcome but not the conditions, so nothing about the run can be repeated." }],
        ],
      },
    ],
  },
  {
    heading: "Send the sewing conditions you actually run",
    blocks: [
      {
        type: "prose",
        spans: [
          { kind: "text", text: "The machine, the seam and the finishing bath are what the conversation starts from. The application is described in more detail on " },
          { kind: "link", text: "embroidery and sewing", href: "/applications/embroidery-sewing" },
          { kind: "text", text: "; the two materials used with it are " },
          { kind: "link", text: "water-soluble PVA sewing thread", href: "/products/water-soluble-pva-sewing-thread" },
          { kind: "text", text: " and " },
          { kind: "link", text: "water-soluble PVA yarn", href: "/products/water-soluble-pva-yarn" },
          { kind: "text", text: "; and " },
          { kind: "link", text: "a sample request", href: "/request-sample" },
          { kind: "text", text: " is where the trial begins." },
        ],
      },
      {
        type: "paragraph",
        text: "Sending the conditions rather than a thread count alone is what lets a construction be proposed against the seam, which is the level at which the decision is actually made. The quantities that follow are three separate questions. A sample proves the seam, a pilot run checks the machine, the finishing line and the packaging, and the production order follows once the specification is locked. The figure for each one depends on the thread construction rather than on a single published number.",
      },
    ],
  },
];
