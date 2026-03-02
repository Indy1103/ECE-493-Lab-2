import { randomUUID } from "node:crypto";

import type {
  InvitationDecision,
  InvitationResponseAttemptRecord,
  ReviewAssignmentRecord,
  ReviewInvitationPersistenceSnapshot,
  ReviewInvitationRecord,
  ReviewInvitationRepository
} from "./ReviewInvitationRepository.js";

interface PrismaReviewInvitationRepositoryOptions {
  nowProvider?: () => Date;
  forceLockConflict?: boolean;
  forceNextRecordingFailure?: boolean;
  forceNextReadFailure?: boolean;
}

export class ReviewInvitationConflictError extends Error {
  constructor(message = "Invitation already resolved.") {
    super(message);
    this.name = "ReviewInvitationConflictError";
  }
}

export class ReviewInvitationRecordingFailureError extends Error {
  constructor(message = "Invitation response recording failed.") {
    super(message);
    this.name = "ReviewInvitationRecordingFailureError";
  }
}

export class ReviewInvitationNotPendingError extends Error {
  constructor(message = "Invitation is not pending.") {
    super(message);
    this.name = "ReviewInvitationNotPendingError";
  }
}

export class PrismaReviewInvitationRepository implements ReviewInvitationRepository {
  private readonly nowProvider: () => Date;
  private readonly invitations = new Map<string, ReviewInvitationRecord>();
  private readonly assignments = new Map<string, ReviewAssignmentRecord>();
  private readonly attempts: InvitationResponseAttemptRecord[] = [];
  private readonly lockTails = new Map<string, Promise<void>>();
  private readonly activeLocks = new Map<string, number>();
  private readonly maxObservedConcurrency = new Map<string, number>();
  private forceLockConflict: boolean;
  private forceNextRecordingFailure: boolean;
  private forceNextReadFailure: boolean;

  constructor(options: PrismaReviewInvitationRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceLockConflict = options.forceLockConflict ?? false;
    this.forceNextRecordingFailure = options.forceNextRecordingFailure ?? false;
    this.forceNextReadFailure = options.forceNextReadFailure ?? false;
  }

  setForceLockConflict(value: boolean): void {
    this.forceLockConflict = value;
  }

  setForceNextRecordingFailure(value: boolean): void {
    this.forceNextRecordingFailure = value;
  }

  setForceNextReadFailure(value: boolean): void {
    this.forceNextReadFailure = value;
  }

  seedInvitation(record: ReviewInvitationRecord): void {
    this.invitations.set(record.invitationId, { ...record });
  }

  getAllInvitations(): ReviewInvitationRecord[] {
    return Array.from(this.invitations.values()).map((item) => ({ ...item }));
  }

  getAllAssignments(): ReviewAssignmentRecord[] {
    return Array.from(this.assignments.values()).map((item) => ({ ...item }));
  }

  getAllAttempts(): InvitationResponseAttemptRecord[] {
    return this.attempts.map((item) => ({ ...item }));
  }

  getMaxObservedInvitationConcurrency(invitationId: string): number {
    return this.maxObservedConcurrency.get(invitationId) ?? 0;
  }

  async withInvitationLock<T>(invitationId: string, operation: () => Promise<T>): Promise<T> {
    if (this.forceLockConflict) {
      throw new ReviewInvitationConflictError("Lock conflict");
    }

    const currentTail = this.lockTails.get(invitationId) ?? Promise.resolve();

    let release!: () => void;
    const nextTail = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.lockTails.set(invitationId, currentTail.then(() => nextTail));

    await currentTail;

    const inFlight = (this.activeLocks.get(invitationId) ?? 0) + 1;
    this.activeLocks.set(invitationId, inFlight);
    this.maxObservedConcurrency.set(
      invitationId,
      Math.max(this.maxObservedConcurrency.get(invitationId) ?? 0, inFlight)
    );

    try {
      return await operation();
    } finally {
      const remaining = Math.max((this.activeLocks.get(invitationId) ?? 1) - 1, 0);
      this.activeLocks.set(invitationId, remaining);
      release();
    }
  }

  async getInvitationById(invitationId: string): Promise<ReviewInvitationRecord | null> {
    if (this.forceNextReadFailure) {
      this.forceNextReadFailure = false;
      throw new Error("forced invitation read failure");
    }

    const invitation = this.invitations.get(invitationId);
    return invitation ? { ...invitation } : null;
  }

  async recordInvitationDecision(input: {
    invitationId: string;
    decision: InvitationDecision;
    refereeId: string;
  }): Promise<{ invitationStatus: "ACCEPTED" | "REJECTED"; assignmentCreated: boolean }> {
    const invitation = this.invitations.get(input.invitationId);

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.refereeId !== input.refereeId) {
      throw new Error("AUTHORIZATION_FAILED");
    }

    if (invitation.invitationStatus === "ACCEPTED" || invitation.invitationStatus === "REJECTED") {
      throw new ReviewInvitationConflictError();
    }

    if (invitation.invitationStatus !== "PENDING") {
      throw new ReviewInvitationNotPendingError();
    }

    if (this.forceNextRecordingFailure) {
      this.forceNextRecordingFailure = false;
      throw new ReviewInvitationRecordingFailureError();
    }

    const now = this.nowProvider();
    const invitationStatus = input.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

    this.invitations.set(input.invitationId, {
      ...invitation,
      invitationStatus,
      resolvedAt: now,
      version: invitation.version + 1
    });

    let assignmentCreated = false;

    if (input.decision === "ACCEPT") {
      const existing = Array.from(this.assignments.values()).find(
        (assignment) => assignment.sourceInvitationId === input.invitationId
      );

      if (!existing) {
        const assignment: ReviewAssignmentRecord = {
          id: randomUUID(),
          paperId: invitation.paperId,
          refereeId: invitation.refereeId,
          sourceInvitationId: invitation.invitationId,
          assignmentStatus: "ACTIVE",
          assignedAt: now
        };
        this.assignments.set(assignment.id, assignment);
        assignmentCreated = true;
      }
    }

    return {
      invitationStatus,
      assignmentCreated
    };
  }

  async recordResponseAttempt(
    input: Omit<InvitationResponseAttemptRecord, "id" | "occurredAt">
  ): Promise<void> {
    this.attempts.push({
      ...input,
      id: randomUUID(),
      occurredAt: this.nowProvider()
    });
  }

  async getAssignmentsByInvitation(invitationId: string): Promise<ReviewAssignmentRecord[]> {
    return Array.from(this.assignments.values())
      .filter((assignment) => assignment.sourceInvitationId === invitationId)
      .map((assignment) => ({ ...assignment }));
  }

  async getAssignmentsByReferee(refereeId: string): Promise<ReviewAssignmentRecord[]> {
    return Array.from(this.assignments.values())
      .filter((assignment) => assignment.refereeId === refereeId)
      .map((assignment) => ({ ...assignment }));
  }

  snapshot(): ReviewInvitationPersistenceSnapshot {
    return {
      invitations: this.getAllInvitations(),
      attempts: this.getAllAttempts(),
      assignments: this.getAllAssignments()
    };
  }

  restore(snapshot: ReviewInvitationPersistenceSnapshot): void {
    this.invitations.clear();
    for (const invitation of snapshot.invitations) {
      this.invitations.set(invitation.invitationId, { ...invitation });
    }

    this.assignments.clear();
    for (const assignment of snapshot.assignments) {
      this.assignments.set(assignment.id, { ...assignment });
    }

    this.attempts.splice(0, this.attempts.length, ...snapshot.attempts.map((item) => ({ ...item })));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}
