export const AUTHOR_DECISION_OUTCOMES = {
  DECISION_AVAILABLE: "DECISION_AVAILABLE",
  NOTIFICATION_FAILED: "NOTIFICATION_FAILED",
  UNAVAILABLE_DENIED: "UNAVAILABLE_DENIED",
  SESSION_EXPIRED: "SESSION_EXPIRED"
} as const;

export type AuthorDecisionOutcomeCode =
  (typeof AUTHOR_DECISION_OUTCOMES)[keyof typeof AUTHOR_DECISION_OUTCOMES];

export const AUTHOR_DECISION_REASON_CODES = {
  DECISION_VISIBLE: "decision-visible",
  NOTIFICATION_UNDELIVERED: "notification-undelivered",
  PAPER_NOT_FOUND_OR_DENIED: "paper-not-found-or-denied",
  NON_AUTHOR_ROLE: "non-author-role",
  SESSION_INVALID: "session-invalid"
} as const;

export type AuthorDecisionReasonCode =
  (typeof AUTHOR_DECISION_REASON_CODES)[keyof typeof AUTHOR_DECISION_REASON_CODES];
