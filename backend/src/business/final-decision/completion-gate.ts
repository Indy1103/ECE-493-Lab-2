import type { DecisionCompletionStatusRecord } from "./ports.js";

export type DecisionCompletionGateDecision =
  | {
      allowed: true;
      status: DecisionCompletionStatusRecord;
    }
  | {
      allowed: false;
      status: DecisionCompletionStatusRecord;
      reasonCode: "pending-required-reviews";
    };

export class DecisionCompletionGate {
  evaluate(status: DecisionCompletionStatusRecord): DecisionCompletionGateDecision {
    if (status.status !== "COMPLETE") {
      return {
        allowed: false,
        status,
        reasonCode: "pending-required-reviews"
      };
    }

    if (status.completedReviewCount < status.requiredReviewCount) {
      return {
        allowed: false,
        status: {
          ...status,
          status: "PENDING"
        },
        reasonCode: "pending-required-reviews"
      };
    }

    return {
      allowed: true,
      status
    };
  }
}
