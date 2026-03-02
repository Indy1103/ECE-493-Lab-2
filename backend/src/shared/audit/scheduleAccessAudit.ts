import { randomUUID } from "node:crypto";

import { redactScheduleAccessLog } from "../logging/redaction.js";

export interface ScheduleAccessAuditEvent {
  eventId: string;
  actorUserId: string;
  conferenceId?: string;
  scheduleId?: string;
  outcome:
    | "SCHEDULE_AVAILABLE"
    | "SCHEDULE_NOT_PUBLISHED"
    | "UNAVAILABLE_DENIED"
    | "OPERATIONAL_FAILURE";
  reasonCode: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export interface ScheduleAccessAuditRepository {
  record(event: ScheduleAccessAuditEvent): Promise<void>;
}

export class InMemoryScheduleAccessAuditRepository implements ScheduleAccessAuditRepository {
  private readonly events: ScheduleAccessAuditEvent[] = [];

  async record(event: ScheduleAccessAuditEvent): Promise<void> {
    this.events.push({
      ...event,
      metadata: { ...event.metadata },
      occurredAt: new Date(event.occurredAt)
    });
  }

  list(): ScheduleAccessAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata },
      occurredAt: new Date(event.occurredAt)
    }));
  }
}

export class ScheduleAccessAuditLogger {
  constructor(private readonly deps: { repository: ScheduleAccessAuditRepository }) {}

  async record(event: Omit<ScheduleAccessAuditEvent, "eventId" | "occurredAt">): Promise<void> {
    await this.deps.repository.record({
      ...event,
      eventId: randomUUID(),
      occurredAt: new Date(),
      metadata: redactScheduleAccessLog(event.metadata)
    });
  }
}
