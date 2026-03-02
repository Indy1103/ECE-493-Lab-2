import assert from "node:assert/strict";
import test from "node:test";

import { AuthorDecisionAuditLogger } from "../../src/business/author-decision/audit-logger.js";
import {
  AUTHOR_DECISION_OUTCOMES,
  AUTHOR_DECISION_REASON_CODES
} from "../../src/business/author-decision/decision-outcome.js";
import { GetAuthorDecisionService } from "../../src/business/author-decision/get-author-decision.service.js";
import { AuthorDecisionNotificationStatusReader } from "../../src/business/author-decision/notification-status.js";
import { AuthorDecisionOwnershipCheck } from "../../src/business/author-decision/ownership-check.js";
import {
  AUTHOR_DECISION_PORTS_MARKER,
  type AuthorDecisionAuditEvent,
  type AuthorDecisionAuditRepository as AuthorDecisionAuditRepositoryPort
} from "../../src/business/author-decision/ports.js";
import {
  AuthorDecisionAuditRepository,
  AUTHOR_DECISION_AUDIT_REPOSITORY_MARKER,
  AUTHOR_DECISION_PRISMA_REPOSITORY_MARKER,
  PrismaAuthorDecisionRepository
} from "../../src/data/author-decision/author-decision.repository.js";
import {
  AuthorDecisionErrorResponseSchema,
  DecisionAvailableResponseSchema,
  NotificationFailedResponseSchema,
  buildAuthorDecisionSessionExpiredResponse,
  mapGetAuthorDecisionOutcome
} from "../../src/presentation/author-decision/error-mapper.js";
import { createGetAuthorDecisionHandler } from "../../src/presentation/author-decision/get-author-decision.handler.js";
import {
  createAuthorDecisionRoutes,
  requireAuthorDecisionTransportSecurity
} from "../../src/presentation/author-decision/routes.js";
import {
  createAuthorDecisionSessionGuard,
  type AuthorDecisionSessionRecord,
  type AuthorDecisionSessionRepository
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

test("ownership and notification helpers cover true/false branches", () => {
  const ownershipCheck = new AuthorDecisionOwnershipCheck();
  const notificationStatusReader = new AuthorDecisionNotificationStatusReader();

  assert.equal(ownershipCheck.isOwner(null, "author-1"), false);
  assert.equal(
    ownershipCheck.isOwner(
      {
        paperId: "paper-1",
        authorId: "author-2",
        decision: "ACCEPT",
        notificationStatus: "DELIVERED"
      },
      "author-1"
    ),
    false
  );
  assert.equal(
    ownershipCheck.isOwner(
      {
        paperId: "paper-1",
        authorId: "author-1",
        decision: "ACCEPT",
        notificationStatus: "DELIVERED"
      },
      "author-1"
    ),
    true
  );

  const unavailable = notificationStatusReader.evaluate({
    paperId: "paper-1",
    authorId: "author-1",
    decision: "REJECT",
    notificationStatus: "FAILED"
  });
  assert.equal(unavailable.available, false);

  const available = notificationStatusReader.evaluate({
    paperId: "paper-1",
    authorId: "author-1",
    decision: "ACCEPT",
    notificationStatus: "DELIVERED"
  });
  assert.equal(available.available, true);
  if (available.available) {
    assert.equal(available.decision, "ACCEPT");
  }
});

test("audit logger and repositories sanitize metadata, clone records, and expose markers", async () => {
  const emitted: AuthorDecisionAuditEvent[] = [];
  const repository = new AuthorDecisionAuditRepository({
    nowProvider: () => new Date("2026-03-02T00:00:00.000Z"),
    emit: (event) => emitted.push(event)
  });

  const logger = new AuthorDecisionAuditLogger({ repository });

  await logger.record({
    actorUserId: "author-1",
    paperId: "paper-1",
    outcome: "DECISION_AVAILABLE",
    reasonCode: AUTHOR_DECISION_REASON_CODES.DECISION_VISIBLE,
    metadata: {
      authorId: "secret-author",
      decision: "ACCEPT",
      keep: true
    }
  });

  await repository.record({
    actorUserId: "author-2",
    paperId: "paper-2",
    outcome: "UNAVAILABLE_DENIED",
    reasonCode: AUTHOR_DECISION_REASON_CODES.PAPER_NOT_FOUND_OR_DENIED,
    metadata: {
      authorId: "secret-author-2",
      decision: "REJECT"
    }
  });

  const listed = repository.list();
  assert.equal(listed.length, 2);
  assert.equal(listed[0]?.metadata.decision, "[REDACTED]");
  assert.equal("authorId" in (listed[0]?.metadata ?? {}), false);
  assert.equal(listed[0]?.metadata.keep, true);
  assert.equal(listed[1]?.metadata.decision, "[REDACTED]");
  assert.equal("authorId" in (listed[1]?.metadata ?? {}), false);
  assert.equal(emitted.length, 2);
  assert.equal(repository.isEncryptedAtRest(), true);

  listed[0]!.metadata.keep = false;
  assert.equal(repository.list()[0]?.metadata.keep, true);

  const decisionRepo = new PrismaAuthorDecisionRepository();
  decisionRepo.seedDecisionRecord({
    paperId: "paper-1",
    authorId: "author-1",
    decision: "ACCEPT",
    notificationStatus: "DELIVERED"
  });
  decisionRepo.seedPaperWithoutDecision({
    paperId: "paper-2",
    authorId: "author-1"
  });

  const found = await decisionRepo.getAuthorDecision("paper-1", "author-1");
  assert.equal(found?.decision, "ACCEPT");

  const wrongAuthor = await decisionRepo.getAuthorDecision("paper-1", "author-2");
  assert.equal(wrongAuthor, null);

  const noDecision = await decisionRepo.getAuthorDecision("paper-2", "author-1");
  assert.equal(noDecision, null);
  assert.equal(decisionRepo.isEncryptedAtRest(), true);

  assert.equal(AUTHOR_DECISION_PORTS_MARKER, "author_decision_ports_marker");
  assert.equal(
    AUTHOR_DECISION_PRISMA_REPOSITORY_MARKER,
    "author_decision_prisma_repository_marker"
  );
  assert.equal(
    AUTHOR_DECISION_AUDIT_REPOSITORY_MARKER,
    "author_decision_audit_repository_marker"
  );
});

test("service returns unavailable, notification-failed, and available outcomes with audit records", async () => {
  const recorded: Array<{ outcome: string; reasonCode: string }> = [];
  const auditLogger = {
    async record(event: { outcome: string; reasonCode: string }) {
      recorded.push({ outcome: event.outcome, reasonCode: event.reasonCode });
    }
  };

  const service = new GetAuthorDecisionService({
    repository: {
      async getAuthorDecision(paperId: string) {
        if (paperId === "missing-paper") {
          return null;
        }

        if (paperId === "failed-paper") {
          return {
            paperId,
            authorId: "author-1",
            decision: "REJECT" as const,
            notificationStatus: "FAILED" as const
          };
        }

        return {
          paperId,
          authorId: "author-1",
          decision: "ACCEPT" as const,
          notificationStatus: "DELIVERED" as const
        };
      }
    },
    ownershipCheck: new AuthorDecisionOwnershipCheck(),
    notificationStatusReader: new AuthorDecisionNotificationStatusReader(),
    auditLogger: auditLogger as AuthorDecisionAuditLogger
  });

  const unavailable = await service.execute({
    authorUserId: "author-1",
    paperId: "missing-paper",
    requestId: "req-1"
  });
  assert.equal(unavailable.outcome, "UNAVAILABLE_DENIED");
  assert.equal(unavailable.statusCode, 404);

  const notificationFailed = await service.execute({
    authorUserId: "author-1",
    paperId: "failed-paper",
    requestId: "req-2"
  });
  assert.equal(notificationFailed.outcome, "NOTIFICATION_FAILED");
  assert.equal(notificationFailed.statusCode, 409);

  const available = await service.execute({
    authorUserId: "author-1",
    paperId: "ok-paper",
    requestId: "req-3"
  });
  assert.equal(available.outcome, "DECISION_AVAILABLE");
  assert.equal(available.statusCode, 200);

  assert.deepEqual(
    recorded.map((entry) => entry.outcome),
    ["UNAVAILABLE_DENIED", "NOTIFICATION_FAILED", "DECISION_AVAILABLE"]
  );
});

test("error mapping covers all branches including default fallback", () => {
  const available = mapGetAuthorDecisionOutcome({
    outcome: "DECISION_AVAILABLE",
    statusCode: 200,
    outcomeCode: "DECISION_AVAILABLE",
    paperId: "paper-1",
    decision: "ACCEPT"
  });
  assert.equal(available.statusCode, 200);
  assert.equal(DecisionAvailableResponseSchema.safeParse(available.body).success, true);

  const notificationFailed = mapGetAuthorDecisionOutcome({
    outcome: "NOTIFICATION_FAILED",
    statusCode: 409,
    outcomeCode: "NOTIFICATION_FAILED",
    message: "failed"
  });
  assert.equal(notificationFailed.statusCode, 409);
  assert.equal(NotificationFailedResponseSchema.safeParse(notificationFailed.body).success, true);

  const denied = mapGetAuthorDecisionOutcome({
    outcome: "UNAVAILABLE_DENIED",
    statusCode: 403,
    outcomeCode: "UNAVAILABLE_DENIED",
    message: "denied"
  });
  assert.equal(denied.statusCode, 403);
  assert.equal(AuthorDecisionErrorResponseSchema.safeParse(denied.body).success, true);

  const fallback = mapGetAuthorDecisionOutcome({ outcome: "UNKNOWN" } as never);
  assert.equal(fallback.statusCode, 404);
  assert.equal((fallback.body as { outcome: string }).outcome, "UNAVAILABLE_DENIED");

  const expired = buildAuthorDecisionSessionExpiredResponse();
  assert.equal(expired.statusCode, 401);
  assert.equal(
    (expired.body as { outcome: string }).outcome,
    AUTHOR_DECISION_OUTCOMES.SESSION_EXPIRED
  );
});

test("handler and route helpers cover session, role, transport, and registration branches", async () => {
  const handler = createGetAuthorDecisionHandler({
    service: {
      async execute() {
        return {
          outcome: "DECISION_AVAILABLE" as const,
          statusCode: 200 as const,
          outcomeCode: "DECISION_AVAILABLE" as const,
          paperId: "paper-1",
          decision: "REJECT" as const
        };
      }
    }
  });

  const noSessionReply = createReplyDouble();
  await handler(
    {
      id: "req-1",
      params: { paperId: "paper-1" }
    } as never,
    noSessionReply as never
  );
  assert.equal(noSessionReply.statusCode, 401);

  const wrongRoleReply = createReplyDouble();
  await handler(
    {
      id: "req-2",
      params: { paperId: "paper-1" },
      authorDecisionSession: {
        userId: "author-1",
        sessionId: "session-1",
        role: "EDITOR"
      }
    } as never,
    wrongRoleReply as never
  );
  assert.equal(wrongRoleReply.statusCode, 403);

  const okReply = createReplyDouble();
  await handler(
    {
      id: "req-3",
      params: { paperId: "paper-1" },
      authorDecisionSession: {
        userId: "author-1",
        sessionId: "session-1",
        role: "AUTHOR"
      }
    } as never,
    okReply as never
  );
  assert.equal(okReply.statusCode, 200);

  const insecureReply = createReplyDouble();
  await requireAuthorDecisionTransportSecurity(
    { headers: {} },
    insecureReply as never
  );
  assert.equal(insecureReply.statusCode, 426);

  const secureReply = createReplyDouble();
  await requireAuthorDecisionTransportSecurity(
    { headers: { "x-forwarded-proto": "https" } },
    secureReply as never
  );
  assert.equal(secureReply.payload, undefined);

  const routes = createAuthorDecisionRoutes({
    service: { execute: async () => ({ outcome: "UNAVAILABLE_DENIED" } as never) },
    authorDecisionSessionGuard: async () => {}
  });

  const registrations: Array<{
    method: string;
    path: string;
    preHandlerCount: number;
  }> = [];

  await routes(
    {
      get(
        path: string,
        options: { preHandler: unknown[] },
        _handler: (...args: unknown[]) => unknown
      ) {
        registrations.push({
          method: "GET",
          path,
          preHandlerCount: options.preHandler.length
        });
      }
    } as never,
    {} as never
  );

  assert.deepEqual(registrations, [
    {
      method: "GET",
      path: "/api/author/papers/:paperId/decision",
      preHandlerCount: 2
    }
  ]);
});

test("author decision session guard covers missing/invalid/valid session branches", async () => {
  class SessionRepository implements AuthorDecisionSessionRepository {
    constructor(private readonly record: AuthorDecisionSessionRecord | null) {}
    async getSessionById() {
      return this.record;
    }
  }

  const noCookieGuard = createAuthorDecisionSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s1",
      accountId: "author-1",
      role: "AUTHOR",
      status: "ACTIVE"
    })
  });

  const noCookieReply = createReplyDouble();
  const noCookieRequest = { headers: {} } as never;
  await noCookieGuard(noCookieRequest, noCookieReply as never);
  assert.equal(noCookieReply.statusCode, 401);
  assert.equal(
    (noCookieReply.payload as { outcome: string }).outcome,
    AUTHOR_DECISION_OUTCOMES.SESSION_EXPIRED
  );

  const invalidGuard = createAuthorDecisionSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s1",
      accountId: "author-1",
      role: "AUTHOR",
      status: "EXPIRED"
    })
  });

  const invalidReply = createReplyDouble();
  const invalidRequest = { headers: { cookie: "session=s1" } } as never;
  await invalidGuard(invalidRequest, invalidReply as never);
  assert.equal(invalidReply.statusCode, 401);

  const validGuard = createAuthorDecisionSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s1",
      accountId: "author-1",
      role: "AUTHOR",
      status: "ACTIVE"
    })
  });

  const validReply = createReplyDouble();
  const validRequest = { headers: { cookie: "session=s1" } } as never;
  await validGuard(validRequest, validReply as never);
  assert.equal(validReply.payload, undefined);
  assert.deepEqual((validRequest as any).authorDecisionSession, {
    userId: "author-1",
    sessionId: "s1",
    role: "AUTHOR"
  });

  const cmsCookieGuard = createAuthorDecisionSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s2",
      accountId: "author-2",
      role: "AUTHOR",
      status: "ACTIVE"
    })
  });

  const cmsCookieRequest = { headers: { cookie: "cms_session=s2" } } as never;
  await cmsCookieGuard(cmsCookieRequest, createReplyDouble() as never);
  assert.equal((cmsCookieRequest as any).authorDecisionSession.sessionId, "s2");
});

test("outcome constants include expected values", () => {
  assert.equal(AUTHOR_DECISION_OUTCOMES.DECISION_AVAILABLE, "DECISION_AVAILABLE");
  assert.equal(AUTHOR_DECISION_OUTCOMES.NOTIFICATION_FAILED, "NOTIFICATION_FAILED");
  assert.equal(AUTHOR_DECISION_OUTCOMES.UNAVAILABLE_DENIED, "UNAVAILABLE_DENIED");
  assert.equal(AUTHOR_DECISION_OUTCOMES.SESSION_EXPIRED, "SESSION_EXPIRED");
  assert.equal(AUTHOR_DECISION_REASON_CODES.NON_AUTHOR_ROLE, "non-author-role");
  assert.equal(AUTHOR_DECISION_REASON_CODES.SESSION_INVALID, "session-invalid");
});

test("audit logger supports repository port shape", async () => {
  class InMemoryAuditPort implements AuthorDecisionAuditRepositoryPort {
    public readonly events: Array<Record<string, unknown>> = [];
    async record(event: any): Promise<void> {
      this.events.push(event);
    }
  }

  const port = new InMemoryAuditPort();
  const logger = new AuthorDecisionAuditLogger({ repository: port });

  await logger.record({
    actorUserId: "author-1",
    paperId: "paper-1",
    outcome: "SESSION_EXPIRED",
    reasonCode: AUTHOR_DECISION_REASON_CODES.SESSION_INVALID
  });

  assert.equal(port.events.length, 1);
  assert.deepEqual(port.events[0]?.metadata, {});
});
