import type { FastifyReply, FastifyRequest } from "fastify";

import type { GetSubmissionDraftUseCase } from "../../business/submission-drafts/GetSubmissionDraftUseCase.js";
import type { AuthorSessionRequest } from "../middleware/author-session-auth.js";
import { mapGetDraftOutcomeToHttp } from "./submissionDraftErrorMapper.js";

interface GetSubmissionDraftRequest extends AuthorSessionRequest {
  params: {
    submissionId: string;
  };
}

export function createGetSubmissionDraftHandler(deps: {
  useCase: Pick<GetSubmissionDraftUseCase, "execute">;
}) {
  return async function getSubmissionDraftHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const authorRequest = request as GetSubmissionDraftRequest;
    reply.header("x-request-id", request.id);

    if (!authorRequest.authorAuth) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required to access submission drafts."
      });
      return;
    }

    const outcome = await deps.useCase.execute({
      authorId: authorRequest.authorAuth.authorId,
      submissionId: authorRequest.params.submissionId
    });

    const mapped = mapGetDraftOutcomeToHttp(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
