import { randomUUID } from "node:crypto";

import type {
  AssignmentAttemptAuditRecord,
  PaperAssignmentCandidateRecord,
  RefereeAssignmentPersistenceSnapshot,
  RefereeAssignmentRecord,
  RefereeAssignmentRepository,
  RefereeWorkloadProfileRecord,
  ReviewInvitationRecord
} from "./RefereeAssignmentRepository.js";

export class RefereeAssignmentConflictError extends Error {
  constructor(message = "Assignment lock conflict") {
    super(message);
    this.name = "RefereeAssignmentConflictError";
  }
}

interface PrismaRefereeAssignmentRepositoryOptions {
  nowProvider?: () => Date;
  forceLockConflict?: boolean;
}

export class PrismaRefereeAssignmentRepository implements RefereeAssignmentRepository {
  private readonly nowProvider: () => Date;
  private readonly papers = new Map<string, PaperAssignmentCandidateRecord>();
  private readonly referees = new Map<string, RefereeWorkloadProfileRecord>();
  private readonly assignments = new Map<string, RefereeAssignmentRecord>();
  private readonly invitations = new Map<string, ReviewInvitationRecord>();
  private readonly audits: AssignmentAttemptAuditRecord[] = [];
  private readonly lockTails = new Map<string, Promise<void>>();
  private readonly activeLocks = new Map<string, number>();
  private readonly maxObservedConcurrency = new Map<string, number>();
  private forceLockConflict = false;

  constructor(options: PrismaRefereeAssignmentRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceLockConflict = options.forceLockConflict ?? false;
  }

  setForceLockConflict(value: boolean): void {
    this.forceLockConflict = value;
  }

  seedPaperCandidate(record: PaperAssignmentCandidateRecord): void {
    this.papers.set(record.paperId, { ...record });
  }

  seedRefereeProfile(record: RefereeWorkloadProfileRecord): void {
    this.referees.set(record.refereeId, { ...record });
  }

  getAllAssignments(): RefereeAssignmentRecord[] {
    return Array.from(this.assignments.values()).map((row) => ({ ...row }));
  }

  getAllInvitations(): ReviewInvitationRecord[] {
    return Array.from(this.invitations.values()).map((row) => ({ ...row }));
  }

  getAuditRows(): AssignmentAttemptAuditRecord[] {
    return this.audits.map((row) => ({ ...row }));
  }

  getMaxObservedPaperConcurrency(paperId: string): number {
    return this.maxObservedConcurrency.get(paperId) ?? 0;
  }

  async withPaperLock<T>(paperId: string, operation: () => Promise<T>): Promise<T> {
    if (this.forceLockConflict) {
      throw new RefereeAssignmentConflictError();
    }

    const currentTail = this.lockTails.get(paperId) ?? Promise.resolve();

    let release!: () => void;

    const nextTail = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.lockTails.set(paperId, currentTail.then(() => nextTail));

    await currentTail;

    const inFlight = (this.activeLocks.get(paperId) ?? 0) + 1;
    this.activeLocks.set(paperId, inFlight);
    this.maxObservedConcurrency.set(
      paperId,
      Math.max(this.maxObservedConcurrency.get(paperId) ?? 0, inFlight)
    );

    try {
      return await operation();
    } finally {
      const remaining = Math.max((this.activeLocks.get(paperId) ?? 1) - 1, 0);
      this.activeLocks.set(paperId, remaining);
      release();
    }
  }

  async getPaperCandidate(paperId: string): Promise<PaperAssignmentCandidateRecord | null> {
    return this.papers.get(paperId) ?? null;
  }

  async listRefereeProfiles(conferenceCycleId: string): Promise<RefereeWorkloadProfileRecord[]> {
    return Array.from(this.referees.values())
      .filter((profile) => profile.conferenceCycleId === conferenceCycleId)
      .map((profile) => ({ ...profile }));
  }

  async getAssignmentsByPaper(paperId: string): Promise<RefereeAssignmentRecord[]> {
    return Array.from(this.assignments.values())
      .filter((assignment) => assignment.paperId === paperId)
      .map((assignment) => ({ ...assignment }));
  }

  async findActiveAssignment(
    paperId: string,
    refereeId: string
  ): Promise<RefereeAssignmentRecord | null> {
    for (const assignment of this.assignments.values()) {
      if (assignment.paperId === paperId && assignment.refereeId === refereeId) {
        return { ...assignment };
      }
    }

    return null;
  }

  async createAssignments(input: {
    paperId: string;
    conferenceCycleId: string;
    editorId: string;
    refereeIds: string[];
  }): Promise<RefereeAssignmentRecord[]> {
    const now = this.nowProvider();
    const created: RefereeAssignmentRecord[] = [];

    for (const refereeId of input.refereeIds) {
      const assignment: RefereeAssignmentRecord = {
        id: randomUUID(),
        paperId: input.paperId,
        refereeId,
        assignedByEditorId: input.editorId,
        assignmentStatus: "ASSIGNED",
        assignedAt: now,
        conferenceCycleId: input.conferenceCycleId
      };

      this.assignments.set(assignment.id, assignment);
      created.push({ ...assignment });

      const profile = this.referees.get(refereeId);
      if (profile) {
        this.referees.set(refereeId, {
          ...profile,
          currentActiveAssignments: profile.currentActiveAssignments + 1
        });
      }
    }

    return created;
  }

  async createInvitationIntent(input: {
    assignmentId: string;
    paperId: string;
    refereeId: string;
  }): Promise<ReviewInvitationRecord> {
    const invitation: ReviewInvitationRecord = {
      id: randomUUID(),
      assignmentId: input.assignmentId,
      paperId: input.paperId,
      refereeId: input.refereeId,
      invitationStatus: "PENDING",
      attemptCount: 0,
      lastAttemptAt: null,
      failureReasonCode: null,
      createdAt: this.nowProvider()
    };

    this.invitations.set(invitation.id, invitation);

    return { ...invitation };
  }

  async updateInvitationStatus(input: {
    invitationId: string;
    status: ReviewInvitationRecord["invitationStatus"];
    failureReasonCode?: string | null;
    incrementAttempt: boolean;
  }): Promise<void> {
    const current = this.invitations.get(input.invitationId);
    if (!current) {
      return;
    }

    this.invitations.set(input.invitationId, {
      ...current,
      invitationStatus: input.status,
      failureReasonCode:
        input.failureReasonCode === undefined ? current.failureReasonCode : input.failureReasonCode,
      attemptCount: input.incrementAttempt ? current.attemptCount + 1 : current.attemptCount,
      lastAttemptAt: input.incrementAttempt ? this.nowProvider() : current.lastAttemptAt
    });
  }

  async listInvitationsByPaper(paperId: string): Promise<ReviewInvitationRecord[]> {
    return Array.from(this.invitations.values())
      .filter((invitation) => invitation.paperId === paperId)
      .map((invitation) => ({ ...invitation }));
  }

  async listRetryableInvitations(): Promise<ReviewInvitationRecord[]> {
    return Array.from(this.invitations.values())
      .filter((invitation) => invitation.invitationStatus === "FAILED_RETRYABLE")
      .map((invitation) => ({ ...invitation }));
  }

  async recordAudit(
    input: Omit<AssignmentAttemptAuditRecord, "id" | "occurredAt">
  ): Promise<void> {
    this.audits.push({
      ...input,
      id: randomUUID(),
      occurredAt: this.nowProvider()
    });
  }

  snapshot(): RefereeAssignmentPersistenceSnapshot {
    return {
      papers: Array.from(this.papers.values()).map((row) => ({ ...row })),
      referees: Array.from(this.referees.values()).map((row) => ({ ...row })),
      assignments: this.getAllAssignments(),
      invitations: this.getAllInvitations()
    };
  }

  restore(snapshot: RefereeAssignmentPersistenceSnapshot): void {
    this.papers.clear();
    for (const row of snapshot.papers) {
      this.papers.set(row.paperId, { ...row });
    }

    this.referees.clear();
    for (const row of snapshot.referees) {
      this.referees.set(row.refereeId, { ...row });
    }

    this.assignments.clear();
    for (const row of snapshot.assignments) {
      this.assignments.set(row.id, { ...row });
    }

    this.invitations.clear();
    for (const row of snapshot.invitations) {
      this.invitations.set(row.id, { ...row });
    }
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}
