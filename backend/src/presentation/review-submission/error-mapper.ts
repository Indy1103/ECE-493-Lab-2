import { z } from "zod";

import type {
  GetReviewFormOutcome,
  SubmitReviewOutcome
} from "../../business/review-submission/submit-review.service.js";
import { REVIEW_SUBMISSION_OUTCOMES } from "../../business/review-submission/submission-outcome.js";

export const ReviewFormResponseSchema = z.object({
  messageCode: z.literal("REVIEW_FORM_AVAILABLE"),
  assignmentId: z.string(),
  formVersion: z.string(),
  fields: z.array(
    z.object({
      fieldId: z.string(),
      required: z.boolean(),
      constraints: z.array(z.string()).optional()
    })
  )
});

export const ReviewSubmissionSuccessResponseSchema = z.object({
  messageCode: z.literal("REVIEW_SUBMISSION_ACCEPTED"),
  submissionId: z.string(),
  submittedAt: z.string()
});

export const ValidationIssueSchema = z.object({
  fieldId: z.string(),
  issue: z.string()
});

export const ValidationFailedResponseSchema = z.object({
  messageCode: z.literal("validation-failed"),
  message: z.string(),
  issues: z.array(ValidationIssueSchema)
});

export const ReviewSubmissionErrorResponseSchema = z.object({
  messageCode: z.enum(["session-expired", "submission-unavailable"]),
  message: z.string(),
  reasonCode: z
    .enum(["non-owned-or-non-assigned", "submit-time-ineligible", "duplicate-final-submission"])
    .optional()
});

export function buildSessionExpiredResponse() {
  return {
    statusCode: 401,
    body: ReviewSubmissionErrorResponseSchema.parse({
      messageCode: REVIEW_SUBMISSION_OUTCOMES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again."
    })
  };
}

export function mapReviewFormOutcome(outcome: GetReviewFormOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "REVIEW_FORM_AVAILABLE":
      return {
        statusCode: 200,
        body: ReviewFormResponseSchema.parse({
          messageCode: outcome.messageCode,
          assignmentId: outcome.assignmentId,
          formVersion: outcome.formVersion,
          fields: outcome.fields
        })
      };
    case "SUBMISSION_UNAVAILABLE":
      return {
        statusCode: outcome.statusCode,
        body: ReviewSubmissionErrorResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message,
          reasonCode: outcome.reasonCode
        })
      };
    default:
      return {
        statusCode: 404,
        body: ReviewSubmissionErrorResponseSchema.parse({
          messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
          message: "This review submission is unavailable.",
          reasonCode: "non-owned-or-non-assigned"
        })
      };
  }
}

export function mapSubmitReviewOutcome(outcome: SubmitReviewOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "REVIEW_SUBMISSION_ACCEPTED":
      return {
        statusCode: 201,
        body: ReviewSubmissionSuccessResponseSchema.parse({
          messageCode: outcome.messageCode,
          submissionId: outcome.submissionId,
          submittedAt: outcome.submittedAt
        })
      };
    case "VALIDATION_FAILED":
      return {
        statusCode: 400,
        body: ValidationFailedResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message,
          issues: outcome.issues
        })
      };
    case "SUBMISSION_UNAVAILABLE":
      return {
        statusCode: outcome.statusCode,
        body: ReviewSubmissionErrorResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message,
          reasonCode: outcome.reasonCode
        })
      };
    default:
      return {
        statusCode: 409,
        body: ReviewSubmissionErrorResponseSchema.parse({
          messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
          message: "This review submission is unavailable.",
          reasonCode: "submit-time-ineligible"
        })
      };
  }
}
