import type { FastifyReply } from "fastify";

import type { SubmitReviewService } from "../../business/review-submission/submit-review.service.js";
import type { ReviewSubmissionSessionRequest } from "../../security/session-guard.js";
import { buildSessionExpiredResponse, mapReviewFormOutcome } from "./error-mapper.js";

interface GetReviewFormHandlerDeps {
  service: Pick<SubmitReviewService, "getReviewForm">;
}

export function createGetReviewFormHandler(deps: GetReviewFormHandlerDeps) {
  return async function getReviewFormHandler(
    request: ReviewSubmissionSessionRequest & { params: { assignmentId: string } },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.reviewSubmissionSession) {
      const mapped = buildSessionExpiredResponse();
      reply.code(mapped.statusCode).send(mapped.body);
      return;
    }

    const outcome = await deps.service.getReviewForm({
      refereeUserId: request.reviewSubmissionSession.refereeUserId,
      assignmentId: request.params.assignmentId,
      requestId: request.id
    });

    const mapped = mapReviewFormOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
