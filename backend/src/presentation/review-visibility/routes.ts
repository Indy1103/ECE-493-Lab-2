import type { FastifyPluginAsync } from "fastify";

import type { GetCompletedReviewsService } from "../../business/review-visibility/get-completed-reviews.service.js";
import type { ReviewVisibilitySessionRequest } from "../../security/session-guard.js";
import { createGetCompletedReviewsHandler } from "./get-completed-reviews.handler.js";

export async function requireReviewVisibilityTransportSecurity(request: any, reply: any): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    messageCode: "TLS_REQUIRED",
    message: "HTTPS is required for review visibility actions."
  });
}

interface ReviewVisibilityRoutesDeps {
  service: Pick<GetCompletedReviewsService, "execute">;
  reviewVisibilitySessionGuard: (request: ReviewVisibilitySessionRequest, reply: any) => Promise<void>;
}

export function createReviewVisibilityRoutes(deps: ReviewVisibilityRoutesDeps): FastifyPluginAsync {
  const getHandler = createGetCompletedReviewsHandler({ service: deps.service });

  return async function reviewVisibilityRoutes(fastify): Promise<void> {
    fastify.get<{ Params: { paperId: string } }>(
      "/api/editor/papers/:paperId/reviews",
      {
        preHandler: [requireReviewVisibilityTransportSecurity, deps.reviewVisibilitySessionGuard]
      },
      getHandler as any
    );
  };
}
