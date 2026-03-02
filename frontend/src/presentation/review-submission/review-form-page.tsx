import { useState } from "react";

import {
  loadReviewFormUseCase,
  submitReviewUseCase,
  type ReviewFormState,
  type SubmitReviewState
} from "../../business/review-submission/submit-review.use-case.js";

interface ReviewFormPageProps {
  assignmentId: string;
}

export function ReviewFormPage(props: ReviewFormPageProps): JSX.Element {
  const [reviewFormState, setReviewFormState] = useState<ReviewFormState | null>(null);
  const [submitState, setSubmitState] = useState<SubmitReviewState | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  async function onLoad(): Promise<void> {
    setLoading(true);
    setReviewFormState(await loadReviewFormUseCase(props.assignmentId));
    setLoading(false);
  }

  async function onSubmit(): Promise<void> {
    setLoading(true);
    setSubmitState(await submitReviewUseCase(props.assignmentId, responses));
    setLoading(false);
  }

  return (
    <section>
      <h2>Review Submission</h2>
      <button type="button" disabled={loading} onClick={() => void onLoad()}>
        Load Review Form
      </button>

      {reviewFormState?.state === "READY" ? (
        <article>
          <p>Assignment: {reviewFormState.assignmentId}</p>
          <p>Form Version: {reviewFormState.formVersion}</p>
          <ul>
            {reviewFormState.fields.map((field) => (
              <li key={field.fieldId}>
                <label htmlFor={field.fieldId}>{field.fieldId}</label>
                <textarea
                  id={field.fieldId}
                  onChange={(event) =>
                    setResponses((current) => ({
                      ...current,
                      [field.fieldId]: event.target.value
                    }))
                  }
                />
              </li>
            ))}
          </ul>
          <button type="button" disabled={loading} onClick={() => void onSubmit()}>
            Submit Review
          </button>
        </article>
      ) : null}

      {reviewFormState?.state === "ERROR" ? <p role="status">{reviewFormState.message}</p> : null}

      {submitState?.state === "SUCCESS" ? <p role="status">{submitState.message}</p> : null}

      {submitState?.state === "VALIDATION_FAILED" ? (
        <section>
          <p role="status">{submitState.message}</p>
          <ul>
            {submitState.issues.map((issue) => (
              <li key={`${issue.fieldId}:${issue.issue}`}>{`${issue.fieldId}: ${issue.issue}`}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {submitState?.state === "ERROR" ? <p role="status">{submitState.message}</p> : null}
    </section>
  );
}
