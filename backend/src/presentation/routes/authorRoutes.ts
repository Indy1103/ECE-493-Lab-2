import type { FastifyPluginAsync } from "fastify";

import type { AuthorScheduleService } from "../../business/schedules/authorScheduleService.js";
import type { AuthorScheduleSessionRequest } from "../../security/guards/authorGuard.js";
import { SCHEDULE_ACCESS_ERROR_CODES } from "../../shared/errors/scheduleAccessErrors.js";
import { createGetAuthorScheduleHandler } from "../controllers/authorScheduleController.js";

export async function requireAuthorScheduleTransportSecurity(
  request: any,
  reply: any
): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    code: SCHEDULE_ACCESS_ERROR_CODES.TLS_REQUIRED,
    message: "HTTPS is required for author schedule actions."
  });
}

interface AuthorRoutesDeps {
  authorScheduleService: Pick<AuthorScheduleService, "getAuthorSchedule">;
  authorScheduleSessionGuard: (request: AuthorScheduleSessionRequest, reply: any) => Promise<void>;
}

export function createAuthorRoutes(deps: AuthorRoutesDeps): FastifyPluginAsync {
  const getHandler = createGetAuthorScheduleHandler({ service: deps.authorScheduleService });

  return async function authorRoutes(fastify): Promise<void> {
    fastify.get(
      "/api/author/schedule",
      {
        preHandler: [requireAuthorScheduleTransportSecurity, deps.authorScheduleSessionGuard]
      },
      getHandler as any
    );
  };
}
