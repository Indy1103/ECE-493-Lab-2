export type GetReviewInvitationClientResult =
  | {
      status: "SUCCESS";
      invitationId: string;
      paperId: string;
      paperTitle: string;
      paperSummary: string;
      reviewDueAt: string;
      responseDeadlineAt: string;
      invitationStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "INVITATION_NOT_FOUND"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(
  code: unknown
): Exclude<GetReviewInvitationClientResult, { status: "SUCCESS" }>['status'] {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "INVITATION_NOT_FOUND":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getReviewInvitation(
  invitationId: string,
  baseUrl = ""
): Promise<GetReviewInvitationClientResult> {
  const response = await fetch(`${baseUrl}/api/v1/review-invitations/${invitationId}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SUCCESS",
      invitationId: String(body.invitationId ?? ""),
      paperId: String(body.paperId ?? ""),
      paperTitle: String(body.paperTitle ?? ""),
      paperSummary: String(body.paperSummary ?? ""),
      reviewDueAt: String(body.reviewDueAt ?? ""),
      responseDeadlineAt: String(body.responseDeadlineAt ?? ""),
      invitationStatus: (body.status as "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED") ?? "PENDING"
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Review invitation details are currently unavailable.")
  };
}
