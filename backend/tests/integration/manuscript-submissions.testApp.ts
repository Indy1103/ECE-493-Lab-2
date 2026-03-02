import Fastify, { type FastifyInstance } from "fastify";

import { SubmissionDeduplicationService } from "../../src/business/manuscripts/submission-deduplication.service.js";
import { ManuscriptFileValidationService } from "../../src/business/manuscripts/manuscript-file-validation.service.js";
import { SubmissionHandoffService } from "../../src/business/manuscripts/submission-handoff.service.js";
import { SubmissionMetadataPolicyService } from "../../src/business/manuscripts/submission-metadata-policy.service.js";
import { SubmitManuscriptService } from "../../src/business/manuscripts/submit-manuscript.service.js";
import {
  ManuscriptSubmissionObservabilityService
} from "../../src/business/observability/manuscript-submission-observability.service.js";
import {
  InMemoryConferenceCycleRepository
} from "../../src/data/manuscripts/conference-cycle.repository.js";
import {
  InMemoryManuscriptArtifactRepository
} from "../../src/data/manuscripts/manuscript-artifact.repository.js";
import {
  InMemoryManuscriptStorageAdapter
} from "../../src/data/manuscripts/manuscript-storage.adapter.js";
import {
  InMemoryManuscriptSubmissionRepository
} from "../../src/data/manuscripts/manuscript-submission.repository.js";
import {
  InMemorySubmissionAttemptAuditRepository
} from "../../src/data/manuscripts/submission-attempt-audit.repository.js";
import { createManuscriptSubmissionsRoute } from "../../src/presentation/manuscripts/manuscript-submissions.controller.js";
import {
  type AuthorSessionRecord,
  type AuthorSessionRepository,
  createAuthorSessionAuth
} from "../../src/presentation/middleware/author-session-auth.js";

interface ManuscriptSubmissionTestAppOptions {
  intakeStatus?: "OPEN" | "CLOSED";
  sessionRole?: string;
  forceStorageFailure?: boolean;
  forceHandoffFailure?: boolean;
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
    const current = this.sessions.get(sessionId);
    if (!current) {
      return;
    }

    this.sessions.set(sessionId, {
      ...current,
      status: "EXPIRED"
    });
  }
}

export interface ManuscriptSubmissionTestAppContext {
  app: FastifyInstance;
  authorId: string;
  sessionId: string;
  sessionRepository: InMemoryAuthorSessionRepository;
  submissionRepository: InMemoryManuscriptSubmissionRepository;
  artifactRepository: InMemoryManuscriptArtifactRepository;
  auditRepository: InMemorySubmissionAttemptAuditRepository;
}

export async function createManuscriptSubmissionTestApp(
  options: ManuscriptSubmissionTestAppOptions = {}
): Promise<ManuscriptSubmissionTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_submit_manuscript" });

  const authorId = "00000000-0000-4000-8000-000000000501";
  const sessionId = "sess_uc05_001";

  const sessionRepository = new InMemoryAuthorSessionRepository();
  await sessionRepository.seedSession({
    sessionId,
    accountId: authorId,
    role: options.sessionRole ?? "AUTHOR",
    status: "ACTIVE"
  });

  const conferenceCycleRepository = new InMemoryConferenceCycleRepository({
    intakeStatus: options.intakeStatus ?? "OPEN"
  });
  const submissionRepository = new InMemoryManuscriptSubmissionRepository();
  const artifactRepository = new InMemoryManuscriptArtifactRepository();
  const auditRepository = new InMemorySubmissionAttemptAuditRepository();
  const observabilityService = new ManuscriptSubmissionObservabilityService({
    auditRepository
  });
  const metadataPolicyService = new SubmissionMetadataPolicyService();
  const fileValidationService = new ManuscriptFileValidationService({
    storageAdapter: new InMemoryManuscriptStorageAdapter({
      forceFailure: options.forceStorageFailure ?? false
    })
  });
  const deduplicationService = new SubmissionDeduplicationService({
    submissionRepository
  });
  const handoffService = new SubmissionHandoffService(
    {
      async markDownstreamAvailable(submissionId: string): Promise<void> {
        await submissionRepository.markDownstreamAvailable(submissionId);
      }
    },
    { forceFailure: options.forceHandoffFailure ?? false }
  );

  const submitManuscriptService = new SubmitManuscriptService({
    conferenceCycleRepository,
    submissionRepository,
    artifactRepository,
    metadataPolicyService,
    fileValidationService,
    deduplicationService,
    handoffService,
    observabilityService
  });

  app.register(
    createManuscriptSubmissionsRoute({
      submitManuscriptService,
      authorSessionAuth: createAuthorSessionAuth({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    authorId,
    sessionId,
    sessionRepository,
    submissionRepository,
    artifactRepository,
    auditRepository
  };
}
