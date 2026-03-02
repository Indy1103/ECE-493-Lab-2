import type { FastifyPluginAsync } from "fastify";

import type { PostFinalDecisionService } from "../../business/final-decision/post-final-decision.service.js";
import type { FinalDecisionSessionRequest } from "../../security/session-guard.js";
import { createPostFinalDecisionHandler } from "./post-final-decision.handler.js";

export async function requireFinalDecisionTransportSecurity(request: any, reply: any): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    outcome: "TLS_REQUIRED",
    message: "HTTPS is required for final decision actions."
  });
}

interface FinalDecisionRoutesDeps {
  service: Pick<PostFinalDecisionService, "execute">;
  finalDecisionSessionGuard: (request: FinalDecisionSessionRequest, reply: any) => Promise<void>;
}

export function createFinalDecisionRoutes(deps: FinalDecisionRoutesDeps): FastifyPluginAsync {
  const postHandler = createPostFinalDecisionHandler({ service: deps.service });

  return async function finalDecisionRoutes(fastify): Promise<void> {
    fastify.post<{ Params: { paperId: string } }>(
      "/api/editor/papers/:paperId/decision",
      {
        preHandler: [requireFinalDecisionTransportSecurity, deps.finalDecisionSessionGuard]
      },
      postHandler as any
    );
  };
}
