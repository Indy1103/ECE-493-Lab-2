import type { FastifyReply } from "fastify";

import type { ListAssignmentsService } from "../../business/referee-access/listAssignmentsService.js";
import type { RefereeSessionRequest } from "../../security/sessionGuard.js";
import {
  buildSessionExpiredResponse,
  mapListAssignmentsOutcome
} from "./refereeAccessErrorHandler.js";

interface GetAssignmentsRouteDeps {
  listAssignmentsService: Pick<ListAssignmentsService, "execute">;
}

export function createGetAssignmentsRoute(deps: GetAssignmentsRouteDeps) {
  return async function getAssignmentsRoute(
    request: RefereeSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.refereeSession) {
      const sessionExpired = buildSessionExpiredResponse();
      reply.code(sessionExpired.statusCode).send(sessionExpired.body);
      return;
    }

    const outcome = await deps.listAssignmentsService.execute({
      refereeUserId: request.refereeSession.refereeUserId,
      requestId: request.id
    });
    const mapped = mapListAssignmentsOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
