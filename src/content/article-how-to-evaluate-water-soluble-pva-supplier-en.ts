import type { ArticleBody } from "./article-blocks";

/**
 * R8 — how to evaluate a water-soluble PVA supplier before placing an order.
 *
 * Evidence ledger (`docs/audits/resources-editorial-voice.md` rules: every figure must
 * already exist in the repository's own record, and no commercial claim may be invented):
 *   ISO 9001:2015 system certificate, scope and validity ......... quality.ts certificates[0]
 *   OEKO-TEX Standard 100 Class I, raw white, to 2027-01-31 ..... quality.ts certificates[2]
 *   TESTEX report SH005 275198.1 behind the renewal, pH 6.2 ..... quality.ts certificates[3]
 *   seven dissolution process targets ................. legacy-source.ts products[0].technicalOverview
 *   the machinery and test-method devices ............... patents.ts inventionPatents + utilityPatents
 *   the Malta and Nigeria registrations ................. patents.ts foreignPatents
 *   how evidence, scope and validity are published ....... /quality and /manufacturing
 *   the sampling route the closing section names ......... /request-sample
 *
 * The framework is the deep version of the answer best-pva-water-soluble-yarn-manufacturers-china,
 * which already refuses to self-rank: this article keeps that position and asks the buyer to
 * compare documents, not suppliers, on one brief. No price, MOQ, lead time or ranking appears,
 * and nothing here states a figure the six-file evidence corpus does not already publish.
 */
export const en: ArticleBody = [
  {
    heading: "One brief goes to every candidate supplier",
    blocks: [
      {
        type: "paragraph",
        text:
          "A supplier can be compared with another supplier only when both were asked the same question. " +
          "The comparison starts with a written brief that states the job the water-soluble PVA has to do inside " +
          "your process, not with the quotation that arrives afterwards. Send that one brief to every candidate, " +
          "and the replies become comparable, because each one is answering the same constraint rather than the " +
          "constraint it would prefer to answer. A brief that leaves the removal endpoint out of it invites an " +
          "answer about a grade, which is a different answer from one about your process.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "The count system and the construction, single or plied, with the twist direction the process needs." }],
          [{ kind: "text", text: "The target water temperature and the exposure time the line can actually give it." }],
          [{ kind: "text", text: "The agitation available, the liquor ratio in use, and whether the endpoint is softening, loss of strength or complete visible removal." }],
          [{ kind: "text", text: "The structure the yarn enters and the finishing sequence that follows it, including the dyes and auxiliaries already in the bath." }],
          [{ kind: "text", text: "The package build the creel takes, and the yarn evenness or moisture regain the line has been running." }],
        ],
      },
      {
        type: "paragraph",
        text:
          "A brief that names the endpoint does more work than a brief that names only a temperature. A temperature " +
          "label is a starting point for selection, and the removal method written into the brief is the method your " +
          "approved sample will later be judged against, by both sides, in writing.",
      },
    ],
  },
  {
    heading: "Ten comparison areas, each with a document behind it",
    blocks: [
      {
        type: "paragraph",
        text:
          "Put the ten areas below on one sheet and score every candidate on the same sheet. The aim is not to rank " +
          "factories by size, but to see which answer is backed by a record and which one is only words.",
      },
      {
        type: "table",
        caption: "Ten areas to compare on the same brief",
        columns: ["Area", "Evidence to request", "What a weak answer looks like"],
        rowHeader: true,
        rows: [
          ["Specification clarity", "A written construction, count and removal method matched to your process", "A temperature label with no method behind it"],
          ["Batch consistency", "Sampling plan, retained sample, batch code and the change notice that follows", "One untraceable sample offered as proof of all production"],
          ["Product range", "The forms actually made here: yarn, sewing thread, staple fiber, filament", "A catalogue listing forms the plant does not run"],
          ["Technical communication", "An engineer who asks about your machine before naming a grade", "A grade named before the process is described"],
          ["Sampling", "A sample tied to a grade and a written acceptance method", "A sample with no identity attached to it"],
          ["Quality documentation", "Certificate number, scope, issuing body and validity, published for checking", "A certificate image with nothing in it to verify"],
          ["Manufacturing capability", "Which steps run in-house, from opening through winding to conditioning", "A trading office shown in place of a production floor"],
          ["Commercial communication", "Specification, packing basis, delivery term and validity stated together", "A figure quoted against an unnamed grade"],
          ["Packaging and logistics", "Package build, moisture protection and the documents the destination needs", "Packing described only after the order is placed"],
          ["Repeat-order support", "What accompanies a repeat: the same grade, the same record, a named contact", "No answer about the second order at all"],
        ],
      },
      {
        type: "paragraph",
        text:
          "Two of these areas decide a first order more than the rest. Specification clarity settles whether the " +
          "sample you approve is the sample you can reorder, and batch consistency settles whether the second " +
          "delivery behaves like the first. A supplier can be strong on one and weak on the other, which is why the " +
          "sheet keeps them apart instead of averaging them into a single impression.",
      },
    ],
  },
  {
    heading: "Consistency is a record, not a demonstration",
    blocks: [
      {
        type: "paragraph",
        text:
          "A clean beaker demonstration proves that one length of yarn disappeared in one bath. It says nothing " +
          "about the next batch, because the demonstration carries no identity you can follow. Ask how a batch is " +
          "coded, what is kept as a retained sample, and what change would be reported to you before a reorder.",
      },
      {
        type: "paragraph",
        text:
          "The useful question is whether the mill can show the record of tests it already ran, under a numbering " +
          "that runs from raw material through opening, spinning, winding and release. A mill that keeps that " +
          "record can be audited against it. A mill that keeps only a demonstration asks you to trust a single " +
          "afternoon. Ask which test method each entry used and who signs the release, because a record a buyer " +
          "can trace is one the mill can stand behind a year later.",
      },
    ],
  },
  {
    heading: "Product range shows that the format you need is made here",
    blocks: [
      {
        type: "paragraph",
        text:
          "Most buyers arrive needing one format rather than a whole catalogue. Match the format to the job: a spun " +
          "yarn where the structure has to hold through weaving or knitting, a sewing thread where a seam is " +
          "stitched and then removed, a staple fiber where the PVA is a blend component, and a filament where the " +
          "fibre is cut or opened at a later stage.",
      },
      {
        type: "paragraph",
        text:
          "A supplier who spins the count, the construction and the dissolution grade group you actually need ships " +
          "what was quoted. The difference between that supplier and a broker shows up at the first repeat order, " +
          "when the grade has to be reproduced under the batch code the sample carried.",
      },
      {
        type: "paragraph",
        text:
          "Check the range against your own process rather than against the length of a product page. The question " +
          "is whether the format, the count and the dissolution grade group you need sit inside the range that is " +
          "made on the supplier's own equipment. A format supplied from elsewhere is only as repeatable as the " +
          "supply behind it, and the reorder is where that shows.",
      },
    ],
  },
  {
    heading: "Questions worth asking every supplier",
    blocks: [
      {
        type: "paragraph",
        text:
          "Each question below separates a document from a claim, and every one of them can be asked before a " +
          "purchase order exists.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ kind: "text", text: "Which steps run in your own plant, and which ones are subcontracted?" }],
          [{ kind: "text", text: "Can I see the certificate number, its scope and its validity date, so that I can check it with the issuing body myself?" }],
          [{ kind: "text", text: "How is a batch coded, and what is kept as a retained sample?" }],
          [{ kind: "text", text: "What change would you report to me before I place a repeat order?" }],
          [{ kind: "text", text: "Which machine produced the sample, and can the production line hold the same setting?" }],
          [{ kind: "text", text: "Who answers a technical question after the order, and through which channel?" }],
        ],
      },
      {
        type: "paragraph",
        text:
          "The last question is the one that decides whether a relationship survives a problem. Name the person who " +
          "carries a technical question after delivery, because that is the point at which the earlier answers are " +
          "tested. A supplier who answers it with a channel and a name is easier to work with than one who answers " +
          "only the first five.",
      },
    ],
  },
  {
    heading: "How Three Thai answers these points",
    blocks: [
      {
        type: "paragraph",
        text:
          "The list applies to us, so here is the same list answered from our own record rather than from a claim.",
      },
      {
        type: "prose",
        spans: [
          { kind: "text", text: "Certificate numbers, scopes and validity dates are published on the " },
          { kind: "link", text: "quality page", href: "/quality" },
          { kind: "text", text: ": the ISO 9001 system certificate and the OEKO-TEX Standard 100 Class I certificate for raw-white PVA yarn, with the TESTEX report behind it. The " },
          { kind: "link", text: "manufacturing page", href: "/manufacturing" },
          { kind: "text", text: " shows which steps run on our own equipment, from the blow room and blowing-carding line through drawing and ring spinning to automatic winding and conditioning. A sample request is handled through the " },
          { kind: "link", text: "sampling route", href: "/request-sample" },
          { kind: "text", text: ", so the grade is matched to your removal method rather than picked from a label." },
        ],
      },
      {
        type: "paragraph",
        text:
          "The granted devices are the part of that record a buyer can look up. Our portfolio covers the machinery " +
          "and test methods used on this material, including a variable-frequency ring spinning frame, a yarn " +
          "steaming device, an intelligent sampler for water-soluble yarn testing, and an openwork single-jersey " +
          "production device, alongside a dust purification device registered in Malta and a broken-end detection " +
          "device registered in Nigeria.",
      },
      {
        type: "paragraph",
        text:
          "The sampling answer works like this in practice. A buyer sends a count, the structure the yarn enters, " +
          "the target water temperature and the removal endpoint; the reply matches a grade group from the seven " +
          "we work to, covering 20\u00B0C, 40\u00B0C, 55\u00B0C, 60\u00B0C, 70\u00B0C, 80\u00B0C and 90\u00B0C process " +
          "targets, and the sample is sent with the same grade and method named on it.",
      },
    ],
  },
  {
    heading: "What to hold before the purchase order",
    blocks: [
      {
        type: "paragraph",
        text:
          "Before a purchase order goes out, the file should answer four things: the exact grade and construction " +
          "approved, the removal method the sample was judged against, the record that will accompany each " +
          "shipment, and the change notice that protects the next order. If any of the four is missing, that gap " +
          "belongs in the file before the order rather than in a conversation after it.",
      },
      {
        type: "callout",
        label: "No public price list",
        tone: "note",
        text:
          "We quote against a written specification, because a figure without a grade, a packing basis and a " +
          "delivery term cannot be set beside another supplier's figure. Send the brief and the quantity range you " +
          "are planning, and the quotation carries the same specification the sample was approved against.",
      },
      {
        type: "paragraph",
        text:
          "Keep the approved sample, the written method and the certificate numbers in one file. When a repeat " +
          "order arrives, that file is the specification, and the comparison between suppliers has already been " +
          "settled by what the evidence inside it can show.",
      },
    ],
  },
];
