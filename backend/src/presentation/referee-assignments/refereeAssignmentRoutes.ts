import type { FastifyPluginAsync } from "fastify";

import type { GetAssignmentOptionsUseCase } from "../../business/referee-assignments/GetAssignmentOptionsUseCase.js";
import type { AssignRefereesUseCase } from "../../business/referee-assignments/AssignRefereesUseCase.js";
import type { EditorAssignmentRequest } from "../../security/editorAssignmentGuard.js";
import { createGetAssignmentOptionsHandler } from "./getAssignmentOptionsHandler.js";
import { createPostRefereeAssignmentsHandler } from "./postRefereeAssignmentsHandler.js";
import { requireRefereeAssignmentTransportSecurity } from "./refereeAssignmentRouteSecurity.js";

interface RefereeAssignmentRoutesDeps {
  getOptionsUseCase: Pick<GetAssignmentOptionsUseCase, "execute">;
  assignRefereesUseCase: Pick<AssignRefereesUseCase, "execute">;
  editorAssignmentGuard: (request: EditorAssignmentRequest, reply: any) => Promise<void>;
}

export function createRefereeAssignmentRoutes(
  deps: RefereeAssignmentRoutesDeps
): FastifyPluginAsync {
  const getHandler = createGetAssignmentOptionsHandler({ useCase: deps.getOptionsUseCase });
  const postHandler = createPostRefereeAssignmentsHandler({ useCase: deps.assignRefereesUseCase });

  return async function refereeAssignmentRoutes(fastify): Promise<void> {
    fastify.get(
      "/api/v1/papers/:paperId/referee-assignment-options",
      {
        preHandler: [requireRefereeAssignmentTransportSecurity, deps.editorAssignmentGuard]
      },
      getHandler
    );

    fastify.post(
      "/api/v1/papers/:paperId/referee-assignments",
      {
        preHandler: [requireRefereeAssignmentTransportSecurity, deps.editorAssignmentGuard]
      },
      postHandler
    );
  };
}
