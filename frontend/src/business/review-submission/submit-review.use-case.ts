import {
  getReviewForm,
  postReviewSubmission,
  type ReviewFormClientResult,
  type SubmitReviewClientResult
} from "../../data/review-submission/review-submission.api.js";

export type ReviewFormState =
  | {
      state: "READY";
      assignmentId: string;
      formVersion: string;
      fields: Array<{ fieldId: string; required: boolean; constraints?: string[] }>;
    }
  | {
      state: "ERROR";
      code: "session-expired" | "submission-unavailable" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

export type SubmitReviewState =
  | {
      state: "SUCCESS";
      submissionId: string;
      submittedAt: string;
      message: string;
    }
  | {
      state: "VALIDATION_FAILED";
      message: string;
      issues: Array<{ fieldId: string; issue: string }>;
    }
  | {
      state: "ERROR";
      code: "session-expired" | "submission-unavailable" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapReviewForm(result: ReviewFormClientResult): ReviewFormState {
  if (result.status === "REVIEW_FORM_AVAILABLE") {
    return {
      state: "READY",
      assignmentId: result.assignmentId,
      formVersion: result.formVersion,
      fields: result.fields
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}

function mapSubmitResult(result: SubmitReviewClientResult): SubmitReviewState {
  if (result.status === "REVIEW_SUBMISSION_ACCEPTED") {
    return {
      state: "SUCCESS",
      submissionId: result.submissionId,
      submittedAt: result.submittedAt,
      message: "Review submitted successfully."
    };
  }

  if (result.status === "validation-failed") {
    return {
      state: "VALIDATION_FAILED",
      message: result.message,
      issues: result.issues
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}

export async function loadReviewFormUseCase(
  assignmentId: string,
  baseUrl = ""
): Promise<ReviewFormState> {
  const result = await getReviewForm(assignmentId, baseUrl);
  return mapReviewForm(result);
}

export async function submitReviewUseCase(
  assignmentId: string,
  responses: Record<string, unknown>,
  baseUrl = ""
): Promise<SubmitReviewState> {
  const result = await postReviewSubmission(assignmentId, responses, baseUrl);
  return mapSubmitResult(result);
}

export const REVIEW_SUBMISSION_USE_CASE_MARKER = "review_submission_use_case_marker" as const;
