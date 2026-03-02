import {
  postReviewInvitationResponse,
  type InvitationDecision,
  type PostReviewInvitationResponseClientResult
} from "../../data/review-invitations/postReviewInvitationResponseClient.js";

export type ReviewInvitationActionState =
  | {
      state: "SUCCESS";
      invitationId: string;
      decision: InvitationDecision;
      invitationStatus: "ACCEPTED" | "REJECTED";
      assignmentCreated: boolean;
      message: string;
    }
  | {
      state: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ rule: "INVITATION_NOT_PENDING" | "INVALID_DECISION_VALUE"; message: string }>;
    }
  | {
      state:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "INVITATION_NOT_FOUND"
        | "INVITATION_ALREADY_RESOLVED"
        | "RESPONSE_RECORDING_FAILED"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapClientResult(result: PostReviewInvitationResponseClientResult): ReviewInvitationActionState {
  if (result.status === "SUCCESS") {
    return {
      state: "SUCCESS",
      invitationId: result.invitationId,
      decision: result.decision,
      invitationStatus: result.invitationStatus,
      assignmentCreated: result.assignmentCreated,
      message: result.message
    };
  }

  if (result.status === "VALIDATION_FAILED") {
    return {
      state: "VALIDATION_FAILED",
      message: result.message,
      violations: result.violations
    };
  }

  return {
    state: result.status,
    message: result.message
  };
}

export async function respondToInvitationAction(
  invitationId: string,
  decision: InvitationDecision,
  baseUrl = ""
): Promise<ReviewInvitationActionState> {
  const result = await postReviewInvitationResponse(invitationId, decision, baseUrl);
  return mapClientResult(result);
}
