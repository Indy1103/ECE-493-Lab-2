import { ConferenceScheduleAuditLogger } from "./audit-logger.js";
import {
  CONFERENCE_SCHEDULE_OUTCOMES,
  CONFERENCE_SCHEDULE_REASON_CODES
} from "./schedule-outcome.js";
import { ConferenceScheduleBuilder } from "./schedule-builder.js";
import type { ConferenceScheduleRepository } from "./ports.js";

export type GenerateConferenceScheduleOutcome =
  | {
      outcome: "SCHEDULE_GENERATED";
      statusCode: 200;
      outcomeCode: "SCHEDULE_GENERATED";
      conferenceId: string;
      entries: Array<{
        paperId: string;
        sessionCode: string;
        roomCode: string;
        startTime: string;
        endTime: string;
      }>;
    }
  | {
      outcome: "NO_ACCEPTED_PAPERS";
      statusCode: 409;
      outcomeCode: "NO_ACCEPTED_PAPERS";
      message: string;
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      statusCode: 403 | 404;
      outcomeCode: "UNAVAILABLE_DENIED";
      message: string;
    };

interface GenerateConferenceScheduleServiceDeps {
  repository: Pick<
    ConferenceScheduleRepository,
    "withConferenceScheduleLock" | "listAcceptedPapers" | "saveGeneratedSchedule"
  >;
  scheduleBuilder: ConferenceScheduleBuilder;
  auditLogger: ConferenceScheduleAuditLogger;
}

export class GenerateConferenceScheduleService {
  constructor(private readonly deps: GenerateConferenceScheduleServiceDeps) {}

  async execute(input: {
    adminUserId: string;
    conferenceId: string;
    requestId: string;
  }): Promise<GenerateConferenceScheduleOutcome> {
    return this.deps.repository.withConferenceScheduleLock(input.conferenceId, async () => {
      const acceptedPapers = await this.deps.repository.listAcceptedPapers(
        input.conferenceId,
        input.adminUserId
      );

      if (!acceptedPapers) {
        await this.deps.auditLogger.record({
          actorUserId: input.adminUserId,
          conferenceId: input.conferenceId,
          outcome: CONFERENCE_SCHEDULE_OUTCOMES.UNAVAILABLE_DENIED,
          reasonCode: CONFERENCE_SCHEDULE_REASON_CODES.CONFERENCE_NOT_FOUND_OR_DENIED,
          metadata: { requestId: input.requestId }
        });

        return {
          outcome: "UNAVAILABLE_DENIED",
          statusCode: 404,
          outcomeCode: "UNAVAILABLE_DENIED",
          message: "Conference schedule is unavailable for this conference."
        };
      }

      if (acceptedPapers.length === 0) {
        await this.deps.auditLogger.record({
          actorUserId: input.adminUserId,
          conferenceId: input.conferenceId,
          outcome: CONFERENCE_SCHEDULE_OUTCOMES.NO_ACCEPTED_PAPERS,
          reasonCode: CONFERENCE_SCHEDULE_REASON_CODES.NO_ACCEPTED_PAPERS,
          metadata: { requestId: input.requestId }
        });

        return {
          outcome: "NO_ACCEPTED_PAPERS",
          statusCode: 409,
          outcomeCode: "NO_ACCEPTED_PAPERS",
          message: "No accepted papers are available to schedule."
        };
      }

      const entries = this.deps.scheduleBuilder.build({
        conferenceId: input.conferenceId,
        acceptedPapers
      });

      await this.deps.repository.saveGeneratedSchedule(
        {
          conferenceId: input.conferenceId,
          entries
        },
        input.adminUserId
      );

      await this.deps.auditLogger.record({
        actorUserId: input.adminUserId,
        conferenceId: input.conferenceId,
        outcome: CONFERENCE_SCHEDULE_OUTCOMES.SCHEDULE_GENERATED,
        reasonCode: CONFERENCE_SCHEDULE_REASON_CODES.SCHEDULE_CREATED,
        metadata: {
          requestId: input.requestId,
          acceptedPaperCount: acceptedPapers.length,
          paperTitles: acceptedPapers.map((paper) => paper.title)
        }
      });

      return {
        outcome: "SCHEDULE_GENERATED",
        statusCode: 200,
        outcomeCode: "SCHEDULE_GENERATED",
        conferenceId: input.conferenceId,
        entries
      };
    });
  }
}
