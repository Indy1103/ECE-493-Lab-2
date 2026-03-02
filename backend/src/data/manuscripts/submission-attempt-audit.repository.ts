import { randomUUID } from "node:crypto";

export interface SubmissionAttemptAuditRecord {
  id: string;
  authorId: string | null;
  submissionId: string | null;
  requestId: string;
  outcome:
    | "SUCCESS"
    | "AUTHZ_FAILED"
    | "METADATA_INVALID"
    | "FILE_INVALID"
    | "DUPLICATE_REJECTED"
    | "INTAKE_CLOSED"
    | "OPERATIONAL_FAILED";
  reasonCode: string;
  occurredAt: Date;
}

export interface SubmissionAttemptAuditRepository {
  record(input: Omit<SubmissionAttemptAuditRecord, "id" | "occurredAt">): Promise<void>;
  getAll(): SubmissionAttemptAuditRecord[];
  snapshot(): SubmissionAttemptAuditRecord[];
  restore(snapshot: SubmissionAttemptAuditRecord[]): void;
}

export class InMemorySubmissionAttemptAuditRepository implements SubmissionAttemptAuditRepository {
  private readonly rows: SubmissionAttemptAuditRecord[] = [];

  async record(input: Omit<SubmissionAttemptAuditRecord, "id" | "occurredAt">): Promise<void> {
    this.rows.push({
      ...input,
      id: randomUUID(),
      occurredAt: new Date()
    });
  }

  getAll(): SubmissionAttemptAuditRecord[] {
    return this.rows;
  }

  snapshot(): SubmissionAttemptAuditRecord[] {
    return this.rows.map((row) => ({ ...row }));
  }

  restore(snapshot: SubmissionAttemptAuditRecord[]): void {
    this.rows.length = 0;
    for (const row of snapshot) {
      this.rows.push({ ...row });
    }
  }
}
