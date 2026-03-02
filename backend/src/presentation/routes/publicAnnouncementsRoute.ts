import type { FastifyPluginAsync } from "fastify";

import { ErrorResponseSchema, PublicAnnouncementsResponseSchema } from "../../shared/contracts/publicAnnouncementsSchemas.js";
import type { AnnouncementMetrics } from "../../shared/observability/announcementMetrics.js";
import type { PublicAnnouncementService } from "../../business/services/publicAnnouncementService.js";

export interface PublicAnnouncementsRouteDeps {
  service: Pick<PublicAnnouncementService, "getPublicAnnouncements">;
  metrics: AnnouncementMetrics;
  logger: {
    error(entry: Record<string, unknown>): void;
  };
  nowProvider: () => Date;
}

export function createPublicAnnouncementsRoute(
  deps: PublicAnnouncementsRouteDeps
): FastifyPluginAsync {
  return async function publicAnnouncementsRoute(fastify): Promise<void> {
    fastify.get("/api/public/announcements", async (request, reply) => {
      try {
        const response = await deps.service.getPublicAnnouncements(deps.nowProvider());
        const validated = PublicAnnouncementsResponseSchema.parse(response);
        reply.header("x-request-id", request.id);
        return validated;
      } catch (error) {
        deps.metrics.incrementRetrievalFailure("retrieval_failure");
        deps.logger.error({
          requestId: request.id,
          failureCategory: "RETRIEVAL_FAILURE",
          errorMessage: error instanceof Error ? error.message : "unknown error"
        });

        const payload = ErrorResponseSchema.parse({
          code: "ANNOUNCEMENTS_UNAVAILABLE",
          message:
            "Conference announcements are temporarily unavailable. Please try again.",
          requestId: request.id
        });

        reply.code(503);
        reply.header("x-request-id", request.id);
        return payload;
      }
    });
  };
}
