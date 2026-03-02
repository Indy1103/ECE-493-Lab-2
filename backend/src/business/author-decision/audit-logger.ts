import type { AuthorDecisionAuditRepository } from "./ports.js";

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...metadata };

  if ("authorId" in redacted) {
    delete redacted.authorId;
  }

  if ("decision" in redacted) {
    redacted.decision = "[REDACTED]";
  }

  return redacted;
}

interface AuthorDecisionAuditLoggerDeps {
  repository: Pick<AuthorDecisionAuditRepository, "record">;
}

export class AuthorDecisionAuditLogger {
  constructor(private readonly deps: AuthorDecisionAuditLoggerDeps) {}

  async record(event: {
    actorUserId: string;
    paperId: string;
    outcome: "DECISION_AVAILABLE" | "NOTIFICATION_FAILED" | "UNAVAILABLE_DENIED" | "SESSION_EXPIRED";
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

export const AUTHOR_DECISION_AUDIT_LOGGER_MARKER = "author_decision_audit_logger_marker" as const;
