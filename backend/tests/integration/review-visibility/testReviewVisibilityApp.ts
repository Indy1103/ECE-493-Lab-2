import Fastify, { type FastifyInstance } from "fastify";

import { ReviewVisibilityAnonymizer } from "../../../src/business/review-visibility/anonymizer.js";
import { ReviewVisibilityAuditLogger } from "../../../src/business/review-visibility/audit-logger.js";
import { ReviewCompletionGate } from "../../../src/business/review-visibility/completion-gate.js";
import { GetCompletedReviewsService } from "../../../src/business/review-visibility/get-completed-reviews.service.js";
import type { CompletedReviewRecord } from "../../../src/business/review-visibility/ports.js";
import {
  PrismaReviewVisibilityRepository,
  ReviewVisibilityAuditRepository
} from "../../../src/data/review-visibility/review-visibility.repository.js";
import { createReviewVisibilityRoutes } from "../../../src/presentation/review-visibility/routes.js";
import {
  createReviewVisibilitySessionGuard,
  type ReviewVisibilitySessionRecord,
  type ReviewVisibilitySessionRepository
} from "../../../src/security/session-guard.js";

interface ReviewVisibilityTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  forceLockConflict?: boolean;
  forceNextReadFailure?: boolean;
}

class InMemoryReviewVisibilitySessionRepository implements ReviewVisibilitySessionRepository {
  private readonly sessions = new Map<string, ReviewVisibilitySessionRecord>();

  async getSessionById(sessionId: string): Promise<ReviewVisibilitySessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: ReviewVisibilitySessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface ReviewVisibilityTestAppContext {
  app: FastifyInstance;
  repository: PrismaReviewVisibilityRepository;
  auditRepository: ReviewVisibilityAuditRepository;
  sessionRepository: InMemoryReviewVisibilitySessionRepository;
  editorSessionId: string;
  authorSessionId: string;
  editorUserId: string;
  paperIds: {
    complete: string;
    pending: string;
    inaccessible: string;
  };
}

function seedCompletedReviews(
  repository: PrismaReviewVisibilityRepository,
  paperId: string,
  reviewCount: number
): void {
  for (let index = 0; index < reviewCount; index += 1) {
    const review: CompletedReviewRecord = {
      reviewId: `70000000-0000-4000-8000-0000000000${index + 1}`,
      paperId,
      refereeUserId: `90000000-0000-4000-8000-0000000000${index + 1}`,
      summary: `Review summary ${index + 1}`,
      scores: {
        overall: 4,
        originality: index + 1
      },
      recommendation: index % 2 === 0 ? "ACCEPT" : "BORDERLINE",
      submittedAt: new Date("2026-03-02T12:00:00.000Z")
    };

    repository.seedReview(review);
  }
}

export async function createReviewVisibilityTestApp(
  options: ReviewVisibilityTestAppOptions = {}
): Promise<ReviewVisibilityTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc11_test" });

  const editorSessionId = "sess_uc11_editor_001";
  const authorSessionId = "sess_uc11_author_001";
  const editorUserId = "80000000-0000-4000-8000-000000000001";
  const otherEditorId = "80000000-0000-4000-8000-000000000002";

  const paperIds = {
    complete: "60000000-0000-4000-8000-000000000001",
    pending: "60000000-0000-4000-8000-000000000002",
    inaccessible: "60000000-0000-4000-8000-000000000003"
  };

  const sessionRepository = new InMemoryReviewVisibilitySessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId: editorSessionId,
      accountId: editorUserId,
      role: options.sessionRole ?? "EDITOR",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  await sessionRepository.seedSession({
    sessionId: authorSessionId,
    accountId: "80000000-0000-4000-8000-000000000009",
    role: "AUTHOR",
    status: "ACTIVE"
  });

  const repository = new PrismaReviewVisibilityRepository({
    forceLockConflict: options.forceLockConflict ?? false,
    forceNextReadFailure: options.forceNextReadFailure ?? false
  });

  repository.seedPaper({
    paperId: paperIds.complete,
    requiredReviewCount: 2,
    assignedEditorIds: [editorUserId]
  });

  repository.seedPaper({
    paperId: paperIds.pending,
    requiredReviewCount: 3,
    assignedEditorIds: [editorUserId]
  });

  repository.seedPaper({
    paperId: paperIds.inaccessible,
    requiredReviewCount: 1,
    assignedEditorIds: [otherEditorId]
  });

  seedCompletedReviews(repository, paperIds.complete, 2);
  seedCompletedReviews(repository, paperIds.pending, 1);
  seedCompletedReviews(repository, paperIds.inaccessible, 1);

  const auditRepository = new ReviewVisibilityAuditRepository();

  const service = new GetCompletedReviewsService({
    repository,
    completionGate: new ReviewCompletionGate(),
    anonymizer: new ReviewVisibilityAnonymizer(),
    auditLogger: new ReviewVisibilityAuditLogger({ repository: auditRepository })
  });

  app.register(
    createReviewVisibilityRoutes({
      service,
      reviewVisibilitySessionGuard: createReviewVisibilitySessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    auditRepository,
    sessionRepository,
    editorSessionId,
    authorSessionId,
    editorUserId,
    paperIds
  };
}
