import { resolveCanonicalControllerContext } from "./controller-context.mjs";
import {
  emptyControllerStateInternal,
  readControllerStateInternal,
  recoverControllerStateInternal,
  replayControllerJournalInternal,
} from "./internal/controller-state-engine.mjs";

// Public runtime state access is read-only and resolves the canonical store.
export function readControllerState(repoRoot) {
  const context = resolveCanonicalControllerContext(repoRoot);
  return readControllerStateInternal(context.state_directory);
}

export function recoverControllerState(repoRoot) {
  const context = resolveCanonicalControllerContext(repoRoot);
  return recoverControllerStateInternal(context.state_directory, { repair: false });
}

// Pure DATA utilities; neither accepts or mutates an authority location.
export function emptyControllerState() { return emptyControllerStateInternal(); }
export function replayControllerJournal(events) { return replayControllerJournalInternal(events); }
