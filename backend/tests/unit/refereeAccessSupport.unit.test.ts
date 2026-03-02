import assert from "node:assert/strict";
import test from "node:test";

import { AccessAssignedPaperService } from "../../src/business/referee-access/accessAssignedPaperService.js";
import { AssignmentAuthorizationValidator } from "../../src/business/referee-access/assignmentAuthorization.js";
import { ListAssignmentsService } from "../../src/business/referee-access/listAssignmentsService.js";
import {
  AssignedPaperAuditRepository,
  redactAssignedPaperAuditPayload
} from "../../src/data/referee-access/assignedPaperAuditRepository.js";
import {
  ASSIGNED_PAPER_REPOSITORY_CONTRACT,
  PrismaAssignedPaperRepository,
  type RefereeAssignmentRecord
} from "../../src/data/referee-access/assignedPaperRepository.js";
import { createGetAssignmentsRoute } from "../../src/presentation/referee-access/getAssignmentsRoute.js";
import { createPostAssignmentAccessRoute } from "../../src/presentation/referee-access/postAssignmentAccessRoute.js";
import {
  AccessGrantedResponseSchema,
  AssignmentListResponseSchema,
  RefereeAccessErrorResponseSchema,
  buildSessionExpiredResponse,
  mapAccessAssignedPaperOutcome,
  mapListAssignmentsOutcome
} from "../../src/presentation/referee-access/refereeAccessErrorHandler.js";
import { createRefereeAccessRoutes } from "../../src/presentation/referee-access/refereeAccessRoutes.js";
import {
  createRefereeSessionGuard,
  type RefereeSessionRepository
} from "../../src/security/sessionGuard.js";
import { requireRefereeAccessTls } from "../../src/security/transportPolicy.js";
import { REFEREE_ACCESS_OUTCOMES } from "../../src/shared/accessOutcomes.js";

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

function seedDefaultAssignment(repo: PrismaAssignedPaperRepository, overrides: Partial<RefereeAssignmentRecord> = {}) {
  repo.seedAssignment({
    id: "10900000-0000-4000-8000-000000000901",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    paperId: "20900000-0000-4000-8000-000000000901",
    reviewFormId: "30900000-0000-4000-8000-000000000901",
    status: "ACTIVE",
    invitationStatus: "ACCEPTED",
    assignedAt: new Date("2026-03-20T00:00:00.000Z"),
    updatedAt: new Date("2026-03-20T00:00:00.000Z"),
    ...overrides
  });
  repo.seedPaperResource({
    paperId: "20900000-0000-4000-8000-000000000901",
    title: "Paper title",
    abstractPreview: "summary",
    fileObjectKey: "papers/key.pdf",
    contentUrl: "https://example.test/paper",
    availability: "AVAILABLE",
    lastAvailabilityCheckAt: new Date("2026-03-20T00:00:00.000Z")
  });
  repo.seedReviewForm({
    reviewFormId: "30900000-0000-4000-8000-000000000901",
    paperId: "20900000-0000-4000-8000-000000000901",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    schemaVersion: "v1",
    formUrl: "https://example.test/form",
    status: "READY"
  });
}

test("assignment authorization validator covers list visibility and direct-access branches", () => {
  const validator = new AssignmentAuthorizationValidator();

  assert.equal(
    validator.isListVisible({
      assignmentId: "1",
      paperId: "2",
      title: "Title",
      availability: "AVAILABLE",
      status: "ACTIVE",
      invitationStatus: "ACCEPTED"
    }),
    true
  );
  assert.equal(
    validator.isListVisible({
      assignmentId: "1",
      paperId: "2",
      title: "Title",
      availability: "AVAILABLE",
      status: "REVOKED",
      invitationStatus: "ACCEPTED"
    }),
    false
  );
  assert.equal(
    validator.isListVisible({
      assignmentId: "1",
      paperId: "2",
      title: "Title",
      availability: "AVAILABLE",
      status: "ACTIVE",
      invitationStatus: "PENDING"
    }),
    false
  );

  const missing = validator.evaluateDirectAccess(null, "ref");
  assert.equal(missing.authorized, false);
  if (!missing.authorized) {
    assert.equal(missing.outcome, REFEREE_ACCESS_OUTCOMES.UNAVAILABLE_OR_NOT_FOUND);
  }

  const nonOwner = validator.evaluateDirectAccess(
    {
      id: "a",
      refereeUserId: "owner",
      paperId: "p",
      reviewFormId: "f",
      status: "ACTIVE",
      invitationStatus: "ACCEPTED",
      assignedAt: new Date(),
      updatedAt: new Date()
    },
    "other"
  );
  assert.equal(nonOwner.authorized, false);
  if (!nonOwner.authorized) {
    assert.equal(nonOwner.outcome, REFEREE_ACCESS_OUTCOMES.UNAVAILABLE_OR_NOT_FOUND);
  }

  const invitationNotAccepted = validator.evaluateDirectAccess(
    {
      id: "a",
      refereeUserId: "owner",
      paperId: "p",
      reviewFormId: "f",
      status: "ACTIVE",
      invitationStatus: "REJECTED",
      assignedAt: new Date(),
      updatedAt: new Date()
    },
    "owner"
  );
  assert.equal(invitationNotAccepted.authorized, false);
  if (!invitationNotAccepted.authorized) {
    assert.equal(invitationNotAccepted.outcome, REFEREE_ACCESS_OUTCOMES.UNAVAILABLE);
  }

  const assignmentNotActive = validator.evaluateDirectAccess(
    {
      id: "a",
      refereeUserId: "owner",
      paperId: "p",
      reviewFormId: "f",
      status: "UNAVAILABLE",
      invitationStatus: "ACCEPTED",
      assignedAt: new Date(),
      updatedAt: new Date()
    },
    "owner"
  );
  assert.equal(assignmentNotActive.authorized, false);
  if (!assignmentNotActive.authorized) {
    assert.equal(assignmentNotActive.outcome, REFEREE_ACCESS_OUTCOMES.UNAVAILABLE);
  }

  assert.equal(
    validator.evaluateDirectAccess(
      {
        id: "a",
        refereeUserId: "owner",
        paperId: "p",
        reviewFormId: "f",
        status: "ACTIVE",
        invitationStatus: "ACCEPTED",
        assignedAt: new Date(),
        updatedAt: new Date()
      },
      "owner"
    ).authorized,
    true
  );
});

test("list assignments service covers available/no-assignment/internal branches", async () => {
  const repo = new PrismaAssignedPaperRepository();
  const auditRepository = new AssignedPaperAuditRepository();
  const validator = new AssignmentAuthorizationValidator();
  seedDefaultAssignment(repo);

  const service = new ListAssignmentsService({
    repository: repo,
    auditRepository,
    authorizationValidator: validator
  });

  const available = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    requestId: "req-1"
  });
  assert.equal(available.outcome, "ASSIGNMENTS_AVAILABLE");
  if (available.outcome === "ASSIGNMENTS_AVAILABLE") {
    assert.equal(available.items.length, 1);
  }

  const none = await service.execute({
    refereeUserId: "missing-user",
    requestId: "req-2"
  });
  assert.equal(none.outcome, "NO_ASSIGNMENTS");
  assert.equal(auditRepository.list().some((event) => event.outcome === "NO_ASSIGNMENTS"), true);

  repo.setForceNextListFailure(true);
  const internal = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    requestId: "req-3"
  });
  assert.equal(internal.outcome, "INTERNAL_ERROR");
});

test("access assigned paper service covers success and denial branches", async () => {
  const repo = new PrismaAssignedPaperRepository();
  const auditRepository = new AssignedPaperAuditRepository();
  const validator = new AssignmentAuthorizationValidator();
  seedDefaultAssignment(repo);

  const service = new AccessAssignedPaperService({
    repository: repo,
    auditRepository,
    authorizationValidator: validator
  });

  const success = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "10900000-0000-4000-8000-000000000901",
    requestId: "req-ok"
  });
  assert.equal(success.outcome, "ACCESS_GRANTED");

  const missing = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "missing",
    requestId: "req-missing"
  });
  assert.equal(missing.outcome, "UNAVAILABLE_OR_NOT_FOUND");

  const nonOwner = await service.execute({
    refereeUserId: "other",
    assignmentId: "10900000-0000-4000-8000-000000000901",
    requestId: "req-non-owner"
  });
  assert.equal(nonOwner.outcome, "UNAVAILABLE_OR_NOT_FOUND");

  repo.seedAssignment({
    id: "10900000-0000-4000-8000-000000000902",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    paperId: "20900000-0000-4000-8000-000000000901",
    reviewFormId: "30900000-0000-4000-8000-000000000901",
    status: "UNAVAILABLE",
    invitationStatus: "ACCEPTED",
    assignedAt: new Date("2026-03-20T00:00:00.000Z"),
    updatedAt: new Date("2026-03-20T00:00:00.000Z")
  });
  const unavailableByAssignment = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "10900000-0000-4000-8000-000000000902",
    requestId: "req-unavailable-assignment"
  });
  assert.equal(unavailableByAssignment.outcome, "UNAVAILABLE");

  repo.seedPaperResource({
    paperId: "20900000-0000-4000-8000-000000000902",
    title: "Unavailable paper",
    fileObjectKey: "papers/unavailable.pdf",
    contentUrl: "https://example.test/unavailable-paper",
    availability: "UNAVAILABLE",
    lastAvailabilityCheckAt: new Date("2026-03-20T00:00:00.000Z")
  });
  repo.seedReviewForm({
    reviewFormId: "30900000-0000-4000-8000-000000000902",
    paperId: "20900000-0000-4000-8000-000000000902",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    schemaVersion: "v1",
    formUrl: "https://example.test/unavailable-form",
    status: "READY"
  });
  repo.seedAssignment({
    id: "10900000-0000-4000-8000-000000000903",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    paperId: "20900000-0000-4000-8000-000000000902",
    reviewFormId: "30900000-0000-4000-8000-000000000902",
    status: "ACTIVE",
    invitationStatus: "ACCEPTED",
    assignedAt: new Date("2026-03-20T00:00:00.000Z"),
    updatedAt: new Date("2026-03-20T00:00:00.000Z")
  });
  const unavailableByPaper = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "10900000-0000-4000-8000-000000000903",
    requestId: "req-unavailable-paper"
  });
  assert.equal(unavailableByPaper.outcome, "UNAVAILABLE");

  repo.seedPaperResource({
    paperId: "20900000-0000-4000-8000-000000000903",
    title: "Form unavailable paper",
    fileObjectKey: "papers/form-unavailable.pdf",
    contentUrl: "https://example.test/form-unavailable-paper",
    availability: "AVAILABLE",
    lastAvailabilityCheckAt: new Date("2026-03-20T00:00:00.000Z")
  });
  repo.seedReviewForm({
    reviewFormId: "30900000-0000-4000-8000-000000000903",
    paperId: "20900000-0000-4000-8000-000000000903",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    schemaVersion: "v1",
    formUrl: "https://example.test/form-unavailable",
    status: "UNAVAILABLE"
  });
  repo.seedAssignment({
    id: "10900000-0000-4000-8000-000000000904",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    paperId: "20900000-0000-4000-8000-000000000903",
    reviewFormId: "30900000-0000-4000-8000-000000000903",
    status: "ACTIVE",
    invitationStatus: "ACCEPTED",
    assignedAt: new Date("2026-03-20T00:00:00.000Z"),
    updatedAt: new Date("2026-03-20T00:00:00.000Z")
  });
  const unavailableByForm = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "10900000-0000-4000-8000-000000000904",
    requestId: "req-unavailable-form"
  });
  assert.equal(unavailableByForm.outcome, "UNAVAILABLE");
  assert.equal(auditRepository.list().some((event) => event.outcome === "FORM_UNAVAILABLE"), true);

  repo.setForceNextAccessFailure(true);
  const internal = await service.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "10900000-0000-4000-8000-000000000901",
    requestId: "req-internal"
  });
  assert.equal(internal.outcome, "INTERNAL_ERROR");

  // Defensive fallback: authorization layer should normally deny null assignments,
  // but service still protects against an impossible authorized/null combination.
  const impossibleAuthorizationService = new AccessAssignedPaperService({
    repository: {
      listAssignmentsForReferee: async () => [],
      getAssignmentById: async () => null,
      getPaperAccessResource: async () => null,
      getReviewFormAccess: async () => null
    },
    auditRepository,
    authorizationValidator: {
      isListVisible: () => true,
      evaluateDirectAccess: () => ({ authorized: true })
    } as unknown as AssignmentAuthorizationValidator
  });
  const impossibleAuthorization = await impossibleAuthorizationService.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "impossible-assignment",
    requestId: "req-impossible"
  });
  assert.equal(impossibleAuthorization.outcome, "UNAVAILABLE_OR_NOT_FOUND");

  const unavailableWithoutAssignmentService = new AccessAssignedPaperService({
    repository: {
      listAssignmentsForReferee: async () => [],
      getAssignmentById: async () => null,
      getPaperAccessResource: async () => null,
      getReviewFormAccess: async () => null
    },
    auditRepository,
    authorizationValidator: {
      isListVisible: () => true,
      evaluateDirectAccess: () => ({
        authorized: false,
        outcome: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE,
        reasonCode: "ASSIGNMENT_INACTIVE"
      })
    } as unknown as AssignmentAuthorizationValidator
  });
  const unavailableWithoutAssignment = await unavailableWithoutAssignmentService.execute({
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    assignmentId: "missing-unavailable",
    requestId: "req-missing-unavailable"
  });
  assert.equal(unavailableWithoutAssignment.outcome, "UNAVAILABLE");
});

test("referee access error handler schemas and default branches are covered", () => {
  assert.equal(
    AssignmentListResponseSchema.safeParse({
      items: [],
      messageCode: "NO_ASSIGNMENTS"
    }).success,
    true
  );
  assert.equal(
    AccessGrantedResponseSchema.safeParse({
      messageCode: "ACCESS_GRANTED",
      paper: {
        paperId: "paper-1",
        title: "Title",
        contentUrl: "https://example.test/paper"
      },
      reviewForm: {
        reviewFormId: "form-1",
        schemaVersion: "v1",
        formUrl: "https://example.test/form"
      }
    }).success,
    true
  );

  const sessionExpired = buildSessionExpiredResponse();
  assert.equal(sessionExpired.statusCode, 401);
  assert.equal(RefereeAccessErrorResponseSchema.safeParse(sessionExpired.body).success, true);

  const listMapped = mapListAssignmentsOutcome({
    outcome: "INTERNAL_ERROR",
    messageCode: "INTERNAL_ERROR",
    message: "x"
  });
  assert.equal(listMapped.statusCode, 500);

  const listDefault = mapListAssignmentsOutcome({ outcome: "UNKNOWN" } as unknown as any);
  assert.equal(listDefault.statusCode, 500);

  const accessMapped = mapAccessAssignedPaperOutcome({
    outcome: "INTERNAL_ERROR",
    messageCode: "INTERNAL_ERROR",
    message: "y"
  });
  assert.equal(accessMapped.statusCode, 500);

  const accessDefault = mapAccessAssignedPaperOutcome({ outcome: "UNKNOWN" } as unknown as any);
  assert.equal(accessDefault.statusCode, 500);
});

test("session guard and transport policy branches are covered", async () => {
  class SessionRepo implements RefereeSessionRepository {
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
          accountId: "ed-1",
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

  const missingReq = { headers: {} } as any;
  const missingReply = createReplyDouble();
  await createRefereeSessionGuard({ sessionRepository: new SessionRepo("missing") })(
    missingReq,
    missingReply as any
  );
  assert.equal(missingReply.statusCode, 401);

  const inactiveReq = { headers: { cookie: "session=sess-1" } } as any;
  const inactiveReply = createReplyDouble();
  await createRefereeSessionGuard({ sessionRepository: new SessionRepo("inactive") })(
    inactiveReq,
    inactiveReply as any
  );
  assert.equal(inactiveReply.statusCode, 401);

  const wrongRoleReq = { headers: { cookie: "session=sess-1" } } as any;
  const wrongRoleReply = createReplyDouble();
  await createRefereeSessionGuard({ sessionRepository: new SessionRepo("wrong-role") })(
    wrongRoleReq,
    wrongRoleReply as any
  );
  assert.equal(wrongRoleReply.statusCode, 401);

  const cmsSessionReq = { headers: { cookie: "cms_session=sess-1" } } as any;
  const cmsSessionReply = createReplyDouble();
  await createRefereeSessionGuard({ sessionRepository: new SessionRepo("ok") })(
    cmsSessionReq,
    cmsSessionReply as any
  );
  assert.equal(cmsSessionReq.refereeSession.refereeUserId, "ref-1");

  const mixedCookieReq = { headers: { cookie: "theme=light; session=sess-1" } } as any;
  const mixedCookieReply = createReplyDouble();
  await createRefereeSessionGuard({ sessionRepository: new SessionRepo("ok") })(
    mixedCookieReq,
    mixedCookieReply as any
  );
  assert.equal(mixedCookieReq.refereeSession.refereeUserId, "ref-1");

  const blankSessionReq = { headers: { cookie: "session=   " } } as any;
  const blankSessionReply = createReplyDouble();
  await createRefereeSessionGuard({ sessionRepository: new SessionRepo("ok") })(
    blankSessionReq,
    blankSessionReply as any
  );
  assert.equal(blankSessionReply.statusCode, 401);

  const tlsRejectReply = createReplyDouble();
  await requireRefereeAccessTls({ headers: {} } as any, tlsRejectReply as any);
  assert.equal(tlsRejectReply.statusCode, 426);

  const tlsPassReply = createReplyDouble();
  await requireRefereeAccessTls(
    { headers: { "x-forwarded-proto": "https" } } as any,
    tlsPassReply as any
  );
  assert.equal(tlsPassReply.statusCode, 200);
});

test("referee access route handlers and route plugin wiring are covered", async () => {
  const getRoute = createGetAssignmentsRoute({
    listAssignmentsService: {
      execute: async () => ({
        outcome: "ASSIGNMENTS_AVAILABLE",
        messageCode: "ASSIGNMENTS_AVAILABLE",
        items: []
      })
    }
  });
  const postRoute = createPostAssignmentAccessRoute({
    accessAssignedPaperService: {
      execute: async () => ({
        outcome: "UNAVAILABLE_OR_NOT_FOUND",
        messageCode: "UNAVAILABLE_OR_NOT_FOUND",
        message: "unavailable"
      })
    }
  });

  const missingGetReply = createReplyDouble();
  await getRoute({ id: "req-1" } as any, missingGetReply as any);
  assert.equal(missingGetReply.statusCode, 401);

  const okGetReply = createReplyDouble();
  await getRoute(
    {
      id: "req-2",
      refereeSession: { refereeUserId: "ref-1", sessionId: "sess-1" }
    } as any,
    okGetReply as any
  );
  assert.equal(okGetReply.statusCode, 200);

  const missingPostReply = createReplyDouble();
  await postRoute({ id: "req-3", params: {} } as any, missingPostReply as any);
  assert.equal(missingPostReply.statusCode, 401);

  const okPostReply = createReplyDouble();
  await postRoute(
    {
      id: "req-4",
      params: {},
      refereeSession: { refereeUserId: "ref-1", sessionId: "sess-1" }
    } as any,
    okPostReply as any
  );
  assert.equal(okPostReply.statusCode, 404);

  const routes = createRefereeAccessRoutes({
    listAssignmentsService: {
      execute: async () => ({
        outcome: "NO_ASSIGNMENTS",
        messageCode: "NO_ASSIGNMENTS",
        items: []
      })
    },
    accessAssignedPaperService: {
      execute: async () => ({
        outcome: "UNAVAILABLE",
        messageCode: "UNAVAILABLE",
        message: "x",
        items: []
      })
    },
    refereeSessionGuard: async () => {}
  });
  assert.equal(typeof routes, "function");
});

test("assigned paper repository and audit repository utility branches are covered", async () => {
  const repo = new PrismaAssignedPaperRepository();
  assert.equal(ASSIGNED_PAPER_REPOSITORY_CONTRACT, "assigned_paper_repository_contract_marker");
  seedDefaultAssignment(repo);

  const listed = await repo.listAssignmentsForReferee("40900000-0000-4000-8000-000000000901");
  assert.equal(listed.length, 1);

  repo.seedAssignment({
    id: "10900000-0000-4000-8000-000000000905",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    paperId: "20900000-0000-4000-8000-000000000905",
    reviewFormId: "30900000-0000-4000-8000-000000000905",
    status: "ACTIVE",
    invitationStatus: "ACCEPTED",
    assignedAt: new Date("2026-03-21T00:00:00.000Z"),
    updatedAt: new Date("2026-03-21T00:00:00.000Z")
  });
  repo.seedReviewForm({
    reviewFormId: "30900000-0000-4000-8000-000000000905",
    paperId: "20900000-0000-4000-8000-000000000905",
    refereeUserId: "40900000-0000-4000-8000-000000000901",
    schemaVersion: "v1",
    formUrl: "https://example.test/form-default-title",
    status: "READY"
  });
  const withFallbackTitle = await repo.listAssignmentsForReferee("40900000-0000-4000-8000-000000000901");
  const fallbackTitleItem = withFallbackTitle.find(
    (item) => item.assignmentId === "10900000-0000-4000-8000-000000000905"
  );
  assert.equal(fallbackTitleItem?.title, "Assigned paper");

  const assignment = await repo.getAssignmentById("10900000-0000-4000-8000-000000000901");
  assert.equal(assignment?.id, "10900000-0000-4000-8000-000000000901");
  assert.equal(await repo.getAssignmentById("missing"), null);
  assert.equal(
    (await repo.getPaperAccessResource("20900000-0000-4000-8000-000000000901"))?.paperId,
    "20900000-0000-4000-8000-000000000901"
  );
  assert.equal(await repo.getPaperAccessResource("missing"), null);
  assert.equal(
    (await repo.getReviewFormAccess("30900000-0000-4000-8000-000000000901"))?.reviewFormId,
    "30900000-0000-4000-8000-000000000901"
  );
  assert.equal(await repo.getReviewFormAccess("missing"), null);

  repo.setForceNextListFailure(true);
  await assert.rejects(
    () => repo.listAssignmentsForReferee("40900000-0000-4000-8000-000000000901"),
    /forced assignment list failure/
  );
  repo.setForceNextAccessFailure(true);
  await assert.rejects(
    () => repo.getAssignmentById("10900000-0000-4000-8000-000000000901"),
    /forced assignment access failure/
  );

  const snapshot = repo.snapshot();
  repo.restore(snapshot);
  assert.equal(repo.isEncryptedAtRest(), true);

  const emitted: Array<Record<string, unknown>> = [];
  const audit = new AssignedPaperAuditRepository({
    emit: (event) => emitted.push(event)
  });
  await audit.record({
    actorUserId: "ref-1",
    assignmentId: "assignment-1",
    paperId: "paper-1",
    outcome: "SUCCESS",
    reasonCode: "ACCESS_GRANTED"
  });
  assert.equal(audit.list().length, 1);
  assert.equal(emitted.length, 1);

  const redacted = redactAssignedPaperAuditPayload({
    fileObjectKey: "secret",
    contentUrl: "https://secret",
    reviewFormUrl: "https://secret-form",
    actorUserId: "ref-1"
  });
  assert.equal(redacted.fileObjectKey, "[REDACTED]");
  assert.equal(redacted.contentUrl, "[REDACTED]");
  assert.equal(redacted.reviewFormUrl, "[REDACTED]");
  assert.equal(redacted.actorUserId, "ref-1");
});
