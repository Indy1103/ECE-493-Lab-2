import { z } from "zod";

import type { GetCompletedReviewsOutcome } from "../../business/review-visibility/get-completed-reviews.service.js";
import { REVIEW_VISIBILITY_OUTCOMES } from "../../business/review-visibility/visibility-outcome.js";

export const AnonymizedReviewEntrySchema = z.object({
  reviewId: z.string(),
  paperId: z.string(),
  summary: z.string(),
  scores: z.record(z.unknown()),
  recommendation: z.enum(["ACCEPT", "REJECT", "BORDERLINE"]),
  submittedAt: z.string()
});

export const CompletedReviewsResponseSchema = z.object({
  messageCode: z.literal("REVIEWS_VISIBLE"),
  paperId: z.string(),
  completedReviewCount: z.number().int().nonnegative(),
  requiredReviewCount: z.number().int().nonnegative(),
  reviews: z.array(AnonymizedReviewEntrySchema)
});

export const PendingReviewsResponseSchema = z.object({
  messageCode: z.literal("REVIEWS_PENDING"),
  message: z.string(),
  completedReviewCount: z.number().int().nonnegative(),
  requiredReviewCount: z.number().int().nonnegative()
});

export const ReviewVisibilityErrorResponseSchema = z.object({
  messageCode: z.enum(["UNAVAILABLE_DENIED", "SESSION_EXPIRED"]),
  message: z.string()
});

export function buildReviewVisibilitySessionExpiredResponse() {
  return {
    statusCode: 401,
    body: ReviewVisibilityErrorResponseSchema.parse({
      messageCode: REVIEW_VISIBILITY_OUTCOMES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again."
    })
  };
}

export function mapReviewVisibilityOutcome(outcome: GetCompletedReviewsOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "REVIEWS_VISIBLE":
      return {
        statusCode: 200,
        body: CompletedReviewsResponseSchema.parse({
          messageCode: outcome.messageCode,
          paperId: outcome.paperId,
          completedReviewCount: outcome.completedReviewCount,
          requiredReviewCount: outcome.requiredReviewCount,
          reviews: outcome.reviews.map((review) => ({
            ...review,
            submittedAt: review.submittedAt.toISOString()
          }))
        })
      };
    case "REVIEWS_PENDING":
      return {
        statusCode: 409,
        body: PendingReviewsResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message,
          completedReviewCount: outcome.completedReviewCount,
          requiredReviewCount: outcome.requiredReviewCount
        })
      };
    case "UNAVAILABLE_DENIED":
      return {
        statusCode: outcome.statusCode,
        body: ReviewVisibilityErrorResponseSchema.parse({
          messageCode: outcome.messageCode,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 404,
        body: ReviewVisibilityErrorResponseSchema.parse({
          messageCode: REVIEW_VISIBILITY_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Completed reviews are unavailable for this paper."
        })
      };
  }
}
