import type { FastifyPluginAsync } from "fastify";

import type { GetAuthorDecisionService } from "../../business/author-decision/get-author-decision.service.js";
import type { AuthorDecisionSessionRequest } from "../../security/session-guard.js";
import { createGetAuthorDecisionHandler } from "./get-author-decision.handler.js";

export async function requireAuthorDecisionTransportSecurity(request: any, reply: any): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    outcome: "TLS_REQUIRED",
    message: "HTTPS is required for author decision actions."
  });
}

interface AuthorDecisionRoutesDeps {
  service: Pick<GetAuthorDecisionService, "execute">;
  authorDecisionSessionGuard: (request: AuthorDecisionSessionRequest, reply: any) => Promise<void>;
}

export function createAuthorDecisionRoutes(deps: AuthorDecisionRoutesDeps): FastifyPluginAsync {
  const getHandler = createGetAuthorDecisionHandler({ service: deps.service });

  return async function authorDecisionRoutes(fastify): Promise<void> {
    fastify.get<{ Params: { paperId: string } }>(
      "/api/author/papers/:paperId/decision",
      {
        preHandler: [requireAuthorDecisionTransportSecurity, deps.authorDecisionSessionGuard]
      },
      getHandler as any
    );
  };
}
