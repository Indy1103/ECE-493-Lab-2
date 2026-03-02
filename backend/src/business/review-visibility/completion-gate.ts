import type { ReviewCompletionStatusRecord } from "./ports.js";

export type CompletionGateDecision =
  | {
      allowed: true;
      status: ReviewCompletionStatusRecord;
    }
  | {
      allowed: false;
      status: ReviewCompletionStatusRecord;
      reasonCode: "pending-required-reviews";
    };

export class ReviewCompletionGate {
  evaluate(status: ReviewCompletionStatusRecord): CompletionGateDecision {
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
