import { z } from "zod";
import type { FastifyReply } from "fastify";

import type {
  GetConferenceScheduleOutcome,
  ScheduleEditService,
  UpdateConferenceScheduleOutcome
} from "../../business/schedules/scheduleEditService.js";
import { SCHEDULE_ERROR_CODES } from "../../shared/errors/scheduleErrors.js";
import type { ConferenceScheduleSessionRequest } from "../../security/session-guard.js";
import { ensureEditorRole } from "../../security/guards/editorGuard.js";

const ScheduleEntrySchema = z.object({
  paperId: z.string().uuid(),
  sessionId: z.string().uuid(),
  roomId: z.string().uuid(),
  timeSlotId: z.string().uuid()
});

const ConferenceScheduleSchema = z.object({
  id: z.string().uuid(),
  conferenceId: z.string().uuid(),
  status: z.enum(["DRAFT", "FINAL"]),
  entries: z.array(ScheduleEntrySchema)
});

const ErrorSchema = z.object({
  code: z.string(),
  message: z.string()
});

function mapGetOutcome(outcome: GetConferenceScheduleOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  if (outcome.outcome === "SCHEDULE_RETRIEVED") {
    return {
      statusCode: 200,
      body: ConferenceScheduleSchema.parse(outcome.schedule)
    };
  }

  return {
    statusCode: outcome.statusCode,
    body: ErrorSchema.parse({
      code: outcome.code,
      message: outcome.message
    })
  };
}

function mapPutOutcome(outcome: UpdateConferenceScheduleOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SCHEDULE_UPDATED":
      return {
        statusCode: 200,
        body: ConferenceScheduleSchema.parse(outcome.schedule)
      };
    case "INVALID_MODIFICATIONS":
      return {
        statusCode: 400,
        body: {
          ...ErrorSchema.parse({ code: outcome.code, message: outcome.message }),
          violations: outcome.violations
        }
      };
    case "SCHEDULE_ALREADY_FINAL":
    case "CONFLICT":
    case "UNAVAILABLE_DENIED":
      return {
        statusCode: outcome.statusCode,
        body: ErrorSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: ErrorSchema.parse({
          code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
          message: "Conference schedule is unavailable for this conference."
        })
      };
  }
}

interface ScheduleControllerDeps {
  service: Pick<ScheduleEditService, "getSchedule" | "updateSchedule">;
}

export function createGetScheduleHandler(deps: ScheduleControllerDeps) {
  return async function getScheduleHandler(
    request: ConferenceScheduleSessionRequest & { params: { conferenceId: string } },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.conferenceScheduleSession) {
      reply.code(401).send(
        ErrorSchema.parse({
          code: SCHEDULE_ERROR_CODES.AUTHENTICATION_REQUIRED,
          message: "Your session has expired. Please sign in again."
        })
      );
      return;
    }

    if (!ensureEditorRole(request.conferenceScheduleSession.role, reply)) {
      return;
    }

    const outcome = await deps.service.getSchedule({
      conferenceId: request.params.conferenceId,
      editorUserId: request.conferenceScheduleSession.userId,
      requestId: request.id
    });

    const mapped = mapGetOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}

export function createPutScheduleHandler(deps: ScheduleControllerDeps) {
  return async function putScheduleHandler(
    request: ConferenceScheduleSessionRequest & {
      params: { conferenceId: string };
      body: unknown;
    },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.conferenceScheduleSession) {
      reply.code(401).send(
        ErrorSchema.parse({
          code: SCHEDULE_ERROR_CODES.AUTHENTICATION_REQUIRED,
          message: "Your session has expired. Please sign in again."
        })
      );
      return;
    }

    if (!ensureEditorRole(request.conferenceScheduleSession.role, reply)) {
      return;
    }

    const outcome = await deps.service.updateSchedule({
      conferenceId: request.params.conferenceId,
      editorUserId: request.conferenceScheduleSession.userId,
      requestId: request.id,
      payload: request.body
    });

    const mapped = mapPutOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
