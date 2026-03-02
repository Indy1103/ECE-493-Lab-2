export type AuthorDecisionClientResult =
  | {
      status: "DECISION_AVAILABLE";
      paperId: string;
      decision: "ACCEPT" | "REJECT";
    }
  | {
      status: "NOTIFICATION_FAILED";
      message: string;
    }
  | {
      status: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(code: unknown):
  | "UNAVAILABLE_DENIED"
  | "SESSION_EXPIRED"
  | "TLS_REQUIRED"
  | "OPERATIONAL_FAILURE" {
  switch (code) {
    case "UNAVAILABLE_DENIED":
    case "SESSION_EXPIRED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getAuthorDecision(
  paperId: string,
  baseUrl = ""
): Promise<AuthorDecisionClientResult> {
  const response = await fetch(`${baseUrl}/api/author/papers/${paperId}/decision`, {
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "DECISION_AVAILABLE",
      paperId: String(body.paperId ?? ""),
      decision: body.decision === "REJECT" ? "REJECT" : "ACCEPT"
    };
  }

  if (response.status === 409) {
    return {
      status: "NOTIFICATION_FAILED",
      message: String(body.message ?? "Decision notification failed. Please check again later.")
    };
  }

  return {
    status: mapErrorStatus(body.outcome),
    message: String(body.message ?? "Decision is unavailable for this paper.")
  };
}

export const AUTHOR_DECISION_API_MARKER = "author_decision_api_marker" as const;
