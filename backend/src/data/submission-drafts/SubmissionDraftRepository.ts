export type DraftSaveAttemptOutcome =
  | "SUCCESS"
  | "VALIDATION_FAILED"
  | "AUTHZ_FAILED"
  | "OPERATIONAL_FAILED"
  | "CONCURRENT_SAVE_RESOLVED";

export interface SubmissionDraftRecord {
  id: string;
  authorId: string;
  inProgressSubmissionId: string;
  title: string;
  draftPayload: Record<string, unknown>;
  payloadVersion: number;
  policyVersion: string;
  lastSavedAt: Date;
  writeSequence: number;
  encryptedAtRest: boolean;
}

export interface DraftSnapshotRecord {
  id: string;
  submissionDraftId: string;
  version: number;
  snapshotPayload: Record<string, unknown>;
  savedAt: Date;
}

export interface DraftSaveAttemptRecord {
  id: string;
  authorId: string | null;
  inProgressSubmissionId: string | null;
  outcome: DraftSaveAttemptOutcome;
  reasonCode: string;
  requestId: string;
  occurredAt: Date;
}

export interface SubmissionDraftPersistenceSnapshot {
  drafts: SubmissionDraftRecord[];
  snapshots: DraftSnapshotRecord[];
}

export interface SaveSubmissionDraftResult {
  submissionId: string;
  savedAt: Date;
  payloadVersion: number;
  draftId: string;
}

export interface SubmissionDraftRepository {
  saveDraft(input: {
    authorId: string;
    submissionId: string;
    title: string;
    draftPayload: Record<string, unknown>;
    policyVersion: string;
  }): Promise<SaveSubmissionDraftResult>;
  getDraft(authorId: string, submissionId: string): Promise<SubmissionDraftRecord | null>;
  isSubmissionOwnedByAuthor(authorId: string, submissionId: string): Promise<boolean>;
  recordDraftSaveAttempt(input: {
    authorId: string | null;
    submissionId: string | null;
    outcome: DraftSaveAttemptOutcome;
    reasonCode: string;
    requestId: string;
  }): Promise<void>;
  snapshot(): SubmissionDraftPersistenceSnapshot;
  restore(snapshot: SubmissionDraftPersistenceSnapshot): void;
  isEncryptedAtRest(): boolean;
}
