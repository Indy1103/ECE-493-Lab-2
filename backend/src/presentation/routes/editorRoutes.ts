import type { FastifyPluginAsync } from "fastify";

import type { ScheduleEditService } from "../../business/schedules/scheduleEditService.js";
import type { ConferenceScheduleSessionRequest } from "../../security/session-guard.js";
import { SCHEDULE_ERROR_CODES } from "../../shared/errors/scheduleErrors.js";
import {
  createGetScheduleHandler,
  createPutScheduleHandler
} from "../controllers/scheduleController.js";

export async function requireScheduleEditTransportSecurity(
  request: any,
  reply: any
): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    code: SCHEDULE_ERROR_CODES.TLS_REQUIRED,
    message: "HTTPS is required for schedule edit actions."
  });
}

interface EditorRoutesDeps {
  scheduleService: Pick<ScheduleEditService, "getSchedule" | "updateSchedule">;
  conferenceScheduleSessionGuard: (
    request: ConferenceScheduleSessionRequest,
    reply: any
  ) => Promise<void>;
}

export function createEditorRoutes(deps: EditorRoutesDeps): FastifyPluginAsync {
  const getHandler = createGetScheduleHandler({ service: deps.scheduleService });
  const putHandler = createPutScheduleHandler({ service: deps.scheduleService });

  return async function editorRoutes(fastify): Promise<void> {
    fastify.get<{ Params: { conferenceId: string } }>(
      "/api/editor/conferences/:conferenceId/schedule",
      {
        preHandler: [requireScheduleEditTransportSecurity, deps.conferenceScheduleSessionGuard]
      },
      getHandler as any
    );

    fastify.put<{ Params: { conferenceId: string } }>(
      "/api/editor/conferences/:conferenceId/schedule",
      {
        preHandler: [requireScheduleEditTransportSecurity, deps.conferenceScheduleSessionGuard]
      },
      putHandler as any
    );
  };
}
