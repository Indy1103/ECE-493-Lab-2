import type { FastifyReply } from "fastify";

import type { GetReviewInvitationUseCase } from "../../business/review-invitations/GetReviewInvitationUseCase.js";
import type { ReviewInvitationRequest } from "../../security/reviewInvitationAuthorization.js";
import { mapGetReviewInvitationOutcome } from "./reviewInvitationErrorMapper.js";

interface GetReviewInvitationHandlerDeps {
  useCase: Pick<GetReviewInvitationUseCase, "execute">;
}

export function createGetReviewInvitationHandler(deps: GetReviewInvitationHandlerDeps) {
  return async function getReviewInvitationHandler(
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
      refereeId: request.reviewInvitationAuth.refereeId
    });

    const mapped = mapGetReviewInvitationOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
