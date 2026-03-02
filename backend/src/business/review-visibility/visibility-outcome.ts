export const REVIEW_VISIBILITY_OUTCOMES = {
  REVIEWS_VISIBLE: "REVIEWS_VISIBLE",
  REVIEWS_PENDING: "REVIEWS_PENDING",
  UNAVAILABLE_DENIED: "UNAVAILABLE_DENIED",
  SESSION_EXPIRED: "SESSION_EXPIRED"
} as const;

export type ReviewVisibilityOutcomeCode =
  (typeof REVIEW_VISIBILITY_OUTCOMES)[keyof typeof REVIEW_VISIBILITY_OUTCOMES];

export const REVIEW_VISIBILITY_REASON_CODES = {
  PENDING_REQUIRED_REVIEWS: "pending-required-reviews",
  PAPER_NOT_FOUND_OR_DENIED: "paper-not-found-or-denied",
  NON_EDITOR_ROLE: "non-editor-role",
  SESSION_INVALID: "session-invalid"
} as const;

export type ReviewVisibilityReasonCode =
  (typeof REVIEW_VISIBILITY_REASON_CODES)[keyof typeof REVIEW_VISIBILITY_REASON_CODES];
