import { REVIEW_SUBMISSION_REASON_CODES } from "./submission-outcome.js";
import type { ReviewSubmissionRepository } from "./ports.js";

export class DuplicateFinalSubmissionError extends Error {
  readonly reasonCode = REVIEW_SUBMISSION_REASON_CODES.DUPLICATE_FINAL_SUBMISSION;

  constructor(message = "A final review submission already exists for this assignment.") {
    super(message);
    this.name = "DuplicateFinalSubmissionError";
  }
}

export class FinalSubmissionGuard {
  constructor(private readonly repository: Pick<ReviewSubmissionRepository, "getByAssignmentId">) {}

  async ensureNoFinalSubmission(assignmentId: string): Promise<void> {
    const existing = await this.repository.getByAssignmentId(assignmentId);
    if (existing) {
      throw new DuplicateFinalSubmissionError();
    }
  }
}
