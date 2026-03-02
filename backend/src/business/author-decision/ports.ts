export interface AuthorDecisionAccessRecord {
  paperId: string;
  authorId: string;
  decision: "ACCEPT" | "REJECT";
  notificationStatus: "DELIVERED" | "FAILED";
}

export interface AuthorDecisionAuditEvent {
  eventId: string;
  actorUserId: string;
  paperId: string;
  outcome: "DECISION_AVAILABLE" | "NOTIFICATION_FAILED" | "UNAVAILABLE_DENIED" | "SESSION_EXPIRED";
  reasonCode: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
}

export interface AuthorDecisionRepository {
  getAuthorDecision(paperId: string, authorId: string): Promise<AuthorDecisionAccessRecord | null>;
}

export interface AuthorDecisionAuditRepository {
  record(event: Omit<AuthorDecisionAuditEvent, "eventId" | "occurredAt">): Promise<void>;
}

export const AUTHOR_DECISION_PORTS_MARKER = "author_decision_ports_marker" as const;
