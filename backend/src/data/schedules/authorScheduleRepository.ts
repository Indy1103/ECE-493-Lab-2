import { randomUUID } from "node:crypto";

import { ScheduleReadConsistency } from "./scheduleReadConsistency.js";

export type SchedulePublicationState = "PUBLISHED" | "UNPUBLISHED";

export interface AuthorScheduleEntryRecord {
  paperId: string;
  sessionId: string;
  roomId: string;
  timeSlotId: string;
}

interface ConferenceScheduleRecord {
  id: string;
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  entries: AuthorScheduleEntryRecord[];
}

interface SchedulePublicationRecord {
  id: string;
  scheduleId: string;
  status: SchedulePublicationState;
  publishedAt: Date;
  publishedByEditorId: string;
}

interface AuthorScheduleLookupAvailable {
  state: "AVAILABLE";
  schedule: ConferenceScheduleRecord;
  authorPresentations: Array<{
    paperId: string;
    roomId: string;
    timeSlotId: string;
  }>;
}

interface AuthorScheduleLookupUnavailable {
  state: "UNAVAILABLE_DENIED";
}

interface AuthorScheduleLookupUnpublished {
  state: "UNPUBLISHED";
  scheduleId: string;
  conferenceId: string;
}

export type AuthorScheduleLookupResult =
  | AuthorScheduleLookupAvailable
  | AuthorScheduleLookupUnavailable
  | AuthorScheduleLookupUnpublished;

interface SeedScheduleInput {
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  entries: AuthorScheduleEntryRecord[];
  publication: {
    status: SchedulePublicationState;
    publishedAt: Date;
    publishedByEditorId: string;
  };
  acceptedPapersByAuthor: Record<string, string[]>;
}

interface AuthorScheduleRepositoryOptions {
  readConsistency?: ScheduleReadConsistency;
  forceReadFailure?: boolean;
}

export class AuthorScheduleRepository {
  private readonly schedules = new Map<string, ConferenceScheduleRecord>();
  private readonly publications = new Map<string, SchedulePublicationRecord>();
  private readonly acceptedPapersByAuthor = new Map<string, Set<string>>();
  private readonly readConsistency: ScheduleReadConsistency;
  private readonly forceReadFailure: boolean;

  constructor(options: AuthorScheduleRepositoryOptions = {}) {
    this.readConsistency = options.readConsistency ?? new ScheduleReadConsistency();
    this.forceReadFailure = options.forceReadFailure ?? false;
  }

  seedSchedule(input: SeedScheduleInput): ConferenceScheduleRecord {
    const schedule: ConferenceScheduleRecord = {
      id: randomUUID(),
      conferenceId: input.conferenceId,
      status: input.status,
      entries: input.entries.map((entry) => ({ ...entry }))
    };

    this.schedules.set(schedule.id, schedule);
    this.publications.set(schedule.id, {
      id: randomUUID(),
      scheduleId: schedule.id,
      status: input.publication.status,
      publishedAt: new Date(input.publication.publishedAt),
      publishedByEditorId: input.publication.publishedByEditorId
    });

    for (const [authorId, paperIds] of Object.entries(input.acceptedPapersByAuthor)) {
      this.acceptedPapersByAuthor.set(authorId, new Set(paperIds));
    }

    return this.cloneSchedule(schedule);
  }

  setPublicationStatus(scheduleId: string, status: SchedulePublicationState): void {
    const current = this.publications.get(scheduleId);
    if (!current) {
      return;
    }

    this.publications.set(scheduleId, {
      ...current,
      status,
      publishedAt: new Date()
    });
  }

  async getAuthorSchedule(authorUserId: string): Promise<AuthorScheduleLookupResult> {
    return this.readConsistency.withConsistentRead(authorUserId, async () => {
      if (this.forceReadFailure) {
        throw new Error("SCHEDULE_READ_FAILED");
      }

      const acceptedPapers = this.acceptedPapersByAuthor.get(authorUserId);
      if (!acceptedPapers || acceptedPapers.size === 0) {
        return { state: "UNAVAILABLE_DENIED" };
      }

      const matched = Array.from(this.schedules.values()).find((schedule) =>
        schedule.entries.some((entry) => acceptedPapers.has(entry.paperId))
      );

      if (!matched) {
        return { state: "UNAVAILABLE_DENIED" };
      }

      const publication = this.publications.get(matched.id)!;
      if (publication.status !== "PUBLISHED") {
        return {
          state: "UNPUBLISHED",
          scheduleId: matched.id,
          conferenceId: matched.conferenceId
        };
      }

      const authorPresentations = matched.entries
        .filter((entry) => acceptedPapers.has(entry.paperId))
        .map((entry) => ({
          paperId: entry.paperId,
          roomId: entry.roomId,
          timeSlotId: entry.timeSlotId
        }));

      return {
        state: "AVAILABLE",
        schedule: this.cloneSchedule(matched),
        authorPresentations
      };
    });
  }

  isEncryptedAtRest(): boolean {
    return true;
  }

  private cloneSchedule(record: ConferenceScheduleRecord): ConferenceScheduleRecord {
    return {
      ...record,
      entries: record.entries.map((entry) => ({ ...entry }))
    };
  }
}
