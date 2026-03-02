import { z } from "zod";

import type { GenerateConferenceScheduleOutcome } from "../../business/conference-schedule/generate-conference-schedule.service.js";
import { CONFERENCE_SCHEDULE_OUTCOMES } from "../../business/conference-schedule/schedule-outcome.js";

export const ScheduleEntrySchema = z.object({
  paperId: z.string(),
  sessionCode: z.string(),
  roomCode: z.string(),
  startTime: z.string(),
  endTime: z.string()
});

export const ScheduleGeneratedResponseSchema = z.object({
  outcome: z.literal("SCHEDULE_GENERATED"),
  conferenceId: z.string(),
  entries: z.array(ScheduleEntrySchema)
});

export const NoAcceptedPapersResponseSchema = z.object({
  outcome: z.literal("NO_ACCEPTED_PAPERS"),
  message: z.string()
});

export const ConferenceScheduleErrorResponseSchema = z.object({
  outcome: z.enum(["UNAVAILABLE_DENIED", "SESSION_EXPIRED"]),
  message: z.string()
});

export function buildConferenceScheduleSessionExpiredResponse() {
  return {
    statusCode: 401,
    body: ConferenceScheduleErrorResponseSchema.parse({
      outcome: CONFERENCE_SCHEDULE_OUTCOMES.SESSION_EXPIRED,
      message: "Your session has expired. Please sign in again."
    })
  };
}

export function mapGenerateConferenceScheduleOutcome(outcome: GenerateConferenceScheduleOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SCHEDULE_GENERATED":
      return {
        statusCode: 200,
        body: ScheduleGeneratedResponseSchema.parse({
          outcome: outcome.outcomeCode,
          conferenceId: outcome.conferenceId,
          entries: outcome.entries
        })
      };
    case "NO_ACCEPTED_PAPERS":
      return {
        statusCode: 409,
        body: NoAcceptedPapersResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message
        })
      };
    case "UNAVAILABLE_DENIED":
      return {
        statusCode: outcome.statusCode,
        body: ConferenceScheduleErrorResponseSchema.parse({
          outcome: outcome.outcomeCode,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 404,
        body: ConferenceScheduleErrorResponseSchema.parse({
          outcome: CONFERENCE_SCHEDULE_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Conference schedule is unavailable for this conference."
        })
      };
  }
}
