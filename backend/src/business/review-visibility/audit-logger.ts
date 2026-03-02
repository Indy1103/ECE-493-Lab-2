import type { ReviewVisibilityAuditRepository } from "./ports.js";

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...metadata };

  if ("reviews" in redacted) {
    redacted.reviews = "[REDACTED]";
  }

  if ("refereeUserId" in redacted) {
    redacted.refereeUserId = "[REDACTED]";
  }

  return redacted;
}

interface ReviewVisibilityAuditLoggerDeps {
  repository: Pick<ReviewVisibilityAuditRepository, "record">;
}

export class ReviewVisibilityAuditLogger {
  constructor(private readonly deps: ReviewVisibilityAuditLoggerDeps) {}

  async record(event: {
    actorUserId: string;
    paperId: string;
    outcome: "REVIEWS_VISIBLE" | "REVIEWS_PENDING" | "UNAVAILABLE_DENIED" | "SESSION_EXPIRED";
    reasonCode: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.deps.repository.record({
      actorUserId: event.actorUserId,
      paperId: event.paperId,
      outcome: event.outcome,
      reasonCode: event.reasonCode,
      metadata: sanitizeMetadata(event.metadata ?? {})
    });
  }
}

export const REVIEW_VISIBILITY_AUDIT_LOGGER_MARKER = "review_visibility_audit_logger_marker" as const;
