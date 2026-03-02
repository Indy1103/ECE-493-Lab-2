import type { FastifyPluginAsync } from "fastify";

import type { GenerateConferenceScheduleService } from "../../business/conference-schedule/generate-conference-schedule.service.js";
import type { ConferenceScheduleSessionRequest } from "../../security/session-guard.js";
import { createGenerateConferenceScheduleHandler } from "./generate-conference-schedule.handler.js";

export async function requireConferenceScheduleTransportSecurity(
  request: any,
  reply: any
): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    outcome: "TLS_REQUIRED",
    message: "HTTPS is required for conference schedule actions."
  });
}

interface ConferenceScheduleRoutesDeps {
  service: Pick<GenerateConferenceScheduleService, "execute">;
  conferenceScheduleSessionGuard: (
    request: ConferenceScheduleSessionRequest,
    reply: any
  ) => Promise<void>;
}

export function createConferenceScheduleRoutes(deps: ConferenceScheduleRoutesDeps): FastifyPluginAsync {
  const postHandler = createGenerateConferenceScheduleHandler({ service: deps.service });

  return async function conferenceScheduleRoutes(fastify): Promise<void> {
    fastify.post<{ Params: { conferenceId: string } }>(
      "/api/admin/conference/:conferenceId/schedule",
      {
        preHandler: [requireConferenceScheduleTransportSecurity, deps.conferenceScheduleSessionGuard]
      },
      postHandler as any
    );
  };
}
