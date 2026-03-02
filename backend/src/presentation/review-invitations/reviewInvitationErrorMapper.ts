import { z } from "zod";

import type { GetReviewInvitationOutcome } from "../../business/review-invitations/GetReviewInvitationUseCase.js";
import type { RespondToReviewInvitationOutcome } from "../../business/review-invitations/RespondToReviewInvitationUseCase.js";

export const ReviewInvitationErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string()
});

export const ReviewInvitationResponseSchema = z.object({
  invitationId: z.string(),
  paperId: z.string(),
  paperTitle: z.string(),
  paperSummary: z.string(),
  reviewDueAt: z.string(),
  responseDeadlineAt: z.string(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"])
});

export const InvitationValidationViolationSchema = z.object({
  rule: z.enum(["INVITATION_NOT_PENDING", "INVALID_DECISION_VALUE"]),
  message: z.string()
});

export const ReviewInvitationValidationErrorResponseSchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string(),
  violations: z.array(InvitationValidationViolationSchema)
});

export const ReviewInvitationDecisionSuccessResponseSchema = z.object({
  invitationId: z.string(),
  decision: z.enum(["ACCEPT", "REJECT"]),
  invitationStatus: z.enum(["ACCEPTED", "REJECTED"]),
  assignmentCreated: z.boolean(),
  message: z.string()
});

export function mapGetReviewInvitationOutcome(outcome: GetReviewInvitationOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SUCCESS":
      return {
        statusCode: 200,
        body: ReviewInvitationResponseSchema.parse({
          invitationId: outcome.invitationId,
          paperId: outcome.paperId,
          paperTitle: outcome.paperTitle,
          paperSummary: outcome.paperSummary,
          reviewDueAt: outcome.reviewDueAt,
          responseDeadlineAt: outcome.responseDeadlineAt,
          status: outcome.status
        })
      };
    case "AUTHORIZATION_FAILED":
      return {
        statusCode: 403,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INVITATION_NOT_FOUND":
      return {
        statusCode: 404,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INTERNAL_ERROR":
      return {
        statusCode: 500,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: "INTERNAL_ERROR",
          message: "Review invitation details are currently unavailable."
        })
      };
  }
}

export function mapRespondToReviewInvitationOutcome(
  outcome: RespondToReviewInvitationOutcome
): { statusCode: number; body: Record<string, unknown> } {
  switch (outcome.outcome) {
    case "SUCCESS":
      return {
        statusCode: 200,
        body: ReviewInvitationDecisionSuccessResponseSchema.parse({
          invitationId: outcome.invitationId,
          decision: outcome.decision,
          invitationStatus: outcome.invitationStatus,
          assignmentCreated: outcome.assignmentCreated,
          message: outcome.message
        })
      };
    case "VALIDATION_FAILED":
      return {
        statusCode: 400,
        body: ReviewInvitationValidationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message,
          violations: outcome.violations
        })
      };
    case "AUTHORIZATION_FAILED":
      return {
        statusCode: 403,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INVITATION_NOT_FOUND":
      return {
        statusCode: 404,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INVITATION_ALREADY_RESOLVED":
      return {
        statusCode: 409,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "RESPONSE_RECORDING_FAILED":
      return {
        statusCode: 500,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INTERNAL_ERROR":
      return {
        statusCode: 500,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: ReviewInvitationErrorResponseSchema.parse({
          code: "INTERNAL_ERROR",
          message: "Invitation response failed unexpectedly."
        })
      };
  }
}
