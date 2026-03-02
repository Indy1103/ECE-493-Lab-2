import { z } from "zod";

import type { AccessAssignedPaperOutcome } from "../../business/referee-access/accessAssignedPaperService.js";
import type { ListAssignmentsOutcome } from "../../business/referee-access/listAssignmentsService.js";
import { REFEREE_ACCESS_OUTCOMES } from "../../shared/accessOutcomes.js";

export const AssignmentSummarySchema = z.object({
  assignmentId: z.string(),
  paperId: z.string(),
  title: z.string(),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE"])
});

export const AssignmentListResponseSchema = z.object({
  items: z.array(AssignmentSummarySchema),
  messageCode: z.enum(["ASSIGNMENTS_AVAILABLE", "NO_ASSIGNMENTS"])
});

export const AccessGrantedResponseSchema = z.object({
  messageCode: z.literal("ACCESS_GRANTED"),
  paper: z.object({
    paperId: z.string(),
    title: z.string(),
    contentUrl: z.string().url()
  }),
  reviewForm: z.object({
    reviewFormId: z.string(),
    schemaVersion: z.string(),
    formUrl: z.string().url()
  })
});

export const RefereeAccessErrorResponseSchema = z.object({
  messageCode: z.enum([
    "SESSION_EXPIRED",
    "UNAVAILABLE",
    "UNAVAILABLE_OR_NOT_FOUND",
    "INTERNAL_ERROR",
    "TLS_REQUIRED"
  ]),
  message: z.string()
});

export function buildSessionExpiredResponse(): {
  statusCode: 401;
  body: Record<string, unknown>;
} {
  return {
    statusCode: 401,
    body: RefereeAccessErrorResponseSchema.parse({
      messageCode: REFEREE_ACCESS_OUTCOMES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again."
    })
  };
}

export function mapListAssignmentsOutcome(outcome: ListAssignmentsOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "ASSIGNMENTS_AVAILABLE":
    case "NO_ASSIGNMENTS":
      return {
        statusCode: 200,
        body: AssignmentListResponseSchema.parse({
          items: outcome.items,
          messageCode: outcome.messageCode
        })
      };
    case "INTERNAL_ERROR":
      return {
        statusCode: 500,
        body: RefereeAccessErrorResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: RefereeAccessErrorResponseSchema.parse({
          messageCode: REFEREE_ACCESS_OUTCOMES.INTERNAL_ERROR,
          message: "Assigned papers are temporarily unavailable."
        })
      };
  }
}

export function mapAccessAssignedPaperOutcome(outcome: AccessAssignedPaperOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "ACCESS_GRANTED":
      return {
        statusCode: 200,
        body: AccessGrantedResponseSchema.parse({
          messageCode: outcome.messageCode,
          paper: outcome.paper,
          reviewForm: outcome.reviewForm
        })
      };
    case "UNAVAILABLE":
      return {
        statusCode: 409,
        body: {
          ...RefereeAccessErrorResponseSchema.parse({
            messageCode: outcome.messageCode,
            message: outcome.message
          }),
          items: outcome.items
        }
      };
    case "UNAVAILABLE_OR_NOT_FOUND":
      return {
        statusCode: 404,
        body: RefereeAccessErrorResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message
        })
      };
    case "INTERNAL_ERROR":
      return {
        statusCode: 500,
        body: RefereeAccessErrorResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: RefereeAccessErrorResponseSchema.parse({
          messageCode: REFEREE_ACCESS_OUTCOMES.INTERNAL_ERROR,
          message: "Assigned paper access failed unexpectedly."
        })
      };
  }
}
