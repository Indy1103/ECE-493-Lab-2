export type GetSubmissionDraftClientResult =
  | {
      status: "SUCCESS";
      submissionId: string;
      title: string;
      draftPayload: Record<string, unknown>;
      lastSavedAt: string;
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "DRAFT_NOT_FOUND"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(
  code: unknown
): Exclude<GetSubmissionDraftClientResult, { status: "SUCCESS" }>['status'] {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "DRAFT_NOT_FOUND":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getSubmissionDraft(
  submissionId: string,
  baseUrl = ""
): Promise<GetSubmissionDraftClientResult> {
  const response = await fetch(`${baseUrl}/api/v1/submission-drafts/${submissionId}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SUCCESS",
      submissionId: String(body.submissionId ?? ""),
      title: String(body.title ?? ""),
      draftPayload:
        typeof body.draftPayload === "object" && body.draftPayload !== null
          ? (body.draftPayload as Record<string, unknown>)
          : {},
      lastSavedAt: String(body.lastSavedAt ?? "")
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Draft could not be retrieved. Please retry.")
  };
}
