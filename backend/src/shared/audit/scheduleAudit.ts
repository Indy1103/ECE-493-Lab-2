import { randomUUID } from "node:crypto";

import { redactScheduleEditLog } from "../logging/redaction.js";

export interface ScheduleAuditEvent {
  eventId: string;
  conferenceId: string;
  actorUserId: string;
  outcome:
    | "SCHEDULE_RETRIEVED"
    | "SCHEDULE_UPDATED"
    | "INVALID_MODIFICATIONS"
    | "UNAVAILABLE_DENIED";
  reasonCode: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export interface ScheduleAuditRepository {
  record(event: ScheduleAuditEvent): Promise<void>;
}

export class InMemoryScheduleAuditRepository implements ScheduleAuditRepository {
  private readonly events: ScheduleAuditEvent[] = [];

  async record(event: ScheduleAuditEvent): Promise<void> {
    this.events.push({
      ...event,
      metadata: { ...event.metadata },
      occurredAt: new Date(event.occurredAt)
    });
  }

  list(): ScheduleAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata },
      occurredAt: new Date(event.occurredAt)
    }));
  }
}

export class ScheduleAuditLogger {
  constructor(private readonly deps: { repository: ScheduleAuditRepository }) {}

  async record(event: Omit<ScheduleAuditEvent, "eventId" | "occurredAt">): Promise<void> {
    await this.deps.repository.record({
      ...event,
      eventId: randomUUID(),
      occurredAt: new Date(),
      metadata: redactScheduleEditLog(event.metadata)
    });
  }
}
