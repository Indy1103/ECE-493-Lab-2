import Fastify, { type FastifyInstance } from "fastify";

import { DecisionAuditLogger } from "../../../src/business/final-decision/audit-logger.js";
import { DecisionCompletionGate } from "../../../src/business/final-decision/completion-gate.js";
import { DecisionImmutabilityGuard } from "../../../src/business/final-decision/immutability-guard.js";
import { DecisionAuthorNotifier } from "../../../src/business/final-decision/author-notifier.js";
import { PostFinalDecisionService } from "../../../src/business/final-decision/post-final-decision.service.js";
import {
  PrismaFinalDecisionRepository,
  FinalDecisionAuditRepository
} from "../../../src/data/final-decision/final-decision.repository.js";
import { createFinalDecisionRoutes } from "../../../src/presentation/final-decision/routes.js";
import {
  createFinalDecisionSessionGuard,
  type FinalDecisionSessionRecord,
  type FinalDecisionSessionRepository
} from "../../../src/security/session-guard.js";

interface FinalDecisionTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  forceLockConflict?: boolean;
  forceNextReadFailure?: boolean;
  forceNotificationFailure?: boolean;
  seedFinalizedDecision?: boolean;
}

class InMemoryFinalDecisionSessionRepository implements FinalDecisionSessionRepository {
  private readonly sessions = new Map<string, FinalDecisionSessionRecord>();

  async getSessionById(sessionId: string): Promise<FinalDecisionSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: FinalDecisionSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface FinalDecisionTestAppContext {
  app: FastifyInstance;
  repository: PrismaFinalDecisionRepository;
  auditRepository: FinalDecisionAuditRepository;
  sessionRepository: InMemoryFinalDecisionSessionRepository;
  authorNotifier: DecisionAuthorNotifier;
  editorSessionId: string;
  authorSessionId: string;
  editorUserId: string;
  paperIds: {
    complete: string;
    pending: string;
    inaccessible: string;
    finalized: string;
  };
}

export async function createFinalDecisionTestApp(
  options: FinalDecisionTestAppOptions = {}
): Promise<FinalDecisionTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc12_test" });

  const editorSessionId = "sess_uc12_editor_001";
  const authorSessionId = "sess_uc12_author_001";
  const editorUserId = "b0000000-0000-4000-8000-000000000001";
  const otherEditorId = "b0000000-0000-4000-8000-000000000002";

  const paperIds = {
    complete: "a0000000-0000-4000-8000-000000000001",
    pending: "a0000000-0000-4000-8000-000000000002",
    inaccessible: "a0000000-0000-4000-8000-000000000003",
    finalized: "a0000000-0000-4000-8000-000000000004"
  };

  const sessionRepository = new InMemoryFinalDecisionSessionRepository();

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
    accountId: "b0000000-0000-4000-8000-000000000009",
    role: "AUTHOR",
    status: "ACTIVE"
  });

  const repository = new PrismaFinalDecisionRepository({
    forceLockConflict: options.forceLockConflict ?? false,
    forceNextReadFailure: options.forceNextReadFailure ?? false
  });

  repository.seedPaper({
    paperId: paperIds.complete,
    authorUserId: "c0000000-0000-4000-8000-000000000001",
    assignedEditorIds: [editorUserId],
    requiredReviewCount: 2,
    completedReviewCount: 2
  });

  repository.seedPaper({
    paperId: paperIds.pending,
    authorUserId: "c0000000-0000-4000-8000-000000000002",
    assignedEditorIds: [editorUserId],
    requiredReviewCount: 3,
    completedReviewCount: 1
  });

  repository.seedPaper({
    paperId: paperIds.inaccessible,
    authorUserId: "c0000000-0000-4000-8000-000000000003",
    assignedEditorIds: [otherEditorId],
    requiredReviewCount: 2,
    completedReviewCount: 2
  });

  repository.seedPaper({
    paperId: paperIds.finalized,
    authorUserId: "c0000000-0000-4000-8000-000000000004",
    assignedEditorIds: [editorUserId],
    requiredReviewCount: 2,
    completedReviewCount: 2
  });

  if (options.seedFinalizedDecision !== false) {
    repository.seedFinalDecision({
      paperId: paperIds.finalized,
      decision: "REJECT",
      decidedByEditorId: editorUserId,
      decidedAt: new Date("2026-03-02T14:00:00.000Z")
    });
  }

  const auditRepository = new FinalDecisionAuditRepository();
  const authorNotifier = new DecisionAuthorNotifier({
    forceFailure: options.forceNotificationFailure ?? false
  });

  const service = new PostFinalDecisionService({
    repository,
    completionGate: new DecisionCompletionGate(),
    immutabilityGuard: new DecisionImmutabilityGuard(),
    auditLogger: new DecisionAuditLogger({ repository: auditRepository }),
    authorNotifier
  });

  app.register(
    createFinalDecisionRoutes({
      service,
      finalDecisionSessionGuard: createFinalDecisionSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    auditRepository,
    sessionRepository,
    authorNotifier,
    editorSessionId,
    authorSessionId,
    editorUserId,
    paperIds
  };
}
