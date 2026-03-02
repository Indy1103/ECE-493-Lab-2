import type { FastifyReply, FastifyRequest } from "fastify";

import { SCHEDULE_ACCESS_ERROR_CODES } from "../../shared/errors/scheduleAccessErrors.js";

export interface AuthorGuardSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface AuthorGuardSessionRepository {
  getSessionById(sessionId: string): Promise<AuthorGuardSessionRecord | null>;
}

export interface AuthorScheduleSessionContext {
  userId: string;
  sessionId: string;
  role: string;
}

export type AuthorScheduleSessionRequest = FastifyRequest & {
  authorScheduleSession?: AuthorScheduleSessionContext;
};

export function ensureAuthorRole(role: string | undefined, reply: FastifyReply): boolean {
  if (role === "AUTHOR") {
    return true;
  }

  reply.code(403).send({
    code: SCHEDULE_ACCESS_ERROR_CODES.AUTHORIZATION_FAILED,
    message: "Only authors can view the final conference schedule."
  });

  return false;
}

function parseSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";").map((value) => value.trim())) {
    if (!cookie.startsWith("session=") && !cookie.startsWith("cms_session=")) {
      continue;
    }

    const [, sessionId = ""] = cookie.split("=", 2);
    if (sessionId.trim().length > 0) {
      return sessionId.trim();
    }
  }

  return null;
}

export function createAuthorScheduleSessionGuard(deps: {
  sessionRepository: AuthorGuardSessionRepository;
}) {
  return async function authorScheduleSessionGuard(
    request: AuthorScheduleSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        code: SCHEDULE_ACCESS_ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);

    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        code: SCHEDULE_ACCESS_ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    request.authorScheduleSession = {
      userId: session.accountId,
      sessionId: session.sessionId,
      role: session.role
    };
  };
}
