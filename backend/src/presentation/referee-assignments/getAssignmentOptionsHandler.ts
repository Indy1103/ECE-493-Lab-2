import type { FastifyReply, FastifyRequest } from "fastify";

import type { GetAssignmentOptionsUseCase } from "../../business/referee-assignments/GetAssignmentOptionsUseCase.js";
import type { EditorAssignmentRequest } from "../../security/editorAssignmentGuard.js";
import { mapGetAssignmentOptionsOutcome } from "./refereeAssignmentErrorMapper.js";

interface GetAssignmentOptionsRequest extends EditorAssignmentRequest {
  params: {
    paperId: string;
  };
}

export function createGetAssignmentOptionsHandler(deps: {
  useCase: Pick<GetAssignmentOptionsUseCase, "execute">;
}) {
  return async function getAssignmentOptionsHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const editorRequest = request as GetAssignmentOptionsRequest;
    reply.header("x-request-id", request.id);

    if (!editorRequest.editorAuth) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for referee assignments."
      });
      return;
    }

    const outcome = await deps.useCase.execute({
      paperId: editorRequest.params.paperId
    });

    const mapped = mapGetAssignmentOptionsOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
