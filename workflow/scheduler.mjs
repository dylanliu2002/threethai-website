import { isDispatchEligibleInternal } from "./internal/scheduler-engine.mjs";

// Pure scheduling eligibility check. Live admission is exposed only through the
// canonical controller facade in controller.mjs.
export const isDispatchEligible = isDispatchEligibleInternal;
