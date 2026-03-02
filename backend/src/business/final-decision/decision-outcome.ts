export const FINAL_DECISION_OUTCOMES = {
  DECISION_RECORDED: "DECISION_RECORDED",
  REVIEWS_PENDING: "REVIEWS_PENDING",
  DECISION_FINALIZED: "DECISION_FINALIZED",
  UNAVAILABLE_DENIED: "UNAVAILABLE_DENIED",
  SESSION_EXPIRED: "SESSION_EXPIRED"
} as const;

export type FinalDecisionOutcomeCode =
  (typeof FINAL_DECISION_OUTCOMES)[keyof typeof FINAL_DECISION_OUTCOMES];

export const FINAL_DECISION_REASON_CODES = {
  PENDING_REQUIRED_REVIEWS: "pending-required-reviews",
  DECISION_ALREADY_FINALIZED: "decision-already-finalized",
  PAPER_NOT_FOUND_OR_DENIED: "paper-not-found-or-denied",
  NON_EDITOR_ROLE: "non-editor-role",
  SESSION_INVALID: "session-invalid",
  NOTIFICATION_FAILED: "notification-failed",
  NOTIFIED: "notified"
} as const;

export type FinalDecisionReasonCode =
  (typeof FINAL_DECISION_REASON_CODES)[keyof typeof FINAL_DECISION_REASON_CODES];
