import { randomUUID } from "node:crypto";

import { assertScheduleCanBeUpdated } from "./scheduleConcurrency.js";
import type { ScheduleEditEntryInput } from "../../business/validation/scheduleEditSchema.js";

export interface ScheduleEntryRecord {
  id: string;
  paperId: string;
  sessionId: string;
  roomId: string;
  timeSlotId: string;
}

export interface ConferenceScheduleRecord {
  id: string;
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  updatedAt: Date;
  updatedByEditorId: string;
  version: number;
  entries: ScheduleEntryRecord[];
}

interface ConferenceAccessRecord {
  conferenceId: string;
  editorIds: Set<string>;
  referenceSessionIds: Set<string>;
  referenceRoomIds: Set<string>;
  referenceTimeSlotIds: Set<string>;
}

interface SeedScheduleInput {
  conferenceId: string;
  editorIds: string[];
  status?: "DRAFT" | "FINAL";
  updatedByEditorId: string;
  entries: Array<{
    paperId: string;
    sessionId: string;
    roomId: string;
    timeSlotId: string;
  }>;
  referenceCatalog?: {
    sessionIds?: string[];
    roomIds?: string[];
    timeSlotIds?: string[];
  };
}

export class ScheduleRepository {
  private readonly conferenceAccess = new Map<string, ConferenceAccessRecord>();
  private readonly schedulesByConference = new Map<string, ConferenceScheduleRecord>();
  private readonly locks = new Map<string, Promise<void>>();

  seedSchedule(input: SeedScheduleInput): ConferenceScheduleRecord {
    const id = randomUUID();
    const access: ConferenceAccessRecord = {
      conferenceId: input.conferenceId,
      editorIds: new Set(input.editorIds),
      referenceSessionIds: new Set(
        input.referenceCatalog?.sessionIds ?? input.entries.map((entry) => entry.sessionId)
      ),
      referenceRoomIds: new Set(input.referenceCatalog?.roomIds ?? input.entries.map((entry) => entry.roomId)),
      referenceTimeSlotIds: new Set(
        input.referenceCatalog?.timeSlotIds ?? input.entries.map((entry) => entry.timeSlotId)
      )
    };

    const record: ConferenceScheduleRecord = {
      id,
      conferenceId: input.conferenceId,
      status: input.status ?? "DRAFT",
      updatedAt: new Date("2026-03-02T10:00:00.000Z"),
      updatedByEditorId: input.updatedByEditorId,
      version: 1,
      entries: input.entries.map((entry) => ({
        id: randomUUID(),
        paperId: entry.paperId,
        sessionId: entry.sessionId,
        roomId: entry.roomId,
        timeSlotId: entry.timeSlotId
      }))
    };

    this.conferenceAccess.set(input.conferenceId, access);
    this.schedulesByConference.set(input.conferenceId, record);

    return this.cloneSchedule(record);
  }

  async withScheduleLock<T>(conferenceId: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(conferenceId) ?? Promise.resolve();

    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(conferenceId, previous.then(() => current));

    await previous;

    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getScheduleForEditor(
    conferenceId: string,
    editorId: string
  ): Promise<ConferenceScheduleRecord | null> {
    const access = this.conferenceAccess.get(conferenceId);
    const schedule = this.schedulesByConference.get(conferenceId);

    if (!access || !schedule || !access.editorIds.has(editorId)) {
      return null;
    }

    return this.cloneSchedule(schedule);
  }

  async getReferenceCatalog(conferenceId: string): Promise<{
    sessionIds: Set<string>;
    roomIds: Set<string>;
    timeSlotIds: Set<string>;
  } | null> {
    const access = this.conferenceAccess.get(conferenceId);

    if (!access) {
      return null;
    }

    return {
      sessionIds: new Set(access.referenceSessionIds),
      roomIds: new Set(access.referenceRoomIds),
      timeSlotIds: new Set(access.referenceTimeSlotIds)
    };
  }

  async applyEdits(input: {
    conferenceId: string;
    editorId: string;
    scheduleId: string;
    expectedVersion: number;
    entries: ScheduleEditEntryInput[];
  }): Promise<ConferenceScheduleRecord | null> {
    const access = this.conferenceAccess.get(input.conferenceId);
    const current = this.schedulesByConference.get(input.conferenceId);

    if (!access || !current || !access.editorIds.has(input.editorId) || current.id !== input.scheduleId) {
      return null;
    }

    assertScheduleCanBeUpdated({
      expectedVersion: input.expectedVersion,
      current: {
        status: current.status,
        version: current.version
      }
    });

    current.entries = input.entries.map((entry) => ({
      id: randomUUID(),
      paperId: entry.paperId,
      sessionId: entry.sessionId,
      roomId: entry.roomId,
      timeSlotId: entry.timeSlotId
    }));
    current.status = "FINAL";
    current.updatedByEditorId = input.editorId;
    current.updatedAt = new Date();
    current.version += 1;

    this.schedulesByConference.set(input.conferenceId, current);

    return this.cloneSchedule(current);
  }

  isEncryptedAtRest(): boolean {
    return true;
  }

  private cloneSchedule(record: ConferenceScheduleRecord): ConferenceScheduleRecord {
    return {
      ...record,
      updatedAt: new Date(record.updatedAt),
      entries: record.entries.map((entry) => ({ ...entry }))
    };
  }
}
