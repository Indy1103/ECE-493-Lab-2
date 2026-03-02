import type { FastifyReply, FastifyRequest } from "fastify";

import type { SaveSubmissionDraftUseCase } from "../../business/submission-drafts/SaveSubmissionDraftUseCase.js";
import type { AuthorSessionRequest } from "../middleware/author-session-auth.js";
import { mapSaveDraftOutcomeToHttp } from "./submissionDraftErrorMapper.js";

interface SaveSubmissionDraftRequest extends AuthorSessionRequest {
  params: {
    submissionId: string;
  };
}

export function createSaveSubmissionDraftHandler(deps: {
  useCase: Pick<SaveSubmissionDraftUseCase, "execute">;
}) {
  return async function saveSubmissionDraftHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const authorRequest = request as SaveSubmissionDraftRequest;
    reply.header("x-request-id", request.id);

    if (!authorRequest.authorAuth) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required to save submission drafts."
      });
      return;
    }

    const outcome = await deps.useCase.execute({
      authorId: authorRequest.authorAuth.authorId,
      submissionId: authorRequest.params.submissionId,
      requestId: request.id,
      body: (request.body as unknown) ?? {}
    });

    const mapped = mapSaveDraftOutcomeToHttp(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
