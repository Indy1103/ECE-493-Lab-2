export type RefereeAssignmentStatus = "ACTIVE" | "UNAVAILABLE" | "REVOKED";
export type RefereeInvitationStatus = "ACCEPTED" | "PENDING" | "REJECTED";
export type PaperResourceAvailability = "AVAILABLE" | "UNAVAILABLE";
export type ReviewFormAccessStatus = "READY" | "UNAVAILABLE";

export interface RefereeAssignmentRecord {
  id: string;
  refereeUserId: string;
  paperId: string;
  reviewFormId: string;
  status: RefereeAssignmentStatus;
  invitationStatus: RefereeInvitationStatus;
  assignedAt: Date;
  updatedAt: Date;
}

export interface PaperAccessResourceRecord {
  paperId: string;
  title: string;
  abstractPreview?: string;
  fileObjectKey: string;
  contentUrl: string;
  availability: PaperResourceAvailability;
  lastAvailabilityCheckAt: Date;
}

export interface ReviewFormAccessRecord {
  reviewFormId: string;
  paperId: string;
  refereeUserId: string;
  schemaVersion: string;
  formUrl: string;
  status: ReviewFormAccessStatus;
}

export interface RefereeAssignmentListItem {
  assignmentId: string;
  paperId: string;
  title: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  status: RefereeAssignmentStatus;
  invitationStatus: RefereeInvitationStatus;
}

export interface RefereeAccessRepositorySnapshot {
  assignments: RefereeAssignmentRecord[];
  paperResources: PaperAccessResourceRecord[];
  reviewForms: ReviewFormAccessRecord[];
}

export interface AssignedPaperRepository {
  listAssignmentsForReferee(refereeUserId: string): Promise<RefereeAssignmentListItem[]>;
  getAssignmentById(assignmentId: string): Promise<RefereeAssignmentRecord | null>;
  getPaperAccessResource(paperId: string): Promise<PaperAccessResourceRecord | null>;
  getReviewFormAccess(reviewFormId: string): Promise<ReviewFormAccessRecord | null>;
  snapshot(): RefereeAccessRepositorySnapshot;
  restore(snapshot: RefereeAccessRepositorySnapshot): void;
  isEncryptedAtRest(): boolean;
}

interface PrismaAssignedPaperRepositoryOptions {
  nowProvider?: () => Date;
  forceNextListFailure?: boolean;
  forceNextAccessFailure?: boolean;
}

export class PrismaAssignedPaperRepository implements AssignedPaperRepository {
  private readonly nowProvider: () => Date;
  private readonly assignments = new Map<string, RefereeAssignmentRecord>();
  private readonly paperResources = new Map<string, PaperAccessResourceRecord>();
  private readonly reviewForms = new Map<string, ReviewFormAccessRecord>();
  private forceNextListFailure: boolean;
  private forceNextAccessFailure: boolean;

  constructor(options: PrismaAssignedPaperRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.forceNextListFailure = options.forceNextListFailure ?? false;
    this.forceNextAccessFailure = options.forceNextAccessFailure ?? false;
  }

  setForceNextListFailure(value: boolean): void {
    this.forceNextListFailure = value;
  }

  setForceNextAccessFailure(value: boolean): void {
    this.forceNextAccessFailure = value;
  }

  seedAssignment(record: RefereeAssignmentRecord): void {
    this.assignments.set(record.id, { ...record });
  }

  seedPaperResource(record: PaperAccessResourceRecord): void {
    this.paperResources.set(record.paperId, { ...record });
  }

  seedReviewForm(record: ReviewFormAccessRecord): void {
    this.reviewForms.set(record.reviewFormId, { ...record });
  }

  async listAssignmentsForReferee(refereeUserId: string): Promise<RefereeAssignmentListItem[]> {
    if (this.forceNextListFailure) {
      this.forceNextListFailure = false;
      throw new Error("forced assignment list failure");
    }

    return Array.from(this.assignments.values())
      .filter((assignment) => assignment.refereeUserId === refereeUserId)
      .sort((left, right) => left.assignedAt.getTime() - right.assignedAt.getTime())
      .map((assignment) => {
        const paper = this.paperResources.get(assignment.paperId);
        const reviewForm = this.reviewForms.get(assignment.reviewFormId);

        const available =
          assignment.status === "ACTIVE" &&
          paper?.availability === "AVAILABLE" &&
          reviewForm?.status === "READY";

        return {
          assignmentId: assignment.id,
          paperId: assignment.paperId,
          title: paper?.title ?? "Assigned paper",
          availability: available ? "AVAILABLE" : "UNAVAILABLE",
          status: assignment.status,
          invitationStatus: assignment.invitationStatus
        };
      });
  }

  async getAssignmentById(assignmentId: string): Promise<RefereeAssignmentRecord | null> {
    if (this.forceNextAccessFailure) {
      this.forceNextAccessFailure = false;
      throw new Error("forced assignment access failure");
    }

    const assignment = this.assignments.get(assignmentId);
    return assignment ? { ...assignment } : null;
  }

  async getPaperAccessResource(paperId: string): Promise<PaperAccessResourceRecord | null> {
    const paper = this.paperResources.get(paperId);
    if (!paper) {
      return null;
    }
    return {
      ...paper,
      lastAvailabilityCheckAt: this.nowProvider()
    };
  }

  async getReviewFormAccess(reviewFormId: string): Promise<ReviewFormAccessRecord | null> {
    const reviewForm = this.reviewForms.get(reviewFormId);
    return reviewForm ? { ...reviewForm } : null;
  }

  snapshot(): RefereeAccessRepositorySnapshot {
    return {
      assignments: Array.from(this.assignments.values()).map((entry) => ({ ...entry })),
      paperResources: Array.from(this.paperResources.values()).map((entry) => ({ ...entry })),
      reviewForms: Array.from(this.reviewForms.values()).map((entry) => ({ ...entry }))
    };
  }

  restore(snapshot: RefereeAccessRepositorySnapshot): void {
    this.assignments.clear();
    this.paperResources.clear();
    this.reviewForms.clear();

    for (const assignment of snapshot.assignments) {
      this.assignments.set(assignment.id, { ...assignment });
    }
    for (const paperResource of snapshot.paperResources) {
      this.paperResources.set(paperResource.paperId, { ...paperResource });
    }
    for (const reviewForm of snapshot.reviewForms) {
      this.reviewForms.set(reviewForm.reviewFormId, { ...reviewForm });
    }
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

export const ASSIGNED_PAPER_REPOSITORY_CONTRACT = "assigned_paper_repository_contract_marker" as const;
