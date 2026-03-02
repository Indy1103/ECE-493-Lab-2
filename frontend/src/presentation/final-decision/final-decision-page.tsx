import { useState } from "react";

import {
  postFinalDecisionUseCase,
  type FinalDecisionViewState
} from "../../business/final-decision/post-final-decision.use-case.js";

interface FinalDecisionPageProps {
  paperId: string;
}

export function FinalDecisionPage(props: FinalDecisionPageProps): JSX.Element {
  const [decision, setDecision] = useState<"ACCEPT" | "REJECT">("ACCEPT");
  const [result, setResult] = useState<FinalDecisionViewState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(): Promise<void> {
    setSubmitting(true);
    setResult(await postFinalDecisionUseCase(props.paperId, decision));
    setSubmitting(false);
  }

  return (
    <section>
      <h2>Final Decision</h2>
      <p>Paper: {props.paperId}</p>

      <div role="group" aria-label="Final Decision Selection">
        <button
          type="button"
          aria-pressed={decision === "ACCEPT"}
          disabled={submitting}
          onClick={() => setDecision("ACCEPT")}
        >
          Accept
        </button>
        <button
          type="button"
          aria-pressed={decision === "REJECT"}
          disabled={submitting}
          onClick={() => setDecision("REJECT")}
        >
          Reject
        </button>
      </div>

      <button type="button" disabled={submitting} onClick={() => void onSubmit()}>
        Submit Final Decision
      </button>

      {result?.state === "SUCCESS" ? (
        <article>
          <p role="status">{result.message}</p>
          <p>Outcome: {result.decision}</p>
          <p>Recorded At: {result.decidedAt}</p>
          <p>Notification: {result.notificationStatus}</p>
        </article>
      ) : null}

      {result?.state === "PENDING" ? (
        <p role="status">
          {result.message} ({result.completedReviewCount}/{result.requiredReviewCount})
        </p>
      ) : null}

      {result?.state === "FINALIZED" ? <p role="status">{result.message}</p> : null}
      {result?.state === "ERROR" ? <p role="status">{result.message}</p> : null}
    </section>
  );
}

export const FINAL_DECISION_PAGE_MARKER = "final_decision_page_marker" as const;
