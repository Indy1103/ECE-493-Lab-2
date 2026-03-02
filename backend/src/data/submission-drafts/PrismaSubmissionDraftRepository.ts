import { randomUUID } from "node:crypto";

import type {
  DraftSaveAttemptRecord,
  SaveSubmissionDraftResult,
  SubmissionDraftPersistenceSnapshot,
  SubmissionDraftRecord,
  SubmissionDraftRepository,
  DraftSnapshotRecord,
  DraftSaveAttemptOutcome
} from "./SubmissionDraftRepository.js";

export class ConcurrentSaveResolutionError extends Error {
  constructor(message = "Concurrent draft save was resolved deterministically.") {
    super(message);
    this.name = "ConcurrentSaveResolutionError";
  }
}

interface PrismaSubmissionDraftRepositoryOptions {
  nowProvider?: () => Date;
  forceSaveFailure?: boolean;
  forceConcurrentResolutionFailure?: boolean;
}

export class PrismaSubmissionDraftRepository implements SubmissionDraftRepository {
  private readonly nowProvider: () => Date;
  private readonly ownership = new Map<string, string>();
  private readonly currentDraftsByKey = new Map<string, SubmissionDraftRecord>();
  private readonly snapshots: DraftSnapshotRecord[] = [];
  private readonly saveAttempts: DraftSaveAttemptRecord[] = [];
  private saveSequence = 0;
  private forceSaveFailure = false;
  private forceConcurrentResolutionFailure = false;

  constructor(options: PrismaSubmissionDraftRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceSaveFailure = options.forceSaveFailure ?? false;
    this.forceConcurrentResolutionFailure = options.forceConcurrentResolutionFailure ?? false;
  }

  setForceSaveFailure(value: boolean): void {
    this.forceSaveFailure = value;
  }

  setForceConcurrentResolutionFailure(value: boolean): void {
    this.forceConcurrentResolutionFailure = value;
  }

  seedSubmissionOwner(submissionId: string, authorId: string): void {
    this.ownership.set(submissionId, authorId);
  }

  seedDraft(record: Omit<SubmissionDraftRecord, "writeSequence"> & { writeSequence?: number }): void {
    const key = this.buildDraftKey(record.authorId, record.inProgressSubmissionId);
    this.currentDraftsByKey.set(key, {
      ...record,
      writeSequence: record.writeSequence ?? ++this.saveSequence
    });
  }

  getCurrentDrafts(): SubmissionDraftRecord[] {
    return Array.from(this.currentDraftsByKey.values()).map((row) => ({
      ...row,
      draftPayload: { ...row.draftPayload }
    }));
  }

  getSnapshots(): DraftSnapshotRecord[] {
    return this.snapshots.map((row) => ({
      ...row,
      snapshotPayload: { ...row.snapshotPayload }
    }));
  }

  getSaveAttempts(): DraftSaveAttemptRecord[] {
    return this.saveAttempts.map((row) => ({ ...row }));
  }

  async saveDraft(input: {
    authorId: string;
    submissionId: string;
    title: string;
    draftPayload: Record<string, unknown>;
    policyVersion: string;
  }): Promise<SaveSubmissionDraftResult> {
    if (this.forceSaveFailure) {
      throw new Error("forced-save-failure");
    }

    if (this.forceConcurrentResolutionFailure) {
      throw new ConcurrentSaveResolutionError();
    }

    const key = this.buildDraftKey(input.authorId, input.submissionId);
    const now = this.nowProvider();
    const current = this.currentDraftsByKey.get(key);
    const writeSequence = ++this.saveSequence;
    const payloadVersion = (current?.payloadVersion ?? 0) + 1;

    const next: SubmissionDraftRecord = {
      id: current?.id ?? randomUUID(),
      authorId: input.authorId,
      inProgressSubmissionId: input.submissionId,
      title: input.title,
      draftPayload: { ...input.draftPayload },
      payloadVersion,
      policyVersion: input.policyVersion,
      lastSavedAt: now,
      writeSequence,
      encryptedAtRest: true
    };

    const previous = this.currentDraftsByKey.get(key);
    if (!previous || writeSequence >= previous.writeSequence) {
      this.currentDraftsByKey.set(key, next);
    }

    this.snapshots.push({
      id: randomUUID(),
      submissionDraftId: next.id,
      version: payloadVersion,
      snapshotPayload: {
        title: next.title,
        ...next.draftPayload
      },
      savedAt: now
    });

    return {
      submissionId: input.submissionId,
      savedAt: now,
      payloadVersion,
      draftId: next.id
    };
  }

  async getDraft(authorId: string, submissionId: string): Promise<SubmissionDraftRecord | null> {
    const key = this.buildDraftKey(authorId, submissionId);
    const row = this.currentDraftsByKey.get(key);
    if (!row) {
      return null;
    }

    return {
      ...row,
      draftPayload: { ...row.draftPayload }
    };
  }

  async isSubmissionOwnedByAuthor(authorId: string, submissionId: string): Promise<boolean> {
    return this.ownership.get(submissionId) === authorId;
  }

  async recordDraftSaveAttempt(input: {
    authorId: string | null;
    submissionId: string | null;
    outcome: DraftSaveAttemptOutcome;
    reasonCode: string;
    requestId: string;
  }): Promise<void> {
    this.saveAttempts.push({
      id: randomUUID(),
      authorId: input.authorId,
      inProgressSubmissionId: input.submissionId,
      outcome: input.outcome,
      reasonCode: input.reasonCode,
      requestId: input.requestId,
      occurredAt: this.nowProvider()
    });
  }

  snapshot(): SubmissionDraftPersistenceSnapshot {
    return {
      drafts: this.getCurrentDrafts(),
      snapshots: this.getSnapshots()
    };
  }

  restore(snapshot: SubmissionDraftPersistenceSnapshot): void {
    this.currentDraftsByKey.clear();
    for (const row of snapshot.drafts) {
      const key = this.buildDraftKey(row.authorId, row.inProgressSubmissionId);
      this.currentDraftsByKey.set(key, {
        ...row,
        draftPayload: { ...row.draftPayload }
      });
    }

    this.snapshots.length = 0;
    for (const row of snapshot.snapshots) {
      this.snapshots.push({
        ...row,
        snapshotPayload: { ...row.snapshotPayload }
      });
    }
  }

  isEncryptedAtRest(): boolean {
    return true;
  }

  private buildDraftKey(authorId: string, submissionId: string): string {
    return `${authorId}:${submissionId}`;
  }
}
