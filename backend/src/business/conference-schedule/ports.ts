export interface AcceptedPaper {
  paperId: string;
  title: string;
  authorId: string;
  decision: "ACCEPT";
}

export interface ConferenceScheduleEntry {
  paperId: string;
  sessionCode: string;
  roomCode: string;
  startTime: string;
  endTime: string;
}

export interface GeneratedConferenceSchedule {
  conferenceId: string;
  entries: ConferenceScheduleEntry[];
}

export interface ConferenceScheduleAuditEvent {
  eventId: string;
  actorUserId: string;
  conferenceId: string;
  outcome: "SCHEDULE_GENERATED" | "NO_ACCEPTED_PAPERS" | "UNAVAILABLE_DENIED" | "SESSION_EXPIRED";
  reasonCode: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
}

export interface ConferenceScheduleRepository {
  withConferenceScheduleLock<T>(conferenceId: string, operation: () => Promise<T>): Promise<T>;
  listAcceptedPapers(conferenceId: string, adminUserId: string): Promise<AcceptedPaper[] | null>;
  saveGeneratedSchedule(schedule: GeneratedConferenceSchedule, adminUserId: string): Promise<void>;
}

export interface ConferenceScheduleAuditRepository {
  record(event: Omit<ConferenceScheduleAuditEvent, "eventId" | "occurredAt">): Promise<void>;
}

export const CONFERENCE_SCHEDULE_PORTS_MARKER = "conference_schedule_ports_marker" as const;
