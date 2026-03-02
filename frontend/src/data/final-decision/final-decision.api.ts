export type FinalDecisionClientResult =
  | {
      status: "DECISION_RECORDED";
      paperId: string;
      decision: "ACCEPT" | "REJECT";
      decidedAt: string;
      notificationStatus: "NOTIFIED" | "NOTIFICATION_FAILED";
      message: string;
    }
  | {
      status: "REVIEWS_PENDING";
      message: string;
      completedReviewCount: number;
      requiredReviewCount: number;
    }
  | {
      status: "DECISION_FINALIZED";
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

export async function postFinalDecision(
  paperId: string,
  decision: "ACCEPT" | "REJECT",
  baseUrl = ""
): Promise<FinalDecisionClientResult> {
  const response = await fetch(`${baseUrl}/api/editor/papers/${paperId}/decision`, {
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
      status: "DECISION_RECORDED",
      paperId: String(body.paperId ?? ""),
      decision: body.decision === "REJECT" ? "REJECT" : "ACCEPT",
      decidedAt: String(body.decidedAt ?? ""),
      notificationStatus: body.notificationStatus === "NOTIFICATION_FAILED" ? "NOTIFICATION_FAILED" : "NOTIFIED",
      message: String(body.message ?? "Final decision recorded.")
    };
  }

  if (response.status === 409) {
    if (body.outcome === "REVIEWS_PENDING") {
      return {
        status: "REVIEWS_PENDING",
        message: String(body.message ?? "A final decision cannot be made yet because required reviews are still pending."),
        completedReviewCount: Number(body.completedReviewCount ?? 0),
        requiredReviewCount: Number(body.requiredReviewCount ?? 0)
      };
    }

    return {
      status: "DECISION_FINALIZED",
      message: String(body.message ?? "A final decision has already been recorded for this paper.")
    };
  }

  return {
    status: mapErrorStatus(body.outcome),
    message: String(body.message ?? "Final decision is currently unavailable.")
  };
}

export const FINAL_DECISION_API_MARKER = "final_decision_api_marker" as const;
