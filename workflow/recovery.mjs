import fs from "node:fs";
import path from "node:path";
import { resolveCanonicalControllerContext } from "./controller-context.mjs";
import { RuntimeEventSchema } from "./schemas.mjs";
import { reconcileRuntimeInternal, replayEventsInternal } from "./internal/recovery-engine.mjs";

export function readEventDirectory(runtimeDirectory) {
  if (!runtimeDirectory || !fs.existsSync(runtimeDirectory)) return [];
  const candidates = fs.statSync(runtimeDirectory).isDirectory()
    ? [path.join(runtimeDirectory, "controller-journal.jsonl")]
    : [runtimeDirectory];
  return candidates.filter(fs.existsSync).flatMap((file) =>
    fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)
      .map((line) => RuntimeEventSchema.parse(JSON.parse(line))));
}

export const replayEvents = replayEventsInternal;

export function reconcileRuntime(repoRoot) {
  const context = resolveCanonicalControllerContext(repoRoot);
  return reconcileRuntimeInternal(context.state_directory, { repair: false });
}
