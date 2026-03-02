export const REVIEW_SUBMISSION_OUTCOMES = {
  REVIEW_FORM_AVAILABLE: "REVIEW_FORM_AVAILABLE",
  REVIEW_SUBMISSION_ACCEPTED: "REVIEW_SUBMISSION_ACCEPTED",
  VALIDATION_FAILED: "validation-failed",
  SESSION_EXPIRED: "session-expired",
  SUBMISSION_UNAVAILABLE: "submission-unavailable"
} as const;

export const REVIEW_SUBMISSION_REASON_CODES = {
  NON_OWNED_OR_NON_ASSIGNED: "non-owned-or-non-assigned",
  SUBMIT_TIME_INELIGIBLE: "submit-time-ineligible",
  DUPLICATE_FINAL_SUBMISSION: "duplicate-final-submission"
} as const;

export type ReviewSubmissionOutcomeCode =
  (typeof REVIEW_SUBMISSION_OUTCOMES)[keyof typeof REVIEW_SUBMISSION_OUTCOMES];

export type ReviewSubmissionReasonCode =
  (typeof REVIEW_SUBMISSION_REASON_CODES)[keyof typeof REVIEW_SUBMISSION_REASON_CODES];
