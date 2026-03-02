export interface ReviewCompletionStatusRecord {
  paperId: string;
  completedReviewCount: number;
  requiredReviewCount: number;
  status: "COMPLETE" | "PENDING";
  checkedAt: Date;
}

export interface CompletedReviewRecord {
  reviewId: string;
  paperId: string;
  refereeUserId: string;
  summary: string;
  scores: Record<string, unknown>;
  recommendation: "ACCEPT" | "REJECT" | "BORDERLINE";
  submittedAt: Date;
}

export interface AnonymizedReviewEntry {
  reviewId: string;
  paperId: string;
  summary: string;
  scores: Record<string, unknown>;
  recommendation: "ACCEPT" | "REJECT" | "BORDERLINE";
  submittedAt: Date;
}

export interface ReviewVisibilityAuditEvent {
  eventId: string;
  actorUserId: string;
  paperId: string;
  outcome: "REVIEWS_VISIBLE" | "REVIEWS_PENDING" | "UNAVAILABLE_DENIED" | "SESSION_EXPIRED";
  reasonCode: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
}

export interface ReviewVisibilityRepository {
  withPaperReadLock<T>(paperId: string, operation: () => Promise<T>): Promise<T>;
  getCompletionStatus(paperId: string, editorUserId: string): Promise<ReviewCompletionStatusRecord | null>;
  getCompletedReviews(paperId: string, editorUserId: string): Promise<CompletedReviewRecord[]>;
}

export interface ReviewVisibilityAuditRepository {
  record(event: Omit<ReviewVisibilityAuditEvent, "eventId" | "occurredAt">): Promise<void>;
}

export const REVIEW_VISIBILITY_PORTS_MARKER = "review_visibility_ports_marker" as const;
