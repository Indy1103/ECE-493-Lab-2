import type { FastifyPluginAsync } from "fastify";

import type { SubmitReviewService } from "../../business/review-submission/submit-review.service.js";
import type { ReviewSubmissionSessionRequest } from "../../security/session-guard.js";
import { createGetReviewFormHandler } from "./get-review-form.handler.js";
import { createPostReviewSubmissionHandler } from "./post-review-submission.handler.js";

export async function requireReviewSubmissionTransportSecurity(request: any, reply: any): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    messageCode: "TLS_REQUIRED",
    message: "HTTPS is required for review submission actions."
  });
}

interface ReviewSubmissionRoutesDeps {
  service: Pick<SubmitReviewService, "getReviewForm" | "submitReview">;
  reviewSubmissionSessionGuard: (request: ReviewSubmissionSessionRequest, reply: any) => Promise<void>;
}

export function createReviewSubmissionRoutes(deps: ReviewSubmissionRoutesDeps): FastifyPluginAsync {
  const getHandler = createGetReviewFormHandler({ service: deps.service });
  const postHandler = createPostReviewSubmissionHandler({ service: deps.service });

  return async function reviewSubmissionRoutes(fastify): Promise<void> {
    fastify.get<{ Params: { assignmentId: string } }>(
      "/api/referee/assignments/:assignmentId/review-form",
      {
        preHandler: [requireReviewSubmissionTransportSecurity, deps.reviewSubmissionSessionGuard]
      },
      getHandler as any
    );

    fastify.post<{ Params: { assignmentId: string } }>(
      "/api/referee/assignments/:assignmentId/review-submissions",
      {
        preHandler: [requireReviewSubmissionTransportSecurity, deps.reviewSubmissionSessionGuard]
      },
      postHandler as any
    );
  };
}
