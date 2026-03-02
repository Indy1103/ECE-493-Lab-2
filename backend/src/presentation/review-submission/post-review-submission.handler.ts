import type { FastifyReply } from "fastify";

import type { SubmitReviewService } from "../../business/review-submission/submit-review.service.js";
import type { ReviewSubmissionSessionRequest } from "../../security/session-guard.js";
import { buildSessionExpiredResponse, mapSubmitReviewOutcome } from "./error-mapper.js";

interface PostReviewSubmissionHandlerDeps {
  service: Pick<SubmitReviewService, "submitReview">;
}

export function createPostReviewSubmissionHandler(deps: PostReviewSubmissionHandlerDeps) {
  return async function postReviewSubmissionHandler(
    request: ReviewSubmissionSessionRequest & {
      params: { assignmentId: string };
      body?: { responses?: unknown };
    },
    reply: FastifyReply
  ): Promise<void> {
    if (!request.reviewSubmissionSession) {
      const mapped = buildSessionExpiredResponse();
      reply.code(mapped.statusCode).send(mapped.body);
      return;
    }

    const outcome = await deps.service.submitReview({
      refereeUserId: request.reviewSubmissionSession.refereeUserId,
      assignmentId: request.params.assignmentId,
      requestId: request.id,
      payload: request.body ?? {}
    });

    const mapped = mapSubmitReviewOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
