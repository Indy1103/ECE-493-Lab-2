import {
  getSubmissionDraft,
  type GetSubmissionDraftClientResult
} from "../../data/submission-drafts/getSubmissionDraftClient.js";

export type ResumeDraftActionState =
  | {
      state: "SUCCESS";
      submissionId: string;
      title: string;
      draftPayload: Record<string, unknown>;
      lastSavedAt: string;
    }
  | {
      state:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "DRAFT_NOT_FOUND"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapClientResult(result: GetSubmissionDraftClientResult): ResumeDraftActionState {
  if (result.status === "SUCCESS") {
    return {
      state: "SUCCESS",
      submissionId: result.submissionId,
      title: result.title,
      draftPayload: result.draftPayload,
      lastSavedAt: result.lastSavedAt
    };
  }

  return {
    state: result.status,
    message: result.message
  };
}

export async function resumeDraftAction(
  submissionId: string,
  baseUrl = ""
): Promise<ResumeDraftActionState> {
  const result = await getSubmissionDraft(submissionId, baseUrl);
  return mapClientResult(result);
}
