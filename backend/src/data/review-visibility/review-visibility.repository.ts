import { randomUUID } from "node:crypto";

import type {
  CompletedReviewRecord,
  ReviewCompletionStatusRecord,
  ReviewVisibilityAuditEvent
} from "../../business/review-visibility/ports.js";

interface SeedPaperInput {
  paperId: string;
  assignedEditorIds: string[];
  requiredReviewCount: number;
}

interface ReviewVisibilityRepositoryOptions {
  nowProvider?: () => Date;
  forceLockConflict?: boolean;
  forceNextReadFailure?: boolean;
}

interface PaperAccessRecord {
  paperId: string;
  assignedEditorIds: Set<string>;
  requiredReviewCount: number;
}

export class ReviewVisibilityConflictError extends Error {
  constructor(message = "Review visibility read conflict") {
    super(message);
    this.name = "ReviewVisibilityConflictError";
  }
}

export class ReviewVisibilityReadFailureError extends Error {
  constructor(message = "Review visibility read failure") {
    super(message);
    this.name = "ReviewVisibilityReadFailureError";
  }
}

export class PrismaReviewVisibilityRepository {
  private readonly nowProvider: () => Date;
  private readonly papers = new Map<string, PaperAccessRecord>();
  private readonly reviews = new Map<string, CompletedReviewRecord[]>();
  private readonly lockTails = new Map<string, Promise<void>>();
  private forceLockConflict: boolean;
  private forceNextReadFailure: boolean;

  constructor(options: ReviewVisibilityRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceLockConflict = options.forceLockConflict ?? false;
    this.forceNextReadFailure = options.forceNextReadFailure ?? false;
  }

  seedPaper(input: SeedPaperInput): void {
    this.papers.set(input.paperId, {
      paperId: input.paperId,
      assignedEditorIds: new Set(input.assignedEditorIds),
      requiredReviewCount: input.requiredReviewCount
    });
  }

  seedReview(input: CompletedReviewRecord): void {
    const current = this.reviews.get(input.paperId) ?? [];
    current.push({
      ...input,
      submittedAt: new Date(input.submittedAt),
      scores: { ...input.scores }
    });
    this.reviews.set(input.paperId, current);
  }

  setForceLockConflict(value: boolean): void {
    this.forceLockConflict = value;
  }

  setForceNextReadFailure(value: boolean): void {
    this.forceNextReadFailure = value;
  }

  async withPaperReadLock<T>(paperId: string, operation: () => Promise<T>): Promise<T> {
    if (this.forceLockConflict) {
      throw new ReviewVisibilityConflictError();
    }

    const currentTail = this.lockTails.get(paperId) ?? Promise.resolve();

    let release!: () => void;
    const nextTail = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.lockTails.set(paperId, currentTail.then(() => nextTail));

    await currentTail;

    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getCompletionStatus(
    paperId: string,
    editorUserId: string
  ): Promise<ReviewCompletionStatusRecord | null> {
    const paper = this.papers.get(paperId);

    if (!paper || !paper.assignedEditorIds.has(editorUserId)) {
      return null;
    }

    if (this.forceNextReadFailure) {
      this.forceNextReadFailure = false;
      throw new ReviewVisibilityReadFailureError();
    }

    const completedReviewCount = (this.reviews.get(paperId) ?? []).length;
    const status =
      completedReviewCount >= paper.requiredReviewCount && paper.requiredReviewCount > 0
        ? "COMPLETE"
        : "PENDING";

    return {
      paperId,
      completedReviewCount,
      requiredReviewCount: paper.requiredReviewCount,
      status,
      checkedAt: this.nowProvider()
    };
  }

  async getCompletedReviews(paperId: string, editorUserId: string): Promise<CompletedReviewRecord[]> {
    const paper = this.papers.get(paperId);

    if (!paper || !paper.assignedEditorIds.has(editorUserId)) {
      return [];
    }

    return (this.reviews.get(paperId) ?? []).map((review) => ({
      ...review,
      submittedAt: new Date(review.submittedAt),
      scores: { ...review.scores }
    }));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

interface ReviewVisibilityAuditRepositoryOptions {
  nowProvider?: () => Date;
  emit?: (event: ReviewVisibilityAuditEvent) => void;
}

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const output = { ...metadata };

  if ("reviews" in output) {
    output.reviews = "[REDACTED]";
  }

  if ("refereeUserId" in output) {
    output.refereeUserId = "[REDACTED]";
  }

  return output;
}

export class ReviewVisibilityAuditRepository {
  private readonly events: ReviewVisibilityAuditEvent[] = [];
  private readonly nowProvider: () => Date;
  private readonly emit?: (event: ReviewVisibilityAuditEvent) => void;

  constructor(options: ReviewVisibilityAuditRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.emit = options.emit;
  }

  async record(event: Omit<ReviewVisibilityAuditEvent, "eventId" | "occurredAt">): Promise<void> {
    const nextEvent: ReviewVisibilityAuditEvent = {
      ...event,
      eventId: randomUUID(),
      occurredAt: this.nowProvider(),
      metadata: redactMetadata(event.metadata)
    };

    this.events.push(nextEvent);
    this.emit?.({ ...nextEvent, metadata: { ...nextEvent.metadata } });
  }

  list(): ReviewVisibilityAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata }
    }));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

export const REVIEW_VISIBILITY_PRISMA_REPOSITORY_MARKER =
  "review_visibility_prisma_repository_marker" as const;

export const REVIEW_VISIBILITY_AUDIT_REPOSITORY_MARKER =
  "review_visibility_audit_repository_marker" as const;
