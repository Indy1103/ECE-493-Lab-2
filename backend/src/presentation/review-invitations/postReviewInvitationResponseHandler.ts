import type { FastifyReply } from "fastify";

import type { RespondToReviewInvitationUseCase } from "../../business/review-invitations/RespondToReviewInvitationUseCase.js";
import type { ReviewInvitationRequest } from "../../security/reviewInvitationAuthorization.js";
import { mapRespondToReviewInvitationOutcome } from "./reviewInvitationErrorMapper.js";

interface PostReviewInvitationResponseHandlerDeps {
  useCase: Pick<RespondToReviewInvitationUseCase, "execute">;
}

export function createPostReviewInvitationResponseHandler(
  deps: PostReviewInvitationResponseHandlerDeps
) {
  return async function postReviewInvitationResponseHandler(
    request: ReviewInvitationRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.reviewInvitationAuth) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for review invitation actions."
      });
      return;
    }

    const outcome = await deps.useCase.execute({
      invitationId: String((request.params as Record<string, string>).invitationId ?? ""),
      refereeId: request.reviewInvitationAuth.refereeId,
      requestId: request.id,
      body: request.body
    });

    const mapped = mapRespondToReviewInvitationOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
