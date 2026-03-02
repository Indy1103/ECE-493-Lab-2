import type { FastifyReply } from "fastify";

import type { AccessAssignedPaperService } from "../../business/referee-access/accessAssignedPaperService.js";
import type { RefereeSessionRequest } from "../../security/sessionGuard.js";
import {
  buildSessionExpiredResponse,
  mapAccessAssignedPaperOutcome
} from "./refereeAccessErrorHandler.js";

type AssignmentAccessRequest = RefereeSessionRequest & {
  params: {
    assignmentId?: string;
  };
};

interface PostAssignmentAccessRouteDeps {
  accessAssignedPaperService: Pick<AccessAssignedPaperService, "execute">;
}

export function createPostAssignmentAccessRoute(deps: PostAssignmentAccessRouteDeps) {
  return async function postAssignmentAccessRoute(
    request: AssignmentAccessRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.refereeSession) {
      const sessionExpired = buildSessionExpiredResponse();
      reply.code(sessionExpired.statusCode).send(sessionExpired.body);
      return;
    }

    const assignmentId = request.params.assignmentId ?? "";
    const outcome = await deps.accessAssignedPaperService.execute({
      refereeUserId: request.refereeSession.refereeUserId,
      assignmentId,
      requestId: request.id
    });
    const mapped = mapAccessAssignedPaperOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
