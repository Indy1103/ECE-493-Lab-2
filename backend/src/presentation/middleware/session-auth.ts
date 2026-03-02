import type { FastifyReply, FastifyRequest } from "fastify";

import type { SessionRepository } from "../../data/security/session.repository.js";

export interface AuthenticatedSessionContext {
  accountId: string;
  sessionId: string;
}

export type SessionAuthenticatedRequest = FastifyRequest & {
  auth?: AuthenticatedSessionContext;
};

interface SessionAuthMiddlewareDeps {
  sessionRepository: SessionRepository;
}

function parseSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  for (const cookie of cookies) {
    if (!cookie.startsWith("cms_session=")) {
      continue;
    }
    const value = cookie.slice("cms_session=".length).trim();
    return value.length === 0 ? null : value;
  }

  return null;
}

export function createSessionAuthMiddleware(deps: SessionAuthMiddlewareDeps) {
  return async function sessionAuthMiddleware(
    request: SessionAuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);
    if (!sessionId) {
      reply.code(401).send({
        code: "SESSION_INVALID",
        message: "Session is invalid or expired."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);
    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        code: "SESSION_INVALID",
        message: "Session is invalid or expired."
      });
      return;
    }

    request.auth = {
      accountId: session.accountId,
      sessionId: session.sessionId
    };
  };
}
