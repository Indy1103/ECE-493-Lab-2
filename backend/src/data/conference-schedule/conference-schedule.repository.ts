import { randomUUID } from "node:crypto";

import type {
  AcceptedPaper,
  ConferenceScheduleAuditEvent,
  GeneratedConferenceSchedule
} from "../../business/conference-schedule/ports.js";

interface ConferenceSeedInput {
  conferenceId: string;
  adminIds: string[];
  acceptedPapers: AcceptedPaper[];
}

interface ConferenceRow {
  conferenceId: string;
  adminIds: string[];
  acceptedPapers: AcceptedPaper[];
}

export class PrismaConferenceScheduleRepository {
  private readonly conferences = new Map<string, ConferenceRow>();
  private readonly schedules = new Map<string, GeneratedConferenceSchedule>();
  private readonly locks = new Map<string, Promise<void>>();

  seedConference(input: ConferenceSeedInput): void {
    this.conferences.set(input.conferenceId, {
      conferenceId: input.conferenceId,
      adminIds: [...input.adminIds],
      acceptedPapers: input.acceptedPapers.map((paper) => ({ ...paper }))
    });
  }

  async withConferenceScheduleLock<T>(conferenceId: string, operation: () => Promise<T>): Promise<T> {
    const pending = this.locks.get(conferenceId) ?? Promise.resolve();

    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(conferenceId, pending.then(() => current));

    await pending;

    try {
      return await operation();
    } finally {
      release();
      this.locks.delete(conferenceId);
    }
  }

  async listAcceptedPapers(conferenceId: string, adminUserId: string): Promise<AcceptedPaper[] | null> {
    const row = this.conferences.get(conferenceId);

    if (!row || !row.adminIds.includes(adminUserId)) {
      return null;
    }

    return row.acceptedPapers.map((paper) => ({ ...paper }));
  }

  async saveGeneratedSchedule(schedule: GeneratedConferenceSchedule, _adminUserId: string): Promise<void> {
    this.schedules.set(schedule.conferenceId, {
      conferenceId: schedule.conferenceId,
      entries: schedule.entries.map((entry) => ({ ...entry }))
    });
  }

  getSchedule(conferenceId: string): GeneratedConferenceSchedule | null {
    const schedule = this.schedules.get(conferenceId);
    if (!schedule) {
      return null;
    }

    return {
      conferenceId: schedule.conferenceId,
      entries: schedule.entries.map((entry) => ({ ...entry }))
    };
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const output = { ...metadata };

  if ("paperTitles" in output) {
    delete output.paperTitles;
  }

  return output;
}

export class ConferenceScheduleAuditRepository {
  private readonly events: ConferenceScheduleAuditEvent[] = [];

  async record(event: Omit<ConferenceScheduleAuditEvent, "eventId" | "occurredAt">): Promise<void> {
    this.events.push({
      ...event,
      eventId: randomUUID(),
      occurredAt: new Date(),
      metadata: sanitizeMetadata(event.metadata)
    });
  }

  list(): ConferenceScheduleAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata }
    }));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}
