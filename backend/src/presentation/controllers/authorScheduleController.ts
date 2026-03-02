import type { FastifyReply } from "fastify";

import type {
  AuthorScheduleService,
  GetAuthorScheduleOutcome
} from "../../business/schedules/authorScheduleService.js";
import {
  AuthorScheduleErrorSchema,
  AuthorScheduleResponseSchema
} from "../../business/validation/authorScheduleSchema.js";
import type { AuthorScheduleSessionRequest } from "../../security/guards/authorGuard.js";
import { ensureAuthorRole } from "../../security/guards/authorGuard.js";
import { SCHEDULE_ACCESS_ERROR_CODES } from "../../shared/errors/scheduleAccessErrors.js";

export { AuthorScheduleErrorSchema, AuthorScheduleResponseSchema };

interface AuthorScheduleControllerDeps {
  service: Pick<AuthorScheduleService, "getAuthorSchedule">;
}

function mapOutcome(outcome: GetAuthorScheduleOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SCHEDULE_AVAILABLE":
      return {
        statusCode: 200,
        body: AuthorScheduleResponseSchema.parse(outcome.schedule)
      };
    case "SCHEDULE_NOT_PUBLISHED":
    case "UNAVAILABLE_DENIED":
    case "OPERATIONAL_FAILURE":
      return {
        statusCode: outcome.statusCode,
        body: AuthorScheduleErrorSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 503,
        body: AuthorScheduleErrorSchema.parse({
          code: SCHEDULE_ACCESS_ERROR_CODES.OPERATIONAL_FAILURE,
          message: "Schedule is temporarily unavailable. Please try again later."
        })
      };
  }
}

export function createGetAuthorScheduleHandler(deps: AuthorScheduleControllerDeps) {
  return async function getAuthorScheduleHandler(
    request: AuthorScheduleSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.authorScheduleSession) {
      reply.code(401).send(
        AuthorScheduleErrorSchema.parse({
          code: SCHEDULE_ACCESS_ERROR_CODES.AUTHENTICATION_REQUIRED,
          message: "Your session has expired. Please sign in again."
        })
      );
      return;
    }

    if (!ensureAuthorRole(request.authorScheduleSession.role, reply)) {
      return;
    }

    const outcome = await deps.service.getAuthorSchedule({
      authorUserId: request.authorScheduleSession.userId,
      requestId: request.id
    });

    const mapped = mapOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
