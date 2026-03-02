import assert from "node:assert/strict";
import test from "node:test";

import {
  FINAL_DECISION_AUDIT_LOGGER_MARKER,
  DecisionAuditLogger
} from "../../src/business/final-decision/audit-logger.js";
import {
  FINAL_DECISION_AUTHOR_NOTIFIER_MARKER,
  DecisionAuthorNotifier
} from "../../src/business/final-decision/author-notifier.js";
import { DecisionCompletionGate } from "../../src/business/final-decision/completion-gate.js";
import {
  FINAL_DECISION_OUTCOMES,
  FINAL_DECISION_REASON_CODES
} from "../../src/business/final-decision/decision-outcome.js";
import {
  DecisionFinalizedError,
  DecisionImmutabilityGuard
} from "../../src/business/final-decision/immutability-guard.js";
import {
  FINAL_DECISION_PORTS_MARKER,
  type DecisionAuditEvent,
  type DecisionCompletionStatusRecord,
  type FinalDecisionRepository
} from "../../src/business/final-decision/ports.js";
import { PostFinalDecisionService } from "../../src/business/final-decision/post-final-decision.service.js";
import {
  FINAL_DECISION_AUDIT_REPOSITORY_MARKER,
  FINAL_DECISION_PRISMA_REPOSITORY_MARKER,
  FinalDecisionAuditRepository,
  FinalDecisionConflictError,
  FinalDecisionReadFailureError,
  PrismaFinalDecisionRepository
} from "../../src/data/final-decision/final-decision.repository.js";
import {
  DecisionBlockedResponseSchema,
  DecisionRecordedResponseSchema,
  FinalDecisionErrorResponseSchema,
  buildFinalDecisionSessionExpiredResponse,
  mapPostFinalDecisionOutcome
} from "../../src/presentation/final-decision/error-mapper.js";
import { createPostFinalDecisionHandler } from "../../src/presentation/final-decision/post-final-decision.handler.js";
import {
  createFinalDecisionRoutes,
  requireFinalDecisionTransportSecurity
} from "../../src/presentation/final-decision/routes.js";
import {
  createFinalDecisionSessionGuard,
  type FinalDecisionSessionRecord,
  type FinalDecisionSessionRepository
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

function buildCompletionStatus(
  overrides: Partial<DecisionCompletionStatusRecord> = {}
): DecisionCompletionStatusRecord {
  return {
    paperId: "paper-1",
    authorUserId: "author-1",
    completedReviewCount: 2,
    requiredReviewCount: 2,
    status: "COMPLETE",
    checkedAt: new Date("2026-03-02T00:00:00.000Z"),
    ...overrides
  };
}

test("completion gate covers pending-by-status, pending-by-count, and complete branches", () => {
  const gate = new DecisionCompletionGate();

  const pendingByStatus = gate.evaluate(buildCompletionStatus({ status: "PENDING" }));
  assert.equal(pendingByStatus.allowed, false);

  const pendingByCount = gate.evaluate(
    buildCompletionStatus({
      status: "COMPLETE",
      completedReviewCount: 1,
      requiredReviewCount: 2
    })
  );
  assert.equal(pendingByCount.allowed, false);

  const complete = gate.evaluate(buildCompletionStatus());
  assert.equal(complete.allowed, true);
});

test("author notifier covers force-failure toggle and dispatch cloning", async () => {
  const notifier = new DecisionAuthorNotifier();

  const first = await notifier.notifyAuthor({
    authorUserId: "author-1",
    paperId: "paper-1",
    decision: "ACCEPT",
    decidedAt: "2026-03-02T00:00:00.000Z"
  });
  assert.equal(first, "NOTIFIED");

  notifier.setForceFailure(true);

  const second = await notifier.notifyAuthor({
    authorUserId: "author-1",
    paperId: "paper-1",
    decision: "REJECT",
    decidedAt: "2026-03-02T00:01:00.000Z"
  });
  assert.equal(second, "NOTIFICATION_FAILED");

  const copy = notifier.getDispatches();
  assert.equal(copy.length, 2);

  copy[0]!.paperId = "mutated";
  assert.equal(notifier.getDispatches()[0]!.paperId, "paper-1");
});

test("audit logger sanitizes sensitive metadata and supports empty metadata", async () => {
  const captured: DecisionAuditEvent[] = [];
  const auditRepository = new FinalDecisionAuditRepository({
    emit: (event) => {
      captured.push(event);
    }
  });
  const logger = new DecisionAuditLogger({ repository: auditRepository });

  await logger.record({
    actorUserId: "editor-1",
    paperId: "paper-1",
    outcome: "DECISION_RECORDED",
    reasonCode: "notified",
    metadata: {
      requestPayload: { decision: "ACCEPT" },
      authorUserId: "author-secret",
      keep: true
    }
  });

  await logger.record({
    actorUserId: "editor-1",
    paperId: "paper-2",
    outcome: "UNAVAILABLE_DENIED",
    reasonCode: "paper-not-found"
  });

  await auditRepository.record({
    actorUserId: "editor-1",
    paperId: "paper-3",
    outcome: "UNAVAILABLE_DENIED",
    reasonCode: "direct-record",
    metadata: {
      authorUserId: "author-direct",
      requestPayload: { decision: "ACCEPT" }
    }
  });

  const events = auditRepository.list();
  assert.equal(events.length, 3);
  assert.equal(events[0]?.metadata.requestPayload, "[REDACTED]");
  assert.equal("authorUserId" in (events[0]?.metadata ?? {}), false);
  assert.equal(events[0]?.metadata.keep, true);
  assert.deepEqual(events[1]?.metadata, {});
  assert.equal("authorUserId" in (events[2]?.metadata ?? {}), false);
  assert.equal(events[2]?.metadata.requestPayload, "[REDACTED]");
  assert.equal(captured.length, 3);
  assert.equal(auditRepository.isEncryptedAtRest(), true);
});

test("final decision repository covers lock/read/write/failure branches", async () => {
  const repository = new PrismaFinalDecisionRepository({
    nowProvider: () => new Date("2026-03-02T10:00:00.000Z")
  });

  repository.seedPaper({
    paperId: "paper-complete",
    authorUserId: "author-1",
    assignedEditorIds: ["editor-1"],
    requiredReviewCount: 2,
    completedReviewCount: 2
  });

  repository.seedPaper({
    paperId: "paper-pending",
    authorUserId: "author-2",
    assignedEditorIds: ["editor-1"],
    requiredReviewCount: 3,
    completedReviewCount: 1
  });

  const complete = await repository.getDecisionCompletionStatus("paper-complete", "editor-1");
  assert.equal(complete?.status, "COMPLETE");

  const pending = await repository.getDecisionCompletionStatus("paper-pending", "editor-1");
  assert.equal(pending?.status, "PENDING");

  const denied = await repository.getDecisionCompletionStatus("paper-complete", "editor-2");
  assert.equal(denied, null);

  repository.setForceNextReadFailure(true);
  await assert.rejects(
    () => repository.getDecisionCompletionStatus("paper-complete", "editor-1"),
    {
      name: "FinalDecisionReadFailureError"
    }
  );

  const recorded = await repository.recordFinalDecision({
    paperId: "paper-complete",
    decision: "ACCEPT",
    decidedByEditorId: "editor-1"
  });
  assert.equal(recorded.decision, "ACCEPT");

  const fetched = await repository.getFinalDecision("paper-complete");
  assert.equal(fetched?.isFinal, true);

  await assert.rejects(
    () =>
      repository.recordFinalDecision({
        paperId: "paper-complete",
        decision: "REJECT",
        decidedByEditorId: "editor-1"
      }),
    {
      name: "FinalDecisionConflictError"
    }
  );

  repository.setForceLockConflict(true);
  await assert.rejects(() => repository.withPaperDecisionLock("paper-complete", async () => "ok"), {
    name: "FinalDecisionConflictError"
  });

  assert.equal(repository.isEncryptedAtRest(), true);

  const conflictError = new FinalDecisionConflictError();
  const readFailureError = new FinalDecisionReadFailureError();
  assert.equal(conflictError.name, "FinalDecisionConflictError");
  assert.equal(readFailureError.name, "FinalDecisionReadFailureError");
});

test("service branches: read failure fallback, conflict mapping, generic write failure mapping", async () => {
  const auditRepository = new FinalDecisionAuditRepository();
  const baseDeps = {
    completionGate: new DecisionCompletionGate(),
    immutabilityGuard: new DecisionImmutabilityGuard(),
    auditLogger: new DecisionAuditLogger({ repository: auditRepository }),
    authorNotifier: new DecisionAuthorNotifier()
  };

  const readFailureService = new PostFinalDecisionService({
    repository: {
      async withPaperDecisionLock(_paperId, operation) {
        return operation();
      },
      async getDecisionCompletionStatus() {
        throw new Error("read failed");
      },
      async getFinalDecision() {
        return null;
      },
      async recordFinalDecision() {
        throw new Error("unreachable");
      }
    },
    ...baseDeps
  });

  const unavailableOnReadFailure = await readFailureService.execute({
    editorUserId: "editor-1",
    paperId: "paper-1",
    decision: "ACCEPT",
    requestId: "req-read-fail"
  });
  assert.equal(unavailableOnReadFailure.outcome, "UNAVAILABLE_DENIED");
  assert.equal(unavailableOnReadFailure.statusCode, 404);

  const conflictService = new PostFinalDecisionService({
    repository: {
      async withPaperDecisionLock(_paperId, operation) {
        return operation();
      },
      async getDecisionCompletionStatus() {
        return buildCompletionStatus();
      },
      async getFinalDecision() {
        return null;
      },
      async recordFinalDecision() {
        throw new FinalDecisionConflictError("duplicate");
      }
    },
    ...baseDeps
  });

  const finalized = await conflictService.execute({
    editorUserId: "editor-1",
    paperId: "paper-1",
    decision: "REJECT",
    requestId: "req-conflict"
  });
  assert.equal(finalized.outcome, "DECISION_FINALIZED");

  const writeFailureService = new PostFinalDecisionService({
    repository: {
      async withPaperDecisionLock(_paperId, operation) {
        return operation();
      },
      async getDecisionCompletionStatus() {
        return buildCompletionStatus();
      },
      async getFinalDecision() {
        return null;
      },
      async recordFinalDecision() {
        throw new Error("write failed");
      }
    },
    ...baseDeps
  });

  const unavailableOnWriteFailure = await writeFailureService.execute({
    editorUserId: "editor-1",
    paperId: "paper-1",
    decision: "ACCEPT",
    requestId: "req-write-fail"
  });
  assert.equal(unavailableOnWriteFailure.outcome, "UNAVAILABLE_DENIED");
  assert.equal(unavailableOnWriteFailure.statusCode, 403);

  const nonErrorWriteFailureService = new PostFinalDecisionService({
    repository: {
      async withPaperDecisionLock(_paperId, operation) {
        return operation();
      },
      async getDecisionCompletionStatus() {
        return buildCompletionStatus();
      },
      async getFinalDecision() {
        return null;
      },
      async recordFinalDecision() {
        throw "write-failed-with-string";
      }
    },
    ...baseDeps
  });

  const unavailableOnNonErrorWriteFailure = await nonErrorWriteFailureService.execute({
    editorUserId: "editor-1",
    paperId: "paper-1",
    decision: "ACCEPT",
    requestId: "req-write-fail-non-error"
  });
  assert.equal(unavailableOnNonErrorWriteFailure.outcome, "UNAVAILABLE_DENIED");
  assert.equal(unavailableOnNonErrorWriteFailure.statusCode, 403);
});

test("service rethrows unexpected immutability guard errors", async () => {
  class UnexpectedImmutabilityGuard {
    ensureNotFinalized(): void {
      throw new TypeError("unexpected-immutability-failure");
    }
  }

  const service = new PostFinalDecisionService({
    repository: {
      async withPaperDecisionLock<T>(_paperId: string, operation: () => Promise<T>): Promise<T> {
        return operation();
      },
      async getDecisionCompletionStatus() {
        return buildCompletionStatus();
      },
      async getFinalDecision() {
        return null;
      },
      async recordFinalDecision() {
        return {
          paperId: "paper-1",
          decision: "ACCEPT" as const,
          decidedByEditorId: "editor-1",
          decidedAt: new Date(),
          isFinal: true as const
        };
      }
    } satisfies Pick<
      FinalDecisionRepository,
      "withPaperDecisionLock" | "getDecisionCompletionStatus" | "getFinalDecision" | "recordFinalDecision"
    >,
    completionGate: new DecisionCompletionGate(),
    immutabilityGuard: new UnexpectedImmutabilityGuard() as unknown as DecisionImmutabilityGuard,
    auditLogger: new DecisionAuditLogger({ repository: new FinalDecisionAuditRepository() }),
    authorNotifier: new DecisionAuthorNotifier()
  });

  await assert.rejects(
    () =>
      service.execute({
        editorUserId: "editor-1",
        paperId: "paper-1",
        decision: "ACCEPT",
        requestId: "req-immutability"
      }),
    {
      name: "TypeError",
      message: "unexpected-immutability-failure"
    }
  );
});

test("error mapper covers all outcome branches and schemas", () => {
  const expired = buildFinalDecisionSessionExpiredResponse();
  assert.equal(expired.statusCode, 401);
  assert.equal(FinalDecisionErrorResponseSchema.safeParse(expired.body).success, true);

  const recorded = mapPostFinalDecisionOutcome({
    outcome: "DECISION_RECORDED",
    statusCode: 200,
    outcomeCode: "DECISION_RECORDED",
    paperId: "paper-1",
    decision: "ACCEPT",
    decidedAt: "2026-03-02T00:00:00.000Z",
    notificationStatus: "NOTIFIED",
    message: "ok"
  });
  assert.equal(recorded.statusCode, 200);
  assert.equal(DecisionRecordedResponseSchema.safeParse(recorded.body).success, true);

  const pending = mapPostFinalDecisionOutcome({
    outcome: "REVIEWS_PENDING",
    statusCode: 409,
    outcomeCode: "REVIEWS_PENDING",
    message: "pending",
    completedReviewCount: 1,
    requiredReviewCount: 2
  });
  assert.equal(pending.statusCode, 409);
  assert.equal(DecisionBlockedResponseSchema.safeParse(pending.body).success, true);

  const finalized = mapPostFinalDecisionOutcome({
    outcome: "DECISION_FINALIZED",
    statusCode: 409,
    outcomeCode: "DECISION_FINALIZED",
    message: "already-final"
  });
  assert.equal(finalized.statusCode, 409);
  assert.equal(DecisionBlockedResponseSchema.safeParse(finalized.body).success, true);

  const denied = mapPostFinalDecisionOutcome({
    outcome: "UNAVAILABLE_DENIED",
    statusCode: 404,
    outcomeCode: "UNAVAILABLE_DENIED",
    message: "denied"
  });
  assert.equal(denied.statusCode, 404);
  assert.equal(FinalDecisionErrorResponseSchema.safeParse(denied.body).success, true);

  const fallback = mapPostFinalDecisionOutcome({ outcome: "UNKNOWN" } as never);
  assert.equal(fallback.statusCode, 404);
});

test("handler covers missing session, non-editor, and default ACCEPT decision mapping", async () => {
  const calls: Array<{ decision: "ACCEPT" | "REJECT" }> = [];
  const handler = createPostFinalDecisionHandler({
    service: {
      async execute(input) {
        calls.push({ decision: input.decision });
        return {
          outcome: "DECISION_RECORDED" as const,
          statusCode: 200 as const,
          outcomeCode: "DECISION_RECORDED" as const,
          paperId: input.paperId,
          decision: input.decision,
          decidedAt: "2026-03-02T00:00:00.000Z",
          notificationStatus: "NOTIFIED" as const,
          message: "ok"
        };
      }
    }
  });

  const noSessionReply = createReplyDouble();
  await handler(
    {
      id: "req-1",
      params: { paperId: "paper-1" },
      body: { decision: "REJECT" }
    } as never,
    noSessionReply as never
  );
  assert.equal(noSessionReply.statusCode, 401);

  const nonEditorReply = createReplyDouble();
  await handler(
    {
      id: "req-2",
      params: { paperId: "paper-1" },
      finalDecisionSession: {
        userId: "user-1",
        sessionId: "session-1",
        role: "AUTHOR"
      },
      body: { decision: "REJECT" }
    } as never,
    nonEditorReply as never
  );
  assert.equal(nonEditorReply.statusCode, 403);

  const editorReply = createReplyDouble();
  await handler(
    {
      id: "req-3",
      params: { paperId: "paper-1" },
      finalDecisionSession: {
        userId: "editor-1",
        sessionId: "session-1",
        role: "EDITOR"
      },
      body: { decision: "INVALID" }
    } as never,
    editorReply as never
  );

  assert.equal(editorReply.statusCode, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.decision, "ACCEPT");
});

test("route security and final-decision session guard branches are covered", async () => {
  const tlsRejectReply = createReplyDouble();
  await requireFinalDecisionTransportSecurity(
    {
      headers: {
        "x-forwarded-proto": "http"
      }
    } as never,
    tlsRejectReply as never
  );
  assert.equal(tlsRejectReply.statusCode, 426);

  const tlsPassReply = createReplyDouble();
  await requireFinalDecisionTransportSecurity(
    {
      headers: {
        "x-forwarded-proto": "https"
      }
    } as never,
    tlsPassReply as never
  );
  assert.equal(tlsPassReply.statusCode, 200);

  const sessionRepository: FinalDecisionSessionRepository = {
    async getSessionById(sessionId: string): Promise<FinalDecisionSessionRecord | null> {
      if (sessionId === "active") {
        return {
          sessionId,
          accountId: "editor-1",
          role: "EDITOR",
          status: "ACTIVE"
        };
      }

      if (sessionId === "revoked") {
        return {
          sessionId,
          accountId: "editor-1",
          role: "EDITOR",
          status: "REVOKED"
        };
      }

      return null;
    }
  };

  const guard = createFinalDecisionSessionGuard({ sessionRepository });

  const missingReply = createReplyDouble();
  await guard({ headers: {} } as never, missingReply as never);
  assert.equal(missingReply.statusCode, 401);

  const revokedReply = createReplyDouble();
  await guard({ headers: { cookie: "session=revoked" } } as never, revokedReply as never);
  assert.equal(revokedReply.statusCode, 401);

  const activeReply = createReplyDouble();
  const activeRequest = { headers: { cookie: "cms_session=active" } } as unknown as any;
  await guard(activeRequest, activeReply as never);
  assert.equal(activeReply.statusCode, 200);
  assert.equal(activeRequest.finalDecisionSession?.role, "EDITOR");

  const registered = createFinalDecisionRoutes({
    service: {
      async execute() {
        return {
          outcome: "UNAVAILABLE_DENIED" as const,
          statusCode: 404 as const,
          outcomeCode: "UNAVAILABLE_DENIED" as const,
          message: "denied"
        };
      }
    },
    finalDecisionSessionGuard: async () => {
      // no-op
    }
  });

  assert.equal(typeof registered, "function");
});

test("markers and constants remain stable", () => {
  assert.equal(FINAL_DECISION_OUTCOMES.DECISION_RECORDED, "DECISION_RECORDED");
  assert.equal(
    FINAL_DECISION_REASON_CODES.PENDING_REQUIRED_REVIEWS,
    "pending-required-reviews"
  );

  const finalizedError = new DecisionFinalizedError();
  assert.equal(finalizedError.reasonCode, "decision-already-finalized");

  assert.equal(FINAL_DECISION_PORTS_MARKER, "final_decision_ports_marker");
  assert.equal(
    FINAL_DECISION_PRISMA_REPOSITORY_MARKER,
    "final_decision_prisma_repository_marker"
  );
  assert.equal(
    FINAL_DECISION_AUDIT_REPOSITORY_MARKER,
    "final_decision_audit_repository_marker"
  );
  assert.equal(FINAL_DECISION_AUDIT_LOGGER_MARKER, "final_decision_audit_logger_marker");
  assert.equal(
    FINAL_DECISION_AUTHOR_NOTIFIER_MARKER,
    "final_decision_author_notifier_marker"
  );
});
