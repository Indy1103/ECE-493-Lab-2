import { z } from "zod";

import type { GetAuthorDecisionOutcome } from "../../business/author-decision/get-author-decision.service.js";
import { AUTHOR_DECISION_OUTCOMES } from "../../business/author-decision/decision-outcome.js";

export const DecisionAvailableResponseSchema = z.object({
  outcome: z.literal("DECISION_AVAILABLE"),
  paperId: z.string(),
  decision: z.enum(["ACCEPT", "REJECT"])
});

export const NotificationFailedResponseSchema = z.object({
  outcome: z.literal("NOTIFICATION_FAILED"),
  message: z.string()
});

export const AuthorDecisionErrorResponseSchema = z.object({
  outcome: z.enum(["UNAVAILABLE_DENIED", "SESSION_EXPIRED"]),
  message: z.string()
});

export function buildAuthorDecisionSessionExpiredResponse() {
  return {
    statusCode: 401,
    body: AuthorDecisionErrorResponseSchema.parse({
      outcome: AUTHOR_DECISION_OUTCOMES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again."
    })
  };
}

export function mapGetAuthorDecisionOutcome(outcome: GetAuthorDecisionOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "DECISION_AVAILABLE":
      return {
        statusCode: 200,
        body: DecisionAvailableResponseSchema.parse({
          outcome: outcome.outcomeCode,
          paperId: outcome.paperId,
          decision: outcome.decision
        })
      };
    case "NOTIFICATION_FAILED":
      return {
        statusCode: 409,
        body: NotificationFailedResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message
        })
      };
    case "UNAVAILABLE_DENIED":
      return {
        statusCode: outcome.statusCode,
        body: AuthorDecisionErrorResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 404,
        body: AuthorDecisionErrorResponseSchema.parse({
          outcome: AUTHOR_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Decision is unavailable for this paper."
        })
      };
  }
}
