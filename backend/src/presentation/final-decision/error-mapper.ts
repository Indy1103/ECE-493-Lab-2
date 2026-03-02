import { z } from "zod";

import type { PostFinalDecisionOutcome } from "../../business/final-decision/post-final-decision.service.js";
import { FINAL_DECISION_OUTCOMES } from "../../business/final-decision/decision-outcome.js";

export const DecisionRecordedResponseSchema = z.object({
  outcome: z.literal("DECISION_RECORDED"),
  paperId: z.string(),
  decision: z.enum(["ACCEPT", "REJECT"]),
  decidedAt: z.string(),
  notificationStatus: z.enum(["NOTIFIED", "NOTIFICATION_FAILED"]),
  message: z.string()
});

export const DecisionBlockedResponseSchema = z.object({
  outcome: z.enum(["REVIEWS_PENDING", "DECISION_FINALIZED"]),
  message: z.string(),
  completedReviewCount: z.number().int().nonnegative().optional(),
  requiredReviewCount: z.number().int().nonnegative().optional()
});

export const FinalDecisionErrorResponseSchema = z.object({
  outcome: z.enum(["UNAVAILABLE_DENIED", "SESSION_EXPIRED"]),
  message: z.string()
});

export function buildFinalDecisionSessionExpiredResponse() {
  return {
    statusCode: 401,
    body: FinalDecisionErrorResponseSchema.parse({
      outcome: FINAL_DECISION_OUTCOMES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again."
    })
  };
}

export function mapPostFinalDecisionOutcome(outcome: PostFinalDecisionOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "DECISION_RECORDED":
      return {
        statusCode: 200,
        body: DecisionRecordedResponseSchema.parse({
          outcome: outcome.outcomeCode,
          paperId: outcome.paperId,
          decision: outcome.decision,
          decidedAt: outcome.decidedAt,
          notificationStatus: outcome.notificationStatus,
          message: outcome.message
        })
      };
    case "REVIEWS_PENDING":
      return {
        statusCode: 409,
        body: DecisionBlockedResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message,
          completedReviewCount: outcome.completedReviewCount,
          requiredReviewCount: outcome.requiredReviewCount
        })
      };
    case "DECISION_FINALIZED":
      return {
        statusCode: 409,
        body: DecisionBlockedResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message
        })
      };
    case "UNAVAILABLE_DENIED":
      return {
        statusCode: outcome.statusCode,
        body: FinalDecisionErrorResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 404,
        body: FinalDecisionErrorResponseSchema.parse({
          outcome: FINAL_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Final decision is unavailable for this paper."
        })
      };
  }
}
