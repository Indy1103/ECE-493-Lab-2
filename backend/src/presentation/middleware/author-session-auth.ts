import type { FastifyReply, FastifyRequest } from "fastify";

export interface AuthorSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface AuthorSessionRepository {
  getSessionById(sessionId: string): Promise<AuthorSessionRecord | null>;
}

export interface AuthorAuthContext {
  authorId: string;
  sessionId: string;
}

export type AuthorSessionRequest = FastifyRequest & {
  authorAuth?: AuthorAuthContext;
};

interface AuthorSessionAuthDeps {
  sessionRepository: AuthorSessionRepository;
}

function parseSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";").map((entry) => entry.trim())) {
    if (!cookie.startsWith("cms_session=")) {
      continue;
    }

    const value = cookie.slice("cms_session=".length).trim();
    return value.length > 0 ? value : null;
  }

  return null;
}

export function createAuthorSessionAuth(deps: AuthorSessionAuthDeps) {
  return async function authorSessionAuth(
    request: AuthorSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for manuscript submission."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);
    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for manuscript submission."
      });
      return;
    }

    if (session.role !== "AUTHOR") {
      reply.code(403).send({
        code: "AUTHORIZATION_FAILED",
        message: "Only authors can submit manuscripts."
      });
      return;
    }

    request.authorAuth = {
      authorId: session.accountId,
      sessionId: session.sessionId
    };
  };
}
