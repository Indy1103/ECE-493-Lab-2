import Fastify, { type FastifyInstance } from "fastify";

import { GetReviewInvitationUseCase } from "../../../src/business/review-invitations/GetReviewInvitationUseCase.js";
import { RespondToReviewInvitationUseCase } from "../../../src/business/review-invitations/RespondToReviewInvitationUseCase.js";
import { PrismaReviewInvitationRepository } from "../../../src/data/review-invitations/PrismaReviewInvitationRepository.js";
import { createReviewInvitationRoutes } from "../../../src/presentation/review-invitations/reviewInvitationRoutes.js";
import {
  createReviewInvitationAuthorization,
  type ReviewInvitationSessionRecord,
  type ReviewInvitationSessionRepository
} from "../../../src/security/reviewInvitationAuthorization.js";
import { ReviewInvitationAuditService } from "../../../src/shared/audit/reviewInvitationAudit.js";

interface ReviewInvitationTestAppOptions {
  includeSession?: boolean;
  sessionRole?: string;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  seedInvitation?: boolean;
  invitationStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  invitationOwnerId?: string;
  forceLockConflict?: boolean;
  forceNextRecordingFailure?: boolean;
  forceNextReadFailure?: boolean;
}

class InMemoryReviewInvitationSessionRepository implements ReviewInvitationSessionRepository {
  private readonly sessions = new Map<string, ReviewInvitationSessionRecord>();

  async getSessionById(sessionId: string): Promise<ReviewInvitationSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: ReviewInvitationSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface ReviewInvitationTestAppContext {
  app: FastifyInstance;
  repository: PrismaReviewInvitationRepository;
  sessionRepository: InMemoryReviewInvitationSessionRepository;
  auditEvents: Array<Record<string, unknown>>;
  invitationId: string;
  paperId: string;
  invitedRefereeId: string;
  otherRefereeId: string;
  sessionId: string;
  otherSessionId: string;
}

export async function createReviewInvitationTestApp(
  options: ReviewInvitationTestAppOptions = {}
): Promise<ReviewInvitationTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_review_inv_test" });

  const sessionId = "sess_uc08_ref_001";
  const otherSessionId = "sess_uc08_ref_002";
  const invitedRefereeId = "70000000-0000-4000-8000-000000000801";
  const otherRefereeId = "70000000-0000-4000-8000-000000000802";
  const invitationId = "80000000-0000-4000-8000-000000000801";
  const paperId = "90000000-0000-4000-8000-000000000801";

  const sessionRepository = new InMemoryReviewInvitationSessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId,
      accountId: invitedRefereeId,
      role: options.sessionRole ?? "REFEREE",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  await sessionRepository.seedSession({
    sessionId: otherSessionId,
    accountId: otherRefereeId,
    role: "REFEREE",
    status: "ACTIVE"
  });

  const repository = new PrismaReviewInvitationRepository({
    forceLockConflict: options.forceLockConflict ?? false,
    forceNextRecordingFailure: options.forceNextRecordingFailure ?? false,
    forceNextReadFailure: options.forceNextReadFailure ?? false
  });

  if (options.seedInvitation !== false) {
    repository.seedInvitation({
      invitationId,
      paperId,
      refereeId: options.invitationOwnerId ?? invitedRefereeId,
      paperTitle: "On the Limits of Peer Review Systems",
      paperSummary: "A concise summary suitable for invitation decisions.",
      reviewDueAt: new Date("2026-04-15T12:00:00.000Z"),
      responseDeadlineAt: new Date("2026-03-20T12:00:00.000Z"),
      invitationStatus: options.invitationStatus ?? "PENDING",
      resolvedAt: null,
      version: 1
    });
  }

  const auditEvents: Array<Record<string, unknown>> = [];
  const auditService = new ReviewInvitationAuditService({
    repository,
    emit: (event) => {
      auditEvents.push(event);
    }
  });

  const getReviewInvitationUseCase = new GetReviewInvitationUseCase({ repository });
  const respondToReviewInvitationUseCase = new RespondToReviewInvitationUseCase({
    repository,
    auditService
  });

  app.register(
    createReviewInvitationRoutes({
      getReviewInvitationUseCase,
      respondToReviewInvitationUseCase,
      reviewInvitationAuthorization: createReviewInvitationAuthorization({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    sessionRepository,
    auditEvents,
    invitationId,
    paperId,
    invitedRefereeId,
    otherRefereeId,
    sessionId,
    otherSessionId
  };
}
