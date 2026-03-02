import type { FastifyReply, FastifyRequest } from "fastify";

import { REFEREE_ACCESS_OUTCOMES } from "../shared/accessOutcomes.js";

export interface RefereeSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface RefereeSessionRepository {
  getSessionById(sessionId: string): Promise<RefereeSessionRecord | null>;
}

export interface RefereeSessionContext {
  refereeUserId: string;
  sessionId: string;
}

export type RefereeSessionRequest = FastifyRequest & {
  refereeSession?: RefereeSessionContext;
};

interface SessionGuardDeps {
  sessionRepository: RefereeSessionRepository;
}

function parseSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";").map((entry) => entry.trim())) {
    if (!cookie.startsWith("session=") && !cookie.startsWith("cms_session=")) {
      continue;
    }

    const [name, value = ""] = cookie.split("=", 2);
    if ((name === "session" || name === "cms_session") && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function createRefereeSessionGuard(deps: SessionGuardDeps) {
  return async function refereeSessionGuard(
    request: RefereeSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);
    if (!sessionId) {
      reply.code(401).send({
        messageCode: REFEREE_ACCESS_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);
    if (!session || session.status !== "ACTIVE" || session.role !== "REFEREE") {
      reply.code(401).send({
        messageCode: REFEREE_ACCESS_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    request.refereeSession = {
      refereeUserId: session.accountId,
      sessionId: session.sessionId
    };
  };
}
