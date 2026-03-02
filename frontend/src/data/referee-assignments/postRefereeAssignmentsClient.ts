export interface PostRefereeAssignmentsPayload {
  refereeIds: string[];
}

export type PostRefereeAssignmentsClientResult =
  | {
      status: "SUCCESS";
      paperId: string;
      assignedRefereeIds: string[];
      invitationStatuses: Array<{
        refereeId: string;
        status: "SENT" | "PENDING_RETRY";
      }>;
      message: string;
    }
  | {
      status: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ rule: string; message: string; refereeId?: string }>;
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "PAPER_NOT_FOUND"
        | "PAPER_NOT_ASSIGNABLE"
        | "ASSIGNMENT_CONFLICT"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(
  code: unknown
): Exclude<PostRefereeAssignmentsClientResult, { status: "SUCCESS" | "VALIDATION_FAILED" }>["status"] {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "PAPER_NOT_FOUND":
    case "PAPER_NOT_ASSIGNABLE":
    case "ASSIGNMENT_CONFLICT":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function postRefereeAssignments(
  paperId: string,
  payload: PostRefereeAssignmentsPayload,
  baseUrl = ""
): Promise<PostRefereeAssignmentsClientResult> {
  const response = await fetch(`${baseUrl}/api/v1/papers/${paperId}/referee-assignments`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SUCCESS",
      paperId: String(body.paperId ?? ""),
      assignedRefereeIds: Array.isArray(body.assignedRefereeIds)
        ? (body.assignedRefereeIds as string[])
        : [],
      invitationStatuses: Array.isArray(body.invitationStatuses)
        ? (body.invitationStatuses as Array<{
            refereeId: string;
            status: "SENT" | "PENDING_RETRY";
          }>)
        : [],
      message: String(body.message ?? "Referees assigned successfully.")
    };
  }

  if (response.status === 400) {
    return {
      status: "VALIDATION_FAILED",
      message: String(body.message ?? "Assignment validation failed."),
      violations: Array.isArray(body.violations)
        ? (body.violations as Array<{ rule: string; message: string; refereeId?: string }>)
        : []
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Referee assignment failed unexpectedly.")
  };
}
