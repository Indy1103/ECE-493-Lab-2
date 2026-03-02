import { AuthorScheduleRequestSchema } from "../validation/authorScheduleSchema.js";
import { SCHEDULE_ACCESS_ERROR_CODES } from "../../shared/errors/scheduleAccessErrors.js";
import type { AuthorScheduleRepository } from "../../data/schedules/authorScheduleRepository.js";
import type { AuthorNotificationRepository } from "../../data/notifications/authorNotificationRepository.js";
import type { ScheduleAccessAuditLogger } from "../../shared/audit/scheduleAccessAudit.js";
import type { AuthorScheduleMetricSink } from "../../shared/metrics/authorScheduleMetrics.js";

interface AuthorScheduleServiceDeps {
  scheduleRepository: Pick<AuthorScheduleRepository, "getAuthorSchedule">;
  notificationRepository: Pick<AuthorNotificationRepository, "recordSent">;
  auditLogger: Pick<ScheduleAccessAuditLogger, "record">;
  metrics: Pick<
    AuthorScheduleMetricSink,
    "incrementSuccess" | "incrementUnpublished" | "incrementDenied" | "incrementFailure"
  >;
}

export type GetAuthorScheduleOutcome =
  | {
      outcome: "SCHEDULE_AVAILABLE";
      statusCode: 200;
      schedule: {
        id: string;
        conferenceId: string;
        status: "DRAFT" | "FINAL";
        entries: Array<{
          paperId: string;
          sessionId: string;
          roomId: string;
          timeSlotId: string;
        }>;
        authorPresentations: Array<{
          paperId: string;
          roomId: string;
          timeSlotId: string;
        }>;
      };
    }
  | {
      outcome: "SCHEDULE_NOT_PUBLISHED";
      statusCode: 409;
      code: "SCHEDULE_NOT_PUBLISHED";
      message: string;
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      statusCode: 404;
      code: "UNAVAILABLE_DENIED";
      message: string;
    }
  | {
      outcome: "OPERATIONAL_FAILURE";
      statusCode: 503;
      code: "OPERATIONAL_FAILURE";
      message: string;
    };

export class AuthorScheduleService {
  constructor(private readonly deps: AuthorScheduleServiceDeps) {}

  async getAuthorSchedule(input: {
    authorUserId: string;
    requestId: string;
  }): Promise<GetAuthorScheduleOutcome> {
    const parsedInput = AuthorScheduleRequestSchema.safeParse(input);

    if (!parsedInput.success) {
      this.deps.metrics.incrementDenied();
      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ACCESS_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Final schedule is unavailable for this account."
      };
    }

    try {
      const lookup = await this.deps.scheduleRepository.getAuthorSchedule(parsedInput.data.authorUserId);

      if (lookup.state === "UNAVAILABLE_DENIED") {
        this.deps.metrics.incrementDenied();
        await this.deps.auditLogger.record({
          actorUserId: parsedInput.data.authorUserId,
          outcome: "UNAVAILABLE_DENIED",
          reasonCode: "schedule-not-found-or-denied",
          metadata: { requestId: parsedInput.data.requestId }
        });

        return {
          outcome: "UNAVAILABLE_DENIED",
          statusCode: 404,
          code: SCHEDULE_ACCESS_ERROR_CODES.UNAVAILABLE_DENIED,
          message: "Final schedule is unavailable for this account."
        };
      }

      if (lookup.state === "UNPUBLISHED") {
        this.deps.metrics.incrementUnpublished();
        await this.deps.auditLogger.record({
          actorUserId: parsedInput.data.authorUserId,
          conferenceId: lookup.conferenceId,
          scheduleId: lookup.scheduleId,
          outcome: "SCHEDULE_NOT_PUBLISHED",
          reasonCode: "schedule-unpublished",
          metadata: { requestId: parsedInput.data.requestId }
        });

        return {
          outcome: "SCHEDULE_NOT_PUBLISHED",
          statusCode: 409,
          code: SCHEDULE_ACCESS_ERROR_CODES.SCHEDULE_NOT_PUBLISHED,
          message: "The final conference schedule is not yet available."
        };
      }

      await this.deps.notificationRepository.recordSent({
        authorId: parsedInput.data.authorUserId,
        scheduleId: lookup.schedule.id
      });

      this.deps.metrics.incrementSuccess();
      await this.deps.auditLogger.record({
        actorUserId: parsedInput.data.authorUserId,
        conferenceId: lookup.schedule.conferenceId,
        scheduleId: lookup.schedule.id,
        outcome: "SCHEDULE_AVAILABLE",
        reasonCode: "schedule-delivered",
        metadata: {
          requestId: parsedInput.data.requestId,
          presentationCount: lookup.authorPresentations.length,
          schedulePayload: lookup.schedule
        }
      });

      return {
        outcome: "SCHEDULE_AVAILABLE",
        statusCode: 200,
        schedule: {
          id: lookup.schedule.id,
          conferenceId: lookup.schedule.conferenceId,
          status: lookup.schedule.status,
          entries: lookup.schedule.entries.map((entry) => ({ ...entry })),
          authorPresentations: lookup.authorPresentations.map((entry) => ({ ...entry }))
        }
      };
    } catch (error) {
      this.deps.metrics.incrementFailure();
      await this.deps.auditLogger.record({
        actorUserId: parsedInput.data.authorUserId,
        outcome: "OPERATIONAL_FAILURE",
        reasonCode: "schedule-read-failure",
        metadata: {
          requestId: parsedInput.data.requestId,
          errorName: error instanceof Error ? error.name : "unknown"
        }
      });

      return {
        outcome: "OPERATIONAL_FAILURE",
        statusCode: 503,
        code: SCHEDULE_ACCESS_ERROR_CODES.OPERATIONAL_FAILURE,
        message: "Schedule is temporarily unavailable. Please try again later."
      };
    }
  }
}
