export interface DecisionCompletionStatusRecord {
  paperId: string;
  authorUserId: string;
  completedReviewCount: number;
  requiredReviewCount: number;
  status: "COMPLETE" | "PENDING";
  checkedAt: Date;
}

export interface PaperDecisionRecord {
  paperId: string;
  decision: "ACCEPT" | "REJECT";
  decidedAt: Date;
  decidedByEditorId: string;
  isFinal: true;
}

export interface DecisionAuditEvent {
  eventId: string;
  actorUserId: string;
  paperId: string;
  outcome:
    | "DECISION_RECORDED"
    | "REVIEWS_PENDING"
    | "DECISION_FINALIZED"
    | "UNAVAILABLE_DENIED"
    | "SESSION_EXPIRED";
  reasonCode: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
}

export interface FinalDecisionRepository {
  withPaperDecisionLock<T>(paperId: string, operation: () => Promise<T>): Promise<T>;
  getDecisionCompletionStatus(
    paperId: string,
    editorUserId: string
  ): Promise<DecisionCompletionStatusRecord | null>;
  getFinalDecision(paperId: string): Promise<PaperDecisionRecord | null>;
  recordFinalDecision(input: {
    paperId: string;
    decision: "ACCEPT" | "REJECT";
    decidedByEditorId: string;
  }): Promise<PaperDecisionRecord>;
}

export interface FinalDecisionAuditRepository {
  record(event: Omit<DecisionAuditEvent, "eventId" | "occurredAt">): Promise<void>;
}

export const FINAL_DECISION_PORTS_MARKER = "final_decision_ports_marker" as const;
