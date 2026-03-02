import type { FastifyPluginAsync } from "fastify";

import type { SaveSubmissionDraftUseCase } from "../../business/submission-drafts/SaveSubmissionDraftUseCase.js";
import type { GetSubmissionDraftUseCase } from "../../business/submission-drafts/GetSubmissionDraftUseCase.js";
import type { AuthorSessionRequest } from "../middleware/author-session-auth.js";
import { createSaveSubmissionDraftHandler } from "./saveSubmissionDraftHandler.js";
import { createGetSubmissionDraftHandler } from "./getSubmissionDraftHandler.js";
import { requireSubmissionDraftTransportSecurity } from "./submissionDraftRouteSecurity.js";

interface SubmissionDraftRoutesDeps {
  saveUseCase: Pick<SaveSubmissionDraftUseCase, "execute">;
  getUseCase: Pick<GetSubmissionDraftUseCase, "execute">;
  authorSessionAuth: (request: AuthorSessionRequest, reply: any) => Promise<void>;
}

export function createSubmissionDraftRoutes(deps: SubmissionDraftRoutesDeps): FastifyPluginAsync {
  const saveHandler = createSaveSubmissionDraftHandler({ useCase: deps.saveUseCase });
  const getHandler = createGetSubmissionDraftHandler({ useCase: deps.getUseCase });

  return async function submissionDraftRoutes(fastify): Promise<void> {
    fastify.put(
      "/api/v1/submission-drafts/:submissionId",
      {
        preHandler: [requireSubmissionDraftTransportSecurity, deps.authorSessionAuth]
      },
      saveHandler
    );

    fastify.get(
      "/api/v1/submission-drafts/:submissionId",
      {
        preHandler: [requireSubmissionDraftTransportSecurity, deps.authorSessionAuth]
      },
      getHandler
    );
  };
}
