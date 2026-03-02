import type { FastifyPluginAsync } from "fastify";

import type { AccessAssignedPaperService } from "../../business/referee-access/accessAssignedPaperService.js";
import type { ListAssignmentsService } from "../../business/referee-access/listAssignmentsService.js";
import type { RefereeSessionRequest } from "../../security/sessionGuard.js";
import { requireRefereeAccessTls } from "../../security/transportPolicy.js";
import { createGetAssignmentsRoute } from "./getAssignmentsRoute.js";
import { createPostAssignmentAccessRoute } from "./postAssignmentAccessRoute.js";

interface RefereeAccessRoutesDeps {
  listAssignmentsService: Pick<ListAssignmentsService, "execute">;
  accessAssignedPaperService: Pick<AccessAssignedPaperService, "execute">;
  refereeSessionGuard: (request: RefereeSessionRequest, reply: any) => Promise<void>;
}

export function createRefereeAccessRoutes(deps: RefereeAccessRoutesDeps): FastifyPluginAsync {
  const getRoute = createGetAssignmentsRoute({
    listAssignmentsService: deps.listAssignmentsService
  });
  const postRoute = createPostAssignmentAccessRoute({
    accessAssignedPaperService: deps.accessAssignedPaperService
  });

  return async function refereeAccessRoutes(fastify): Promise<void> {
    fastify.get(
      "/api/referee/assignments",
      {
        preHandler: [requireRefereeAccessTls, deps.refereeSessionGuard]
      },
      getRoute
    );

    fastify.post<{ Params: { assignmentId: string } }>(
      "/api/referee/assignments/:assignmentId/access",
      {
        preHandler: [requireRefereeAccessTls, deps.refereeSessionGuard]
      },
      postRoute as any
    );
  };
}
