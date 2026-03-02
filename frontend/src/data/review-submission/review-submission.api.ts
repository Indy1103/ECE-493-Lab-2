export interface ReviewFieldRule {
  fieldId: string;
  required: boolean;
  constraints?: string[];
}

export type ReviewFormClientResult =
  | {
      status: "REVIEW_FORM_AVAILABLE";
      assignmentId: string;
      formVersion: string;
      fields: ReviewFieldRule[];
    }
  | {
      status: "session-expired" | "submission-unavailable" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
      reasonCode?: "non-owned-or-non-assigned" | "submit-time-ineligible" | "duplicate-final-submission";
    };

export type SubmitReviewClientResult =
  | {
      status: "REVIEW_SUBMISSION_ACCEPTED";
      submissionId: string;
      submittedAt: string;
    }
  | {
      status: "validation-failed";
      message: string;
      issues: Array<{ fieldId: string; issue: string }>;
    }
  | {
      status: "session-expired" | "submission-unavailable" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
      reasonCode?: "non-owned-or-non-assigned" | "submit-time-ineligible" | "duplicate-final-submission";
    };

function mapErrorStatus(code: unknown):
  | "session-expired"
  | "submission-unavailable"
  | "TLS_REQUIRED"
  | "OPERATIONAL_FAILURE" {
  switch (code) {
    case "session-expired":
    case "submission-unavailable":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getReviewForm(
  assignmentId: string,
  baseUrl = ""
): Promise<ReviewFormClientResult> {
  const response = await fetch(`${baseUrl}/api/referee/assignments/${assignmentId}/review-form`, {
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "REVIEW_FORM_AVAILABLE",
      assignmentId: String(body.assignmentId ?? ""),
      formVersion: String(body.formVersion ?? ""),
      fields: Array.isArray(body.fields) ? (body.fields as ReviewFieldRule[]) : []
    };
  }

  return {
    status: mapErrorStatus(body.messageCode),
    message: String(body.message ?? "Review form is currently unavailable."),
    reasonCode: body.reasonCode as
      | "non-owned-or-non-assigned"
      | "submit-time-ineligible"
      | "duplicate-final-submission"
      | undefined
  };
}

export async function postReviewSubmission(
  assignmentId: string,
  responses: Record<string, unknown>,
  baseUrl = ""
): Promise<SubmitReviewClientResult> {
  const response = await fetch(`${baseUrl}/api/referee/assignments/${assignmentId}/review-submissions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ responses })
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 201) {
    return {
      status: "REVIEW_SUBMISSION_ACCEPTED",
      submissionId: String(body.submissionId ?? ""),
      submittedAt: String(body.submittedAt ?? "")
    };
  }

  if (response.status === 400) {
    return {
      status: "validation-failed",
      message: String(body.message ?? "Please correct the highlighted review form fields."),
      issues: Array.isArray(body.issues)
        ? (body.issues as Array<{ fieldId: string; issue: string }>)
        : []
    };
  }

  return {
    status: mapErrorStatus(body.messageCode),
    message: String(body.message ?? "Review submission is currently unavailable."),
    reasonCode: body.reasonCode as
      | "non-owned-or-non-assigned"
      | "submit-time-ineligible"
      | "duplicate-final-submission"
      | undefined
  };
}
