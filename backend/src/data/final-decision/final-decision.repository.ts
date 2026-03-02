import { randomUUID } from "node:crypto";

import type {
  DecisionAuditEvent,
  DecisionCompletionStatusRecord,
  PaperDecisionRecord
} from "../../business/final-decision/ports.js";

interface SeedPaperInput {
  paperId: string;
  authorUserId: string;
  assignedEditorIds: string[];
  requiredReviewCount: number;
  completedReviewCount: number;
}

interface FinalDecisionRepositoryOptions {
  nowProvider?: () => Date;
  forceLockConflict?: boolean;
  forceNextReadFailure?: boolean;
}

interface PaperAccessRecord {
  paperId: string;
  authorUserId: string;
  assignedEditorIds: Set<string>;
  requiredReviewCount: number;
  completedReviewCount: number;
}

export class FinalDecisionConflictError extends Error {
  constructor(message = "Final decision conflict") {
    super(message);
    this.name = "FinalDecisionConflictError";
  }
}

export class FinalDecisionReadFailureError extends Error {
  constructor(message = "Final decision read failure") {
    super(message);
    this.name = "FinalDecisionReadFailureError";
  }
}

export class PrismaFinalDecisionRepository {
  private readonly nowProvider: () => Date;
  private readonly papers = new Map<string, PaperAccessRecord>();
  private readonly decisions = new Map<string, PaperDecisionRecord>();
  private readonly lockTails = new Map<string, Promise<void>>();
  private forceLockConflict: boolean;
  private forceNextReadFailure: boolean;

  constructor(options: FinalDecisionRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceLockConflict = options.forceLockConflict ?? false;
    this.forceNextReadFailure = options.forceNextReadFailure ?? false;
  }

  seedPaper(input: SeedPaperInput): void {
    this.papers.set(input.paperId, {
      paperId: input.paperId,
      authorUserId: input.authorUserId,
      assignedEditorIds: new Set(input.assignedEditorIds),
      requiredReviewCount: input.requiredReviewCount,
      completedReviewCount: input.completedReviewCount
    });
  }

  seedFinalDecision(input: {
    paperId: string;
    decision: "ACCEPT" | "REJECT";
    decidedByEditorId: string;
    decidedAt: Date;
  }): void {
    this.decisions.set(input.paperId, {
      paperId: input.paperId,
      decision: input.decision,
      decidedAt: new Date(input.decidedAt),
      decidedByEditorId: input.decidedByEditorId,
      isFinal: true
    });
  }

  setForceLockConflict(value: boolean): void {
    this.forceLockConflict = value;
  }

  setForceNextReadFailure(value: boolean): void {
    this.forceNextReadFailure = value;
  }

  async withPaperDecisionLock<T>(paperId: string, operation: () => Promise<T>): Promise<T> {
    if (this.forceLockConflict) {
      throw new FinalDecisionConflictError();
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

  async getDecisionCompletionStatus(
    paperId: string,
    editorUserId: string
  ): Promise<DecisionCompletionStatusRecord | null> {
    const paper = this.papers.get(paperId);

    if (!paper || !paper.assignedEditorIds.has(editorUserId)) {
      return null;
    }

    if (this.forceNextReadFailure) {
      this.forceNextReadFailure = false;
      throw new FinalDecisionReadFailureError();
    }

    const status =
      paper.completedReviewCount >= paper.requiredReviewCount && paper.requiredReviewCount > 0
        ? "COMPLETE"
        : "PENDING";

    return {
      paperId,
      authorUserId: paper.authorUserId,
      completedReviewCount: paper.completedReviewCount,
      requiredReviewCount: paper.requiredReviewCount,
      status,
      checkedAt: this.nowProvider()
    };
  }

  async getFinalDecision(paperId: string): Promise<PaperDecisionRecord | null> {
    const existing = this.decisions.get(paperId);

    if (!existing) {
      return null;
    }

    return {
      ...existing,
      decidedAt: new Date(existing.decidedAt)
    };
  }

  async recordFinalDecision(input: {
    paperId: string;
    decision: "ACCEPT" | "REJECT";
    decidedByEditorId: string;
  }): Promise<PaperDecisionRecord> {
    if (this.decisions.has(input.paperId)) {
      throw new FinalDecisionConflictError();
    }

    const nextDecision: PaperDecisionRecord = {
      paperId: input.paperId,
      decision: input.decision,
      decidedAt: this.nowProvider(),
      decidedByEditorId: input.decidedByEditorId,
      isFinal: true
    };

    this.decisions.set(input.paperId, {
      ...nextDecision,
      decidedAt: new Date(nextDecision.decidedAt)
    });

    return {
      ...nextDecision,
      decidedAt: new Date(nextDecision.decidedAt)
    };
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

interface FinalDecisionAuditRepositoryOptions {
  nowProvider?: () => Date;
  emit?: (event: DecisionAuditEvent) => void;
}

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const output = { ...metadata };

  if ("requestPayload" in output) {
    output.requestPayload = "[REDACTED]";
  }

  if ("authorUserId" in output) {
    delete output.authorUserId;
  }

  return output;
}

export class FinalDecisionAuditRepository {
  private readonly events: DecisionAuditEvent[] = [];
  private readonly nowProvider: () => Date;
  private readonly emit?: (event: DecisionAuditEvent) => void;

  constructor(options: FinalDecisionAuditRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.emit = options.emit;
  }

  async record(event: Omit<DecisionAuditEvent, "eventId" | "occurredAt">): Promise<void> {
    const nextEvent: DecisionAuditEvent = {
      ...event,
      eventId: randomUUID(),
      occurredAt: this.nowProvider(),
      metadata: redactMetadata(event.metadata)
    };

    this.events.push(nextEvent);
    this.emit?.({ ...nextEvent, metadata: { ...nextEvent.metadata } });
  }

  list(): DecisionAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata }
    }));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

export const FINAL_DECISION_PRISMA_REPOSITORY_MARKER =
  "final_decision_prisma_repository_marker" as const;

export const FINAL_DECISION_AUDIT_REPOSITORY_MARKER =
  "final_decision_audit_repository_marker" as const;
