# Resources editorial voice — rules for removing the machine accent

Status: **proposed, not approved.** These rules exist because CONTENT-QUALITY-001A found
the `/knowledge` copy reading like generated prose, and because the R1/R2 rewrite that
followed it (Task 62) still reads that way — the fixes were structural (tables, real
numbers, citations), not tonal. The owner flagged exactly that: the copy does not read
like a person who has stood next to a spinning frame wrote it.

Every bad example below is a sentence this repository actually shipped. That is deliberate:
a rule illustrated with someone else's prose is easy to agree with and hard to apply.

One thing to state plainly at the top. **The person who wrote the offending sentences is
the person writing these rules.** These constraints reduce the tells; they cannot certify
the result. Before any of this merges, the copy needs a read-through by someone who has
sat through a mill trial — see *Review gates* at the end.

## The seven tells, with the sentence that shows each

### 1. The aphoristic closer

Every section ends by flipping its own point into a quotable line. Real technical writing
ends on the next action, the limit, or the number.

> `Ask for them; the answer you get is the test.`
> `A method that lives in a laboratory notebook cannot reject anything.`
> `…and only one of them resembles production.`

**Rule:** a section may not end on a reversal, an epigram, or a sentence whose subject is
an abstraction (`method`, `question`, `answer`, `claim`). End on what the reader does, who
signs it, or what fails. If a section cannot, it is probably the previous section's summary
and should be cut.

### 2. The em dash as a habit

Sentence-level dashes cluster in AI prose because they let a clause bolt onto a clause
without an argument. A draft of one article here averaged more than one per paragraph.

> `Exposure time — how long the material actually stays in contact with water, including
> the dwell a machine gives it.`

**Rule:** at most one em dash per paragraph, and never twice in one sentence. In list items,
use a colon or rewrite the item as a clause. (The dash-free forms above read cleaner:
`Exposure time: how long the material actually stays wet.`)

### 3. Identically-shaped bullets

Five bullets, each `Term — explanation`, each about the same length. Symmetry is the single
strongest tell, and it is a formatting habit rather than a thinking habit.

**Rule:** bullets in one list must differ in length, and no list may have every item opening
with the same part of speech. If a list wants uniform shape, it is a table or a definition
list and should be one of those instead.

### 4. Framing a question instead of answering it

> `The question a buyer can actually act on is whether the next shipment behaves like the
> one they approved…`
> `What a temperature label actually commits to`

Both spend their words announcing that a question matters. A specialist states the thing.

**Rule:** delete any sentence whose content is that something is important, decisive, or
worth asking. Also banned as section headings: `What X actually means`, `Understanding X`,
`Why X matters`, `X: what to know before Y`.

### 5. Numbers held back

The R2 rewrite cites a certificate number, a tex count and a pH — and many neighbouring
sections contain no figure at all, because figures were treated as the risky part and prose
as the safe part. That inverts reality: the numbers are the only reason to trust the page.

**Rule:** every section carries at least one *checkable particular* — a document number, a
count, a temperature, a date, a machine name, a named test item. Where the repository has no
particular, the section says so in one flat sentence and stops, rather than filling the space
with generalities about process conditions. Never invent one to satisfy this rule.

### 6. The two-sided hedge

> `Some applications require controlled removal, while others need the material to remain…`
> `Neither observation is wrong; they are different tests.`

Balancing two clauses to avoid committing is what an unaccountable voice does.

**Rule:** pick the case that matters to the reader and write it. Where both genuinely apply,
name the discriminator (`if the surrounding article cannot take heat, …`) instead of
symmetrically shrugging.

### 7. Vocabulary that has no referent in a mill

`production-representative`, `defensible endpoint`, `residual condition`, `structural
support role`, `controlled removal`, `application-led`. Each is a noun phrase standing in for
an act somebody performs.

**Rule:** banned as written. Say what happens on the floor, using the site's existing
terminology — `浴比`, `条干均匀度`, `回潮率`, `捻向`, `卷装`, `蒸纱`, `调湿`, `终点` — and
the plain English they correspond to. If a phrase cannot be said to a spinner without
gesturing, it is out.

## House style, so the fix is not just "less like a machine"

- **Sentence length must vary.** If three consecutive sentences are within ~10 words of each
  other, rewrite one. Short declaratives are allowed and underused: `That is not a
  specification.`
- **Second person sparingly.** `you` for the reader's decisions, not for narration. No
  `we are delighted`, no `let's explore`.
- **First person plural only for things Three Thai does**, and only where the repository
  already states it: certificate scope, published report parameters, registered devices, the
  seven dissolution process targets. Not capability, not quality, not `best`.
- **No intensifiers.** No `crucial`, `essential`, `robust`, `comprehensive`, `ensure`,
  `leverage`, `landscape`, `delve`, `in today's world`, `game-changer`.
- **Links carry a reason.** `see <title>, which fixes the stage definitions` — never
  `click here`, never a bare related-links dump.
- **Tables state their own limit.** The R2 evidence table's third column
  (`What it does not prove`) is the pattern: name what a document cannot be used to say.
- **British spellings** to match the site (`fibre`, `metre`, `programme`) — check any new copy
  against `src/content/legacy-source.ts` before importing American forms.

## Review gates

1. Automated: figure-traceability and no-fabricated-claim tests in
   `tests/intl-dees-001-es-de-localization.mjs` must stay green; they catch invented numbers,
   not bad prose.
2. **A human read of the English by someone with textile production experience.** Needed
   for tells 1, 3, 6 and 7, which no test can see.
3. **A native Chinese read-through of the zh bodies**, which Task 62 authored. Rule 7 applies
   hardest there: the zh copy must read as written by a Chinese textile technical writer, not
   as translated English.
4. Spanish and German card labels (`category`, `title`, `intro` in `src/content/card-copy.ts`)
   are drafted by me against the glossary in that file's header comment and are
   **pending translator review** — they are card labels, not the promotion seam, so they carry
   no approved-translation claim, but they still should not ship unexamined.
