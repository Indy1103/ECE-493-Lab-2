import { useState } from "react";

import {
  getCompletedReviewsUseCase,
  type ReviewVisibilityViewState
} from "../../business/review-visibility/get-completed-reviews.use-case.js";

interface ReviewVisibilityPageProps {
  paperId: string;
}

export function ReviewVisibilityPage(props: ReviewVisibilityPageProps): JSX.Element {
  const [state, setState] = useState<ReviewVisibilityViewState | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLoadReviews(): Promise<void> {
    setLoading(true);
    setState(await getCompletedReviewsUseCase(props.paperId));
    setLoading(false);
  }

  return (
    <section>
      <h2>Completed Reviews</h2>
      <button type="button" disabled={loading} onClick={() => void onLoadReviews()}>
        Load Completed Reviews
      </button>

      {state?.state === "VISIBLE" ? (
        <article>
          <p>Paper: {state.paperId}</p>
          <p>
            Completed {state.completedReviewCount} of {state.requiredReviewCount}
          </p>
          <ul>
            {state.reviews.map((review) => (
              <li key={review.reviewId}>
                <h3>{review.recommendation}</h3>
                <p>{review.summary}</p>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {state?.state === "PENDING" ? (
        <p role="status">
          {state.message} ({state.completedReviewCount}/{state.requiredReviewCount})
        </p>
      ) : null}

      {state?.state === "ERROR" ? <p role="status">{state.message}</p> : null}
    </section>
  );
}
