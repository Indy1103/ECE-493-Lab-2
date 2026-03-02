import Fastify, { type FastifyInstance } from "fastify";

import { GetSubmissionDraftUseCase } from "../../../src/business/submission-drafts/GetSubmissionDraftUseCase.js";
import { SaveSubmissionDraftUseCase } from "../../../src/business/submission-drafts/SaveSubmissionDraftUseCase.js";
import { PrismaSubmissionDraftRepository } from "../../../src/data/submission-drafts/PrismaSubmissionDraftRepository.js";
import { createSubmissionDraftRoutes } from "../../../src/presentation/submission-drafts/submissionDraftRoutes.js";
import {
  type AuthorSessionRecord,
  type AuthorSessionRepository,
  createAuthorSessionAuth
} from "../../../src/presentation/middleware/author-session-auth.js";
import { SubmissionDraftOwnershipGuard } from "../../../src/security/submissionDraftOwnership.js";
import { SubmissionDraftAuditService } from "../../../src/shared/audit/submissionDraftAudit.js";

interface SubmissionDraftTestAppOptions {
  sessionRole?: string;
  forceSaveFailure?: boolean;
  forceConcurrentResolutionFailure?: boolean;
}

class InMemoryAuthorSessionRepository implements AuthorSessionRepository {
  private readonly sessions = new Map<string, AuthorSessionRecord>();

  async getSessionById(sessionId: string): Promise<AuthorSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(session: AuthorSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, { ...session });
  }

  async expireSession(sessionId: string): Promise<void> {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      return;
    }

    this.sessions.set(sessionId, {
      ...existing,
      status: "EXPIRED"
    });
  }
}

export interface SubmissionDraftTestAppContext {
  app: FastifyInstance;
  repository: PrismaSubmissionDraftRepository;
  sessionRepository: InMemoryAuthorSessionRepository;
  sessionId: string;
  authorId: string;
  submissionId: string;
  otherSubmissionId: string;
  auditEvents: Array<Record<string, unknown>>;
}

export async function createSubmissionDraftTestApp(
  options: SubmissionDraftTestAppOptions = {}
): Promise<SubmissionDraftTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_submission_draft_test" });

  const authorId = "00000000-0000-4000-8000-000000000601";
  const secondAuthorId = "00000000-0000-4000-8000-000000000602";
  const sessionId = "sess_uc06_001";
  const submissionId = "10000000-0000-4000-8000-000000000601";
  const otherSubmissionId = "10000000-0000-4000-8000-000000000699";

  const sessionRepository = new InMemoryAuthorSessionRepository();
  await sessionRepository.seedSession({
    sessionId,
    accountId: authorId,
    role: options.sessionRole ?? "AUTHOR",
    status: "ACTIVE"
  });

  const repository = new PrismaSubmissionDraftRepository({
    forceSaveFailure: options.forceSaveFailure ?? false,
    forceConcurrentResolutionFailure: options.forceConcurrentResolutionFailure ?? false
  });
  repository.seedSubmissionOwner(submissionId, authorId);
  repository.seedSubmissionOwner(otherSubmissionId, secondAuthorId);

  const ownershipGuard = new SubmissionDraftOwnershipGuard(repository);
  const auditEvents: Array<Record<string, unknown>> = [];
  const auditService = new SubmissionDraftAuditService({
    repository,
    emit: (event) => {
      auditEvents.push(event);
    }
  });

  const saveUseCase = new SaveSubmissionDraftUseCase({
    repository,
    ownershipGuard,
    auditService
  });

  const getUseCase = new GetSubmissionDraftUseCase({
    repository,
    ownershipGuard
  });

  app.register(
    createSubmissionDraftRoutes({
      saveUseCase,
      getUseCase,
      authorSessionAuth: createAuthorSessionAuth({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    sessionRepository,
    sessionId,
    authorId,
    submissionId,
    otherSubmissionId,
    auditEvents
  };
}
