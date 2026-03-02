import { useState } from "react";

import { respondToInvitationAction, type ReviewInvitationActionState } from "../../business/review-invitations/respondToInvitationAction.js";
import {
  getReviewInvitation,
  type GetReviewInvitationClientResult
} from "../../data/review-invitations/getReviewInvitationClient.js";

interface ReviewInvitationResponsePanelProps {
  invitationId: string;
}

export function ReviewInvitationResponsePanel(
  props: ReviewInvitationResponsePanelProps
): JSX.Element {
  const [invitation, setInvitation] = useState<GetReviewInvitationClientResult | null>(null);
  const [feedback, setFeedback] = useState<ReviewInvitationActionState | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadInvitation(): Promise<void> {
    setLoading(true);
    setInvitation(await getReviewInvitation(props.invitationId));
    setLoading(false);
  }

  async function onRespond(decision: "ACCEPT" | "REJECT"): Promise<void> {
    setLoading(true);
    const result = await respondToInvitationAction(props.invitationId, decision);
    setFeedback(result);
    setLoading(false);

    if (result.state === "SUCCESS") {
      await loadInvitation();
    }
  }

  return (
    <section>
      <h2>Review Invitation Response</h2>
      <button type="button" disabled={loading} onClick={() => void loadInvitation()}>
        Load Invitation
      </button>

      {invitation?.status === "SUCCESS" ? (
        <article>
          <h3>{invitation.paperTitle}</h3>
          <p>{invitation.paperSummary}</p>
          <p>Review due: {invitation.reviewDueAt}</p>
          <p>Response deadline: {invitation.responseDeadlineAt}</p>
          <p>Status: {invitation.invitationStatus}</p>
          <button type="button" disabled={loading} onClick={() => void onRespond("ACCEPT")}>
            Accept Invitation
          </button>
          <button type="button" disabled={loading} onClick={() => void onRespond("REJECT")}>
            Reject Invitation
          </button>
        </article>
      ) : null}

      {invitation && invitation.status !== "SUCCESS" ? <p>{invitation.message}</p> : null}

      {feedback?.state === "SUCCESS" ? <p>{feedback.message}</p> : null}

      {feedback?.state === "VALIDATION_FAILED" ? (
        <ul>
          <li>{feedback.message}</li>
          {feedback.violations.map((violation) => (
            <li key={violation.rule}>{violation.message}</li>
          ))}
        </ul>
      ) : null}

      {feedback && feedback.state !== "SUCCESS" && feedback.state !== "VALIDATION_FAILED" ? (
        <p>{feedback.message}</p>
      ) : null}
    </section>
  );
}
