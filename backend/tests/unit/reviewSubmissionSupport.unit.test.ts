import assert from "node:assert/strict";
import test from "node:test";

import { ReviewSubmissionAuditLogger } from "../../src/business/review-submission/audit-logger.js";
import {
  REVIEW_SUBMISSION_PORTS_MARKER,
  type AssignmentEligibilityRecord,
  type ReviewSubmissionAuditEvent
} from "../../src/business/review-submission/ports.js";
import {
  DuplicateFinalSubmissionError,
  FinalSubmissionGuard
} from "../../src/business/review-submission/final-submission-guard.js";
import { ReviewSubmissionEligibilityPolicy } from "../../src/business/review-submission/eligibility-policy.js";
import { ReviewValidationPolicy } from "../../src/business/review-submission/review-validation-policy.js";
import {
  REVIEW_SUBMISSION_OUTCOMES,
  REVIEW_SUBMISSION_REASON_CODES
} from "../../src/business/review-submission/submission-outcome.js";
import { SubmitReviewService } from "../../src/business/review-submission/submit-review.service.js";
import { PrismaAssignmentEligibilityRepository } from "../../src/data/review-submission/assignment-eligibility.repository.js";
import {
  REVIEW_SUBMISSION_AUDIT_REPOSITORY_MARKER,
  ReviewSubmissionAuditRepository
} from "../../src/data/review-submission/review-submission-audit.repository.js";
import {
  PrismaReviewSubmissionRepository,
  ReviewSubmissionConflictError,
  ReviewSubmissionWriteFailureError
} from "../../src/data/review-submission/review-submission.repository.js";
import { REVIEW_SUBMISSION_PRISMA_REPOSITORY_MARKER } from "../../src/data/review-submission/review-submission.prisma-repository.js";
import {
  ReviewFormResponseSchema,
  ReviewSubmissionErrorResponseSchema,
  ReviewSubmissionSuccessResponseSchema,
  ValidationFailedResponseSchema,
  buildSessionExpiredResponse,
  mapReviewFormOutcome,
  mapSubmitReviewOutcome
} from "../../src/presentation/review-submission/error-mapper.js";
import { createGetReviewFormHandler } from "../../src/presentation/review-submission/get-review-form.handler.js";
import { createPostReviewSubmissionHandler } from "../../src/presentation/review-submission/post-review-submission.handler.js";
import {
  createReviewSubmissionRoutes,
  requireReviewSubmissionTransportSecurity
} from "../../src/presentation/review-submission/routes.js";
import {
  createReviewSubmissionSessionGuard,
  type ReviewSubmissionSessionRepository
} from "../../src/security/session-guard.js";

function createReplyDouble() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return this;
    }
  };
}

function buildEligibility(
  overrides: Partial<AssignmentEligibilityRecord> = {}
): AssignmentEligibilityRecord {
  return {
    assignmentId: "11000000-0000-4000-8000-000000000001",
    paperId: "21000000-0000-4000-8000-000000000001",
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    invitationStatus: "ACCEPTED",
    submissionEligibility: "ELIGIBLE",
    eligibilityCheckedAt: new Date("2026-03-01T00:00:00.000Z"),
    reviewForm: {
      reviewFormId: "31000000-0000-4000-8000-000000000001",
      assignmentId: "11000000-0000-4000-8000-000000000001",
      paperId: "21000000-0000-4000-8000-000000000001",
      formVersion: "v1",
      fields: [
        {
          fieldId: "summary",
          required: true,
          constraints: ["non-empty-string", "maxLength:20"]
        },
        {
          fieldId: "overallScore",
          required: true,
          constraints: ["number:1-5"]
        },
        {
          fieldId: "optionalField",
          required: false,
          constraints: ["unknown-constraint"]
        }
      ]
    },
    ...overrides
  };
}

test("eligibility policy covers form and submit decisions", () => {
  const policy = new ReviewSubmissionEligibilityPolicy();

  const missingForm = policy.evaluateFormAccess(null, "u1");
  assert.equal(missingForm.allowed, false);

  const ownerMismatchForm = policy.evaluateFormAccess(buildEligibility(), "u2");
  assert.equal(ownerMismatchForm.allowed, false);

  const okForm = policy.evaluateFormAccess(buildEligibility(), "41000000-0000-4000-8000-000000000001");
  assert.equal(okForm.allowed, true);

  const missingSubmit = policy.evaluateSubmissionEligibility(null, "u1");
  assert.equal(missingSubmit.allowed, false);

  const ownerMismatchSubmit = policy.evaluateSubmissionEligibility(buildEligibility(), "u2");
  assert.equal(ownerMismatchSubmit.allowed, false);

  const pendingSubmit = policy.evaluateSubmissionEligibility(
    buildEligibility({ invitationStatus: "PENDING" }),
    "41000000-0000-4000-8000-000000000001"
  );
  assert.equal(pendingSubmit.allowed, false);

  const ineligibleSubmit = policy.evaluateSubmissionEligibility(
    buildEligibility({ submissionEligibility: "INELIGIBLE" }),
    "41000000-0000-4000-8000-000000000001"
  );
  assert.equal(ineligibleSubmit.allowed, false);

  const okSubmit = policy.evaluateSubmissionEligibility(
    buildEligibility(),
    "41000000-0000-4000-8000-000000000001"
  );
  assert.equal(okSubmit.allowed, true);
});

test("validation policy covers required and constraints branches", () => {
  const policy = new ReviewValidationPolicy();

  const invalid = policy.validateSubmission(
    {
      responses: {
        summary: "",
        overallScore: 7,
        optionalField: "x"
      }
    },
    buildEligibility().reviewForm.fields
  );
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues.length >= 2, true);

  const tooLong = policy.validateSubmission(
    {
      responses: {
        summary: "This summary text exceeds max length",
        overallScore: 3
      }
    },
    buildEligibility().reviewForm.fields
  );
  assert.equal(tooLong.valid, false);

  const missingResponses = policy.validateSubmission({}, buildEligibility().reviewForm.fields);
  assert.equal(missingResponses.valid, false);

  const valid = policy.validateSubmission(
    {
      responses: {
        summary: "Great paper",
        overallScore: 4
      }
    },
    buildEligibility().reviewForm.fields
  );
  assert.equal(valid.valid, true);

  const optionalConstraintFailure = policy.validateSubmission(
    {
      responses: {
        summary: "Solid work",
        overallScore: 4,
        nonEmptyOptional: 42,
        noConstraint: "kept"
      }
    },
    [
      ...buildEligibility().reviewForm.fields,
      { fieldId: "nonEmptyOptional", required: false, constraints: ["non-empty-string"] },
      { fieldId: "noConstraint", required: false }
    ]
  );
  assert.equal(optionalConstraintFailure.valid, false);
  assert.equal(
    optionalConstraintFailure.issues.some((issue) => issue.fieldId === "nonEmptyOptional"),
    true
  );
});

test("final submission guard raises duplicate error", async () => {
  const repository = new PrismaReviewSubmissionRepository();
  repository.seedSubmission({
    id: "51000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    paperId: "21000000-0000-4000-8000-000000000001",
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    content: {},
    status: "SUBMITTED",
    submittedAt: new Date(),
    updatedAt: new Date()
  });

  const guard = new FinalSubmissionGuard(repository);
  await assert.rejects(() => guard.ensureNoFinalSubmission("11000000-0000-4000-8000-000000000001"), {
    name: "DuplicateFinalSubmissionError"
  });

  await guard.ensureNoFinalSubmission("missing-assignment");

  const error = new DuplicateFinalSubmissionError();
  assert.equal(error.reasonCode, REVIEW_SUBMISSION_REASON_CODES.DUPLICATE_FINAL_SUBMISSION);
});

test("submit review service covers success and failure branches", async () => {
  const eligibilityRepository = new PrismaAssignmentEligibilityRepository();
  eligibilityRepository.seedEligibility(buildEligibility());

  const submissionRepository = new PrismaReviewSubmissionRepository();
  const auditRepository = new ReviewSubmissionAuditRepository();
  const service = new SubmitReviewService({
    eligibilityRepository,
    submissionRepository,
    eligibilityPolicy: new ReviewSubmissionEligibilityPolicy(),
    validationPolicy: new ReviewValidationPolicy(),
    finalSubmissionGuard: new FinalSubmissionGuard(submissionRepository),
    auditLogger: new ReviewSubmissionAuditLogger({ repository: auditRepository }),
    nowProvider: () => new Date("2026-03-03T00:00:00.000Z")
  });

  const form = await service.getReviewForm({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req1"
  });
  assert.equal(form.outcome, "REVIEW_FORM_AVAILABLE");

  const unavailableForm = await service.getReviewForm({
    refereeUserId: "different-referee",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req1b"
  });
  assert.equal(unavailableForm.outcome, "SUBMISSION_UNAVAILABLE");

  const validationFailed = await service.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req2",
    payload: { responses: { summary: "", overallScore: 8 } }
  });
  assert.equal(validationFailed.outcome, "VALIDATION_FAILED");

  const accepted = await service.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req3",
    payload: { responses: { summary: "Good", overallScore: 5 } }
  });
  assert.equal(accepted.outcome, "REVIEW_SUBMISSION_ACCEPTED");

  const duplicate = await service.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req4",
    payload: { responses: { summary: "Again", overallScore: 4 } }
  });
  assert.equal(duplicate.outcome, "SUBMISSION_UNAVAILABLE");
  if (duplicate.outcome === "SUBMISSION_UNAVAILABLE") {
    assert.equal(duplicate.reasonCode, "duplicate-final-submission");
  }

  const unavailable = await service.submitReview({
    refereeUserId: "other-user",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req5",
    payload: { responses: { summary: "x", overallScore: 3 } }
  });
  assert.equal(unavailable.outcome, "SUBMISSION_UNAVAILABLE");
  if (unavailable.outcome === "SUBMISSION_UNAVAILABLE") {
    assert.equal(unavailable.statusCode, 404);
  }

  const forceWriteRepository = new PrismaReviewSubmissionRepository({ forceNextWriteFailure: true });
  const serviceWithWriteFailure = new SubmitReviewService({
    eligibilityRepository,
    submissionRepository: forceWriteRepository,
    eligibilityPolicy: new ReviewSubmissionEligibilityPolicy(),
    validationPolicy: new ReviewValidationPolicy(),
    finalSubmissionGuard: new FinalSubmissionGuard(forceWriteRepository),
    auditLogger: new ReviewSubmissionAuditLogger({ repository: auditRepository })
  });
  const writeFailure = await serviceWithWriteFailure.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req6",
    payload: { responses: { summary: "Good", overallScore: 4 } }
  });
  assert.equal(writeFailure.outcome, "SUBMISSION_UNAVAILABLE");

  eligibilityRepository.setForceNextReadFailure(true);
  const readFailureForm = await service.getReviewForm({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req7"
  });
  assert.equal(readFailureForm.outcome, "SUBMISSION_UNAVAILABLE");

  eligibilityRepository.setForceNextReadFailure(true);
  const readFailureSubmit = await service.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000001",
    requestId: "req8",
    payload: { responses: { summary: "Retry", overallScore: 4 } }
  });
  assert.equal(readFailureSubmit.outcome, "SUBMISSION_UNAVAILABLE");

  const fallbackEligibilityRepository = new PrismaAssignmentEligibilityRepository();
  fallbackEligibilityRepository.seedEligibility({
    ...buildEligibility({
      assignmentId: "11000000-0000-4000-8000-000000000010",
      paperId: "21000000-0000-4000-8000-000000000010"
    }),
    reviewForm: {
      reviewFormId: "31000000-0000-4000-8000-000000000010",
      assignmentId: "11000000-0000-4000-8000-000000000010",
      paperId: "21000000-0000-4000-8000-000000000010",
      formVersion: "v1",
      fields: []
    }
  });
  const fallbackSubmissionRepository = new PrismaReviewSubmissionRepository();
  const fallbackService = new SubmitReviewService({
    eligibilityRepository: fallbackEligibilityRepository,
    submissionRepository: fallbackSubmissionRepository,
    eligibilityPolicy: new ReviewSubmissionEligibilityPolicy(),
    validationPolicy: new ReviewValidationPolicy(),
    finalSubmissionGuard: new FinalSubmissionGuard(fallbackSubmissionRepository),
    auditLogger: new ReviewSubmissionAuditLogger({ repository: auditRepository })
  });
  const fallbackSubmit = await fallbackService.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000010",
    requestId: "req9",
    payload: { responses: "unexpected-string" as unknown }
  });
  assert.equal(fallbackSubmit.outcome, "REVIEW_SUBMISSION_ACCEPTED");
  assert.deepEqual(
    (await fallbackSubmissionRepository.getByAssignmentId("11000000-0000-4000-8000-000000000010"))
      ?.content,
    {}
  );

  const events = auditRepository.list();
  assert.equal(events.length >= 5, true);
});

test("submit review service covers id fallback and unknown error-name mapping", async () => {
  const now = new Date("2026-03-04T00:00:00.000Z");
  const auditRepository = new ReviewSubmissionAuditRepository();

  const idFallbackEligibilityRepository = new PrismaAssignmentEligibilityRepository();
  idFallbackEligibilityRepository.seedEligibility(
    buildEligibility({
      assignmentId: "11000000-0000-4000-8000-000000000011",
      paperId: "21000000-0000-4000-8000-000000000011"
    })
  );

  const idlessSubmissionRepository = {
    async withAssignmentLock<T>(_assignmentId: string, operation: () => Promise<T>): Promise<T> {
      return operation();
    },
    async getByAssignmentId(): Promise<null> {
      return null;
    },
    async createFinalSubmission(input: {
      assignmentId: string;
      paperId: string;
      refereeUserId: string;
      content: Record<string, unknown>;
    }) {
      return {
        id: "",
        assignmentId: input.assignmentId,
        paperId: input.paperId,
        refereeUserId: input.refereeUserId,
        content: input.content,
        status: "SUBMITTED" as const,
        submittedAt: now,
        updatedAt: now
      };
    }
  };

  const idFallbackService = new SubmitReviewService({
    eligibilityRepository: idFallbackEligibilityRepository,
    submissionRepository: idlessSubmissionRepository,
    eligibilityPolicy: new ReviewSubmissionEligibilityPolicy(),
    validationPolicy: new ReviewValidationPolicy(),
    finalSubmissionGuard: new FinalSubmissionGuard(idlessSubmissionRepository),
    auditLogger: new ReviewSubmissionAuditLogger({ repository: auditRepository })
  });

  const acceptedWithFallbackId = await idFallbackService.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000011",
    requestId: "req10",
    payload: { responses: { summary: "Good", overallScore: 4 } }
  });
  assert.equal(acceptedWithFallbackId.outcome, "REVIEW_SUBMISSION_ACCEPTED");
  if (acceptedWithFallbackId.outcome === "REVIEW_SUBMISSION_ACCEPTED") {
    assert.equal(acceptedWithFallbackId.submissionId.length > 0, true);
  }

  const unknownErrorEligibilityRepository = new PrismaAssignmentEligibilityRepository();
  unknownErrorEligibilityRepository.seedEligibility(
    buildEligibility({
      assignmentId: "11000000-0000-4000-8000-000000000012",
      paperId: "21000000-0000-4000-8000-000000000012"
    })
  );

  const nonErrorThrowingRepository = {
    async withAssignmentLock<T>(_assignmentId: string, operation: () => Promise<T>): Promise<T> {
      return operation();
    },
    async getByAssignmentId(): Promise<null> {
      return null;
    },
    async createFinalSubmission() {
      throw "non-error-failure";
    }
  };

  const unknownErrorService = new SubmitReviewService({
    eligibilityRepository: unknownErrorEligibilityRepository,
    submissionRepository: nonErrorThrowingRepository,
    eligibilityPolicy: new ReviewSubmissionEligibilityPolicy(),
    validationPolicy: new ReviewValidationPolicy(),
    finalSubmissionGuard: new FinalSubmissionGuard(nonErrorThrowingRepository),
    auditLogger: new ReviewSubmissionAuditLogger({ repository: auditRepository })
  });

  const unavailableWithUnknownError = await unknownErrorService.submitReview({
    refereeUserId: "41000000-0000-4000-8000-000000000001",
    assignmentId: "11000000-0000-4000-8000-000000000012",
    requestId: "req11",
    payload: { responses: { summary: "Good", overallScore: 4 } }
  });
  assert.equal(unavailableWithUnknownError.outcome, "SUBMISSION_UNAVAILABLE");

  const lastAuditEvent = auditRepository.list().at(-1);
  assert.equal(lastAuditEvent?.metadata.errorName, "UnknownError");
});

test("audit logger sanitizes content and default metadata paths", async () => {
  const recorded: Array<{
    metadata: Record<string, unknown>;
    reasonCode: string;
    outcome: "submitted" | "validation-failed" | "session-expired" | "submission-unavailable";
  }> = [];

  const logger = new ReviewSubmissionAuditLogger({
    repository: {
      record: async (event) => {
        recorded.push({
          metadata: event.metadata,
          reasonCode: event.reasonCode,
          outcome: event.outcome
        });
      }
    }
  });

  await logger.record({
    actorUserId: "u1",
    assignmentId: "a1",
    paperId: "p1",
    outcome: "validation-failed",
    reasonCode: "validation-failed",
    metadata: { content: "secret-payload" }
  });
  await logger.record({
    actorUserId: "u1",
    assignmentId: "a1",
    paperId: "p1",
    outcome: "submitted",
    reasonCode: "submitted"
  });

  assert.equal(recorded[0]?.metadata.content, "[REDACTED]");
  assert.deepEqual(recorded[1]?.metadata, {});
});

test("error mappers and schemas cover default and explicit branches", () => {
  const sessionExpired = buildSessionExpiredResponse();
  assert.equal(sessionExpired.statusCode, 401);
  assert.equal(ReviewSubmissionErrorResponseSchema.safeParse(sessionExpired.body).success, true);

  const mappedForm = mapReviewFormOutcome({
    outcome: "SUBMISSION_UNAVAILABLE",
    messageCode: "submission-unavailable",
    message: "x",
    reasonCode: "non-owned-or-non-assigned",
    statusCode: 404
  });
  assert.equal(mappedForm.statusCode, 404);

  const mappedFormDefault = mapReviewFormOutcome({ outcome: "UNKNOWN" } as unknown as any);
  assert.equal(mappedFormDefault.statusCode, 404);

  const mappedSubmitSuccess = mapSubmitReviewOutcome({
    outcome: "REVIEW_SUBMISSION_ACCEPTED",
    messageCode: "REVIEW_SUBMISSION_ACCEPTED",
    submissionId: "1",
    submittedAt: "2026-03-01T00:00:00.000Z"
  });
  assert.equal(mappedSubmitSuccess.statusCode, 201);
  assert.equal(ReviewSubmissionSuccessResponseSchema.safeParse(mappedSubmitSuccess.body).success, true);

  const mappedSubmitValidation = mapSubmitReviewOutcome({
    outcome: "VALIDATION_FAILED",
    messageCode: "validation-failed",
    message: "m",
    issues: []
  });
  assert.equal(mappedSubmitValidation.statusCode, 400);
  assert.equal(ValidationFailedResponseSchema.safeParse(mappedSubmitValidation.body).success, true);

  const mappedSubmitUnavailable = mapSubmitReviewOutcome({
    outcome: "SUBMISSION_UNAVAILABLE",
    messageCode: "submission-unavailable",
    message: "m",
    reasonCode: "submit-time-ineligible",
    statusCode: 409
  });
  assert.equal(mappedSubmitUnavailable.statusCode, 409);
  assert.equal(ReviewSubmissionErrorResponseSchema.safeParse(mappedSubmitUnavailable.body).success, true);

  const mappedSubmitDefault = mapSubmitReviewOutcome({ outcome: "UNKNOWN" } as unknown as any);
  assert.equal(mappedSubmitDefault.statusCode, 409);

  assert.equal(
    ReviewFormResponseSchema.safeParse({
      messageCode: "REVIEW_FORM_AVAILABLE",
      assignmentId: "a",
      formVersion: "v1",
      fields: []
    }).success,
    true
  );
});

test("session guard and handlers/routes utilities cover branches", async () => {
  class SessionRepo implements ReviewSubmissionSessionRepository {
    constructor(private readonly mode: "missing" | "inactive" | "wrong-role" | "ok") {}

    async getSessionById() {
      if (this.mode === "missing") {
        return null;
      }

      if (this.mode === "inactive") {
        return {
          sessionId: "s1",
          accountId: "u1",
          role: "REFEREE",
          status: "EXPIRED" as const
        };
      }

      if (this.mode === "wrong-role") {
        return {
          sessionId: "s1",
          accountId: "u1",
          role: "EDITOR",
          status: "ACTIVE" as const
        };
      }

      return {
        sessionId: "s1",
        accountId: "u1",
        role: "REFEREE",
        status: "ACTIVE" as const
      };
    }
  }

  const missingReq = { headers: {} } as any;
  const missingReply = createReplyDouble();
  await createReviewSubmissionSessionGuard({ sessionRepository: new SessionRepo("missing") })(
    missingReq,
    missingReply as any
  );
  assert.equal(missingReply.statusCode, 401);

  const inactiveReq = { headers: { cookie: "session=s1" } } as any;
  const inactiveReply = createReplyDouble();
  await createReviewSubmissionSessionGuard({ sessionRepository: new SessionRepo("inactive") })(
    inactiveReq,
    inactiveReply as any
  );
  assert.equal(inactiveReply.statusCode, 401);

  const wrongRoleReq = { headers: { cookie: "session=s1" } } as any;
  const wrongRoleReply = createReplyDouble();
  await createReviewSubmissionSessionGuard({ sessionRepository: new SessionRepo("wrong-role") })(
    wrongRoleReq,
    wrongRoleReply as any
  );
  assert.equal(wrongRoleReply.statusCode, 401);

  const blankCookieReq = { headers: { cookie: "theme=light; session=   " } } as any;
  const blankCookieReply = createReplyDouble();
  await createReviewSubmissionSessionGuard({ sessionRepository: new SessionRepo("ok") })(
    blankCookieReq,
    blankCookieReply as any
  );
  assert.equal(blankCookieReply.statusCode, 401);

  const okReq = { headers: { cookie: "theme=light; cms_session=s1" } } as any;
  const okReply = createReplyDouble();
  await createReviewSubmissionSessionGuard({ sessionRepository: new SessionRepo("ok") })(
    okReq,
    okReply as any
  );
  assert.equal(okReq.reviewSubmissionSession.refereeUserId, "u1");

  const tlsFailReply = createReplyDouble();
  await requireReviewSubmissionTransportSecurity({ headers: {} } as any, tlsFailReply as any);
  assert.equal(tlsFailReply.statusCode, 426);

  const tlsOkReply = createReplyDouble();
  await requireReviewSubmissionTransportSecurity(
    { headers: { "x-forwarded-proto": "https" } } as any,
    tlsOkReply as any
  );
  assert.equal(tlsOkReply.statusCode, 200);

  const getHandler = createGetReviewFormHandler({
    service: {
      getReviewForm: async () => ({
        outcome: "REVIEW_FORM_AVAILABLE",
        messageCode: "REVIEW_FORM_AVAILABLE",
        assignmentId: "a",
        formVersion: "v1",
        fields: []
      })
    }
  });
  const getMissingAuthReply = createReplyDouble();
  await getHandler({ params: { assignmentId: "a" }, id: "req1" } as any, getMissingAuthReply as any);
  assert.equal(getMissingAuthReply.statusCode, 401);

  const getOkReply = createReplyDouble();
  await getHandler(
    {
      params: { assignmentId: "a" },
      id: "req2",
      reviewSubmissionSession: { refereeUserId: "u1", sessionId: "s1" }
    } as any,
    getOkReply as any
  );
  assert.equal(getOkReply.statusCode, 200);

  const postHandler = createPostReviewSubmissionHandler({
    service: {
      submitReview: async () => ({
        outcome: "SUBMISSION_UNAVAILABLE",
        messageCode: "submission-unavailable",
        message: "x",
        reasonCode: "non-owned-or-non-assigned",
        statusCode: 404
      })
    }
  });
  const postMissingAuthReply = createReplyDouble();
  await postHandler(
    { params: { assignmentId: "a" }, id: "req3", body: {} } as any,
    postMissingAuthReply as any
  );
  assert.equal(postMissingAuthReply.statusCode, 401);

  const postOkReply = createReplyDouble();
  await postHandler(
    {
      params: { assignmentId: "a" },
      id: "req4",
      body: {},
      reviewSubmissionSession: { refereeUserId: "u1", sessionId: "s1" }
    } as any,
    postOkReply as any
  );
  assert.equal(postOkReply.statusCode, 404);

  let capturedPayload: unknown;
  const postUndefinedBodyHandler = createPostReviewSubmissionHandler({
    service: {
      submitReview: async (input) => {
        capturedPayload = input.payload;
        return {
          outcome: "SUBMISSION_UNAVAILABLE",
          messageCode: "submission-unavailable",
          message: "x",
          reasonCode: "submit-time-ineligible",
          statusCode: 409
        };
      }
    }
  });
  const postUndefinedBodyReply = createReplyDouble();
  await postUndefinedBodyHandler(
    {
      params: { assignmentId: "a" },
      id: "req5",
      reviewSubmissionSession: { refereeUserId: "u1", sessionId: "s1" }
    } as any,
    postUndefinedBodyReply as any
  );
  assert.equal(postUndefinedBodyReply.statusCode, 409);
  assert.deepEqual(capturedPayload, {});

  const plugin = createReviewSubmissionRoutes({
    service: {
      getReviewForm: async () => ({
        outcome: "REVIEW_FORM_AVAILABLE",
        messageCode: "REVIEW_FORM_AVAILABLE",
        assignmentId: "a",
        formVersion: "v1",
        fields: []
      }),
      submitReview: async () => ({
        outcome: "SUBMISSION_UNAVAILABLE",
        messageCode: "submission-unavailable",
        message: "x",
        reasonCode: "submit-time-ineligible",
        statusCode: 409
      })
    },
    reviewSubmissionSessionGuard: async () => {}
  });
  assert.equal(typeof plugin, "function");
});

test("repository and audit utility branches are covered", async () => {
  const eligibilityRepository = new PrismaAssignmentEligibilityRepository();
  eligibilityRepository.seedEligibility(buildEligibility());
  assert.equal(
    (await eligibilityRepository.getByAssignmentId("11000000-0000-4000-8000-000000000001"))?.assignmentId,
    "11000000-0000-4000-8000-000000000001"
  );
  assert.equal(await eligibilityRepository.getByAssignmentId("missing"), null);
  eligibilityRepository.setForceNextReadFailure(true);
  await assert.rejects(
    () => eligibilityRepository.getByAssignmentId("11000000-0000-4000-8000-000000000001"),
    /forced eligibility read failure/
  );
  const eligibilitySnapshot = eligibilityRepository.snapshot();
  eligibilityRepository.restore(eligibilitySnapshot);
  assert.equal(eligibilityRepository.isEncryptedAtRest(), true);

  const submissionRepository = new PrismaReviewSubmissionRepository();
  const noOpLock = await submissionRepository.withAssignmentLock("assignment-1", async () => "ok");
  assert.equal(noOpLock, "ok");
  await submissionRepository.createFinalSubmission({
    assignmentId: "assignment-1",
    paperId: "paper-1",
    refereeUserId: "ref-1",
    content: { summary: "x", overallScore: 3 }
  });
  assert.equal((await submissionRepository.getByAssignmentId("assignment-1"))?.assignmentId, "assignment-1");
  await assert.rejects(
    () =>
      submissionRepository.createFinalSubmission({
        assignmentId: "assignment-1",
        paperId: "paper-1",
        refereeUserId: "ref-1",
        content: { summary: "x", overallScore: 3 }
      }),
    ReviewSubmissionConflictError
  );

  const writeFailureRepo = new PrismaReviewSubmissionRepository({ forceNextWriteFailure: true });
  await assert.rejects(
    () =>
      writeFailureRepo.createFinalSubmission({
        assignmentId: "assignment-2",
        paperId: "paper-2",
        refereeUserId: "ref-1",
        content: {}
      }),
    ReviewSubmissionWriteFailureError
  );

  writeFailureRepo.setForceLockConflict(true);
  await assert.rejects(() => writeFailureRepo.withAssignmentLock("assignment-2", async () => "ok"));
  const toggledWriteFailureRepo = new PrismaReviewSubmissionRepository();
  toggledWriteFailureRepo.setForceNextWriteFailure(true);
  await assert.rejects(
    () =>
      toggledWriteFailureRepo.createFinalSubmission({
        assignmentId: "assignment-3",
        paperId: "paper-3",
        refereeUserId: "ref-1",
        content: {}
      }),
    ReviewSubmissionWriteFailureError
  );
  const submissionSnapshot = submissionRepository.snapshot();
  submissionRepository.restore(submissionSnapshot);
  assert.equal(submissionRepository.isEncryptedAtRest(), true);

  const emitted: ReviewSubmissionAuditEvent[] = [];
  const auditRepository = new ReviewSubmissionAuditRepository({
    emit: (event) => emitted.push(event)
  });
  await auditRepository.record({
    actorUserId: "ref-1",
    assignmentId: "assignment-1",
    paperId: "paper-1",
    outcome: "validation-failed",
    reasonCode: "validation-failed",
    metadata: {
      responses: { summary: "secret" },
      content: "secret"
    }
  });
  assert.equal(auditRepository.list().length, 1);
  assert.equal(emitted.length, 1);
  assert.equal(auditRepository.list()[0]?.metadata.responses, "[REDACTED]");
  assert.equal(auditRepository.list()[0]?.metadata.content, "[REDACTED]");
  const auditSnapshot = auditRepository.snapshot();
  auditRepository.restore(auditSnapshot);
  assert.equal(auditRepository.isEncryptedAtRest(), true);

  assert.equal(REVIEW_SUBMISSION_PORTS_MARKER, "review_submission_ports_marker");
  assert.equal(
    REVIEW_SUBMISSION_AUDIT_REPOSITORY_MARKER,
    "review_submission_audit_repository_marker"
  );
  assert.equal(
    REVIEW_SUBMISSION_PRISMA_REPOSITORY_MARKER,
    "review_submission_prisma_repository_marker"
  );
  assert.equal(REVIEW_SUBMISSION_OUTCOMES.REVIEW_SUBMISSION_ACCEPTED, "REVIEW_SUBMISSION_ACCEPTED");
});
