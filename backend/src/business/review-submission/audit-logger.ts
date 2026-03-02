import type { ReviewSubmissionAuditRepository } from "./ports.js";

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...metadata };

  if ("responses" in redacted) {
    redacted.responses = "[REDACTED]";
  }

  if ("content" in redacted) {
    redacted.content = "[REDACTED]";
  }

  return redacted;
}

interface ReviewSubmissionAuditLoggerDeps {
  repository: Pick<ReviewSubmissionAuditRepository, "record">;
}

export class ReviewSubmissionAuditLogger {
  constructor(private readonly deps: ReviewSubmissionAuditLoggerDeps) {}

  async record(event: {
    actorUserId: string;
    assignmentId: string | null;
    paperId: string | null;
    outcome: "submitted" | "validation-failed" | "session-expired" | "submission-unavailable";
    reasonCode: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.deps.repository.record({
      actorUserId: event.actorUserId,
      assignmentId: event.assignmentId,
      paperId: event.paperId,
      outcome: event.outcome,
      reasonCode: event.reasonCode,
      metadata: sanitizeMetadata(event.metadata ?? {})
    });
  }
}

export const REVIEW_SUBMISSION_AUDIT_LOGGER_MARKER = "review_submission_audit_logger_marker" as const;
