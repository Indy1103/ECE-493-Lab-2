import {
  postFinalDecision,
  type FinalDecisionClientResult
} from "../../data/final-decision/final-decision.api.js";

export type FinalDecisionViewState =
  | {
      state: "SUCCESS";
      paperId: string;
      decision: "ACCEPT" | "REJECT";
      decidedAt: string;
      notificationStatus: "NOTIFIED" | "NOTIFICATION_FAILED";
      message: string;
    }
  | {
      state: "PENDING";
      message: string;
      completedReviewCount: number;
      requiredReviewCount: number;
    }
  | {
      state: "FINALIZED";
      message: string;
    }
  | {
      state: "ERROR";
      code: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapResult(result: FinalDecisionClientResult): FinalDecisionViewState {
  if (result.status === "DECISION_RECORDED") {
    return {
      state: "SUCCESS",
      paperId: result.paperId,
      decision: result.decision,
      decidedAt: result.decidedAt,
      notificationStatus: result.notificationStatus,
      message: result.message
    };
  }

  if (result.status === "REVIEWS_PENDING") {
    return {
      state: "PENDING",
      message: result.message,
      completedReviewCount: result.completedReviewCount,
      requiredReviewCount: result.requiredReviewCount
    };
  }

  if (result.status === "DECISION_FINALIZED") {
    return {
      state: "FINALIZED",
      message: result.message
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}

export async function postFinalDecisionUseCase(
  paperId: string,
  decision: "ACCEPT" | "REJECT",
  baseUrl = ""
): Promise<FinalDecisionViewState> {
  const result = await postFinalDecision(paperId, decision, baseUrl);
  return mapResult(result);
}

export const FINAL_DECISION_USE_CASE_MARKER = "final_decision_use_case_marker" as const;
