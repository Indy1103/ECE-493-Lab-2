import type { FastifyPluginAsync } from "fastify";

import type { GetReviewInvitationUseCase } from "../../business/review-invitations/GetReviewInvitationUseCase.js";
import type { RespondToReviewInvitationUseCase } from "../../business/review-invitations/RespondToReviewInvitationUseCase.js";
import type { ReviewInvitationRequest } from "../../security/reviewInvitationAuthorization.js";
import { createGetReviewInvitationHandler } from "./getReviewInvitationHandler.js";
import { createPostReviewInvitationResponseHandler } from "./postReviewInvitationResponseHandler.js";
import { requireReviewInvitationTransportSecurity } from "./reviewInvitationRouteSecurity.js";

interface ReviewInvitationRoutesDeps {
  getReviewInvitationUseCase: Pick<GetReviewInvitationUseCase, "execute">;
  respondToReviewInvitationUseCase: Pick<RespondToReviewInvitationUseCase, "execute">;
  reviewInvitationAuthorization: (request: ReviewInvitationRequest, reply: any) => Promise<void>;
}

export function createReviewInvitationRoutes(deps: ReviewInvitationRoutesDeps): FastifyPluginAsync {
  const getHandler = createGetReviewInvitationHandler({ useCase: deps.getReviewInvitationUseCase });
  const postHandler = createPostReviewInvitationResponseHandler({
    useCase: deps.respondToReviewInvitationUseCase
  });

  return async function reviewInvitationRoutes(fastify): Promise<void> {
    fastify.get(
      "/api/v1/review-invitations/:invitationId",
      {
        preHandler: [requireReviewInvitationTransportSecurity, deps.reviewInvitationAuthorization]
      },
      getHandler
    );

    fastify.post(
      "/api/v1/review-invitations/:invitationId/response",
      {
        preHandler: [requireReviewInvitationTransportSecurity, deps.reviewInvitationAuthorization]
      },
      postHandler
    );
  };
}
