export interface AnonymizedReviewEntry {
  reviewId: string;
  paperId: string;
  summary: string;
  scores: Record<string, unknown>;
  recommendation: "ACCEPT" | "REJECT" | "BORDERLINE";
  submittedAt: string;
}

export type ReviewVisibilityClientResult =
  | {
      status: "REVIEWS_VISIBLE";
      paperId: string;
      completedReviewCount: number;
      requiredReviewCount: number;
      reviews: AnonymizedReviewEntry[];
    }
  | {
      status: "REVIEWS_PENDING";
      message: string;
      completedReviewCount: number;
      requiredReviewCount: number;
    }
  | {
      status: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(code: unknown):
  | "UNAVAILABLE_DENIED"
  | "SESSION_EXPIRED"
  | "TLS_REQUIRED"
  | "OPERATIONAL_FAILURE" {
  switch (code) {
    case "UNAVAILABLE_DENIED":
    case "SESSION_EXPIRED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getCompletedReviews(
  paperId: string,
  baseUrl = ""
): Promise<ReviewVisibilityClientResult> {
  const response = await fetch(`${baseUrl}/api/editor/papers/${paperId}/reviews`, {
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "REVIEWS_VISIBLE",
      paperId: String(body.paperId ?? ""),
      completedReviewCount: Number(body.completedReviewCount ?? 0),
      requiredReviewCount: Number(body.requiredReviewCount ?? 0),
      reviews: Array.isArray(body.reviews) ? (body.reviews as AnonymizedReviewEntry[]) : []
    };
  }

  if (response.status === 409) {
    return {
      status: "REVIEWS_PENDING",
      message: String(body.message ?? "Required reviews are still pending for this paper."),
      completedReviewCount: Number(body.completedReviewCount ?? 0),
      requiredReviewCount: Number(body.requiredReviewCount ?? 0)
    };
  }

  return {
    status: mapErrorStatus(body.messageCode),
    message: String(body.message ?? "Completed reviews are unavailable for this paper.")
  };
}
