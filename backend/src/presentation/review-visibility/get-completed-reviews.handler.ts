import type { FastifyReply } from "fastify";

import type { GetCompletedReviewsService } from "../../business/review-visibility/get-completed-reviews.service.js";
import { REVIEW_VISIBILITY_OUTCOMES } from "../../business/review-visibility/visibility-outcome.js";
import type { ReviewVisibilitySessionRequest } from "../../security/session-guard.js";
import {
  ReviewVisibilityErrorResponseSchema,
  buildReviewVisibilitySessionExpiredResponse,
  mapReviewVisibilityOutcome
} from "./error-mapper.js";

interface GetCompletedReviewsHandlerDeps {
  service: Pick<GetCompletedReviewsService, "execute">;
}

export function createGetCompletedReviewsHandler(deps: GetCompletedReviewsHandlerDeps) {
  return async function getCompletedReviewsHandler(
    request: ReviewVisibilitySessionRequest & { params: { paperId: string } },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.reviewVisibilitySession) {
      const mapped = buildReviewVisibilitySessionExpiredResponse();
      reply.code(mapped.statusCode).send(mapped.body);
      return;
    }

    if (request.reviewVisibilitySession.role !== "EDITOR") {
      reply.code(403).send(
        ReviewVisibilityErrorResponseSchema.parse({
          messageCode: REVIEW_VISIBILITY_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Completed reviews are unavailable for this paper."
        })
      );
      return;
    }

    const outcome = await deps.service.execute({
      editorUserId: request.reviewVisibilitySession.userId,
      paperId: request.params.paperId,
      requestId: request.id
    });

    const mapped = mapReviewVisibilityOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
