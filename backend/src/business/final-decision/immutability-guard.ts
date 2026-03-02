import { FINAL_DECISION_REASON_CODES } from "./decision-outcome.js";
import type { PaperDecisionRecord } from "./ports.js";

export class DecisionFinalizedError extends Error {
  readonly reasonCode = FINAL_DECISION_REASON_CODES.DECISION_ALREADY_FINALIZED;

  constructor(message = "A final decision already exists for this paper.") {
    super(message);
    this.name = "DecisionFinalizedError";
  }
}

export class DecisionImmutabilityGuard {
  ensureNotFinalized(existing: PaperDecisionRecord | null): void {
    if (existing) {
      throw new DecisionFinalizedError();
    }
  }
}
