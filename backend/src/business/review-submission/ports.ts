export interface ReviewFieldRule {
  fieldId: string;
  required: boolean;
  constraints?: string[];
}

export interface ReviewFormDefinition {
  reviewFormId: string;
  assignmentId: string;
  paperId: string;
  formVersion: string;
  fields: ReviewFieldRule[];
}

export interface AssignmentEligibilityRecord {
  assignmentId: string;
  paperId: string;
  refereeUserId: string;
  invitationStatus: "ACCEPTED" | "PENDING" | "REJECTED";
  submissionEligibility: "ELIGIBLE" | "INELIGIBLE";
  eligibilityCheckedAt: Date;
  reviewForm: ReviewFormDefinition;
}

export interface ReviewSubmissionRecord {
  id: string;
  assignmentId: string;
  paperId: string;
  refereeUserId: string;
  content: Record<string, unknown>;
  status: "SUBMITTED";
  submittedAt: Date;
  updatedAt: Date;
}

export interface ReviewSubmissionAuditEvent {
  eventId: string;
  actorUserId: string;
  assignmentId: string | null;
  paperId: string | null;
  outcome: "submitted" | "validation-failed" | "session-expired" | "submission-unavailable";
  reasonCode: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
}

export interface AssignmentEligibilityRepository {
  getByAssignmentId(assignmentId: string): Promise<AssignmentEligibilityRecord | null>;
}

export interface ReviewSubmissionRepository {
  withAssignmentLock<T>(assignmentId: string, operation: () => Promise<T>): Promise<T>;
  getByAssignmentId(assignmentId: string): Promise<ReviewSubmissionRecord | null>;
  createFinalSubmission(input: {
    assignmentId: string;
    paperId: string;
    refereeUserId: string;
    content: Record<string, unknown>;
  }): Promise<ReviewSubmissionRecord>;
}

export interface ReviewSubmissionAuditRepository {
  record(event: Omit<ReviewSubmissionAuditEvent, "eventId" | "occurredAt">): Promise<void>;
}

export const REVIEW_SUBMISSION_PORTS_MARKER = "review_submission_ports_marker" as const;
