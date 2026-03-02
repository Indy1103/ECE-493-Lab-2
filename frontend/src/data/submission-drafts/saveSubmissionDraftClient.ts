export interface SaveSubmissionDraftPayload {
  title: string;
  draftPayload: Record<string, unknown>;
}

export type SaveSubmissionDraftClientResult =
  | {
      status: "SUCCESS";
      submissionId: string;
      savedAt: string;
      message: string;
    }
  | {
      status: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ field: string; rule: string; message: string }>;
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "TLS_REQUIRED"
        | "CONCURRENT_SAVE_RESOLVED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(code: unknown): Exclude<SaveSubmissionDraftClientResult, { status: "SUCCESS" | "VALIDATION_FAILED" }>['status'] {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "TLS_REQUIRED":
    case "CONCURRENT_SAVE_RESOLVED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function saveSubmissionDraft(
  submissionId: string,
  payload: SaveSubmissionDraftPayload,
  baseUrl = ""
): Promise<SaveSubmissionDraftClientResult> {
  const response = await fetch(`${baseUrl}/api/v1/submission-drafts/${submissionId}`, {
    method: "PUT",
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
      submissionId: String(body.submissionId ?? ""),
      savedAt: String(body.savedAt ?? ""),
      message: String(body.message ?? "Draft saved successfully.")
    };
  }

  if (response.status === 400) {
    return {
      status: "VALIDATION_FAILED",
      message: String(body.message ?? "Draft validation failed."),
      violations: Array.isArray(body.violations)
        ? (body.violations as Array<{ field: string; rule: string; message: string }>)
        : []
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Draft could not be saved. Please retry.")
  };
}
