import { randomUUID } from "node:crypto";

import type { SubmissionMetadata } from "../../business/domain/manuscript-submission.js";

const ACTIVE_STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"]);

export interface ManuscriptSubmissionRecord {
  id: string;
  authorId: string;
  conferenceCycleId: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "REVISION_REQUESTED" | "WITHDRAWN" | "REJECTED" | "ARCHIVED";
  normalizedTitle: string;
  metadataPolicyVersion: string;
  manuscriptArtifactId: string;
  downstreamAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionMetadataPackageRecord extends SubmissionMetadata {
  submissionId: string;
  capturedAt: Date;
}

export interface ManuscriptSubmissionSnapshot {
  submissions: ManuscriptSubmissionRecord[];
  metadata: SubmissionMetadataPackageRecord[];
}

export interface ManuscriptSubmissionRepository {
  createAcceptedSubmission(input: {
    authorId: string;
    conferenceCycleId: string;
    normalizedTitle: string;
    metadataPolicyVersion: string;
    manuscriptArtifactId: string;
    metadata: SubmissionMetadata;
    now: Date;
  }): Promise<{ duplicate: boolean; submission?: ManuscriptSubmissionRecord }>;
  markDownstreamAvailable(submissionId: string): Promise<void>;
  getAll(): ManuscriptSubmissionRecord[];
  getMetadataBySubmissionId(submissionId: string): SubmissionMetadataPackageRecord | null;
  snapshot(): ManuscriptSubmissionSnapshot;
  restore(snapshot: ManuscriptSubmissionSnapshot): void;
}

export class InMemoryManuscriptSubmissionRepository implements ManuscriptSubmissionRepository {
  private readonly submissions = new Map<string, ManuscriptSubmissionRecord>();
  private readonly metadataPackages = new Map<string, SubmissionMetadataPackageRecord>();

  async createAcceptedSubmission(input: {
    authorId: string;
    conferenceCycleId: string;
    normalizedTitle: string;
    metadataPolicyVersion: string;
    manuscriptArtifactId: string;
    metadata: SubmissionMetadata;
    now: Date;
  }): Promise<{ duplicate: boolean; submission?: ManuscriptSubmissionRecord }> {
    for (const submission of this.submissions.values()) {
      if (
        submission.authorId === input.authorId &&
        submission.conferenceCycleId === input.conferenceCycleId &&
        submission.normalizedTitle === input.normalizedTitle &&
        ACTIVE_STATUSES.has(submission.status)
      ) {
        return { duplicate: true };
      }
    }

    const submission: ManuscriptSubmissionRecord = {
      id: randomUUID(),
      authorId: input.authorId,
      conferenceCycleId: input.conferenceCycleId,
      status: "SUBMITTED",
      normalizedTitle: input.normalizedTitle,
      metadataPolicyVersion: input.metadataPolicyVersion,
      manuscriptArtifactId: input.manuscriptArtifactId,
      downstreamAvailable: false,
      createdAt: input.now,
      updatedAt: input.now
    };

    this.submissions.set(submission.id, submission);
    this.metadataPackages.set(submission.id, {
      submissionId: submission.id,
      capturedAt: input.now,
      ...input.metadata
    });

    return {
      duplicate: false,
      submission
    };
  }

  async markDownstreamAvailable(submissionId: string): Promise<void> {
    const current = this.submissions.get(submissionId);
    if (!current) {
      return;
    }

    this.submissions.set(submissionId, {
      ...current,
      downstreamAvailable: true,
      updatedAt: new Date()
    });
  }

  getAll(): ManuscriptSubmissionRecord[] {
    return Array.from(this.submissions.values());
  }

  getMetadataBySubmissionId(submissionId: string): SubmissionMetadataPackageRecord | null {
    return this.metadataPackages.get(submissionId) ?? null;
  }

  snapshot(): ManuscriptSubmissionSnapshot {
    return {
      submissions: this.getAll().map((row) => ({ ...row })),
      metadata: Array.from(this.metadataPackages.values()).map((row) => ({ ...row }))
    };
  }

  restore(snapshot: ManuscriptSubmissionSnapshot): void {
    this.submissions.clear();
    this.metadataPackages.clear();

    for (const row of snapshot.submissions) {
      this.submissions.set(row.id, { ...row });
    }

    for (const row of snapshot.metadata) {
      this.metadataPackages.set(row.submissionId, { ...row });
    }
  }
}
