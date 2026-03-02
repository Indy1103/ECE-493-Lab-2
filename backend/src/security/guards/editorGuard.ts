import type { FastifyReply, FastifyRequest } from "fastify";

import { SCHEDULE_ERROR_CODES } from "../../shared/errors/scheduleErrors.js";
import type { ConferenceScheduleSessionRequest } from "../session-guard.js";

export interface EditorGuardSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface EditorGuardSessionRepository {
  getSessionById(sessionId: string): Promise<EditorGuardSessionRecord | null>;
}

export function ensureEditorRole(role: string | undefined, reply: FastifyReply): boolean {
  if (role === "EDITOR") {
    return true;
  }

  reply.code(403).send({
    code: SCHEDULE_ERROR_CODES.AUTHORIZATION_FAILED,
    message: "Only editors can edit conference schedules."
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

export function createEditorScheduleSessionGuard(deps: {
  sessionRepository: EditorGuardSessionRepository;
}) {
  return async function editorScheduleSessionGuard(
    request: FastifyRequest & ConferenceScheduleSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        code: SCHEDULE_ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);

    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        code: SCHEDULE_ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    request.conferenceScheduleSession = {
      userId: session.accountId,
      sessionId: session.sessionId,
      role: session.role
    };
  };
}
