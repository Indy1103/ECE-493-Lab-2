import type { FastifyReply, FastifyRequest } from "fastify";

import type { AssignRefereesUseCase } from "../../business/referee-assignments/AssignRefereesUseCase.js";
import type { EditorAssignmentRequest } from "../../security/editorAssignmentGuard.js";
import { mapAssignRefereesOutcome } from "./refereeAssignmentErrorMapper.js";

interface PostRefereeAssignmentsRequest extends EditorAssignmentRequest {
  params: {
    paperId: string;
  };
}

export function createPostRefereeAssignmentsHandler(deps: {
  useCase: Pick<AssignRefereesUseCase, "execute">;
}) {
  return async function postRefereeAssignmentsHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const editorRequest = request as PostRefereeAssignmentsRequest;
    reply.header("x-request-id", request.id);

    if (!editorRequest.editorAuth) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for referee assignments."
      });
      return;
    }

    const outcome = await deps.useCase.execute({
      paperId: editorRequest.params.paperId,
      editorId: editorRequest.editorAuth.editorId,
      requestId: request.id,
      body: (request.body as unknown) ?? {}
    });

    const mapped = mapAssignRefereesOutcome(outcome);
    reply.code(mapped.statusCode).send(mapped.body);
  };
}
