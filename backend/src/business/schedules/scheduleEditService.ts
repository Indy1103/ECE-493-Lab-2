import {
  ScheduleEditRequestSchema,
  type ScheduleEditEntryInput
} from "../validation/scheduleEditSchema.js";
import { validateScheduleEdits } from "./scheduleEditValidator.js";
import {
  SCHEDULE_ERROR_CODES,
  ScheduleFinalizedError,
  ScheduleVersionConflictError
} from "../../shared/errors/scheduleErrors.js";
import type { ScheduleRepository } from "../../data/schedules/scheduleRepository.js";
import type { ScheduleModificationRepository } from "../../data/schedules/scheduleModificationRepository.js";
import type { ScheduleEditMetricSink } from "../../shared/metrics/scheduleMetrics.js";
import type { ScheduleAuditLogger } from "../../shared/audit/scheduleAudit.js";

interface ScheduleEditServiceDeps {
  scheduleRepository: Pick<
    ScheduleRepository,
    "withScheduleLock" | "getScheduleForEditor" | "getReferenceCatalog" | "applyEdits"
  >;
  scheduleModificationRepository: Pick<ScheduleModificationRepository, "begin" | "complete">;
  auditLogger: Pick<ScheduleAuditLogger, "record">;
  metrics: Pick<ScheduleEditMetricSink, "incrementSuccess" | "incrementRejected" | "incrementConflict">;
}

export type GetConferenceScheduleOutcome =
  | {
      outcome: "SCHEDULE_RETRIEVED";
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
      };
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      statusCode: 404;
      code: "UNAVAILABLE_DENIED";
      message: string;
    };

export type UpdateConferenceScheduleOutcome =
  | {
      outcome: "SCHEDULE_UPDATED";
      statusCode: 200;
      schedule: {
        id: string;
        conferenceId: string;
        status: "FINAL";
        entries: Array<{
          paperId: string;
          sessionId: string;
          roomId: string;
          timeSlotId: string;
        }>;
      };
      message: string;
    }
  | {
      outcome: "INVALID_MODIFICATIONS";
      statusCode: 400;
      code: "INVALID_MODIFICATIONS";
      message: string;
      violations: Array<{ field: string; message: string; value: string }>;
    }
  | {
      outcome: "SCHEDULE_ALREADY_FINAL";
      statusCode: 409;
      code: "SCHEDULE_ALREADY_FINAL";
      message: string;
    }
  | {
      outcome: "CONFLICT";
      statusCode: 409;
      code: "CONFLICT";
      message: string;
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      statusCode: 404;
      code: "UNAVAILABLE_DENIED";
      message: string;
    };

function mapSchedule(schedule: {
  id: string;
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  entries: Array<{
    paperId: string;
    sessionId: string;
    roomId: string;
    timeSlotId: string;
  }>;
}) {
  return {
    id: schedule.id,
    conferenceId: schedule.conferenceId,
    status: schedule.status,
    entries: schedule.entries.map((entry) => ({
      paperId: entry.paperId,
      sessionId: entry.sessionId,
      roomId: entry.roomId,
      timeSlotId: entry.timeSlotId
    }))
  };
}

export class ScheduleEditService {
  constructor(private readonly deps: ScheduleEditServiceDeps) {}

  async getSchedule(input: {
    conferenceId: string;
    editorUserId: string;
    requestId: string;
  }): Promise<GetConferenceScheduleOutcome> {
    const schedule = await this.deps.scheduleRepository.getScheduleForEditor(
      input.conferenceId,
      input.editorUserId
    );

    if (!schedule) {
      await this.deps.auditLogger.record({
        conferenceId: input.conferenceId,
        actorUserId: input.editorUserId,
        outcome: "UNAVAILABLE_DENIED",
        reasonCode: "schedule-not-found-or-denied",
        metadata: { requestId: input.requestId }
      });

      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Conference schedule is unavailable for this conference."
      };
    }

    await this.deps.auditLogger.record({
      conferenceId: input.conferenceId,
      actorUserId: input.editorUserId,
      outcome: "SCHEDULE_RETRIEVED",
      reasonCode: "schedule-viewed",
      metadata: { requestId: input.requestId }
    });

    return {
      outcome: "SCHEDULE_RETRIEVED",
      statusCode: 200,
      schedule: mapSchedule(schedule)
    };
  }

  async updateSchedule(input: {
    conferenceId: string;
    editorUserId: string;
    requestId: string;
    payload: unknown;
  }): Promise<UpdateConferenceScheduleOutcome> {
    const parsed = ScheduleEditRequestSchema.safeParse(input.payload);

    if (!parsed.success) {
      this.deps.metrics.incrementRejected("schema");
      return {
        outcome: "INVALID_MODIFICATIONS",
        statusCode: 400,
        code: SCHEDULE_ERROR_CODES.INVALID_MODIFICATIONS,
        message: "Schedule modifications are invalid.",
        violations: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          value: issue.code
        }))
      };
    }

    const existing = await this.deps.scheduleRepository.getScheduleForEditor(
      input.conferenceId,
      input.editorUserId
    );

    if (!existing) {
      await this.deps.auditLogger.record({
        conferenceId: input.conferenceId,
        actorUserId: input.editorUserId,
        outcome: "UNAVAILABLE_DENIED",
        reasonCode: "schedule-not-found-or-denied",
        metadata: { requestId: input.requestId }
      });

      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Conference schedule is unavailable for this conference."
      };
    }

    const modification = await this.deps.scheduleModificationRepository.begin({
      scheduleId: parsed.data.scheduleId,
      requestedByEditorId: input.editorUserId
    });

    const references = await this.deps.scheduleRepository.getReferenceCatalog(input.conferenceId);

    if (!references) {
      await this.deps.scheduleModificationRepository.complete(modification.id, "REJECTED");
      this.deps.metrics.incrementRejected("references");
      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Conference schedule is unavailable for this conference."
      };
    }

    const violations = validateScheduleEdits({
      existingEntries: existing.entries,
      requestedEntries: parsed.data.entries,
      references
    });

    if (violations.length > 0) {
      await this.deps.scheduleModificationRepository.complete(modification.id, "REJECTED");
      this.deps.metrics.incrementRejected("validation");

      await this.deps.auditLogger.record({
        conferenceId: input.conferenceId,
        actorUserId: input.editorUserId,
        outcome: "INVALID_MODIFICATIONS",
        reasonCode: "validation-failed",
        metadata: {
          requestId: input.requestId,
          requestPayload: parsed.data,
          violationCount: violations.length
        }
      });

      return {
        outcome: "INVALID_MODIFICATIONS",
        statusCode: 400,
        code: SCHEDULE_ERROR_CODES.INVALID_MODIFICATIONS,
        message: "Schedule modifications are invalid.",
        violations
      };
    }

    try {
      const updated = await this.deps.scheduleRepository.withScheduleLock(input.conferenceId, async () =>
        this.deps.scheduleRepository.applyEdits({
          conferenceId: input.conferenceId,
          editorId: input.editorUserId,
          scheduleId: parsed.data.scheduleId,
          expectedVersion: existing.version,
          entries: parsed.data.entries as ScheduleEditEntryInput[]
        })
      );

      if (!updated) {
        await this.deps.scheduleModificationRepository.complete(modification.id, "REJECTED");
        this.deps.metrics.incrementRejected("availability");
        return {
          outcome: "UNAVAILABLE_DENIED",
          statusCode: 404,
          code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
          message: "Conference schedule is unavailable for this conference."
        };
      }

      await this.deps.scheduleModificationRepository.complete(modification.id, "APPLIED");
      this.deps.metrics.incrementSuccess();

      await this.deps.auditLogger.record({
        conferenceId: input.conferenceId,
        actorUserId: input.editorUserId,
        outcome: "SCHEDULE_UPDATED",
        reasonCode: "schedule-finalized",
        metadata: {
          requestId: input.requestId,
          requestPayload: parsed.data,
          modificationRequestId: modification.id
        }
      });

      return {
        outcome: "SCHEDULE_UPDATED",
        statusCode: 200,
        schedule: {
          ...mapSchedule(updated),
          status: "FINAL"
        },
        message: "Conference schedule updated and finalized."
      };
    } catch (error) {
      await this.deps.scheduleModificationRepository.complete(modification.id, "REJECTED");

      if (error instanceof ScheduleFinalizedError) {
        this.deps.metrics.incrementRejected("finalized");
        return {
          outcome: "SCHEDULE_ALREADY_FINAL",
          statusCode: 409,
          code: SCHEDULE_ERROR_CODES.SCHEDULE_ALREADY_FINAL,
          message: "Conference schedule is already finalized."
        };
      }

      if (error instanceof ScheduleVersionConflictError) {
        this.deps.metrics.incrementConflict();
        return {
          outcome: "CONFLICT",
          statusCode: 409,
          code: SCHEDULE_ERROR_CODES.CONFLICT,
          message: "Conference schedule update conflicted with another edit."
        };
      }

      this.deps.metrics.incrementRejected("operational");
      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Conference schedule is unavailable for this conference."
      };
    }
  }
}
