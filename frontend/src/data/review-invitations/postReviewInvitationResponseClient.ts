export type InvitationDecision = "ACCEPT" | "REJECT";

export type PostReviewInvitationResponseClientResult =
  | {
      status: "SUCCESS";
      invitationId: string;
      decision: InvitationDecision;
      invitationStatus: "ACCEPTED" | "REJECTED";
      assignmentCreated: boolean;
      message: string;
    }
  | {
      status: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ rule: "INVITATION_NOT_PENDING" | "INVALID_DECISION_VALUE"; message: string }>;
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "INVITATION_NOT_FOUND"
        | "INVITATION_ALREADY_RESOLVED"
        | "RESPONSE_RECORDING_FAILED"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(
  code: unknown
): Exclude<PostReviewInvitationResponseClientResult, { status: "SUCCESS" | "VALIDATION_FAILED" }>['status'] {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "INVITATION_NOT_FOUND":
    case "INVITATION_ALREADY_RESOLVED":
    case "RESPONSE_RECORDING_FAILED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function postReviewInvitationResponse(
  invitationId: string,
  decision: InvitationDecision,
  baseUrl = ""
): Promise<PostReviewInvitationResponseClientResult> {
  const response = await fetch(`${baseUrl}/api/v1/review-invitations/${invitationId}/response`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ decision })
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SUCCESS",
      invitationId: String(body.invitationId ?? ""),
      decision: (body.decision as InvitationDecision) ?? decision,
      invitationStatus: (body.invitationStatus as "ACCEPTED" | "REJECTED") ?? "REJECTED",
      assignmentCreated: Boolean(body.assignmentCreated),
      message: String(body.message ?? "Your response has been recorded.")
    };
  }

  if (response.status === 400) {
    return {
      status: "VALIDATION_FAILED",
      message: String(body.message ?? "Invitation response validation failed."),
      violations: Array.isArray(body.violations)
        ? (body.violations as Array<{
            rule: "INVITATION_NOT_PENDING" | "INVALID_DECISION_VALUE";
            message: string;
          }>)
        : []
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Invitation response failed unexpectedly.")
  };
}
