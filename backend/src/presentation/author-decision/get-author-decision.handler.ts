import type { FastifyReply } from "fastify";

import type { GetAuthorDecisionService } from "../../business/author-decision/get-author-decision.service.js";
import { AUTHOR_DECISION_OUTCOMES } from "../../business/author-decision/decision-outcome.js";
import type { AuthorDecisionSessionRequest } from "../../security/session-guard.js";
import {
  AuthorDecisionErrorResponseSchema,
  buildAuthorDecisionSessionExpiredResponse,
  mapGetAuthorDecisionOutcome
} from "./error-mapper.js";

interface GetAuthorDecisionHandlerDeps {
  service: Pick<GetAuthorDecisionService, "execute">;
}

export function createGetAuthorDecisionHandler(deps: GetAuthorDecisionHandlerDeps) {
  return async function getAuthorDecisionHandler(
    request: AuthorDecisionSessionRequest & {
      params: { paperId: string };
    },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.authorDecisionSession) {
      const mapped = buildAuthorDecisionSessionExpiredResponse();
      reply.code(mapped.statusCode).send(mapped.body);
      return;
    }

    if (request.authorDecisionSession.role !== "AUTHOR") {
      reply.code(403).send(
        AuthorDecisionErrorResponseSchema.parse({
          outcome: AUTHOR_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Decision is unavailable for this paper."
        })
      );
      return;
    }

    const outcome = await deps.service.execute({
      authorUserId: request.authorDecisionSession.userId,
      paperId: request.params.paperId,
      requestId: request.id
    });

    const mapped = mapGetAuthorDecisionOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
