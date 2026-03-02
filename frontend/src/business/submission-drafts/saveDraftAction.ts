import {
  saveSubmissionDraft,
  type SaveSubmissionDraftPayload,
  type SaveSubmissionDraftClientResult
} from "../../data/submission-drafts/saveSubmissionDraftClient.js";

export type SaveDraftActionState =
  | {
      state: "SUCCESS";
      submissionId: string;
      savedAt: string;
      message: string;
    }
  | {
      state: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ field: string; rule: string; message: string }>;
    }
  | {
      state:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "TLS_REQUIRED"
        | "CONCURRENT_SAVE_RESOLVED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapClientResult(result: SaveSubmissionDraftClientResult): SaveDraftActionState {
  if (result.status === "SUCCESS") {
    return {
      state: "SUCCESS",
      submissionId: result.submissionId,
      savedAt: result.savedAt,
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

export async function saveDraftAction(
  submissionId: string,
  payload: SaveSubmissionDraftPayload,
  baseUrl = ""
): Promise<SaveDraftActionState> {
  const result = await saveSubmissionDraft(submissionId, payload, baseUrl);
  return mapClientResult(result);
}
