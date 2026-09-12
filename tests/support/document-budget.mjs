/**
 * A per-route document byte budget, measured against a pinned baseline.
 *
 * Why this replaced a population ceiling
 * --------------------------------------
 * The guard that lived here set a ceiling on the *average* — later the median — of
 * every untranslated document. A single aggregate number cannot answer the question
 * the guard exists to answer, because two very different events both move it:
 *
 *   - a **leak**: something added to every page. The rejected complete-map
 *     encoding cost +3,210 B per document; the INTL-DEES-003B policy-in-the-client
 *     leak cost +1,684 B raw / +586 B gzip on a chunk loaded by 220 of 222 pages.
 *   - **content**: a longer article, on the handful of documents that carry it.
 *
 * An aggregate punishes the second case, and a content programme of any size runs
 * the ceiling into the ground: nine planned Resources articles would leave 142 B of
 * margin on a population whose measured build-to-build movement is itself tens of
 * bytes. The honest fixes there are "delete the content" or "raise the number", and
 * neither is a guard any more.
 *
 * So the population is split by *identity of cause* instead of by aggregate:
 *
 *   1. routes this task did not touch are compared to a pinned baseline, document
 *      against document — a leak cannot hide, because it must show up on pages that
 *      were supposed to be unchanged, and one 3 KB surprise on one page fails;
 *   2. the same documents are measured on their **inline payload** bytes, which is
 *      where the serialized dictionary and the RSC flight data live. Article prose
 *      never reaches it; a dictionary or policy change always does;
 *   3. documents allowed to grow are named one by one, and only on knowledge routes.
 *
 * Everything here is a pure function over plain arrays so the three rules can be
 * falsified with synthetic data — an assertion nobody can make fail is not a guard.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Tolerance for nondeterministic output.
 *
 * Measured rather than guessed: three consecutive `npm run build` runs of one commit
 * on 2026-09-11 produced 220 documents with **zero** bytes of movement, per document
 * and per inline payload. 0 B would therefore be sufficient today and would be brittle
 * tomorrow — chunk names, build ids and Next's own code generation can legitimately
 * shift a few bytes without any input changing — so the allowance is small but non-zero,
 * and far below the ~1,684 B and ~3,210 B leaks this must catch.
 */
export const NOISE_TOLERANCE_BYTES = 64;

/** Locales served under a path prefix; English owns the prefix-free path. */
const PREFIXED_LOCALES = ["zh", "es", "de"];

/** The document-relative path of a route inside the prerender tree, all locales. */
function documentPaths(route) {
  const bare = route.replace(/^\//, "").replace(/\/$/, "");
  return [
    `${bare}.html`,
    `${bare}/index.html`,
    ...PREFIXED_LOCALES.flatMap((locale) => [`${locale}/${bare}.html`, `${locale}/${bare}/index.html`]),
  ];
}

/**
 * The canonical route a prerendered document belongs to, with the locale prefix and
 * the `index.html` tail removed. `zh/knowledge/x.html` and `knowledge/x/index.html`
 * are both `/knowledge/x`, so one allowlist entry covers a route in every locale and
 * no locale can be smuggled past the allowance by being spelled differently.
 */
export function routeOf(relativeDocument) {
  let rel = relativeDocument.replace(/\.html$/, "");
  const segments = rel.split("/");
  if (segments[segments.length - 1] === "index") segments.pop();
  if (PREFIXED_LOCALES.includes(segments[0])) segments.shift();
  return `/${segments.join("/")}`;
}

export function isKnowledgeRoute(route) {
  return /^\/knowledge\/[^/]+$/.test(route);
}

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => (xs.length === 0 ? 0 : sum(xs) / xs.length);
export const median = (xs) => {
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Compare a build against the pinned baseline.
 *
 * @param entries      `[{ rel, bytes, scriptBytes }]` for the documents in this build
 * @param baseline     `{ [rel]: { bytes, scriptBytes } }` from the recorded tree
 * @param allowedGrowth  routes this task intentionally changes; knowledge routes only
 * @returns violations plus the numbers to report, so a passing run still shows its deltas
 */
export function budgetReport({
  entries,
  baseline,
  allowedGrowth = [],
  toleranceBytes = NOISE_TOLERANCE_BYTES,
}) {
  const violations = [];

  // The allowance must stay an explicit, checkable list rather than a wildcard.
  for (const route of allowedGrowth) {
    if (!isKnowledgeRoute(route)) {
      violations.push({ kind: "allowlist-not-knowledge", route, detail: `${route} is not a /knowledge/<slug> route` });
    }
    if (!entries.some((entry) => routeOf(entry.rel) === route)) {
      violations.push({ kind: "allowlist-stale", route, detail: `allowlisted route renders no document — drop it` });
    }
  }
  const allowed = new Set(allowedGrowth);

  const seen = new Set();
  const unchangedDeltas = [];
  const sharedDeltas = [];
  const grew = [];

  for (const entry of entries) {
    const route = routeOf(entry.rel);
    seen.add(entry.rel);

    if (allowed.has(route)) {
      const before = baseline[entry.rel];
      grew.push({ rel: entry.rel, route, bytes: entry.bytes, baselineBytes: before?.bytes ?? null });
      continue;
    }

    const before = baseline[entry.rel];
    if (!before) {
      violations.push({
        kind: "unbaselined-document",
        route,
        detail: `${entry.rel} is new or renamed and not covered by the growth allowance. Either it is an ` +
          `unintended new document, or this task changed it and must regenerate the baseline.`,
      });
      continue;
    }

    const delta = entry.bytes - before.bytes;
    const scriptDelta = entry.scriptBytes - before.scriptBytes;
    unchangedDeltas.push(delta);
    sharedDeltas.push(scriptDelta);

    if (delta > toleranceBytes) {
      violations.push({
        kind: "unchanged-route-grew",
        route,
        detail: `${entry.rel} grew ${delta} B over its ${before.bytes} B baseline (tolerance ${toleranceBytes} B). ` +
          `This route was not supposed to change.`,
      });
    }
    if (scriptDelta > toleranceBytes) {
      violations.push({
        kind: "shared-payload-grew",
        route,
        detail: `${entry.rel} carries ${scriptDelta} B more inline payload than its baseline. The dictionary and ` +
          `flight data live here: page content does not reach it, so this is shared state entering every page.`,
      });
    }
  }

  for (const rel of Object.keys(baseline)) {
    if (!seen.has(rel) && !allowed.has(routeOf(rel))) {
      violations.push({ kind: "baseline-document-missing", route: routeOf(rel), detail: `${rel} disappeared from the build` });
    }
  }

  return {
    violations,
    documents: entries.length,
    unchangedDocuments: unchangedDeltas.length,
    // A signed maximum is what the violation rule cares about, because only growth can
    // fail. It is the wrong number to *report*: on Task 62 the reworded article shrank
    // 408 B in three locales and the signed max still read 0 B, which looks like a
    // build that changed nothing. So report the largest movement either way, and how
    // many documents moved at all.
    medianUnchangedDelta: Math.round(median(unchangedDeltas)),
    maxUnchangedDelta: unchangedDeltas.length ? Math.max(...unchangedDeltas) : 0,
    maxAbsUnchangedDelta: unchangedDeltas.length ? Math.max(...unchangedDeltas.map(Math.abs)) : 0,
    movedDocuments: unchangedDeltas.filter((delta) => delta !== 0).length,
    medianSharedDelta: Math.round(median(sharedDeltas)),
    maxSharedDelta: sharedDeltas.length ? Math.max(...sharedDeltas) : 0,
    maxAbsSharedDelta: sharedDeltas.length ? Math.max(...sharedDeltas.map(Math.abs)) : 0,
    meanSharedPayload: Math.round(mean(entries.map((entry) => entry.scriptBytes))),
    grew,
  };
}

/**
 * Read a build into the shape `budgetReport` wants.
 *
 * Mirrors the walk the rest of the SEO suites use, and deliberately excludes the
 * `_`-prefixed Next internals (`_not-found`, the parallel-route tree documents) and
 * `api/`: those are not pages a buyer reaches, and counting them would make the
 * budget move whenever Next's own routing plumbing changes.
 */
export function walkDocuments(appRoot) {
  const out = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "api" || entry.startsWith("_")) continue;
      const absolute = path.join(dir, entry);
      if (statSync(absolute).isDirectory()) visit(absolute);
      else if (entry.endsWith(".html")) out.push(absolute);
    }
  };
  if (existsSync(appRoot)) visit(appRoot);
  return out;
}

export function measureDocuments(appRoot) {
  return walkDocuments(appRoot)
    .map((absolute) => {
      const rel = path.relative(appRoot, absolute).split(path.sep).join("/");
      const html = readFileSync(absolute, "utf8");
      const scriptBytes = (html.match(/<script[\s\S]*?<\/script>/g) ?? [])
        .reduce((total, tag) => total + Buffer.byteLength(tag), 0);
      return { rel, bytes: Buffer.byteLength(html), scriptBytes };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

/** Serialize the current build as the new baseline. */
export function baselineFixture(entries, { baseCommit, toleranceBytes, note }) {
  const documents = {};
  for (const entry of entries) documents[entry.rel] = { bytes: entry.bytes, scriptBytes: entry.scriptBytes };
  return `${JSON.stringify({
    $note: note ?? "Per-document byte budget, regenerated deliberately by the task that changed a route.",
    $baseCommit: baseCommit,
    $toleranceBytes: toleranceBytes,
    documents,
  }, null, 2)}\n`;
}
