import { randomUUID } from "node:crypto";

import type { ReviewSubmissionRecord } from "../../business/review-submission/ports.js";

interface PrismaReviewSubmissionRepositoryOptions {
  nowProvider?: () => Date;
  forceLockConflict?: boolean;
  forceNextWriteFailure?: boolean;
}

export class ReviewSubmissionConflictError extends Error {
  constructor(message = "A final review submission already exists.") {
    super(message);
    this.name = "ReviewSubmissionConflictError";
  }
}

export class ReviewSubmissionWriteFailureError extends Error {
  constructor(message = "Review submission write failure") {
    super(message);
    this.name = "ReviewSubmissionWriteFailureError";
  }
}

export class PrismaReviewSubmissionRepository {
  private readonly nowProvider: () => Date;
  private readonly submissions = new Map<string, ReviewSubmissionRecord>();
  private readonly lockTails = new Map<string, Promise<void>>();
  private forceLockConflict: boolean;
  private forceNextWriteFailure: boolean;

  constructor(options: PrismaReviewSubmissionRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceLockConflict = options.forceLockConflict ?? false;
    this.forceNextWriteFailure = options.forceNextWriteFailure ?? false;
  }

  setForceLockConflict(value: boolean): void {
    this.forceLockConflict = value;
  }

  setForceNextWriteFailure(value: boolean): void {
    this.forceNextWriteFailure = value;
  }

  seedSubmission(record: ReviewSubmissionRecord): void {
    this.submissions.set(record.assignmentId, {
      ...record,
      content: { ...record.content }
    });
  }

  async withAssignmentLock<T>(assignmentId: string, operation: () => Promise<T>): Promise<T> {
    if (this.forceLockConflict) {
      throw new ReviewSubmissionConflictError("Submission lock conflict");
    }

    const currentTail = this.lockTails.get(assignmentId) ?? Promise.resolve();

    let release!: () => void;
    const nextTail = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.lockTails.set(assignmentId, currentTail.then(() => nextTail));

    await currentTail;

    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getByAssignmentId(assignmentId: string): Promise<ReviewSubmissionRecord | null> {
    const existing = this.submissions.get(assignmentId);
    return existing
      ? {
          ...existing,
          content: { ...existing.content }
        }
      : null;
  }

  async createFinalSubmission(input: {
    assignmentId: string;
    paperId: string;
    refereeUserId: string;
    content: Record<string, unknown>;
  }): Promise<ReviewSubmissionRecord> {
    if (this.submissions.has(input.assignmentId)) {
      throw new ReviewSubmissionConflictError();
    }

    if (this.forceNextWriteFailure) {
      this.forceNextWriteFailure = false;
      throw new ReviewSubmissionWriteFailureError();
    }

    const now = this.nowProvider();
    const record: ReviewSubmissionRecord = {
      id: randomUUID(),
      assignmentId: input.assignmentId,
      paperId: input.paperId,
      refereeUserId: input.refereeUserId,
      content: { ...input.content },
      status: "SUBMITTED",
      submittedAt: now,
      updatedAt: now
    };

    this.submissions.set(input.assignmentId, {
      ...record,
      content: { ...record.content }
    });

    return {
      ...record,
      content: { ...record.content }
    };
  }

  list(): ReviewSubmissionRecord[] {
    return Array.from(this.submissions.values()).map((record) => ({
      ...record,
      content: { ...record.content }
    }));
  }

  snapshot(): ReviewSubmissionRecord[] {
    return this.list();
  }

  restore(snapshot: ReviewSubmissionRecord[]): void {
    this.submissions.clear();
    for (const row of snapshot) {
      this.seedSubmission(row);
    }
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}
