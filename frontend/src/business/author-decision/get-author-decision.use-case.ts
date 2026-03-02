import {
  getAuthorDecision,
  type AuthorDecisionClientResult
} from "../../data/author-decision/author-decision.api.js";

export type AuthorDecisionViewState =
  | {
      state: "AVAILABLE";
      paperId: string;
      decision: "ACCEPT" | "REJECT";
    }
  | {
      state: "NOTIFICATION_FAILED";
      message: string;
    }
  | {
      state: "ERROR";
      code: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapResult(result: AuthorDecisionClientResult): AuthorDecisionViewState {
  if (result.status === "DECISION_AVAILABLE") {
    return {
      state: "AVAILABLE",
      paperId: result.paperId,
      decision: result.decision
    };
  }

  if (result.status === "NOTIFICATION_FAILED") {
    return {
      state: "NOTIFICATION_FAILED",
      message: result.message
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}

export async function getAuthorDecisionUseCase(
  paperId: string,
  baseUrl = ""
): Promise<AuthorDecisionViewState> {
  const result = await getAuthorDecision(paperId, baseUrl);
  return mapResult(result);
}

export const AUTHOR_DECISION_USE_CASE_MARKER = "author_decision_use_case_marker" as const;
