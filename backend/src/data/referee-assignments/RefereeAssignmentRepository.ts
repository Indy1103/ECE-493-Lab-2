export type PaperWorkflowState = "AWAITING_ASSIGNMENT" | "IN_REVIEW" | "CLOSED";

export interface PaperAssignmentCandidateRecord {
  paperId: string;
  conferenceCycleId: string;
  workflowState: PaperWorkflowState;
  maxRefereesPerPaper: number;
}

export interface RefereeWorkloadProfileRecord {
  refereeId: string;
  conferenceCycleId: string;
  displayName: string;
  maxActiveAssignments: number;
  currentActiveAssignments: number;
  eligible: boolean;
}

export type AssignmentStatus = "ASSIGNED" | "INVITED" | "DECLINED" | "COMPLETED";

export interface RefereeAssignmentRecord {
  id: string;
  paperId: string;
  refereeId: string;
  assignedByEditorId: string;
  assignmentStatus: AssignmentStatus;
  assignedAt: Date;
  conferenceCycleId: string;
}

export type InvitationStatus = "PENDING" | "SENT" | "FAILED_RETRYABLE" | "FAILED_FINAL";

export interface ReviewInvitationRecord {
  id: string;
  assignmentId: string;
  paperId: string;
  refereeId: string;
  invitationStatus: InvitationStatus;
  attemptCount: number;
  lastAttemptAt: Date | null;
  failureReasonCode: string | null;
  createdAt: Date;
}

export type AssignmentAuditOutcome =
  | "SUCCESS"
  | "VALIDATION_FAILED"
  | "AUTHN_FAILED"
  | "AUTHZ_FAILED"
  | "INVITATION_RETRYABLE_FAILURE"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export interface AssignmentAttemptAuditRecord {
  id: string;
  requestId: string;
  paperId: string;
  editorId: string | null;
  submittedRefereeIdsCount: number;
  outcome: AssignmentAuditOutcome;
  reasonCode: string;
  occurredAt: Date;
}

export interface RefereeAssignmentPersistenceSnapshot {
  papers: PaperAssignmentCandidateRecord[];
  referees: RefereeWorkloadProfileRecord[];
  assignments: RefereeAssignmentRecord[];
  invitations: ReviewInvitationRecord[];
}

export interface RefereeAssignmentRepository {
  withPaperLock<T>(paperId: string, operation: () => Promise<T>): Promise<T>;
  getPaperCandidate(paperId: string): Promise<PaperAssignmentCandidateRecord | null>;
  listRefereeProfiles(conferenceCycleId: string): Promise<RefereeWorkloadProfileRecord[]>;
  getAssignmentsByPaper(paperId: string): Promise<RefereeAssignmentRecord[]>;
  findActiveAssignment(paperId: string, refereeId: string): Promise<RefereeAssignmentRecord | null>;
  createAssignments(input: {
    paperId: string;
    conferenceCycleId: string;
    editorId: string;
    refereeIds: string[];
  }): Promise<RefereeAssignmentRecord[]>;
  createInvitationIntent(input: {
    assignmentId: string;
    paperId: string;
    refereeId: string;
  }): Promise<ReviewInvitationRecord>;
  updateInvitationStatus(input: {
    invitationId: string;
    status: InvitationStatus;
    failureReasonCode?: string | null;
    incrementAttempt: boolean;
  }): Promise<void>;
  listInvitationsByPaper(paperId: string): Promise<ReviewInvitationRecord[]>;
  listRetryableInvitations(): Promise<ReviewInvitationRecord[]>;
  recordAudit(input: Omit<AssignmentAttemptAuditRecord, "id" | "occurredAt">): Promise<void>;
  snapshot(): RefereeAssignmentPersistenceSnapshot;
  restore(snapshot: RefereeAssignmentPersistenceSnapshot): void;
  isEncryptedAtRest(): boolean;
}

export const REFEREE_ASSIGNMENT_REPOSITORY_CONTRACT = "REFEREE_ASSIGNMENT_REPOSITORY_CONTRACT_V1";
