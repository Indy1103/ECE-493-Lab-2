import type { FinalDecisionAuditRepository } from "./ports.js";

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...metadata };

  if ("requestPayload" in redacted) {
    redacted.requestPayload = "[REDACTED]";
  }

  if ("authorUserId" in redacted) {
    delete redacted.authorUserId;
  }

  return redacted;
}

interface DecisionAuditLoggerDeps {
  repository: Pick<FinalDecisionAuditRepository, "record">;
}

export class DecisionAuditLogger {
  constructor(private readonly deps: DecisionAuditLoggerDeps) {}

  async record(event: {
    actorUserId: string;
    paperId: string;
    outcome:
      | "DECISION_RECORDED"
      | "REVIEWS_PENDING"
      | "DECISION_FINALIZED"
      | "UNAVAILABLE_DENIED"
      | "SESSION_EXPIRED";
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

export const FINAL_DECISION_AUDIT_LOGGER_MARKER = "final_decision_audit_logger_marker" as const;
