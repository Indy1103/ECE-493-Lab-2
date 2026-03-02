import type { FastifyReply, FastifyRequest } from "fastify";

export interface ReviewInvitationSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface ReviewInvitationSessionRepository {
  getSessionById(sessionId: string): Promise<ReviewInvitationSessionRecord | null>;
}

export interface ReviewInvitationAuthContext {
  refereeId: string;
  sessionId: string;
}

export type ReviewInvitationRequest = FastifyRequest & {
  reviewInvitationAuth?: ReviewInvitationAuthContext;
};

interface ReviewInvitationAuthorizationDeps {
  sessionRepository: ReviewInvitationSessionRepository;
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

export function createReviewInvitationAuthorization(deps: ReviewInvitationAuthorizationDeps) {
  return async function reviewInvitationAuthorization(
    request: ReviewInvitationRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for review invitation actions."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);

    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required for review invitation actions."
      });
      return;
    }

    if (session.role !== "REFEREE") {
      reply.code(403).send({
        code: "AUTHORIZATION_FAILED",
        message: "Only invited referees can respond to review invitations."
      });
      return;
    }

    request.reviewInvitationAuth = {
      refereeId: session.accountId,
      sessionId: session.sessionId
    };
  };
}
