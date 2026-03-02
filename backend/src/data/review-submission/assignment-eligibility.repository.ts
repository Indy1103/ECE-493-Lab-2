import type { AssignmentEligibilityRecord } from "../../business/review-submission/ports.js";

interface PrismaAssignmentEligibilityRepositoryOptions {
  forceNextReadFailure?: boolean;
}

export class PrismaAssignmentEligibilityRepository {
  private readonly rows = new Map<string, AssignmentEligibilityRecord>();
  private forceNextReadFailure: boolean;

  constructor(options: PrismaAssignmentEligibilityRepositoryOptions = {}) {
    this.forceNextReadFailure = options.forceNextReadFailure ?? false;
  }

  setForceNextReadFailure(value: boolean): void {
    this.forceNextReadFailure = value;
  }

  seedEligibility(record: AssignmentEligibilityRecord): void {
    this.rows.set(record.assignmentId, {
      ...record,
      reviewForm: {
        ...record.reviewForm,
        fields: record.reviewForm.fields.map((field) => ({ ...field }))
      }
    });
  }

  async getByAssignmentId(assignmentId: string): Promise<AssignmentEligibilityRecord | null> {
    if (this.forceNextReadFailure) {
      this.forceNextReadFailure = false;
      throw new Error("forced eligibility read failure");
    }

    const row = this.rows.get(assignmentId);
    if (!row) {
      return null;
    }

    return {
      ...row,
      reviewForm: {
        ...row.reviewForm,
        fields: row.reviewForm.fields.map((field) => ({ ...field }))
      }
    };
  }

  snapshot(): AssignmentEligibilityRecord[] {
    return Array.from(this.rows.values()).map((row) => ({
      ...row,
      reviewForm: {
        ...row.reviewForm,
        fields: row.reviewForm.fields.map((field) => ({ ...field }))
      }
    }));
  }

  restore(snapshot: AssignmentEligibilityRecord[]): void {
    this.rows.clear();
    for (const row of snapshot) {
      this.seedEligibility(row);
    }
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}
