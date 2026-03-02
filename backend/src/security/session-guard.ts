import type { FastifyReply, FastifyRequest } from "fastify";

import { REVIEW_SUBMISSION_OUTCOMES } from "../business/review-submission/submission-outcome.js";
import { REVIEW_VISIBILITY_OUTCOMES } from "../business/review-visibility/visibility-outcome.js";
import { FINAL_DECISION_OUTCOMES } from "../business/final-decision/decision-outcome.js";

export interface ReviewSubmissionSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface ReviewSubmissionSessionRepository {
  getSessionById(sessionId: string): Promise<ReviewSubmissionSessionRecord | null>;
}

export interface ReviewSubmissionSessionContext {
  refereeUserId: string;
  sessionId: string;
}

export type ReviewSubmissionSessionRequest = FastifyRequest & {
  reviewSubmissionSession?: ReviewSubmissionSessionContext;
};

interface ReviewSubmissionSessionGuardDeps {
  sessionRepository: ReviewSubmissionSessionRepository;
}

export interface ReviewVisibilitySessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface ReviewVisibilitySessionRepository {
  getSessionById(sessionId: string): Promise<ReviewVisibilitySessionRecord | null>;
}

export interface ReviewVisibilitySessionContext {
  userId: string;
  sessionId: string;
  role: string;
}

export type ReviewVisibilitySessionRequest = FastifyRequest & {
  reviewVisibilitySession?: ReviewVisibilitySessionContext;
};

interface ReviewVisibilitySessionGuardDeps {
  sessionRepository: ReviewVisibilitySessionRepository;
}

export interface FinalDecisionSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface FinalDecisionSessionRepository {
  getSessionById(sessionId: string): Promise<FinalDecisionSessionRecord | null>;
}

export interface FinalDecisionSessionContext {
  userId: string;
  sessionId: string;
  role: string;
}

export type FinalDecisionSessionRequest = FastifyRequest & {
  finalDecisionSession?: FinalDecisionSessionContext;
};

interface FinalDecisionSessionGuardDeps {
  sessionRepository: FinalDecisionSessionRepository;
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

export function createReviewSubmissionSessionGuard(deps: ReviewSubmissionSessionGuardDeps) {
  return async function reviewSubmissionSessionGuard(
    request: ReviewSubmissionSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        messageCode: REVIEW_SUBMISSION_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);

    if (!session || session.status !== "ACTIVE" || session.role !== "REFEREE") {
      reply.code(401).send({
        messageCode: REVIEW_SUBMISSION_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    request.reviewSubmissionSession = {
      refereeUserId: session.accountId,
      sessionId: session.sessionId
    };
  };
}

export function createReviewVisibilitySessionGuard(deps: ReviewVisibilitySessionGuardDeps) {
  return async function reviewVisibilitySessionGuard(
    request: ReviewVisibilitySessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        messageCode: REVIEW_VISIBILITY_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);

    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        messageCode: REVIEW_VISIBILITY_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    request.reviewVisibilitySession = {
      userId: session.accountId,
      sessionId: session.sessionId,
      role: session.role
    };
  };
}

export function createFinalDecisionSessionGuard(deps: FinalDecisionSessionGuardDeps) {
  return async function finalDecisionSessionGuard(
    request: FinalDecisionSessionRequest,
    reply: FastifyReply
  ): Promise<void> {
    const sessionId = parseSessionId(request.headers.cookie);

    if (!sessionId) {
      reply.code(401).send({
        outcome: FINAL_DECISION_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    const session = await deps.sessionRepository.getSessionById(sessionId);

    if (!session || session.status !== "ACTIVE") {
      reply.code(401).send({
        outcome: FINAL_DECISION_OUTCOMES.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again."
      });
      return;
    }

    request.finalDecisionSession = {
      userId: session.accountId,
      sessionId: session.sessionId,
      role: session.role
    };
  };
}
