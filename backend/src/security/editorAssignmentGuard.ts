import type { FastifyReply, FastifyRequest } from "fastify";

export interface EditorSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface EditorSessionRepository {
  getSessionById(sessionId: string): Promise<EditorSessionRecord | null>;
}

export interface EditorAuthContext {
  editorId: string;
  sessionId: string;
}

export type EditorAssignmentRequest = FastifyRequest & {
  editorAuth?: EditorAuthContext;
};

interface EditorAssignmentGuardDeps {
  sessionRepository: EditorSessionRepository;
}

function parseSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";").map((value) => value.trim())) {
    if (!cookie.startsWith("cms_session=")) {
      continue;
    }

    const sessionId = cookie.slice("cms_session=".length).trim();
    return sessionId.length > 0 ? sessionId : null;
  }

  return null;
}

export function createEditorAssignmentGuard(deps: EditorAssignmentGuardDeps) {
  return async function editorAssignmentGuard(
    request: EditorAssignmentRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);
    if (!sessionId) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for referee assignments."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);
    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for referee assignments."
      });
      return;
    }

    if (session.role !== "EDITOR") {
      reply.code(403).send({
        code: "AUTHORIZATION_FAILED",
        message: "Only editors can assign referees."
      });
      return;
    }

    request.editorAuth = {
      editorId: session.accountId,
      sessionId: session.sessionId
    };
  };
}
