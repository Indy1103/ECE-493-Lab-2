import Fastify, { type FastifyInstance } from "fastify";

import { ReviewSubmissionAuditLogger } from "../../../src/business/review-submission/audit-logger.js";
import { ReviewSubmissionEligibilityPolicy } from "../../../src/business/review-submission/eligibility-policy.js";
import { FinalSubmissionGuard } from "../../../src/business/review-submission/final-submission-guard.js";
import { ReviewValidationPolicy } from "../../../src/business/review-submission/review-validation-policy.js";
import { SubmitReviewService } from "../../../src/business/review-submission/submit-review.service.js";
import type { AssignmentEligibilityRecord } from "../../../src/business/review-submission/ports.js";
import { PrismaAssignmentEligibilityRepository } from "../../../src/data/review-submission/assignment-eligibility.repository.js";
import { ReviewSubmissionAuditRepository } from "../../../src/data/review-submission/review-submission-audit.repository.js";
import { PrismaReviewSubmissionRepository } from "../../../src/data/review-submission/review-submission.repository.js";
import { createReviewSubmissionRoutes } from "../../../src/presentation/review-submission/routes.js";
import {
  createReviewSubmissionSessionGuard,
  type ReviewSubmissionSessionRecord,
  type ReviewSubmissionSessionRepository
} from "../../../src/security/session-guard.js";

interface ReviewSubmissionTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  assignmentOwnerId?: string;
  invitationStatus?: "ACCEPTED" | "PENDING" | "REJECTED";
  submissionEligibility?: "ELIGIBLE" | "INELIGIBLE";
  seedExistingSubmission?: boolean;
  forceNextWriteFailure?: boolean;
  forceLockConflict?: boolean;
}

class InMemoryReviewSubmissionSessionRepository implements ReviewSubmissionSessionRepository {
  private readonly sessions = new Map<string, ReviewSubmissionSessionRecord>();

  async getSessionById(sessionId: string): Promise<ReviewSubmissionSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: ReviewSubmissionSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface ReviewSubmissionTestAppContext {
  app: FastifyInstance;
  eligibilityRepository: PrismaAssignmentEligibilityRepository;
  submissionRepository: PrismaReviewSubmissionRepository;
  auditRepository: ReviewSubmissionAuditRepository;
  sessionRepository: InMemoryReviewSubmissionSessionRepository;
  sessionId: string;
  refereeUserId: string;
  otherSessionId: string;
  otherRefereeUserId: string;
  assignmentId: string;
}

function buildEligibilityRecord(options: ReviewSubmissionTestAppOptions): AssignmentEligibilityRecord {
  const assignmentId = "11000000-0000-4000-8000-000000000001";
  const paperId = "21000000-0000-4000-8000-000000000001";
  const refereeUserId = options.assignmentOwnerId ?? "41000000-0000-4000-8000-000000000001";

  return {
    assignmentId,
    paperId,
    refereeUserId,
    invitationStatus: options.invitationStatus ?? "ACCEPTED",
    submissionEligibility: options.submissionEligibility ?? "ELIGIBLE",
    eligibilityCheckedAt: new Date("2026-03-01T00:00:00.000Z"),
    reviewForm: {
      reviewFormId: "31000000-0000-4000-8000-000000000001",
      assignmentId,
      paperId,
      formVersion: "v1.0",
      fields: [
        {
          fieldId: "summary",
          required: true,
          constraints: ["non-empty-string", "maxLength:2000"]
        },
        {
          fieldId: "overallScore",
          required: true,
          constraints: ["number:1-5"]
        }
      ]
    }
  };
}

export async function createReviewSubmissionTestApp(
  options: ReviewSubmissionTestAppOptions = {}
): Promise<ReviewSubmissionTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc10_test" });

  const assignmentId = "11000000-0000-4000-8000-000000000001";
  const refereeUserId = "41000000-0000-4000-8000-000000000001";
  const otherRefereeUserId = "41000000-0000-4000-8000-000000000002";
  const sessionId = "sess_uc10_ref_001";
  const otherSessionId = "sess_uc10_ref_002";

  const sessionRepository = new InMemoryReviewSubmissionSessionRepository();
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

  const eligibilityRepository = new PrismaAssignmentEligibilityRepository();
  eligibilityRepository.seedEligibility(buildEligibilityRecord(options));

  const submissionRepository = new PrismaReviewSubmissionRepository({
    forceNextWriteFailure: options.forceNextWriteFailure ?? false,
    forceLockConflict: options.forceLockConflict ?? false
  });

  if (options.seedExistingSubmission) {
    submissionRepository.seedSubmission({
      id: "51000000-0000-4000-8000-000000000001",
      assignmentId,
      paperId: "21000000-0000-4000-8000-000000000001",
      refereeUserId,
      content: { summary: "Existing submission", overallScore: 4 },
      status: "SUBMITTED",
      submittedAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z")
    });
  }

  const auditRepository = new ReviewSubmissionAuditRepository();
  const service = new SubmitReviewService({
    eligibilityRepository,
    submissionRepository,
    eligibilityPolicy: new ReviewSubmissionEligibilityPolicy(),
    validationPolicy: new ReviewValidationPolicy(),
    finalSubmissionGuard: new FinalSubmissionGuard(submissionRepository),
    auditLogger: new ReviewSubmissionAuditLogger({ repository: auditRepository })
  });

  app.register(
    createReviewSubmissionRoutes({
      service,
      reviewSubmissionSessionGuard: createReviewSubmissionSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    eligibilityRepository,
    submissionRepository,
    auditRepository,
    sessionRepository,
    sessionId,
    refereeUserId,
    otherSessionId,
    otherRefereeUserId,
    assignmentId
  };
}
