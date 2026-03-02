import { randomUUID } from "node:crypto";

import Fastify from "fastify";

import { createPublicAnnouncementsRoute } from "../routes/publicAnnouncementsRoute.js";
import type { AnnouncementMetrics } from "../../shared/observability/announcementMetrics.js";
import type { PublicAnnouncementService } from "../../business/services/publicAnnouncementService.js";

interface BuildServerOptions {
  service: Pick<PublicAnnouncementService, "getPublicAnnouncements">;
  metrics?: AnnouncementMetrics;
  logger?: {
    error(entry: Record<string, unknown>): void;
  };
  nowProvider?: () => Date;
  requireTls?: boolean;
}

const defaultMetrics: AnnouncementMetrics = {
  incrementRetrievalFailure: () => {
    // no-op default for tests or local bootstrapping
  }
};

const defaultLogger = {
  error: () => {
    // no-op default for tests or local bootstrapping
  }
};

export function buildServer(options: BuildServerOptions) {
  const requireTls = options.requireTls ?? true;
  const app = Fastify({
    logger: false,
    genReqId: () => `req_${randomUUID().replace(/-/g, "").slice(0, 12)}`
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);

    const forwardedProto = request.headers["x-forwarded-proto"];

    if (requireTls && forwardedProto !== "https") {
      reply.code(426);
      return reply.send({
        code: "TLS_REQUIRED",
        message: "HTTPS is required for public announcements.",
        requestId: request.id
      });
    }
  });

  app.register(
    createPublicAnnouncementsRoute({
      service: options.service,
      metrics: options.metrics ?? defaultMetrics,
      logger: options.logger ?? defaultLogger,
      nowProvider: options.nowProvider ?? (() => new Date())
    })
  );

  return app;
}
