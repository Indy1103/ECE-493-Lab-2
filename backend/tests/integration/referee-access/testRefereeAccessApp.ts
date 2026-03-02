import Fastify, { type FastifyInstance } from "fastify";

import { AccessAssignedPaperService } from "../../../src/business/referee-access/accessAssignedPaperService.js";
import { AssignmentAuthorizationValidator } from "../../../src/business/referee-access/assignmentAuthorization.js";
import { ListAssignmentsService } from "../../../src/business/referee-access/listAssignmentsService.js";
import { AssignedPaperAuditRepository } from "../../../src/data/referee-access/assignedPaperAuditRepository.js";
import { PrismaAssignedPaperRepository } from "../../../src/data/referee-access/assignedPaperRepository.js";
import { createRefereeAccessRoutes } from "../../../src/presentation/referee-access/refereeAccessRoutes.js";
import {
  createRefereeSessionGuard,
  type RefereeSessionRecord,
  type RefereeSessionRepository
} from "../../../src/security/sessionGuard.js";

interface RefereeAccessTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  seedAssignment?: boolean;
  assignmentOwnerId?: string;
  assignmentStatus?: "ACTIVE" | "UNAVAILABLE" | "REVOKED";
  invitationStatus?: "ACCEPTED" | "PENDING" | "REJECTED";
  paperAvailability?: "AVAILABLE" | "UNAVAILABLE";
  reviewFormStatus?: "READY" | "UNAVAILABLE";
  forceNextListFailure?: boolean;
  forceNextAccessFailure?: boolean;
}

class InMemoryRefereeSessionRepository implements RefereeSessionRepository {
  private readonly sessions = new Map<string, RefereeSessionRecord>();

  async getSessionById(sessionId: string): Promise<RefereeSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: RefereeSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface RefereeAccessTestAppContext {
  app: FastifyInstance;
  repository: PrismaAssignedPaperRepository;
  auditRepository: AssignedPaperAuditRepository;
  sessionRepository: InMemoryRefereeSessionRepository;
  sessionId: string;
  otherSessionId: string;
  refereeUserId: string;
  otherRefereeUserId: string;
  assignmentId: string;
  paperId: string;
  reviewFormId: string;
}

export async function createRefereeAccessTestApp(
  options: RefereeAccessTestAppOptions = {}
): Promise<RefereeAccessTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc09_test" });

  const sessionId = "sess_uc09_ref_001";
  const otherSessionId = "sess_uc09_ref_002";
  const refereeUserId = "40900000-0000-4000-8000-000000000901";
  const otherRefereeUserId = "40900000-0000-4000-8000-000000000902";
  const assignmentId = "10900000-0000-4000-8000-000000000901";
  const paperId = "20900000-0000-4000-8000-000000000901";
  const reviewFormId = "30900000-0000-4000-8000-000000000901";

  const sessionRepository = new InMemoryRefereeSessionRepository();
  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId,
      accountId: refereeUserId,
      role: options.sessionRole ?? "REFEREE",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }
  await sessionRepository.seedSession({
    sessionId: otherSessionId,
    accountId: otherRefereeUserId,
    role: "REFEREE",
    status: "ACTIVE"
  });

  const repository = new PrismaAssignedPaperRepository({
    forceNextListFailure: options.forceNextListFailure ?? false,
    forceNextAccessFailure: options.forceNextAccessFailure ?? false
  });

  if (options.seedAssignment !== false) {
    repository.seedAssignment({
      id: assignmentId,
      refereeUserId: options.assignmentOwnerId ?? refereeUserId,
      paperId,
      reviewFormId,
      status: options.assignmentStatus ?? "ACTIVE",
      invitationStatus: options.invitationStatus ?? "ACCEPTED",
      assignedAt: new Date("2026-03-20T00:00:00.000Z"),
      updatedAt: new Date("2026-03-20T00:00:00.000Z")
    });
  }

  repository.seedPaperResource({
    paperId,
    title: "Consistency in Peer Review Systems",
    abstractPreview: "An empirical study on reviewer assignment quality.",
    fileObjectKey: "papers/20900000-0000-4000-8000-000000000901.pdf",
    contentUrl: "https://storage.cms.local/papers/20900000-0000-4000-8000-000000000901",
    availability: options.paperAvailability ?? "AVAILABLE",
    lastAvailabilityCheckAt: new Date("2026-03-20T00:00:00.000Z")
  });

  repository.seedReviewForm({
    reviewFormId,
    paperId,
    refereeUserId: options.assignmentOwnerId ?? refereeUserId,
    schemaVersion: "v1.0",
    formUrl: "https://storage.cms.local/forms/30900000-0000-4000-8000-000000000901",
    status: options.reviewFormStatus ?? "READY"
  });

  const auditRepository = new AssignedPaperAuditRepository();
  const authorizationValidator = new AssignmentAuthorizationValidator();
  const listAssignmentsService = new ListAssignmentsService({
    repository,
    auditRepository,
    authorizationValidator
  });
  const accessAssignedPaperService = new AccessAssignedPaperService({
    repository,
    auditRepository,
    authorizationValidator
  });

  app.register(
    createRefereeAccessRoutes({
      listAssignmentsService,
      accessAssignedPaperService,
      refereeSessionGuard: createRefereeSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    auditRepository,
    sessionRepository,
    sessionId,
    otherSessionId,
    refereeUserId,
    otherRefereeUserId,
    assignmentId,
    paperId,
    reviewFormId
  };
}
