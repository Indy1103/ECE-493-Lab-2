import type { AnonymizedReviewEntry, CompletedReviewRecord } from "./ports.js";

export class ReviewVisibilityAnonymizer {
  anonymizeReview(review: CompletedReviewRecord): AnonymizedReviewEntry {
    return {
      reviewId: review.reviewId,
      paperId: review.paperId,
      summary: review.summary,
      scores: { ...review.scores },
      recommendation: review.recommendation,
      submittedAt: new Date(review.submittedAt)
    };
  }

  anonymizeReviews(reviews: CompletedReviewRecord[]): AnonymizedReviewEntry[] {
    return reviews.map((review) => this.anonymizeReview(review));
  }
}
