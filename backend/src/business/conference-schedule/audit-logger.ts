import type { ConferenceScheduleAuditRepository } from "./ports.js";

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...metadata };

  if ("paperTitles" in redacted) {
    delete redacted.paperTitles;
  }

  return redacted;
}

interface ConferenceScheduleAuditLoggerDeps {
  repository: Pick<ConferenceScheduleAuditRepository, "record">;
}

export class ConferenceScheduleAuditLogger {
  constructor(private readonly deps: ConferenceScheduleAuditLoggerDeps) {}

  async record(event: {
    actorUserId: string;
    conferenceId: string;
    outcome: "SCHEDULE_GENERATED" | "NO_ACCEPTED_PAPERS" | "UNAVAILABLE_DENIED" | "SESSION_EXPIRED";
    reasonCode: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.deps.repository.record({
      actorUserId: event.actorUserId,
      conferenceId: event.conferenceId,
      outcome: event.outcome,
      reasonCode: event.reasonCode,
      metadata: sanitizeMetadata(event.metadata ?? {})
    });
  }
}
