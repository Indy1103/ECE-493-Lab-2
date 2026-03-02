import assert from "node:assert/strict";
import test from "node:test";

import { GetReviewInvitationUseCase } from "../../src/business/review-invitations/GetReviewInvitationUseCase.js";
import { RespondToReviewInvitationUseCase } from "../../src/business/review-invitations/RespondToReviewInvitationUseCase.js";
import { validateInvitationDecisionRequest } from "../../src/business/review-invitations/reviewInvitationSchemas.js";
import {
  PrismaReviewInvitationRepository,
  ReviewInvitationConflictError,
  ReviewInvitationNotPendingError
} from "../../src/data/review-invitations/PrismaReviewInvitationRepository.js";
import {
  type InvitationResponseAttemptRecord,
  REVIEW_INVITATION_REPOSITORY_CONTRACT,
  type ReviewInvitationRepository
} from "../../src/data/review-invitations/ReviewInvitationRepository.js";
import { createGetReviewInvitationHandler } from "../../src/presentation/review-invitations/getReviewInvitationHandler.js";
import { createPostReviewInvitationResponseHandler } from "../../src/presentation/review-invitations/postReviewInvitationResponseHandler.js";
import {
  mapGetReviewInvitationOutcome,
  mapRespondToReviewInvitationOutcome
} from "../../src/presentation/review-invitations/reviewInvitationErrorMapper.js";
import { requireReviewInvitationTransportSecurity } from "../../src/presentation/review-invitations/reviewInvitationRouteSecurity.js";
import {
  createReviewInvitationAuthorization,
  type ReviewInvitationSessionRepository
} from "../../src/security/reviewInvitationAuthorization.js";
import {
  ReviewInvitationAuditService,
  redactReviewInvitationAuditContext
} from "../../src/shared/audit/reviewInvitationAudit.js";

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

test("review invitation schema validation accepts valid decisions and rejects invalid ones", () => {
  const valid = validateInvitationDecisionRequest({ decision: "ACCEPT" });
  assert.equal(valid.valid, true);

  const invalid = validateInvitationDecisionRequest({ decision: "MAYBE" });
  assert.equal(invalid.valid, false);
  if (!invalid.valid) {
    assert.equal(invalid.violations[0]?.rule, "INVALID_DECISION_VALUE");
  }
});

test("get invitation use case covers not-found, authz, success, and internal branches", async () => {
  const repo = new PrismaReviewInvitationRepository();
  repo.seedInvitation({
    invitationId: "inv-1",
    paperId: "paper-1",
    refereeId: "ref-1",
    paperTitle: "Title",
    paperSummary: "Summary",
    reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
    invitationStatus: "PENDING",
    resolvedAt: null,
    version: 1
  });

  const useCase = new GetReviewInvitationUseCase({ repository: repo });

  const notFound = await useCase.execute({ invitationId: "missing", refereeId: "ref-1" });
  assert.equal(notFound.outcome, "INVITATION_NOT_FOUND");

  const forbidden = await useCase.execute({ invitationId: "inv-1", refereeId: "ref-2" });
  assert.equal(forbidden.outcome, "AUTHORIZATION_FAILED");

  const success = await useCase.execute({ invitationId: "inv-1", refereeId: "ref-1" });
  assert.equal(success.outcome, "SUCCESS");

  repo.setForceNextReadFailure(true);
  const internal = await useCase.execute({ invitationId: "inv-1", refereeId: "ref-1" });
  assert.equal(internal.outcome, "INTERNAL_ERROR");
});

test("respond use case covers key success and failure branches", async () => {
  const repo = new PrismaReviewInvitationRepository();
  repo.seedInvitation({
    invitationId: "inv-2",
    paperId: "paper-2",
    refereeId: "ref-2",
    paperTitle: "Title",
    paperSummary: "Summary",
    reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
    invitationStatus: "PENDING",
    resolvedAt: null,
    version: 1
  });

  const audit = new ReviewInvitationAuditService({ repository: repo });
  const useCase = new RespondToReviewInvitationUseCase({ repository: repo, auditService: audit });

  const invalid = await useCase.execute({
    invitationId: "inv-2",
    refereeId: "ref-2",
    requestId: "req-1",
    body: { decision: "NOPE" }
  });
  assert.equal(invalid.outcome, "VALIDATION_FAILED");

  const successReject = await useCase.execute({
    invitationId: "inv-2",
    refereeId: "ref-2",
    requestId: "req-2",
    body: { decision: "REJECT" }
  });
  assert.equal(successReject.outcome, "SUCCESS");
  if (successReject.outcome === "SUCCESS") {
    assert.equal(successReject.assignmentCreated, false);
  }

  const resolvedConflict = await useCase.execute({
    invitationId: "inv-2",
    refereeId: "ref-2",
    requestId: "req-3",
    body: { decision: "ACCEPT" }
  });
  assert.equal(resolvedConflict.outcome, "INVITATION_ALREADY_RESOLVED");

  repo.seedInvitation({
    invitationId: "inv-3",
    paperId: "paper-3",
    refereeId: "ref-3",
    paperTitle: "Title",
    paperSummary: "Summary",
    reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
    invitationStatus: "EXPIRED",
    resolvedAt: null,
    version: 1
  });

  const notPending = await useCase.execute({
    invitationId: "inv-3",
    refereeId: "ref-3",
    requestId: "req-4",
    body: { decision: "REJECT" }
  });
  assert.equal(notPending.outcome, "VALIDATION_FAILED");

  repo.seedInvitation({
    invitationId: "inv-4",
    paperId: "paper-4",
    refereeId: "ref-4",
    paperTitle: "Title",
    paperSummary: "Summary",
    reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
    invitationStatus: "PENDING",
    resolvedAt: null,
    version: 1
  });
  repo.setForceNextRecordingFailure(true);

  const recordingFailed = await useCase.execute({
    invitationId: "inv-4",
    refereeId: "ref-4",
    requestId: "req-5",
    body: { decision: "ACCEPT" }
  });
  assert.equal(recordingFailed.outcome, "RESPONSE_RECORDING_FAILED");

  const notFound = await useCase.execute({
    invitationId: "missing",
    refereeId: "ref-2",
    requestId: "req-6",
    body: { decision: "ACCEPT" }
  });
  assert.equal(notFound.outcome, "INVITATION_NOT_FOUND");

  const authz = await useCase.execute({
    invitationId: "inv-4",
    refereeId: "other-ref",
    requestId: "req-7",
    body: { decision: "ACCEPT" }
  });
  assert.equal(authz.outcome, "AUTHORIZATION_FAILED");
});

test("respond use case covers outer conflict and internal catch branches", async () => {
  const auditEvents: Array<Record<string, unknown>> = [];
  const audit = new ReviewInvitationAuditService({
    repository: {
      recordResponseAttempt: async (
        input: Omit<InvitationResponseAttemptRecord, "id" | "occurredAt">
      ) => {
        auditEvents.push(input as unknown as Record<string, unknown>);
      }
    } as any
  });

  const conflictUseCase = new RespondToReviewInvitationUseCase({
    repository: {
      withInvitationLock: async () => {
        throw new ReviewInvitationConflictError();
      }
    } as unknown as ReviewInvitationRepository,
    auditService: audit
  });

  const conflict = await conflictUseCase.execute({
    invitationId: "inv-conflict",
    refereeId: "ref-1",
    requestId: "req-conflict",
    body: { decision: "ACCEPT" }
  });
  assert.equal(conflict.outcome, "INVITATION_ALREADY_RESOLVED");

  const internalUseCase = new RespondToReviewInvitationUseCase({
    repository: {
      withInvitationLock: async () => {
        throw new Error("boom");
      }
    } as unknown as ReviewInvitationRepository,
    auditService: audit
  });

  const internal = await internalUseCase.execute({
    invitationId: "inv-internal",
    refereeId: "ref-1",
    requestId: "req-internal",
    body: { decision: "REJECT" }
  });
  assert.equal(internal.outcome, "INTERNAL_ERROR");

  const innerGenericUseCase = new RespondToReviewInvitationUseCase({
    repository: {
      withInvitationLock: async (_invitationId: string, operation: () => Promise<any>) => operation(),
      getInvitationById: async () => ({
        invitationId: "inv-inner",
        paperId: "paper-inner",
        refereeId: "ref-1",
        paperTitle: "Title",
        paperSummary: "Summary",
        reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
        responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
        invitationStatus: "PENDING",
        resolvedAt: null,
        version: 1
      }),
      recordInvitationDecision: async () => {
        throw new Error("inner failure");
      },
      snapshot: () => ({ invitations: [], attempts: [], assignments: [] }),
      restore: () => {},
      recordResponseAttempt: async () => {},
      getAssignmentsByInvitation: async () => [],
      getAssignmentsByReferee: async () => [],
      isEncryptedAtRest: () => true
    } as unknown as ReviewInvitationRepository,
    auditService: audit
  });

  const innerGeneric = await innerGenericUseCase.execute({
    invitationId: "inv-inner",
    refereeId: "ref-1",
    requestId: "req-inner",
    body: { decision: "ACCEPT" }
  });
  assert.equal(innerGeneric.outcome, "INTERNAL_ERROR");
});

test("error mapper default branches produce internal-error payloads", () => {
  const mappedGet = mapGetReviewInvitationOutcome({
    outcome: "INTERNAL_ERROR",
    code: "INTERNAL_ERROR",
    message: "x"
  });
  assert.equal(mappedGet.statusCode, 500);

  const mappedRespond = mapRespondToReviewInvitationOutcome({
    outcome: "INTERNAL_ERROR",
    code: "INTERNAL_ERROR",
    message: "y"
  });
  assert.equal(mappedRespond.statusCode, 500);

  const mappedNotFound = mapRespondToReviewInvitationOutcome({
    outcome: "INVITATION_NOT_FOUND",
    code: "INVITATION_NOT_FOUND",
    message: "missing"
  });
  assert.equal(mappedNotFound.statusCode, 404);

  const mappedGetDefault = mapGetReviewInvitationOutcome({
    outcome: "UNKNOWN"
  } as unknown as any);
  assert.equal(mappedGetDefault.statusCode, 500);

  const mappedRespondDefault = mapRespondToReviewInvitationOutcome({
    outcome: "UNKNOWN"
  } as unknown as any);
  assert.equal(mappedRespondDefault.statusCode, 500);
});

test("authorization guard handles authn/authz branches and success", async () => {
  class SessionRepo implements ReviewInvitationSessionRepository {
    constructor(private readonly mode: "missing" | "inactive" | "wrong-role" | "ok") {}

    async getSessionById() {
      if (this.mode === "missing") {
        return null;
      }

      if (this.mode === "inactive") {
        return {
          sessionId: "sess-1",
          accountId: "ref-1",
          role: "REFEREE",
          status: "EXPIRED" as const
        };
      }

      if (this.mode === "wrong-role") {
        return {
          sessionId: "sess-1",
          accountId: "ref-1",
          role: "EDITOR",
          status: "ACTIVE" as const
        };
      }

      return {
        sessionId: "sess-1",
        accountId: "ref-1",
        role: "REFEREE",
        status: "ACTIVE" as const
      };
    }
  }

  const unauthReq = { headers: {} } as any;
  const unauthReply = createReplyDouble();
  await createReviewInvitationAuthorization({ sessionRepository: new SessionRepo("missing") })(
    unauthReq,
    unauthReply as any
  );
  assert.equal(unauthReply.statusCode, 401);

  const inactiveReq = { headers: { cookie: "cms_session=sess-1" } } as any;
  const inactiveReply = createReplyDouble();
  await createReviewInvitationAuthorization({ sessionRepository: new SessionRepo("inactive") })(
    inactiveReq,
    inactiveReply as any
  );
  assert.equal(inactiveReply.statusCode, 401);

  const wrongRoleReq = { headers: { cookie: "cms_session=sess-1" } } as any;
  const wrongRoleReply = createReplyDouble();
  await createReviewInvitationAuthorization({ sessionRepository: new SessionRepo("wrong-role") })(
    wrongRoleReq,
    wrongRoleReply as any
  );
  assert.equal(wrongRoleReply.statusCode, 403);

  const nonSessionCookieReq = { headers: { cookie: "foo=bar" } } as any;
  const nonSessionCookieReply = createReplyDouble();
  await createReviewInvitationAuthorization({ sessionRepository: new SessionRepo("ok") })(
    nonSessionCookieReq,
    nonSessionCookieReply as any
  );
  assert.equal(nonSessionCookieReply.statusCode, 401);

  const blankSessionCookieReq = { headers: { cookie: "cms_session=   " } } as any;
  const blankSessionCookieReply = createReplyDouble();
  await createReviewInvitationAuthorization({ sessionRepository: new SessionRepo("ok") })(
    blankSessionCookieReq,
    blankSessionCookieReply as any
  );
  assert.equal(blankSessionCookieReply.statusCode, 401);

  const okReq = { headers: { cookie: "cms_session=sess-1" } } as any;
  const okReply = createReplyDouble();
  await createReviewInvitationAuthorization({ sessionRepository: new SessionRepo("ok") })(
    okReq,
    okReply as any
  );
  assert.equal(okReq.reviewInvitationAuth.refereeId, "ref-1");
});

test("transport security guard rejects non-https and accepts https", async () => {
  const rejectReply = createReplyDouble();
  await requireReviewInvitationTransportSecurity({ headers: {} } as any, rejectReply as any);
  assert.equal(rejectReply.statusCode, 426);

  const passReply = createReplyDouble();
  await requireReviewInvitationTransportSecurity(
    { headers: { "x-forwarded-proto": "https" } } as any,
    passReply as any
  );
  assert.equal(passReply.statusCode, 200);
});

test("handlers return 401 when auth context is missing", async () => {
  const getHandler = createGetReviewInvitationHandler({
    useCase: {
      execute: async () => ({
        outcome: "INVITATION_NOT_FOUND",
        code: "INVITATION_NOT_FOUND",
        message: "missing"
      })
    }
  });

  const postHandler = createPostReviewInvitationResponseHandler({
    useCase: {
      execute: async () => ({
        outcome: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "x"
      })
    }
  });

  const getReply = createReplyDouble();
  await getHandler({ params: { invitationId: "inv-1" } } as any, getReply as any);
  assert.equal(getReply.statusCode, 401);

  const postReply = createReplyDouble();
  await postHandler({ params: { invitationId: "inv-1" } } as any, postReply as any);
  assert.equal(postReply.statusCode, 401);

  const getWithAuthReply = createReplyDouble();
  await getHandler(
    {
      reviewInvitationAuth: { refereeId: "ref-1", sessionId: "sess-1" },
      params: {},
      id: "req-1"
    } as any,
    getWithAuthReply as any
  );
  assert.equal(getWithAuthReply.statusCode, 404);

  const postWithAuthReply = createReplyDouble();
  await postHandler(
    {
      reviewInvitationAuth: { refereeId: "ref-1", sessionId: "sess-1" },
      params: {},
      body: { decision: "ACCEPT" },
      id: "req-2"
    } as any,
    postWithAuthReply as any
  );
  assert.equal(postWithAuthReply.statusCode, 500);
});

test("audit service redacts sensitive keys and emits when configured", async () => {
  const repository = new PrismaReviewInvitationRepository();
  const emitted: Array<Record<string, unknown>> = [];
  const audit = new ReviewInvitationAuditService({
    repository,
    emit: (event) => emitted.push(event)
  });

  const redacted = redactReviewInvitationAuditContext({
    reviewerDisplayName: "name",
    paperSummary: "summary",
    requestId: "req-1"
  });

  assert.equal(redacted.reviewerDisplayName, "[REDACTED]");
  assert.equal(redacted.paperSummary, "[REDACTED]");
  assert.equal(redacted.requestId, "req-1");

  await audit.recordOutcome({
    requestId: "req-1",
    invitationId: "inv-1",
    refereeId: "ref-1",
    decision: "REJECT",
    outcome: "SUCCESS_REJECTED",
    reasonCode: "INVITATION_REJECTED"
  });

  assert.equal(emitted.length, 1);
  assert.equal(repository.getAllAttempts().length, 1);
});

test("prisma review invitation repository utility branches and contract marker are covered", async () => {
  const repo = new PrismaReviewInvitationRepository();
  assert.equal(REVIEW_INVITATION_REPOSITORY_CONTRACT, "review_invitation_repository_contract_marker");

  repo.seedInvitation({
    invitationId: "inv-5",
    paperId: "paper-5",
    refereeId: "ref-5",
    paperTitle: "Title",
    paperSummary: "Summary",
    reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
    invitationStatus: "PENDING",
    resolvedAt: null,
    version: 1
  });

  repo.setForceLockConflict(true);
  await assert.rejects(
    () => repo.withInvitationLock("inv-5", async () => "x"),
    (error: unknown) => error instanceof ReviewInvitationConflictError
  );
  repo.setForceLockConflict(false);

  const lockResult = await repo.withInvitationLock("inv-5", async () => "ok");
  assert.equal(lockResult, "ok");
  assert.equal(repo.getMaxObservedInvitationConcurrency("inv-5"), 1);
  assert.equal(repo.getMaxObservedInvitationConcurrency("inv-unknown"), 0);

  const cleanupFallback = await repo.withInvitationLock("inv-5", async () => {
    ((repo as unknown as { activeLocks: Map<string, number> }).activeLocks).delete("inv-5");
    return "cleanup-fallback";
  });
  assert.equal(cleanupFallback, "cleanup-fallback");

  const accepted = await repo.recordInvitationDecision({
    invitationId: "inv-5",
    decision: "ACCEPT",
    refereeId: "ref-5"
  });
  assert.equal(accepted.assignmentCreated, true);

  await assert.rejects(
    () => repo.recordInvitationDecision({ invitationId: "inv-5", decision: "REJECT", refereeId: "ref-5" }),
    (error: unknown) => error instanceof ReviewInvitationConflictError
  );

  repo.seedInvitation({
    invitationId: "inv-6",
    paperId: "paper-6",
    refereeId: "ref-6",
    paperTitle: "Title",
    paperSummary: "Summary",
    reviewDueAt: new Date("2026-03-20T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-03-10T00:00:00.000Z"),
    invitationStatus: "EXPIRED",
    resolvedAt: null,
    version: 1
  });

  await assert.rejects(
    () => repo.recordInvitationDecision({ invitationId: "inv-6", decision: "REJECT", refereeId: "ref-6" }),
    (error: unknown) => error instanceof ReviewInvitationNotPendingError
  );

  await assert.rejects(
    () => repo.recordInvitationDecision({ invitationId: "missing", decision: "REJECT", refereeId: "ref-6" }),
    /INVITATION_NOT_FOUND/
  );

  await assert.rejects(
    () => repo.recordInvitationDecision({ invitationId: "inv-6", decision: "REJECT", refereeId: "other-ref" }),
    /AUTHORIZATION_FAILED/
  );

  repo.setForceNextReadFailure(true);
  await assert.rejects(() => repo.getInvitationById("inv-6"));

  const snapshot = repo.snapshot();
  repo.restore(snapshot);
  assert.equal(repo.isEncryptedAtRest(), true);

  const repoAsContract: ReviewInvitationRepository = repo;
  assert.equal(typeof repoAsContract.snapshot, "function");
});
