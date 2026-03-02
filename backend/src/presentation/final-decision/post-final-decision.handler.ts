import type { FastifyReply } from "fastify";

import type { PostFinalDecisionService } from "../../business/final-decision/post-final-decision.service.js";
import { FINAL_DECISION_OUTCOMES } from "../../business/final-decision/decision-outcome.js";
import type { FinalDecisionSessionRequest } from "../../security/session-guard.js";
import {
  FinalDecisionErrorResponseSchema,
  buildFinalDecisionSessionExpiredResponse,
  mapPostFinalDecisionOutcome
} from "./error-mapper.js";

interface PostFinalDecisionHandlerDeps {
  service: Pick<PostFinalDecisionService, "execute">;
}

export function createPostFinalDecisionHandler(deps: PostFinalDecisionHandlerDeps) {
  return async function postFinalDecisionHandler(
    request: FinalDecisionSessionRequest & {
      params: { paperId: string };
      body?: { decision?: unknown };
    },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.finalDecisionSession) {
      const mapped = buildFinalDecisionSessionExpiredResponse();
      reply.code(mapped.statusCode).send(mapped.body);
      return;
    }

    if (request.finalDecisionSession.role !== "EDITOR") {
      reply.code(403).send(
        FinalDecisionErrorResponseSchema.parse({
          outcome: FINAL_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Final decision is unavailable for this paper."
        })
      );
      return;
    }

    const decision = request.body?.decision === "REJECT" ? "REJECT" : "ACCEPT";

    const outcome = await deps.service.execute({
      editorUserId: request.finalDecisionSession.userId,
      paperId: request.params.paperId,
      decision,
      requestId: request.id
    });

    const mapped = mapPostFinalDecisionOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
