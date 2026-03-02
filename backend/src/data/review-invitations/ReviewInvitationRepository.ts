export type ReviewInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type InvitationDecision = "ACCEPT" | "REJECT";

export type InvitationResponseAttemptOutcome =
  | "SUCCESS_ACCEPTED"
  | "SUCCESS_REJECTED"
  | "REJECTED_ALREADY_RESOLVED"
  | "AUTHZ_FAILED"
  | "VALIDATION_FAILED"
  | "RECORDING_FAILED"
  | "INVITATION_NOT_FOUND"
  | "INTERNAL_ERROR";

export interface ReviewInvitationRecord {
  invitationId: string;
  paperId: string;
  refereeId: string;
  paperTitle: string;
  paperSummary: string;
  reviewDueAt: Date;
  responseDeadlineAt: Date;
  invitationStatus: ReviewInvitationStatus;
  resolvedAt: Date | null;
  version: number;
}

export interface InvitationResponseAttemptRecord {
  id: string;
  invitationId: string;
  refereeId: string | null;
  decisionRequested: InvitationDecision;
  outcome: InvitationResponseAttemptOutcome;
  reasonCode: string;
  requestId: string;
  occurredAt: Date;
}

export interface ReviewAssignmentRecord {
  id: string;
  paperId: string;
  refereeId: string;
  sourceInvitationId: string;
  assignmentStatus: "ACTIVE" | "WITHDRAWN" | "COMPLETED";
  assignedAt: Date;
}

export interface ReviewInvitationPersistenceSnapshot {
  invitations: ReviewInvitationRecord[];
  attempts: InvitationResponseAttemptRecord[];
  assignments: ReviewAssignmentRecord[];
}

export interface ReviewInvitationRepository {
  withInvitationLock<T>(invitationId: string, operation: () => Promise<T>): Promise<T>;
  getInvitationById(invitationId: string): Promise<ReviewInvitationRecord | null>;
  recordInvitationDecision(input: {
    invitationId: string;
    decision: InvitationDecision;
    refereeId: string;
  }): Promise<{ invitationStatus: "ACCEPTED" | "REJECTED"; assignmentCreated: boolean }>;
  recordResponseAttempt(input: Omit<InvitationResponseAttemptRecord, "id" | "occurredAt">): Promise<void>;
  getAssignmentsByInvitation(invitationId: string): Promise<ReviewAssignmentRecord[]>;
  getAssignmentsByReferee(refereeId: string): Promise<ReviewAssignmentRecord[]>;
  snapshot(): ReviewInvitationPersistenceSnapshot;
  restore(snapshot: ReviewInvitationPersistenceSnapshot): void;
  isEncryptedAtRest(): boolean;
}

export const REVIEW_INVITATION_REPOSITORY_CONTRACT =
  "review_invitation_repository_contract_marker" as const;
