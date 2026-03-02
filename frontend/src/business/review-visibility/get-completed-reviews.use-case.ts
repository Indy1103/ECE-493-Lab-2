import {
  getCompletedReviews,
  type ReviewVisibilityClientResult
} from "../../data/review-visibility/review-visibility.api.js";

export type ReviewVisibilityViewState =
  | {
      state: "VISIBLE";
      paperId: string;
      completedReviewCount: number;
      requiredReviewCount: number;
      reviews: Array<{
        reviewId: string;
        paperId: string;
        summary: string;
        scores: Record<string, unknown>;
        recommendation: "ACCEPT" | "REJECT" | "BORDERLINE";
        submittedAt: string;
      }>;
    }
  | {
      state: "PENDING";
      message: string;
      completedReviewCount: number;
      requiredReviewCount: number;
    }
  | {
      state: "ERROR";
      code: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapReviewVisibilityResult(result: ReviewVisibilityClientResult): ReviewVisibilityViewState {
  if (result.status === "REVIEWS_VISIBLE") {
    return {
      state: "VISIBLE",
      paperId: result.paperId,
      completedReviewCount: result.completedReviewCount,
      requiredReviewCount: result.requiredReviewCount,
      reviews: result.reviews
    };
  }

  if (result.status === "REVIEWS_PENDING") {
    return {
      state: "PENDING",
      message: result.message,
      completedReviewCount: result.completedReviewCount,
      requiredReviewCount: result.requiredReviewCount
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}

export async function getCompletedReviewsUseCase(
  paperId: string,
  baseUrl = ""
): Promise<ReviewVisibilityViewState> {
  const result = await getCompletedReviews(paperId, baseUrl);
  return mapReviewVisibilityResult(result);
}

export const REVIEW_VISIBILITY_USE_CASE_MARKER = "review_visibility_use_case_marker" as const;
