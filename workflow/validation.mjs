import { assertNoAuthorityOverrides } from "./controller-context.mjs";
import { deriveValidationEvidenceInternal } from "./internal/validation-engine.mjs";

export function deriveValidationEvidence(options = {}) {
  assertNoAuthorityOverrides(options);
  return deriveValidationEvidenceInternal({ ...options, now: new Date() });
}
