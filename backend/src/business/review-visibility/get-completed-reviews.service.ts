import type { AnonymizedReviewEntry, ReviewVisibilityRepository } from "./ports.js";
import { ReviewCompletionGate } from "./completion-gate.js";
import { ReviewVisibilityAnonymizer } from "./anonymizer.js";
import { ReviewVisibilityAuditLogger } from "./audit-logger.js";
import {
  REVIEW_VISIBILITY_OUTCOMES,
  REVIEW_VISIBILITY_REASON_CODES
} from "./visibility-outcome.js";

export type GetCompletedReviewsOutcome =
  | {
      outcome: "REVIEWS_VISIBLE";
      messageCode: "REVIEWS_VISIBLE";
      paperId: string;
      completedReviewCount: number;
      requiredReviewCount: number;
      reviews: AnonymizedReviewEntry[];
    }
  | {
      outcome: "REVIEWS_PENDING";
      messageCode: "REVIEWS_PENDING";
      message: string;
      completedReviewCount: number;
      requiredReviewCount: number;
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      messageCode: "UNAVAILABLE_DENIED";
      message: string;
      statusCode: 403 | 404;
    };

interface GetCompletedReviewsServiceDeps {
  repository: Pick<
    ReviewVisibilityRepository,
    "withPaperReadLock" | "getCompletionStatus" | "getCompletedReviews"
  >;
  completionGate: ReviewCompletionGate;
  anonymizer: ReviewVisibilityAnonymizer;
  auditLogger: ReviewVisibilityAuditLogger;
}

export class GetCompletedReviewsService {
  constructor(private readonly deps: GetCompletedReviewsServiceDeps) {}

  async execute(input: {
    editorUserId: string;
    paperId: string;
    requestId: string;
  }): Promise<GetCompletedReviewsOutcome> {
    return this.deps.repository.withPaperReadLock(input.paperId, async () => {
      let completionStatus: Awaited<ReturnType<ReviewVisibilityRepository["getCompletionStatus"]>> = null;

      try {
        completionStatus = await this.deps.repository.getCompletionStatus(input.paperId, input.editorUserId);
      } catch {
        completionStatus = null;
      }

      if (!completionStatus) {
        await this.deps.auditLogger.record({
          actorUserId: input.editorUserId,
          paperId: input.paperId,
          outcome: REVIEW_VISIBILITY_OUTCOMES.UNAVAILABLE_DENIED,
          reasonCode: REVIEW_VISIBILITY_REASON_CODES.PAPER_NOT_FOUND_OR_DENIED,
          metadata: { requestId: input.requestId }
        });

        return {
          outcome: "UNAVAILABLE_DENIED",
          messageCode: REVIEW_VISIBILITY_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Completed reviews are unavailable for this paper.",
          statusCode: 404
        };
      }

      const gateDecision = this.deps.completionGate.evaluate(completionStatus);

      if (!gateDecision.allowed) {
        await this.deps.auditLogger.record({
          actorUserId: input.editorUserId,
          paperId: input.paperId,
          outcome: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_PENDING,
          reasonCode: REVIEW_VISIBILITY_REASON_CODES.PENDING_REQUIRED_REVIEWS,
          metadata: {
            requestId: input.requestId,
            completedReviewCount: gateDecision.status.completedReviewCount,
            requiredReviewCount: gateDecision.status.requiredReviewCount
          }
        });

        return {
          outcome: "REVIEWS_PENDING",
          messageCode: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_PENDING,
          message: "Required reviews are still pending for this paper.",
          completedReviewCount: gateDecision.status.completedReviewCount,
          requiredReviewCount: gateDecision.status.requiredReviewCount
        };
      }

      let reviews: Awaited<ReturnType<ReviewVisibilityRepository["getCompletedReviews"]>> = [];
      try {
        reviews = await this.deps.repository.getCompletedReviews(input.paperId, input.editorUserId);
      } catch {
        reviews = [];
      }

      const anonymizedReviews = this.deps.anonymizer.anonymizeReviews(reviews);

      await this.deps.auditLogger.record({
        actorUserId: input.editorUserId,
        paperId: input.paperId,
        outcome: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_VISIBLE,
        reasonCode: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_VISIBLE,
        metadata: {
          requestId: input.requestId,
          reviewCount: anonymizedReviews.length,
          reviews: anonymizedReviews
        }
      });

      return {
        outcome: "REVIEWS_VISIBLE",
        messageCode: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_VISIBLE,
        paperId: input.paperId,
        completedReviewCount: completionStatus.completedReviewCount,
        requiredReviewCount: completionStatus.requiredReviewCount,
        reviews: anonymizedReviews
      };
    });
  }
}
