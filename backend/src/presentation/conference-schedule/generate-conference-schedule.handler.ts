import type { FastifyReply } from "fastify";

import type { GenerateConferenceScheduleService } from "../../business/conference-schedule/generate-conference-schedule.service.js";
import { CONFERENCE_SCHEDULE_OUTCOMES } from "../../business/conference-schedule/schedule-outcome.js";
import type { ConferenceScheduleSessionRequest } from "../../security/session-guard.js";
import {
  ConferenceScheduleErrorResponseSchema,
  buildConferenceScheduleSessionExpiredResponse,
  mapGenerateConferenceScheduleOutcome
} from "./error-mapper.js";

interface GenerateConferenceScheduleHandlerDeps {
  service: Pick<GenerateConferenceScheduleService, "execute">;
}

export function createGenerateConferenceScheduleHandler(deps: GenerateConferenceScheduleHandlerDeps) {
  return async function generateConferenceScheduleHandler(
    request: ConferenceScheduleSessionRequest & { params: { conferenceId: string } },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.conferenceScheduleSession) {
      const mapped = buildConferenceScheduleSessionExpiredResponse();
      reply.code(mapped.statusCode).send(mapped.body);
      return;
    }

    if (request.conferenceScheduleSession.role !== "ADMIN") {
      reply.code(403).send(
        ConferenceScheduleErrorResponseSchema.parse({
          outcome: CONFERENCE_SCHEDULE_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Conference schedule is unavailable for this conference."
        })
      );
      return;
    }

    const outcome = await deps.service.execute({
      adminUserId: request.conferenceScheduleSession.userId,
      conferenceId: request.params.conferenceId,
      requestId: request.id
    });

    const mapped = mapGenerateConferenceScheduleOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
