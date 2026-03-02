import Fastify, { type FastifyInstance } from "fastify";

import { AuthorDecisionAuditLogger } from "../../../src/business/author-decision/audit-logger.js";
import { AuthorDecisionNotificationStatusReader } from "../../../src/business/author-decision/notification-status.js";
import { AuthorDecisionOwnershipCheck } from "../../../src/business/author-decision/ownership-check.js";
import { GetAuthorDecisionService } from "../../../src/business/author-decision/get-author-decision.service.js";
import {
  PrismaAuthorDecisionRepository,
  AuthorDecisionAuditRepository
} from "../../../src/data/author-decision/author-decision.repository.js";
import { createAuthorDecisionRoutes } from "../../../src/presentation/author-decision/routes.js";
import {
  createAuthorDecisionSessionGuard,
  type AuthorDecisionSessionRecord,
  type AuthorDecisionSessionRepository
} from "../../../src/security/session-guard.js";

interface AuthorDecisionTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
}

class InMemoryAuthorDecisionSessionRepository implements AuthorDecisionSessionRepository {
  private readonly sessions = new Map<string, AuthorDecisionSessionRecord>();

  async getSessionById(sessionId: string): Promise<AuthorDecisionSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: AuthorDecisionSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface AuthorDecisionTestAppContext {
  app: FastifyInstance;
  repository: PrismaAuthorDecisionRepository;
  auditRepository: AuthorDecisionAuditRepository;
  sessionRepository: InMemoryAuthorDecisionSessionRepository;
  authorSessionId: string;
  nonAuthorSessionId: string;
  authorUserId: string;
  paperIds: {
    delivered: string;
    notificationFailed: string;
    inaccessible: string;
    noDecision: string;
  };
}

export async function createAuthorDecisionTestApp(
  options: AuthorDecisionTestAppOptions = {}
): Promise<AuthorDecisionTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc13_test" });

  const authorSessionId = "sess_uc13_author_001";
  const nonAuthorSessionId = "sess_uc13_editor_001";
  const authorUserId = "d0000000-0000-4000-8000-000000000001";

  const paperIds = {
    delivered: "e0000000-0000-4000-8000-000000000001",
    notificationFailed: "e0000000-0000-4000-8000-000000000002",
    inaccessible: "e0000000-0000-4000-8000-000000000003",
    noDecision: "e0000000-0000-4000-8000-000000000004"
  };

  const sessionRepository = new InMemoryAuthorDecisionSessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId: authorSessionId,
      accountId: authorUserId,
      role: options.sessionRole ?? "AUTHOR",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  await sessionRepository.seedSession({
    sessionId: nonAuthorSessionId,
    accountId: "d0000000-0000-4000-8000-000000000101",
    role: "EDITOR",
    status: "ACTIVE"
  });

  const repository = new PrismaAuthorDecisionRepository();

  repository.seedDecisionRecord({
    paperId: paperIds.delivered,
    authorId: authorUserId,
    decision: "ACCEPT",
    notificationStatus: "DELIVERED"
  });

  repository.seedDecisionRecord({
    paperId: paperIds.notificationFailed,
    authorId: authorUserId,
    decision: "REJECT",
    notificationStatus: "FAILED"
  });

  repository.seedDecisionRecord({
    paperId: paperIds.inaccessible,
    authorId: "d0000000-0000-4000-8000-000000000999",
    decision: "ACCEPT",
    notificationStatus: "DELIVERED"
  });

  repository.seedPaperWithoutDecision({
    paperId: paperIds.noDecision,
    authorId: authorUserId
  });

  const auditRepository = new AuthorDecisionAuditRepository();

  const service = new GetAuthorDecisionService({
    repository,
    ownershipCheck: new AuthorDecisionOwnershipCheck(),
    notificationStatusReader: new AuthorDecisionNotificationStatusReader(),
    auditLogger: new AuthorDecisionAuditLogger({ repository: auditRepository })
  });

  app.register(
    createAuthorDecisionRoutes({
      service,
      authorDecisionSessionGuard: createAuthorDecisionSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    auditRepository,
    sessionRepository,
    authorSessionId,
    nonAuthorSessionId,
    authorUserId,
    paperIds
  };
}
